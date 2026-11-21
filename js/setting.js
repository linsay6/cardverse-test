import { ThemeManager } from './core/css-theme.js';
import { Toast } from './core/toast.js';

export const SettingModule = {
  rootEl: null,

  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("设置容器找不到", containerSelector);
      return;
    }
    this.render();
  },

  render() {
    if (!this.rootEl) return;
    this.rootEl.innerHTML = "";
    const wrap = document.createElement('div');
    wrap.style.padding = "14px";

    wrap.innerHTML = `
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
    `;
    this.rootEl.appendChild(wrap);

    // 保存配色
    document.getElementById("btn-save-theme").onclick = () => {
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

    // 重置主题
    document.getElementById("btn-reset-theme").onclick = () => {
      ThemeManager.update(ThemeManager.defaultTheme);
      Toast.show("已恢复默认配色");
      this.render();
    };
  }
};
