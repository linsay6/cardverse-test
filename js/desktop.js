import { Store } from './core/store.js';
import { EventBus } from './core/context.js';
import { Toast } from './core/toast.js';

export const DesktopModule = {
  rootEl: null,
  cardList: [],

  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("桌面容器找不到", containerSelector);
      return;
    }
    // 读取保存的字卡
    this.cardList = Store.get("card-list", []);
    this.render();

    // 监听主题变化，自动重绘
    EventBus.on("themeChange", () => {
      this.render();
    });

    // 监听新增字卡事件
    EventBus.on("card:add", (newCard) => {
      this.cardList.push(newCard);
      this.saveCardList();
      this.render();
      Toast.show("字卡添加成功");
    });
  },

  // 渲染桌面卡片列表
  render() {
    if (!this.rootEl) return;
    this.rootEl.innerHTML = "";

    if (this.cardList.length === 0) {
      this.rootEl.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--color-text-2)">
          暂无字卡，去字卡页面添加
        </div>
      `;
      return;
    }

    this.cardList.forEach((card) => {
      const cardDom = document.createElement("div");
      cardDom.style.cssText = `
        background: var(--color-bg);
        border:1px solid var(--color-border);
        border-radius: var(--radius-card);
        padding:14px;
        margin-bottom:10px;
      `;
      cardDom.innerHTML = `
        <div style="font-weight:bold;color:var(--color-main);margin-bottom:6px;">${card.name}</div>
        <div style="font-size:13px;color:var(--color-text-2)">${card.desc || ""}</div>
      `;
      // 点击卡片，进入对话
     cardDom.onclick = () => {
  EventBus.emit("session:switch", {sessionId: card.id, card});
  EventBus.emit("tab:switch", "chat");
};
      this.rootEl.appendChild(cardDom);
    });
  },

  saveCardList() {
    Store.set("card-list", this.cardList);
  }
};
