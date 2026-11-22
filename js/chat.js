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
  isTyping: false,

  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("聊天容器找不到", containerSelector);
      return;
    }
    this.renderLayout();

    document.addEventListener("contact:change", (ev) => {
      this.loadContactSession(ev.detail);
    });
    const initCid = Store.get("activeContactId");
    if(initCid){
      this.loadContactSession(initCid);
    }

    EventBus.on("themeChange", () => {
      this.renderMessages();
    });
  },

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
    wrap.style.background = "#f7f7f7";

    // 聊天头部栏：返回箭头 + 头像 + 名字 + 更多按钮
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

    // 右上角更多菜单弹窗
    const moreBtn = document.getElementById("chat-more-btn");
moreBtn.onclick = ()=>{
  // 跳转到聊天设置页面，传入当前选中联系人id
  EventBus.emit("openChatSetting", { contactId: this.activeContactId });
}
const backBtn = document.getElementById("chat-back-btn");
backBtn.onclick = ()=>{
  // 切回联系人列表，这里用事件通知主框架切换tab
  EventBus.emit("switchTab", "setting");
  Toast.show("返回联系人列表");
}

  showChatMenu(){
    if(document.getElementById("chat-menu-mask")) return;
    const mask = document.createElement("div");
    mask.id = "chat-menu-mask";
    mask.style.position = "fixed";
    mask.style.inset = "0";
    mask.style.background = "rgba(0,0,0,0.3)";
    mask.style.zIndex = "999";
    const menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.top = "56px";
    menu.style.right = "16px";
    menu.style.background = "#fff";
    menu.style.borderRadius = "12px";
    menu.style.overflow = "hidden";
    menu.style.minWidth = "160px";
    menu.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)";
    menu.innerHTML = `
      <div class="menu-item" data-action="editName">修改昵称</div>
      <div class="menu-item" data-action="editAvatar">更换头像</div>
      <div class="menu-item" data-action="clearChat" style="color:#d93025">清空聊天记录</div>
    `;
    const style = document.createElement("style");
    style.textContent = `.menu-item{padding:12px 16px;cursor:pointer}.menu-item:hover{background:#f2f2f2}`;
    mask.appendChild(style);
    mask.appendChild(menu);
    document.body.appendChild(mask);

    const closeMenu = ()=>mask.remove();
    mask.onclick = (e)=>{
      if(e.target === mask) closeMenu();
    }
    menu.querySelectorAll(".menu-item").forEach(el=>{
      el.onclick = ()=>{
        const act = el.dataset.action;
        if(act === "editName"){
          const newName = prompt("修改联系人昵称", this.activeContactInfo.name);
          if(newName && newName.trim()){
            this.updateContact({name:newName.trim()});
          }
        }else if(act === "editAvatar"){
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = (ev)=>{
            const file = ev.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = res=>{
              this.updateContact({avatar:res.target.result});
            }
            reader.readAsDataURL(file);
          }
          input.click();
        }else if(act === "clearChat"){
          if(confirm("确定清空当前对话全部消息？不可恢复")){
            this.messageList = [];
            this.saveHistory();
            this.renderMessages();
            Toast.show("聊天记录已清空");
          }
        }
        closeMenu();
      }
    })
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
      const timeStr = new Date(msg.time).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"});
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

    // 正在输入提示
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

    // 模拟对方正在输入
    this.isTyping = true;
    this.renderMessages();
   setTimeout(()=>{
  this.isTyping = false;
  // 现在是原样复述，仅临时看气泡效果，后面对接字卡会改掉这里
  this.messageList.push({
    role: "bot",
    content: `${content}`,
    time: Date.now()
  });
  this.saveHistory();
  this.renderMessages();
},1200)

  saveHistory() {
    if(!this.activeContactId) return;
    Store.set(`chat-contact-${this.activeContactId}`, this.messageList);
  }
};
