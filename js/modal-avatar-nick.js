import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

export const ModalAvatarNick = {
  maskDom: null,
  contactId: null,
  contactInfo: null,
  callbackClose: null,
  chatModuleRef: null,
  primaryColor: "#4caf50",

  open(parentDom, cid, closeCb) {
    this.contactId = cid;
    this.callbackClose = closeCb;
    this.chatModuleRef = window.ChatModule;
    this.primaryColor = Store.get("theme")?.primaryColor || "#4caf50";
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
    // 判断是谁发起申请：from == me 我发给TA，隐藏同意拒绝按钮
    const isMeSend = applyObj.from === "me";
    const btnHtml = isMeSend ? "" : `
      <div style="display:flex;gap:10px;margin-top:10px">
        <button id="apply-reject" style="flex:1;padding:9px;border:1px solid #ccc;background:#fff;border-radius:8px">拒绝</button>
        <button id="apply-accept" style="flex:1;padding:9px;background:${this.primaryColor};color:#fff;border:none;border-radius:8px">同意</button>
      </div>
    `;
    modal.innerHTML = `
      <div style="font-weight:bold;font-size:16px;margin-bottom:12px">提交变更申请</div>
      <div style="font-size:14px;color:#444;margin-bottom:12px">${applyObj.desc}</div>
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
        mask.remove();
        const autoResult = Math.random()>0.5 ? "accept":"reject";
        this.doApplyResult(applyObj, autoResult);
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
    if(action === "accept"){
      switch(applyObj.targetType){
        case "taAvatar": contact.avatar = applyObj.newVal; break;
        case "taNick": contact.name = applyObj.newVal; break;
        case "myAvatar": contact.myAvatar = applyObj.newVal; break;
        case "myNick": contact.myNick = applyObj.newVal; break;
      }
      if(this.chatModuleRef?.pushNoticeMessage){
        this.chatModuleRef.pushNoticeMessage(`${applyObj.desc} —— 已同意`,"me");
      }
    }else{
      if(this.chatModuleRef?.pushNoticeMessage){
        this.chatModuleRef.pushNoticeMessage(`${applyObj.desc} —— 已拒绝`,"me");
      }
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

    const head = document.createElement("div");
    head.style.padding = "14px 16px";
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.style.alignItems = "center";
    head.style.borderBottom = "1px solid #eee";
    head.innerHTML = `<span style="font-weight:bold;font-size:16px">头像昵称互动</span><button id="modal-an-close" style="border:none;background:none;font-size:20px">×</button>`;
    panel.appendChild(head);

    //一级tab：头像 / 昵称
    let mainTab = "avatar";
    let subTab = "ta";
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
      if(mainTab === t){
        tabBtn.style.fontWeight = "bold";
        tabBtn.style.borderBottom = "2px solid #222";
      }
      tabBtn.onclick = ()=>{
        mainTab = t;
        subTab = "ta";
        this.render();
      };
      mainTabWrap.appendChild(tabBtn);
    })
    panel.appendChild(mainTabWrap);

    //二级tab TA /我的
    const subTabWrap = document.createElement("div");
    subTabWrap.style.display = "flex";
    subTabWrap.style.margin = "12px 16px";
    subTabWrap.style.borderRadius = "8px";
    subTabWrap.style.overflow = "hidden";
    const subItems = mainTab==="avatar"
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
      if(subTab === s.k){
        btn.style.background = "#222";
        btn.style.color = "#fff";
      }else{
        btn.style.background = "#f3f3f3";
      }
      btn.onclick = ()=>{
        subTab = s.k;
        this.render();
      };
      subTabWrap.appendChild(btn);
    })
    panel.appendChild(subTabWrap);

    const contentWrap = document.createElement("div");
    contentWrap.style.padding = "0 16px 18px 16px";

    //轮换设置 + 间隔小时输入框
    const randBox = document.createElement("div");
    randBox.style.marginBottom = "14px";
    randBox.style.borderBottom = "1px solid #eee";
    randBox.innerHTML = `<div style="font-weight:bold;font-size:14px;margin-bottom:8px">随机轮换设置</div>`;
    const switchCss = document.createElement("style");
    switchCss.textContent = `
    .switch input{display:none}
    .switch span{width:40px;height:20px;background:#ccc;border-radius:20px;display:block;position:relative}
    .switch span:after{content:"";width:16px;height:16px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:0.2s}
    .switch input:checked+span{background:${this.primaryColor}}
    .switch input:checked+span:after{left:22px}
    `;
    randBox.appendChild(switchCss);
    if(mainTab === "avatar"){
      const key = subTab==="ta"?"taAvatarRandom":"myAvatarRandom";
      const cfg = this.contactInfo[key];
      const rowDiv = document.createElement("div");
      rowDiv.style.display = "flex";
      rowDiv.style.justifyContent = "space-between";
      rowDiv.style.alignItems = "center";
      rowDiv.style.padding = "8px 0";
      rowDiv.innerHTML = `
        <span style="font-size:13px">${subTab==="ta"?"TA头像随机轮换":"我的头像随机轮换"}</span>
        <label class="switch"><input type="checkbox" ${cfg.enable?"checked":""}><span></span></label>
      `;
      const ck = rowDiv.querySelector("input");
      ck.onchange = ()=>{
        this.contactInfo[key].enable = ck.checked;
        this.saveContact();
        Toast.show("已保存轮换设置");
        this.render();
      };
      randBox.appendChild(rowDiv);
      //间隔时长输入
      const hourRow = document.createElement("div");
      hourRow.style.display = "flex";
      hourRow.style.alignItems = "center";
      hourRow.style.justifyContent = "space-between";
      hourRow.style.padding = "6px 0 8px 0";
      hourRow.innerHTML = `
        <span style="font-size:13px">轮换间隔（小时）</span>
        <input type="number" min="1" value="${cfg.intervalHour}" style="width:70px;padding:6px;border:1px solid #ddd;border-radius:6px;text-align:center">
      `;
      const hourInput = hourRow.querySelector("input");
      hourInput.onchange = ()=>{
        const val = Number(hourInput.value);
        if(val >= 1) {
          this.contactInfo[key].intervalHour = val;
          this.saveContact();
          Toast.show("间隔已更新");
        }
      }
      randBox.appendChild(hourRow);
    }else{
      const key = subTab==="ta"?"taNickRandom":"myNickRandom";
      const cfg = this.contactInfo[key];
      const rowDiv = document.createElement("div");
      rowDiv.style.display = "flex";
      rowDiv.style.justifyContent = "space-between";
      rowDiv.style.alignItems = "center";
      rowDiv.style.padding = "8px 0";
      rowDiv.innerHTML = `
        <span style="font-size:13px">${subTab==="ta"?"TA昵称随机轮换":"我的昵称随机轮换"}</span>
        <label class="switch"><input type="checkbox" ${cfg.enable?"checked":""}><span></span></label>
      `;
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
      hourRow.innerHTML = `
        <span style="font-size:13px">轮换间隔（小时）</span>
        <input type="number" min="1" value="${cfg.intervalHour}" style="width:70px;padding:6px;border:1px solid #ddd;border-radius:6px;text-align:center">
      `;
      const hourInput = hourRow.querySelector("input");
      hourInput.onchange = ()=>{
        const val = Number(hourInput.value);
        if(val >= 1) {
          this.contactInfo[key].intervalHour = val;
          this.saveContact();
          Toast.show("间隔已更新");
        }
      }
      randBox.appendChild(hourRow);
    }
    contentWrap.appendChild(randBox);

    let poolArr,poolKey,targetType;
    const taName = this.contactInfo.name;
    const myName = "我";
    if(mainTab==="avatar"){
      if(subTab==="ta"){
        poolArr=this.contactInfo.taAvatarPool;poolKey="taAvatarPool";targetType="taAvatar";
      }
      else{
        poolArr=this.contactInfo.myAvatarPool;poolKey="myAvatarPool";targetType="myAvatar";
      }
    }else{
      if(subTab==="ta"){
        poolArr=this.contactInfo.taNickPool;poolKey="taNickPool";targetType="taNick";
      }
      else{
        poolArr=this.contactInfo.myNickPool;poolKey="myNickPool";targetType="myNick";
      }
    }

    const poolArea = document.createElement("div");
    if(mainTab==="avatar"){
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
          const desc = subTab==="ta" ? `${myName}申请变更${taName}头像` : `${myName}申请变更自己头像`;
          const applyObj = {targetType,newVal:src,desc,from:"me"};
          this.openApplyCountdownModal(applyObj);
        };
        gridWrap.appendChild(itemDiv);
      })
      poolArea.appendChild(gridWrap);
    }else{
      const inputRow = document.createElement("div");
      inputRow.style.display = "flex";
      inputRow.style.gap = "8px";
      inputRow.style.marginBottom = "12px";
      const nickInput = document.createElement("input");
      nickInput.style.flex = "1";
      nickInput.style.padding = "9px";
      nickInput.style.border = "1px solid #ddd";
      nickInput.style.borderRadius = "8px";
      nickInput.placeholder = "输入昵称";
      const addBtn = document.createElement("button");
      addBtn.innerText = "添加";
      addBtn.style.padding = "9px 12px";
      addBtn.style.border = "none";
      addBtn.style.borderRadius = "8px";
      addBtn.style.background = this.primaryColor;
      addBtn.style.color = "#fff";
      addBtn.onclick = ()=>{
        const v = nickInput.value.trim();
        if(!v) return Toast.show("昵称不能为空");
        if(this.contactInfo[poolKey].includes(v)) return Toast.show("已存在");
        this.contactInfo[poolKey].push(v);
        this.saveContact();
        Toast.show("添加成功");
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
      inputRow.appendChild(nickInput);
      inputRow.appendChild(addBtn);
      inputRow.appendChild(clearBtn);
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
          <div style="display:flex;gap:6px">
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
        const desc = subTab==="ta" ? `${myName}申请变更${taName}昵称为：${val}` : `${myName}申请变更自己昵称为：${val}`;
        const applyObj = {targetType,newVal:val,desc,from:"me"};
        this.openApplyCountdownModal(applyObj);
      };
    });

    const closeBtn = panel.querySelector("#modal-an-close");
    if(closeBtn) closeBtn.onclick = ()=>this.close();
    this.maskDom.onclick = (e)=>{if(e.target === this.maskDom) this.close();};
  }
};
