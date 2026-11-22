import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

export const AvatarNickModal = {
  parentContainer: null,
  contactId: null,
  contactInfo: null,
  activeSubTab: "昵称",
  subTabList: ["头像", "昵称"],
  onCloseCb: null,

  open(parentDom, cid, closeCb) {
    this.parentContainer = parentDom;
    this.contactId = cid;
    this.onCloseCb = closeCb;
    const list = Store.get("contactList", []);
    this.contactInfo = list.find(i => i.id === this.contactId);
    this.render();
  },
  close() {
    if(this.parentContainer) this.parentContainer.innerHTML = "";
    if(typeof this.onCloseCb === "function") this.onCloseCb();
  },

  openApplyConfirmModal(applyObj, onConfirm) {
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.inset = "0";
    mask.style.background = "rgba(0,0,0,0.35)";
    mask.style.zIndex = "10000";
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
      <div style="font-weight:bold;font-size:16px;margin-bottom:12px">提交变更申请</div>
      <div style="font-size:14px;color:#444;margin-bottom:16px">${applyObj.desc}</div>
      <div style="font-size:12px;color:#888;margin-bottom:16px">超时2小时未处理将自动同意该申请</div>
      <div style="display:flex;gap:10px">
        <button id="apply-cancel" style="flex:1;padding:9px;border:1px solid #ccc;background:#fff;border-radius:8px">取消</button>
        <button id="apply-ok" style="flex:1;padding:9px;background:#7c68ee;color:#fff;border:none;border-radius:8px">提交申请</button>
      </div>
    `;
    mask.appendChild(modal);
    document.body.appendChild(mask);
    document.getElementById("apply-cancel").onclick = ()=> mask.remove();
    document.getElementById("apply-ok").onclick = ()=>{
      mask.remove();
      onConfirm();
    };
    mask.onclick = e=>{ if(e.target===mask) mask.remove(); };
  },

  handleApplyAction(applyId, action) {
    const list = Store.get("contactList",[]);
    const idx = list.findIndex(x=>x.id === this.contactId);
    if(idx === -1) return;
    const contact = list[idx];
    const applyIdx = contact.pendingApplyList.findIndex(a=>a.applyId === applyId);
    if(applyIdx === -1) return;
    const apply = contact.pendingApplyList[applyIdx];
    if(action === "accept"){
      switch(apply.targetType){
        case "taAvatar": contact.avatar = apply.newVal; break;
        case "taNick": contact.name = apply.newVal; break;
        case "myAvatar": contact.myAvatar = apply.newVal; break;
        case "myNick": contact.myNick = apply.newVal; break;
      }
      EventBus.emit("contactInfoChange", this.contactId);
    }
    contact.pendingApplyList.splice(applyIdx,1);
    Store.set("contactList",list);
    this.contactInfo = contact;
    Toast.show(action==="accept"?"已同意申请":"已拒绝申请");
    this.render();
  },

  render() {
    if (!this.parentContainer) return;
    this.parentContainer.innerHTML = "";
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.inset = "0";
    mask.style.zIndex = "9999";
    mask.style.background = "rgba(0,0,0,0.3)";
    mask.onclick = (e)=>{ if(e.target===mask) this.close(); };

    const wrap = document.createElement("div");
    wrap.style.position = "fixed";
    wrap.style.width = "86%";
    wrap.style.maxWidth = "400px";
    wrap.style.top = "50%";
    wrap.style.left = "50%";
    wrap.style.transform = "translate(-50%,-50%)";
    wrap.style.background = "#fff";
    wrap.style.borderRadius = "16px";
    wrap.style.padding = "18px";
    wrap.style.maxHeight = "75vh";
    wrap.style.overflowY = "auto";

    // 顶部标题+关闭
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "12px";
    header.innerHTML = `<span style="font-weight:bold;font-size:16px">头像和昵称互动</span><button id="nickAvatarModalClose" style="border:none;background:none;font-size:20px">×</button>`;
    wrap.appendChild(header);

    // 子tab：头像 / 昵称
    const subTabWrap = document.createElement("div");
    subTabWrap.style.display = "flex";
    subTabWrap.style.borderBottom = "1px solid #eee";
    subTabWrap.style.marginBottom = "14px";
    this.subTabList.forEach(t=>{
      const tabDom = document.createElement("div");
      tabDom.innerText = t;
      tabDom.style.padding = "8px 14px";
      tabDom.style.cursor = "pointer";
      if(this.activeSubTab === t){
        tabDom.style.fontWeight = "bold";
        tabDom.style.borderBottom = "2px solid #222";
      }
      tabDom.onclick = ()=>{
        this.activeSubTab = t;
        this.render();
      }
      subTabWrap.appendChild(tabDom);
    })
    wrap.appendChild(subTabWrap);

    const c = this.contactInfo;
    const taAvatarPool = c.taAvatarPool||[];
    const myAvatarPool = c.myAvatarPool||[];
    const taNickPool = c.taNickPool||[];
    const myNickPool = c.myNickPool||[];
    const pendingList = c.pendingApplyList||[];
    const taRand = c.taAvatarRandom||{enable:false,intervalHour:4};
    const taNickRand = c.taNickRandom||{enable:false,intervalHour:4};
    const myRand = c.myAvatarRandom||{enable:false,intervalHour:4};
    const myNickRand = c.myNickRandom||{enable:false,intervalHour:4};

    const content = document.createElement("div");
    if(this.activeSubTab === "头像"){
      content.innerHTML = `
      <style>.pool-img{width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid #ddd}</style>
      <div style="display:flex;gap:10px;margin-bottom:10px">
        <div style="flex:1;text-align:center;padding:6px;background:#111;color:#fff;border-radius:8px">TA头像库(${taAvatarPool.length})</div>
        <div style="flex:1;text-align:center;padding:6px;background:#f0f0f0;border-radius:8px">我的头像库(${myAvatarPool.length})</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px" id="ta-avatar-pool">
        ${taAvatarPool.map((src,idx)=>`<div style="position:relative"><img class="pool-img" src="${src}"><button data-pool="taAvatarPool" data-idx="${idx}" class="del-pool-img" style="position:absolute;top:-4px;right:-4px;background:#f44336;color:#fff;border:none;width:16px;height:16px;border-radius:50%;font-size:10px">×</button></div>`).join("")}
      </div>
      <button id="btn-add-ta-avatar" style="width:100%;padding:7px;border:1px solid #bbb;border-radius:8px;background:transparent;margin-bottom:12px">批量添加TA头像</button>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px" id="my-avatar-pool">
        ${myAvatarPool.map((src,idx)=>`<div style="position:relative"><img class="pool-img" src="${src}"><button data-pool="myAvatarPool" data-idx="${idx}" class="del-pool-img" style="position:absolute;top:-4px;right:-4px;background:#f44336;color:#fff;border:none;width:16px;height:16px;border-radius:50%;font-size:10px">×</button></div>`).join("")}
      </div>
      <button id="btn-add-my-avatar" style="width:100%;padding:7px;border:1px solid #bbb;border-radius:8px;background:transparent">批量添加我的头像</button>
      <input id="file-ta-avatar" type="file" multiple accept="image/*" style="display:none">
      <input id="file-my-avatar" type="file" multiple accept="image/*" style="display:none">
      `;
    }else{
      content.innerHTML = `
      <div style="display:flex;gap:10px;margin-bottom:10px">
        <div style="flex:1;text-align:center;padding:6px;background:#111;color:#fff;border-radius:8px">TA昵称库(${taNickPool.length})</div>
        <div style="flex:1;text-align:center;padding:6px;background:#f0f0f0;border-radius:8px">我的昵称库(${myNickPool.length})</div>
      </div>
      <div id="ta-nick-pool">
        ${taNickPool.map((str,idx)=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #eee">
          <span style="font-size:13px">${str}</span>
          <button data-pool="taNickPool" data-idx="${idx}" class="del-pool-text" style="padding:3px 6px;background:#f44336;color:#fff;border:none;border-radius:4px;font-size:11px">删除</button>
        </div>`).join("")}
      </div>
      <div style="display:flex;gap:6px;margin:8px 0 14px 0">
        <input id="input-ta-nick" placeholder="输入TA昵称" style="flex:1;padding:7px;border:1px solid #ddd;border-radius:8px">
        <button id="btn-add-ta-nick" style="padding:7px 10px;background:#7c68ee;color:#fff;border:none;border-radius:8px">添加</button>
      </div>

      <div id="my-nick-pool">
        ${myNickPool.map((str,idx)=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #eee">
          <span style="font-size:13px">${str}</span>
          <button data-pool="myNickPool" data-idx="${idx}" class="del-pool-text" style="padding:3px 6px;background:#f44336;color:#fff;border:none;border-radius:4px;font-size:11px">删除</button>
        </div>`).join("")}
      </div>
      <div style="display:flex;gap:6px;margin:8px 0 14px 0">
        <input id="input-my-nick" placeholder="输入我的昵称" style="flex:1;padding:7px;border:1px solid #ddd;border-radius:8px">
        <button id="btn-add-my-nick" style="padding:7px 10px;background:#7c68ee;color:#fff;border:none;border-radius:8px">添加</button>
      </div>
      `;
    }
    wrap.appendChild(content);

    // 随机轮换区域
    const randBlock = document.createElement("div");
    randBlock.style.marginTop = "16px";
    randBlock.innerHTML = `
      <div style="font-weight:bold;font-size:14px;margin-bottom:8px">开启随机更换</div>
      <div style="font-size:12px;color:#777;margin-bottom:10px">TA会每隔1–8小时随机轮换，页面激活时生效</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #eee">
        <span>对方头像随机轮换</span>
        <label><input type="checkbox" id="rand-ta-avatar" ${taRand.enable?"checked":""}></label>
      </div>
      <div style="padding:4px 0 6px 8px;font-size:13px">间隔小时：<input id="rand-ta-avatar-h" value="${taRand.intervalHour}" style="width:50px;padding:3px;border:1px solid #ddd;border-radius:4px"> <button id="save-rand-ta-avatar" style="font-size:11px;padding:2px 4px">保存</button></div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #eee">
        <span>对方昵称随机轮换</span>
        <label><input type="checkbox" id="rand-ta-nick" ${taNickRand.enable?"checked":""}></label>
      </div>
      <div style="padding:4px 0 6px 8px;font-size:13px">间隔小时：<input id="rand-ta-nick-h" value="${taNickRand.intervalHour}" style="width:50px;padding:3px;border:1px solid #ddd;border-radius:4px"> <button id="save-rand-ta-nick" style="font-size:11px;padding:2px 4px">保存</button></div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #eee">
        <span>我的头像随机轮换</span>
        <label><input type="checkbox" id="rand-my-avatar" ${myRand.enable?"checked":""}></label>
      </div>
      <div style="padding:4px 0 6px 8px;font-size:13px">间隔小时：<input id="rand-my-avatar-h" value="${myRand.intervalHour}" style="width:50px;padding:3px;border:1px solid #ddd;border-radius:4px"> <button id="save-rand-my-avatar" style="font-size:11px;padding:2px 4px">保存</button></div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #eee">
        <span>我的昵称随机轮换</span>
        <label><input type="checkbox" id="rand-my-nick" ${myNickRand.enable?"checked":""}></label>
      </div>
      <div style="padding:4px 0 6px 8px;font-size:13px">间隔小时：<input id="rand-my-nick-h" value="${myNickRand.intervalHour}" style="width:50px;padding:3px;border:1px solid #ddd;border-radius:4px"> <button id="save-rand-my-nick" style="font-size:11px;padding:2px 4px">保存</button></div>

      <div style="font-weight:bold;font-size:14px;margin-top:14px;margin-bottom:8px">待处理申请</div>
      ${pendingList.length===0?"<div style='font-size:13px;color:#777'>暂无申请</div>":
        pendingList.map(ap=>`
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #eee">
          <div style="font-size:13px">${ap.desc}</div>
          <div style="display:flex;gap:6px">
            <button data-applyid="${ap.applyId}" data-act="accept" style="padding:3px 5px;background:#4caf50;color:#fff;border:none;border-radius:4px;font-size:12px">同意</button>
            <button data-applyid="${ap.applyId}" data-act="reject" style="padding:3px 5px;background:#f44336;color:#fff;border:none;border-radius:4px;font-size:12px">拒绝</button>
          </div>
        </div>`).join("")
      }
      <button id="demo-apply-btn" style="width:100%;margin-top:12px;padding:8px;background:#7c68ee;color:#fff;border:none;border-radius:8px">提交测试变更申请</button>
    `;
    wrap.appendChild(randBlock);

    mask.appendChild(wrap);
    this.parentContainer.appendChild(mask);

    document.getElementById("nickAvatarModalClose").onclick = ()=> this.close();
    document.querySelectorAll("[data-applyid]").forEach(btn=>{
      btn.onclick = ()=> this.handleApplyAction(btn.dataset.applyid, btn.dataset.act);
    })
    document.getElementById("demo-apply-btn").onclick = ()=>{
      const applyObj = {
        applyId:Date.now().toString(),
        from:"me",
        targetType:"taNick",
        newVal:"测试昵称",
        createTs:Date.now(),
        expireMs: 2*3600*1000,
        status:"pending",
        desc:"申请将对方昵称修改为：测试昵称"
      };
      this.openApplyConfirmModal(applyObj,()=>{
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        list[idx].pendingApplyList.push(applyObj);
        Store.set("contactList",list);
        this.contactInfo = list[idx];
        Toast.show("申请提交成功，超时自动同意");
        this.render();
      })
    }

    // 头像上传、删除、昵称添加删除、轮换保存逻辑
    const saveRand = (fieldName, checkboxId, inputHourId)=>{
      const en = document.getElementById(checkboxId).checked;
      const h = Number(document.getElementById(inputHourId).value)||1;
      const list = Store.get("contactList",[]);
      const idx = list.findIndex(x=>x.id === this.contactId);
      list[idx][fieldName].enable = en;
      list[idx][fieldName].intervalHour = h;
      Store.set("contactList",list);
      this.contactInfo = list[idx];
      Toast.show("轮换配置已保存");
      this.render();
    };
    const saveRandBtnIds = [
      {btn:"save-rand-ta-avatar",field:"taAvatarRandom",ck:"rand-ta-avatar",inp:"rand-ta-avatar-h"},
      {btn:"save-rand-ta-nick",field:"taNickRandom",ck:"rand-ta-nick",inp:"rand-ta-nick-h"},
      {btn:"save-rand-my-avatar",field:"myAvatarRandom",ck:"rand-my-avatar",inp:"rand-my-avatar-h"},
      {btn:"save-rand-my-nick",field:"myNickRandom",ck:"rand-my-nick",inp:"rand-my-nick-h"}
    ];
    saveRandBtnIds.forEach(item=>{
      const btn = document.getElementById(item.btn);
      if(btn) btn.onclick = ()=> saveRand(item.field, item.ck, item.inp);
    })

    // 头像上传
    const btnAddTaAvatar = document.getElementById("btn-add-ta-avatar");
    const fileTaAvatar = document.getElementById("file-ta-avatar");
    if(btnAddTaAvatar && fileTaAvatar){
      btnAddTaAvatar.onclick = ()=> fileTaAvatar.click();
      fileTaAvatar.onchange = async (e)=>{
        const files = Array.from(e.target.files);
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        for(const f of files){
          const b64 = await new Promise(res=>{
            const r = new FileReader();
            r.onload=ev=>res(ev.target.result);
            r.readAsDataURL(f);
          });
          list[idx].taAvatarPool.push(b64);
        }
        Store.set("contactList",list);
        this.contactInfo = list[idx];
        Toast.show(`添加${files.length}张TA头像`);
        this.render();
      }
    }
    const btnAddMyAvatar = document.getElementById("btn-add-my-avatar");
    const fileMyAvatar = document.getElementById("file-my-avatar");
    if(btnAddMyAvatar && fileMyAvatar){
      btnAddMyAvatar.onclick = ()=> fileMyAvatar.click();
      fileMyAvatar.onchange = async (e)=>{
        const files = Array.from(e.target.files);
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        for(const f of files){
          const b64 = await new Promise(res=>{
            const r = new FileReader();
            r.onload=ev=>res(ev.target.result);
            r.readAsDataURL(f);
          });
          list[idx].myAvatarPool.push(b64);
        }
        Store.set("contactList",list);
        this.contactInfo = list[idx];
        Toast.show(`添加${files.length}张我的头像`);
        this.render();
      }
    }
    document.querySelectorAll(".del-pool-img").forEach(btn=>{
      btn.onclick = ()=>{
        const poolKey = btn.dataset.pool;
        const delIdx = Number(btn.dataset.idx);
        const list = Store.get("contactList",[]);
        const cidx = list.findIndex(x=>x.id === this.contactId);
        list[cidx][poolKey].splice(delIdx,1);
        Store.set("contactList",list);
        this.contactInfo = list[cidx];
        this.render();
      }
    })
    // 昵称添加删除
    const btnAddTaNick = document.getElementById("btn-add-ta-nick");
    if(btnAddTaNick){
      btnAddTaNick.onclick = ()=>{
        const input = document.getElementById("input-ta-nick");
        const val = input.value.trim();
        if(!val){Toast.show("昵称不能为空");return;}
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        list[idx].taNickPool.push(val);
        Store.set("contactList",list);
        this.contactInfo = list[idx];
        this.render();
      }
    }
    const btnAddMyNick = document.getElementById("btn-add-my-nick");
    if(btnAddMyNick){
      btnAddMyNick.onclick = ()=>{
        const input = document.getElementById("input-my-nick");
        const val = input.value.trim();
        if(!val){Toast.show("昵称不能为空");return;}
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        list[idx].myNickPool.push(val);
        Store.set("contactList",list);
        this.contactInfo = list[idx];
        this.render();
      }
    }
    document.querySelectorAll(".del-pool-text").forEach(btn=>{
      btn.onclick = ()=>{
        const poolKey = btn.dataset.pool;
        const delIdx = Number(btn.dataset.idx);
        const list = Store.get("contactList",[]);
        const cidx = list.findIndex(x=>x.id === this.contactId);
        list[cidx][poolKey].splice(delIdx,1);
        Store.set("contactList",list);
        this.contactInfo = list[cidx];
        this.render();
      }
    })
  }
};
