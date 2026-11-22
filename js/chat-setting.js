import { Store } from './core/store.js';
import { Toast } from './core/toast.js';

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
      <button id="csub-back" style="border:none;background:none;font-size:20px;cursor:pointer">←</button>
      <span style="font-size:18px;font-weight:500;color:#222">聊天设置</span>
    `;
    wrap.appendChild(header);

    // 内容区域
    const contentWrap = document.createElement("div");
    contentWrap.style.flex = "1";
    contentWrap.style.overflowY = "auto";
    contentWrap.style.padding = "16px";
    contentWrap.style.boxSizing = "border-box";
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

    if (this.activeTab1 === "功能" && this.activeTab2 === "形象") {
      cardContent.innerHTML = `
      <div style="font-size:13px;color:#777;margin-bottom:14px;text-align:center">昵称与头像（仅当前聊天生效，与设置页联系人列表相互独立）</div>

      <div style="margin-bottom:14px">
        <div style="font-size:14px;margin-bottom:6px;color:#222">联系人昵称</div>
        <input id="edit‑nick" value="${this.contactInfo?.name || ""}" style="width:100%;box‑sizing:border‑box;padding:8px;border:1px solid var(--color‑border);border‑radius:var(--radius‑btn);background:var(--color‑bg);color:var(--color‑text)">
        <button id="btn‑save‑nick" style="margin‑top:8px;width:100%;padding:7px;background:var(--color‑main);color:#fff;border:none;border‑radius:var(--radius‑btn)">保存昵称</button>
      </div>

      <div style="margin‑bottom:14px">
        <div style="font‑size:14px;margin‑bottom:6px;color:#222">联系人头像</div>
        <div id="avatar‑preview" style="width:64px;height:64px;border‑radius:50%;background:#eee;margin‑bottom:8px;overflow:hidden">
          ${this.contactInfo?.avatar ? `<img src="${this.contactInfo.avatar}" style="width:100%;height:100%;object‑fit:cover">` : ""}
        </div>
        <button id="btn‑upload‑avatar" style="width:100%;padding:7px;background:var(--color‑main);color:#fff;border:none;border‑radius:var(--radius‑btn)">上传头像图片</button>
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

    // ----绑定形象页按钮事件----
    const saveNickBtn = document.getElementById("btn-save-nick");
    if(saveNickBtn){
      saveNickBtn.onclick = ()=>{
        const input = document.getElementById("edit-nick");
        const val = input.value.trim();
        if(!val){
          Toast.show("昵称不能为空");
          return;
        }
        // 调用chat模块暴露的updateContact更新联系人
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

    const uploadBtn = document.getElementById("btn-upload-avatar");
    const fileInput = document.getElementById("avatar-file");
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
