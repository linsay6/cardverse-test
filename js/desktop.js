import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

// ========== 常量配置 ==========
const STORAGE_KEY = 'desktop-layout';
const CARD_WIDTH = 70;
const CARD_HEIGHT = 88;
const WIDGET_AREA_HEIGHT = 120;
const INDICATOR_HEIGHT = 30;

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

  init(selector) {
    this.rootEl = document.querySelector(selector);
    if (!this.rootEl) return;

    this.loadConfig();
    this.render();
    this.bindGlobalEvents();

    // 监听主题变化自动适配（CSS变量驱动，无需重渲染，此处预留扩展）
    EventBus.on('themeChange', () => {
      // 样式已通过CSS变量自动同步，无需额外操作
    });
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
    // 默认第一页放置8个核心功能，2行4列布局
    const defaultCards = [
      { id: 'chat', x: 24, y: 140, customIcon: '' },
      { id: 'card', x: 116, y: 140, customIcon: '' },
      { id: 'contact', x: 208, y: 140, customIcon: '' },
      { id: 'treehole', x: 300, y: 140, customIcon: '' },
      { id: 'tarot', x: 24, y: 250, customIcon: '' },
      { id: 'house', x: 116, y: 250, customIcon: '' },
      { id: 'audit', x: 208, y: 250, customIcon: '' },
      { id: 'setting', x: 300, y: 250, customIcon: '' },
    ];

    return {
      currentPage: 0,
      pages: [
        {
          id: 0,
          widgets: [], // 小组件预留
          cards: defaultCards
        }
      ]
    };
  },

  getCurrentPage() {
    return this.config.pages[this.config.currentPage];
  },

  getCardMeta(id) {
    return CARD_META.find(item => item.id === id);
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
        background: rgba(255, 255, 255, 0.25);
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
        z-index: 99;
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
      .card-hide-btn {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: rgba(0,0,0,0.65);
        color: #fff;
        border: none;
        font-size: 12px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .desktop-edit-bar {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 10;
        display: flex;
        gap: 8px;
      }
      .edit-mode-btn {
        padding: 5px 12px;
        border: 1px solid var(--color-border);
        border-radius: 999px;
        background: rgba(255,255,255,0.3);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: var(--color-text);
        font-size: 12px;
        cursor: pointer;
      }
      .page-control-btn {
        padding: 4px 8px;
        font-size: 12px;
        border: 1px solid var(--color-border);
        border-radius: 6px;
        background: rgba(255,255,255,0.3);
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
      }
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
    `;
    document.head.appendChild(styleEl);

    // 主容器
    const canvas = document.createElement('div');
    canvas.id = 'desktop-canvas';

    // 编辑栏
    const editBar = document.createElement('div');
    editBar.className = 'desktop-edit-bar';
    editBar.innerHTML = `
      <button class="edit-mode-btn" id="toggle-edit-btn">
        ${this.isEditMode ? '完成' : '编辑'}
      </button>
    `;
    canvas.appendChild(editBar);

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

    // 渲染每一页
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

    this.rootEl.appendChild(canvas);

    // 渲染卡片、指示器
    this.renderAllCards();
    this.renderPageIndicator();
    this.bindPageScroll();
    this.bindEditButton();
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
        cardEl.style.left = `${cardData.x}px`;
        cardEl.style.top = `${cardData.y}px`;

        const iconHtml = cardData.customIcon
          ? `<img src="${cardData.customIcon}" alt="${meta.name}">`
          : meta.defaultIcon;

        cardEl.innerHTML = `
          <div class="card-icon">${iconHtml}</div>
          <div class="card-label">${meta.name}</div>
          ${this.isEditMode ? '<button class="card-hide-btn">×</button>' : ''}
        `;

        this.bindCardEvents(cardEl, cardData);
        pageEl.appendChild(cardEl);
      });
    });
  },

  renderPageIndicator() {
    const indicator = document.getElementById('desktop-page-indicator');
    if (!indicator) return;
    indicator.innerHTML = '';

    // 编辑模式显示增删页面按钮
    if (this.isEditMode) {
      const addBtn = document.createElement('button');
      addBtn.className = 'page-control-btn';
      addBtn.innerText = '+ 新页面';
      addBtn.onclick = () => this.addNewPage();
      indicator.appendChild(addBtn);
    }

    // 圆点
    this.config.pages.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `page-dot ${idx === this.config.currentPage ? 'active' : ''}`;
      dot.onclick = () => this.switchPage(idx);
      indicator.appendChild(dot);
    });

    // 编辑模式显示删除页面按钮
    if (this.isEditMode && this.config.pages.length > 1) {
      const delBtn = document.createElement('button');
      delBtn.className = 'page-control-btn';
      delBtn.innerText = '删本页';
      delBtn.onclick = () => this.removeCurrentPage();
      indicator.appendChild(delBtn);
    }

    // 编辑模式显示添加图标按钮
    if (this.isEditMode) {
      const addCardBtn = document.createElement('button');
      addCardBtn.className = 'page-control-btn';
      addCardBtn.innerText = '+ 图标';
      addCardBtn.style.marginLeft = '8px';
      addCardBtn.onclick = () => this.showAddCardModal();
      indicator.appendChild(addCardBtn);
    }
  },

  // ========== 事件绑定 ==========
  bindCardEvents(cardEl, cardData) {
    const cardId = cardData.id;

    // 点击事件
    cardEl.onclick = (e) => {
      if (e.target.classList.contains('card-hide-btn')) return;
      if (this.isEditMode) {
        // 编辑模式：弹出操作菜单
        this.openCardMenu(cardId, cardEl);
      } else {
        // 正常模式：执行跳转或提示
        this.handleCardClick(cardId);
      }
    };

    // 隐藏按钮
    const hideBtn = cardEl.querySelector('.card-hide-btn');
    if (hideBtn) {
      hideBtn.onclick = (e) => {
        e.stopPropagation();
        this.hideCard(cardId);
      };
    }

    // 拖拽事件（编辑模式才启用）
    if (this.isEditMode) {
      this.bindDragEvents(cardEl, cardData);
    }
  },

  bindDragEvents(cardEl, cardData) {
    const startDrag = (clientX, clientY) => {
      this.draggingCardId = cardData.id;
      this.dragStartX = clientX;
      this.dragStartY = clientY;
      this.cardOrigX = cardData.x;
      this.cardOrigY = cardData.y;
      cardEl.classList.add('dragging');
    };

    const moveDrag = (clientX, clientY) => {
      if (this.draggingCardId !== cardData.id) return;
      const dx = clientX - this.dragStartX;
      const dy = clientY - this.dragStartY;

      // 边界限制
      const pageEl = cardEl.parentElement;
      const maxX = pageEl.clientWidth - CARD_WIDTH;
      const maxY = pageEl.clientHeight - CARD_HEIGHT;
      let newX = Math.max(0, Math.min(maxX, this.cardOrigX + dx));
      let newY = Math.max(0, Math.min(maxY, this.cardOrigY + dy));

      cardEl.style.left = `${newX}px`;
      cardEl.style.top = `${newY}px`;
    };

    const endDrag = () => {
      if (this.draggingCardId !== cardData.id) return;
      cardEl.classList.remove('dragging');

      // 更新数据
      const page = this.getCurrentPage();
      const target = page.cards.find(c => c.id === cardData.id);
      if (target) {
        target.x = parseInt(cardEl.style.left);
        target.y = parseInt(cardEl.style.top);
        this.saveConfig();
        Toast.show('布局已保存');
      }

      this.draggingCardId = null;
    };

    // 鼠标事件
    cardEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startDrag(e.clientX, e.clientY);

      const onMouseMove = (e) => moveDrag(e.clientX, e.clientY);
      const onMouseUp = () => {
        endDrag();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // 触屏事件
    cardEl.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    }, { passive: true });

    cardEl.addEventListener('touchmove', (e) => {
      if (this.draggingCardId !== cardData.id) return;
      e.preventDefault();
      const touch = e.touches[0];
      moveDrag(touch.clientX, touch.clientY);
    }, { passive: false });

    cardEl.addEventListener('touchend', endDrag);
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

  bindEditButton() {
    const btn = document.getElementById('toggle-edit-btn');
    if (btn) {
      btn.onclick = () => {
        this.isEditMode = !this.isEditMode;
        this.render();
        Toast.show(this.isEditMode ? '已进入编辑模式' : '已退出编辑模式');
      };
    }
  },

  bindGlobalEvents() {
    // 图标上传处理
    const uploadInput = document.getElementById('icon-upload-input');
    if (uploadInput) {
      uploadInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          Toast.show('仅支持图片格式');
          return;
        }

        const reader = new FileReader();
        reader.onload = (res) => {
          const base64 = res.target.result;
          const cardId = this._uploadTargetCardId;
          if (!cardId) return;

          const page = this.getCurrentPage();
          const card = page.cards.find(c => c.id === cardId);
          if (card) {
            card.customIcon = base64;
            this.saveConfig();
            this.renderAllCards();
            Toast.show('图标已更换');
          }
          this._uploadTargetCardId = null;
        };
        reader.readAsDataURL(file);
        uploadInput.value = '';
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

    // 原有跳转逻辑，完全兼容旧版
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

  openCardMenu(cardId, cardEl) {
    // 简单操作：直接触发图标上传
    if (confirm('是否更换该图标？')) {
      this._uploadTargetCardId = cardId;
      document.getElementById('icon-upload-input').click();
    }
  },

  hideCard(cardId) {
    const page = this.getCurrentPage();
    const idx = page.cards.findIndex(c => c.id === cardId);
    if (idx > -1) {
      page.cards.splice(idx, 1);
      this.saveConfig();
      this.renderAllCards();
      Toast.show('已隐藏该图标');
    }
  },

  showAddCardModal() {
    // 找出当前页没有的卡片
    const currentPageIds = this.getCurrentPage().cards.map(c => c.id);
    const available = CARD_META.filter(m => !currentPageIds.includes(m.id));

    if (available.length === 0) {
      Toast.show('所有图标都已添加到当前页');
      return;
    }

    const mask = document.createElement('div');
    mask.className = 'add-card-modal-mask';
    mask.innerHTML = `
      <div class="add-card-modal">
        <div class="add-card-modal-header">
          <span>添加图标到桌面</span>
          <span style="cursor:pointer;color:var(--color-text-2)" id="close-add-modal">×</span>
        </div>
        <div class="add-card-list">
          ${available.map(item => `
            <div class="add-card-item" data-id="${item.id}">
              <span class="icon">${item.defaultIcon}</span>
              <span>${item.name}</span>
              ${item.isDev ? '<span style="font-size:11px;color:var(--color-text-2);margin-left:auto">开发中</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(mask);

    mask.querySelector('#close-add-modal').onclick = () => mask.remove();
    mask.onclick = (e) => { if (e.target === mask) mask.remove(); };

    mask.querySelectorAll('.add-card-item').forEach(item => {
      item.onclick = () => {
        const id = item.dataset.id;
        this.addCardToPage(id);
        mask.remove();
      };
    });
  },

  addCardToPage(cardId) {
    const page = this.getCurrentPage();
    // 默认放到页面左上角偏移位置
    const offsetY = 20 + page.cards.length * 10;
    page.cards.push({
      id: cardId,
      x: 24,
      y: 20 + offsetY,
      customIcon: ''
    });
    this.saveConfig();
    this.renderAllCards();
    Toast.show('已添加到桌面');
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
    // 自动切到新页面
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
    if (!confirm('确定删除当前桌面页？该页所有图标将被移除')) return;

    this.config.pages.splice(this.config.currentPage, 1);
    this.config.currentPage = Math.max(0, this.config.currentPage - 1);
    this.saveConfig();
    this.render();
    Toast.show('已删除桌面页');
  }
};
