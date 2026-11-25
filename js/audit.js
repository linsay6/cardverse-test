import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

const AuditCardModule = {
  // ==========【1.数据模型】==========
  /**
   * 三大字卡分类
   * system：系统预设，代码写死，不允许持久化修改
   * custom：自定义字卡，localStorage保存
   * auditReport：审核报告字卡，localStorage保存
   */
  cardGroups: {
    custom: {
      name: "自定义字卡",
      list: []
    },
    system: {
      name: "系统预设字卡",
      list: [
        { id: 1, title: "温柔提示", content: "我一直在，慢慢来就好。", side: "bot", isDisabled: false },
        { id: 2, title: "简短回应", content: "我看到你的心意了。", side: "bot", isDisabled: false }
      ]
    },
    auditReport: {
      name: "审核报告字卡",
      list: []
    }
  },

  /** 待审申请队列 pendingApply */
  pendingApply: [],

  /** 审批历史记录 auditHistory，最多保留100条 */
  auditHistory: [],

  /** 审核模块全局配置：悬浮球、引擎、通知、debug */
  auditConfig: {
    // 悬浮球配置
    floatBall: {
      enable: true,
      size: 48,
      color: "#7c68ee",
      avatarBase64: "",
      posX: null,
      posY: null
    },
    // 梦角拟人引擎开关&参数
    dreamEngine: {
      enableGrabChat: true,      // 抓取聊天开关
      enableChaos: true,         // 混沌随机变更开关
      enableActiveSend: true,    // 主动发消息开关
      scanIntervalSec: 1800,     // 巡检周期30分钟
      baseProb: 0.05,            // 基础触发概率5%
      emotionProb: 0.30,         // 情绪命中后概率30%
      chaosProb: 0.02,           // 混沌操作概率2%
      pendingMax: 20,            // pending队列最大条数
      applyCoolDownMs: 60000     // 单条申请60秒冷却
    },
    // 浏览器通知
    notification: {
      enable: true,
      permissionDenied: false
    },
    debug: false
  },

  /** 引擎并发锁，防止定时器重入 */
  engineRunning: false,

  /** 情绪关键词列表，用于聊天抓取加权 */
  emotionWords: ["喜欢", "爱", "想你", "开心"],

  // ==========【2.持久化：加载/保存】==========
  loadFromStorage() {
    const raw = localStorage.getItem("mochi_audit_v2");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      // system系统预设永远不从存储读取，保护内置卡
      this.cardGroups.custom.list = data?.customCards ?? [];
      this.cardGroups.auditReport.list = data?.auditReportCards ?? [];
      this.pendingApply = data?.pendingApply ?? [];
      this.auditHistory = data?.auditHistory ?? [];
      this.auditConfig = { ...this.auditConfig, ...(data?.auditConfig ?? {}) };
    } catch (e) {
      console.warn("audit读取本地存储失败", e);
    }
  },

  saveToStorage() {
    const payload = {
      customCards: this.cardGroups.custom.list,
      auditReportCards: this.cardGroups.auditReport.list,
      pendingApply: this.pendingApply,
      auditHistory: this.auditHistory,
      auditConfig: this.auditConfig
    };
    localStorage.setItem("mochi_audit_v2", JSON.stringify(payload));
    // ✅数据变更，向外广播事件（给桌面角标、UI面板监听）
    EventBus.emit("my‑audit‑data‑updated", {
      pendingCount: this.pendingApply.length
    });
  },

  // ==========【3.字卡基础操作】==========
  /** 获取指定分组全部启用的卡片，过滤isDisabled=true */
  getEnabledCardList(groupKey) {
    const g = this.cardGroups[groupKey];
    if (!g) return [];
    return g.list.filter(item => !item.isDisabled);
  },

  /** 随机抽一张指定分组启用的卡片 */
  drawRandomCard(groupKey = "auditReport") {
    const list = this.getEnabledCardList(groupKey);
    if (list.length === 0) {
      Toast.show("该分类暂无可用字卡");
      return null;
    }
    const idx = Math.floor(Math.random() * list.length);
    return list[idx];
  },

  /** 发送卡片到聊天，依赖全局window.sendAuditCard */
  sendCardToChat(card) {
    if (!window.sendAuditCard) {
      Toast.show("聊天注入接口未就绪");
      return false;
    }
    window.sendAuditCard(card.content, card.side);
    return true;
  },

  drawAndSend(groupKey = "auditReport") {
    const card = this.drawRandomCard(groupKey);
    if (card) this.sendCardToChat(card);
    return card;
  },

  /** 添加字卡到指定分组，system分组禁止写入 */
  addCard(groupKey, cardItem) {
    if (groupKey === "system") {
      Toast.show("系统预设分组不可修改");
      return false;
    }
    const g = this.cardGroups[groupKey];
    if (!g) return false;
    const newCard = {
      id: Date.now(),
      title: cardItem.title || "字卡",
      content: cardItem.content,
      side: cardItem.side ?? "bot",
      isDisabled: cardItem.isDisabled ?? false
    };
    g.list.push(newCard);
    this.saveToStorage();
    return newCard;
  },

  // ==========【4.pending待审申请业务】==========
  /**
   * 生成一条待审申请
   * @param {string} action add / delete / disable / move / restore
   * @param {object} payload 申请内容
   * @param {string} applicant 申请人昵称："我" / 梦角昵称
   */
  createPendingApply(action, payload, applicant) {
    // 队列已满直接拒绝生成申请
    if (this.pendingApply.length >= this.auditConfig.dreamEngine.pendingMax) {
      if (this.auditConfig.debug) console.log("pending队列已满，放弃生成申请");
      return null;
    }
    const now = Date.now();
    // 60秒冷却：相同action+文本短时间重复拦截
    const isCool = this.pendingApply.some(ap =>
      ap.action === action &&
      ap.cardText === payload.cardText &&
      (now - ap.lastApplyTime) < this.auditConfig.dreamEngine.applyCoolDownMs
    );
    if (isCool) return null;

    const applyItem = {
      applyId: String(now),
      action,
      cardText: payload.cardText ?? "",
      sourceGroupId: payload.sourceGroupId ?? "",
      targetGroupId: payload.targetGroupId ?? "",
      applicant,
      lastApplyTime: now,
      remark: ""
    };
    this.pendingApply.push(applyItem);
    this.saveToStorage();
    return applyItem;
  },

  /** 单条审批：agree / reject */
  approveApply(applyId, result, remark = "") {
    const idx = this.pendingApply.findIndex(p => p.applyId === applyId);
    if (idx === -1) return false;
    const item = this.pendingApply[idx];

    // --------这里未来UI层审批后，在此处执行add/delete/disable/move/restore真实变更--------
    // 当前数据层只做：移入历史档案，pending移除；真实字卡操作留给后续UI扩展
    const historyRecord = {
      action: item.action,
      cardText: item.cardText,
      applicant: item.applicant,
      applyTime: item.lastApplyTime,
      auditFinishTime: Date.now(),
      auditResult: result,
      auditRemark: remark
    };
    this.auditHistory.unshift(historyRecord);
    // 历史最多保留100条，裁剪旧数据
    if (this.auditHistory.length > 100) {
      this.auditHistory = this.auditHistory.slice(0, 100);
    }
    this.pendingApply.splice(idx, 1);
    this.saveToStorage();
    return true;
  },

  // ==========【5.梦角拟人引擎纯数据逻辑（无UI，定时器业务）】==========
  /**
   * 抓取聊天消息，输入聊天消息数组（来自ChatModule.messageList）
   * @param {Array} chatMsgList 聊天全部消息
   */
  scanChatAndGenApply(chatMsgList) {
    const cfg = this.auditConfig.dreamEngine;
    if (!cfg.enableGrabChat) return;
    if (this.engineRunning) return;

    const now = Date.now();
    // 只取15分钟以内，role=user我方发言
    const fifteenMin = 15 * 60 * 1000;
    const userRecentMsg = chatMsgList.filter(m => {
      return m.role === "user"
        && (now - m.time) < fifteenMin
        && m.content.length >= 5
        && m.content.length <= 35;
    });
    if (userRecentMsg.length === 0) return;

    // 取最新一条我方消息
    const latestUserMsg = userRecentMsg[userRecentMsg.length - 1];
    let prob = cfg.baseProb;
    // 命中情绪词提升概率
    const hitEmotion = this.emotionWords.some(w => latestUserMsg.content.includes(w));
    if (hitEmotion) prob = cfg.emotionProb;

    const rand = Math.random();
    if (rand < prob) {
      // 生成add新增卡片待审申请，申请人标记为梦角（后续传入当前梦角nick）
      this.createPendingApply("add", { cardText: latestUserMsg.content }, "梦角");
    }
  },

  /** 混沌操作分支：delete / disable / move 三选一 */
  runChaosOperate() {
    const cfg = this.auditConfig.dreamEngine;
    if (!cfg.enableChaos) return;
    if (Math.random() > cfg.chaosProb) return;
    // 仅示例数据层：只生成pending申请，不直接修改卡
    const ops = ["delete", "disable", "move"];
    const pickOp = ops[Math.floor(Math.random() * ops.length)];
    this.createPendingApply(pickOp, { cardText: "" }, "梦角");
  },

  /** 主动发消息分支：抽卡调用sendAuditCard */
  runActiveSend() {
    const cfg = this.auditConfig.dreamEngine;
    if (!cfg.enableActiveSend) return;
    const card = this.drawRandomCard("auditReport");
    if (card) this.sendCardToChat(card);
  },

  /** 引擎单次完整执行入口，加并发锁 */
  async engineTick(chatMsgList) {
    if (this.engineRunning) return;
    this.engineRunning = true;
    try {
      this.scanChatAndGenApply(chatMsgList);
      this.runChaosOperate();
      this.runActiveSend();
    } finally {
      this.engineRunning = false;
    }
  },

  // ==========【模块初始化】==========
  init() {
    this.loadFromStorage();
    console.log("AuditCardModule 数据层初始化完成");
  }
};

// 挂载全局，控制台调试使用
window.AuditCardModule = AuditCardModule;
AuditCardModule.init();

export { AuditCardModule };
