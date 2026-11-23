export const DesktopModule = {
  init(selector) {
    const wrap = document.querySelector(selector);
    if (!wrap) return;

    wrap.innerHTML = `
    <div class="desktop-grid">
      <div class="desktop-item" data-tab="chat">
        <div class="icon">💬</div>
        <div class="label">聊天</div>
      </div>
      <div class="desktop-item" data-tab="card">
        <div class="icon">📜</div>
        <div class="label">字卡库</div>
      </div>
      <div class="desktop-item" data-tab="setting" data-sub="contact">
        <div class="icon">👤</div>
        <div class="label">联系人</div>
      </div>
      <div class="desktop-item" data-action="treehole">
        <div class="icon">🌳</div>
        <div class="label">树洞</div>
      </div>
      <div class="desktop-item" data-action="tarot">
        <div class="icon">🔮</div>
        <div class="label">卜星</div>
      </div>
      <div class="desktop-item" data-action="house">
        <div class="icon">🏠</div>
        <div class="label">小屋</div>
      </div>
      <div class="desktop-item" data-action="audit">
        <div class="icon">✅</div>
        <div class="label">审核</div>
      </div>
      <div class="desktop-item" data-tab="setting">
        <div class="icon">⚙️</div>
        <div class="label">设置</div>
      </div>
    </div>
    <style>
    .desktop-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:20px}
    .desktop-item{text-align:center;padding:12px;border-radius:12px;background:var(--color-bg);cursor:pointer}
    .desktop-item .icon{font-size:32px;margin-bottom:6px}
    .desktop-item .label{font-size:14px;color:var(--color-text)}
    </style>
    `;

    wrap.querySelectorAll('.desktop-item').forEach(el=>{
      el.onclick = ()=>{
        const targetTab = el.dataset.tab;
        const sub = el.dataset.sub;
        const action = el.dataset.action;

        if(targetTab){
          // 直接点击底部对应的tab按钮，复用原有逻辑，不调用TabManager
          const tabBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
          if(tabBtn) tabBtn.click();

          if(sub === 'contact'){
            setTimeout(()=>{
              // 等设置面板切出来之后，抛事件给setting模块打开联系人
              document.dispatchEvent(new CustomEvent('setting:open-contact'));
            }, 80);
          }
        }else if(action){
          alert(`功能【${el.querySelector('.label').innerText}】暂未开发`);
        }
      }
    })
  }
}
