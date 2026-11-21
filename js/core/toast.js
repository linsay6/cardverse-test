import { EventBus } from './context.js';

export const Toast = {
  /**
   * 弹出轻提示
   * @param {string} msg 提示文字
   * @param {number} duration 显示时长，毫秒
   */
  show(msg, duration = 2200) {
    // 如果页面上已经有toast，先移除旧的
    let oldToast = document.querySelector('.app-toast');
    if (oldToast) oldToast.remove();

    const toastEl = document.createElement('div');
    toastEl.className = 'app-toast';
    toastEl.innerText = msg;
    toastEl.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 120px;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.72);
      color: #fff;
      padding: 8px 16px;
      border-radius: var(--radius-btn);
      font-size: 14px;
      z-index: 9999;
      white-space: nowrap;
    `;
    document.body.appendChild(toastEl);

    setTimeout(() => {
      toastEl.remove();
    }, duration);
  }
};

// 也支持通过事件总线触发提示，方便别的模块直接发消息弹toast
EventBus.on('toast:show', (payload) => {
  Toast.show(payload.msg, payload.duration);
});
