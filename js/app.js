import { ThemeManager } from './core/css-theme.js';
import { Toast } from './core/toast.js';
import { DesktopModule } from './desktop.js';
import { CardEditorModule } from './card-editor.js';
import { ChatModule } from './chat.js';
import { SettingModule } from './setting.js';
import { AuditCardModule } from './audit.js';
import { AuditPanelModule } from './audit-panel.js';
import { ModalAvatarNick } from './modal-avatar-nick.js';
window.$Toast = Toast;
window.$Theme = ThemeManager;
// 挂载ChatModule到全局，供头像昵称互动模块调用系统通知
window.ChatModule = ChatModule;
// Tab 切换管理
const TabManager = {
  tabs: [
    { key: "desktop", selector: "#tab-desktop", module: DesktopModule },
    { key: "card", selector: "#tab-card", module: CardEditorModule },
    { key: "chat", selector: "#tab-chat", module: ChatModule },
    { key: "setting", selector: "#tab-setting", module: SettingModule }
  ],
  activeKey: "desktop",
  init() {
    this.tabs.forEach(tabItem => {
      tabItem.module.init(tabItem.selector);
    });
    this.bindTabClick();
    this.switchTab(this.activeKey);
  },
  bindTabClick() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.onclick = () => {
        const targetKey = btn.dataset.tab;
        this.switchTab(targetKey);
      };
    });
  },
  switchTab(key) {
    this.activeKey = key;
    // 隐藏所有面板
    this.tabs.forEach(tabItem => {
      const el = document.querySelector(tabItem.selector);
      if(el) el.style.display = "none";
    });
    // 显示当前面板
    const activeTab = this.tabs.find(t => t.key === key);
    if(activeTab){
      const el = document.querySelector(activeTab.selector);
      if(el) el.style.display = "block";
    }
    // Tab按钮高亮
    document.querySelectorAll(".tab-btn").forEach(btn => {
      if(btn.dataset.tab === key){
        btn.style.background = "var(--color-main)";
        btn.style.color = "#fff";
      }else{
        btn.style.background = "var(--color-bg)";
        btn.style.color = "var(--color-text)";
      }
    });
  }
};
window.TabManager = TabManager;
async function bootstrap() {
  console.log("应用开始初始化");
  ThemeManager.load();
  TabManager.init();
  // ✅新增：初始化审核弹窗面板
  AuditPanelModule.init();
  // 新增：启动头像昵称后台轮换轮询定时器（30秒扫描一次全部联系人）
  ModalAvatarNick.startBackgroundRotate();
  console.log("所有模块初始化完成");
  Toast.show("初始化完成");
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
