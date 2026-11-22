import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

export const AvatarNickModal = {
  rootDom: null,
  contactId: null,
  contactInfo: null,
  activeMainTab: "avatar", // avatar / nick
  activeSubTab: "ta", // ta / mine

  open(parentWrap, cid) {
    this.rootDom = parentWrap;
    this.contactId = cid;
    const list = Store.get("contactList", []);
    this.contactInfo = list.find(x => x.id === cid);
    if (!this.contactInfo) return Toast.show("找不到联系人");
    // 初始化池子字段
    if (!this.contactInfo.taAvatarPool) this.contactInfo.taAvatarPool = [];
    if (!this.contactInfo.myAvatarPool) this.contactInfo.myAvatarPool = [];
    if (!this.contactInfo.taNickPool) this.contactInfo.taNickPool = [];
    if (!this.contactInfo.myNickPool) this.contactInfo.myNickPool = [];
    this.render();
  },

  close() {
    if (this.rootDom) this.rootDom.innerHTML = "";
  },

  saveContact() {
    const list = Store.get("contactList", []);
    const idx = list.findIndex(x => x.id === this.contactId);
    if (idx >= 0) {
      list[idx] = this.contactInfo;
      Store.set("contactList", list);
      EventBus.emit("contactInfoChange", this.contactId);
    }
  },

  render() {
    if (!this.rootDom) return;
    this.rootDom.innerHTML = "";
    const mask = document.createElement("div");
    mask.style.position = "absolute";
    mask.style.inset = "0";
    mask.style.background = "rgba(0,0,0,0.4)";
    mask.style.display = "flex";
    mask.style.alignItems = "center";
    mask.style.justifyContent = "center";
    mask.style.zIndex = "99";

    const panel = document.createElement("div");
    panel.style.width = "88%";
    panel.style.maxWidth = "420px";
    panel.style.maxHeight = "85vh";
    panel.style.background = "#fff";
    panel.style.borderRadius = "16px";
    panel.style.overflowY = "auto";

    // 头部
    let html = `
    <div style="padding:16px 16px 8px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:17px;font-weight:bold">头像和昵称互动</div>
      <button id="an-modal-close" style="border:none;background:transparent;font-size:20px">×</button>
    </div>
    `;
    // 【主Tab：头像 / 昵称 居中】
    html += `
    <div style="display:flex;justify-content:center;border-bottom:1px solid #eee;margin:0 16px">
      <div data-tab="avatar" style="padding:10px 18px;font-size:15px;cursor:pointer;${this.activeMainTab==='avatar'?'font-weight:bold;border-bottom:2px solid #222':''}">头像</div>
      <div data-tab="nick" style="padding:10px 18px;font-size:15px;cursor:pointer;${this.activeMainTab==='nick'?'font-weight:bold;border-bottom:2px solid #222':''}">昵称</div>
    </div>
    `;
    // 子Tab TA库 / 我的库
    html += `
    <div style="display:flex;margin:12px 16px;border-radius:8px;overflow:hidden">
      <div data-sub="ta" style="flex:1;text-align:center;padding:8px 0;cursor:pointer;${this.activeSubTab==='ta'?'background:#222;color:#fff':'background:#f3f3f3'}">
        ${this.activeMainTab==='avatar'?`TA头像库(${this.contactInfo.taAvatarPool.length})`:`TA昵称库(${this.contactInfo.taNickPool.length})`}
      </div>
      <div data-sub="mine" style="flex:1;text-align:center;padding:8px 0;cursor:pointer;${this.activeSubTab==='mine'?'background:#222;color:#fff':'background:#f3f3f3'}">
        ${this.activeMainTab==='avatar'?`我的头像库(${this.contactInfo.myAvatarPool.length})`:`我的昵称库(${this.contactInfo.myNickPool.length})`}
      </div>
    </div>
    `;

    // 内容区
    if (this.activeMainTab === "avatar") {
      if(this.activeSubTab === "ta"){
        html += `
        <div style="padding:0 16px 12px">
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <input id="ta-avatar-file" type="file" accept="image/*" multiple style="display:none">
            <button id="btn-batch-ta-avatar" style="width:100%;padding:9px;border:1px solid #ddd;border-radius:8px;background:#f7f7f7">批量添加TA头像</button>
          </div>
          <div id="ta-avatar-list" style="display:flex;flex-wrap:wrap;gap:8px">
            ${this.contactInfo.taAvatarPool.map(item=>`<div style="width:60px;height:60px;border-radius:8px;overflow:hidden;position:relative"><img src="${item}" style="width:100%;height:100%;object-fit:cover"><button data-del="taAvatar" data-val="${item}" style="position:absolute;top:0;right:0;background:#0008;color:#fff;border:none;width:18px;height:18px">×</button></div>`).join('')}
          </div>
        </div>
        `;
      }else{
        html += `
        <div style="padding:0 16px 12px">
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <input id="my-avatar-file" type="file" accept="image/*" multiple style="display:none">
            <button id="btn-batch-my-avatar" style="width:100%;padding:9px;border:1px solid #ddd;border-radius:8px;background:#f7f7f7">批量添加我的头像</button>
          </div>
          <div id="my-avatar-list" style="display:flex;flex-wrap:wrap;gap:8px">
            ${this.contactInfo.myAvatarPool.map(item=>`<div style="width:60px;height:60px;border-radius:8px;overflow:hidden;position:relative"><img src="${item}" style="width:100%;height:100%;object-fit:cover"><button data-del="myAvatar" data-val="${item}" style="position:absolute;top:0;right:0;background:#0008;color:#fff;border:none;width:18px;height:18px">×</button></div>`).join('')}
          </div>
        </div>
        `;
      }
    }else{
      if(this.activeSubTab === "ta"){
        html += `
        <div style="padding:0 16px 12px">
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <input id="input-ta-nick" placeholder="输入TA的昵称" style="flex:1;padding:9px;border:1px solid #ddd;border-radius:8px">
            <button id="btn-add-ta-nick" style="padding:9px 14px;border:none;border-radius:8px;background:#7c68ee;color:#fff">添加</button>
          </div>
          <div id="ta-nick-list">
            ${this.contactInfo.taNickPool.map(item=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee"><span>${item}</span><button data-del="taNick" data-val="${item}" style="border:none;background:#eee;border-radius:4px">删除</button></div>`).join('')}
          </div>
        </div>
        `;
      }else{
        html += `
        <div style="padding:0 16px 12px">
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <input id="input-my-nick" placeholder="输入我的昵称" style="flex:1;padding:9px;border:1px solid #ddd;border-radius:8px">
            <button id="btn-add-my-nick" style="padding:9px 14px;border:none;border-radius:8px;background:#7c68ee;color:#fff">添加</button>
          </div>
          <div id="my-nick-list">
            ${this.contactInfo.myNickPool.map(item=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee"><span>${item}</span><button data-del="myNick" data-val="${item}" style="border:none;background:#eee;border-radius:4px">删除</button></div>`).join('')}
          </div>
        </div>
        `;
      }
    }

    // 轮换配置区域
    html += `
    <div style="padding:0 16px 20px">
      <div style="font-weight:bold;margin:8px 0">开启随机更换</div>
      <div style="font-size:12px;color:#777;margin-bottom:12px">TA会每隔1–8小时随机轮换，页面激活时生效</div>

      ${this.renderRandomRow("对方头像随机轮换", "taAvatarRandom")}
      ${this.renderRandomRow("对方昵称随机轮换", "taNickRandom")}
      ${this.renderRandomRow("我的头像随机轮换", "myAvatarRandom")}
      ${this.renderRandomRow("我的昵称随机轮换", "myNickRandom")}
    </div>
    `;
    panel.innerHTML = html;
    mask.appendChild(panel);
    this.rootDom.appendChild(mask);

    // 关闭按钮
    document.getElementById("an-modal-close").onclick = ()=> this.close();
    mask.onclick = (e)=>{if(e.target === mask) this.close()};

    // Tab切换事件
    document.querySelectorAll('[data-tab]').forEach(el=>{
      el.onclick = ()=>{
        this.activeMainTab = el.dataset.tab;
        this.render();
      }
    })
    document.querySelectorAll('[data-sub]').forEach(el=>{
      el.onclick = ()=>{
        this.activeSubTab = el.dataset.sub;
        this.render();
      }
    })

    // 昵称添加
    const addTaNickBtn = document.getElementById("btn-add-ta-nick");
    if(addTaNickBtn){
      addTaNickBtn.onclick = ()=>{
        const v = document.getElementById("input-ta-nick").value.trim();
        if(!v) return Toast.show("昵称不能为空");
        if(this.contactInfo.taNickPool.includes(v)) return Toast.show("已经存在");
        this.contactInfo.taNickPool.push(v);
        this.saveContact();
        Toast.show("添加成功");
        this.render();
      }
    }
    const addMyNickBtn = document.getElementById("btn-add-my-nick");
    if(addMyNickBtn){
      addMyNickBtn.onclick = ()=>{
        const v = document.getElementById("input-my-nick").value.trim();
        if(!v) return Toast.show("昵称不能为空");
        if(this.contactInfo.myNickPool.includes(v)) return Toast.show("已经存在");
        this.contactInfo.myNickPool.push(v);
        this.saveContact();
        Toast.show("添加成功");
        this.render();
      }
    }

    // 批量头像上传
    this.bindAvatarUpload("ta-avatar-file", "btn-batch-ta-avatar", "taAvatarPool");
    this.bindAvatarUpload("my-avatar-file", "btn-batch-my-avatar", "myAvatarPool");

    // 删除项
    document.querySelectorAll('[data-del]').forEach(el=>{
      el.onclick = ()=>{
        const type = el.dataset.del;
        const val = el.dataset.val;
        let arr;
        if(type === "taAvatar") arr = this.contactInfo.taAvatarPool;
        if(type === "myAvatar") arr = this.contactInfo.myAvatarPool;
        if(type === "taNick") arr = this.contactInfo.taNickPool;
        if(type === "myNick") arr = this.contactInfo.myNickPool;
        const idx = arr.indexOf(val);
        if(idx > -1) arr.splice(idx,1);
        this.saveContact();
        Toast.show("已删除");
        this.render();
      }
    })

    // 轮换保存
    document.querySelectorAll(".rand-save-btn").forEach(btn=>{
      btn.onclick = ()=>{
        const key = btn.dataset.randkey;
        const input = document.getElementById("rand-input-"+key);
        const val = Number(input.value);
        if(isNaN(val) || val <1 || val>8) return Toast.show("范围1~8小时");
        this.contactInfo[key].intervalHour = val;
        this.saveContact();
        Toast.show("已保存间隔");
        this.render();
      }
    })
    document.querySelectorAll(".rand-check").forEach(ck=>{
      ck.onchange = ()=>{
        const key = ck.dataset.randkey;
        this.contactInfo[key].enable = ck.checked;
        this.contactInfo[key].lastChangeTs = Date.now();
        this.saveContact();
        Toast.show(ck.checked?"已开启轮换":"关闭轮换");
      }
    })
  },

  renderRandomRow(label, key){
    const cfg = this.contactInfo[key];
    return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin:10px 0">
      <label style="display:flex;align-items:center;gap:6px">
        <input class="rand-check" data-randkey="${key}" type="checkbox" ${cfg.enable?"checked":""}>
        <span>${label}</span>
      </label>
      <div style="display:flex;gap:6px;align-items:center">
        <input id="rand-input-${key}" value="${cfg.intervalHour}" style="width:46px;padding:4px;border:1px solid #ddd;border-radius:4px">
        <button class="rand-save-btn" data-randkey="${key}" style="border:1px solid #aaa;background:#fff;border-radius:4px;padding:3px 6px">保存</button>
      </div>
    </div>
    `
  },

  bindAvatarUpload(fileId, btnId, poolKey){
    const fileInp = document.getElementById(fileId);
    const btn = document.getElementById(btnId);
    if(!fileInp || !btn) return;
    btn.onclick = ()=> fileInp.click();
    fileInp.onchange = async (ev)=>{
      const files = Array.from(ev.target.files);
      if(!files.length) return;
      for(const f of files){
        const reader = new FileReader();
        await new Promise(res=>{
          reader.onload = (e)=>{
            const src = e.target.result;
            if(!this.contactInfo[poolKey].includes(src)){
              this.contactInfo[poolKey].push(src);
            }
            res();
          }
          reader.readAsDataURL(f);
        })
      }
      this.saveContact();
      Toast.show("头像批量添加完成");
      this.render();
    }
  }
}
