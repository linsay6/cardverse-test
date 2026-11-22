// js/desktop.js
export function initDesktop(container) {
  container.innerHTML = `
    <div class="desktop-page">
      <div class="grid-9">
        <div class="app-item" data-target="chat">
          <div class="app-icon">💬</div>
          <div class="app-name">聊天</div>
        </div>
        <div class="app-item" data-target="card">
          <div class="app-icon">📜</div>
          <div class="app-name">字卡库</div>
        </div>
        <div class="app-item" data-target="setting-contact">
          <div class="app-icon">👤</div>
          <div class="app-name">联系人</div>
        </div>
        <div class="app-item">
          <div class="app-icon">🌳</div>
          <div class="app-name">树洞</div>
        </div>
        <div class="app-item">
          <div class="app-icon">🔮</div>
          <div class="app-name">塔罗</div>
        </div>
        <div class="app-item">
          <div class="app-icon">🏠</div>
          <div class="app-name">小屋</div>
        </div>
        <div class="app-item">
          <div class="app-icon">✅</div>
          <div class="app-name">审核</div>
        </div>
        <div class="app-item" data-target="setting">
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

  // 图标点击跳转Tab事件，通知app主模块切换tab
  container.querySelectorAll('.app-item').forEach(el=>{
    el.onclick = ()=>{
      const target = el.dataset.target;
      if(!target) return;
      if(target === 'chat'){
        window.$bus.emit('tab:switch','chat');
      }else if(target === 'card'){
        window.$bus.emit('tab:switch','card');
      }else if(target === 'setting' || target === 'setting-contact'){
        window.$bus.emit('tab:switch','setting');
        if(target === 'setting-contact'){
          window.$bus.emit('setting:open-contact');
        }
      }
    }
  })
}
