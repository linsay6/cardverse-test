// js/desktop.js
export const DesktopModule = {
  rootEl: null,
  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("桌面容器找不到", containerSelector);
      return;
    }
    this.rootEl.innerHTML = `
    <div class="desktop-page">
      <div class="grid-9">
        <div class="app-item" data-tab="chat">
          <div class="app-icon">💬</div>
          <div class="app-name">聊天</div>
        </div>
        <div class="app-item" data-tab="card">
          <div class="app-icon">📜</div>
          <div class="app-name">字卡库</div>
        </div>
        <div class="app-item" data-tab="setting" data-sub="contact">
          <div class="app-icon">👤</div>
          <div class="app-name">联系人</div>
        </div>
        <div class="app-item" data-page="treehole">
          <div class="app-icon">🌳</div>
          <div class="app-name">树洞</div>
        </div>
        <div class="app-item" data-page="tarot">
          <div class="app-icon">🔮</div>
          <div class="app-name">塔罗</div>
        </div>
        <div class="app-item" data-page="cabin">
          <div class="app-icon">🏠</div>
          <div class="app-name">小屋</div>
        </div>
        <div class="app-item" data-page="review">
          <div class="app-icon">✅</div>
          <div class="app-name">审核</div>
        </div>
        <div class="app-item" data-tab="setting">
          <div class="app-icon">⚙️</div>
          <div class="app-name">设置</div>
        </div>
      </div>
    </div>
    <style>
      .desktop-page{padding:20px 12px;box-sizing:border-box;}
      .grid-9{
        display:grid;
        grid-template-columns: repeat(3, 1fr);
        gap:18px;
      }
      .app-item{
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:6px;
        padding:10px;
      }
      .app-icon{
        width:52px;height:52px;
        display:grid;place-items:center;
        font-size:26px;
        background:#f4f4f6;
        border-radius:14px;
      }
      .app-name{font-size:13px;color:#333;}
    </style>
  `;

    // 统一点击事件，改用全局Tab切换（绝大多数这类单页项目TabManager会挂window）
    this.rootEl.querySelectorAll('.app-item').forEach(el=>{
      el.onclick = ()=>{
        const targetTab = el.dataset.tab;
        const subPage = el.dataset.sub;
        const pageName = el.dataset.page;

        // 主Tab切换：聊天 / 字卡 / 设置
        if(targetTab){
          if(window.TabManager && typeof window.TabManager.switchTab === 'function'){
            window.TabManager.switchTab(targetTab);
            // 联系人：切换到设置tab后，通知设置页打开联系人面板
            if(subPage === 'contact'){
              window.dispatchEvent(new CustomEvent('setting:open-contact'));
            }
          }else{
            console.error("TabManager不存在，请确认app.js里面挂载 window.TabManager = TabManager");
          }
          return;
        }

        // 独立页面：树洞、塔罗、小屋、审核（先打印占位，后续我们再单独写对应模块）
        if(pageName){
          alert(`【${pageName}】模块待开发`);
        }
      }
    })
  }
};
