import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

const AuditCardModule = {
        cardGroups: {
        custom: {
  name: "自定义字卡",
  subgroups: [
    { subgroupId:"custom-global", name:"公用字卡", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"custom-contact", name:"专属字卡", scope:"contact", isGroupDisabled:false, list:[] },
    { subgroupId:"custom-fun-global", name:"其他互动功能字卡·公用", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"custom-fun-contact", name:"其他互动功能字卡·专属", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"custom-trace", name:"寻踪日常·我的添加", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"custom-love-words", name:"今日情话·我的添加", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"custom-ask-open", name:"TA的询问·我的添加", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"custom-ask-choice", name:"TA的小问题·我的添加", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"custom-curious", name:"TA的好奇·我的添加", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"custom-complain", name:"TA的吐槽·我的添加", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"custom-check", name:"TA的查岗·我的添加", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"custom-invite", name:"TA的邀请·我的添加", scope:"global", isGroupDisabled:false, list:[] }
  ],
  list: []
},
system: {
  name: "系统预设字卡",
  subgroups: [
    { subgroupId:"sys-chat-default", name:"默认聊天字卡", scope:"global", isGroupDisabled:false, list:[
      { id: "sys-1", title: "温柔提示", content: "我一直在，慢慢来就好。", side: "bot", isDisabled: false },
      { id: "sys-2", title: "简短回应", content: "我看到你的心意了。", side: "bot", isDisabled: false }
    ]},
    { subgroupId:"sys-chat-dict", name:"聊天默认字卡·词典", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-fun", name:"其他互动功能字卡", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-cross-check", name:"联系人跨桌面查岗", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-emotion", name:"聊天情绪字卡", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-ta-mood", name:"TA的心情", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-connect", name:"聊天回应字卡", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-trace", name:"寻踪日常字卡", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-daily-love", name:"桌面今日情话", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-location", name:"TA在身边位置卡", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-ask-open", name:"TA的询问", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-ask-choice", name:"TA的小问题", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-curious", name:"TA的好奇", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-complain", name:"TA的吐槽", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-check", name:"TA的查岗", scope:"global", isGroupDisabled:false, list:[] },
    { subgroupId:"sys-invite", name:"TA的邀请", scope:"global", isGroupDisabled:false, list:[] }
  ],
  list: []
},

    auditReport: {
      name: "审核报告字卡",
      categories: [
        { id: "default", name: "默认分类", sort: 0, isDisabled: false, expanded: true, cards: [] }
      ]
    }
  },
  pendingApply: [],
  auditHistory: [],
  auditConfig: {
    floatBall: { enable: true, size: 48, color: "#7c68ee", avatarBase64: "", posX: null, posY: null },
        dreamEngine: {
      enableGrabChat: true,
      enableChaos: true,
      enableActiveSend: true,
      scanIntervalSec: 1800,
      baseProb: 0.05,
      emotionProb: 0.30,
      chaosProb: 0.02,
      activeSendProb: 0.3, // 主动发送独立概率，默认0.3
      pendingMax: 20,
      applyCoolDownMs: 60000,
      activeSendCoolDownMs: 120000, // 主动发送冷却，默认2分钟
      dreamNick: "梦角"
    },
    notification: { enable: true, permissionDenied: false },
    debug: false
  },
    engineRunning: false,
  engineTimerId: null, // 新增：引擎定时器ID
  lastActiveSendTs: 0, // 记录上一次主动发消息时间戳，用于冷却
    emotionWords: ["喜欢", "爱", "想你", "开心"],
  hasImportOriginPresetCards: false,
  // ========== 来自DS版本新增工具方法 ==========
  getContactNick() {
    return window.ChatModule?.activeContactInfo?.name || this.auditConfig.dreamEngine.dreamNick || "梦角";
  },
  getMyNick() {
    return window.ChatModule?.activeContactInfo?.myNick || "我";
  },

  // ========== 持久化加载，兼容旧存储 ==========
      loadFromStorage() {
    const raw = localStorage.getItem("mochi_audit_v2");
    let data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
        this.cardGroups.custom.list = data?.customCards ?? [];
        // 读取是否已经导入原作者预设字卡标记
        this.hasImportOriginPresetCards = !!data?.hasImportOriginPresetCards;

        if(Array.isArray(data?.customSubgroups)){
          this.cardGroups.custom.subgroups = data.customSubgroups;
        }
        if(Array.isArray(data?.systemSubgroups)){
          this.cardGroups.system.subgroups = data.systemSubgroups;
        }

        this.cardGroups.auditReport.categories = data?.auditReportCategories ?? [{ id: "default", name: "默认分类", sort: 0, isDisabled: false, expanded: true, cards: [] }];

        if (data?.auditReportCards && Array.isArray(data.auditReportCards) && data.auditReportCards.length > 0) {
          const defaultCat = this.cardGroups.auditReport.categories.find(c => c.id === "default");
          if (defaultCat && defaultCat.cards.length === 0) defaultCat.cards = data.auditReportCards;
        }
        this.pendingApply = data?.pendingApply ?? [];
        this.auditHistory = data?.auditHistory ?? [];
        this.auditConfig = { ...this.auditConfig, ...(data?.auditConfig ?? {}) };
      } catch (e) { console.warn("audit读取本地存储失败", e); }
    }else{
      // 本地存储为空，标记为未导入
      this.hasImportOriginPresetCards = false;
    }
  },
      saveToStorage() {
    localStorage.setItem("mochi_audit_v2", JSON.stringify({
      customCards: this.cardGroups.custom.list,
      customSubgroups: this.cardGroups.custom.subgroups,
      systemSubgroups: this.cardGroups.system.subgroups,
      auditReportCategories: this.cardGroups.auditReport.categories,
      pendingApply: this.pendingApply,
      auditHistory: this.auditHistory,
      auditConfig: this.auditConfig,
      hasImportOriginPresetCards: this.hasImportOriginPresetCards
    }));
    EventBus.emit("my‑audit‑data‑updated", { pendingCount: this.pendingApply.length });
  },

  // ========== 分类操作API ==========
  getAuditCategories() { return [...this.cardGroups.auditReport.categories].sort((a, b) => a.sort - b.sort); },
  getAuditCategoryById(catId) { return this.cardGroups.auditReport.categories.find(c => c.id === catId); },

  addCategory(name) {
    const cat = { id: "cat_" + Date.now(), name: name.trim() || "新分类", sort: this.cardGroups.auditReport.categories.length, isDisabled: false, expanded: true, cards: [] };
    this.cardGroups.auditReport.categories.push(cat);
    this.saveToStorage();
    return cat;
  },

  renameCategory(catId, name) {
    const cat = this.getAuditCategoryById(catId);
    if (!cat) return;
    cat.name = name.trim();
    this.saveToStorage();
  },

  toggleCategoryDisable(catId, disabled) {
    const cat = this.getAuditCategoryById(catId);
    if (!cat) return;
    cat.isDisabled = disabled;
    this.saveToStorage();
  },

  toggleCategoryExpand(catId) {
    const cat = this.getAuditCategoryById(catId);
    if (!cat) return;
    cat.expanded = !cat.expanded;
    this.saveToStorage();
  },

  moveCategorySort(catId, direction) {
    const list = this.cardGroups.auditReport.categories;
    const idx = list.findIndex(c => c.id === catId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    [list[idx], list[targetIdx]] = [list[targetIdx], list[idx]];
    list.forEach((c, i) => c.sort = i);
    this.saveToStorage();
  },

  /**
   * 合并优化后的deleteCategory：
   * - 分类无卡片：targetCatId 可省略，直接删除
   * - 分类有卡片：必须传入有效的 targetCatId，迁移卡片后删除
   */
  deleteCategory(catId, targetCatId) {
    const list = this.cardGroups.auditReport.categories;
    if (list.length <= 1) {
      Toast.show("至少保留一个分类");
      return false;
    }
    const cat = this.getAuditCategoryById(catId);
    if (!cat) return false;

    if (cat.cards.length > 0) {
      if (!targetCatId) {
        Toast.show("该分类下存在字卡，请选择目标分类迁移卡片");
        return false;
      }
      const target = this.getAuditCategoryById(targetCatId);
      if (!target || catId === targetCatId) {
        Toast.show("请选择有效目标分类");
        return false;
      }
      target.cards.push(...cat.cards);
    }

    const idx = list.findIndex(c => c.id === catId);
    list.splice(idx, 1);
    list.forEach((c, i) => c.sort = i);
    this.saveToStorage();
    return true;
  },

  // ========== 字卡操作 ==========
  addCardToCategory(catId, cardData) {
    const cat = this.getAuditCategoryById(catId);
    if (!cat) return null;
    // 使用DS版本ID生成策略，避免短时间ID重复
    const card = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      title: cardData.title || cardData.content.slice(0, 10),
      content: cardData.content,
      side: cardData.side || "bot",
      isDisabled: !!cardData.isDisabled,
      disabledBy: cardData.disabledBy || null
    };
    cat.cards.push(card);
    this.saveToStorage();
    return card;
  },

  updateCard(catId, cardId, patch) {
    const cat = this.getAuditCategoryById(catId);
    if (!cat) return;
    const card = cat.cards.find(c => c.id === cardId);
    if (!card) return;
    Object.assign(card, patch);
    this.saveToStorage();
  },

  deleteCard(catId, cardId) {
    const cat = this.getAuditCategoryById(catId);
    if (!cat) return;
    const idx = cat.cards.findIndex(c => c.id === cardId);
    if (idx > -1) cat.cards.splice(idx, 1);
    this.saveToStorage();
  },

  moveCard(cardId, fromCatId, toCatId) {
    const from = this.getAuditCategoryById(fromCatId);
    const to = this.getAuditCategoryById(toCatId);
    if (!from || !to || fromCatId === toCatId) return;
    const idx = from.cards.findIndex(c => c.id === cardId);
    if (idx === -1) return;
    const [card] = from.cards.splice(idx, 1);
    to.cards.push(card);
    this.saveToStorage();
  },

  deduplicateCategory(catId) {
    const cat = this.getAuditCategoryById(catId);
    if (!cat) return 0;
    const map = new Map();
    cat.cards = cat.cards.filter(card => {
      if (map.has(card.content)) return false;
      map.set(card.content, true);
      return true;
    });
    this.saveToStorage();
    return map.size;
  },

  getAllAuditCards() {
    const all = [];
    this.cardGroups.auditReport.categories.forEach(cat => {
      cat.cards.forEach(card => all.push({ ...card, categoryId: cat.id, categoryName: cat.name }));
    });
    return all;
  },

  getAuditCardCount() {
    return this.cardGroups.auditReport.categories.reduce((sum, cat) => sum + cat.cards.length, 0);
  },

   getEnabledCardList(groupKey, activeContactId=null) {
    const g = this.cardGroups[groupKey];
    if (!g) return [];
    if (groupKey === "auditReport") {
      const all = [];
      g.categories.forEach(cat => {
        if (!cat.isDisabled) {
          cat.cards.forEach(card => {
            if (!card.isDisabled) all.push(card);
          });
        }
      });
      return all;
    }
    // 有子分组的情况 custom / system
    if(g.subgroups){
      let out = [];
      g.subgroups.forEach(sg=>{
        // ✅整组被禁用，直接跳过该分组全部卡片
        if(sg.isGroupDisabled === true) return;
        sg.list.forEach(card=>{
          if(card.isDisabled) return;
          if(sg.scope === "global"){
            out.push(card);
          }else if(sg.scope === "contact" && activeContactId && card.contactId === activeContactId){
            out.push(card);
          }
        })
      })
      return out;
    }
    return g.list.filter(item => !item.isDisabled);
  },
   // 转换外部全局 PRESET_RAW_CARD_DATA 为 system.subgroups 子分组数组
  _convertOriginPresetCards(rawData){
    const outSubgroups = [];
    let sgIdSeq = 0;
    Object.keys(rawData).forEach(topKey=>{
      const groupList = rawData[topKey];
      if(!Array.isArray(groupList)) return;
      groupList.forEach(([groupName,cardTexts])=>{
        if(!Array.isArray(cardTexts)) return;
        const list = cardTexts.map((txt,idx)=>{
          return {
            id:`sys‑import‑${sgIdSeq}_${idx}`,
            title: txt.length>12 ? txt.slice(0,12):txt,
            content:txt,
            side:"bot",
            isDisabled:false
          }
        });
        outSubgroups.push({
          subgroupId:`sys‑import‑${topKey}_${sgIdSeq++}`,
          name:`【${topKey}】${groupName}`,
          scope:"global",
          isGroupDisabled:false,
          list
        })
      })
    })
    return outSubgroups;
  },
  // 获取指定子分组全部卡片
  getSubgroupCards(groupKey, subgroupId, contactId=null){
    const g = this.cardGroups[groupKey];
    if(!g || !g.subgroups) return [];
    const sg = g.subgroups.find(s=>s.subgroupId === subgroupId);
    if(!sg) return [];
    if(sg.scope === "global") return sg.list;
    if(contactId){
      return sg.list.filter(c=>c.contactId === contactId);
    }
    return [];
  },

  // 添加字卡到子分组，scope=contact时必须传入contactId
  addCardToSubgroup(groupKey, subgroupId, cardItem, contactId=null){
    const g = this.cardGroups[groupKey];
    if(!g || !g.subgroups) return null;
    const sg = g.subgroups.find(s=>s.subgroupId === subgroupId);
    if(!sg) return null;
        const newCard = {
      id: Date.now() + Math.floor(Math.random()*1000),
      title: cardItem.title || cardItem.content.slice(0,10),
      content: cardItem.content,
      side: cardItem.side ?? "bot",
      isDisabled: !!cardItem.isDisabled,
      disabledBy: cardItem.disabledBy || null,
      ...((sg.scope === "contact") ? {contactId} : {})
    };
    sg.list.push(newCard);
    this.saveToStorage();
    return newCard;
  },

  // 删除子分组内卡片
  deleteCardFromSubgroup(groupKey, subgroupId, cardId){
    const g = this.cardGroups[groupKey];
    if(!g || !g.subgroups) return;
    const sg = g.subgroups.find(s=>s.subgroupId === subgroupId);
    if(!sg) return;
        const idx = sg.list.findIndex(c=>c.id === cardId);
    if(idx > -1) sg.list.splice(idx,1);
    this.saveToStorage();
  },
 // 设置子分组整组启用/禁用
  setSubgroupGroupDisable(groupKey, subgroupId, isDisable) {
    const g = this.cardGroups[groupKey];
    if(!g || !g.subgroups) return;
    const sg = g.subgroups.find(s=>s.subgroupId === subgroupId);
    if(!sg) return;
    sg.isGroupDisabled = !!isDisable;
    this.saveToStorage();
  },

  // 修改单张卡片启用禁用状态
  setSubgroupCardDisable(groupKey, subgroupId, cardId, isDisable) {
    const g = this.cardGroups[groupKey];
    if(!g || !g.subgroups) return;
    const sg = g.subgroups.find(s=>s.subgroupId === subgroupId);
    if(!sg) return;
    const card = sg.list.find(c=>c.id === cardId);
    if(!card) return;
    card.isDisabled = !!isDisable;
    this.saveToStorage();
  },
     
   // 自定义字卡：全量导出（公用全部+当前联系人专属）
    exportCustomCardJson(currentContactId){
    const g = this.cardGroups.custom;
    const out = { subgroups:[], _meta:{exportAt:new Date().toISOString(), contactId:currentContactId}};
    g.subgroups.forEach(sg=>{
      let items;
      if(sg.scope === "global"){
        items = [...sg.list];
      }else{
        items = sg.list.filter(c=>c.contactId === currentContactId);
      }
      out.subgroups.push({subgroupId:sg.subgroupId, name:sg.name, scope:sg.scope, list:items});
    })
    return out;
  },

  // 导入自定义字卡json
  importCustomCardJson(jsonObj, targetContactId){
    const g = this.cardGroups.custom;
    if(!jsonObj || !Array.isArray(jsonObj.subgroups)) return false;
    jsonObj.subgroups.forEach(importSg=>{
      const localSg = g.subgroups.find(s=>s.subgroupId === importSg.subgroupId);
      if(!localSg) return;
      importSg.list.forEach(card=>{
        const newId = Date.now()+Math.random()*1000;
        const newCard = {...card, id:newId};
        if(localSg.scope === "contact"){
          newCard.contactId = targetContactId;
        }
        localSg.list.push(newCard);
      })
    })
    this.saveToStorage();
    return true;
  },

  drawRandomCard(groupKey = "auditReport") {
    const list = this.getEnabledCardList(groupKey);
    if (list.length === 0) { Toast.show("该分类暂无可用字卡"); return null; }
    return list[Math.floor(Math.random() * list.length)];
  },

  sendCardToChat(card) {
    if (!window.sendAuditCard) { Toast.show("聊天注入接口未就绪"); return false; }
    window.sendAuditCard(card.content, card.side);
    return true;
  },

  drawAndSend(groupKey = "auditReport") {
    const card = this.drawRandomCard(groupKey);
    if (card) this.sendCardToChat(card);
    return card;
  },

  addCard(groupKey, cardItem) {
    if (groupKey === "system") { Toast.show("系统预设分组不可修改"); return false; }
    if (groupKey === "auditReport") return this.addCardToCategory("default", cardItem);
    const g = this.cardGroups[groupKey];
    if (!g) return false;
    const newCard = { id: Date.now(), title: cardItem.title || "字卡", content: cardItem.content, side: cardItem.side ?? "bot", isDisabled: cardItem.isDisabled ?? false };
    g.list.push(newCard); this.saveToStorage();
    return newCard;
  },

  // ========== 待审申请，保留原版全部字段 sourceGroupId / targetGroupId ==========
      createPendingApply(action, payload, applicant) {
    if (this.pendingApply.length >= this.auditConfig.dreamEngine.pendingMax) {
      if (this.auditConfig.debug) console.log("[createPendingApply]pending队列已满，放弃生成申请");
      return null;
    }
    const now = Date.now();
    const isCool = this.pendingApply.some(ap => ap.action === action && ap.cardText === payload.cardText && (now - ap.lastApplyTime) < this.auditConfig.dreamEngine.applyCoolDownMs);
    if (isCool) {
      if(this.auditConfig.debug) console.log("[createPendingApply]冷却限制，跳过",payload.cardText);
      return null;
    }
    const applyItem = {
      applyId: String(now),
      action,
      cardText: payload.cardText ?? "",
      sourceGroupId: payload.sourceGroupId ?? "",
      targetGroupId: payload.targetGroupId ?? "",
      sourceCatId: payload.sourceCatId ?? "",
      targetCatId: payload.targetCatId ?? "",
      applicant,
      lastApplyTime: now,
      remark: ""
    };
    this.pendingApply.push(applyItem);
    if(this.auditConfig.debug) console.log("[createPendingApply]✅成功新增待审申请", applyItem);
    this.saveToStorage();
    return applyItem;
  },

  approveApply(applyId, result, remark = "") {
    const idx = this.pendingApply.findIndex(p => p.applyId === applyId);
    if (idx === -1) return false;
    const item = this.pendingApply[idx];
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
    if (this.auditHistory.length > 100) this.auditHistory = this.auditHistory.slice(0, 100);
    this.pendingApply.splice(idx, 1);
    this.saveToStorage();
    return true;
  },

  clearAllPendingApply() {
    this.pendingApply = [];
    this.saveToStorage();
    console.log("[Audit] 已清空全部待审申请");
  },

  approveOneApply() {
    if (this.pendingApply.length) this.approveApply(this.pendingApply[0].applyId, "agree", "测试通过");
  },
  rejectOneApply() {
    if (this.pendingApply.length) this.approveApply(this.pendingApply[0].applyId, "reject", "测试驳回");
  },

  // ========== 梦角引擎：使用DS的增强实现 ==========
    scanChatAndGenApply(chatMsgList) {
    const cfg = this.auditConfig.dreamEngine;
    if (!cfg.enableGrabChat) {
      if(this.auditConfig.debug) console.log("[scanChat] 跳过：抓取聊天开关关闭");
      return;
    }
    const now = Date.now();
    const userRecentMsg = chatMsgList.filter(m => m.role === "user" && (now - m.time) < 15 * 60 * 1000 && m.content.length >= 5 && m.content.length <= 35);
    if(this.auditConfig.debug) console.log("[scanChat] 用户近期消息数量：", userRecentMsg.length);
    if (userRecentMsg.length === 0){
      if(this.auditConfig.debug) console.log("[scanChat] 没有符合条件用户消息");
      return;
    }
    const latestUserMsg = userRecentMsg[userRecentMsg.length - 1];
    let prob = cfg.baseProb;
    if (this.emotionWords.some(w => latestUserMsg.content.includes(w))) prob = cfg.emotionProb;
    if(this.auditConfig.debug) console.log("[scanChat]最新消息：",latestUserMsg.content," 本次判定概率：",prob);
    if (Math.random() < prob) {
      if(this.auditConfig.debug) console.log("[scanChat]✅命中概率，生成待审申请");
      const enabledCats = this.getAuditCategories().filter(c => !c.isDisabled);
      const targetCat = enabledCats.length > 0 ? enabledCats[Math.floor(Math.random() * enabledCats.length)] : this.getAuditCategories()[0];
      this.createPendingApply("add", { cardText: latestUserMsg.content, targetCatId: targetCat?.id }, this.getContactNick());
    }else{
      if(this.auditConfig.debug) console.log("[scanChat]❌未命中随机概率，不生成申请");
    }
  },

    runChaosOperate() {
    const cfg = this.auditConfig.dreamEngine;
    if (!cfg.enableChaos) {
      if(this.auditConfig.debug) console.log("[chaosOperate] 混沌开关关闭");
      return;
    }
    const r = Math.random();
    if(this.auditConfig.debug) console.log("[chaosOperate] 混沌随机值：", r, "设定概率：", cfg.chaosProb);
    if (r < cfg.chaosProb) {
      if(this.auditConfig.debug) console.log("[chaosOperate] ✅命中混沌概率，执行变更");
      const ops = ["delete", "disable", "move"];
      const action = ops[Math.floor(Math.random() * ops.length)];
      const allCards = this.getAllAuditCards().filter(c => !c.isDisabled && !this.getAuditCategoryById(c.categoryId)?.isDisabled);
      if (allCards.length === 0) {
        if(this.auditConfig.debug) console.log("[chaosOperate] 没有可用字卡，跳过");
        return;
      }
      const card = allCards[Math.floor(Math.random() * allCards.length)];
      const payload = { cardText: card.content, sourceCatId: card.categoryId };
      if (action === "move") {
        const otherCats = this.getAuditCategories().filter(c => c.id !== card.categoryId && !c.isDisabled);
        if (otherCats.length === 0) {
          if(this.auditConfig.debug) console.log("[chaosOperate] 没有可迁移目标分类，跳过");
          return;
        }
        payload.targetCatId = otherCats[Math.floor(Math.random() * otherCats.length)].id;
      }
      this.createPendingApply(action, payload, this.getContactNick());
    }else{
      if(this.auditConfig.debug) console.log("[chaosOperate] ❌未命中混沌概率");
    }
  },

      runActiveSend() {
    const cfg = this.auditConfig.dreamEngine;
    if (!cfg.enableActiveSend) {
      if(this.auditConfig.debug) console.log("[activeSend] 主动消息开关关闭");
      return;
    }
    const now = Date.now();
    // 冷却校验
    if(now - this.lastActiveSendTs < cfg.activeSendCoolDownMs){
      const remain = Math.ceil((cfg.activeSendCoolDownMs - (now - this.lastActiveSendTs)) /1000);
      if(this.auditConfig.debug) console.log(`[activeSend] ⏳冷却中，还剩${remain}秒`);
      return;
    }
    // 主动发送独立概率判定
    const r = Math.random();
    if(this.auditConfig.debug) console.log("[activeSend] 主动发送随机值：", r, "设定概率：", cfg.activeSendProb);
    if(r >= cfg.activeSendProb){
      if(this.auditConfig.debug) console.log("[activeSend] ❌未命中主动发送概率");
      return;
    }
    const card = this.drawRandomCard("auditReport");
    if(!card){
      if(this.auditConfig.debug) console.log("[activeSend] ❌无可用字卡，不发送");
      return;
    }
    if(this.auditConfig.debug) console.log("[activeSend] ✅命中概率，发送字卡：", card.content);
    const ok = this.sendCardToChat(card);
    if(ok){
      this.lastActiveSendTs = now; // 发送成功才更新冷却时间戳
    }
  },

    async engineTick(chatMsgList) {
    if (this.engineRunning) return;
    this.engineRunning = true;
    try {
      try {
        this.scanChatAndGenApply(chatMsgList);
      } catch (e) {
        if(this.auditConfig.debug) console.error("[engineTick] scanChatAndGenApply异常", e);
      }
      try {
        this.runChaosOperate();
      } catch (e) {
        if(this.auditConfig.debug) console.error("[engineTick] runChaosOperate异常", e);
      }
      try {
        this.runActiveSend();
      } catch (e) {
        if(this.auditConfig.debug) console.error("[engineTick] runActiveSend异常", e);
      }
    } finally {
      this.engineRunning = false;
    }
  },

      init() {
    this.loadFromStorage();

    // =====运行时兜底，防止旧存储把 subgroups 冲成 undefined=====
        if(!this.cardGroups.custom.subgroups || !Array.isArray(this.cardGroups.custom.subgroups)){
       this.cardGroups.custom.subgroups = [
        { subgroupId:"custom-global", name:"公用字卡", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"custom-contact", name:"专属字卡", scope:"contact", isGroupDisabled:false, list:[] },
        { subgroupId:"custom-fun-global", name:"其他互动功能字卡·公用", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"custom-fun-contact", name:"其他互动功能字卡·专属", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"custom-trace", name:"寻踪日常·我的添加", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"custom-love-words", name:"今日情话·我的添加", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"custom-ask-open", name:"TA的询问·我的添加", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"custom-ask-choice", name:"TA的小问题·我的添加", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"custom-curious", name:"TA的好奇·我的添加", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"custom-complain", name:"TA的吐槽·我的添加", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"custom-check", name:"TA的查岗·我的添加", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"custom-invite", name:"TA的邀请·我的添加", scope:"global", isGroupDisabled:false, list:[] }
      ];
    }
    // 兜底遍历，老数据没有isGroupDisabled自动补false
    this.cardGroups.custom.subgroups.forEach(sg=>{
      if(sg.isGroupDisabled === undefined) sg.isGroupDisabled = false;
    });

    if(!this.cardGroups.system.subgroups || !Array.isArray(this.cardGroups.system.subgroups)){
      this.cardGroups.system.subgroups = [
        { subgroupId:"sys-chat-default", name:"默认聊天字卡", scope:"global", isGroupDisabled:false, list:[
          { id: "sys-1", title: "温柔提示", content: "我一直在，慢慢来就好。", side: "bot", isDisabled: false },
          { id: "sys-2", title: "简短回应", content: "我看到你的心意了。", side: "bot", isDisabled: false }
        ]},
        { subgroupId:"sys-chat-dict", name:"聊天默认字卡·词典", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-fun", name:"其他互动功能字卡", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-cross-check", name:"联系人跨桌面查岗", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-emotion", name:"聊天情绪字卡", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-ta-mood", name:"TA的心情", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-connect", name:"聊天回应字卡", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-trace", name:"寻踪日常字卡", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-daily-love", name:"桌面今日情话", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-location", name:"TA在身边位置卡", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-ask-open", name:"TA的询问", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-ask-choice", name:"TA的小问题", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-curious", name:"TA的好奇", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-complain", name:"TA的吐槽", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-check", name:"TA的查岗", scope:"global", isGroupDisabled:false, list:[] },
        { subgroupId:"sys-invite", name:"TA的邀请", scope:"global", isGroupDisabled:false, list:[] }
      ];
    }
    // 兜底遍历，老数据没有isGroupDisabled自动补false
    this.cardGroups.system.subgroups.forEach(sg=>{
      if(sg.isGroupDisabled === undefined) sg.isGroupDisabled = false;
    });
     // =====兜底结束=====
    // 页面初始化，仅第一次执行导入内置预设字卡
    if(!this.hasImportOriginPresetCards && window.PRESET_RAW_CARD_DATA){
      console.log("首次启动：导入外部预设字卡数据");
      const importSgs = this._convertOriginPresetCards(window.PRESET_RAW_CARD_DATA);
      // 清理之前导入的预设分组，避免多次导入重复叠加
      this.cardGroups.system.subgroups = this.cardGroups.system.subgroups.filter(sg=> !sg.subgroupId.startsWith("sys‑import‑"));
      this.cardGroups.system.subgroups = this.cardGroups.system.subgroups.concat(importSgs);
      this.hasImportOriginPresetCards = true;
      this.saveToStorage();
    }
    console.log("AuditCardModule 数据层初始化完成");
    this.restartEngineTimer();

  },

  // 新增：重启/管理引擎定时器
  restartEngineTimer() {
    // 先清除旧定时器
    if(this.engineTimerId !== null){
      clearInterval(this.engineTimerId);
      this.engineTimerId = null;
    }
    const cfg = this.auditConfig.dreamEngine;
    // 如果全部引擎功能关闭，直接不启动定时器
    if(!cfg.enableGrabChat && !cfg.enableChaos && !cfg.enableActiveSend){
      if(this.auditConfig.debug) console.log("[Audit引擎]全部引擎开关关闭，停止定时器");
      return;
    }
    // 按照配置的scanIntervalSec秒数定时执行
       // 按照配置的scanIntervalSec【秒】转成毫秒
    const intervalMs = cfg.scanIntervalSec * 1000;
    this.engineTimerId = setInterval(()=>{
      // 尝试从全局ChatModule拿聊天消息
      const chatMsgList = window.ChatModule?.messageList ?? [];
      if(this.auditConfig.debug){
        console.log("[Audit引擎]定时tick触发", "消息条数:", chatMsgList.length);
      }
      this.engineTick(chatMsgList);
    }, intervalMs);

    if(this.auditConfig.debug) console.log(`[Audit引擎]定时器已启动，间隔${cfg.scanIntervalSec}秒`);
  },
};

window.AuditCardModule = AuditCardModule;
AuditCardModule.init();
export { AuditCardModule };
