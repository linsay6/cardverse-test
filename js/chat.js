import { Store } from './core/store.js';
import { EventBus } from './core/context.js';
import { Toast } from './core/toast.js';
import { ChatSettingSubModule } from './chat-setting.js';

export const ChatModule = {
  rootEl: null,
  msgListEl: null,
  inputEl: null,
  activeContactId: null,
  activeContactInfo: null,
  messageList: [],
  isTyping: false,
  viewMode: "chat",
  applyCheckTimer: null,

   init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("聊天容器找不到", containerSelector);
      return;
    }
    this.render();
    document.addEventListener("contact:change", (ev) => {
      this.loadContactSession(ev.detail);
    });
    const initCid = Store.get("activeContactId");
    if(initCid){
      this.loadContactSession(initCid);
    }
    EventBus.on("themeChange", () => {
      if(this.viewMode === "chat") this.renderMessages();
    });
    EventBus.on("chatThemeChange", ()=>{
      this.renderMessages();
    });
    // 监听联系人信息变更：头像、昵称修改后实时刷新聊天UI
    EventBus.on("contactInfoChange", (cid)=>{
      if(cid === this.activeContactId){
        const list = Store.get("contactList",[]);
        this.activeContactInfo = list.find(item=>item.id === cid);
        this.renderMessages();
      }
    });
    // 启动申请超时检测定时器 30s扫描一次
    this.applyCheckTimer = setInterval(()=>{
      this.checkPendingApply();
    },30000);
  },

  // 检查待处理申请，处理超时自动同意
  checkPendingApply(){
    if(!this.activeContactId) return;
    const list = Store.get("contactList",[]);
    const idx = list.findIndex(i=>i.id === this.activeContactId);
    if(idx === -1) return;
    const contact = list[idx];
    if(!Array.isArray(contact.pendingApplyList)) return;

    const now = Date.now();
    let changed = false;
    contact.pendingApplyList = contact.pendingApplyList.filter(apply=>{
      if(apply.status !== "pending") return true;
      // 超时：超过expireMs，自动同意
      if(now > apply.createTs + apply.expireMs){
        apply.status = "autoAccept";
        this.executeApply(apply, contact);
        changed = true;
        // 写入notice消息
        this.pushNoticeMessage(`申请超时未处理，已自动同意：${apply.desc}`);
        return false;
      }
      return true;
    });
    if(changed){
      Store.set("contactList",list);
      this.activeContactInfo = contact;
      this.renderMessages();
    }
  },

  // 执行申请变更，修改对应头像/昵称
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

  // 插入通知类型消息
  pushNoticeMessage(text){
    this.messageList.push({
      type:"notice",
      content:text,
      time:Date.now()
    });
    this.saveHistory();
    this.renderMessages();
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
    // 初始化池子，兼容旧联系人数据
    if(!this.activeContactInfo.taAvatarPool) this.activeContactInfo.taAvatarPool = [];
    if(!this.activeContactInfo.myAvatarPool) this.activeContactInfo.myAvatarPool = [];
    if(!this.activeContactInfo.taNickPool) this.activeContactInfo.taNickPool = [];
    if(!this.activeContactInfo.myNickPool) this.activeContactInfo.myNickPool = [];
    if(!this.activeContactInfo.pendingApplyList) this.activeContactInfo.pendingApplyList = [];
    if(!this.activeContactInfo.taAvatarRandom) this.activeContactInfo.taAvatarRandom = {enable:false,intervalHour:4,lastChangeTs:0};
    if(!this.activeContactInfo.taNickRandom) this.activeContactInfo.taNickRandom = {enable:false,intervalHour:4,lastChangeTs:0};
    if(!this.activeContactInfo.myAvatarRandom) this.activeContactInfo.myAvatarRandom = {enable:false,intervalHour:4,lastChangeTs:0};
    if(!this.activeContactInfo.myNickRandom) this.activeContactInfo.myNickRandom = {enable:false,intervalHour:4,lastChangeTs:0};

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
    wrap.style.background = "#f7f7f7";
    const chatHeader = document.createElement("div");
    chatHeader.style.padding = "10px 12px";
    chatHeader.style.display = "flex";
    chatHeader.style.justifyContent = "space-between";
    chatHeader.style.alignItems = "center";
    chatHeader.style.borderBottom = "1px solid #e5e5e5";
    chatHeader.style.background = "#fff";
    chatHeader.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <button id="chat-back-btn" style="width:32px;height:32px;border-radius:50%;border:1px solid #ddd;background:#fff;">←</button>
        <img id="chat-header-avatar" src="" style="width:36px;height:36px;object-fit:cover;background:#eee">
        <div id="chat-title" style="font-weight:bold;color:#222">未选择联系人</div>
      </div>
      <button id="chat-more-btn" style="width:32px;height:32px;border-radius:50%;border:1px solid #ddd;background:#fff;font-size:18px">⋯</button>
    `;
    wrap.appendChild(chatHeader);
    this.msgListEl = document.createElement('div');
    this.msgListEl.style.flex = "1";
    this.msgListEl.style.overflowY = "auto";
    this.msgListEl.style.padding = "12px";
    this.msgListEl.style.boxSizing = "border-box";
    const inputWrap = document.createElement('div');
    inputWrap.style.padding = "10px 12px";
    inputWrap.style.borderTop = "1px solid #e5e5e5";
    inputWrap.style.display = "flex";
    inputWrap.style.gap = "8px";
    inputWrap.style.background = "#fff";
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
    sendBtn.style.background = "#673ab7";
    sendBtn.style.color = "#fff";
    sendBtn.onclick = () => this.sendMessage();
    this.inputEl.onkeydown = (e) => {
      if (e.key === "Enter") this.sendMessage();
    };
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
    const theme = Store.get("chatTheme", {avatarShape:"circle",timePos:"avatarBottom"});
    const avatarRadius = theme.avatarShape === "circle" ? "50%" : "8px";
    const timePos = theme.timePos;

    // 同步顶部头部头像圆角
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
    // 我方头像：实时读取当前配置，历史消息统一跟随设置变化
    const myCurrentAvatar = this.activeContactInfo?.myAvatar || "";

    this.messageList.forEach(msg => {
      // notice通知消息渲染，灰色居中通栏，区别普通气泡
      if(msg.type === "notice"){
        const noticeEl = document.createElement("div");
        noticeEl.style.margin="10px 0";
        noticeEl.style.padding="8px 12px";
        noticeEl.style.background="#eeeeee";
        noticeEl.style.borderRadius="8px";
        noticeEl.style.textAlign="center";
        noticeEl.style.fontSize="12px";
        noticeEl.style.color="#555";
        noticeEl.style.maxWidth="85%";
        noticeEl.style.marginLeft="auto";
        noticeEl.style.marginRight="auto";
        noticeEl.textContent = msg.content;
        this.msgListEl.appendChild(noticeEl);
        return;
      }

      const d = new Date(msg.time);
      const hh = String(d.getHours()).padStart(2,'0');
      const mm = String(d.getMinutes()).padStart(2,'0');
      const ss = String(d.getSeconds()).padStart(2,'0');
      const timeStr = `${hh}:${mm}:${ss}`;
      if(timePos === "hide"){
        // 隐藏时间
        if (msg.role === "user") {
          this.msgListEl.innerHTML += `
          <div style="marginBottom:14px;display:flex;justify-content:flex-end">
            <div style="max-width:70%;display:flex;align-items:flex-end;gap:6px;justify-content:flex-end">
              <div style="background:#fff;color:#222;padding:8px 12px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);word-break:break-all">${msg.content}</div>
              <img src="${myCurrentAvatar}" style="width:34px;height:34px;border-radius:${avatarRadius};background:#eee;object-fit:cover">
            </div>
          </div>`
        }else{
          this.msgListEl.innerHTML += `
          <div style="marginBottom:14px;display:flex;justify-content:flex-start">
            <div style="max-width:70%;display:flex;align-items:flex-end;gap:6px">
              <img src="${this.activeContactInfo.avatar || ''}" style="width:34px;height:34px;border-radius:${avatarRadius};background:#eee;object-fit:cover">
              <div style="background:#222;color:#fff;padding:8px 12px;border-radius:12px;word-break:break-all">${msg.content}</div>
            </div>
          </div>`
        }
        return;
      }
      if (msg.role === "user") {
        let timeHtml = "";
        if(timePos === "avatarBottom"){
          timeHtml = `<div style="text-align:right;font-size:11px;color:#999;margin-top:4px">${timeStr}</div>`;
        }else if(timePos === "bubbleBottom"){
          timeHtml = `<div style="text-align:right;font-size:11px;color:#999;margin-bottom:4px">${timeStr}</div>`;
        }else if(timePos === "bubbleOuter"){
          timeHtml = `<div style="font-size:11px;color:#999;margin-left:6px;align-self:flex-end">${timeStr}</div>`;
        }else if(timePos === "topCenter"){
          timeHtml = `<div style="width:100%;text-align:center;font-size:11px;color:#999;margin:4px 0">${timeStr}</div>`;
        }else if(timePos === "divider"){
          timeHtml = `<div style="width:100%;display:flex;align-items:center;color:#999;font-size:11px;margin:6px 0"><div style="flex:1;height:1px;background:#ddd"></div><span style="padding:0 8px">${timeStr}</span><div style="flex:1;height:1px;background:#ddd"></div></div>`;
        }
        const msgWrap = document.createElement('div');
        if(timePos === "topCenter" || timePos === "divider"){
          msgWrap.innerHTML = `
            <div style="width:100%">${timeHtml}</div>
            <div style="display:flex;justify-content:flex-end;gap:6px;align-items:flex-end">
              <div style="background:#fff;color:#222;padding:8px 12px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);word-break:break-all">${msg.content}</div>
              <img src="${myCurrentAvatar}" style="width:34px;height:34px;border-radius:${avatarRadius};background:#eee;object-fit:cover">
            </div>
            ${timePos === "avatarBottom" ? `<div style="text-align:right;font-size:11px;color:#999;margin-top:4px">${timeStr}</div>` : ""}
          `
        }else{
          msgWrap.style.marginBottom = "14px";
          msgWrap.style.display = "flex";
          msgWrap.style.justifyContent = "flex-end";
          msgWrap.innerHTML = `
            <div style="max-width:70%;">
              ${timePos === "bubbleBottom" ? `<div style="text-align:right;font-size:11px;color:#999;margin-bottom:4px">${timeStr}</div>` : ""}
              <div style="display:flex;align-items:flex-end;gap:6px;justify-content:flex-end">
                <div style="background:#fff;color:#222;padding:8px 12px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);word-break:break-all">${msg.content}</div>
                <img src="${myCurrentAvatar}" style="width:34px;height:34px;border-radius:${avatarRadius};background:#eee;object-fit:cover">
                ${timePos === "bubbleOuter" ? `<div style="font-size:11px;color:#999;align-self:flex-end">${timeStr}</div>` : ""}
              </div>
              ${timePos === "avatarBottom" ? `<div style="text-align:right;font-size:11px;color:#999;margin-top:4px">${timeStr}</div>` : ""}
            </div>
          `;
        }
        this.msgListEl.appendChild(msgWrap);
      } else {
        let timeHtml = "";
        if(timePos === "avatarBottom"){
          timeHtml = `<div style="font-size:11px;color:#999;margin-top:4px">${timeStr}</div>`;
        }else if(timePos === "bubbleBottom"){
          timeHtml = `<div style="font-size:11px;color:#999;margin-bottom:4px">${timeStr}</div>`;
        }else if(timePos === "bubbleOuter"){
          timeHtml = `<div style="font-size:11px;color:#999;margin-right:6px;align-self:flex-end">${timeStr}</div>`;
        }else if(timePos === "topCenter"){
          timeHtml = `<div style="width:100%;text-align:center;font-size:11px;color:#999;margin:4px 0">${timeStr}</div>`;
        }else if(timePos === "divider"){
          timeHtml = `<div style="width:100%;display:flex;align-items:center;color:#999;font-size:11px;margin:6px 0"><div style="flex:1;height:1px;background:#ddd"></div><span style="padding:0 8px">${timeStr}</span><div style="flex:1;height:1px;background:#ddd"></div></div>`;
        }
        const msgWrap = document.createElement('div');
        if(timePos === "topCenter" || timePos === "divider"){
          msgWrap.innerHTML = `
            <div style="width:100%">${timeHtml}</div>
            <div style="display:flex;justify-content:flex-start;gap:6px;align-items:flex-end">
              <img src="${this.activeContactInfo.avatar || ''}" style="width:34px;height:34px;border-radius:${avatarRadius};background:#eee;object-fit:cover">
              <div style="background:#222;color:#fff;padding:8px 12px;border-radius:12px;word-break:break-all">${msg.content}</div>
            </div>
            ${timePos === "avatarBottom" ? `<div style="font-size:11px;color:#999;margin-top:4px">${timeStr}</div>` : ""}
          `
        }else{
          msgWrap.style.marginBottom = "14px";
          msgWrap.style.display = "flex";
          msgWrap.style.justifyContent = "flex-start";
          msgWrap.innerHTML = `
            <div style="max-width:70%;">
              ${timePos === "bubbleBottom" ? `<div style="font-size:11px;color:#999;margin-bottom:4px">${timeStr}</div>` : ""}
              <div style="display:flex;align-items:flex-end;gap:6px">
                <img src="${this.activeContactInfo.avatar || ''}" style="width:34px;height:34px;border-radius:${avatarRadius};background:#eee;object-fit:cover">
                <div style="background:#222;color:#fff;padding:8px 12px;border-radius:12px;word-break:break-all">${msg.content}</div>
                ${timePos === "bubbleOuter" ? `<div style="font-size:11px;color:#999;align-self:flex-end">${timeStr}</div>` : ""}
              </div>
              ${timePos === "avatarBottom" ? `<div style="font-size:11px;color:#999;margin-top:4px">${timeStr}</div>` : ""}
            </div>
          `;
        }
        this.msgListEl.appendChild(msgWrap);
      }
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
