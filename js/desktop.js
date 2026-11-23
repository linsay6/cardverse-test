import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

// ========== 常量配置 ==========
const STORAGE_KEY = 'desktop-layout';
const CARD_WIDTH = 70;
const CARD_HEIGHT = 88;
const WIDGET_AREA_HEIGHT = 120;
const INDICATOR_HEIGHT = 30;
const GAP = 16;
const SNAP_DISTANCE = 12;
const PAGE_SWIPE_THRESHOLD = 60; // 拖拽距离屏幕边缘多少px触发翻页

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
  { id: 'pomodoro', name: '番茄钟', defaultIcon: '🍅', isDev: true },
  { id: 'piggybank', name: '存钱罐', defaultIcon: '🐷', isDev: true },
  { id: 'account', name: '记账', defaultIcon: '💰', isDev: true },
  { id: 'water', name: '饮水', defaultIcon: '💧', isDev: true },
  { id: 'foodchoice', name: '寻味抉择', defaultIcon: '🍜', isDev: true },
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

  // 自动排布全部36图标到多页
  getDefaultConfig() {
    const pages = [];
    const perRow = 4;
    const perPageRow = 4;
    const perPage = perRow * perPageRow;
    let pageCards = [];

    CARD_META.forEach((meta, idx) => {
      const col = idx % perRow;
      const row = Math.floor((idx % perPage) / perRow);
      const x = 20 + col * (CARD_WIDTH + GAP);
      const y = 20 + row * (CARD_HEIGHT + GAP);
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
    const maxCol = Math.floor((pageW - 20) / (CARD_WIDTH + GAP));
    const maxRow = Math.floor((pageH - 20) / (CARD_HEIGHT + GAP));

    for(let r=0; r<maxRow; r++){
      for(let c=0; c<maxCol; c++){
        const testX = 20 + c * (CARD_WIDTH + GAP);
        const testY = 20 + r * (CARD_HEIGHT + GAP);
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

  /** 网格补齐重排算法：删除卡片之后，剩余卡片按网格重新摆放，消除空位 */
  reArrangePageCards(page) {
    const perRow = 4;
    const newList = [];
    // 简单按y再x排序
    const sorted = [...page.cards].sort((a,b)=>{
      if(a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    sorted.forEach((card, idx)=>{
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      card.x = 20 + col * (CARD_WIDTH + GAP);
      card.y = 20 + row * (CARD_HEIGHT + GAP);
      newList.push(card);
    });
    page.cards = newList;
  },

  // ========== 主渲染 ==========
  render() {
    if (!this.rootEl) return;
    this.rootEl.innerHTML = '';

    // 注入全局样式
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
      .desktop-card {
        position: absolute;
        width: ${CARD_WIDTH}px;
        height: ${CARD_HEIGHT}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border-radius: 16px;
        background: var(--color-bg-card, rgba(255, 255, 255, 0.25));
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid var(--color-border);
        cursor: pointer;
        user-select: none;
        transition: transform 0.15s ease;
        box-sizing: border-box;
      }
      .desktop-card:active { transform: scale(0.95); }
      .desktop-card.dragging {
        z-index: 999;
        opacity: 0.9;
        transform: scale(1.05);
      }
      .desktop-card .card-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        border-radius: 10px;
        overflow: hidden;
      }
      .desktop-card .card-icon img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .desktop-card .card-label {
        font-size: 12px;
        color: var(--color-text);
        text-align: center;
        line-height: 1.2;
        padding: 0 4px;
      }
      .card-del-btn {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: rgba(220,30,30,0.85);
        color: #fff;
        border: none;
        font-size: 12px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .page-control-btn {
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid var(--color-border);
        border-radius: 6px;
        background: var(--color-bg-card, rgba(255,255,255,0.3));
        color: var(--color-text);
        cursor: pointer;
      }
      .add-card-modal-mask {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .add-card-modal {
        width: 85%;
        max-width: 340px;
        max-height: 70vh;
        background: var(--color-bg);
        border-radius: 14px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .add-card-modal-header {
        padding: 14px 16px;
        font-weight: bold;
        color: var(--color-text);
        border-bottom: 1px solid var(--color-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .add-card-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        scrollbar-width: none;
      }
      .add-card-list::-webkit-scrollbar { display: none; }
      .add-card-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        color: var(--color-text);
      }
      .add-card-item:hover { background: rgba(0,0,0,0.05); }
      .add-card-item .icon { font-size: 22px; }
      #icon-upload-input { display: none; }
      .exit-edit-tip {
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999;
      }
      .exit-edit-btn {
        padding: 6px 14px;
        border-radius: 999px;
        border:1px solid var(--color-border);
        background: var(--color-bg-card);
        color: var(--color-text);
      }
      .modal-footer-bar{
        padding:10px 12px;border-top:1px solid var(--color-border);display:flex;gap:8px;
      }
    `;
    document.head.appendChild(styleEl);

    // 主容器
    const canvas = document.createElement('div');
    canvas.id = 'desktop-canvas';

    // 小组件预留区域
    const widgetArea = document.createElement('div');
    widgetArea.className = 'desktop-widget-area';
    canvas.appendChild(widgetArea);

    // 卡片分页容器
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

    // 分页指示器
    const indicator = document.createElement('div');
    indicator.className = 'desktop-page-indicator';
    indicator.id = 'desktop-page-indicator';
    canvas.appendChild(indicator);

    // 隐藏的上传文件输入
    const uploadInput = document.createElement('input');
    uploadInput.type = 'file';
    uploadInput.accept = 'image/*';
    uploadInput.id = 'icon-upload-input';
    canvas.appendChild(uploadInput);

    // 编辑模式底部退出按钮【位置上移 bottom:90px，避开分页按钮】
    if(this.isEditMode) {
      const exitWrap = document.createElement('div');
      exitWrap.className = 'exit-edit-tip';
      exitWrap.innerHTML = `<button class="exit-edit-btn" id="exit-edit">完成编辑</button>`
      canvas.appendChild(exitWrap);
    }

    this.rootEl.appendChild(canvas);

    // 渲染卡片、指示器
    this.renderAllCards();
    this.renderPageIndicator();
    this.bindPageScroll();
    if(this.isEditMode) {
      document.getElementById('exit-edit').onclick = ()=>this.exitEditMode();
    }
  },

  // ========== 卡片渲染 ==========
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
      addCardBtn.style.marginLeft = '8px';
      addCardBtn.onclick = () => this.showAddCardModal();
      indicator.appendChild(addCardBtn);
    }
  },

  // ========== 事件绑定 ==========
  bindCardEvents(cardEl, cardData, pageIndex) {
    const cardId = cardData.id;

    cardEl.onclick = (e) => {
      if (e.target.classList.contains('card-del-btn')) return;
      if (this.isEditMode) {
        this.openCardMenu(cardId, cardEl);
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

      // 全局监听move / up，修复拖拽失效
      self.dragGlobalMoveHandler = (evt)=>{
        let cx,cy;
        if(evt.touches){
          cx = evt.touches[0].clientX;
          cy = evt.touches[0].clientY;
        }else{
          cx = evt.clientX;
          cy = evt.clientY;
        }
        self.onGlobalDragMove(cx,cy,cardEl,cardData,pageIndex);
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

  /** 全局拖拽移动处理，实现边缘跨页翻页 */
  onGlobalDragMove(clientX, clientY, cardEl, cardData, pageIndex){
    if(this.draggingCardId !== cardData.id) return;
    const dx = clientX - this.dragStartX;
    const dy = clientY - this.dragStartY;

    const wrap = document.getElementById('desktop-pages-wrap');
    const rect = wrap.getBoundingClientRect();
    const maxX = rect.width - CARD_WIDTH;
    const maxY = rect.height - CARD_HEIGHT;
    let newX = Math.max(0, Math.min(maxX, this.cardOrigX + dx));
    let newY = Math.max(0, Math.min(maxY, this.cardOrigY + dy));

    // 磁吸对齐
    const allCards = this.config.pages[pageIndex].cards.filter(c=>c.id!==cardData.id);
    for(const c of allCards) {
      if(Math.abs(newX - c.x) < SNAP_DISTANCE) newX = c.x;
      if(Math.abs(newY - c.y) < SNAP_DISTANCE) newY = c.y;
      if(Math.abs((newX + CARD_WIDTH) - (c.x + CARD_WIDTH)) < SNAP_DISTANCE) newX = c.x;
      if(Math.abs((newY + CARD_HEIGHT) - (c.y + CARD_HEIGHT)) < SNAP_DISTANCE) newY = c.y;
    }

    cardEl.style.left = `${newX}px`;
    cardEl.style.top = `${newY}px`;

    // 拖拽到屏幕左右边缘，自动切换分页，实现跨页拖拽
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

  onGlobalDragEnd(cardEl, cardData, sourcePageIndex){
    if (this.draggingCardId !== cardData.id) return;
    cardEl.classList.remove('dragging');

    const sourcePage = this.config.pages[sourcePageIndex];
    const targetPage = this.config.pages[this.config.currentPage];

    // 判断拖拽结束后，是否跨页：源页面 !== 当前页面
    if(sourcePageIndex !== this.config.currentPage){
      // 从源页面删除卡片
      const srcIdx = sourcePage.cards.findIndex(c=>c.id === cardData.id);
      if(srcIdx>-1) sourcePage.cards.splice(srcIdx,1);
      // 目标页面找空位
      const pos = this.findEmptyPosition(targetPage);
      if(pos){
        cardData.x = pos.x;
        cardData.y = pos.y;
        targetPage.cards.push(cardData);
      }else{
        // 目标页面满，放回原页面
        cardData.x = this.cardOrigX;
        cardData.y = this.cardOrigY;
        sourcePage.cards.push(cardData);
        Toast.show('目标页面空间已满，放回原页面');
      }
    }else{
      // 同一页面拖拽，更新坐标
      const target = sourcePage.cards.find(c => c.id === cardData.id);
      if (target) {
        target.x = parseInt(cardEl.style.left);
        target.y = parseInt(cardEl.style.top);
      }
    }
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
        // 修复上一版致命bug：FileReader不能用Promise包装，改用原生onload
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

  // ========== 业务逻辑 ==========
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

  openCardMenu(cardId) {
    if (confirm('是否更换该图标？')) {
      this._uploadTargetCardId = cardId;
      document.getElementById('icon-upload-input').click();
    }
  },

  /** 删除卡片，删除后自动补齐网格空位 */
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

  /** 新增弹窗：支持批量勾选多个图标添加 */
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
              <input type="checkbox" class="chk-item" data-id="${item.id}"/>
              <span class="icon">${item.defaultIcon}</span>
              <span>${item.name}</span>
              ${item.isDev ? '<span style="font-size:11px;color:var(--color-text-2);margin-left:auto">开发中</span>' : ''}
            </div>
          `).join('')}
        </div>
        <div class="modal-footer-bar">
          <button id="batch-add-btn" style="flex:1;padding:8px;border-radius:6px;background:var(--color-main);color:#fff;border:none">批量添加选中</button>
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

  /** 批量添加多个图标，自动寻找空位摆放 */
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
    }, 50);
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

// 暴露到全局，setting.js可以调用
window.DesktopModule = DesktopModule;
