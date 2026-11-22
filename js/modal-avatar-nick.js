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
    //兜底初始化全部字段，包含对方自动申请间隔
    if(!this.contactInfo.taAvatarPool) this.contactInfo.taAvatarPool = [];
    if(!this.contactInfo.myAvatarPool) this.contactInfo.myAvatarPool = [];
    if(!this.contactInfo.taNickPool) this.contactInfo.taNickPool = [];
    if(!this.contactInfo.myNickPool) this.contactInfo.myNickPool = [];
    if(!this.contactInfo.pendingApplyList) this.contactInfo.pendingApplyList = [];
    if(!this.contactInfo.taAvatarRandom) this.contactInfo.taAvatarRandom = {enable:false,intervalHour:4,lastChangeTs:0};
    if(!this.contactInfo.taNickRandom) this.contactInfo.taNickRandom = {enable:false,intervalHour:4,lastChangeTs:0};
    if(!this.contactInfo.myAvatarRandom) this.contactInfo.myAvatarRandom = {enable:false,intervalHour:4,lastChangeTs:0};
    if(!this.contactInfo.myNickRandom) this.contactInfo.myNickRandom = {enable:false,intervalHour:4,lastChangeTs:0};
    if(!this.contactInfo.taApplyIntervalHours) this.contactInfo.taApplyIntervalHours = 4;

    this.maskDom = document.createElement("div");
    this.maskDom.style.position = "absolute";
    this.maskDom.style.inset = "0";
    this.maskDom.style.background = "rgba(0,0,0,0.45)";
    this.maskDom.style.zIndex = "10000";
    this.maskDom.style.display = "flex";
    this.maskDom.style.alignItems = "center";
    this.maskDom.style.justifyContent = "center";
    parentDom.appendChild(this.maskDom);
    this.render();
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

  // 弹出提交申请确认弹窗
  openApplyConfirmModal(applyObj, onConfirm) {
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.inset = "0";
    mask.style.background = "rgba(0,0,0,0.35)";
    mask.style.zIndex = "10001";
    mask.style.display = "flex";
    mask.style.alignItems = "center";
    mask.style.justifyContent = "center";
    const modal = document.createElement("div");
    modal.style.width = "85%";
    modal.style.maxWidth = "340px";
    modal.style.background = "#fff";
    modal.style.borderRadius = "14px";
    modal.style.padding = "20px";
    modal.innerHTML = `
      <div style="font‑weight:bold;font‑size:16px;margin‑bottom:12px">提交变更申请</div>
      <div style="font‑size:14px;color:#444;margin‑bottom:16px">${applyObj.desc}</div>
      <div style="font‑size:12px;color:#888;margin‑bottom:16px">超时2小时未处理将自动同意</div>
      <div style="display:flex;gap:10px">
        <button id="apply‑cancel" style="flex:1;padding:9px;border:1px solid #ccc;background:#fff;border‑radius:8px">取消</button>
        <button id="apply‑ok" style="flex:1;padding:9px;background:#7c68ee;color:#fff;border:none;border‑radius:8px">提交申请</button>
      </div>
    `;
    mask.appendChild(modal);
    document.body.appendChild(mask);
    document.getElementById("apply‑cancel").onclick = ()=> mask.remove();
    document.getElementById("apply‑ok").onclick = ()=>{
      mask.remove();
      onConfirm();
    };
    mask.onclick = e=>{ if(e.target===mask) mask.remove(); };
  },

  //处理申请：同意/拒绝，同时向聊天写入notice记录
  handleApplyAction(applyId, action) {
    const list = Store.get("contactList",[]);
    const idx = list.findIndex(x=>x.id === this.contactId);
    if(idx === -1) return;
    const contact = list[idx];
    const applyIdx = contact.pendingApplyList.findIndex(a=>a.applyId === applyId);
    if(applyIdx === -1) return;
    const apply = contact.pendingApplyList[applyIdx];

    //获取chat模块，写入聊天notice消息
    const chatModule = window.ChatModule;
    if(action === "accept"){
      switch(apply.targetType){
        case "taAvatar": contact.avatar = apply.newVal; break;
        case "taNick": contact.name = apply.newVal; break;
        case "myAvatar": contact.myAvatar = apply.newVal; break;
        case "myNick": contact.myNick = apply.newVal; break;
      }
      if(chatModule?.pushNoticeMessage){
        chatModule.pushNoticeMessage(`【${apply.from==="ta"?"对方":"我"}发起】${apply.desc} —— 已手动同意`, apply.from);
      }
    }else{
      if(chatModule?.pushNoticeMessage){
        chatModule.pushNoticeMessage(`【${apply.from==="ta"?"对方":"我"}发起】${apply.desc} —— 已手动拒绝`, apply.from);
      }
    }
    contact.pendingApplyList.splice(applyIdx,1);
    Store.set("contactList",list);
    this.contactInfo = contact;
    EventBus.emit("contactInfoChange", this.contactId);
    Toast.show(action==="accept"?"已同意申请":"已拒绝申请");
    this.render();
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
    head.style.justifyContent = "space‑between";
    head.style.alignItems = "center";
    head.style.borderBottom = "1px solid #eee";
    head.innerHTML = `<span style="font‑weight:bold;font‑size:16px">头像昵称互动</span><button id="modal‑an‑close" style="border:none;background:none;font‑size:20px">×</button>`;
    panel.appendChild(head);

    //子tab
    const tabWrap = document.createElement("div");
    tabWrap.style.display = "flex";
    tabWrap.style.borderBottom = "1px solid #eee";
    const tabList = ["TA头像池", "TA昵称池", "我的头像池", "我的昵称池"];
    let activeTab = 0;
    const contentBox = document.createElement("div");
    contentBox.id = "modal‑an‑content";
    contentBox.style.padding = "14px 16px";

    const renderTabContent = ()=>{
      contentBox.innerHTML = "";
      //轮换配置+【对方发起申请间隔】
      const randDiv = document.createElement("div");
      randDiv.style.marginBottom = "12px";
      randDiv.style.borderBottom = "1px solid #eee";
      randDiv.innerHTML = `
        <div style="font‑weight:bold;font‑size:14px;margin‑bottom:8px">随机轮换 & 对方申请设置</div>
        <div style="padding:8px 0;display:flex;justify‑content:space‑between;align‑items:center">
          <span>对方自动发起申请间隔(小时)</span>
          <input id="ta‑apply‑interval" value="${this.contactInfo.taApplyIntervalHours}" style="width:60px;padding:4px;border:1px solid #ddd;border‑radius:4px">
          <button id="save‑ta‑apply‑int" style="padding:3px 6px;font‑size:11px">保存</button>
        </div>
      `;
      contentBox.appendChild(randDiv);

      if(activeTab === 0){
        this.renderRandomRow(contentBox, "taAvatarRandom", "TA头像随机轮换");
        this.renderPoolList(contentBox, this.contactInfo.taAvatarPool, "taAvatarPool", "image");
      }else if(activeTab ===1){
        this.renderRandomRow(contentBox, "taNickRandom", "TA昵称随机轮换");
        this.renderPoolList(contentBox, this.contactInfo.taNickPool, "taNickPool", "text");
      }else if(activeTab ===2){
        this.renderRandomRow(contentBox, "myAvatarRandom", "我的头像随机轮换");
        this.renderPoolList(contentBox, this.contactInfo.myAvatarPool, "myAvatarPool", "image");
      }else if(activeTab ===3){
        this.renderRandomRow(contentBox, "myNickRandom", "我的昵称随机轮换");
        this.renderPoolList(contentBox, this.contactInfo.myNickPool, "myNickPool", "text");
      }

      //待处理申请列表
      const applyWrap = document.createElement("div");
      applyWrap.style.marginTop = "16px";
      applyWrap.innerHTML = `<div style="font‑weight:bold;font‑size:14px;margin‑bottom:8px">待处理申请</div>`;
      if(this.contactInfo.pendingApplyList.length === 0){
        applyWrap.innerHTML += `<div style="font‑size:13px;color:#777">暂无待处理申请</div>`;
      }else{
        this.contactInfo.pendingApplyList.forEach(ap=>{
          const row = document.createElement("div");
          row.style.display = "flex";
          row.style.justifyContent = "space‑between";
          row.style.alignItems = "center";
          row.style.padding = "6px 0";
          row.style.borderBottom = "1px solid #eee";
          row.innerHTML = `
            <div style="font‑size:13px">${ap.desc}</div>
            <div style="display:flex;gap:6px">
              <button data‑applyid="${ap.applyId}" data‑act="accept" style="padding:3px 5px;background:#4caf50;color:#fff;border:none;border‑radius:4px;font‑size:12px">同意</button>
              <button data‑applyid="${ap.applyId}" data‑act="reject" style="padding:3px 5px;background:#f44336;color:#fff;border:none;border‑radius:4px;font‑size:12px">拒绝</button>
            </div>
          `;
          applyWrap.appendChild(row);
        })
      }
      contentBox.appendChild(applyWrap);
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
      tab.dataset.tabIdx = String(ti);
      tabWrap.appendChild(tab);
    })
    panel.appendChild(tabWrap);
    panel.appendChild(contentBox);
    this.maskDom.appendChild(panel);
    renderTabContent();

    //DOM全部挂载完成后绑定事件
    const closeBtn = panel.querySelector("#modal‑an‑close");
    if(closeBtn) closeBtn.onclick = ()=>this.close();
    this.maskDom.onclick = (e)=>{ if(e.target === this.maskDom) this.close(); };

    //tab切换
    const tabNodes = panel.querySelectorAll('[data‑tab‑idx]');
    tabNodes.forEach(el=>{
      el.onclick = ()=>{
        activeTab = Number(el.dataset.tabIdx);
        renderTabContent();
      }
    });

    //保存对方申请间隔小时
    const saveTaIntBtn = panel.querySelector("#save‑ta‑apply‑int");
    if(saveTaIntBtn){
      saveTaIntBtn.onclick = ()=>{
        const inputEl = panel.querySelector("#ta‑apply‑interval");
        const val = Number(inputEl.value);
        if(isNaN(val)||val<1||val>24) return Toast.show("请输入1‑24小时");
        this.contactInfo.taApplyIntervalHours = val;
        this.saveContact();
        Toast.show("对方申请间隔已保存");
        this.render();
      }
    }

    //待处理申请同意拒绝
    panel.querySelectorAll('[data‑applyid]').forEach(btn=>{
      btn.onclick = ()=>{
        this.handleApplyAction(btn.dataset.applyid, btn.dataset.act);
      }
    })
  },

  renderRandomRow(box, keyName, titleText) {
    const item = this.contactInfo[keyName];
    const div = document.createElement("div");
    div.style.padding = "10px 0";
    div.style.borderBottom = "1px solid #eee";
    div.style.display = "flex";
    div.style.justifyContent = "space‑between";
    div.style.alignItems = "center";
    div.innerHTML = `
      <span style="font‑size:14px">${titleText}</span>
      <label class="switch">
        <input type="checkbox" ${item.enable ? "checked":""}>
        <span></span>
      </label>
    `;
    const css = document.createElement("style");
    css.textContent = `
    .switch input {display:none;}
    .switch span {width:40px;height:20px;background:#ccc;border‑radius:20px;display:block;position:relative}
    .switch span:after {content:"";width:16px;height:16px;background:#fff;border‑radius:50%;position:absolute;top:2px;left:2px;transition:0.2s}
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

  //渲染池子列表 type:image图片 / text文本昵称
  renderPoolList(box, poolArr, poolKey, type) {
    const wrap = document.createElement("div");
    wrap.style.marginTop = "12px";
    if(type === "image"){
      //图片头像池，批量上传
      const uploadRow = document.createElement("div");
      uploadRow.style.display = "flex";
      uploadRow.style.gap = "6px";
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.multiple = true;
      fileInput.style.display = "none";
      const uploadBtn = document.createElement("button");
      uploadBtn.innerText = "批量选择上传图片";
      uploadBtn.style.width = "100%";
      uploadBtn.style.padding = "8px";
      uploadBtn.style.border = "1px solid #ddd";
      uploadBtn.style.borderRadius = "8px";
      uploadBtn.style.background = "#f7f7f7";
      uploadBtn.onclick = ()=> fileInput.click();
      fileInput.onchange = async (ev)=>{
        const files = Array.from(ev.target.files);
        for(const f of files){
          const b64 = await new Promise(res=>{
            const r = new FileReader();
            r.onload = e=>res(e.target.result);
            r.readAsDataURL(f);
          })
          if(!this.contactInfo[poolKey].includes(b64)){
            this.contactInfo[poolKey].push(b64);
          }
        }
        this.saveContact();
        Toast.show(`成功添加${files.length}张图片`);
        this.render();
      }
      uploadRow.appendChild(fileInput);
      uploadRow.appendChild(uploadBtn);
      wrap.appendChild(uploadRow);

      const previewWrap = document.createElement("div");
      previewWrap.style.display = "flex";
      previewWrap.style.flexWrap = "wrap";
      previewWrap.style.gap = "8px";
      previewWrap.style.marginTop = "10px";
      poolArr.forEach((src,idx)=>{
        const itemDiv = document.createElement("div");
        itemDiv.style.position = "relative";
        itemDiv.style.width = "60px";
        itemDiv.style.height = "60px";
        itemDiv.style.borderRadius = "8px";
        itemDiv.style.overflow = "hidden";
        itemDiv.style.border = "1px solid #ddd";
        itemDiv.innerHTML = `
          <img src="${src}" style="width:100%;height:100%;object‑fit:cover">
          <button data‑pool="${poolKey}" data‑idx="${idx}" class="pool‑del‑btn" style="position:absolute;top:0;right:0;background:rgba(0,0,0,0.6);color:#fff;border:none;width:18px;height:18px;font‑size:10px">×</button>
        `;
        //点击图片条目：发起申请弹窗
        itemDiv.onclick = (e)=>{
          if(e.target.classList.contains("pool‑del‑btn")) return;
          let targetType;
          if(poolKey === "taAvatarPool") targetType = "taAvatar";
          if(poolKey === "myAvatarPool") targetType = "myAvatar";
          const applyObj = {
            applyId:Date.now().toString(),
            from:"me",
            targetType: targetType,
            newVal: src,
            createTs: Date.now(),
            expireMs: 2*3600*1000,
            status:"pending",
            desc:`申请变更${targetType==="taAvatar"?"对方头像":"我的头像"}`
          }
          this.openApplyConfirmModal(applyObj,()=>{
            const list = Store.get("contactList",[]);
            const cidx = list.findIndex(x=>x.id === this.contactId);
            list[cidx].pendingApplyList.push(applyObj);
            Store.set("contactList",list);
            this.contactInfo = list[cidx];
            Toast.show("申请已提交");
            this.render();
          })
        }
        previewWrap.appendChild(itemDiv);
      })
      wrap.appendChild(previewWrap);
    }else{
      //昵称文本池子
      const addRow = document.createElement("div");
      addRow.style.display = "flex";
      addRow.style.gap = "6px";
      const input = document.createElement("input");
      input.style.flex = "1";
      input.style.padding = "8px 10px";
      input.style.border = "1px solid #ddd";
      input.style.borderRadius = "8px";
      input.placeholder = "输入昵称";
      const addBtn = document.createElement("button");
      addBtn.innerText = "添加";
      addBtn.style.padding = "8px 12px";
      addBtn.style.border = "none";
      addBtn.style.borderRadius = "8px";
      addBtn.style.background = "#7c68ee";
      addBtn.style.color = "#fff";
      addBtn.onclick = ()=>{
        const val = input.value.trim();
        if(!val) return Toast.show("昵称不能为空");
        if(this.contactInfo[poolKey].includes(val)) return Toast.show("已存在");
        this.contactInfo[poolKey].push(val);
        this.saveContact();
        Toast.show("添加成功");
        this.render();
      }
      addRow.appendChild(input);
      addRow.appendChild(addBtn);
      wrap.appendChild(addRow);

      const listWrap = document.createElement("div");
      listWrap.style.marginTop = "10px";
      poolArr.forEach((text,idx)=>{
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space‑between";
        row.style.alignItems = "center";
        row.style.padding = "8px 0";
        row.style.borderBottom = "1px solid #f1f1f1";
        row.innerHTML = `
          <span style="font‑size:13px">${text}</span>
          <div style="display:flex;gap:4px">
            <button data‑pool="${poolKey}" data‑idx="${idx}" class="pool‑apply‑btn" style="border:none;background:#7c68ee;color:#fff;border‑radius:4px;padding:3px 6px;font‑size:11px">发起申请</button>
            <button data‑pool="${poolKey}" data‑idx="${idx}" class="pool‑del‑btn" style="border:none;background:#f33;color:#fff;border‑radius:4px;padding:3px 6px;font‑size:11px">删除</button>
          </div>
        `;
        //发起申请按钮
        row.querySelector(".pool‑apply‑btn").onclick = ()=>{
          let targetType;
          if(poolKey === "taNickPool") targetType = "taNick";
          if(poolKey === "myNickPool") targetType = "myNick";
          const applyObj = {
            applyId:Date.now().toString(),
            from:"me",
            targetType: targetType,
            newVal: text,
            createTs: Date.now(),
            expireMs: 2*3600*1000,
            status:"pending",
            desc:`申请变更${targetType==="taNick"?"对方昵称":"我的昵称为："+text}`
          }
          this.openApplyConfirmModal(applyObj,()=>{
            const list = Store.get("contactList",[]);
            const cidx = list.findIndex(x=>x.id === this.contactId);
            list[cidx].pendingApplyList.push(applyObj);
            Store.set("contactList",list);
            this.contactInfo = list[cidx];
            Toast.show("申请已提交");
            this.render();
          })
        }
        listWrap.appendChild(row);
      })
      wrap.appendChild(listWrap);
    }

    //删除条目事件
    wrap.querySelectorAll(".pool‑del‑btn").forEach(btn=>{
      btn.onclick = (e)=>{
        e.stopPropagation();
        const pKey = btn.dataset.pool;
        const idx = Number(btn.dataset.idx);
        this.contactInfo[pKey].splice(idx,1);
        this.saveContact();
        Toast.show("已删除");
        this.render();
      }
    })
    box.appendChild(wrap);
  }
};
