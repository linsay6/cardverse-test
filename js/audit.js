import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

const AuditCardModule = {
  // 卡组，你后续可以在这里加更多字卡
  cardPool: [
    {
      id: 1,
      title: "温柔提示",
      content: "我一直在，慢慢来就好。",
      side: "bot"
    },
    {
      id: 2,
      title: "简短回应",
      content: "我看到你的心意了。",
      side: "bot"
    },
    {
      id: 3,
      title: "你的台词",
      content: "今天也很想你。",
      side: "user"
    }
  ],

  panelEl: null,

  // 抽一张随机卡
  drawRandomCard() {
    const randomIdx = Math.floor(Math.random() * this.cardPool.length);
    return this.cardPool[randomIdx];
  },

  // 发送抽到的卡片消息到聊天
  sendCardToChat(card) {
    if (!window.sendAuditCard) {
      Toast.show("聊天注入接口未就绪");
      return false;
    }
    window.sendAuditCard(card.content, card.side);
    Toast.show(`抽到：${card.title}`);
    return true;
  },

  // 一键抽卡并发送
  drawAndSend() {
    const card = this.drawRandomCard();
    this.sendCardToChat(card);
    return card;
  },

  // 外部手动添加新卡
  addCard(newCard) {
    if (!newCard.content) return;
    this.cardPool.push({
      id: Date.now(),
      title: newCard.title || "字卡",
      content: newCard.content,
      side: newCard.side || "bot"
    });
    Toast.show("字卡已添加到卡组");
  },

  // 动态创建弹窗（全部JS生成，不修改index.html）
  openPanel() {
    if(this.panelEl){
      this.panelEl.style.display = "block";
      return;
    }
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.inset = "0";
    mask.style.background = "rgba(0,0,0,0.45)";
    mask.style.zIndex = "9999";
    mask.style.display = "flex";
    mask.style.alignItems = "center";
    mask.style.justifyContent = "center";

    const box = document.createElement("div");
    box.style.width = "85%";
    box.style.maxWidth = "420px";
    box.style.background = "var(--color-bg)";
    box.style.borderRadius = "14px";
    box.style.padding = "16px";

    box.innerHTML = `
      <h3 style="margin:0 0 12px 0;color:var(--color-text)">审核面板(测试)</h3>
      <button id="audit-draw-btn" style="width:100%;padding:10px;border:none;border-radius:8px;background:var(--color-main);color:#fff;margin-bottom:8px">抽一张字卡发送到聊天</button>
      <button id="audit-close-btn" style="width:100%;padding:10px;border:1px solid var(--color-border);border-radius:8px;background:transparent;color:var(--color-text)">关闭</button>
    `;
    mask.appendChild(box);
    document.body.appendChild(mask);
    this.panelEl = mask;

    box.querySelector("#audit-draw-btn").onclick = ()=>{
      this.drawAndSend();
    };
    box.querySelector("#audit-close-btn").onclick = ()=>{
      mask.remove();
      this.panelEl = null;
    };
    mask.onclick = (e)=>{
      if(e.target === mask){
        mask.remove();
        this.panelEl = null;
      }
    };
  },

  init() {
    // 监听桌面模块发出的open‑panel事件
    EventBus.on("open‑panel", (payload) => {
      if(payload.panel === "audit"){
        this.openPanel();
      }
    });
  }
};

// 挂载全局，控制台可以直接测试
window.AuditCardModule = AuditCardModule;

// 模块加载完成执行init，绑定事件监听
AuditCardModule.init();

// 命名导出，方便app.js导入
export { AuditCardModule };
