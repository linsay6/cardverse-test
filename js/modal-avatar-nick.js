import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

export const ModalAvatarNick = {
  maskDom: null,
  contactId: null,
  contactInfo: null,
  callbackClose: null,
  chatModuleRef: null,
  primaryColor: "#7c68ee",
  mainTab: "avatar",
  subTab: "ta",
  globalRotateTimer: null,

  startBackgroundRotate(){
    if(this.globalRotateTimer) return;
    this.globalRotateTimer = setInterval(()=>{
      this.checkAllContactRotate();
    }, 30 * 1000);
  },
  stopBackgroundRotate(){
    if(this.globalRotateTimer){
      clearInterval(this.globalRotateTimer);
      this.globalRotateTimer = null;
    }
  },

  checkAllContactRotate(){
    const contactList = Store.get("contactList", []);
    const nowTs = Date.now();
    contactList.forEach(contact=>{
      if(!contact) return;
      if(contact.taAvatarRandom?.enable && contact.taAvatarPool?.length>0){
        const cfg = contact.taAvatarRandom;
        const gapMinMs = cfg.minHour * 3600 * 1000;
        const gapMaxMs = cfg.maxHour * 3600 * 1000;
        const diff = nowTs - (cfg.lastTriggerTs||0);
        if(diff >= gapMinMs){
          const randWait = Math.floor(Math.random()*(gapMaxMs-gapMinMs)+gapMinMs);
          if(diff >= randWait){
            const randImg = contact.taAvatarPool[Math.floor(Math.random()*contact.taAvatarPool.length)];
            contact.taAvatarRandom.lastTriggerTs = nowTs;
            Store.set("contactList",contactList);
            const fakeApply = {
              targetType:"taAvatar",
              newVal:randImg,
              desc:`TA发起更换自己头像`,
              from:"ta"
            };
            if(this.maskDom){
              this.openApplyCountdownModal(fakeApply);
            }
          }
        }
      }
      if(contact.taNickRandom?.enable && contact.taNickPool?.length>0){
        const cfg = contact.taNickRandom;
        const gapMinMs = cfg.minHour * 3600 * 1000;
        const gapMaxMs = cfg.maxHour * 3600 * 1000;
        const diff = nowTs - (cfg.lastTriggerTs||0);
        if(diff >= gapMinMs){
          const randWait = Math.floor(Math.random()*(gapMaxMs-gapMinMs)+gapMinMs);
          if(diff >= randWait){
            const randNick = contact.taNickPool[Math.floor(Math.random()*contact.taNickPool.length)];
            contact.taNickRandom.lastTriggerTs = nowTs;
            Store.set("contactList",contactList);
            const fakeApply = {
              targetType:"taNick",
              newVal:randNick,
              desc:`TA发起变更自己昵称为：${randNick}`,
              from:"ta"
            };
            if(this.maskDom){
              this.openApplyCountdownModal(fakeApply);
            }
          }
        }
      }
    });
  },

  open(parentDom, cid, closeCb) {
    this.contactId = cid;
    this.callbackClose = closeCb;
    this.chatModuleRef = window.ChatModule;
    const theme = Store.get("app-theme", {});
    this.primaryColor = theme.colorMain || "#7c68ee";

    const list = Store.get("contactList", []);
    this.contactInfo = list.find(i => i.id === cid);
    if (!this.contactInfo) {
      Toast.show("找不到该联系人");
      return;
    }
    if(!this.contactInfo.taAvatarPool) this.contactInfo.taAvatarPool = [];
    if(!this.contactInfo.myAvatarPool) this.contactInfo.myAvatarPool = [];
    if(!this.contactInfo.taNickPool) this.contactInfo.taNickPool = [];
    if(!this.contactInfo.myNickPool) this.contactInfo.myNickPool = [];
    if(!this.contactInfo.pendingApplyList) this.contactInfo.pendingApplyList = [];
    if(!this.contactInfo.taAvatarRandom) this.contactInfo.taAvatarRandom = {enable:false,minHour:2,maxHour:6,lastTriggerTs:0};
    if(!this.contactInfo.taNickRandom) this.contactInfo.taNickRandom = {enable:false,minHour:2,maxHour:6,lastTriggerTs:0};
    if(!this.contactInfo.myAvatarRandom) this.contactInfo.myAvatarRandom = {enable:false,minHour:2,maxHour:6,lastTriggerTs:0};
    if(!this.contactInfo.myNickRandom) this.contactInfo.myNickRandom = {enable:false,minHour:2,maxHour:6,lastTriggerTs:0};
    if(!this.contactInfo.taApplyIntervalHours) this.contactInfo.taApplyIntervalHours = 4;

    this.mainTab = "avatar";
    this.subTab = "ta";

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

  openApplyCountdownModal(applyObj){
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.inset = "0";
    mask.style.background = "rgba(0,0,0,0.4)";
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
    let count = 5;
    const isMeSend = applyObj.from === "me";

    let titleText = "";
    let descText = "";
    let previewHtml = "";
    const taNick = this.contactInfo?.name || "TA";
    const myNick = "我";
    if(isMeSend){
      if(applyObj.targetType === "taAvatar"){
        titleText = `${myNick} 的换头像邀请`;
        descText = `你邀请${taNick}更换头像`;
        previewHtml = `<div style="margin:10px 0;text-align:center"><img src="${applyObj.newVal}" style="width:80px;height:80px;border-radius:8px;object-fit:cover"></div>`;
      }else if(applyObj.targetType === "taNick"){
        titleText = `${myNick} 的换昵称邀请`;
        descText = `你邀请${taNick}更换昵称`;
        previewHtml = `<div style="margin:10px 0;text-align:center;font-size:16px;color:#333">目标昵称：${applyObj.newVal}</div>`;
      }else if(applyObj.targetType === "myAvatar"){
        titleText = `${myNick} 的换头像邀请`;
        descText = `你申请变更自己的头像`;
        previewHtml = `<div style="margin:10px 0;text-align:center"><img src="${applyObj.newVal}" style="width:80px;height:80px;border-radius:8px;object-fit:cover"></div>`;
      }else if(applyObj.targetType === "myNick"){
        titleText = `${myNick} 的换昵称邀请`;
        descText = `你申请变更自己的昵称`;
        previewHtml = `<div style="margin:10px 0;text-align:center;font-size:16px;color:#333">目标昵称：${applyObj.newVal}</div>`;
      }
    }else{
      if(applyObj.targetType === "myAvatar"){
        titleText = `${taNick} 的换头像邀请`;
        descText = `${taNick} 邀请你换上这个头像`;
        previewHtml = `<div style="margin:10px 0;text-align:center"><img src="${applyObj.newVal}" style="width:80px;height:80px;border-radius:8px;object-fit:cover"></div>`;
      }else if(applyObj.targetType === "myNick"){
        titleText = `${taNick} 的换昵称邀请`;
        descText = `${taNick} 邀请你换上这个昵称`;
        previewHtml = `<div style="margin:10px 0;text-align:center;font-size:16px;color:#333">目标昵称：${applyObj.newVal}</div>`;
      }else if(applyObj.targetType === "taAvatar"){
        titleText = `${taNick} 的换头像邀请`;
        descText = `${taNick}申请变更自己头像`;
        previewHtml = `<div style="margin:10px 0;text-align:center"><img src="${applyObj.newVal}" style="width:80px;height:80px;border-radius:8px;object-fit:cover"></div>`;
      }else if(applyObj.targetType === "taNick"){
        titleText = `${taNick} 的换昵称邀请`;
        descText = `${taNick}申请变更自己昵称为：${applyObj.newVal}`;
        previewHtml = `<div style="margin:10px 0;text-align:center;font-size:16px;color:#333">目标昵称：${applyObj.newVal}</div>`;
      }
    }

    const btnHtml = isMeSend ? "" : `
      <div style="display:flex;gap:10px;margin-top:10px">
        <button id="apply-reject" style="flex:1;padding:9px;border:1px solid #ccc;background:#fff;border-radius:8px">拒绝</button>
        <button id="apply-accept" style="flex:1;padding:9px;background:${this.primaryColor};color:#fff;border:none;border-radius:8px">同意</button>
      </div>
    `;
    modal.innerHTML = `
      <div style="font-weight:bold;font-size:16px;margin-bottom:12px">${titleText}</div>
      <div style="font-size:14px;color:#444;margin-bottom:12px">${descText}</div>
      ${previewHtml}
      <div id="count-text" style="font-size:13px;color:#777;margin-bottom:16px">等待判断，剩余 ${count} 秒</div>
      ${btnHtml}
    `;
    mask.appendChild(modal);
    document.body.appendChild(mask);
    const countText = modal.querySelector("#count-text");
    let timer = setInterval(()=>{
      count--;
      countText.textContent = `等待判断，剩余 ${count} 秒`;
      if(count <=0){
        clearInterval(timer);
        const autoResult = Math.random()>0.5 ? "accept":"reject";
        countText.textContent = autoResult==="accept" ? "自动判定：已同意申请" : "自动判定：拒绝申请";
        this.doApplyResult(applyObj, autoResult);
        setTimeout(()=>mask.remove(),1200);
      }
    },1000);
    const clean = ()=>{
      clearInterval(timer);
      mask.remove();
    };
    if(!isMeSend){
      modal.querySelector("#apply-accept").onclick = ()=>{
        clean();
        this.doApplyResult(applyObj,"accept");
      };
      modal.querySelector("#apply-reject").onclick = ()=>{
        clean();
        this.doApplyResult(applyObj,"reject");
      };
    }
    mask.onclick = (e)=>{if(e.target===mask) clean();};
  },

  doApplyResult(applyObj,action){
    const list = Store.get("contactList",[]);
    const idx = list.findIndex(x=>x.id === this.contactId);
    if(idx === -1) return;
    const contact = list[idx];
    const taNick = contact?.name||"TA";
    let logText = "";
    let logImg = null; // 新增：用于系统通知的图片

    // 文案对齐图2，自然语言描述
    if(action === "accept"){
      switch(applyObj.targetType){
        case "taAvatar": 
          contact.avatar = applyObj.newVal; 
          logText = applyObj.from==="ta" ? `TA更换了自己的头像` : `TA同意了我的换头像邀请`;
          logImg = contact.avatar; // 新头像
          break;
        case "taNick": 
          contact.name = applyObj.newVal; 
          logText = applyObj.from==="ta" ? `TA更换了自己的昵称为：${applyObj.newVal}` : `TA同意了我的换昵称邀请，昵称换成了「${applyObj.newVal}」`;
          // 无图片
          break;
        case "myAvatar": 
          contact.myAvatar = applyObj.newVal; 
          logText = applyObj.from==="ta" ? `我同意了TA的换头像邀请` : `我更换了自己的头像`;
          logImg = contact.myAvatar; // 我的新头像
          break;
        case "myNick": 
          contact.myNick = applyObj.newVal; 
          logText = applyObj.from==="ta" ? `我同意了TA的换昵称邀请，我的昵称换成了「${applyObj.newVal}」` : `我更换了自己的昵称为：${applyObj.newVal}`;
          // 无图片
          break;
      }
    }else{
      switch(applyObj.targetType){
        case "taAvatar": 
          logText = applyObj.from==="ta" ? `TA取消了换头像申请` : `TA拒绝了我的换头像邀请`;
          logImg = contact.avatar; // 保持原头像
          break;
        case "taNick": 
          logText = applyObj.from==="ta" ? `TA取消了换昵称申请` : `TA拒绝了我的换昵称邀请，昵称保持不变`;
          // 无图片
          break;
        case "myAvatar": 
          logText = applyObj.from==="ta" ? `我拒绝了TA的换头像邀请` : `我取消了换头像申请`;
          logImg = contact.myAvatar; // 保持原头像
          break;
        case "myNick": 
          logText = applyObj.from==="ta" ? `我拒绝了TA的换昵称邀请，我的昵称保持不变` : `我取消了换昵称申请`;
          // 无图片
          break;
      }
    }
    
    // 写入聊天记录，持久化保存，同时把可能存在的图片传进去
    if(this.chatModuleRef?.pushSystemNotice){
      this.chatModuleRef.pushSystemNotice(logText, logImg);
    }
    Store.set("contactList",list);
    this.contactInfo = contact;
    EventBus.emit("contactInfoChange",this.contactId);
    Toast.show(action==="accept"?"已同意":"已拒绝");
    this.render();
  },

  render() {
    if(!this.maskDom) return;
    this.maskDom.innerHTML = "";
    const panel = document.createElement("div");
    panel.style.width = "90%";
    panel.style.maxWidth = "420px";
    panel.style.maxHeight = "82vh";
    panel.style.background = "#fff";
    panel.style.borderRadius = "16px";
    panel.style.overflow = "auto";
    panel.style.scrollbarWidth = "none";
    panel.style.msOverflowStyle = "none";
    panel.id = "modal-panel";
    const panelScrollStyle = document.createElement("style");
    panelScrollStyle.textContent = `#modal-panel::-webkit-scrollbar{display:none}`;
    document.head.appendChild(panelScrollStyle);

    const head = document.createElement("div");
    head.style.padding = "14px 16px";
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.style.alignItems = "center";
    head.style.borderBottom = "1px solid #eee";
    head.innerHTML = `<span style="font-weight:bold;font-size:16px">头像昵称互动</span><button id="modal-an-close" style="border:none;background:none;font-size:20px">×</button>`;
    panel.appendChild(head);

    const testBar = document.createElement("div");
    testBar.style.padding="8px 16px";
    testBar.style.background="#fff0cc";
    testBar.style.borderBottom="1px solid #eee";
    testBar.innerHTML=`
      <div style="font-size:12px;color:#999;margin-bottom:4px">【本地模拟测试｜发布版本删除此块】</div>
      <button id="sim-ta-avatar" style="padding:4px 8px;margin-right:6px">模拟TA发起头像申请</button>
      <button id="sim-ta-nick" style="padding:4px 8px">模拟TA发起昵称申请</button>
    `;
    panel.appendChild(testBar);

    const mainTabWrap = document.createElement("div");
    mainTabWrap.style.display = "flex";
    mainTabWrap.style.borderBottom = "1px solid #eee";
    mainTabWrap.style.margin = "0 16px";
    ["avatar","nick"].forEach(t=>{
      const tabBtn = document.createElement("div");
      tabBtn.innerText = t==="avatar"?"头像":"昵称";
      tabBtn.style.flex = "1";
      tabBtn.style.textAlign = "center";
      tabBtn.style.padding = "11px 0";
      tabBtn.style.cursor = "pointer";
      tabBtn.style.fontSize = "14px";
      if(this.mainTab === t){
        tabBtn.style.fontWeight = "bold";
        tabBtn.style.borderBottom = "2px solid #222";
      }
      tabBtn.onclick = ()=>{
        this.mainTab = t;
        this.subTab = "ta";
        this.render();
      };
      mainTabWrap.appendChild(tabBtn);
    })
    panel.appendChild(mainTabWrap);

    const subTabWrap = document.createElement("div");
    subTabWrap.style.display = "flex";
    subTabWrap.style.margin = "12px 16px";
    subTabWrap.style.borderRadius = "8px";
    subTabWrap.style.overflow = "hidden";
    const subItems = this.mainTab==="avatar"
      ?[{k:"ta",label:`TA头像池(${this.contactInfo.taAvatarPool.length})`},{k:"mine",label:`我的头像池(${this.contactInfo.myAvatarPool.length})`}]
      :[{k:"ta",label:`TA昵称池(${this.contactInfo.taNickPool.length})`},{k:"mine",label:`我的昵称池(${this.contactInfo.myNickPool.length})`}];
    subItems.forEach(s=>{
      const btn = document.createElement("div");
      btn.innerText = s.label;
      btn.style.flex = "1";
      btn.style.textAlign = "center";
      btn.style.padding = "9px 0";
      btn.style.cursor = "pointer";
      btn.style.fontSize = "13px";
      if(this.subTab === s.k){
        btn.style.background = this.primaryColor;
        btn.style.color = "#fff";
      }else{
        btn.style.background = "#f3f3f3";
      }
      btn.onclick = ()=>{
        this.subTab = s.k;
        this.render();
      };
      subTabWrap.appendChild(btn);
    })
    panel.appendChild(subTabWrap);

    const contentWrap = document.createElement("div");
    contentWrap.style.padding = "0 16px 18px 16px";

    const randBox = document.createElement("div");
    randBox.style.marginBottom = "14px";
    randBox.style.borderBottom = "1px solid #eee";
    randBox.innerHTML = `<div style="font-weight:bold;font-size:14px;margin-bottom:8px">随机轮换设置（最小‑最大小时区间随机触发）</div>`;
    const switchCss = document.createElement("style");
    switchCss.textContent = `
    .switch input{display:none}
    .switch span{width:40px;height:20px;background:#ccc;border-radius:20px;display:block;position:relative}
    .switch span:after{content:"";width:16px;height:16px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:0.2s}
    .switch input:checked+span{background:${this.primaryColor}}
    .switch input:checked+span:after{left:22px}
    `;
    randBox.appendChild(switchCss);

    if(this.mainTab === "avatar"){
      const key = this.subTab==="ta"?"taAvatarRandom":"myAvatarRandom";
      const cfg = this.contactInfo[key];
      const rowDiv = document.createElement("div");
      rowDiv.style.display = "flex";
      rowDiv.style.justifyContent = "space-between";
      rowDiv.style.alignItems = "center";
      rowDiv.style.padding = "8px 0";
      rowDiv.innerHTML = `<span style="font-size:13px">${this.subTab==="ta"?"TA头像随机轮换":"我的头像随机轮换"}</span><label class="switch"><input type="checkbox" ${cfg.enable?"checked":""}><span></span></label>`;
      const ck = rowDiv.querySelector("input");
      ck.onchange = ()=>{
        this.contactInfo[key].enable = ck.checked;
        this.saveContact();
        Toast.show("已保存轮换设置");
        this.render();
      };
      randBox.appendChild(rowDiv);

      const hourRow = document.createElement("div");
      hourRow.style.display = "flex";
      hourRow.style.alignItems = "center";
      hourRow.style.justifyContent = "space-between";
      hourRow.style.padding = "6px 0 8px 0";
      const minVal = Number(cfg.minHour ?? 2);
      hourRow.innerHTML = `
        <span style="font-size:13px">最小小时</span>
        <input id="rand-min" type="number" min="1" value="${minVal}" style="width:60px;padding:6px;border:1px solid #ddd;border-radius:6px;text-align:center">
      `;
      randBox.appendChild(hourRow);
      const hourRow2 = document.createElement("div");
      hourRow2.style.display = "flex";
      hourRow2.style.alignItems = "center";
      hourRow2.style.justifyContent = "space-between";
      hourRow2.style.padding = "6px 0 8px 0";
      const maxVal = Number(cfg.maxHour ??6);
      hourRow2.innerHTML = `
        <span style="font-size:13px">最大小时</span>
        <input id="rand-max" type="number" min="1" value="${maxVal}" style="width:60px;padding:6px;border:1px solid #ddd;border-radius:6px;text-align:center">
      `;
      randBox.appendChild(hourRow2);
    }else{
      const key = this.subTab==="ta"?"taNickRandom":"myNickRandom";
      const cfg = this.contactInfo[key];
      const rowDiv = document.createElement("div");
      rowDiv.style.display = "flex";
      rowDiv.style.justifyContent = "space-between";
      rowDiv.style.alignItems = "center";
      rowDiv.style.padding = "8px 0";
      rowDiv.innerHTML = `<span style="font-size:13px">${this.subTab==="ta"?"TA昵称随机轮换":"我的昵称随机轮换"}</span><label class="switch"><input type="checkbox" ${cfg.enable?"checked":""}><span></span></label>`;
      const ck = rowDiv.querySelector("input");
      ck.onchange = ()=>{
        this.contactInfo[key].enable = ck.checked;
        this.saveContact();
        Toast.show("已保存轮换设置");
        this.render();
      };
      randBox.appendChild(rowDiv);

      const hourRow = document.createElement("div");
      hourRow.style.display = "flex";
      hourRow.style.alignItems = "center";
      hourRow.style.justifyContent = "space-between";
      hourRow.style.padding = "6px 0 8px 0";
      const minVal = Number(cfg.minHour ??2);
      hourRow.innerHTML = `
        <span style="font-size:13px">最小小时</span>
        <input id="rand-min" type="number" min="1" value="${minVal}" style="width:60px;padding:6px;border:1px solid #ddd;border-radius:6px;text-align:center">
      `;
      randBox.appendChild(hourRow);
      const hourRow2 = document.createElement("div");
      hourRow2.style.display = "flex";
      hourRow2.style.alignItems = "center";
      hourRow2.style.justifyContent = "space-between";
      hourRow2.style.padding = "6px 0 8px 0";
      const maxVal = Number(cfg.maxHour ??6);
      hourRow2.innerHTML = `
        <span style="font-size:13px">最大小时</span>
        <input id="rand-max" type="number" min="1" value="${maxVal}" style="width:60px;padding:6px;border:1px solid #ddd;border-radius:6px;text-align:center">
      `;
      randBox.appendChild(hourRow2);
    }
    contentWrap.appendChild(randBox);

    const inMin = panel.querySelector("#rand-min");
    const inMax = panel.querySelector("#rand-max");
    if(inMin&&inMax){
      const key = this.mainTab==="avatar" ? (this.subTab==="ta"?"taAvatarRandom":"myAvatarRandom") : (this.subTab==="ta"?"taNickRandom":"myNickRandom");
      inMin.onchange = ()=>{
        const v1 = Number(inMin.value);
        const v2 = Number(inMax.value);
        if(v1>=1 && v2>=v1){
          this.contactInfo[key].minHour = v1;
          this.contactInfo[key].maxHour = v2;
          this.saveContact();
          Toast.show("区间已保存");
        }else{
          Toast.show("最大必须大于等于最小");
        }
      }
      inMax.onchange = ()=>{
        const v1 = Number(inMin.value);
        const v2 = Number(inMax.value);
        if(v1>=1 && v2>=v1){
          this.contactInfo[key].minHour = v1;
          this.contactInfo[key].maxHour = v2;
          this.saveContact();
          Toast.show("区间已保存");
        }else{
          Toast.show("最大必须大于等于最小");
        }
      }
    }

    let poolArr,poolKey,targetType;
    if(this.mainTab==="avatar"){
      if(this.subTab==="ta"){poolArr=this.contactInfo.taAvatarPool;poolKey="taAvatarPool";targetType="taAvatar";}
      else{poolArr=this.contactInfo.myAvatarPool;poolKey="myAvatarPool";targetType="myAvatar";}
    }else{
      if(this.subTab==="ta"){poolArr=this.contactInfo.taNickPool;poolKey="taNickPool";targetType="taNick";}
      else{poolArr=this.contactInfo.myNickPool;poolKey="myNickPool";targetType="myNick";}
    }

    const poolArea = document.createElement("div");
    if(this.mainTab==="avatar"){
      const fileInput = document.createElement("input");
      fileInput.type="file";
      fileInput.accept="image/*";
      fileInput.multiple=true;
      fileInput.style.display="none";
      const btnRow = document.createElement("div");
      btnRow.style.display = "flex";
      btnRow.style.gap = "8px";
      btnRow.style.marginBottom = "12px";
      const batchBtn = document.createElement("button");
      batchBtn.innerText = "批量添加头像";
      batchBtn.style.flex="1";
      batchBtn.style.padding="9px";
      batchBtn.style.border="1px solid #ddd";
      batchBtn.style.borderRadius="8px";
      batchBtn.style.background="#f7f7f7";
      batchBtn.onclick = ()=> fileInput.click();
      const clearBtn = document.createElement("button");
      clearBtn.innerText = "清空池子";
      clearBtn.style.flex="1";
      clearBtn.style.padding="9px";
      clearBtn.style.border="1px solid #ddd";
      clearBtn.style.borderRadius="8px";
      clearBtn.style.background="#f7f7f7";
      clearBtn.onclick = ()=>{
        if(confirm("确定清空当前池子全部内容？")){
          this.contactInfo[poolKey] = [];
          this.saveContact();
          Toast.show("已清空");
          this.render();
        }
      };
      btnRow.appendChild(batchBtn);
      btnRow.appendChild(clearBtn);
      poolArea.appendChild(fileInput);
      poolArea.appendChild(btnRow);
      fileInput.onchange = async (ev)=>{
        const files = Array.from(ev.target.files);
        for(const f of files){
          const b64 = await new Promise(res=>{
            const r = new FileReader();
            r.onload = e=>res(e.target.result);
            r.readAsDataURL(f);
          });
          if(!this.contactInfo[poolKey].includes(b64)){
            this.contactInfo[poolKey].push(b64);
          }
        }
        this.saveContact();
        Toast.show(`添加${files.length}张图片`);
        this.render();
      };
      const gridWrap = document.createElement("div");
      gridWrap.style.display = "grid";
      gridWrap.style.gridTemplateColumns = "repeat(4,1fr)";
      gridWrap.style.gap = "10px";
      poolArr.forEach((src,idx)=>{
        const itemDiv = document.createElement("div");
        itemDiv.style.position = "relative";
        itemDiv.style.aspectRatio = "1/1";
        itemDiv.style.borderRadius = "8px";
        itemDiv.style.overflow = "hidden";
        itemDiv.style.border = "1px solid #ddd";
        itemDiv.innerHTML = `
          <img src="${src}" style="width:100%;height:100%;object-fit:cover">
          <button data-del-idx="${idx}" style="position:absolute;top:2px;right:2px;width:18px;height:18px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;font-size:10px">×</button>
        `;
        itemDiv.onclick = (e)=>{
          if(e.target.tagName==="BUTTON") return;
          if(this.subTab === "mine"){
            this.contactInfo.myAvatar = src;
            const logText = `我更换了自己的头像`;
            if(this.chatModuleRef?.pushSystemNotice) {
              this.chatModuleRef.pushSystemNotice(logText, src);
            }
            this.saveContact();
            Toast.show("已更换我的头像");
            this.render();
          }else{
            const desc = `申请变更对方头像`;
            const applyObj = {targetType,newVal:src,desc,from:"me"};
            this.openApplyCountdownModal(applyObj);
          }
        };
        gridWrap.appendChild(itemDiv);
      })
      poolArea.appendChild(gridWrap);
    }else{
      const inputRow = document.createElement("div");
      inputRow.style.display = "flex";
      inputRow.style.flexDirection = "column";
      inputRow.style.gap = "8px";
      inputRow.style.marginBottom = "12px";
      const nickInput = document.createElement("textarea");
      nickInput.rows=3;
      nickInput.style.padding = "9px";
      nickInput.style.border = "1px solid #ddd";
      nickInput.style.borderRadius = "8px";
      nickInput.placeholder = "可粘贴多条，换行分隔不同昵称";
      const btnLine = document.createElement("div");
      btnLine.style.display="flex";
      btnLine.style.gap="8px";
      const addBtn = document.createElement("button");
      addBtn.innerText = "解析并批量添加";
      addBtn.style.padding = "9px 12px";
      addBtn.style.border = "none";
      addBtn.style.borderRadius = "8px";
      addBtn.style.background = this.primaryColor;
      addBtn.style.color = "#fff";
      addBtn.onclick = ()=>{
        const raw = nickInput.value;
        const lines = raw.split(/\r?\n/).map(s=>s.trim()).filter(s=>!!s);
        if(lines.length===0){
          Toast.show("没有有效昵称");
          return;
        }
        let addCount = 0;
        lines.forEach(v=>{
          if(!this.contactInfo[poolKey].includes(v)){
            this.contactInfo[poolKey].push(v);
            addCount++;
          }
        })
        this.saveContact();
        Toast.show(`成功新增${addCount}条昵称`);
        nickInput.value="";
        this.render();
      };
      const clearBtn = document.createElement("button");
      clearBtn.innerText = "清空池子";
      clearBtn.style.padding = "9px 12px";
      clearBtn.style.border = "1px solid #ddd";
      clearBtn.style.borderRadius = "8px";
      clearBtn.style.background="#f7f7f7";
      clearBtn.onclick = ()=>{
        if(confirm("确定清空当前池子全部昵称？")){
          this.contactInfo[poolKey] = [];
          this.saveContact();
          Toast.show("已清空");
          this.render();
        }
      };
      btnLine.appendChild(addBtn);
      btnLine.appendChild(clearBtn);
      inputRow.appendChild(nickInput);
      inputRow.appendChild(btnLine);
      poolArea.appendChild(inputRow);

      const listWrap = document.createElement("div");
      poolArr.forEach((text,idx)=>{
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.padding = "9px 0";
        row.style.borderBottom = "1px solid #f1f1f1";
        row.innerHTML = `
  <span style="font-size:13px">${text}</span>
  <div style="display:flex;gap:6px;margin-left:auto">
    <button data-apply-idx="${idx}" style="border:none;background:${this.primaryColor};color:#fff;border-radius:4px;padding:4px 7px;font-size:11px">发起申请</button>
    <button data-del-idx="${idx}" style="border:none;background:#f44336;color:#fff;border-radius:4px;padding:4px 7px;font-size:11px">删除</button>
  </div>
`;
        listWrap.appendChild(row);
      })
      poolArea.appendChild(listWrap);
    }
    contentWrap.appendChild(poolArea);
    panel.appendChild(contentWrap);
    this.maskDom.appendChild(panel);

    const simAvatarBtn = panel.querySelector("#sim-ta-avatar");
    const simNickBtn = panel.querySelector("#sim-ta-nick");
    if(simAvatarBtn){
      simAvatarBtn.onclick=()=>{
        const fakeApply = {
          targetType:"myAvatar",
          newVal:"",
          desc:"TA向我发起变更我的头像申请",
          from:"ta"
        };
        this.openApplyCountdownModal(fakeApply);
      }
    }
    if(simNickBtn){
      simNickBtn.onclick=()=>{
        const fakeApply = {
          targetType:"myNick",
          newVal:"星光",
          desc:`TA向我发起变更我的昵称为：星光`,
          from:"ta"
        };
        this.openApplyCountdownModal(fakeApply);
      }
    }

    panel.querySelectorAll("[data-del-idx]").forEach(btn=>{
      btn.onclick = (e)=>{
        e.stopPropagation();
        const idx = Number(btn.dataset.delIdx);
        this.contactInfo[poolKey].splice(idx,1);
        this.saveContact();
        Toast.show("已删除");
        this.render();
      };
    })
    panel.querySelectorAll("[data-apply-idx]").forEach(btn=>{
      btn.onclick = ()=>{
        const idx = Number(btn.dataset.applyIdx);
        const val = poolArr[idx];
        if(this.subTab === "mine"){
          this.contactInfo.myNick = val;
          if(this.chatModuleRef?.pushSystemNotice) {
            this.chatModuleRef.pushSystemNotice(`我更换了自己的昵称为：${val}`);
          }
          this.saveContact();
          Toast.show("已更换我的昵称");
          this.render();
        }else{
          const desc = `申请变更对方昵称为：${val}`;
          const applyObj = {targetType,newVal:val,desc,from:"me"};
          this.openApplyCountdownModal(applyObj);
        }
      };
    });

    const closeBtn = panel.querySelector("#modal-an-close");
    if(closeBtn){
      closeBtn.onclick = (e)=>{
        e.stopPropagation();
        this.close();
      };
    }
  }
};
