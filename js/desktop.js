import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

// ========== 常量配置（卡片尺寸缩小，简约UI） ==========
const STORAGE_KEY = 'desktop-layout';
const CARD_WIDTH = 62;
const CARD_HEIGHT = 78;
const WIDGET_AREA_HEIGHT = 110;
const INDICATOR_HEIGHT = 30;
const GAP = 14;
const SNAP_DISTANCE = 10;
const PAGE_SWIPE_THRESHOLD = 60;

// ========== 36个功能卡片元数据【名称+emoji已修改】 ==========
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

  // ===== 开发中 28个【改名：存钱罐→扑满；记账→账簿；寻味抉择→寻味；扑满emoji改为🫙】 =====
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
  { id: 'pomodoro', name: '番茄钟', defaultIcon: '🍅', isDev: true },
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
  // 拖拽状态
  draggingCardId: null,
  dragStartX: 0,
  dragStartY: 0,
  cardOrigX: 0,
  cardOrigY: 0,
  dragSourcePageIndex: 0,
  _uploadTargetCardId: null,
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

  // ========== 配置读写 ==========
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

  getDefaultConfig() {
    const pages = [];
    const perRow = 4;
    const perPageRow = 4;
    const perPage = perRow * perPageRow;
    let pageCards = [];

    CARD_META.forEach((meta, idx) => {
      const col = idx % perRow;
      const row = Math.floor((idx % perPage) / perRow);
      const x = 16 + col * (CARD_WIDTH + GAP);
      const y = 16 + row * (CARD_HEIGHT + GAP);
      pageCards.push({
        id: meta.id,
        x,
        y,
        customIcon: ''
      });
      if(pageCards.length >= perPage) {
        pages.push({
          id: Date.now() + Math.random(),
          widgets: [],
          cards: pageCards
        })
        pageCards = [];
      }
    })
    if(pageCards.length > 0) {
      pages.push({
        id: Date.now() + Math.random(),
        widgets: [],
        cards: pageCards
      })
    }
    return {
      currentPage: 0,
      pages
    };
  },

  getCurrentPage() {
    return this.config.pages[this.config.currentPage];
  },

  getCardMeta(id) {
    return CARD_META.find(item => item.id === id);
  },

  // 寻找页面中空位，返回坐标，无空位返回null
  findEmptyPosition(page) {
    const pageW = this.rootEl.clientWidth;
    const pageH = this.rootEl.clientHeight - WIDGET_AREA_HEIGHT - INDICATOR_HEIGHT;
    const maxCol = Math.floor((pageW - 16) / (CARD_WIDTH + GAP));
    const maxRow = Math.floor((pageH - 16) / (CARD_HEIGHT + GAP));

    for(let r=0; r<maxRow; r++){
      for(let c=0; c<maxCol; c++){
        const testX = 16 + c * (CARD_WIDTH + GAP);
        const testY = 16 + r * (CARD_HEIGHT + GAP);
        let occupied = false;
        for(const cd of page.cards) {
          const overlap = !(testX + CARD_WIDTH < cd.x || testX > cd.x + CARD_WIDTH || testY + CARD_HEIGHT < cd.y || testY > cd.y + CARD_HEIGHT)
          if(overlap) { occupied = true; break; }
        }
        if(!occupied) return {x: testX, y: testY};
      }
    }
    return null;
  },

  /** 删除卡片之后网格补齐重排 */
  reArrangePageCards(page) {
    const perRow = 4;
    const sorted = [...page.cards].sort((a,b)=>{
      if(a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    sorted.forEach((card, idx)=>{
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      card.x = 16 + col * (CARD_WIDTH + GAP);
      card.y = 16 + row * (CARD_HEIGHT + GAP);
    });
    page.cards = sorted;
  },

  // ========== 主渲染【渲染前保存滚动位置，渲染完成恢复，修复删图标自动跳第一页BUG】 ==========
  render() {
    if (!this.rootEl) return;
    // 注意：这里取旧容器只用于保存滚动位置，变量名避开下面新建的 pagesWrap，避免重复声明报错白屏
    const oldWrap = document.getElementById('desktop-pages-wrap');
    let restoreScrollLeft = 0;
    if(oldWrap){
      restoreScrollLeft = oldWrap.scrollLeft;
    }

    this.rootEl.innerHTML = '';

    // 注入全局样式：卡片底色使用主色调半透明毛玻璃；简约UI；电脑端完成编辑按钮位置适配
    const styleEl = document.createElement('style');
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
      /* 简约卡片：底色取自主色调半透明毛玻璃 */
      .desktop-card {
        position: absolute;
        width: ${CARD_WIDTH}px;
        height: ${CARD_HEIGHT}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap:4px;
        border-radius:12px;
        background: color-mix(in srgb, var(--color-main) 16%, transparent);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid color-mix(in srgb, var(--color-main) 22%, transparent);
        cursor: pointer;
        user-select: none;
        box-sizing: border-box;
        will-change: transform;
      }
      .desktop-card:active { transform: scale(0.94); }
      .desktop-card.dragging {
        z-index: 999;
        opacity:0.92;
        transform: scale(1.04);
      }
      .desktop-card .card-icon {
        width:34px;
        height:34px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:24px;
        border-radius:8px;
        overflow:hidden;
      }
      .desktop-card .card-icon img {
        width:100%;
        height:100%;
        object-fit:cover;
      }
      .desktop-card .card-label {
        font-size: 11px;
        color: var(--color-text);
        text-align:center;
        line-height:1.1;
        padding:0 2px;
      }
      .card-del-btn {
        position:absolute;
        top:-5px;
        right:-5px;
        width:17px;
        height:17px;
        border-radius:50%;
        background:rgba(220,20,20,0.85);
        color:#fff;
        border:none;
        font-size:11px;
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
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
      .add-card-item .icon { font-size:20px; }
      #icon-upload-input { display:none; }
      .modal-footer-bar{
        padding:9px 12px;
        border-top:1px solid var(--color-border);
        display:flex;
        gap:7px;
      }
      /* 完成编辑按钮：手机端、电脑端位置区分 */
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
      /* 手机 */
      @media (max-width:480px){
        .exit-edit-tip {
          bottom:86px;
          left:50%;
          transform:translateX(-50%);
        }
      }
      /* PC大屏 */
      @media (min-width:481px){
        .exit-edit-tip {
          bottom:24px;
          left:50%;
          transform:translateX(-50%);
        }
      }
      /* 卡片操作小弹窗：更换图标菜单 */
      .card-op-mask{
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.35);
        z-index:10002;
        display:flex;
        align-items:center;
        justify-content:center;
      }
      .card-op-panel{
        width:72%;
        max-width:260px;
        background:var(--color-bg);
        border-radius:12px;
        overflow:hidden;
      }
      .card-op-btn{
        width:100%;
        padding:11px;
        border:none;
        background:transparent;
        color:var(--color-text);
        border-bottom:1px solid var(--color-border);
        font-size:14px;
      }
      .card-op-btn:last-child{ border-bottom:none; }
    `;
    document.head.appendChild(styleEl);

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

    const uploadInput = document.createElement('input');
    uploadInput.type = 'file';
    uploadInput.accept = 'image/*';
    uploadInput.id = 'icon-upload-input';
    canvas.appendChild(uploadInput);

    if(this.isEditMode) {
      const exitWrap = document.createElement('div');
      exitWrap.className = 'exit-edit-tip';
      exitWrap.innerHTML = `<button class="exit-edit-btn" id="exit-edit">完成编辑</button>`
      canvas.appendChild(exitWrap);
    }

    this.rootEl.appendChild(canvas);

    this.renderAllCards();
    this.renderPageIndicator();
    this.bindPageScroll();

    // 渲染结束恢复原来滚动位置，不会自动跳到第0页
    const wrapAfter = document.getElementById('desktop-pages-wrap');
    if(wrapAfter){
      wrapAfter.scrollLeft = restoreScrollLeft;
    }

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

        const cardEl = document.createElement('div');
        cardEl.className = 'desktop-card';
        cardEl.dataset.cardId = cardData.id;
        cardEl.dataset.pageIndex = pageIdx;
        cardEl.style.left = `${cardData.x}px`;
        cardEl.style.top = `${cardData.y}px`;

        const iconHtml = cardData.customIcon
          ? `<img src="${cardData.customIcon}" alt="${meta.name}">`
          : meta.defaultIcon;

        cardEl.innerHTML = `
          <div class="card-icon">${iconHtml}</div>
          <div class="card-label">${meta.name}</div>
          ${this.isEditMode ? '<button class="card-del-btn">×</button>' : ''}
        `;

        this.bindCardEvents(cardEl, cardData, pageIdx);
        pageEl.appendChild(cardEl);
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

  bindCardEvents(cardEl, cardData, pageIndex) {
    const cardId = cardData.id;
    cardEl.onclick = (e) => {
      if (e.target.classList.contains('card-del-btn')) return;
      if (this.isEditMode) {
        this.openCardOperateMenu(cardId);
      } else {
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

    if (this.isEditMode) {
      this.bindDragEvents(cardEl, cardData, pageIndex);
    }
  },

  /** 【修复拖拽卡顿】使用transform做GPU加速拖拽；只在拖拽结束回写left/top真实布局 */
  bindDragEvents(cardEl, cardData, pageIndex) {
    const self = this;
    const startDrag = (clientX, clientY) => {
      self.draggingCardId = cardData.id;
      self.dragStartX = clientX;
      self.dragStartY = clientY;
      self.cardOrigX = cardData.x;
      self.cardOrigY = cardData.y;
      self.dragSourcePageIndex = pageIndex;
      cardEl.classList.add('dragging');
      cardEl.style.transform = '';

      self.dragGlobalMoveHandler = (evt)=>{
        let cx,cy;
        if(evt.touches){
          cx = evt.touches[0].clientX;
          cy = evt.touches[0].clientY;
        }else{
          cx = evt.clientX;
          cy = evt.clientY;
        }
        self.onGlobalDragMove(cx,cy,cardEl);
      };

      self.dragGlobalUpHandler = ()=>{
        self.onGlobalDragEnd(cardEl,cardData,pageIndex);
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

    cardEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    });
    cardEl.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    }, { passive: true });
  },

  onGlobalDragMove(clientX, clientY, cardEl){
    if(this.draggingCardId === null) return;
    const dx = clientX - this.dragStartX;
    const dy = clientY - this.dragStartY;
    // 使用transform，GPU加速，不重排布局，大幅改善跟手
    cardEl.style.transform = `translate(${dx}px, ${dy}px)`;

    // 边缘跨页检测
    const wrap = document.getElementById('desktop-pages-wrap');
    if(!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if(clientX < rect.left + PAGE_SWIPE_THRESHOLD){
      if(this.config.currentPage > 0){
        this.switchPage(this.config.currentPage -1);
      }
    }else if(clientX > rect.right - PAGE_SWIPE_THRESHOLD){
      if(this.config.currentPage < this.config.pages.length -1){
        this.switchPage(this.config.currentPage +1);
      }
    }
  },

  /** 拖拽松手：把transform偏移量回写到真实x/y坐标，清除transform，保存数据 */
  onGlobalDragEnd(cardEl, cardData, sourcePageIndex){
    if (this.draggingCardId !== cardData.id) return;
    cardEl.classList.remove('dragging');

    // 解析transform translate偏移
    const transformStr = cardEl.style.transform || '';
    let deltaX = 0;
    let deltaY =0;
    const match = transformStr.match(/translate\((.+?)px,\s*(.+?)px\)/);
    if(match){
      deltaX = parseFloat(match[1])||0;
      deltaY = parseFloat(match[2])||0;
    }

    let finalX = this.cardOrigX + deltaX;
    let finalY = this.cardOrigY + deltaY;

    const wrap = document.getElementById('desktop-pages-wrap');
    const rect = wrap ? wrap.getBoundingClientRect() : { width: 375, height: 500 };
    const maxX = Math.max(0, rect.width - CARD_WIDTH);
    const maxY = Math.max(0, rect.height - CARD_HEIGHT);

    // 磁吸对齐：先在同页其余卡片上吸附，再做边界限制
    const sourcePage = this.config.pages[sourcePageIndex];
    const others = sourcePage.cards.filter(c=>c.id !== cardData.id);
    for(const c of others){
      if(Math.abs(finalX - c.x) < SNAP_DISTANCE) finalX = c.x;
      if(Math.abs(finalY - c.y) < SNAP_DISTANCE) finalY = c.y;
    }

    finalX = Math.max(0, Math.min(maxX, finalX));
    finalY = Math.max(0, Math.min(maxY, finalY));

    // 判断是否跨页
    if(sourcePageIndex !== this.config.currentPage){
      // 源页面移除卡片
      const srcIdx = sourcePage.cards.findIndex(c=>c.id === cardData.id);
      if(srcIdx>-1) sourcePage.cards.splice(srcIdx,1);
      const targetPage = this.config.pages[this.config.currentPage];
      const pos = this.findEmptyPosition(targetPage);
      if(pos){
        cardData.x = pos.x;
        cardData.y = pos.y;
        targetPage.cards.push(cardData);
      }else{
        cardData.x = this.cardOrigX;
        cardData.y = this.cardOrigY;
        sourcePage.cards.push(cardData);
        Toast.show('目标页面已满，放回原页面');
      }
    }else{
      cardData.x = finalX;
      cardData.y = finalY;
    }

    cardEl.style.transform = '';
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

  bindGlobalEvents() {
    const uploadInput = document.getElementById('icon-upload-input');
    if (uploadInput) {
      uploadInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          Toast.show('仅支持图片格式');
          uploadInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result;
          const cardId = this._uploadTargetCardId;
          if (!cardId) { uploadInput.value=''; return; }
          const page = this.getCurrentPage();
          const card = page.cards.find(c => c.id === cardId);
          if (card) {
            card.customIcon = base64;
            this.saveConfig();
            this.renderAllCards();
            Toast.show('图标更换成功');
          }
          this._uploadTargetCardId = null;
          uploadInput.value = '';
        };
        reader.onerror = ()=>{
          Toast.show('图片读取失败，请重试');
          this._uploadTargetCardId = null;
          uploadInput.value = '';
        };
        reader.readAsDataURL(file);
      };
    }
  },

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
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('setting:open-contact'));
        }, 80);
      }
    } else if (meta.type === 'action') {
      Toast.show(`【${meta.name}】功能开发中`);
    }
  },

  /** 替换confirm弹窗，改用内部小操作面板，修复点击上传图片无响应 */
  openCardOperateMenu(cardId) {
    const mask = document.createElement('div');
    mask.className = 'card-op-mask';
    mask.innerHTML = `
      <div class="card-op-panel">
        <button class="card-op-btn" id="op-change-icon">更换图标</button>
        <button class="card-op-btn" id="op-cancel">取消</button>
      </div>
    `;
    document.body.appendChild(mask);
    mask.querySelector('#op-change-icon').onclick = ()=>{
      mask.remove();
      this._uploadTargetCardId = cardId;
      document.getElementById('icon-upload-input').click();
    };
    mask.querySelector('#op-cancel').onclick = ()=>{
      mask.remove();
    };
    mask.onclick = (e)=>{
      if(e.target === mask) mask.remove();
    };
  },

  deleteCard(pageIdx, cardId) {
    const page = this.config.pages[pageIdx];
    const idx = page.cards.findIndex(c => c.id === cardId);
    if (idx > -1) {
      page.cards.splice(idx, 1);
      this.reArrangePageCards(page);
      this.saveConfig();
      this.renderAllCards();
      Toast.show('已删除图标，已补齐布局');
    }
  },

  showAddCardModal() {
    const currentPage = this.getCurrentPage();
    const currentPageIds = currentPage.cards.map(c => c.id);
    const available = CARD_META.filter(m => !currentPageIds.includes(m.id));
    if (available.length === 0) {
      Toast.show('所有图标都已经在当前页面了');
      return;
    }
    const emptyPos = this.findEmptyPosition(currentPage);
    if(!emptyPos) {
      Toast.show('当前页面空间已满，请新建页面或者移除部分图标');
      return;
    }

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
      if(!checkedInputs.length){
        Toast.show('请勾选至少一个图标');
        return;
      }
      const ids = Array.from(checkedInputs).map(el=>el.dataset.id);
      this.batchAddCardsToPage(ids);
      mask.remove();
    };
  },

  batchAddCardsToPage(idList){
    const page = this.getCurrentPage();
    for(const cardId of idList){
      const pos = this.findEmptyPosition(page);
      if(!pos){
        Toast.show('页面剩余空间不足，部分图标未添加');
        break;
      }
      page.cards.push({
        id: cardId,
        x: pos.x,
        y: pos.y,
        customIcon: ''
      });
    }
    this.saveConfig();
    this.renderAllCards();
    Toast.show(`成功添加${idList.length}个图标`);
  },

  switchPage(index) {
    const wrap = document.getElementById('desktop-pages-wrap');
    if (!wrap) return;
    wrap.scrollTo({
      left: index * wrap.clientWidth,
      behavior: 'smooth'
    });
  },

  addNewPage() {
    const newPageId = Date.now();
    this.config.pages.push({
      id: newPageId,
      widgets: [],
      cards: []
    });
    this.saveConfig();
    this.render();
    setTimeout(() => {
      this.switchPage(this.config.pages.length - 1);
    }, 40);
    Toast.show('已新增桌面页');
  },

  removeCurrentPage() {
    if (this.config.pages.length <= 1) {
      Toast.show('至少保留一个桌面页');
      return;
    }
    if (!confirm('确定删除当前桌面页？页面内图标全部移除')) return;

    this.config.pages.splice(this.config.currentPage, 1);
    this.config.currentPage = Math.max(0, this.config.currentPage - 1);
    this.saveConfig();
    this.render();
    Toast.show('已删除桌面页');
  }
};

// 暴露全局，setting.js调用入口
window.DesktopModule = DesktopModule;
