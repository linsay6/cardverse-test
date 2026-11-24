import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

// ========== 内置图片裁剪工具 ==========
function cropImageToSquare(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ========== 常量配置 ==========
const STORAGE_KEY = 'desktop-layout';
const CARD_WIDTH = 56;
const CARD_HEIGHT = 56;
const WIDGET_AREA_HEIGHT = 110;
const INDICATOR_HEIGHT = 30;
const GAP = 14;
const SNAP_DISTANCE = 14;
const PAGE_SWIPE_THRESHOLD = 60;
const LABEL_HEIGHT = 18; // 图标下方文字高度

// ========== 36个功能卡片元数据 ==========
const CARD_META = [
  // ===== 已开发 8个 =====
  { id: 'chat', name: '聊天', defaultIcon: '💬', isDev: false, type: 'tab', target: 'chat' },
  { id: 'card', name: '字卡库', defaultIcon: '📜', isDev: false, type: 'tab', target: 'card' },
  { id: 'contact', name: '联系人', defaultIcon: '👤', isDev: false, type: 'tab', target: 'setting', sub: 'contact' },
  { id: 'treehole', name: '树洞', defaultIcon: '🌳', isDev: false, type: 'action', action: 'treehole' },
  { id: 'tarot', name: '卜星', defaultIcon: '🔮', isDev: false, type: 'action', action: 'tarot' },
  { id: 'house', name: '小屋', defaultIcon: '🏠', isDev: false, type: 'action', action: 'house' },
  { id: 'audit', name: '审核', defaultIcon: '✅', isDev: false, type: 'action', action: 'audit' },
  { id: 'setting', name: '设置', defaultIcon: '⚙️', isDev: false, type: 'tab', target: 'setting' },
  // ===== 开发中 28个 =====
  { id: 'groupchat', name: '群聊', defaultIcon: '👥', isDev: true },
  { id: 'heartletter', name: '心信笺', defaultIcon: '💌', isDev: true },
  { id: 'moments', name: '朋友圈', defaultIcon: '🌐', isDev: true },
  { id: 'favorite', name: '收藏', defaultIcon: '⭐', isDev: true },
  { id: 'track', name: '行迹', defaultIcon: '📍', isDev: true },
  { id: 'resonance', name: '共鸣', defaultIcon: '🎵', isDev: true },
  { id: 'dwelling', name: '朝夕之居', defaultIcon: '🏡', isDev: true },
  { id: 'garden', name: '花园', defaultIcon: '🌸', isDev: true },
  { id: 'music', name: '音乐', defaultIcon: '🎶', isDev: true },
  { id: 'reach', name: '伸手', defaultIcon: '🤚', isDev: true },
  { id: 'here', name: '此间', defaultIcon: '📷', isDev: true },
  { id: 'calendar', name: '日历', defaultIcon: '📅', isDev: true },
  { id: 'anniversary', name: '纪念日', defaultIcon: '💝', isDev: true },
  { id: 'narrate', name: '叙心', defaultIcon: '📝', isDev: true },
  { id: 'qa', name: '提答录', defaultIcon: '❓', isDev: true },
  { id: 'moonletter', name: '月信', defaultIcon: '🌙', isDev: true },
  { id: 'chatnote', name: '聊记', defaultIcon: '📒', isDev: true },
  { id: 'letternote', name: '汇笺', defaultIcon: '📨', isDev: true },
  { id: 'dreambook', name: '梦册', defaultIcon: '💭', isDev: true },
  { id: 'selfintro', name: '自叙', defaultIcon: '✍️', isDev: true },
  { id: 'memo', name: '备忘', defaultIcon: '📋', isDev: true },
  { id: 'pomodoro', name: '专注', defaultIcon: '🍅', isDev: true },
  { id: 'piggybank', name: '扑满', defaultIcon: '🫙', isDev: true },
  { id: 'account', name: '账簿', defaultIcon: '💰', isDev: true },
  { id: 'water', name: '饮水', defaultIcon: '💧', isDev: true },
  { id: 'foodchoice', name: '寻味', defaultIcon: '🍜', isDev: true },
  { id: 'heartmarket', name: '心意市集', defaultIcon: '🛍️', isDev: true },
  { id: 'heartcabinet', name: '心意柜', defaultIcon: '🗄️', isDev: true },
  { id: 'petroom', name: '萌宠屋', defaultIcon: '🐱', isDev: true },
  { id: 'fishwork', name: '摸鱼小计', defaultIcon: '🐟', isDev: true },
  { id: 'taphone', name: 'TA的手机', defaultIcon: '📱', isDev: true },
];

export const DesktopModule = {
  rootEl: null,
  config: null,
  isEditMode: false,
  draggingCardId: null,
  dragStartX: 0,
  dragStartY: 0,
  cardOrigX: 0,
  cardOrigY: 0,
  dragSourcePageIndex: 0,
  dragGlobalMoveHandler: null,
  dragGlobalUpHandler: null,

  init(selector) {
    this.rootEl = document.querySelector(selector);
    if (!this.rootEl) return;
    this.loadConfig();
    this.render();
    this.bindGlobalEvents();
    EventBus.on('themeChange', () => {
      this.render();
    });
  },

  enterEditMode() {
    this.isEditMode = true;
    this.render();
    Toast.show('已进入桌面编辑模式');
  },

  exitEditMode() {
    this.isEditMode = false;
    this.render();
    Toast.show('已退出编辑模式');
  },

  loadConfig() {
    const saved = Store.get(STORAGE_KEY, null);
    if (saved && saved.pages && saved.pages.length > 0) {
      this.config = saved;
    } else {
      this.config = this.getDefaultConfig();
      this.saveConfig();
    }
  },

  saveConfig() {
    Store.set(STORAGE_KEY, this.config);
  },

  // 计算页面网格居中左边距（保证左右留白对称）
  getGridMarginLeft(pageWidth) {
    const perRow = 4;
    const totalContentWidth = perRow * CARD_WIDTH + (perRow - 1) * GAP;
    const margin = Math.max(16, (pageWidth - totalContentWidth) / 2);
    return margin;
  },

  getDefaultConfig() {
    const pages = [];
    const perRow = 4;
    const perPageRow = 4;
    const perPage = perRow * perPageRow;
    let pageCards = [];
    const pageW = 375;
    const marginLeft = this.getGridMarginLeft(pageW);
    CARD_META.forEach((meta, idx) => {
      const col = idx % perRow;
      const row = Math.floor((idx % perPage) / perRow);
      const x = marginLeft + col * (CARD_WIDTH + GAP);
      const y = 16 + row * (CARD_HEIGHT + GAP + LABEL_HEIGHT);
      pageCards.push({ id: meta.id, x, y, customIcon: null });
      if(pageCards.length >= perPage) {
        pages.push({ id: Date.now() + Math.random(), widgets: [], cards: pageCards });
        pageCards = [];
      }
    })
    if(pageCards.length > 0) {
      pages.push({ id: Date.now() + Math.random(), widgets: [], cards: pageCards });
    }
    return { currentPage: 0, pages };
  },

  getCurrentPage() {
    return this.config.pages[this.config.currentPage];
  },

  getCardMeta(id) {
    return CARD_META.find(item => item.id === id);
  },

  findCard(pageIndex, cardId) {
    const page = this.config.pages[pageIndex];
    if (!page) return null;
    return page.cards.find(c => c.id === cardId);
  },

  findEmptyPosition(page) {
    const pageW = this.rootEl.clientWidth;
    const pageH = this.rootEl.clientHeight - WIDGET_AREA_HEIGHT - INDICATOR_HEIGHT;
    const marginLeft = this.getGridMarginLeft(pageW);
    const perRow = 4;
    const maxCol = perRow;
    const maxRow = Math.floor((pageH - 16) / (CARD_HEIGHT + GAP + LABEL_HEIGHT));
    for(let r=0; r<maxRow; r++){
      for(let c=0; c<maxCol; c++){
        const testX = marginLeft + c * (CARD_WIDTH + GAP);
        const testY = 16 + r * (CARD_HEIGHT + GAP + LABEL_HEIGHT);
        let occupied = false;
        for(const cd of page.cards) {
          const overlap = !(testX + CARD_WIDTH < cd.x || testX > cd.x + CARD_WIDTH || testY + CARD_HEIGHT < cd.y || testY > cd.y + CARD_HEIGHT);
          if(overlap) { occupied = true; break; }
        }
        if(!occupied) return {x: testX, y: testY};
      }
    }
    return null;
  },

  reArrangePageCards(page) {
    const perRow = 4;
    const pageW = this.rootEl.clientWidth || 375;
    const marginLeft = this.getGridMarginLeft(pageW);
    const sorted = [...page.cards].sort((a,b)=>{
      if(a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    sorted.forEach((card, idx)=>{
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      card.x = marginLeft + col * (CARD_WIDTH + GAP);
      card.y = 16 + row * (CARD_HEIGHT + GAP + LABEL_HEIGHT);
    });
    page.cards = sorted;
  },

  render() {
    if (!this.rootEl) return;
    this.rootEl.innerHTML = '';

    // 样式只插入一次，避免重复
    let styleEl = document.getElementById('desktop-module-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'desktop-module-style';
      styleEl.textContent = `
        #desktop-canvas {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .desktop-widget-area {
          height: ${WIDGET_AREA_HEIGHT}px;
          width: 100%;
          position: relative;
        }
        .desktop-pages-wrap {
          width: 100%;
          height: calc(100% - ${WIDGET_AREA_HEIGHT}px - ${INDICATOR_HEIGHT}px);
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        .desktop-pages-wrap::-webkit-scrollbar { display: none; }
        .desktop-pages-track {
          display: flex;
          height: 100%;
        }
        .desktop-page {
          position: relative;
          width: 100%;
          height: 100%;
          flex-shrink: 0;
          scroll-snap-align: start;
        }
        .desktop-page-indicator {
          height: ${INDICATOR_HEIGHT}px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .page-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-text-2);
          opacity: 0.5;
          transition: all 0.2s ease;
        }
        .page-dot.active {
          opacity: 1;
          background: var(--color-main);
          width: 18px;
          border-radius: 3px;
        }
        .desktop-item-wrap{
          position:absolute;
          display:flex;
          flex-direction:column;
          align-items:center;
        }
        .desktop-card {
          width: ${CARD_WIDTH}px;
          height: ${CARD_HEIGHT}px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius:18px;
          background: var(--color-main);
          border:1px solid color-mix(in srgb,var(--color-main) 30%,transparent);
          cursor: pointer;
          user-select: none;
          box-sizing: border-box;
          will-change: transform;
          position:relative;
        }
        .desktop-card:active { transform: scale(0.94); }
        .desktop-card.dragging {
          z-index: 999;
          opacity:0.92;
          transform: scale(1.04);
        }
        .desktop-card .card-icon {
          width:42px;
          height:42px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:26px;
          border-radius:14px;
          overflow:hidden;
          color:var(--color-text);
          -webkit-text-fill-color: var(--color-text);
        }
        .desktop-card .card-icon img{
          width:100%;
          height:100%;
          object-fit: contain;
        }
        .card-label-outside{
          font-size: 10px;
          color: var(--color-text);
          text-align:center;
          line-height:1.1;
          margin-top:4px;
          max-width:${CARD_WIDTH+8}px;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .card-del-btn {
          position:absolute;
          top:-5px;
          right:-5px;
          width:16px;
          height:16px;
          border-radius:50%;
          background:rgba(220,20,20,0.85);
          color:#fff;
          border:none;
          font-size:10px;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          pointer-events:auto !important;
        }
        .card-icon-btn{
          position:absolute;
          top:-5px;
          left:-5px;
          width:16px;
          height:16px;
          border-radius:50%;
          background:rgba(40,140,240,0.85);
          color:#fff;
          border:none;
          font-size:10px;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          pointer-events:auto !important;
        }
        .page-control-btn {
          padding: 3px 7px;
          font-size: 11px;
          border:1px solid var(--color-border);
          border-radius:5px;
          background:color-mix(in srgb, var(--color-main) 14%, transparent);
          color:var(--color-text);
          cursor:pointer;
        }
        .add-card-modal-mask {
          position:fixed;
          inset:0;
          background:rgba(0,0,0,0.42);
          z-index:10000;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .add-card-modal {
          width:82%;
          max-width:320px;
          max-height:70vh;
          background:var(--color-bg);
          border-radius:14px;
          overflow:hidden;
          display:flex;
          flex-direction:column;
        }
        .add-card-modal-header {
          padding:12px 14px;
          font-weight:bold;
          color:var(--color-text);
          border-bottom:1px solid var(--color-border);
          display:flex;
          justify-content:space-between;
          align-items:center;
        }
        .add-card-list {
          flex:1;
          overflow-y:auto;
          padding:6px;
          scrollbar-width:none;
        }
        .add-card-list::-webkit-scrollbar { display:none; }
        .add-card-item {
          display:flex;
          align-items:center;
          gap:8px;
          padding:8px 10px;
          border-radius:7px;
          cursor:pointer;
          color:var(--color-text);
        }
        .add-card-item:hover { background:rgba(0,0,0,0.045); }
        .add-card-item .icon {
          font-size:20px;
          color:var(--color-text);
          -webkit-text-fill-color: var(--color-text);
        }
        .modal-footer-bar{
          padding:9px 12px;
          border-top:1px solid var(--color-border);
          display:flex;
          gap:7px;
        }
        .exit-edit-tip {
          position:fixed;
          z-index:999;
        }
        .exit-edit-btn {
          padding:5px 12px;
          border-radius:999px;
          border:1px solid var(--color-border);
          background:color-mix(in srgb, var(--color-main) 14%, transparent);
          color:var(--color-text);
          font-size:12px;
        }
        @media (max-width:480px){
          .exit-edit-tip { bottom:86px; left:50%; transform:translateX(-50%); }
        }
        @media (min-width:481px){
          .exit-edit-tip { bottom:32px; left:50%; transform:translateX(-50%); }
        }
      `;
      document.head.appendChild(styleEl);
    }

    const canvas = document.createElement('div');
    canvas.id = 'desktop-canvas';
    const widgetArea = document.createElement('div');
    widgetArea.className = 'desktop-widget-area';
    canvas.appendChild(widgetArea);
    const pagesWrap = document.createElement('div');
    pagesWrap.className = 'desktop-pages-wrap';
    pagesWrap.id = 'desktop-pages-wrap';
    const pagesTrack = document.createElement('div');
    pagesTrack.className = 'desktop-pages-track';
    pagesTrack.id = 'desktop-pages-track';
    this.config.pages.forEach((page, idx) => {
      const pageEl = document.createElement('div');
      pageEl.className = 'desktop-page';
      pageEl.dataset.pageIndex = idx;
      pagesTrack.appendChild(pageEl);
    });
    pagesWrap.appendChild(pagesTrack);
    canvas.appendChild(pagesWrap);
    const indicator = document.createElement('div');
    indicator.className = 'desktop-page-indicator';
    indicator.id = 'desktop-page-indicator';
    canvas.appendChild(indicator);
    if(this.isEditMode) {
      const exitWrap = document.createElement('div');
      exitWrap.className = 'exit-edit-tip';
      exitWrap.innerHTML = `<button class="exit-edit-btn" id="exit-edit">完成编辑</button>`;
      canvas.appendChild(exitWrap);
    }
    this.rootEl.appendChild(canvas);
    this.renderAllCards();
    this.renderPageIndicator();
    this.bindPageScroll();

    // 渲染完成后强制滚动到当前页，彻底解决跳回第一页问题
    requestAnimationFrame(() => {
      const wrap = document.getElementById('desktop-pages-wrap');
      if (wrap) {
        wrap.scrollLeft = this.config.currentPage * wrap.clientWidth;
      }
    });

    if(this.isEditMode) {
      document.getElementById('exit-edit').onclick = ()=>this.exitEditMode();
    }
  },

  renderAllCards() {
    this.config.pages.forEach((page, pageIdx) => {
      const pageEl = document.querySelector(`.desktop-page[data-page-index="${pageIdx}"]`);
      if (!pageEl) return;
      pageEl.innerHTML = '';
      page.cards.forEach(cardData => {
        const meta = this.getCardMeta(cardData.id);
        if (!meta) return;
        const wrapEl = document.createElement('div');
        wrapEl.className = 'desktop-item-wrap';
        wrapEl.dataset.cardId = cardData.id;
        wrapEl.dataset.pageIndex = pageIdx;
        wrapEl.style.left = `${cardData.x}px`;
        wrapEl.style.top = `${cardData.y}px`;
        const cardEl = document.createElement('div');
        cardEl.className = 'desktop-card';

        let iconHtml = '';
        if(cardData.customIcon){
          iconHtml = `<div class="card-icon"><img src="${cardData.customIcon}" alt=""></div>`;
        }else{
          iconHtml = `<div class="card-icon">${meta.defaultIcon}</div>`;
        }
        cardEl.innerHTML = iconHtml;

        const labelEl = document.createElement('div');
        labelEl.className = 'card-label-outside';
        labelEl.textContent = meta.name;
        wrapEl.appendChild(cardEl);
        wrapEl.appendChild(labelEl);
        if(this.isEditMode){
          const delBtn = document.createElement('button');
          delBtn.className = 'card-del-btn';
          delBtn.textContent = '×';
          cardEl.appendChild(delBtn);
          const iconBtn = document.createElement('button');
          iconBtn.className = 'card-icon-btn';
          iconBtn.textContent = '🖼';
          iconBtn.dataset.pageIndex = pageIdx;
          iconBtn.dataset.cardId = cardData.id;
          cardEl.appendChild(iconBtn);
        }
        this.bindCardEvents(wrapEl,cardEl,labelEl,cardData, pageIdx);
        pageEl.appendChild(wrapEl);
      });
    });
  },

  renderPageIndicator() {
    const indicator = document.getElementById('desktop-page-indicator');
    if (!indicator) return;
    indicator.innerHTML = '';
    if (this.isEditMode) {
      const addBtn = document.createElement('button');
      addBtn.className = 'page-control-btn';
      addBtn.innerText = '+ 新页面';
      addBtn.onclick = () => this.addNewPage();
      indicator.appendChild(addBtn);
    }
    this.config.pages.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `page-dot ${idx === this.config.currentPage ? 'active' : ''}`;
      dot.onclick = () => this.switchPage(idx);
      indicator.appendChild(dot);
    });
    if (this.isEditMode && this.config.pages.length > 1) {
      const delBtn = document.createElement('button');
      delBtn.className = 'page-control-btn';
      delBtn.innerText = '删本页';
      delBtn.onclick = () => this.removeCurrentPage();
      indicator.appendChild(delBtn);
    }
    if (this.isEditMode) {
      const addCardBtn = document.createElement('button');
      addCardBtn.className = 'page-control-btn';
      addCardBtn.innerText = '+ 添加图标';
      addCardBtn.style.marginLeft = '6px';
      addCardBtn.onclick = () => this.showAddCardModal();
      indicator.appendChild(addCardBtn);
    }
  },

  bindCardEvents(wrapEl,cardEl,labelEl, cardData, pageIndex) {
    const cardId = cardData.id;
    wrapEl.onclick = (e) => {
      if (e.target.classList.contains('card-del-btn')) return;
      if (e.target.classList.contains('card-icon-btn')) return;
      if (!this.isEditMode) {
        this.handleCardClick(cardId);
      }
    };
    const delBtn = cardEl.querySelector('.card-del-btn');
    if (delBtn) {
      delBtn.onclick = (e) => {
        e.stopPropagation();
        this.deleteCard(pageIndex, cardId);
      };
    }

    const iconBtn = cardEl.querySelector('.card-icon-btn');
    if(iconBtn){
      iconBtn.onclick = async (e)=>{
        e.stopPropagation();
        const pi = Number(iconBtn.dataset.pageIndex);
        const cid = iconBtn.dataset.cardId;
        const cardObj = this.findCard(pi,cid);
        if(!cardObj) return;
        const fileInput = document.createElement('input');
        fileInput.type="file";
        fileInput.accept="image/*";
        fileInput.onchange = async (ev)=>{
          const file = ev.target.files[0];
          if(!file){
            fileInput.remove();
            return;
          }
          try{
            Toast.show("正在处理图片...","info");
            const base64 = await cropImageToSquare(file,256);
            cardObj.customIcon = base64;
            this.saveConfig();
            this.render();
            Toast.show("图标更换成功！","success");
          }catch(err){
            Toast.show("图片处理失败，请换一张图片","error");
            console.error(err);
          }
          fileInput.remove();
        };
        fileInput.click();
      };
      iconBtn.oncontextmenu = (e)=>{
        e.preventDefault();
        const pi = Number(iconBtn.dataset.pageIndex);
        const cid = iconBtn.dataset.cardId;
        const cardObj = this.findCard(pi,cid);
        if(!cardObj) return;
        if(!confirm("是否重置该卡片图标，恢复默认？")) return;
        cardObj.customIcon = null;
        this.saveConfig();
        this.render();
        Toast.show("已恢复默认图标","info");
      };
    }
    if (this.isEditMode) {
      this.bindDragEvents(wrapEl, cardEl, cardData, pageIndex);
    }
  },

  bindDragEvents(wrapEl, cardEl, cardData, pageIndex) {
    const self = this;
    const startDrag = (clientX, clientY) => {
      self.draggingCardId = cardData.id;
      self.dragStartX = clientX;
      self.dragStartY = clientY;
      self.cardOrigX = cardData.x;
      self.cardOrigY = cardData.y;
      self.dragSourcePageIndex = pageIndex;
      cardEl.classList.add('dragging');
      wrapEl.style.zIndex = '999';
      wrapEl.style.transform = '';
      self.dragGlobalMoveHandler = (evt)=>{
        let cx,cy;
        if(evt.touches){ cx = evt.touches[0].clientX; cy = evt.touches[0].clientY; }
        else{ cx = evt.clientX; cy = evt.clientY; }
        self.onGlobalDragMove(cx,cy,wrapEl,cardEl,cardData);
      };
      self.dragGlobalUpHandler = ()=>{
        self.onGlobalDragEnd(wrapEl,cardEl,cardData,pageIndex);
        document.removeEventListener('mousemove', self.dragGlobalMoveHandler);
        document.removeEventListener('mouseup', self.dragGlobalUpHandler);
        document.removeEventListener('touchmove', self.dragGlobalMoveHandler);
        document.removeEventListener('touchend', self.dragGlobalUpHandler);
        self.dragGlobalMoveHandler = null;
        self.dragGlobalUpHandler = null;
      };
      document.addEventListener('mousemove', self.dragGlobalMoveHandler);
      document.addEventListener('mouseup', self.dragGlobalUpHandler);
      document.addEventListener('touchmove', self.dragGlobalMoveHandler, {passive:false});
      document.addEventListener('touchend', self.dragGlobalUpHandler);
    };
    wrapEl.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
    wrapEl.addEventListener('touchstart', (e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }, { passive: true });
  },

  onGlobalDragMove(clientX, clientY, wrapEl, cardEl, cardData){
    if(this.draggingCardId === null) return;
    const dx = clientX - this.dragStartX;
    const dy = clientY - this.dragStartY;
    wrapEl.style.transform = `translate(${dx}px, ${dy}px)`;
    const wrap = document.getElementById('desktop-pages-wrap');
    if(!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if(clientX < rect.left + PAGE_SWIPE_THRESHOLD){
      if(this.config.currentPage > 0) this.switchPage(this.config.currentPage -1);
    }else if(clientX > rect.right - PAGE_SWIPE_THRESHOLD){
      if(this.config.currentPage < this.config.pages.length -1) this.switchPage(this.config.currentPage +1);
    }
  },

  onGlobalDragEnd(wrapEl, cardEl, cardData, sourcePageIndex){
    if (this.draggingCardId !== cardData.id) return;
    cardEl.classList.remove('dragging');
    wrapEl.style.zIndex = '';
    const transformStr = wrapEl.style.transform || '';
    let deltaX = 0,deltaY=0;
    const match = transformStr.match(/translate\((.+?)px,\s*(.+?)px\)/);
    if(match){ deltaX = parseFloat(match[1])||0; deltaY = parseFloat(match[2])||0; }
    const newRealX = this.cardOrigX + deltaX;
    const newRealY = this.cardOrigY + deltaY;
    const wrap = document.getElementById('desktop-pages-wrap');
    if(!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const maxX = rect.width - CARD_WIDTH;
    const maxY = rect.height - CARD_HEIGHT - LABEL_HEIGHT;
    let finalX = Math.max(0, Math.min(maxX, newRealX));
    let finalY = Math.max(0, Math.min(maxY, newRealY));

    // 优化磁吸：吸附到标准网格坐标
    const pageW = wrap.clientWidth;
    const marginLeft = this.getGridMarginLeft(pageW);
    const col = Math.round((finalX - marginLeft) / (CARD_WIDTH + GAP));
    const row = Math.round((finalY - 16) / (CARD_HEIGHT + GAP + LABEL_HEIGHT));
    const snapX = marginLeft + col * (CARD_WIDTH + GAP);
    const snapY = 16 + row * (CARD_HEIGHT + GAP + LABEL_HEIGHT);
    // 在磁吸距离内才吸附
    if (Math.abs(finalX - snapX) < SNAP_DISTANCE) finalX = snapX;
    if (Math.abs(finalY - snapY) < SNAP_DISTANCE) finalY = snapY;

    cardData.x = finalX;
    cardData.y = finalY;

    if(sourcePageIndex !== this.config.currentPage){
      const srcIdx = sourcePage.cards.findIndex(c=>c.id === cardData.id);
      if(srcIdx>-1) sourcePage.cards.splice(srcIdx,1);
      const targetPage = this.config.pages[this.config.currentPage];
      const pos = this.findEmptyPosition(targetPage);
      if(pos){
        cardData.x = pos.x;
        cardData.y = pos.y;
        targetPage.cards.push(cardData);
      }else{
        sourcePage.cards.push(cardData);
        Toast.show('目标页面已满，放回原页面');
      }
    }
    wrapEl.style.transform = '';
    this.saveConfig();
    this.render();
    Toast.show('布局已保存');
    this.draggingCardId = null;
  },

  bindPageScroll() {
    const wrap = document.getElementById('desktop-pages-wrap');
    if (!wrap) return;
    wrap.addEventListener('scroll', () => {
      const pageWidth = wrap.clientWidth;
      const scrollLeft = wrap.scrollLeft;
      const pageIndex = Math.round(scrollLeft / pageWidth);
      if (pageIndex !== this.config.currentPage && pageIndex >= 0 && pageIndex < this.config.pages.length) {
        this.config.currentPage = pageIndex;
        this.saveConfig();
        this.renderPageIndicator();
      }
    });
  },

  bindGlobalEvents() {},

  handleCardClick(cardId) {
    const meta = this.getCardMeta(cardId);
    if (!meta) return;
    if (meta.isDev) {
      Toast.show('功能开发中，敬请期待');
      return;
    }
    if (meta.type === 'tab') {
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${meta.target}"]`);
      if (tabBtn) tabBtn.click();
      if (meta.sub === 'contact') {
        setTimeout(() => { document.dispatchEvent(new CustomEvent('setting:open-contact')); }, 80);
      }
    } else if (meta.type === 'action') {
      Toast.show(`【${meta.name}】功能开发中`);
    }
  },

  deleteCard(pageIdx, cardId) {
    const page = this.config.pages[pageIdx];
    const idx = page.cards.findIndex(c => c.id === cardId);
    if (idx > -1) {
      page.cards.splice(idx, 1);
      this.reArrangePageCards(page);
      this.saveConfig();
      this.renderAllCards();
      Toast.show('已删除图标，已自动补齐布局');
    }
  },

  showAddCardModal() {
    const currentPage = this.getCurrentPage();
    const currentPageIds = currentPage.cards.map(c => c.id);
    const available = CARD_META.filter(m => !currentPageIds.includes(m.id));
    if (available.length === 0) { Toast.show('所有图标都已经在当前页面了'); return; }
    const emptyPos = this.findEmptyPosition(currentPage);
    if(!emptyPos) { Toast.show('当前页面空间已满，请新建页面或者移除部分图标'); return; }
    const mask = document.createElement('div');
    mask.className = 'add-card-modal-mask';
    mask.innerHTML = `
      <div class="add-card-modal">
        <div class="add-card-modal-header">
          <span>添加图标到桌面（可多选）</span>
          <span style="cursor:pointer;color:var(--color-text-2)" id="close-add-modal">×</span>
        </div>
        <div class="add-card-list">
          ${available.map(item => `
            <div class="add-card-item" data-id="${item.id}">
              <input type="checkbox" class="chk-item" data-id="${item.id}" />
              <span class="icon">${item.defaultIcon}</span>
              <span>${item.name}</span>
              ${item.isDev ? '<span style="font-size:11px;color:var(--color-text-2);margin-left:auto">开发中</span>' : ''}
            </div>
          `).join('')}
        </div>
        <div class="modal-footer-bar">
          <button id="batch-add-btn" style="flex:1;padding:7px;border-radius:6px;background:var(--color-main);color:#fff;border:none">批量添加选中</button>
        </div>
      </div>
    `;
    document.body.appendChild(mask);
    mask.querySelector('#close-add-modal').onclick = () => mask.remove();
    mask.onclick = (e) => { if (e.target === mask) mask.remove(); };
    mask.querySelector('#batch-add-btn').onclick = ()=>{
      const checkedInputs = mask.querySelectorAll('.chk-item:checked');
      if(!checkedInputs.length){ Toast.show('请勾选至少一个图标'); return; }
      const ids = Array.from(checkedInputs).map(el=>el.dataset.id);
      this.batchAddCardsToPage(ids);
      mask.remove();
    };
  },

  batchAddCardsToPage(idList){
    const page = this.getCurrentPage();
    for(const cardId of idList){
      const pos = this.findEmptyPosition(page);
      if(!pos){ Toast.show('页面剩余空间不足，部分图标未添加'); break; }
      page.cards.push({ id: cardId, x: pos.x, y: pos.y, customIcon: null });
    }
    this.saveConfig();
    this.render();
    Toast.show(`成功添加${idList.length}个图标`);
  },

  switchPage(index) {
    const wrap = document.getElementById('desktop-pages-wrap');
    if (!wrap) return;
    wrap.scrollTo({ left: index * wrap.clientWidth, behavior: 'smooth' });
  },

  addNewPage() {
    const newPageId = Date.now();
    this.config.pages.push({ id: newPageId, widgets: [], cards: [] });
    this.saveConfig();
    this.render();
    setTimeout(() => { this.switchPage(this.config.pages.length - 1); }, 40);
    Toast.show('已新增桌面页');
  },

  removeCurrentPage() {
    if (this.config.pages.length <= 1) { Toast.show('至少保留一个桌面页'); return; }
    if (!confirm('确定删除当前桌面页？页面内图标全部移除')) return;
    this.config.pages.splice(this.config.currentPage, 1);
    this.config.currentPage = Math.max(0, this.config.currentPage - 1);
    this.saveConfig();
    this.render();
    Toast.show('已删除桌面页');
  }
};
window.DesktopModule = DesktopModule;
