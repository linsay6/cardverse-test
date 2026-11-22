import { ThemeManager } from './core/css-theme.js';
import { Toast } from './core/toast.js';
import { Store } from './core/store.js';

export const SettingModule = {
  rootEl: null,
  innerTab: "general",

  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("设置容器找不到", containerSelector);
      return;
    }
    document.addEventListener('setting:open-contact', () => {
      this.innerTab = "contact";
      this.render();
    });
    this.render();
  },

  getContactList() {
    return Store.get("contactList") || [];
  },
  saveContactList(list) {
    Store.set("contactList", list);
  },
  setActiveContact(id) {
    Store.set("activeContactId", id);
    document.dispatchEvent(new CustomEvent("contact:change", { detail: id }));
  },

  render() {
    if (!this.rootEl) return;
    this.rootEl.innerHTML = "";

    const wrap = document.createElement('div');
    wrap.style.display = "flex";
    wrap.style.height = "100%";

    const sideBar = document.createElement('div');
    sideBar.style.width = "130px";
    sideBar.style.borderRight = "1px solid var(--color-border)";
    sideBar.style.overflowY = "auto";
    const sideItems = [
      { key: "general", label: "通用" },
      { key: "chat", label: "聊天" },
      { key: "system", label: "系统" },
      { key: "tool", label: "工具" },
      { key: "diagnose", label: "信息诊断" },
      { key: "about", label: "关于" },
    ];
    sideItems.forEach(item => {
      const btn = document.createElement('button');
      btn.style.display = "block";
      btn.style.width = "100%";
      btn.style.textAlign = "left";
      btn.style.border = "none";
      btn.style.background = this.innerTab === item.key ? "var(--color-main)" : "transparent";
      btn.style.color = this.innerTab === item.key ? "#fff" : "var(--color-text)";
      btn.style.padding = "12px 10px";
      btn.style.fontSize = "14px";
      btn.innerText = item.label;
      btn.onclick = () => {
        this.innerTab = item.key;
        this.render();
      };
      sideBar.appendChild(btn);
    });

    const contentBox = document.createElement('div');
    contentBox.style.flex = "1";
    contentBox.style.overflowY = "auto";
    contentBox.style.padding = "14px";

    if(this.innerTab === "general"){
      contentBox.innerHTML += `
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px;margin-bottom:12px">
        <div style="font-weight:bold;margin-bottom:10px;color:var(--color-text)">联系人 / 桌面</div>
        <div style="font-size:13px;color:var(--color-text-2);margin-bottom:8px">管理多个梦角联系人，切换对话桌面</div>
        <button id="btn-goto-contact-list" style="width:100%;padding:8px;background:var(--color-main);color:#fff;border:none;border-radius:var(--radius-btn)">打开联系人列表</button>
      </div>
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px;margin-bottom:12px">
        <div style="font-weight:bold;margin-bottom:10px;color:var(--color-text)">外观</div>
        <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
          <span>深色模式</span>
          <span style="color:var(--color-text-2)">待实现</span>
        </div>
      </div>
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px">
        <div style="font-weight:bold;margin-bottom:10px;color:#c92a2a">危险操作</div>
        <div style="font-size:13px;color:var(--color-text-2);margin-bottom:8px">清除本地全部数据，建议先导出备份</div>
        <button id="btn-clear-all" style="width:100%;padding:8px;background:#c92a2a;color:#fff;border:none;border-radius:var(--radius-btn)">清除全部本地数据</button>
      </div>
      `;
    }
    else if(this.innerTab === "chat"){
      contentBox.innerHTML += `
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px;">
        <div style="font-weight:bold;margin-bottom:12px;color:var(--color-text)">主题配色</div>
        <div style="margin-bottom:10px;">
          <div style="font-size:13px;color:var(--color-text-2);margin-bottom:4px;">主色调</div>
          <input id="input-main-color" type="color" value="${ThemeManager.currentTheme.colorMain}">
        </div>
        <div style="margin-bottom:10px;">
          <div style="font-size:13px;color:var(--color-text-2);margin-bottom:4px;">背景色</div>
          <input id="input-bg-color" type="color" value="${ThemeManager.currentTheme.colorBg}">
        </div>
        <div style="margin-bottom:10px;">
          <div style="font-size:13px;color:var(--color-text-2);margin-bottom:4px;">文字颜色</div>
          <input id="input-text-color" type="color" value="${ThemeManager.currentTheme.colorText}">
        </div>
        <div style="margin-bottom:12px;">
          <div style="font-size:13px;color:var(--color-text-2);margin-bottom:4px;">次要文字颜色</div>
          <input id="input-text2-color" type="color" value="${ThemeManager.currentTheme.colorText2}">
        </div>
        <button id="btn-save-theme" style="width:100%;padding:8px;background:var(--color-main);color:#fff;border:none;border-radius:var(--radius-btn);margin-bottom:8px">保存配色</button>
        <button id="btn-reset-theme" style="width:100%;padding:8px;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-text);border-radius:var(--radius-btn)">恢复默认配色</button>
      </div>
      <div style="margin-top:12px;border:1px dashed var(--color-border);border-radius:var(--radius-card);padding:14px">
        <div style="color:var(--color-text-2)">聊天气泡、壁纸、字体美化（待开发）</div>
      </div>
      `;
    }
    else if(this.innerTab === "system"){
      contentBox.innerHTML += `
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px;margin-bottom:12px">
        <div style="font-weight:bold;margin-bottom:10px;color:var(--color-text)">全屏模式</div>
        <div style="font-size:13px;color:var(--color-text-2)">手机切后台锁屏会自动退出全屏</div>
      </div>
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px">
        <div style="font-weight:bold;margin-bottom:10px;color:var(--color-text)">数据导入 / 导出</div>
        <div style="font-size:13px;color:var(--color-text-2);margin-bottom:8px">聊天记录、字卡、配置备份</div>
        <div style="display:flex;gap:8px;">
          <button style="flex:1;padding:8px;background:var(--color-main);color:#fff;border:none;border-radius:var(--radius-btn)">导出全部数据</button>
          <button style="flex:1;padding:8px;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-text);border-radius:var(--radius-btn)">导入数据</button>
        </div>
      </div>
      `;
    }
    else if(this.innerTab === "tool"){
      contentBox.innerHTML += `<div style="padding:20px;color:var(--color-text-2)">工具面板（屏幕适配、图片压缩等，待开发）</div>`;
    }
    else if(this.innerTab === "diagnose"){
      contentBox.innerHTML += `<div style="padding:20px;color:var(--color-text-2)">信息诊断、卡顿自检、日志查看，待开发</div>`;
    }
    else if(this.innerTab === "about"){
      contentBox.innerHTML += `<div style="padding:20px;color:var(--color-text-2)">关于本项目版本信息</div>`;
    }
    else if(this.innerTab === "contact"){
      const list = this.getContactList();
      const activeId = Store.get("activeContactId");
      let html = `
      <div style="margin-bottom:10px">
        <button id="btn-setting-back" style="padding:4px 8px;border:1px solid var(--color-border);border-radius:var(--radius-btn);background:var(--color-bg)">← 返回设置首页</button>
      </div>
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px;margin-bottom:12px;">
        <div style="font-weight:bold;margin-bottom:10px;color:var(--color-text)">新增梦角联系人</div>
        <div style="margin-bottom:8px">
          <div style="font-size:13px;color:var(--color-text-2)">名称</div>
          <input id="c-name" placeholder="输入名字" style="width:100%;box-sizing:border-box;padding:6px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);color:var(--color-text)">
        </div>
        <div style="margin-bottom:8px">
          <div style="font-size:13px;color:var(--color-text-2)">头像链接</div>
          <input id="c-avatar" placeholder="图片url，留空用默认" style="width:100%;box-sizing:border-box;padding:6px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);color:var(--color-text)">
        </div>
        <div style="margin-bottom:8px">
          <div style="font-size:13px;color:var(--color-text-2)">简介</div>
          <textarea id="c-desc" rows="2" placeholder="人设简介" style="width:100%;box-sizing:border-box;padding:6px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);color:var(--color-text)"></textarea>
        </div>
        <button id="btn-add-contact" style="width:100%;padding:8px;background:var(--color-main);color:#fff;border:none;border-radius:var(--radius-btn)">+ 添加联系人</button>
      </div>
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px;">
        <div style="font-weight:bold;margin-bottom:10px;color:var(--color-text)">联系人列表</div>
      `;
      if(list.length === 0){
        html += `<div style="color:var(--color-text-2)">暂无联系人，请添加</div>`;
      }else{
        for(const item of list){
          html += `
          <div data-cid="${item.id}" style="display:flex;align-items:center;justify-content:space-between;padding:8px;border-radius:6px;margin-bottom:6px;${activeId === item.id ? 'background:var(--color-main);color:#fff' : 'background:var(--color-bg)'}">
            <div style="flex:1">
              <div>${item.name}</div>
              <div style="font-size:12px;opacity:0.7">${item.desc || ''}</div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn-select-c" data-id="${item.id}" style="padding:4px 6px;border:1px solid currentColor;border-radius:4px;background:transparent">选中</button>
              <button class="btn-del-c" data-id="${item.id}" style="padding:4px 6px;border:1px solid #ff6b6b;border-radius:4px;background:transparent;color:#ff6b6b">删除</button>
            </div>
          </div>
          `;
        }
      }
      html += `</div>`;
      contentBox.innerHTML = html;
    }

    wrap.appendChild(sideBar);
    wrap.appendChild(contentBox);
    this.rootEl.appendChild(wrap);

    const backBtn = document.getElementById('btn-setting-back');
    if(backBtn){
      backBtn.onclick = ()=>{
        this.innerTab = "general";
        this.render();
      }
    }
    const gotoContactBtn = document.getElementById('btn-goto-contact-list');
    if(gotoContactBtn){
      gotoContactBtn.onclick = ()=>{
        this.innerTab = "contact";
        this.render();
      }
    }
    const saveThemeBtn = document.getElementById("btn-save-theme");
    if(saveThemeBtn){
      saveThemeBtn.onclick = () => {
        const newTheme = {
          colorMain: document.getElementById("input-main-color").value,
          colorBg: document.getElementById("input-bg-color").value,
          colorText: document.getElementById("input-text-color").value,
          colorText2: document.getElementById("input-text2-color").value
        };
        ThemeManager.update(newTheme);
        Toast.show("配色已保存");
        this.render();
      };
    }
    const resetThemeBtn = document.getElementById("btn-reset-theme");
    if(resetThemeBtn){
      resetThemeBtn.onclick = () => {
        ThemeManager.update(ThemeManager.defaultTheme);
        Toast.show("已恢复默认配色");
        this.render();
      };
    }
    const clearAllBtn = document.getElementById('btn-clear-all');
    if(clearAllBtn){
      clearAllBtn.onclick = ()=>{
        if(confirm("确定要清空全部本地存储？删除后无法恢复，建议先导出备份！")){
          Store.clearAll();
          Toast.show("已清空全部本地数据，页面即将刷新");
          setTimeout(()=>location.reload(), 600);
        }
      }
    }
    const addContactBtn = document.getElementById('btn-add-contact');
    if(addContactBtn){
      addContactBtn.onclick = ()=>{
        const nameInput = document.getElementById("c-name");
        const avatarInput = document.getElementById("c-avatar");
        const descInput = document.getElementById("c-desc");
        const name = nameInput.value.trim();
        if(!name){
          Toast.show("名字不能为空");
          return;
        }
        const list = this.getContactList();
        const newItem = {
          id: Date.now().toString(),
          name,
          avatar: avatarInput.value.trim(),
          desc: descInput.value.trim()
        };
        list.push(newItem);
        this.saveContactList(list);
        Toast.show("添加成功");
        this.render();
      }
    }
    document.querySelectorAll(".btn-select-c").forEach(btn=>{
      btn.onclick = (e)=>{
        const id = e.target.dataset.id;
        this.setActiveContact(id);
        Toast.show("已切换联系人");
        this.render();
      }
    })
    document.querySelectorAll(".btn-del-c").forEach(btn=>{
      btn.onclick = (e)=>{
        const id = e.target.dataset.id;
        if(!confirm("确定删除这个联系人？聊天记录也会跟着丢失")) return;
        let list = this.getContactList();
        list = list.filter(x=>x.id !== id);
        this.saveContactList(list);
        const activeId = Store.get("activeContactId");
        if(activeId === id){
          Store.remove("activeContactId");
        }
        Toast.show("已删除");
        this.render();
      }
    })
  }
};
