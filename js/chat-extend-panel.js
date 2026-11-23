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
    this.rootDom.style.position = "absolute";
    this.rootDom.style.inset = "0";
    this.rootDom.style.zIndex = "9998";
    // 修复：移除 column‑reverse，改用正常column，靠justify‑content:flex‑end实现底部弹窗，修复移动端文字被裁切消失bug
    this.rootDom.style.display = "flex";
    this.rootDom.style.flexDirection = "column";
    this.rootDom.style.justifyContent = "flex‑end";

    let activeTab = 0;
    const renderAll = ()=>{
      this.rootDom.innerHTML = "";
      const panel = document.createElement("div");
      panel.style.background = "#fff";
      panel.style.borderRadius = "16px 16px 0 0";
      panel.style.padding = "16px";
      const tabWrap = document.createElement("div");
      tabWrap.style.display = "flex";
      tabWrap.style.gap = "4px";
      tabWrap.style.borderBottom = "1px solid #eee";
      tabWrap.style.marginBottom = "16px";
      const tabs = ["互动","工具","小游戏","TA的提问"];
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
          renderAll();
        }
        tabWrap.appendChild(tabEl);
      })
      panel.appendChild(tabWrap);
      const contentBox = document.createElement("div");
      if(activeTab === 0){
        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(4, 1fr)";
        grid.style.gap = "20px 12px";
        grid.style.padding = "8px 4px";
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
          itemDom.style.gap = "8px";
          itemDom.style.cursor = "pointer";
          // 关键修复：给flex子项设置min‑width:0，移动端允许文字收缩不被裁剪
          itemDom.style.minWidth = "0";
          itemDom.innerHTML = `
            <div style="width:64px;height:64px;background:#f5f5f5;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px">${it.icon}</div>
            <span style="font‑size:12px;text‑align:center;line‑height:1.3;min‑width:0;overflow‑wrap:anywhere">${it.label}</span>
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
        contentBox.innerHTML = `<div style="text‑align:center;color:#888;padding:30px 0">功能待开发</div>`;
      }
      panel.appendChild(contentBox);
      this.rootDom.appendChild(panel);
      this.rootDom.onclick = (e)=>{
        if(e.target === this.rootDom) this.close();
      }
    };
    renderAll();
    this.parentContainer.appendChild(this.rootDom);
  },
  close() {
    if(this.rootDom) this.rootDom.remove();
    if(typeof this.callbackClose === "function") this.callbackClose();
  }
};
