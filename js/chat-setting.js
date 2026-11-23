import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';
export const ChatSettingSubModule = {
  parentContainer: null,
  contactId: null,
  contactInfo: null,
  tab1List: ["美化", "功能", "数据"],
  activeTab1: "功能",
  tab2List: ["形象", "消息", "显示"],
  activeTab2: "形象",
  _themeChangeOff: null,
  open(parentDom, cid, cbBack) {
    this.parentContainer = parentDom;
    this.contactId = cid;
    const list = Store.get("contactList", []);
    this.contactInfo = list.find(i => i.id === this.contactId);
    this.callbackBack = cbBack;
    // 监听全局主题变化，实时重渲染更新背景色
    this._themeChangeOff = EventBus.on("themeChange", () => {
      if(this.parentContainer){
        this.render();
      }
    });
    this.render();
  },
  openRadioModal(title, optionList, currentVal, onSelect) {
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.inset = "0";
    mask.style.background = "rgba(0,0,0,0.35)";
    mask.style.zIndex = "9999";
    mask.style.display = "flex";
    mask.style.alignItems = "center";
    mask.style.justifyContent = "center";
    const modal = document.createElement("div");
    modal.style.width = "85%";
    modal.style.maxWidth = "360px";
    modal.style.background = "#fff";
    modal.style.borderRadius = "14px";
    modal.style.overflow = "hidden";
    modal.innerHTML = `<div style="padding:16px 16px 8px;font-weight:bold;font-size:16px">${title}</div>`;
    optionList.forEach(opt => {
      const itemDiv = document.createElement("div");
      itemDiv.style.padding = "14px 16px";
      itemDiv.style.cursor = "pointer";
      itemDiv.style.display = "flex";
      itemDiv.style.justifyContent = "space-between";
      itemDiv.style.alignItems = "center";
      itemDiv.style.borderBottom = "1px solid #eee";
      itemDiv.innerHTML = `<span>${opt.label}</span> ${opt.value === currentVal ? `<span style="color:#7c68ee">✓</span>` : ""}`;
      itemDiv.onclick = () => {
        mask.remove();
        onSelect(opt.value);
      };
      modal.appendChild(itemDiv);
    });
    mask.appendChild(modal);
    document.body.appendChild(mask);
    mask.onclick = (e) => {
      if(e.target === mask) mask.remove();
    };
  },
  render() {
    if (!this.parentContainer) return;
    this.parentContainer.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.style.height = "100%";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    const appTheme = Store.get("app-theme",{});
    wrap.style.background = appTheme.colorBg || "#f7f7f7";
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
    const contentWrap = document.createElement("div");
    contentWrap.style.flex = "1";
    contentWrap.style.overflowY = "auto";
    contentWrap.style.padding = "16px";
    contentWrap.style.boxSizing = "border-box";
    contentWrap.style.display = "flex";
    contentWrap.style.flexDirection = "column";
    contentWrap.style.alignItems = "center";
    const mainCard = document.createElement("div");
    mainCard.style.width = "100%";
    mainCard.style.maxWidth = "420px";
    mainCard.style.background = "transparent";
    mainCard.style.borderRadius = "14px";
    mainCard.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
    mainCard.style.overflow = "hidden";
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
    const cardContent = document.createElement("div");
    cardContent.style.padding = "16px";
    const chatTheme = Store.get("chatTheme", {avatarShape:"circle",timePos:"avatarBottom"});
    if (this.activeTab1 === "美化") {
      cardContent.innerHTML = `
      <style>
      .setting-row{
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:14px 0;
        border-bottom:1px solid #eee;
        cursor:pointer;
      }
      .row-label{font-size:14px;color:#222}
      .row-value{font-size:13px;color:#888;margin-left:auto}
      </style>
      <div class="setting-row" id="row-avatar-shape">
        <span class="row-label">头像形状</span>
        <span class="row-value">${chatTheme.avatarShape === "circle" ? "圆形" : "方形"} ></span>
      </div>
      <div class="setting-row" id="row-time-pos">
        <span class="row-label">消息时间位置</span>
        <span class="row-value">${
          {
            avatarBottom:"头像下方",
            bubbleOuter:"气泡外侧悬浮",
            hide:"隐藏时间"
          }[chatTheme.timePos]||"头像下方"
        } ></span>
      </div>
      `;
    } else if (this.activeTab1 === "功能" && this.activeTab2 === "形象") {
      const nick = this.contactInfo?.name || "默认";
      const hasAvatar = !!this.contactInfo?.avatar;
      const hasMyAvatar = !!this.contactInfo?.myAvatar;
      cardContent.innerHTML = `
      <style>
      .setting-row{
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:14px 0;
        border-bottom:1px solid #eee;
        cursor:pointer;
      }
      .row-label{font-size:14px;color:#222;display:flex;align-items:center;gap:8px}
      .row-value{font-size:13px;color:#888;margin-left:auto}
      .tip-text{font-size:12px;color:#999;padding:8px 0 12px}
      </style>
      <div class="tip-text">昵称与头像（聊天专用 · 与桌面各自独立，互不同步）</div>
       <div class="setting-row" id="row-contact-nick">
         <span class="row-label">联系人昵称</span>
         <span class="row-value">${nick} ></span>
       </div>
       <div class="setting-row" id="row-my-nick">
         <span class="row-label">我的昵称</span>
         <span class="row-value">${this.contactInfo?.myNick||"我"} ></span>
       </div>
       <div class="setting-row" id="row-contact-avatar">
         <span class="row-label">联系人头像</span>
         <span class="row-value">${hasAvatar ? "已设置" : "未设置"} ></span>
       </div>
       <div class="setting-row" id="row-clear-contact-avatar">
         <span class="row-label">清空联系人头像</span>
         <span class="row-value"></span>
       </div>
       <div class="setting-row" id="row-my-avatar">
         <span class="row-label">我的头像</span>
         <span class="row-value">${hasMyAvatar ? "已设置" : "未设置"} ></span>
       </div>
       <div class="setting-row" id="row-clear-my-avatar">
         <span class="row-label">清空我的头像</span>
         <span class="row-value"></span>
       </div>
       <input type="file" id="avatar-file" accept="image/*" style="display:none">
       <input type="file" id="my-avatar-file" accept="image/*" style="display:none">
       `;
    } else if(this.activeTab1 === "数据"){
      cardContent.innerHTML = `
      <style>
      .setting-row{
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:14px 0;
        border-bottom:1px solid #eee;
        cursor:pointer;
      }
      </style>
      <div class="setting-row" id="btn-clear-chat-log">
        <span>清空当前会话聊天记录</span>
        <span style="color:#f44336">></span>
      </div>
      `;
    } else {
      cardContent.innerHTML = `<div style="padding:30px 0;text-align:center;color:#888">页面待开发</div>`;
    }
    mainCard.appendChild(cardContent);
    contentWrap.appendChild(mainCard);
    wrap.appendChild(contentWrap);
    this.parentContainer.appendChild(wrap);
    document.getElementById("csub-back").onclick = () => {
      // 关闭面板时注销主题监听，防止内存泄漏
      if(typeof this._themeChangeOff === "function"){
        this._themeChangeOff();
      }
      if (typeof this.callbackBack === "function") {
        this.callbackBack();
      }
    };
    const rowAvatarShape = document.getElementById("row-avatar-shape");
    if(rowAvatarShape){
      rowAvatarShape.onclick = ()=>{
        this.openRadioModal("选择头像形状",
          [
            {label:"圆形",value:"circle"},
            {label:"方形",value:"square"}
          ],
          chatTheme.avatarShape,
          (val)=>{
            chatTheme.avatarShape = val;
            Store.set("chatTheme", chatTheme);
            EventBus.emit("chatThemeChange");
            this.render();
          }
        )
      }
    }
    const rowTimePos = document.getElementById("row-time-pos");
    if(rowTimePos){
      rowTimePos.onclick = ()=>{
        this.openRadioModal("选择消息时间位置",
          [
            {label:"头像下方",value:"avatarBottom"},
            {label:"气泡外侧悬浮",value:"bubbleOuter"},
            {label:"隐藏时间",value:"hide"}
          ],
          chatTheme.timePos,
          (val)=>{
            chatTheme.timePos = val;
            Store.set("chatTheme", chatTheme);
            EventBus.emit("chatThemeChange");
            this.render();
          }
        )
      }
    }
    const btnClearChatLog = document.getElementById("btn-clear-chat-log");
    if(btnClearChatLog){
      btnClearChatLog.onclick = ()=>{
        if(!confirm("确定清空当前联系人全部聊天记录？不可恢复！")) return;
        Store.set(`chat-contact-${this.contactId}`,[]);
        EventBus.emit("chatLogClear", this.contactId);
        Toast.show("聊天记录已清空");
        this.render();
      }
    }
    const rowContactNick = document.getElementById("row-contact-nick");
    if(rowContactNick){
      rowContactNick.onclick = ()=>{
        const newName = prompt("输入联系人昵称", this.contactInfo?.name || "");
        if(newName === null) return;
        const trimName = newName.trim();
        if(!trimName){
          Toast.show("昵称不能为空");
          return;
        }
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        if(idx !== -1){
          list[idx].name = trimName;
          Store.set("contactList", list);
          this.contactInfo = list[idx];
          EventBus.emit("contactInfoChange", this.contactId);
          // 插入聊天系统记录
          if(window.ChatModule && window.ChatModule.activeContactId === this.contactId){
            window.ChatModule.pushSystemNotice(`我更换了TA的昵称为：${trimName}`);
          }
          Toast.show("昵称已更新，全部界面同步刷新");
          this.render();
        }
      }
    }
    const rowContactAvatar = document.getElementById("row-contact-avatar");
    const fileInput = document.getElementById("avatar-file");
    if(rowContactAvatar && fileInput){
      rowContactAvatar.onclick = ()=> fileInput.click();
      fileInput.onchange = (ev)=>{
        const file = ev.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (res)=>{
          const base64Img = res.target.result;
          const list = Store.get("contactList",[]);
          const idx = list.findIndex(x=>x.id === this.contactId);
          if(idx !== -1){
            list[idx].avatar = base64Img;
            Store.set("contactList", list);
            this.contactInfo = list[idx];
            EventBus.emit("contactInfoChange", this.contactId);
            // 插入聊天系统记录
            if(window.ChatModule && window.ChatModule.activeContactId === this.contactId){
              window.ChatModule.pushSystemNotice("我更换了TA的头像");
            }
            Toast.show("联系人头像已更新，全部界面同步刷新");
            this.render();
          }
        }
        reader.readAsDataURL(file);
      }
    }
    const rowClearContactAvatar = document.getElementById("row-clear-contact-avatar");
    if(rowClearContactAvatar){
      rowClearContactAvatar.onclick = ()=>{
        if(!confirm("确认清空联系人头像？")) return;
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        if(idx !== -1){
          delete list[idx].avatar;
          Store.set("contactList", list);
          this.contactInfo = list[idx];
          EventBus.emit("contactInfoChange", this.contactId);
          // 插入聊天系统记录
          if(window.ChatModule && window.ChatModule.activeContactId === this.contactId){
            window.ChatModule.pushSystemNotice("我清空了TA的头像");
          }
          Toast.show("联系人头像已清空");
          this.render();
        }
      }
    }
    // ==========【新增：我的昵称、我的头像、清空我的头像事件绑定】==========
    const rowMyNick = document.getElementById("row-my-nick");
    if(rowMyNick){
      rowMyNick.onclick = ()=>{
        const oldVal = this.contactInfo?.myNick || "我";
        const newName = prompt("输入我的聊天昵称", oldVal);
        if(newName === null) return;
        const trimName = newName.trim();
        if(!trimName){
          Toast.show("昵称不能为空");
          return;
        }
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        if(idx !== -1){
          list[idx].myNick = trimName;
          Store.set("contactList", list);
          this.contactInfo = list[idx];
          EventBus.emit("contactInfoChange", this.contactId);
          // 插入聊天系统记录
          if(window.ChatModule && window.ChatModule.activeContactId === this.contactId){
            window.ChatModule.pushSystemNotice(`我更换了自己的昵称为：${trimName}`);
          }
          Toast.show("我的昵称已更新，全部界面同步刷新");
          this.render();
        }
      }
    }
    const rowMyAvatar = document.getElementById("row-my-avatar");
    const myAvatarFileInput = document.getElementById("my-avatar-file");
    if(rowMyAvatar && myAvatarFileInput){
      rowMyAvatar.onclick = ()=> myAvatarFileInput.click();
      myAvatarFileInput.onchange = (ev)=>{
        const file = ev.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (res)=>{
          const base64Img = res.target.result;
          const list = Store.get("contactList",[]);
          const idx = list.findIndex(x=>x.id === this.contactId);
          if(idx !== -1){
            list[idx].myAvatar = base64Img;
            Store.set("contactList", list);
            this.contactInfo = list[idx];
            EventBus.emit("contactInfoChange", this.contactId);
            // 插入聊天系统记录
            if(window.ChatModule && window.ChatModule.activeContactId === this.contactId){
              window.ChatModule.pushSystemNotice("我更换了自己的头像");
            }
            Toast.show("我的头像已更新，全部界面同步刷新");
            this.render();
          }
        }
        reader.readAsDataURL(file);
      }
    }
    const rowClearMyAvatar = document.getElementById("row-clear-my-avatar");
    if(rowClearMyAvatar){
      rowClearMyAvatar.onclick = ()=>{
        if(!confirm("确认清空【我的头像】？")) return;
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        if(idx !== -1){
          delete list[idx].myAvatar;
          Store.set("contactList", list);
          this.contactInfo = list[idx];
          EventBus.emit("contactInfoChange", this.contactId);
          // 插入聊天系统记录
          if(window.ChatModule && window.ChatModule.activeContactId === this.contactId){
            window.ChatModule.pushSystemNotice("我清空了自己的头像");
          }
          Toast.show("我的头像已清空");
          this.render();
        }
      }
    }
  }
};
