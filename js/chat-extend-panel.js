import { AvatarNickModal } from './modal-avatar-nick.js';
import { Toast } from './core/toast.js';

export const ChatExtendPanel = {
  container: null,
  contactId: null,
  closeCb: null,
  activeTab: "互动",
  tabList: ["互动","工具","小游戏","TA的提问"],

  open(parentDom, cid, cbClose){
    this.container = parentDom;
    this.contactId = cid;
    this.closeCb = cbClose;
    this.render();
  },

  close(){
    if(this.container) this.container.innerHTML = "";
    if(typeof this.closeCb === "function") this.closeCb();
  },

  render(){
    if(!this.container) return;
    this.container.innerHTML = "";
    // 弹窗固定在父容器（手机框）内部，relative定位
    const wrap = document.createElement("div");
    wrap.style.position = "absolute";
    wrap.style.inset = "0";
    wrap.style.zIndex = "90";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column-reverse";

    const panel = document.createElement("div");
    panel.style.background = "#fff";
    panel.style.borderRadius = "16px 16px 0 0";
    panel.style.padding = "16px";

    // tab栏
    let html = `<div style="display:flex;gap:4px;border-bottom:1px solid #eee;margin-bottom:14px">`;
    this.tabList.forEach(t=>{
      html += `<div data-tab="${t}" style="padding:8px 10px;font-size:14px;cursor:pointer;${this.activeTab===t?'font-weight:bold;border-bottom:2px solid #222':''}">${t}</div>`
    })
    html += `</div>`;

    // 图标网格
    if(this.activeTab === "互动"){
      html += `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
        ${this.iconItem("通话","📞","call")}
        ${this.iconItem("拍一拍","👋","tap")}
        ${this.iconItem("红包","🧧","red")}
        ${this.iconItem("邀请TA","➕","invite")}
        ${this.iconItem("心意集市","🎁","market")}
        ${this.iconItem("心意柜","🗄️","cabinet")}
        ${this.iconItem("头像和昵称互动","👤","avatarnick")}
        ${this.iconItem("漂流瓶","🍶","bottle")}
      </div>
      `
    }else{
      html += `<div style="text-align:center;padding:30px 0;color:#777">该板块待开发</div>`
    }
    panel.innerHTML = html;
    wrap.appendChild(panel);
    this.container.appendChild(wrap);

    // tab切换
    panel.querySelectorAll('[data-tab]').forEach(el=>{
      el.onclick = ()=>{
        this.activeTab = el.dataset.tab;
        this.render();
      }
    })
    // 图标点击
    panel.querySelectorAll(".ext-item").forEach(el=>{
      el.onclick = ()=>{
        const action = el.dataset.action;
        if(action === "avatarnick"){
          AvatarNickModal.open(wrap, this.contactId);
        }else{
          Toast.show(`${el.dataset.name}：待开发`);
        }
      }
    })
    // 点击空白关闭拓展面板
    wrap.onclick = (e)=>{
      if(e.target === wrap) this.close();
    }
  },

  iconItem(name,icon,action){
    return `
    <div class="ext-item" data-action="${action}" data-name="${name}" style="display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer">
      <div style="width:48px;height:48px;background:#f3f3f3;border-radius:12px;display:grid;place-items:center;font-size:22px">${icon}</div>
      <div style="font-size:12px;color:#333">${name}</div>
    </div>
    `
  }
}
