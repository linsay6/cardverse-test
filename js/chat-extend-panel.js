import { ModalAvatarNick } from './modal-avatar-nick.js';
import { Toast } from './core/toast.js';
export const ChatExtendPanel = {
  rootDom: null,
  parentContainer: null,
  contactId: null,
  callbackClose: null,
  open(parentDom, cid, cbClose) {
    this.parentContainer = parentDom;
    this.contactId = cid;
    this.callbackClose = cbClose;
    this.rootDom = document.createElement("div");
    this.rootDom.style.position = "fixed";
    this.rootDom.style.inset = "0";
    this.rootDom.style.zIndex = "9998";
    this.rootDom.style.display = "flex";
    this.rootDom.style.flexDirection = "column-reverse";
    this.render();
    parentDom.appendChild(this.rootDom);
  },
  close() {
    if(this.rootDom) this.rootDom.remove();
    if(typeof this.callbackClose === "function") this.callbackClose();
  },
  render() {
    if(!this.rootDom) return;
    this.rootDom.innerHTML = "";
    const panel = document.createElement("div");
    panel.style.background = "#fff";
    panel.style.borderRadius = "16px 16px 0 0";
    panel.style.padding = "16px";
    const tabWrap = document.createElement("div");
    tabWrap.style.display = "flex";
    tabWrap.style.gap = "4px";
    tabWrap.style.borderBottom = "1px solid #eee";
    tabWrap.style.marginBottom = "12px";
    const tabs = ["互动","工具","小游戏","TA的提问"];
    let activeTab = 0;
    const renderTabContent = ()=>{
      const contentBox = document.getElementById("extend-panel-content");
      if(!contentBox) return;
      contentBox.innerHTML = "";
      if(activeTab === 0){
        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(4, 1fr)";
        grid.style.gap = "14px 6px";
        grid.style.padding = "4px";
        const items = [
          {label:"通话",icon:"📞"},
          {label:"拍一拍",icon:"👏"},
          {label:"红包",icon:"🧧"},
          {label:"邀请TA",icon:"➕"},
          {label:"心意集市",icon:"🎁"},
          {label:"心意柜",icon:"🗄️"},
          {label:"头像和昵称互动",icon:"👤"},
          {label:"漂流瓶",icon:"🍶"}
        ];
        items.forEach(it=>{
          const itemDom = document.createElement("div");
          itemDom.style.display = "flex";
          itemDom.style.flexDirection = "column";
          itemDom.style.alignItems = "center";
          itemDom.style.gap = "6px";
          itemDom.style.cursor = "pointer";
          itemDom.innerHTML = `
            <div style="width:48px;height:48px;background:#f5f5f5;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px">${it.icon}</div>
            <span style="font-size:12px;text-align:center">${it.label}</span>
          `;
          if(it.label === "头像和昵称互动"){
            itemDom.onclick = ()=>{
              ModalAvatarNick.open(this.parentContainer, this.contactId, ()=>{});
            }
          }else{
            itemDom.onclick = ()=> Toast.show(`${it.label} 功能开发中`);
          }
          grid.appendChild(itemDom);
        })
        contentBox.appendChild(grid);
      }else{
        contentBox.innerHTML = `<div style="text-align:center;color:#888;padding:30px 0">功能待开发</div>`
      }
    }
    tabs.forEach((t,ti)=>{
      const tabEl = document.createElement("div");
      tabEl.innerText = t;
      tabEl.style.padding = "10px 8px";
      tabEl.style.flex = "1";
      tabEl.style.textAlign = "center";
      tabEl.style.fontSize = "14px";
      tabEl.style.cursor = "pointer";
      if(ti === activeTab) {
        tabEl.style.fontWeight = "bold";
        tabEl.style.borderBottom = "2px solid #222";
      }
      tabEl.onclick = ()=>{
        activeTab = ti;
        this.render();
      }
      tabWrap.appendChild(tabEl);
    })
    const contentBox = document.createElement("div");
    contentBox.id = "extend-panel-content";
    panel.appendChild(tabWrap);
    panel.appendChild(contentBox);
    this.rootDom.appendChild(panel);
    renderTabContent();
    this.rootDom.onclick = (e)=>{
      if(e.target === this.rootDom) this.close();
    }
  }
}
