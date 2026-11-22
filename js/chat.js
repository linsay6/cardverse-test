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
        <img id="chat-header-avatar" src="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;background:#eee">
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

    // 修复返回按钮：直接调用TabManager切换tab，不使用querySelector点击模拟
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

    if (!this.activeContactId) {
      this.msgListEl.innerHTML = `<div style="text-align:center;margin-top:40px;color:#777">请前往设置选择一个梦角联系人开始对话</div>`;
      return;
    }

    if (this.messageList.length === 0) {
      this.msgListEl.innerHTML = `<div style="text-align:center;margin-top:40px;color:#777">暂无消息，发送第一条消息吧</div>`;
      return;
    }

    this.messageList.forEach(msg => {
      // 修复时间，弃用toLocaleTimeString
      const d = new Date(msg.time);
      const hh = String(d.getHours()).padStart(2,'0');
      const mm = String(d.getMinutes()).padStart(2,'0');
      const timeStr = `${hh}:${mm}`;

      const msgWrap = document.createElement('div');
      msgWrap.style.marginBottom = "14px";
      msgWrap.style.display = "flex";
      if (msg.role === "user") {
        msgWrap.style.justifyContent = "flex-end";
        msgWrap.innerHTML = `
          <div style="max-width:70%;">
            <div style="text-align:right;font-size:11px;color:#999;margin-bottom:4px">${timeStr}</div>
            <div style="display:flex;align-items:flex-end;gap:6px;justify-content:flex-end">
              <div style="background:#fff;color:#222;padding:8px 12px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);word-break:break-all">${msg.content}</div>
              <img src="${msg.avatar || ''}" style="width:34px;height:34px;border-radius:50%;background:#eee;object-fit:cover">
            </div>
          </div>
        `;
      } else {
        msgWrap.style.justifyContent = "flex-start";
        msgWrap.innerHTML = `
          <div style="max-width:70%;">
            <div style="display:flex;align-items:flex-end;gap:6px">
              <img src="${this.activeContactInfo.avatar || ''}" style="width:34px;height:34px;border-radius:50%;background:#eee;object-fit:cover">
              <div style="background:#222;color:#fff;padding:8px 12px;border-radius:12px;word-break:break-all">${msg.content}</div>
            </div>
            <div style="font-size:11px;color:#999;margin-top:4px">${timeStr}</div>
          </div>
        `;
      }
      this.msgListEl.appendChild(msgWrap);
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
        time: Date.now(),
        avatar: ""
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
