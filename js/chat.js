import { Store } from './core/store.js';
import { EventBus } from './core/context.js';
import { Toast } from './core/toast.js';

export const ChatModule = {
  rootEl: null,
  msgListEl: null,
  inputEl: null,
  activeContactId: null,
  activeContactInfo: null,
  messageList: [],

  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("聊天容器找不到", containerSelector);
      return;
    }
    this.renderLayout();

    // 监听切换联系人事件
    document.addEventListener("contact:change", (ev) => {
      this.loadContactSession(ev.detail);
    });
    // 页面初始化读取当前选中联系人
    const initCid = Store.get("activeContactId");
    if(initCid){
      this.loadContactSession(initCid);
    }

    EventBus.on("themeChange", () => {
      this.renderMessages();
    });
  },

  // 加载联系人会话
  loadContactSession(contactId) {
    const contactList = Store.get("contactList", []);
    const findItem = contactList.find(c => c.id === contactId);
    if(!findItem){
      this.activeContactId = null;
      this.activeContactInfo = null;
      this.messageList = [];
      this.renderMessages();
      return;
    }
    this.activeContactId = contactId;
    this.activeContactInfo = findItem;
    this.messageList = Store.get(`chat-contact-${contactId}`, []);
    this.renderMessages();
    Toast.show(`进入对话：${findItem.name}`);
  },

  renderLayout() {
    this.rootEl.innerHTML = "";
    const wrap = document.createElement('div');
    wrap.style.height = "100%";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";

    // --------聊天顶部标题栏 + 更多按钮 --------
    const chatHeader = document.createElement("div");
    chatHeader.style.padding = "10px 12px";
    chatHeader.style.display = "flex";
    chatHeader.style.justifyContent = "space‑between";
    chatHeader.style.alignItems = "center";
    chatHeader.style.borderBottom = "1px solid var(--color-border)";
    chatHeader.innerHTML = `
      <div id="chat‑title" style="font‑weight:bold;color:var(--color-text)">未选择联系人</div>
      <button id="chat‑more‑btn" style="border:none;background:transparent;font‑size:20px;color:var(--color-text)">⋯</button>
    `;
    wrap.appendChild(chatHeader);

    this.msgListEl = document.createElement('div');
    this.msgListEl.style.flex = "1";
    this.msgListEl.style.overflowY = "auto";
    this.msgListEl.style.padding = "12px";

    const inputWrap = document.createElement('div');
    inputWrap.style.padding = "10px 12px";
    inputWrap.style.borderTop = "1px solid var(--color-border)";
    inputWrap.style.display = "flex";
    inputWrap.style.gap = "8px";

    this.inputEl = document.createElement('input');
    this.inputEl.style.flex = "1";
    this.inputEl.style.padding = "8px";
    this.inputEl.style.border = "1px solid var(--color-border)";
    this.inputEl.style.borderRadius = "var(--radius-btn)";
    this.inputEl.style.background = "var(--color-bg)";
    this.inputEl.style.color = "var(--color-text)";
    this.inputEl.placeholder = "输入消息...";

    const sendBtn = document.createElement('button');
    sendBtn.innerText = "发送";
    sendBtn.style.padding = "8px 14px";
    sendBtn.style.border = "none";
    sendBtn.style.borderRadius = "var(--radius-btn)";
    sendBtn.style.background = "var(--color-main)";
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

    // 右上角更多按钮：弹出聊天内设置占位弹窗
    const moreBtn = document.getElementById("chat‑more‑btn");
    if(moreBtn){
      moreBtn.onclick = ()=>{
        Toast.show("聊天内部设置（头像/昵称/美化等，待开发）");
      }
    }
  },

  renderMessages() {
    const titleDom = document.getElementById("chat‑title");
    if(titleDom){
      if(this.activeContactInfo){
        titleDom.innerText = this.activeContactInfo.name;
      }else{
        titleDom.innerText = "未选择联系人";
      }
    }

    if (!this.msgListEl) return;
    this.msgListEl.innerHTML = "";

    if (!this.activeContactId) {
      this.msgListEl.innerHTML = `<div style="text‑align:center;margin‑top:40px;color:var(--color‑text‑2)">请前往设置选择一个梦角联系人开始对话</div>`;
      return;
    }

    if (this.messageList.length === 0) {
      this.msgListEl.innerHTML = `<div style="text‑align:center;margin‑top:40px;color:var(--color‑text‑2)">暂无消息，发送第一条消息吧</div>`;
      return;
    }

    this.messageList.forEach(msg => {
      const msgItem = document.createElement('div');
      msgItem.style.marginBottom = "10px";
      if (msg.role === "user") {
        msgItem.style.textAlign = "right";
        msgItem.innerHTML = `<div style="display:inline‑block;max‑width:75%;padding:8px 10px;background:var(--color‑main);color:#fff;border‑radius:var(--radius‑card)">${msg.content}</div>`;
      } else {
        msgItem.style.textAlign = "left";
        msgItem.innerHTML = `<div style="display:inline‑block;max‑width:75%;padding:8px 10px;border:1px solid var(--color‑border);background:var(--color‑bg);color:var(--color‑text);border‑radius:var(--radius‑card)">${msg.content}</div>`;
      }
      this.msgListEl.appendChild(msgItem);
    });
    this.msgListEl.scrollTop = this.msgListEl.scrollHeight;
  },

  sendMessage() {
    const content = this.inputEl.value.trim();
    if (!content) return;
    // ✅移除强制拦截：没有联系人也允许发送；没有联系人不会保存记录
    if(this.activeContactId){
      this.messageList.push({ role: "user", content });
      this.saveHistory();
    }
    this.inputEl.value = "";
    this.renderMessages();

    if(!this.activeContactId){
      Toast.show("提示：未选中联系人，消息不会保存");
      return;
    }

    // 模拟回复：后续替换为【从字卡库随机抽取】逻辑
    setTimeout(() => {
      this.messageList.push({
        role: "bot",
        content: `【${this.activeContactInfo.name}】收到你的消息：${content}`
      });
      this.saveHistory();
      this.renderMessages();
    }, 600);
  },

  saveHistory() {
    if(!this.activeContactId) return;
    Store.set(`chat‑contact‑${this.activeContactId}`, this.messageList);
  }
};
