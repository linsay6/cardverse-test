import { Store } from './core/store.js';
import { Toast } from './core/toast.js';

export const ChatSettingSubModule = {
  parentContainer: null,
  contactId: null,
  contactInfo: null,

  tab1List: ["美化", "功能", "数据"],
  activeTab1: "功能",
  tab2List: ["形象", "消息", "显示"],
  activeTab2: "形象",

  open(parentDom, cid, cbBack) {
    this.parentContainer = parentDom;
    this.contactId = cid;
    const list = Store.get("contactList", []);
    this.contactInfo = list.find(i => i.id === this.contactId);
    this.callbackBack = cbBack;
    this.render();
  },

  render() {
    if (!this.parentContainer) return;
    this.parentContainer.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.style.height = "100%";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.background = "#f7f7f7";

    // 头部
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "10px";
    header.style.padding = "14px 16px";
    header.style.borderBottom = "1px solid #eee";
    header.style.background = "#fff";
    header.innerHTML = `
      <button id="csub-back" style="border:none;background:none;font-size:20px;cursor:pointer">←</button>
      <span style="font-size:18px;font-weight:500;color:#222">聊天设置</span>
    `;
    wrap.appendChild(header);

    // 内容区域：垂直居中容器，用来放卡片
    const contentWrap = document.createElement("div");
    contentWrap.style.flex = "1";
    contentWrap.style.overflowY = "auto";
    contentWrap.style.padding = "16px";
    contentWrap.style.boxSizing = "border-box";
    contentWrap.style.display = "flex";
    contentWrap.style.flexDirection = "column";
    contentWrap.style.alignItems = "center";

    // 主卡片，所有tab+内容都在这张卡片内部
    const mainCard = document.createElement("div");
    mainCard.style.width = "100%";
    mainCard.style.maxWidth = "420px";
    mainCard.style.background = "#fff";
    mainCard.style.borderRadius = "14px";
    mainCard.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
    mainCard.style.overflow = "hidden";

    // 卡片内 一级tab栏
    const tab1Wrap = document.createElement("div");
    tab1Wrap.style.display = "flex";
    tab1Wrap.style.borderBottom = "1px solid #eee";
    this.tab1List.forEach(tName => {
      const tabEl = document.createElement("div");
      tabEl.innerText = tName;
      tabEl.style.padding = "12px 14px";
      tabEl.style.flex = "1";
      tabEl.style.textAlign = "center";
      tabEl.style.fontSize = "15px";
      tabEl.style.position = "relative";
      tabEl.style.cursor = "pointer";
      if (this.activeTab1 === tName) {
        tabEl.style.fontWeight = "bold";
        const botLine = document.createElement("div");
        botLine.style.position = "absolute";
        botLine.style.bottom = "0";
        botLine.style.left = "0";
        botLine.style.width = "100%";
        botLine.style.height = "2px";
        botLine.style.background = "#222";
        tabEl.appendChild(botLine);
      }
      tabEl.onclick = () => {
        this.activeTab1 = tName;
        this.render();
      };
      tab1Wrap.appendChild(tabEl);
    });
    mainCard.appendChild(tab1Wrap);

    // 卡片内 二级tab栏（仅功能tab显示）
    if (this.activeTab1 === "功能") {
      const tab2Wrap = document.createElement("div");
      tab2Wrap.style.display = "flex";
      tab2Wrap.style.borderBottom = "1px solid #eee";
      this.tab2List.forEach(tName => {
        const tabEl2 = document.createElement("div");
        tabEl2.innerText = tName;
        tabEl2.style.padding = "10px 12px";
        tabEl2.style.flex = "1";
        tabEl2.style.textAlign = "center";
        tabEl2.style.fontSize = "14px";
        tabEl2.style.position = "relative";
        tabEl2.style.cursor = "pointer";
        if (this.activeTab2 === tName) {
          tabEl2.style.fontWeight = "bold";
          const botLine2 = document.createElement("div");
          botLine2.style.position = "absolute";
          botLine2.style.bottom = "0";
          botLine2.style.left = "0";
          botLine2.style.width = "100%";
          botLine2.style.height = "2px";
          botLine2.style.background = "#222";
          tabEl2.appendChild(botLine2);
        }
        tabEl2.onclick = () => {
          this.activeTab2 = tName;
          this.render();
        };
        tab2Wrap.appendChild(tabEl2);
      });
      mainCard.appendChild(tab2Wrap);
    }

    // 卡片内 内容区
    const cardContent = document.createElement("div");
    cardContent.style.padding = "16px";

    if (this.activeTab1 === "功能" && this.activeTab2 === "形象") {
      cardContent.innerHTML = `
        <div style="font-size:13px;color:#777;margin-bottom:12px;text-align:center">昵称与头像（聊天专用 · 与桌面各自独立，互不同步）</div>
        <div style="padding:4px 0;">
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#222">
            <span>联系人昵称</span>
            <span style="color:#666">${this.contactInfo?.name || "-"}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#222">
            <span>我的昵称</span>
            <span style="color:#666">未设置（默认 我）</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#222">
            <span>联系人头像</span>
            <span style="color:#666">${this.contactInfo?.avatar ? "已设置" : "未设置"}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;color:#222">
            <span>我的头像</span>
            <span style="color:#666">未设置</span>
          </div>
        </div>
      `;
    } else {
      cardContent.innerHTML = `
        <div style="padding:30px 0;text-align:center;color:#888">页面待开发</div>
      `;
    }
    mainCard.appendChild(cardContent);

    contentWrap.appendChild(mainCard);
    wrap.appendChild(contentWrap);
    this.parentContainer.appendChild(wrap);

    document.getElementById("csub-back").onclick = () => {
      if (typeof this.callbackBack === "function") {
        this.callbackBack();
      }
    };
  }
};
