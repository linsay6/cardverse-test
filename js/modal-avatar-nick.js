import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';
export const ModalAvatarNick = {
  maskDom: null,
  contactId: null,
  contactInfo: null,
  callbackClose: null,
  open(parentDom, cid, closeCb) {
    this.contactId = cid;
    this.callbackClose = closeCb;
    const list = Store.get("contactList", []);
    this.contactInfo = list.find(i => i.id === cid);
    if (!this.contactInfo) {
      Toast.show("找不到该联系人");
      return;
    }
    // 兜底初始化，防止字段缺失
    if(!this.contactInfo.taAvatarPool) this.contactInfo.taAvatarPool = [];
    if(!this.contactInfo.myAvatarPool) this.contactInfo.myAvatarPool = [];
    if(!this.contactInfo.taNickPool) this.contactInfo.taNickPool = [];
    if(!this.contactInfo.myNickPool) this.contactInfo.myNickPool = [];
    if(!this.contactInfo.taAvatarRandom) this.contactInfo.taAvatarRandom = {enable:false,intervalHour:4,lastChangeTs:0};
    if(!this.contactInfo.taNickRandom) this.contactInfo.taNickRandom = {enable:false,intervalHour:4,lastChangeTs:0};
    if(!this.contactInfo.myAvatarRandom) this.contactInfo.myAvatarRandom = {enable:false,intervalHour:4,lastChangeTs:0};
    if(!this.contactInfo.myNickRandom) this.contactInfo.myNickRandom = {enable:false,intervalHour:4,lastChangeTs:0};

    this.maskDom = document.createElement("div");
    this.maskDom.style.position = "fixed";
    this.maskDom.style.inset = "0";
    this.maskDom.style.background = "rgba(0,0,0,0.45)";
    this.maskDom.style.zIndex = "10000";
    this.maskDom.style.display = "flex";
    this.maskDom.style.alignItems = "center";
    this.maskDom.style.justifyContent = "center";
    this.render();
    parentDom.appendChild(this.maskDom);
  },
  close() {
    if(this.maskDom) this.maskDom.remove();
    if(typeof this.callbackClose === "function") this.callbackClose();
  },
  saveContact() {
    const list = Store.get("contactList", []);
    const idx = list.findIndex(x => x.id === this.contactId);
    if(idx === -1) return;
    list[idx] = this.contactInfo;
    Store.set("contactList", list);
    EventBus.emit("contactInfoChange", this.contactId);
  },
  render() {
    if(!this.maskDom) return;
    this.maskDom.innerHTML = "";
    const panel = document.createElement("div");
    panel.style.width = "90%";
    panel.style.maxWidth = "420px";
    panel.style.maxHeight = "80vh";
    panel.style.background = "#fff";
    panel.style.borderRadius = "16px";
    panel.style.overflow = "auto";
    const head = document.createElement("div");
    head.style.padding = "14px 16px";
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.style.alignItems = "center";
    head.style.borderBottom = "1px solid #eee";
    head.innerHTML = `<span style="font-weight:bold;font-size:16px">头像昵称互动</span><button id="modal-an-close" style="border:none;background:none;font-size:20px">×</button>`;
    panel.appendChild(head);

    const tabWrap = document.createElement("div");
    tabWrap.style.display = "flex";
    tabWrap.style.borderBottom = "1px solid #eee";
    const tabList = ["TA头像池", "TA昵称池", "我的头像池", "我的昵称池"];
    let activeTab = 0;
    const renderTabContent = ()=>{
      const contentBox = document.getElementById("modal-an-content");
      if(!contentBox) return;
      contentBox.innerHTML = "";
      if(activeTab === 0){
        this.renderRandomRow(contentBox, "taAvatarRandom", "TA头像随机轮换");
        this.renderPoolList(contentBox, this.contactInfo.taAvatarPool, "taAvatarPool", "图片");
      }else if(activeTab ===1){
        this.renderRandomRow(contentBox, "taNickRandom", "TA昵称随机轮换");
        this.renderPoolList(contentBox, this.contactInfo.taNickPool, "taNickPool", "昵称");
      }else if(activeTab ===2){
        this.renderRandomRow(contentBox, "myAvatarRandom", "我的头像随机轮换");
        this.renderPoolList(contentBox, this.contactInfo.myAvatarPool, "myAvatarPool", "图片");
      }else if(activeTab ===3){
        this.renderRandomRow(contentBox, "myNickRandom", "我的昵称随机轮换");
        this.renderPoolList(contentBox, this.contactInfo.myNickPool, "myNickPool", "昵称");
      }
    };
    tabList.forEach((t,ti)=>{
      const tab = document.createElement("div");
      tab.innerText = t;
      tab.style.padding = "12px 6px";
      tab.style.flex = "1";
      tab.style.textAlign = "center";
      tab.style.fontSize = "13px";
      tab.style.cursor = "pointer";
      if(ti === activeTab) tab.style.fontWeight = "bold";
      tab.onclick = ()=>{
        activeTab = ti;
        this.render();
      }
      tabWrap.appendChild(tab);
    })
    panel.appendChild(tabWrap);
    const contentBox = document.createElement("div");
    contentBox.id = "modal-an-content";
    contentBox.style.padding = "14px 16px";
    panel.appendChild(contentBox);
    this.maskDom.appendChild(panel);
    renderTabContent();
    document.getElementById("modal-an-close").onclick = ()=>this.close();
    this.maskDom.onclick = (e)=>{
      if(e.target === this.maskDom) this.close();
    }
  },
  renderRandomRow(box, keyName, titleText) {
    const item = this.contactInfo[keyName];
    const div = document.createElement("div");
    div.style.padding = "10px 0";
    div.style.borderBottom = "1px solid #eee";
    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.style.alignItems = "center";
    div.innerHTML = `
      <span style="font-size:14px">${titleText}</span>
      <label class="switch">
        <input type="checkbox" ${item.enable ? "checked":""}>
        <span></span>
      </label>
    `;
    const css = document.createElement("style");
    css.textContent = `
    .switch input {display:none;}
    .switch span {width:40px;height:20px;background:#ccc;border-radius:20px;display:block;position:relative}
    .switch span:after {content:"";width:16px;height:16px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:0.2s}
    .switch input:checked + span {background:#7c68ee}
    .switch input:checked + span:after {left:22px}
    `
    box.appendChild(css);
    box.appendChild(div);
    const ck = div.querySelector("input");
    ck.onchange = ()=>{
      this.contactInfo[keyName].enable = ck.checked;
      this.saveContact();
      Toast.show("已保存轮换设置");
    }
  },
  renderPoolList(box, poolArr, poolKey, tipText) {
    const wrap = document.createElement("div");
    wrap.style.marginTop = "12px";
    const addRow = document.createElement("div");
    addRow.style.display = "flex";
    addRow.style.gap = "6px";
    const input = document.createElement("input");
    input.style.flex = "1";
    input.style.padding = "8px 10px";
    input.style.border = "1px solid #ddd";
    input.style.borderRadius = "8px";
    input.placeholder = `输入${tipText}`;
    const addBtn = document.createElement("button");
    addBtn.innerText = "添加";
    addBtn.style.padding = "8px 12px";
    addBtn.style.border = "none";
    addBtn.style.borderRadius = "8px";
    addBtn.style.background = "#7c68ee";
    addBtn.style.color = "#fff";
    addBtn.onclick = ()=>{
      const val = input.value.trim();
      if(!val) return Toast.show("内容不能为空");
      this.contactInfo[poolKey].push(val);
      this.saveContact();
      this.render();
    }
    addRow.appendChild(input);
    addRow.appendChild(addBtn);
    wrap.appendChild(addRow);
    const listWrap = document.createElement("div");
    listWrap.style.marginTop = "10px";
    poolArr.forEach((v,idx)=>{
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.padding = "8px 0";
      row.style.borderBottom = "1px solid #f1f1f1";
      row.innerHTML = `<span style="font-size:13px">${v}</span><button data-idx="${idx}" style="border:none;background:#f33;color:#fff;border-radius:6px;padding:4px 8px;font-size:12px">删除</button>`;
      listWrap.appendChild(row);
    })
    wrap.appendChild(listWrap);
    box.appendChild(wrap);
  }
}
