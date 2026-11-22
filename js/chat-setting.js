import { Store } from './core/store.js';
import { EventBus } from './core/context.js';
import { Toast } from './core/toast.js';

export const ChatSettingModule = {
  rootEl: null,
  contactId: null,
  contactInfo: null,
  // 一级tab：美化、功能、数据
  tab1List: ["美化", "功能", "数据"],
  activeTab1: "功能",
  // 功能下面二级tab
  tab2List: ["形象", "消息", "显示"],
  activeTab2: "形象",

  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    EventBus.on("openChatSetting", (data) => {
      this.contactId = data.contactId;
      const list = Store.get("contactList", []);
      this.contactInfo = list.find(i => i.id === this.contactId);
      this.render();
    });
  },

  render() {
    if (!this.rootEl) return;
    this.rootEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.style.height = "100%";
    wrap.style.background = "#fff";

    // 顶部栏 返回 + 标题
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "10px";
    header.style.padding = "14px 16px";
    header.style.borderBottom = "1px solid #eee";
    header.innerHTML = `
      <button id="cs-back" style="border:none;background:none;font-size:20px">←</button>
      <span style="font-size:18px;font-weight:500">聊天设置</span>
    `;
    wrap.appendChild(header);

    // 一级Tab：美化 / 功能 / 数据
    const tab1Wrap = document.createElement("div");
    tab1Wrap.style.display = "flex";
    tab1Wrap.style.borderBottom = "1px solid #eee";
    tab1Wrap.style.padding = "0 16px";
    this.tab1List.forEach(t => {
      const tab = document.createElement("div");
      tab.innerText = t;
      tab.style.padding = "12px 14px";
      tab.style.fontSize = "15px";
      tab.style.position = "relative";
      tab.style.cursor = "pointer";
      if (this.activeTab1 === t) {
        tab.style.fontWeight = "bold";
        const line = document.createElement("div");
        line.style.position = "absolute";
        line.style.bottom = "0";
        line.style.left = "0";
        line.style.width = "100%";
        line.style.height = "2px";
        line.style.background = "#333";
        tab.appendChild(line);
      }
      tab.onclick = () => {
        this.activeTab1 = t;
        this.render();
      }
      tab1Wrap.appendChild(tab);
    })
    wrap.appendChild(tab1Wrap);

    // 只有选中【功能】的时候，才渲染二级tab（形象/消息/显示）
    if (this.activeTab1 === "功能") {
      const tab2Wrap = document.createElement("div");
      tab2Wrap.style.display = "flex";
      tab2Wrap.style.borderBottom = "1px solid #eee";
      tab2Wrap.style.padding = "0 16px";
      this.tab2List.forEach(t => {
        const tab = document.createElement("div");
        tab.innerText = t;
        tab.style.padding = "10px 12px";
        tab.style.fontSize = "14px";
        tab.style.position = "relative";
        tab.style.cursor = "pointer";
        if (this.activeTab2 === t) {
          tab.style.fontWeight = "bold";
          const line = document.createElement("div");
          line.style.position = "absolute";
          line.style.bottom = "0";
          line.style.left = "0";
          line.style.width = "100%";
          line.style.height = "2px";
          line.style.background = "#333";
          tab.appendChild(line);
        }
        tab.onclick = () => {
          this.activeTab2 = t;
          this.render();
        }
        tab2Wrap.appendChild(tab);
      })
      wrap.appendChild(tab2Wrap);
    }

    // 内容区域，对应你原型【形象】页表单
    const contentWrap = document.createElement("div");
    contentWrap.style.padding = "16px";
    if (this.activeTab1 === "功能" && this.activeTab2 === "形象") {
      contentWrap.innerHTML = `
        <div style="color:#777;font-size:13px;margin-bottom:16px">昵称与头像（聊天专用 · 与桌面各自独立，互不同步）</div>
        <div class="item-row">
          <div>联系人昵称</div>
          <div style="color:#666">${this.contactInfo?.name || ""}</div>
        </div>
        <div class="item-row">
          <div>我的昵称</div>
          <div style="color:#666">未设置（默认 我）</div>
        </div>
        <div class="item-row">
          <div>联系人头像</div>
          <div style="color:#666">${this.contactInfo?.avatar ? "已设置" : "未设置"}</div>
        </div>
        <div class="item-row">
          <div>我的头像</div>
          <div style="color:#666">未设置</div>
        </div>
      `;
      const style = document.createElement("style");
      style.textContent = `.item-row{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #eee;}`;
      contentWrap.appendChild(style);
    } else {
      contentWrap.innerHTML = `<div style="text-align:center;margin-top:40px;color:#888">该页面待开发</div>`;
    }
    wrap.appendChild(contentWrap);
    this.rootEl.appendChild(wrap);

    // 返回按钮：切回聊天tab
    document.getElementById("cs-back").onclick = () => {
      EventBus.emit("switchTab", "chat");
    }
  }
}
