import { Store } from './store.js';
import { EventBus } from './context.js';
/**
 * 主题管理：读取配置、更新页面CSS变量
 */
export const ThemeManager = {
  // 默认主题配置，和index.html里:root的变量一一对应
  defaultTheme: {
    colorMain: "#7c68ee",
    colorBg: "#ffffff",
    colorText: "#222222",
    colorText2: "#666666",
    colorBorder: "#e5e7eb",
    radiusGlobal: "18px",
    radiusCard: "14px",
    radiusBtn: "10px",
    tabInactive: "#999"
  },
  // 当前生效的主题
  currentTheme: {},
  /**
   * 加载主题：从本地存储读取，没有就用默认
   */
  load() {
    const saved = Store.get("app-theme", this.defaultTheme);
    this.currentTheme = { ...this.defaultTheme, ...saved };
    this.apply();
  },
  /**
   * 把currentTheme里面的值，同步到页面CSS变量
   */
  apply() {
    const root = document.documentElement;
    root.style.setProperty("--color-main", this.currentTheme.colorMain);
    root.style.setProperty("--color-bg", this.currentTheme.colorBg);
    root.style.setProperty("--color-text", this.currentTheme.colorText);
    root.style.setProperty("--color-text-2", this.currentTheme.colorText2);
    root.style.setProperty("--color-border", this.currentTheme.colorBorder);
    root.style.setProperty("--radius-global", this.currentTheme.radiusGlobal);
    root.style.setProperty("--radius-card", this.currentTheme.radiusCard);
    root.style.setProperty("--radius-btn", this.currentTheme.radiusBtn);
    root.style.setProperty("--tab-inactive", this.currentTheme.tabInactive);
    root.style.setProperty("--tab-active", this.currentTheme.colorMain);

    // 全局：占位提示文字、时间标签跟随次要文字颜色
    let globalStyle = document.getElementById('global‑theme‑aux‑style');
    if (!globalStyle) {
        globalStyle = document.createElement('style');
        globalStyle.id = 'global‑theme‑aux‑style';
        document.head.appendChild(globalStyle);
    }
    globalStyle.textContent = `
::placeholder {
  color: var(--color-text-2) !important;
  opacity: 1;
}
.time-label {
  color: var(--color-text-2) !important;
  font-size:11px;
}
`;

    // 触发主题变更事件，通知所有模块刷新UI
    EventBus.emit("themeChange", this.currentTheme);
  },
  /**
   * 更新并保存主题
   * @param {object} newPartial 要修改的部分主题
   */
  update(newPartial) {
    this.currentTheme = { ...this.currentTheme, ...newPartial };
    Store.set("app-theme", this.currentTheme);
    this.apply();
  }
};
