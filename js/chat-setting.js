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
  open(parentDom, cid, cbBack) {
    this.parentContainer = parentDom;
    this.contactId = cid;
    const list = Store.get("contactList", []);
    this.contactInfo = list.find(i => i.id === this.contactId);
    this.callbackBack = cbBack;
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
      itemDiv.style.justifyContent = "space‑between";
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
    wrap.style.height = "auto";
    wrap.style.background = "transparent";
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "10px";
    header.style.padding = "14px 16px";
    header.style.borderBottom = "1px solid rgba(128,128,128,0.15)";
    header.style.background = "transparent";
    header.innerHTML = `
      <button id="csub‑back" style="border:none;background:none;font‑size:20px;cursor:pointer">←</button>
      <span style="font‑size:18px;font‑weight:500;color:#222">聊天设置</span>
    `;
    wrap.appendChild(header);
    const contentWrap = document.createElement("div");
    contentWrap.style.padding = "16px";
    contentWrap.style.boxSizing = "border‑box";
    const mainCard = document.createElement("div");
    mainCard.style.width = "100%";
    mainCard.style.maxWidth = "420px";
    mainCard.style.background = "transparent";
    mainCard.style.borderRadius = "14px";
    mainCard.style.overflow = "hidden";
    const tab1Wrap = document.createElement("div");
    tab1Wrap.style.display = "flex";
    tab1Wrap.style.borderBottom = "1px solid rgba(128,128,128,0.15)";
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
      tab2Wrap.style.borderBottom = "1px solid rgba(128,128,128,0.15)";
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
    cardContent.style.padding = "0 16px 16px 16px";
    const chatTheme = Store.get("chatTheme", {avatarShape:"circle",timePos:"avatarBottom"});
    if (this.activeTab1 === "美化") {
      cardContent.innerHTML = `
      <style>
      .setting‑row{
        display:flex;
        justify‑content:space‑between;
        align‑items:center;
        padding:16px 0;
        border‑bottom:1px solid rgba(128,128,128,0.15);
        cursor:pointer;
      }
      .row‑label{font‑size:14px;color:#222}
      .row‑value{font‑size:13px;color:#888;margin‑left:auto}
      </style>
      <div class="setting‑row" id="row‑avatar‑shape">
        <span class="row‑label">头像形状</span>
        <span class="row‑value">${chatTheme.avatarShape === "circle" ? "圆形" : "方形"} ></span>
      </div>
      <div class="setting‑row" id="row‑time‑pos">
        <span class="row‑label">消息时间位置</span>
        <span class="row‑value">${
          {
            avatarBottom:"头像下方",
            bubbleBottom:"气泡下方",
            bubbleOuter:"气泡外侧悬浮",
            topCenter:"消息上方居中",
            divider:"时间分隔线",
            hide:"隐藏时间"
          }[chatTheme.timePos]
        } ></span>
      </div>
      `;
    } else if (this.activeTab1 === "功能" && this.activeTab2 === "形象") {
      const nick = this.contactInfo?.name || "默认";
      const myNick = this.contactInfo?.myNick || "我";
      const hasAvatar = !!this.contactInfo?.avatar;
      const hasMyAvatar = !!this.contactInfo?.myAvatar;
      cardContent.innerHTML = `
      <style>
      .setting‑row{
        display:flex;
        justify‑content:space‑between;
        align‑items:center;
        padding:16px 0;
        border‑bottom:1px solid rgba(128,128,128,0.15);
        cursor:pointer;
      }
      .row‑label{font‑size:14px;color:#222;display:flex;align‑items:center;gap:8px}
      .row‑value{font‑size:13px;color:#888;margin‑left:auto}
      .tip‑text{font‑size:12px;color:#666;padding:12px 0}
      </style>
      <div class="tip‑text">昵称与头像（聊天专用 · 与桌面各自独立，互不同步）</div>
      <div class="setting‑row" id="row‑contact‑nick">
        <span class="row‑label">联系人昵称</span>
        <span class="row‑value">${nick} ></span>
      </div>
      <div class="setting‑row" id="row‑my‑nick">
        <span class="row‑label">我的昵称</span>
        <span class="row‑value">${myNick} ></span>
      </div>
      <div class="setting‑row" id="row‑contact‑avatar">
        <span class="row‑label">联系人头像</span>
        <span class="row‑value">${hasAvatar ? "已设置" : "未设置"} ></span>
      </div>
      <div class="setting‑row" id="row‑clear‑contact‑avatar">
        <span class="row‑label">清空联系人头像</span>
        <span class="row‑value"></span>
      </div>
      <div class="setting‑row" id="row‑my‑avatar">
        <span class="row‑label">我的头像</span>
        <span class="row‑value">${hasMyAvatar ? "已设置" : "未设置"} ></span>
      </div>
      <div class="setting‑row" id="row‑clear‑my‑avatar">
        <span class="row‑label">清空我的头像</span>
        <span class="row‑value"></span>
      </div>
      <input type="file" id="avatar‑file" accept="image/*" style="display:none">
      <input type="file" id="myavatar‑file" accept="image/*" style="display:none">
      `;
    } else if(this.activeTab1 === "数据"){
      cardContent.innerHTML = `
      <div style="padding‑top:10px">
        <div style="font‑weight:bold;font‑size:14px;margin‑bottom:12px">会话数据操作</div>
        <div style="font‑size:12px;color:#777;margin‑bottom:12px">仅清空当前联系人聊天记录；不会删除头像库、昵称库与联系人配置</div>
        <button id="btn‑clear‑chat‑log" style="width:100%;padding:9px;background:#c92a2a;color:#fff;border:none;border‑radius:8px">清空当前会话聊天记录</button>
      </div>
      `;
    } else {
      cardContent.innerHTML = `<div style="padding:30px 0;text‑align:center;color:#888">页面待开发</div>`;
    }
    mainCard.appendChild(cardContent);
    contentWrap.appendChild(mainCard);
    wrap.appendChild(contentWrap);
    this.parentContainer.appendChild(wrap);
    document.getElementById("csub‑back").onclick = () => {
      if (typeof this.callbackBack === "function") {
        this.callbackBack();
      }
    };
    // =========美化tab事件======
    const rowAvatarShape = document.getElementById("row‑avatar‑shape");
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
    const rowTimePos = document.getElementById("row‑time‑pos");
    if(rowTimePos){
      rowTimePos.onclick = ()=>{
        this.openRadioModal("选择消息时间位置",
          [
            {label:"头像下方",value:"avatarBottom"},
            {label:"气泡下方",value:"bubbleBottom"},
            {label:"气泡外侧悬浮",value:"bubbleOuter"},
            {label:"消息上方居中",value:"topCenter"},
            {label:"时间分隔线",value:"divider"},
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
    // ======形象tab：联系人昵称======
    const rowContactNick = document.getElementById("row‑contact‑nick");
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
          Toast.show("昵称已更新，聊天页实时刷新");
          this.render();
        }
      }
    }
    // ======形象tab：我的昵称======
    const rowMyNick = document.getElementById("row‑my‑nick");
    if(rowMyNick){
      rowMyNick.onclick = ()=>{
        const newName = prompt("输入我的昵称", this.contactInfo?.myNick || "我");
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
          Toast.show("我的昵称已更新");
          this.render();
        }
      }
    }
    // ======形象tab：联系人头像======
    const rowContactAvatar = document.getElementById("row‑contact‑avatar");
    const fileInput = document.getElementById("avatar‑file");
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
            Toast.show("头像已更新，聊天页实时刷新");
            this.render();
          }
        }
        reader.readAsDataURL(file);
      }
    }
    // ======形象tab：清空联系人头像======
    const rowClearContactAvatar = document.getElementById("row‑clear‑contact‑avatar");
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
          Toast.show("头像已清空");
          this.render();
        }
      }
    }
    // ======形象tab：我的头像======
    const rowMyAvatar = document.getElementById("row‑my‑avatar");
    const myFileInput = document.getElementById("myavatar‑file");
    if(rowMyAvatar && myFileInput){
      rowMyAvatar.onclick = ()=> myFileInput.click();
      myFileInput.onchange = (ev)=>{
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
            Toast.show("我的头像已更新");
            this.render();
          }
        }
        reader.readAsDataURL(file);
      }
    }
    // ======形象tab：清空我的头像======
    const rowClearMyAvatar = document.getElementById("row‑clear‑my‑avatar");
    if(rowClearMyAvatar){
      rowClearMyAvatar.onclick = ()=>{
        if(!confirm("确认清空我的头像？")) return;
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        if(idx !== -1){
          delete list[idx].myAvatar;
          Store.set("contactList", list);
          this.contactInfo = list[idx];
          EventBus.emit("contactInfoChange", this.contactId);
          Toast.show("我的头像已清空");
          this.render();
        }
      }
    }
    // =========【数据tab】清空会话记录====
    const btnClearChatLog = document.getElementById("btn‑clear‑chat‑log");
    if(btnClearChatLog){
      btnClearChatLog.onclick = ()=>{
        if(!confirm("确定清空当前联系人全部聊天记录？不可恢复！")) return;
        Store.set(`chat‑contact‑${this.contactId}`,[]);
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        this.contactInfo = list[idx];
        Toast.show("聊天记录已清空，请返回聊天页");
        this.render();
      }
    }
  }
};
