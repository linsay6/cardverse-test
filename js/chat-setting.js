import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

export const ChatSettingSubModule = {
  parentContainer: null,
  contactId: null,
  contactInfo: null,

  tab1List: ["美化", "功能", "数据"],
  activeTab1: "功能",
  tab2List: ["形象", "头像昵称互动", "消息", "显示"],
  activeTab2: "头像昵称互动",

  open(parentDom, cid, cbBack) {
    this.parentContainer = parentDom;
    this.contactId = cid;
    const list = Store.get("contactList", []);
    this.contactInfo = list.find(i => i.id === this.contactId);
    this.callbackBack = cbBack;
    this.render();
  },

  openRadioModal(title, optionList, currentVal, onSelect) {
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.inset = "0";
    mask.style.background = "rgba(0,0,0,0.35)";
    mask.style.zIndex = "9999";
    mask.style.display = "flex";
    mask.style.alignItems = "center";
    mask.style.justifyContent = "center";

    const modal = document.createElement("div");
    modal.style.width = "85%";
    modal.style.maxWidth = "360px";
    modal.style.background = "#fff";
    modal.style.borderRadius = "14px";
    modal.style.overflow = "hidden";

    modal.innerHTML = `<div style="padding:16px 16px 8px;font-weight:bold;font-size:16px">${title}</div>`;
    optionList.forEach(opt => {
      const itemDiv = document.createElement("div");
      itemDiv.style.padding = "14px 16px";
      itemDiv.style.cursor = "pointer";
      itemDiv.style.display = "flex";
      itemDiv.style.justifyContent = "space‑between";
      itemDiv.style.alignItems = "center";
      itemDiv.style.borderBottom = "1px solid #eee";
      itemDiv.innerHTML = `<span>${opt.label}</span> ${opt.value === currentVal ? `<span style="color:#7c68ee">✓</span>` : ""}`;
      itemDiv.onclick = () => {
        mask.remove();
        onSelect(opt.value);
      };
      modal.appendChild(itemDiv);
    });

    mask.appendChild(modal);
    document.body.appendChild(mask);
    mask.onclick = (e) => {
      if(e.target === mask) mask.remove();
    };
  },

  // 弹出确认申请弹窗
  openApplyConfirmModal(applyObj, onConfirm) {
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.inset = "0";
    mask.style.background = "rgba(0,0,0,0.35)";
    mask.style.zIndex = "9999";
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

  // 处理申请：同意 / 拒绝
  handleApplyAction(applyId, action) {
    const list = Store.get("contactList",[]);
    const idx = list.findIndex(x=>x.id === this.contactId);
    if(idx === -1) return;
    const contact = list[idx];
    const applyIdx = contact.pendingApplyList.findIndex(a=>a.applyId === applyId);
    if(applyIdx === -1) return;
    const apply = contact.pendingApplyList[applyIdx];

    if(action === "accept"){
      // 同意申请，执行变更
      switch(apply.targetType){
        case "taAvatar": contact.avatar = apply.newVal; break;
        case "taNick": contact.name = apply.newVal; break;
        case "myAvatar": contact.myAvatar = apply.newVal; break;
        case "myNick": contact.myNick = apply.newVal; break;
      }
      EventBus.emit("contactInfoChange", this.contactId);
    }
    // 从待处理队列移除
    contact.pendingApplyList.splice(applyIdx,1);
    Store.set("contactList",list);
    this.contactInfo = contact;
    Toast.show(action==="accept"?"已同意申请":"已拒绝申请");
    this.render();
  },

  render() {
    if (!this.parentContainer) return;
    this.parentContainer.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.style.height = "auto";
    wrap.style.background = "transparent";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "10px";
    header.style.padding = "14px 16px";
    header.style.borderBottom = "1px solid rgba(128,128,128,0.15)";
    header.style.background = "transparent";
    header.innerHTML = `
      <button id="csub‑back" style="border:none;background:none;font‑size:20px;cursor:pointer">←</button>
      <span style="font‑size:18px;font‑weight:500;color:#222">聊天设置</span>
    `;
    wrap.appendChild(header);

    const contentWrap = document.createElement("div");
    contentWrap.style.padding = "16px";
    contentWrap.style.boxSizing = "border‑box";

    const mainCard = document.createElement("div");
    mainCard.style.width = "100%";
    mainCard.style.maxWidth = "420px";
    mainCard.style.background = "transparent";
    mainCard.style.borderRadius = "14px";
    mainCard.style.overflow = "hidden";

    const tab1Wrap = document.createElement("div");
    tab1Wrap.style.display = "flex";
    tab1Wrap.style.borderBottom = "1px solid rgba(128,128,128,0.15)";
    this.tab1List.forEach(tName => {
      const tabEl = document.createElement("div");
      tabEl.innerText = tName;
      tabEl.style.padding = "12px 14px";
      tabEl.style.flex = "1";
      tabEl.style.textAlign = "center";
      tabEl.style.fontSize = "15px";
      tabEl.style.position = "relative";
      tabEl.style.cursor = "pointer";
      if (this.activeTab1 === tName) {
        tabEl.style.fontWeight = "bold";
        const botLine = document.createElement("div");
        botLine.style.position = "absolute";
        botLine.style.bottom = "0";
        botLine.style.left = "0";
        botLine.style.width = "100%";
        botLine.style.height = "2px";
        botLine.style.background = "#222";
        tabEl.appendChild(botLine);
      }
      tabEl.onclick = () => {
        this.activeTab1 = tName;
        this.render();
      };
      tab1Wrap.appendChild(tabEl);
    });
    mainCard.appendChild(tab1Wrap);

    if (this.activeTab1 === "功能") {
      const tab2Wrap = document.createElement("div");
      tab2Wrap.style.display = "flex";
      tab2Wrap.style.borderBottom = "1px solid rgba(128,128,128,0.15)";
      this.tab2List.forEach(tName => {
        const tabEl2 = document.createElement("div");
        tabEl2.innerText = tName;
        tabEl2.style.padding = "10px 12px";
        tabEl2.style.flex = "1";
        tabEl2.style.textAlign = "center";
        tabEl2.style.fontSize = "14px";
        tabEl2.style.position = "relative";
        tabEl2.style.cursor = "pointer";
        if (this.activeTab2 === tName) {
          tabEl2.style.fontWeight = "bold";
          const botLine2 = document.createElement("div");
          botLine2.style.position = "absolute";
          botLine2.style.bottom = "0";
          botLine2.style.left = "0";
          botLine2.style.width = "100%";
          botLine2.style.height = "2px";
          botLine2.style.background = "#222";
          tabEl2.appendChild(botLine2);
        }
        tabEl2.onclick = () => {
          this.activeTab2 = tName;
          this.render();
        };
        tab2Wrap.appendChild(tabEl2);
      });
      mainCard.appendChild(tab2Wrap);
    }

    const cardContent = document.createElement("div");
    cardContent.style.padding = "0 16px 16px 16px";
    const chatTheme = Store.get("chatTheme", {avatarShape:"circle",timePos:"avatarBottom"});

    if (this.activeTab1 === "美化") {
      cardContent.innerHTML = `
      <style>
      .setting‑row{
        display:flex;
        justify‑content:space‑between;
        align‑items:center;
        padding:16px 0;
        border‑bottom:1px solid rgba(128,128,128,0.15);
        cursor:pointer;
      }
      .row‑label{font‑size:14px;color:#222}
      .row‑value{font‑size:13px;color:#888;text‑align:right}
      </style>
      <div class="setting‑row" id="row‑avatar‑shape">
        <span class="row‑label">头像形状</span>
        <span class="row‑value">${chatTheme.avatarShape === "circle" ? "圆形" : "方形"} ></span>
      </div>
      <div class="setting‑row" id="row‑time‑pos">
        <span class="row‑label">消息时间位置</span>
        <span class="row‑value">${
          {
            avatarBottom:"头像下方",
            bubbleBottom:"气泡下方",
            bubbleOuter:"气泡外侧悬浮",
            topCenter:"消息上方居中",
            divider:"时间分隔线",
            hide:"隐藏时间"
          }[chatTheme.timePos]
        } ></span>
      </div>
      `;
    } else if (this.activeTab1 === "功能" && this.activeTab2 === "形象") {
      const nick = this.contactInfo?.name || "默认";
      const myNick = this.contactInfo?.myNick || "我";
      const hasAvatar = !!this.contactInfo?.avatar;
      const hasMyAvatar = !!this.contactInfo?.myAvatar;
      cardContent.innerHTML = `
      <style>
      .setting‑row{
        display:flex;
        justify‑content:space‑between;
        align‑items:center;
        padding:16px 0;
        border‑bottom:1px solid rgba(128,128,128,0.15);
        cursor:pointer;
      }
      .row‑label{font‑size:14px;color:#222;display:flex;align‑items:center;gap:8px}
      .row‑value{font‑size:13px;color:#888;text‑align:right}
      .tip‑text{font‑size:12px;color:#666;padding:12px 0}
      </style>
      <div class="tip‑text">昵称与头像（聊天专用 · 与桌面各自独立，互不同步）</div>

      <div class="setting‑row" id="row‑contact‑nick">
        <span class="row‑label">联系人昵称</span>
        <span class="row‑value">${nick} ></span>
      </div>
      <div class="setting‑row" id="row‑my‑nick">
        <span class="row‑label">我的昵称</span>
        <span class="row‑value">${myNick} ></span>
      </div>
      <div class="setting‑row" id="row‑contact‑avatar">
        <span class="row‑label">联系人头像</span>
        <span class="row‑value">${hasAvatar ? "已设置" : "未设置"} ></span>
      </div>
      <div class="setting‑row" id="row‑clear‑contact‑avatar">
        <span class="row‑label">清空联系人头像</span>
        <span class="row‑value"></span>
      </div>
      <div class="setting‑row" id="row‑my‑avatar">
        <span class="row‑label">我的头像</span>
        <span class="row‑value">${hasMyAvatar ? "已设置" : "未设置"} ></span>
      </div>
      <div class="setting‑row" id="row‑clear‑my‑avatar">
        <span class="row‑label">清空我的头像</span>
        <span class="row‑value"></span>
      </div>
      <input type="file" id="avatar‑file" accept="image/*" style="display:none">
      <input type="file" id="myavatar‑file" accept="image/*" style="display:none">
      `;
    } else if(this.activeTab1 === "功能" && this.activeTab2 === "头像昵称互动"){
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

      cardContent.innerHTML = `
      <style>
      .block‑title{font‑weight:bold;font‑size:14px;margin‑top:18px;margin‑bottom:8px;color:#222}
      .pool‑img{width:48px;height:48px;border‑radius:8px;object‑fit:cover;border:1px solid #ddd}
      .pool‑item{display:flex;align‑items:center;justify‑content:space‑between;padding:8px 0;border‑bottom:1px solid rgba(128,128,128,0.12)}
      </style>
      <div class="block‑title">待处理申请</div>
      ${pendingList.length===0?"<div style='font‑size:13px;color:#777'>暂无待处理申请</div>":
        pendingList.map(ap=>`
        <div class="pool‑item">
          <div style="font‑size:13px">${ap.desc}</div>
          <div style="display:flex;gap:6px">
            <button data‑applyid="${ap.applyId}" data‑act="accept" style="padding:4px 6px;background:#4caf50;color:#fff;border:none;border‑radius:4px;font‑size:12px">同意</button>
            <button data‑applyid="${ap.applyId}" data‑act="reject" style="padding:4px 6px;background:#f44336;color:#fff;border:none;border‑radius:4px;font‑size:12px">拒绝</button>
          </div>
        </div>`).join("")
      }

      <div class="block‑title">对方头像池</div>
      <div style="display:flex;flex‑wrap:wrap;gap:8px;margin‑bottom:8px" id="ta‑avatar‑pool">
        ${taAvatarPool.map((src,idx)=>`<div style="position:relative"><img class="pool‑img" src="${src}"><button data‑pool="taAvatarPool" data‑idx="${idx}" class="del‑pool‑img" style="position:absolute;top:‑4px;right:‑4px;background:#f44336;color:#fff;border:none;width:16px;height:16px;border‑radius:50%;font‑size:10px">×</button></div>`).join("")}
      </div>
      <button id="btn‑add‑ta‑avatar" style="width:100%;padding:7px;border:1px solid #bbb;border‑radius:8px;background:transparent">批量添加对方头像</button>
      <input id="file‑ta‑avatar" type="file" multiple accept="image/*" style="display:none">

      <div class="block‑title">对方昵称池</div>
      <div id="ta‑nick‑pool">
        ${taNickPool.map((str,idx)=>`
        <div class="pool‑item">
          <span style="font‑size:13px">${str}</span>
          <button data‑pool="taNickPool" data‑idx="${idx}" class="del‑pool‑text" style="padding:3px 6px;background:#f44336;color:#fff;border:none;border‑radius:4px;font‑size:11px">删除</button>
        </div>`).join("")}
      </div>
      <div style="display:flex;gap:6px;margin‑bottom:12px">
        <input id="input‑ta‑nick" placeholder="输入昵称" style="flex:1;padding:7px;border:1px solid #ddd;border‑radius:8px">
        <button id="btn‑add‑ta‑nick" style="padding:7px 10px;background:#7c68ee;color:#fff;border:none;border‑radius:8px">添加</button>
      </div>

      <div class="block‑title">我的头像池</div>
      <div style="display:flex;flex‑wrap:wrap;gap:8px;margin‑bottom:8px" id="my‑avatar‑pool">
        ${myAvatarPool.map((src,idx)=>`<div style="position:relative"><img class="pool‑img" src="${src}"><button data‑pool="myAvatarPool" data‑idx="${idx}" class="del‑pool‑img" style="position:absolute;top:‑4px;right:‑4px;background:#f44336;color:#fff;border:none;width:16px;height:16px;border‑radius:50%;font‑size:10px">×</button></div>`).join("")}
      </div>
      <button id="btn‑add‑my‑avatar" style="width:100%;padding:7px;border:1px solid #bbb;border‑radius:8px;background:transparent">批量添加我的头像</button>
      <input id="file‑my‑avatar" type="file" multiple accept="image/*" style="display:none">

      <div class="block‑title">我的昵称池</div>
      <div id="my‑nick‑pool">
        ${myNickPool.map((str,idx)=>`
        <div class="pool‑item">
          <span style="font‑size:13px">${str}</span>
          <button data‑pool="myNickPool" data‑idx="${idx}" class="del‑pool‑text" style="padding:3px 6px;background:#f44336;color:#fff;border:none;border‑radius:4px;font‑size:11px">删除</button>
        </div>`).join("")}
      </div>
      <div style="display:flex;gap:6px;margin‑bottom:12px">
        <input id="input‑my‑nick" placeholder="输入昵称" style="flex:1;padding:7px;border:1px solid #ddd;border‑radius:8px">
        <button id="btn‑add‑my‑nick" style="padding:7px 10px;background:#7c68ee;color:#fff;border:none;border‑radius:8px">添加</button>
      </div>

      <div class="block‑title">随机轮换设置</div>
      <div style="font‑size:12px;color:#777;margin‑bottom:10px">注意：浏览器切后台定时会休眠，激活页面才会执行轮换</div>

      <div class="pool‑item">
        <span>对方头像随机轮换</span>
        <label><input type="checkbox" id="rand‑ta‑avatar" ${taRand.enable?"checked":""}>开启</label>
      </div>
      <div style="padding:8px 0 0 10px;font‑size:13px">间隔小时：<input id="rand‑ta‑avatar‑h" value="${taRand.intervalHour}" style="width:60px;padding:4px;border:1px solid #ddd;border‑radius:4px"> <button id="save‑rand‑ta‑avatar" style="padding:3px 6px;font‑size:11px">保存</button></div>

      <div class="pool‑item">
        <span>对方昵称随机轮换</span>
        <label><input type="checkbox" id="rand‑ta‑nick" ${taNickRand.enable?"checked":""}>开启</label>
      </div>
      <div style="padding:8px 0 0 10px;font‑size:13px">间隔小时：<input id="rand‑ta‑nick‑h" value="${taNickRand.intervalHour}" style="width:60px;padding:4px;border:1px solid #ddd;border‑radius:4px"> <button id="save‑rand‑ta‑nick" style="padding:3px 6px;font‑size:11px">保存</button></div>

      <div class="pool‑item">
        <span>我的头像随机轮换</span>
        <label><input type="checkbox" id="rand‑my‑avatar" ${myRand.enable?"checked":""}>开启</label>
      </div>
      <div style="padding:8px 0 0 10px;font‑size:13px">间隔小时：<input id="rand‑my‑avatar‑h" value="${myRand.intervalHour}" style="width:60px;padding:4px;border:1px solid #ddd;border‑radius:4px"> <button id="save‑rand‑my‑avatar" style="padding:3px 6px;font‑size:11px">保存</button></div>

      <div class="pool‑item">
        <span>我的昵称随机轮换</span>
        <label><input type="checkbox" id="rand‑my‑nick" ${myNickRand.enable?"checked":""}>开启</label>
      </div>
      <div style="padding:8px 0 0 10px;font‑size:13px">间隔小时：<input id="rand‑my‑nick‑h" value="${myNickRand.intervalHour}" style="width:60px;padding:4px;border:1px solid #ddd;border‑radius:4px"> <button id="save‑rand‑my‑nick" style="padding:3px 6px;font‑size:11px">保存</button></div>

      <div class="block‑title">发起变更申请（从池子选取，本版本仅演示提交逻辑）</div>
      <div style="font‑size:12px;color:#777">完整选取UI后续迭代，当前可直接提交测试申请</div>
      <button id="btn‑demo‑apply" style="width:100%;margin‑top:8px;padding:8px;background:#7c68ee;color:#fff;border:none;border‑radius:8px">提交一条测试申请</button>

      <input type="file" id="file‑ta‑avatar" multiple accept="image/*" style="display:none">
      <input type="file" id="file‑my‑avatar" multiple accept="image/*" style="display:none">
      `;
    } else if(this.activeTab1 === "数据"){
      cardContent.innerHTML = `
      <div style="padding‑top:10px">
        <div style="font‑weight:bold;font‑size:14px;margin‑bottom:12px">会话数据操作</div>
        <div style="font‑size:12px;color:#777;margin‑bottom:12px">仅清空当前联系人聊天记录；不会删除头像库、昵称库与联系人配置</div>
        <button id="btn‑clear‑chat‑log" style="width:100%;padding:9px;background:#c92a2a;color:#fff;border:none;border‑radius:8px">清空当前会话聊天记录</button>
      </div>
      `;
    } else {
      cardContent.innerHTML = `<div style="padding:30px 0;text‑align:center;color:#888">页面待开发</div>`;
    }
    mainCard.appendChild(cardContent);

    contentWrap.appendChild(mainCard);
    wrap.appendChild(contentWrap);
    this.parentContainer.appendChild(wrap);

    document.getElementById("csub‑back").onclick = () => {
      if (typeof this.callbackBack === "function") {
        this.callbackBack();
      }
    };

    // =========美化tab事件======
    const rowAvatarShape = document.getElementById("row‑avatar‑shape");
    if(rowAvatarShape){
      rowAvatarShape.onclick = ()=>{
        this.openRadioModal("选择头像形状",
          [
            {label:"圆形",value:"circle"},
            {label:"方形",value:"square"}
          ],
          chatTheme.avatarShape,
          (val)=>{
            chatTheme.avatarShape = val;
            Store.set("chatTheme", chatTheme);
            EventBus.emit("chatThemeChange");
            this.render();
          }
        )
      }
    }
    const rowTimePos = document.getElementById("row‑time‑pos");
    if(rowTimePos){
      rowTimePos.onclick = ()=>{
        this.openRadioModal("选择消息时间位置",
          [
            {label:"头像下方",value:"avatarBottom"},
            {label:"气泡下方",value:"bubbleBottom"},
            {label:"气泡外侧悬浮",value:"bubbleOuter"},
            {label:"消息上方居中",value:"topCenter"},
            {label:"时间分隔线",value:"divider"},
            {label:"隐藏时间",value:"hide"}
          ],
          chatTheme.timePos,
          (val)=>{
            chatTheme.timePos = val;
            Store.set("chatTheme", chatTheme);
            EventBus.emit("chatThemeChange");
            this.render();
          }
        )
      }
    }

    // ======形象tab：联系人昵称======
    const rowContactNick = document.getElementById("row‑contact‑nick");
    if(rowContactNick){
      rowContactNick.onclick = ()=>{
        const newName = prompt("输入联系人昵称", this.contactInfo?.name || "");
        if(newName === null) return;
        const trimName = newName.trim();
        if(!trimName){
          Toast.show("昵称不能为空");
          return;
        }
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        if(idx !== -1){
          list[idx].name = trimName;
          Store.set("contactList", list);
          this.contactInfo = list[idx];
          EventBus.emit("contactInfoChange", this.contactId);
          Toast.show("昵称已更新，聊天页实时刷新");
          this.render();
        }
      }
    }

    // ======形象tab：我的昵称======
    const rowMyNick = document.getElementById("row‑my‑nick");
    if(rowMyNick){
      rowMyNick.onclick = ()=>{
        const newName = prompt("输入我的昵称", this.contactInfo?.myNick || "我");
        if(newName === null) return;
        const trimName = newName.trim();
        if(!trimName){
          Toast.show("昵称不能为空");
          return;
        }
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        if(idx !== -1){
          list[idx].myNick = trimName;
          Store.set("contactList", list);
          this.contactInfo = list[idx];
          EventBus.emit("contactInfoChange", this.contactId);
          Toast.show("我的昵称已更新");
          this.render();
        }
      }
    }

    // ======形象tab：联系人头像======
    const rowContactAvatar = document.getElementById("row‑contact‑avatar");
    const fileInput = document.getElementById("avatar‑file");
    if(rowContactAvatar && fileInput){
      rowContactAvatar.onclick = ()=> fileInput.click();
      fileInput.onchange = (ev)=>{
        const file = ev.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (res)=>{
          const base64Img = res.target.result;
          const list = Store.get("contactList",[]);
          const idx = list.findIndex(x=>x.id === this.contactId);
          if(idx !== -1){
            list[idx].avatar = base64Img;
            Store.set("contactList", list);
            this.contactInfo = list[idx];
            EventBus.emit("contactInfoChange", this.contactId);
            Toast.show("头像已更新，聊天页实时刷新");
            this.render();
          }
        }
        reader.readAsDataURL(file);
      }
    }

    // ======形象tab：清空联系人头像======
    const rowClearContactAvatar = document.getElementById("row‑clear‑contact‑avatar");
    if(rowClearContactAvatar){
      rowClearContactAvatar.onclick = ()=>{
        if(!confirm("确认清空联系人头像？")) return;
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        if(idx !== -1){
          delete list[idx].avatar;
          Store.set("contactList", list);
          this.contactInfo = list[idx];
          EventBus.emit("contactInfoChange", this.contactId);
          Toast.show("头像已清空");
          this.render();
        }
      }
    }

    // ======形象tab：我的头像======
    const rowMyAvatar = document.getElementById("row‑my‑avatar");
    const myFileInput = document.getElementById("myavatar‑file");
    if(rowMyAvatar && myFileInput){
      rowMyAvatar.onclick = ()=> myFileInput.click();
      myFileInput.onchange = (ev)=>{
        const file = ev.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (res)=>{
          const base64Img = res.target.result;
          const list = Store.get("contactList",[]);
          const idx = list.findIndex(x=>x.id === this.contactId);
          if(idx !== -1){
            list[idx].myAvatar = base64Img;
            Store.set("contactList", list);
            this.contactInfo = list[idx];
            EventBus.emit("contactInfoChange", this.contactId);
            Toast.show("我的头像已更新");
            this.render();
          }
        }
        reader.readAsDataURL(file);
      }
    }

    // ======形象tab：清空我的头像======
    const rowClearMyAvatar = document.getElementById("row‑clear‑my‑avatar");
    if(rowClearMyAvatar){
      rowClearMyAvatar.onclick = ()=>{
        if(!confirm("确认清空我的头像？")) return;
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        if(idx !== -1){
          delete list[idx].myAvatar;
          Store.set("contactList", list);
          this.contactInfo = list[idx];
          EventBus.emit("contactInfoChange", this.contactId);
          Toast.show("我的头像已清空");
          this.render();
        }
      }
    }

    // ==========头像昵称互动tab逻辑==========
    if(this.activeTab1 === "功能" && this.activeTab2 === "头像昵称互动"){
      // 待处理申请：同意拒绝
      document.querySelectorAll("[data‑applyid]").forEach(btn=>{
        btn.onclick = ()=>{
          const aid = btn.dataset.applyid;
          const act = btn.dataset.act;
          this.handleApplyAction(aid, act);
        }
      });

      // 【对方头像池】批量上传
      document.getElementById("btn‑add‑ta‑avatar").onclick = ()=> document.getElementById("file‑ta‑avatar").click();
      document.getElementById("file‑ta‑avatar").onchange = async (e)=>{
        const files = Array.from(e.target.files);
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        const pool = list[idx].taAvatarPool;
        for(const f of files){
          const b64 = await new Promise(res=>{
            const r = new FileReader();
            r.onload=ev=>res(ev.target.result);
            r.readAsDataURL(f);
          });
          pool.push(b64);
        }
        Store.set("contactList",list);
        this.contactInfo = list[idx];
        Toast.show(`添加${files.length}张头像`);
        this.render();
      };

      // 【我的头像池】批量上传
      document.getElementById("btn‑add‑my‑avatar").onclick = ()=> document.getElementById("file‑my‑avatar").click();
      document.getElementById("file‑my‑avatar").onchange = async (e)=>{
        const files = Array.from(e.target.files);
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        const pool = list[idx].myAvatarPool;
        for(const f of files){
          const b64 = await new Promise(res=>{
            const r = new FileReader();
            r.onload=ev=>res(ev.target.result);
            r.readAsDataURL(f);
          });
          pool.push(b64);
        }
        Store.set("contactList",list);
        this.contactInfo = list[idx];
        Toast.show(`添加${files.length}张头像`);
        this.render();
      };

      // 删除池子图片
      document.querySelectorAll(".del‑pool‑img").forEach(btn=>{
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
      });

      // 添加对方昵称
      document.getElementById("btn‑add‑ta‑nick").onclick = ()=>{
        const input = document.getElementById("input‑ta‑nick");
        const val = input.value.trim();
        if(!val){Toast.show("昵称不能为空");return;}
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        list[idx].taNickPool.push(val);
        Store.set("contactList",list);
        this.contactInfo = list[idx];
        this.render();
      };
      // 添加我的昵称
      document.getElementById("btn‑add‑my‑nick").onclick = ()=>{
        const input = document.getElementById("input‑my‑nick");
        const val = input.value.trim();
        if(!val){Toast.show("昵称不能为空");return;}
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        list[idx].myNickPool.push(val);
        Store.set("contactList",list);
        this.contactInfo = list[idx];
        this.render();
      };
      // 删除池子昵称
      document.querySelectorAll(".del‑pool‑text").forEach(btn=>{
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
      });

      // 保存随机轮换配置
      const saveRand = (fieldName, checkboxId, inputHourId)=>{
        const en = document.getElementById(checkboxId).checked;
        const h = Number(document.getElementById(inputHourId).value)||1;
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        list[idx][fieldName].enable = en;
        list[idx][fieldName].intervalHour = h;
        Store.set("contactList",list);
        this.contactInfo = list[idx];
        Toast.show("已保存轮换配置");
      };
      document.getElementById("save‑rand‑ta‑avatar").onclick = ()=> saveRand("taAvatarRandom","rand‑ta‑avatar","rand‑ta‑avatar‑h");
      document.getElementById("save‑rand‑ta‑nick").onclick = ()=> saveRand("taNickRandom","rand‑ta‑nick","rand‑ta‑nick‑h");
      document.getElementById("save‑rand‑my‑avatar").onclick = ()=> saveRand("myAvatarRandom","rand‑my‑avatar","rand‑my‑avatar‑h");
      document.getElementById("save‑rand‑my‑nick").onclick = ()=> saveRand("myNickRandom","rand‑my‑nick","rand‑my‑nick‑h");

      // 测试申请按钮
      document.getElementById("btn‑demo‑apply").onclick = ()=>{
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
          Toast.show("测试申请已提交，2小时超时自动同意");
          this.render();
        });
      };
    }

    // =========【数据tab】清空会话记录====
    const btnClearChatLog = document.getElementById("btn‑clear‑chat‑log");
    if(btnClearChatLog){
      btnClearChatLog.onclick = ()=>{
        if(!confirm("确定清空当前联系人全部聊天记录？不可恢复！")) return;
        Store.set(`chat‑contact‑${this.contactId}`,[]);
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        this.contactInfo = list[idx];
        Toast.show("聊天记录已清空，请返回聊天页");
        this.render();
      }
    }
  }
};
