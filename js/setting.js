import { ThemeManager } from './core/css-theme.js';
import { Toast } from './core/toast.js';
import { Store } from './core/store.js';

export const SettingModule = {
  rootEl: null,
  // 设置内部子页面key
  innerTab: "general",

  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("设置容器找不到", containerSelector);
      return;
    }
    // 监听桌面点联系人图标抛来的全局事件，自动切到联系人页面
    document.addEventListener('setting:open-contact', () => {
      this.innerTab = "contact";
      this.render();
    });
    this.render();
  },

  render() {
    if (!this.rootEl) return;
    this.rootEl.innerHTML = "";

    const wrap = document.createElement('div');
    wrap.style.display = "flex";
    wrap.style.height = "100%";

    // -------- 设置侧边菜单 --------
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

    // -------- 右侧内容区域 --------
    const contentBox = document.createElement('div');
    contentBox.style.flex = "1";
    contentBox.style.overflowY = "auto";
    contentBox.style.padding = "14px";

    // 通用页面：联系人桌面、深色模式、清除数据
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
    // 聊天页面：主题配色（迁移至此），后续放气泡美化
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
    // 系统页面：全屏、导入导出数据
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
    // 专门的联系人子页面，桌面点【联系人】图标会跳这里
    else if(this.innerTab === "contact"){
      contentBox.innerHTML += `
      <div style="margin-bottom:10px">
        <button id="btn-setting-back" style="padding:4px 8px;border:1px solid var(--color-border);border-radius:var(--radius-btn);background:var(--color-bg)">← 返回设置首页</button>
      </div>
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px;">
        <div style="font-weight:bold;margin-bottom:10px;color:var(--color-text)">梦角联系人列表</div>
        <div style="font-size:13px;color:var(--color-text-2);margin-bottom:10px">新增、删除、切换梦角对话对象</div>
        <button id="btn-add-contact" style="width:100%;padding:8px;background:var(--color-main);color:#fff;border:none;border-radius:var(--radius-btn)">+ 新增梦角联系人</button>
        <div id="contact-list-wrap" style="margin-top:12px;color:var(--color-text-2)">暂无联系人，请点击上方新增</div>
      </div>
      `;
    }

    wrap.appendChild(sideBar);
    wrap.appendChild(contentBox);
    this.rootEl.appendChild(wrap);

    // ----绑定按钮事件----
    // 返回设置首页
    const backBtn = document.getElementById('btn-setting-back');
    if(backBtn){
      backBtn.onclick = ()=>{
        this.innerTab = "general";
        this.render();
      }
    }
    // 跳转到联系人子页面
    const gotoContactBtn = document.getElementById('btn-goto-contact-list');
    if(gotoContactBtn){
      gotoContactBtn.onclick = ()=>{
        this.innerTab = "contact";
        this.render();
      }
    }
    // 保存主题配色
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
    // 重置主题
    const resetThemeBtn = document.getElementById("btn-reset-theme");
    if(resetThemeBtn){
      resetThemeBtn.onclick = () => {
        ThemeManager.update(ThemeManager.defaultTheme);
        Toast.show("已恢复默认配色");
        this.render();
      };
    }
    // 清除全部数据
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
    // 新增联系人（占位，下一轮写完整联系人CRUD）
    const addContactBtn = document.getElementById('btn-add-contact');
    if(addContactBtn){
      addContactBtn.onclick = ()=>{
        Toast.show("新增联系人功能待实现");
      }
    }
  }
};
