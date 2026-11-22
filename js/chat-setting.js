import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

export const ChatSettingSubModule = {
  parentContainer: null,
  contactId: null,
  contactInfo: null,

  tab1List: ["美化", "功能", "数据"],
  activeTab1: "功能",
  tab2List: ["形象", "消息", "显示"],
  activeTab2: "形象",

  open(parentDom, cid, cbBack) {
    this.parentContainer = parentDom;
    this.contactId = cid;
    const list = Store.get("contactList", []);
    this.contactInfo = list.find(i => i.id === this.contactId);
    this.callbackBack = cbBack;
    this.render();
  },

  // 通用弹窗：单选弹窗
  openRadioModal(title, optionList, currentVal, onSelect) {
    // 遮罩层
    const mask = document.createElement("div");
    mask.style.position = "fixed";
    mask.style.inset = "0";
    mask.style.background = "rgba(0,0,0,0.35)";
    mask.style.zIndex = "9999";
    mask.style.display = "flex";
    mask.style.alignItems = "center";
    mask.style.justifyContent = "center";

    // 弹窗卡片
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
    // 点击遮罩空白关闭弹窗
    mask.onclick = (e) => {
      if(e.target === mask) mask.remove();
    };
  },

  render() {
    if (!this.parentContainer) return;
    this.parentContainer.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.style.height = "100%";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.background = "#f7f7f7";

    // 头部
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "10px";
    header.style.padding = "14px 16px";
    header.style.borderBottom = "1px solid #eee";
    header.style.background = "#fff";
    header.innerHTML = `
      <button id="csub‑back" style="border:none;background:none;font‑size:20px;cursor:pointer">←</button>
      <span style="font‑size:18px;font‑weight:500;color:#222">聊天设置</span>
    `;
    wrap.appendChild(header);

    // 内容区域
    const contentWrap = document.createElement("div");
    contentWrap.style.flex = "1";
    contentWrap.style.overflowY = "auto";
    contentWrap.style.padding = "16px";
    contentWrap.style.boxSizing = "border‑box";
    contentWrap.style.display = "flex";
    contentWrap.style.flexDirection = "column";
    contentWrap.style.alignItems = "center";

    // 主卡片，全部tab和内容放在卡片内部
    const mainCard = document.createElement("div");
    mainCard.style.width = "100%";
    mainCard.style.maxWidth = "420px";
    mainCard.style.background = "#fff";
    mainCard.style.borderRadius = "14px";
    mainCard.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
    mainCard.style.overflow = "hidden";

    // 一级tab栏
    const tab1Wrap = document.createElement("div");
    tab1Wrap.style.display = "flex";
    tab1Wrap.style.borderBottom = "1px solid #eee";
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

    // 二级tab栏（功能分类才显示）
    if (this.activeTab1 === "功能") {
      const tab2Wrap = document.createElement("div");
      tab2Wrap.style.display = "flex";
      tab2Wrap.style.borderBottom = "1px solid #eee";
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

    // 卡片内容区
    const cardContent = document.createElement("div");
    cardContent.style.padding = "16px";
    const chatTheme = Store.get("chatTheme", {avatarShape:"circle",timePos:"avatarBottom"});
    const avatarRadius = chatTheme.avatarShape === "circle" ? "50%" : "8px";

    if (this.activeTab1 === "美化") {
      // =========美化页面=========
      cardContent.innerHTML = `
      <style>
      .setting‑row{
        display:flex;
        justify‑content:space‑between;
        align‑items:center;
        padding:14px 0;
        border‑bottom:1px solid #eee;
        cursor:pointer;
      }
      .row‑label{font‑size:14px;color:#222}
      .row‑hint{font‑size:13px;color:#888}
      </style>
      <div class="setting‑row" id="row‑avatar‑shape">
        <span class="row‑label">头像形状</span>
        <span class="row‑hint">${chatTheme.avatarShape === "circle" ? "圆形" : "方形"}  ></span>
      </div>
      <div class="setting‑row" id="row‑time‑pos">
        <span class="row‑label">消息时间位置</span>
        <span class="row‑hint">${
          {
            avatarBottom:"头像下方",
            bubbleBottom:"气泡下方",
            bubbleOuter:"气泡外侧悬浮",
            topCenter:"消息上方居中",
            divider:"时间分隔线",
            hide:"隐藏时间"
          }[chatTheme.timePos]
        }  ></span>
      </div>
      `;
    } else if (this.activeTab1 === "功能" && this.activeTab2 === "形象") {
      cardContent.innerHTML = `
      <div style="font‑size:13px;color:#777;margin‑bottom:14px;text‑align:center">昵称与头像（仅当前聊天生效，与设置页联系人列表相互独立）</div>

      <div style="margin‑bottom:14px">
        <div style="font‑size:14px;margin‑bottom:6px;color:#222">联系人昵称</div>
        <input id="edit‑nick" value="${this.contactInfo?.name || ""}" style="width:100%;box‑sizing:border‑box;padding:8px;border:1px solid #ddd;border‑radius:8px;background:#f6f6f6;color:#222">
        <button id="btn‑save‑nick" style="margin‑top:8px;width:100%;padding:7px;background:#673ab7;color:#fff;border:none;border‑radius:8px">保存昵称</button>
      </div>

      <div style="margin‑bottom:14px">
        <div style="font‑size:14px;margin‑bottom:6px;color:#222">联系人头像</div>
        <div id="avatar‑preview" style="width:64px;height:64px;border‑radius:${avatarRadius};background:#eee;margin‑bottom:8px;overflow:hidden">
          ${this.contactInfo?.avatar ? `<img src="${this.contactInfo.avatar}" style="width:100%;height:100%;object‑fit:cover">` : ""}
        </div>
        <button id="btn‑upload‑avatar" style="width:100%;padding:7px;background:#673ab7;color:#fff;border:none;border‑radius:8px">上传头像图片</button>
        <input type="file" id="avatar‑file" accept="image/*" style="display:none">
      </div>

      <div style="margin‑top:10px;color:#888;font‑size:12px;text‑align:center">我的昵称、我的头像 待开发</div>
      `;
    } else {
      cardContent.innerHTML = `<div style="padding:30px 0;text‑align:center;color:#888">页面待开发</div>`;
    }
    mainCard.appendChild(cardContent);

    contentWrap.appendChild(mainCard);
    wrap.appendChild(contentWrap);
    this.parentContainer.appendChild(wrap);

    // 返回按钮
    document.getElementById("csub‑back").onclick = () => {
      if (typeof this.callbackBack === "function") {
        this.callbackBack();
      }
    };

    // =========美化页面行点击事件========
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

    // ----绑定形象页按钮事件----
    const saveNickBtn = document.getElementById("btn‑save‑nick");
    if(saveNickBtn){
      saveNickBtn.onclick = ()=>{
        const input = document.getElementById("edit‑nick");
        const val = input.value.trim();
        if(!val){
          Toast.show("昵称不能为空");
          return;
        }
        const list = Store.get("contactList",[]);
        const idx = list.findIndex(x=>x.id === this.contactId);
        if(idx !== -1){
          list[idx].name = val;
          Store.set("contactList", list);
          Toast.show("昵称已更新");
          this.contactInfo = list[idx];
          this.render();
        }
      }
    }

    const uploadBtn = document.getElementById("btn‑upload‑avatar");
    const fileInput = document.getElementById("avatar‑file");
    if(uploadBtn && fileInput){
      uploadBtn.onclick = ()=> fileInput.click();
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
            Toast.show("头像上传成功");
            this.contactInfo = list[idx];
            this.render();
          }
        }
        reader.readAsDataURL(file);
      }
    }
  }
};
