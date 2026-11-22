import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';
import { ChatSettingSubModule } from './chat-setting.js';
import { ChatExtendPanel } from './chat-extend-panel.js';

export const ChatModule = {
  rootEl: null,
  msgListEl: null,
  inputEl: null,
  activeContactId: null,
  activeContactInfo: null,
  messageList: [],
  isTyping: false,
  viewMode: "chat",
  primaryColor: "#7c68ee",
  bgColor: "#ffffff",

  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("聊天容器找不到", containerSelector);
      return;
    }
    const theme = Store.get("app-theme", {});
    this.primaryColor = theme.colorMain || "#7c68ee";
    this.bgColor = theme.colorBg || "#ffffff";
    this.render();
    document.addEventListener("contact:change", (ev) => {
      this.loadContactSession(ev.detail);
    });
    const initCid = Store.get("activeContactId");
    if(initCid){
      this.loadContactSession(initCid);
    }
    EventBus.on("themeChange", (theme) => {
      this.primaryColor = theme.colorMain || "#7c68ee";
      this.bgColor = theme.colorBg || "#ffffff";
      if(this.viewMode === "chat") this.renderChatLayout();
    });
    EventBus.on("chatThemeChange", ()=>{
      this.renderMessages();
    });
    EventBus.on("contactInfoChange", (cid)=>{
      if(cid === this.activeContactId){
        const list = Store.get("contactList",[]);
        this.activeContactInfo = list.find(item=>item.id === cid);
        this.renderMessages();
      }
    });
    EventBus.on("chatLogClear", (cid)=>{
      if(cid === this.activeContactId){
        this.messageList = [];
        this.saveHistory();
        this.renderMessages();
      }
    });
  },

  executeApply(apply, contactObj){
    switch(apply.targetType){
      case "taAvatar":
        contactObj.avatar = apply.newVal;
        break;
      case "taNick":
        contactObj.name = apply.newVal;
        break;
      case "myAvatar":
        contactObj.myAvatar = apply.newVal;
        break;
      case "myNick":
        contactObj.myNick = apply.newVal;
        break;
    }
  },

  // ========== 升级：系统通知，支持附加图片 ==========
  pushSystemNotice(text, imageUrl = null) {
    this.messageList.push({
      type: "notice",
      content: text,
      imageUrl: imageUrl, // 增加图片字段
      time: Date.now()
    });
    this.saveHistory();
    this.renderMessages();
  },

  pushNoticeMessage(text, from="me"){
    this.pushSystemNotice(text);
  },

  loadContactSession(contactId) {
    const contactList = Store.get("contactList", []);
    const findItem = contactList.find(c => c.id === contactId);
    if(!findItem){
      this.activeContactId = null;
      this.activeContactInfo = null;
      this.messageList = [];
      this.render();
      return;
    }
    this.activeContactId = contactId;
    this.activeContactInfo = findItem;
    if(!this.activeContactInfo.taAvatarPool) this.activeContactInfo.taAvatarPool = [];
    if(!this.activeContactInfo.myAvatarPool) this.activeContactInfo.myAvatarPool = [];
    if(!this.activeContactInfo.taNickPool) this.activeContactInfo.taNickPool = [];
    if(!this.activeContactInfo.myNickPool) this.activeContactInfo.myNickPool = [];
    if(!this.activeContactInfo.pendingApplyList) this.activeContactInfo.pendingApplyList = [];
    if(!this.activeContactInfo.taAvatarRandom) this.activeContactInfo.taAvatarRandom = {enable:false,minHour:2,maxHour:6,lastTriggerTs:0};
    if(!this.activeContactInfo.taNickRandom) this.activeContactInfo.taNickRandom = {enable:false,minHour:2,maxHour:6,lastTriggerTs:0};
    if(!this.activeContactInfo.myAvatarRandom) this.activeContactInfo.myAvatarRandom = {enable:false,minHour:2,maxHour:6,lastTriggerTs:0};
    if(!this.activeContactInfo.myNickRandom) this.activeContactInfo.myNickRandom = {enable:false,minHour:2,maxHour:6,lastTriggerTs:0};
    if(!this.activeContactInfo.taApplyIntervalHours) this.activeContactInfo.taApplyIntervalHours = 4;
    this.messageList = Store.get(`chat-contact-${contactId}`, []);
    this.render();
    Toast.show(`进入对话：${findItem.name}`);
  },

  render() {
    if(this.viewMode === "setting"){
      ChatSettingSubModule.open(this.rootEl, this.activeContactId, ()=>{
        this.viewMode = "chat";
        this.render();
      });
      return;
    }
    this.renderChatLayout();
  },

  renderChatLayout() {
    if (!this.rootEl) return;
    this.rootEl.innerHTML = "";
    const wrap = document.createElement('div');
    wrap.style.height = "100%";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.background = this.bgColor;
    wrap.style.position = "relative";
    wrap.style.overflow = "hidden";
    const chatHeader = document.createElement("div");
    chatHeader.style.padding = "10px 12px";
    chatHeader.style.display = "flex";
    chatHeader.style.justifyContent = "space-between";
    chatHeader.style.alignItems = "center";
    chatHeader.style.borderBottom = "1px solid #e5e5e5";
    chatHeader.style.background = this.bgColor;
    chatHeader.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <button id="chat-back-btn" style="width:32px;height:32px;border-radius:50%;border:1px solid #ddd;background:${this.bgColor};">←</button>
        <img id="chat-header-avatar" src="" style="width:36px;height:36px;object-fit:cover;background:#eee">
        <div id="chat-title" style="font-weight:bold;color:#222">未选择联系人</div>
      </div>
      <button id="chat-more-btn" style="width:32px;height:32px;border-radius:50%;border:1px solid #ddd;background:${this.bgColor};font-size:18px">⋯</button>
    `;
    wrap.appendChild(chatHeader);
    this.msgListEl = document.createElement('div');
    this.msgListEl.style.flex = "1";
    this.msgListEl.style.overflowY = "auto";
    this.msgListEl.style.scrollbarWidth = "none";
    this.msgListEl.style.msOverflowStyle = "none";
    this.msgListEl.style.padding = "12px";
    this.msgListEl.style.boxSizing = "border-box";
    this.msgListEl.id = "msg-list";
    const styleHideScroll = document.createElement("style");
    styleHideScroll.textContent = `#msg-list::-webkit-scrollbar{display:none}`;
    document.head.appendChild(styleHideScroll);

    const inputWrap = document.createElement('div');
    inputWrap.style.padding = "10px 12px";
    inputWrap.style.borderTop = "1px solid #e5e5e5";
    inputWrap.style.display = "flex";
    inputWrap.style.gap = "8px";
    inputWrap.style.background = this.bgColor;
    const extendBtn = document.createElement("button");
    extendBtn.id = "chat-extend-btn";
    extendBtn.innerText = "···";
    extendBtn.style.border = "none";
    extendBtn.style.background = "transparent";
    extendBtn.style.fontSize = "20px";
    extendBtn.style.cursor = "pointer";
    extendBtn.style.padding = "0 4px";
    this.inputEl = document.createElement('input');
    this.inputEl.style.flex = "1";
    this.inputEl.style.padding = "10px 12px";
    this.inputEl.style.border = "1px solid #ddd";
    this.inputEl.style.borderRadius = "999px";
    this.inputEl.style.background = "#f6f6f6";
    this.inputEl.style.outline = "none";
    this.inputEl.placeholder = "说点什么...";
    const sendBtn = document.createElement('button');
    sendBtn.innerText = "发送";
    sendBtn.style.padding = "10px 16px";
    sendBtn.style.border = "none";
    sendBtn.style.borderRadius = "999px";
    sendBtn.style.background = this.primaryColor;
    sendBtn.style.color = "#fff";
    sendBtn.onclick = () => this.sendMessage();
    this.inputEl.onkeydown = (e) => {
      if (e.key === "Enter") this.sendMessage();
    };
    inputWrap.appendChild(extendBtn);
    inputWrap.appendChild(this.inputEl);
    inputWrap.appendChild(sendBtn);
    wrap.appendChild(this.msgListEl);
    wrap.appendChild(inputWrap);
    this.rootEl.appendChild(wrap);
    document.getElementById("chat-more-btn").onclick = ()=>{
      if(!this.activeContactId){
        Toast.show("请先选中联系人");
        return;
      }
      this.viewMode = "setting";
      this.render();
    };
    document.getElementById("chat-back-btn").onclick = ()=>{
      if(window.TabManager){
        window.TabManager.switchTab("setting");
      }
      Toast.show("返回联系人列表");
    };
    document.getElementById("chat-extend-btn").onclick = ()=>{
      if(!this.activeContactId){
        Toast.show("请先选中联系人");
        return;
      }
      ChatExtendPanel.open(this.rootEl, this.activeContactId, ()=>{});
    };
    this.renderMessages();
  },

  updateContact(patch){
    const list = Store.get("contactList", []);
    const idx = list.findIndex(x=>x.id === this.activeContactId);
    if(idx === -1) return;
    list[idx] = {...list[idx], ...patch};
    Store.set("contactList", list);
    this.activeContactInfo = list[idx];
    this.renderMessages();
    Toast.show("已更新");
  },

  renderMessages() {
    const titleDom = document.getElementById("chat-title");
    const avatarDom = document.getElementById("chat-header-avatar");
    if(titleDom && avatarDom){
      if(this.activeContactInfo){
        titleDom.innerText = this.activeContactInfo.name;
        avatarDom.src = this.activeContactInfo.avatar || "";
      }else{
        titleDom.innerText = "未选择联系人";
        avatarDom.src = "";
      }
    }
    if (!this.msgListEl) return;
    this.msgListEl.innerHTML = "";
    let chatTheme = Store.get("chatTheme", {avatarShape:"circle",timePos:"avatarBottom"});
    const allowTimePos = ["avatarBottom","bubbleOuter","hide"];
    if(!allowTimePos.includes(chatTheme.timePos)){
      chatTheme.timePos = "avatarBottom";
      Store.set("chatTheme",chatTheme);
    }
    const avatarRadius = chatTheme.avatarShape === "circle" ? "50%" : "8px";
    const timePos = chatTheme.timePos;
    const headerAvatar = document.getElementById("chat-header-avatar");
    if(headerAvatar){
      headerAvatar.style.borderRadius = avatarRadius;
    }
    if (!this.activeContactId) {
      this.msgListEl.innerHTML = `<div style="text-align:center;margin-top:40px;color:#777">请前往设置选择一个梦角联系人开始对话</div>`;
      return;
    }
    if (this.messageList.length === 0) {
      this.msgListEl.innerHTML = `<div style="text-align:center;margin-top:40px;color:#777">暂无消息，发送第一条消息吧</div>`;
      return;
    }
    const myCurrentAvatar = this.activeContactInfo?.myAvatar || "";

    this.messageList.forEach(msg => {
      // ========== 升级：系统通知消息，支持带图片的卡片样式 ==========
      if(msg.type === "notice"){
        const noticeEl = document.createElement("div");
        noticeEl.style.margin = "10px auto";
        noticeEl.style.padding = "12px 16px";
        noticeEl.style.background = "#f3f4f6";
        noticeEl.style.borderRadius = "12px";
        noticeEl.style.display = "flex";
        noticeEl.style.flexDirection = "column";
        noticeEl.style.alignItems = "center";
        noticeEl.style.justifyContent = "center";
        noticeEl.style.maxWidth = "85%";
        noticeEl.style.wordBreak = "break-all";
        noticeEl.style.width = "fit-content"; // 宽度自适应内容
        noticeEl.style.minWidth = "120px";

        if (msg.imageUrl) {
          // 带图片卡片：文字在上，图片在下
          const textEl = document.createElement("div");
          textEl.style.fontSize = "13px";
          textEl.style.color = "#4b5563";
          textEl.style.marginBottom = "8px";
          textEl.style.textAlign = "center";
          textEl.textContent = msg.content;
          noticeEl.appendChild(textEl);

          const imgEl = document.createElement("img");
          imgEl.src = msg.imageUrl;
          imgEl.style.width = "56px";
          imgEl.style.height = "56px";
          imgEl.style.borderRadius = "8px"; 
          imgEl.style.objectFit = "cover";
          imgEl.style.display = "block";
          noticeEl.appendChild(imgEl);
        } else {
          // 纯文本通知
          noticeEl.style.fontSize = "13px";
          noticeEl.style.color = "#4b5563";
          noticeEl.style.textAlign = "center";
          noticeEl.textContent = msg.content;
        }
        this.msgListEl.appendChild(noticeEl);
        return;
      }
      // ==================================================================

      const d = new Date(msg.time);
      const hh = String(d.getHours()).padStart(2,'0');
      const mm = String(d.getMinutes()).padStart(2,'0');
      const ss = String(d.getSeconds()).padStart(2,'0');
      const timeStr = `${hh}:${mm}:${ss}`;
      const msgItem = document.createElement("div");
      msgItem.style.marginBottom = "14px";
      msgItem.style.display = "flex";
      msgItem.style.alignItems = "flex-start";

      if(timePos === "avatarBottom"){
        if(msg.role === "user"){
          msgItem.style.justifyContent = "flex-end";
          msgItem.innerHTML = `
            <div style="max-width:70%">
              <div style="background:#fff;color:#222;padding:8px 12px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);word-break:break-all">${msg.content}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;margin-left:8px">
              <img src="${myCurrentAvatar}" style="width:34px;height:34px;border-radius:${avatarRadius};background:#eee;object-fit:cover">
              <div style="font-size:11px;color:#999;margin-top:4px">${timeStr}</div>
            </div>
          `;
        }else{
          msgItem.style.justifyContent = "flex-start";
          msgItem.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;margin-right:8px">
              <img src="${this.activeContactInfo.avatar || ''}" style="width:34px;height:34px;border-radius:${avatarRadius};background:#eee;object-fit:cover">
              <div style="font-size:11px;color:#999;margin-top:4px">${timeStr}</div>
            </div>
            <div style="max-width:70%">
              <div style="background:#222;color:#fff;padding:8px 12px;border-radius:12px;word-break:break-all">${msg.content}</div>
            </div>
          `;
        }
      }else{
        let timeHtml = "";
        if(timePos === "hide") timeHtml = "";
        else if(timePos === "bubbleOuter"){
          timeHtml = `<div style="font-size:11px;color:#999;margin-left:6px;align-self:flex-end;white-space:nowrap">${timeStr}</div>`;
        }
        if(msg.role === "user"){
          msgItem.style.justifyContent = "flex-end";
          msgItem.style.alignItems = "flex-end";
          msgItem.innerHTML = `
            <div style="display:flex;flex-direction:row-reverse;align-items:flex-end;gap:6px">
              <img src="${myCurrentAvatar}" style="width:34px;height:34px;border-radius:${avatarRadius};background:#eee;object-fit:cover;flex-shrink:0">
              <div style="max-width:70%;display:flex;flex-direction:column;align-items:flex-end">
                <div style="background:#fff;color:#222;padding:8px 12px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);word-break:break-all">${msg.content}</div>
              </div>
              ${timePos==="bubbleOuter"?timeHtml:""}
            </div>
          `;
        }else{
          msgItem.style.justifyContent = "flex-start";
          msgItem.style.alignItems = "flex-end";
          msgItem.innerHTML = `
            <div style="display:flex;align-items:flex-end;gap:6px">
              <img src="${this.activeContactInfo.avatar || ''}" style="width:34px;height:34px;border-radius:${avatarRadius};background:#eee;object-fit:cover;flex-shrink:0">
              <div style="max-width:70%;display:flex;flex-direction:column;align-items:flex-start">
                <div style="background:#222;color:#fff;padding:8px 12px;border-radius:12px;word-break:break-all">${msg.content}</div>
              </div>
              ${timePos==="bubbleOuter"?timeHtml:""}
            </div>
          `;
        }
      }
      this.msgListEl.appendChild(msgItem);
    });

    if(this.isTyping){
      const tip = document.createElement("div");
      tip.style.color="#777";
      tip.style.fontSize="13px";
      tip.textContent = `${this.activeContactInfo.name} 正在输入...`;
      this.msgListEl.appendChild(tip);
    }
    this.msgListEl.scrollTop = this.msgListEl.scrollHeight;
  },

  sendMessage() {
    const content = this.inputEl.value.trim();
    if (!content) return;
    if(this.activeContactId){
      this.messageList.push({
        role: "user",
        content,
        time: Date.now()
      });
      this.saveHistory();
    }
    this.inputEl.value = "";
    this.renderMessages();
    if(!this.activeContactId){
      Toast.show("提示：未选中联系人，消息不会保存");
      return;
    }
    this.isTyping = true;
    this.renderMessages();
    setTimeout(()=>{
      this.isTyping = false;
      this.messageList.push({
        role: "bot",
        content: `${content}`,
        time: Date.now()
      });
      this.saveHistory();
      this.renderMessages();
    },1200);
  },

  saveHistory() {
    if(!this.activeContactId) return;
    Store.set(`chat-contact-${this.activeContactId}`, this.messageList);
  }
};
