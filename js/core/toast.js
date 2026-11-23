// 全局顶层Toast，挂载body，最高层级不会被弹窗遮挡
export const Toast = {
  show(msg, duration = 2200) {
    let toastEl = document.querySelector('#global-top-toast');
    if (toastEl) {
      clearTimeout(toastEl._timer);
      toastEl.textContent = msg;
      toastEl.style.opacity = "1";
    } else {
      toastEl = document.createElement('div');
      toastEl.id = 'global-top-toast';
      toastEl.style.cssText = `
position: fixed;
left: 50%;
top: 134px;
transform: translateX(-50%);
background: #222222;
color: #ffffff;
padding: 10px 22px;
border-radius: 999px;
font-size:14px;
z-index: 999999;
white-space: nowrap;
pointer-events: none;
transition: opacity 0.2s ease;
opacity: 1;
box-shadow:0 2px 12px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    toastEl._timer = setTimeout(() => {
      toastEl.style.opacity = '0';
      setTimeout(() => {
        if(toastEl.parentNode) toastEl.remove();
      }, 200);
    }, duration);
  }
};
