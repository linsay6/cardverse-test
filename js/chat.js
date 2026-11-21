import { Store } from './core/store.js';
import { EventBus } from './core/context.js';
import { Toast } from './core/toast.js';

export const ChatModule = {
  rootEl: null,
  msgListEl: null,
  inputEl: null,
  currentSessionId: null,
  currentCard: null,
  messageList: [],

  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("聊天容器找不到", containerSelector);
      return;
    }
    this.renderLayout();

    // 监听切换会话事件
    EventBus.on("session:switch", (payload) => {
      this.switchSession(payload.sessionId, payload.card);
    });
    // 主题切换重绘
    EventBus.on("themeChange", () => {
      this.renderMessages();
    });
  },

  // 渲染聊天页面基础布局：消息区 + 输入框
  renderLayout() {
    this.rootEl.innerHTML = "";
    const wrap = document.createElement('div');
    wrap.style.height = "100%";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";

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
  },

  // 切换会话，加载对应聊天记录
  switchSession(sessionId, card) {
    this.currentSessionId = sessionId;
    this.currentCard = card;
    this.messageList = Store.get(`chat-history-${sessionId}`, []);
    this.renderMessages();
    Toast.show(`进入会话：${card.name}`);
  },

  renderMessages() {
    if (!this.msgListEl) return;
    this.msgListEl.innerHTML = "";
    if (!this.currentSessionId) {
      this.msgListEl.innerHTML = `<div style="text-align:center;margin-top:40px;color:var(--color-text-2)">请先在桌面选择字卡开始对话</div>`;
      return;
    }
    if (this.messageList.length === 0) {
      this.msgListEl.innerHTML = `<div style="text-align:center;margin-top:40px;color:var(--color-text-2)">暂无消息，发送第一条消息吧</div>`;
      return;
    }

    this.messageList.forEach(msg => {
      const msgItem = document.createElement('div');
      msgItem.style.marginBottom = "10px";
      if (msg.role === "user") {
        msgItem.style.textAlign = "right";
        msgItem.innerHTML = `<div style="display:inline-block;max-width:75%;padding:8px 10px;background:var(--color-main);color:#fff;border-radius:var(--radius-card)">${msg.content}</div>`;
      } else {
        msgItem.style.textAlign = "left";
        msgItem.innerHTML = `<div style="display:inline-block;max-width:75%;padding:8px 10px;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-text);border-radius:var(--radius-card)">${msg.content}</div>`;
      }
      this.msgListEl.appendChild(msgItem);
    });
    // 滚动到底部
    this.msgListEl.scrollTop = this.msgListEl.scrollHeight;
  },

  sendMessage() {
    const content = this.inputEl.value.trim();
    if (!content) return;
    if (!this.currentSessionId) {
      Toast.show("请先选择字卡");
      return;
    }
    // 用户消息入库
    this.messageList.push({
      role: "user",
      content
    });
    this.inputEl.value = "";
    this.saveHistory();
    this.renderMessages();

    // 模拟角色回复，后面这里对接AI
    setTimeout(() => {
      this.messageList.push({
        role: "bot",
        content: `【${this.currentCard.name}】收到你的消息：${content}`
      });
      this.saveHistory();
      this.renderMessages();
    }, 600);
  },

  saveHistory() {
    Store.set(`chat-history-${this.currentSessionId}`, this.messageList);
  }
};
