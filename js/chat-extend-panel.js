import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';
import { AvatarNickModal } from './modal-avatar-nick.js';

export const ChatExtendPanel = {
  parentContainer: null,
  contactId: null,
  contactInfo: null,
  activeTab: "互动",
  tabList: ["互动", "工具", "小游戏", "TA的提问"],
  onCloseCallback: null,

  open(parentDom, cid, closeCb) {
    this.parentContainer = parentDom;
    this.contactId = cid;
    this.onCloseCallback = closeCb;
    const list = Store.get("contactList", []);
    this.contactInfo = list.find(i => i.id === this.contactId);
    this.render();
  },

  close() {
    if (this.parentContainer) this.parentContainer.innerHTML = "";
    if (typeof this.onCloseCallback === "function") this.onCloseCallback();
  },

  render() {
    if (!this.parentContainer) return;
    this.parentContainer.innerHTML = "";
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.inset = "0";
    mask.style.zIndex = "9998";
    mask.style.background = "rgba(0,0,0,0.25)";
    mask.onclick = (e) => {
      if (e.target === mask) this.close();
    };

    const panelWrap = document.createElement("div");
    panelWrap.style.position = "fixed";
    panelWrap.style.bottom = "0";
    panelWrap.style.left = "0";
    panelWrap.style.width = "100%";
    panelWrap.style.maxWidth = "600px";
    panelWrap.style.boxSizing = "border-box";
    panelWrap.style.background = "#fff";
    panelWrap.style.borderRadius = "16px 16px 0 0";
    panelWrap.style.padding = "16px";

    // 顶部tab栏
    const tabWrap = document.createElement("div");
    tabWrap.style.display = "flex";
    tabWrap.style.gap = "4px";
    tabWrap.style.borderBottom = "1px solid #eee";
    tabWrap.style.marginBottom = "16px";
    this.tabList.forEach(tabName => {
      const tab = document.createElement("div");
      tab.innerText = tabName;
      tab.style.padding = "8px 10px";
      tab.style.fontSize = "14px";
      tab.style.cursor = "pointer";
      if (this.activeTab === tabName) {
        tab.style.fontWeight = "bold";
        tab.style.borderBottom = "2px solid #222";
      }
      tab.onclick = () => {
        this.activeTab = tabName;
        this.render();
      };
      tabWrap.appendChild(tab);
    });
    panelWrap.appendChild(tabWrap);

    const contentBox = document.createElement("div");
    contentBox.style.minHeight = "180px";

    if (this.activeTab === "互动") {
      // 互动页图标网格
      contentBox.innerHTML = `
        <style>
        .grid-row{display:grid;grid-template-columns: repeat(4, 1fr);gap:14px}
        .func-card{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer}
        .func-icon{width:48px;height:48px;background:#f3f3f3;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px}
        .func-name{font-size:12px;color:#333}
        </style>
        <div class="grid-row">
          <div class="func-card" data-func="call">
            <div class="func-icon">📞</div>
            <div class="func-name">通话</div>
          </div>
          <div class="func-card" data-func="pat">
            <div class="func-icon">🖐️</div>
            <div class="func-name">拍一拍</div>
          </div>
          <div class="func-card" data-func="redpack">
            <div class="func-icon">🧧</div>
            <div class="func-name">红包</div>
          </div>
          <div class="func-card" data-func="invite">
            <div class="func-icon">➕</div>
            <div class="func-name">邀请TA</div>
          </div>
        </div>
        <div class="grid-row" style="margin-top:14px">
          <div class="func-card" data-func="giftmarket">
            <div class="func-icon">🎁</div>
            <div class="func-name">心意集市</div>
          </div>
          <div class="func-card" data-func="giftbox">
            <div class="func-icon">🎒</div>
            <div class="func-name">心意柜</div>
          </div>
          <div class="func-card" data-func="avatarnick">
            <div class="func-icon">👤</div>
            <div class="func-name">头像和昵称互动</div>
          </div>
          <div class="func-card" data-func="bottle">
            <div class="func-icon">🍶</div>
            <div class="func-name">漂流瓶</div>
          </div>
        </div>
      `;
      // 绑定卡片点击
      contentBox.querySelectorAll(".func-card").forEach(card => {
        card.onclick = () => {
          const funcKey = card.dataset.func;
          if (funcKey === "avatarnick") {
            this.close();
            AvatarNickModal.open(this.parentContainer, this.contactId, ()=>{});
          } else {
            Toast.show("该功能待开发");
          }
        }
      })
    } else if (this.activeTab === "工具") {
      contentBox.innerHTML = `<div style="text-align:center;padding:40px 0;color:#777">工具模块待开发</div>`;
    } else if (this.activeTab === "小游戏") {
      contentBox.innerHTML = `<div style="text-align:center;padding:40px 0;color:#777">小游戏模块待开发</div>`;
    } else if (this.activeTab === "TA的提问") {
      contentBox.innerHTML = `<div style="text-align:center;padding:40px 0;color:#777">TA的提问模块待开发</div>`;
    }
    panelWrap.appendChild(contentBox);

    mask.appendChild(panelWrap);
    this.parentContainer.appendChild(mask);
  }
};
