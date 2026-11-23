import { Store } from './core/store.js';
import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

// 全部36个功能入口基础配置
const ALL_CARDS_CONFIG = [
  // ========== 已开发 8个核心入口 ==========
  { id: 'chat', name: '聊天', defaultIcon: '💬', isDev: false, action: 'tab:chat' },
  { id: 'card', name: '字卡库', defaultIcon: '📜', isDev: false, action: 'tab:card' },
  { id: 'contact', name: '联系人', defaultIcon: '👤', isDev: false, action: 'tab:setting-contact' },
  { id: 'treehole', name: '树洞', defaultIcon: '🌳', isDev: true, action: 'dev' },
  { id: 'tarot', name: '卜星', defaultIcon: '🔮', isDev: true, action: 'dev' },
  { id: 'house', name: '小屋', defaultIcon: '🏠', isDev: true, action: 'dev' },
  { id: 'audit', name: '审核', defaultIcon: '✅', isDev: true, action: 'dev' },
  { id: 'setting', name: '设置', defaultIcon: '⚙️', isDev: false, action: 'tab:setting' },

  // ========== 拓展待开发 28个 ==========
  { id: 'groupchat', name: '群聊', defaultIcon: '👥', isDev: true, action: 'dev' },
  { id: 'heartletter', name: '心信笺', defaultIcon: '💌', isDev: true, action: 'dev' },
  { id: 'moments', name: '朋友圈', defaultIcon: '🌅', isDev: true, action: 'dev' },
  { id: 'favorite', name: '收藏', defaultIcon: '⭐', isDev: true, action: 'dev' },
  { id: 'footprint', name: '行迹', defaultIcon: '📍', isDev: true, action: 'dev' },
  { id: 'resonance', name: '共鸣', defaultIcon: '🎐', isDev: true, action: 'dev' },
  { id: 'daynight', name: '朝夕之居', defaultIcon: '🌅', isDev: true, action: 'dev' },
  { id: 'garden', name: '花园', defaultIcon: '🌸', isDev: true, action: 'dev' },
  { id: 'music', name: '音乐', defaultIcon: '🎵', isDev: true, action: 'dev' },
  { id: 'reach', name: '伸手', defaultIcon: '🤝', isDev: true, action: 'dev' },
  { id: 'here', name: '此间', defaultIcon: '🏮', isDev: true, action: 'dev' },
  { id: 'calendar', name: '日历', defaultIcon: '📅', isDev: true, action: 'dev' },
  { id: 'anniversary', name: '纪念日', defaultIcon: '🎉', isDev: true, action: 'dev' },
  { id: 'narrate', name: '叙心', defaultIcon: '📝', isDev: true, action: 'dev' },
  { id: 'qa', name: '提答录', defaultIcon: '❓', isDev: true, action: 'dev' },
  { id: 'moonletter', name: '月信', defaultIcon: '🌙', isDev: true, action: 'dev' },
  { id: 'chatnote', name: '聊记', defaultIcon: '📒', isDev: true, action: 'dev' },
  { id: 'letternote', name: '汇笺', defaultIcon: '📨', isDev: true, action: 'dev' },
  { id: 'dream', name: '梦册', defaultIcon: '💭', isDev: true, action: 'dev' },
  { id: 'selfintro', name: '自叙', defaultIcon: '📖', isDev: true, action: 'dev' },
  { id: 'memo', name: '备忘', defaultIcon: '📌', isDev: true, action: 'dev' },
  { id: 'tomato', name: '番茄钟', defaultIcon: '🍅', isDev: true, action: 'dev' },
  { id: 'piggy', name: '存钱罐', defaultIcon: '🐷', isDev: true, action: 'dev' },
  { id: 'bill', name: '记账', defaultIcon: '💰', isDev: true, action: 'dev' },
  { id: 'water', name: '饮水', defaultIcon: '💧', isDev: true, action: 'dev' },
  { id: 'choice', name: '寻味抉择', defaultIcon: '🎲', isDev: true, action: 'dev' },
  { id: 'market', name: '心意市集', defaultIcon: '🛍️', isDev: true, action: 'dev' },
  { id: 'cabinet', name: '心意柜', defaultIcon: '🗄️', isDev: true, action: 'dev' },
  { id: 'pet', name: '萌宠屋', defaultIcon: '🐱', isDev: true, action: 'dev' },
  { id: 'fish', name: '摸鱼小计', defaultIcon: '🐟', isDev: true, action: 'dev' },
  { id: 'taphone', name: 'TA的手机', defaultIcon: '📱', isDev: true, action: 'dev' }
];

const STORAGE_KEY = 'desktop-config';
const CARD_WIDTH = 80;
const CARD_HEIGHT = 96;

export const DesktopModule = {
  rootEl: null,
  canvasEl: null,
  config: null,
  dragState: {
    active: false,
    cardId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0
  },
  swipeState: {
    startX: 0,
    startY: 0
  },

  init(selector) {
    this.rootEl = document.querySelector(selector);
    if (!this.rootEl) return;

    this.loadConfig();
    this.render();
    this.bindGlobalEvents();

    // 主题变更时自动适配样式（CSS变量原生生效，此处仅做兜底重绘）
    EventBus.on('themeChange', () => {
      this.renderCards();
    });
  },

  // 读取本地配置，无数据则生成默认布局
  loadConfig() {
    const saved = Store.get(STORAGE_KEY);
    if (saved && saved.pages && saved.pages.length > 0) {
      this.config = saved;
      return;
    }

    // 默认布局：第1页放8个核心入口，第2页放全部拓展功能
    const defaultCardsPage1 = ALL_CARDS_CONFIG.slice(0, 8).map((item, idx) => ({
      ...item,
      x: 20 + (idx % 3) * 100,
      y: 120 + Math.floor(idx / 3) * 110,
      customIcon: ''
    }));

    const extendCards = ALL_CARDS_CONFIG.slice(8);
    const defaultCardsPage2 = extendCards.map((item, idx) => ({
      ...item,
      x: 20 + (idx % 3) * 100,
      y: 40 + Math.floor(idx / 3) * 110,
      customIcon: ''
    }));

    this.config = {
      currentPage: 0,
      pages: [
        { id: 0, cards: defaultCardsPage1, widgets: [] },
        { id: 1, cards: defaultCardsPage2, widgets: [] }
      ]
    };
    this.saveConfig();
  },

  saveConfig() {
    Store.set(STORAGE_KEY, this.config);
  },

  getCurrentPage() {
    return this.config.pages[this.config.currentPage];
  },

  render() {
    if (!this.rootEl) return;
    this.rootEl.innerHTML = '';
    this.rootEl.style.cssText = `
width: 100%;
height: 100%;
position: relative;
overflow: hidden;
background: transparent;
    `;

    // 顶部小组件预留区域
    const widgetArea = document.createElement('div');
    widgetArea.className = 'desktop-widget-area';
    widgetArea.style.cssText = `
width: 100%;
height: 120px;
padding: 12px 16px;
box-sizing: border-box;
    `;
    this.rootEl.appendChild(widgetArea);

    // 卡片画布
    this.canvasEl = document.createElement('div');
    this.canvasEl.className = 'desktop-card-canvas';
    this.canvasEl.style.cssText = `
width: 100%;
flex: 1;
position: relative;
overflow: hidden;
touch-action: pan-y;
    `;
    this.rootEl.appendChild(this.canvasEl);

    // 分页圆点指示器
    const pagination = document.createElement('div');
    pagination.className = 'desktop-pagination';
    pagination.style.cssText = `
position: absolute;
bottom: 60px;
left: 50%;
transform: translateX(-50%);
display: flex;
gap: 8px;
z-index: 10;
    `;
    this.rootEl.appendChild(pagination);

    // 隐藏的图片上传输入框
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = 'desktop-icon-uploader';
    fileInput.style.display = 'none';
    this.rootEl.appendChild(fileInput);
    this.uploadInput = fileInput;
    this.uploadTargetCardId = null;

    this.renderCards();
    this.renderPagination();
    this.bindSwipeEvent();
    this.bindUploadEvent();
  },

  renderCards() {
    if (!this.canvasEl) return;
    this.canvasEl.innerHTML = '';
    const page = this.getCurrentPage();
    if (!page) return;

    page.cards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'desktop-card';
      cardEl.dataset.cardId = card.id;
      cardEl.style.cssText = `
position: absolute;
left: ${card.x}px;
top: ${card.y}px;
width: ${CARD_WIDTH}px;
display: flex;
flex-direction: column;
align-items: center;
gap: 6px;
padding: 10px 6px;
box-sizing: border-box;
border-radius: 16px;
background: rgba(255,255,255,0.25);
backdrop-filter: blur(8px);
-webkit-backdrop-filter: blur(8px);
border: 1px solid rgba(255,255,255,0.35);
cursor: pointer;
user-select: none;
transition: transform 0.15s ease, box-shadow 0.15s ease;
      `;

      // 上传按钮（右上角）
      const uploadBtn = document.createElement('div');
      uploadBtn.className = 'card-upload-btn';
      uploadBtn.innerText = '🖼️';
      uploadBtn.style.cssText = `
position: absolute;
top: 4px;
right: 4px;
width: 18px;
height: 18px;
font-size: 10px;
display: flex;
align-items: center;
justify-content: center;
border-radius: 50%;
background: rgba(0,0,0,0.4);
color: #fff;
opacity: 0;
transition: opacity 0.2s;
cursor: pointer;
      `;
      cardEl.appendChild(uploadBtn);

      // 图标
      const iconEl = document.createElement('div');
      iconEl.style.cssText = `
width: 40px;
height: 40px;
display: flex;
align-items: center;
justify-content: center;
font-size: 28px;
overflow: hidden;
border-radius: 10px;
      `;
      if (card.customIcon) {
        iconEl.innerHTML = `<img src="${card.customIcon}" style="width:100%;height:100%;object-fit:cover">`;
      } else {
        iconEl.innerText = card.defaultIcon;
      }

      // 文字
      const labelEl = document.createElement('div');
      labelEl.innerText = card.name;
      labelEl.style.cssText = `
font-size: 12px;
color: var(--color-text, #222);
text-align: center;
line-height: 1.2;
max-width: 100%;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
      `;

      cardEl.appendChild(iconEl);
      cardEl.appendChild(labelEl);

      // 悬停显示上传按钮
      cardEl.addEventListener('mouseenter', () => {
        uploadBtn.style.opacity = '1';
      });
      cardEl.addEventListener('mouseleave', () => {
        uploadBtn.style.opacity = '0';
      });

      // 上传按钮点击
      uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.uploadTargetCardId = card.id;
        this.uploadInput.click();
      });

      // 卡片点击
      cardEl.addEventListener('click', () => {
        if (this.dragState.active) return;
        this.handleCardClick(card);
      });

      // 拖拽绑定
      this.bindDragEvent(cardEl, card);

      this.canvasEl.appendChild(cardEl);
    });
  },

  renderPagination() {
    const pagination = this.rootEl.querySelector('.desktop-pagination');
    if (!pagination) return;
    pagination.innerHTML = '';

    this.config.pages.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.style.cssText = `
width: 6px;
height: 6px;
border-radius: 50%;
background: ${idx === this.config.currentPage ? 'var(--color-text, #222)' : 'rgba(0,0,0,0.2)'};
transition: background 0.2s;
cursor: pointer;
      `;
      dot.onclick = () => {
        this.switchPage(idx);
      };
      pagination.appendChild(dot);
    });
  },

  // 卡片点击逻辑：完全保留原有跳转规则
  handleCardClick(card) {
    if (card.isDev) {
      Toast.show('功能开发中，敬请期待');
      return;
    }

    switch (card.action) {
      case 'tab:chat':
        document.querySelector('.tab-btn[data-tab="chat"]')?.click();
        break;
      case 'tab:card':
        document.querySelector('.tab-btn[data-tab="card"]')?.click();
        break;
      case 'tab:setting':
        document.querySelector('.tab-btn[data-tab="setting"]')?.click();
        break;
      case 'tab:setting-contact':
        document.querySelector('.tab-btn[data-tab="setting"]')?.click();
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('setting:open-contact'));
        }, 80);
        break;
      default:
        Toast.show('功能开发中，敬请期待');
    }
  },

  // 图标上传处理
  bindUploadEvent() {
    this.uploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file || !this.uploadTargetCardId) return;

      const reader = new FileReader();
      reader.onload = (res) => {
        const base64 = res.target.result;
        const page = this.getCurrentPage();
        const target = page.cards.find(c => c.id === this.uploadTargetCardId);
        if (target) {
          target.customIcon = base64;
          this.saveConfig();
          this.renderCards();
          Toast.show('图标已更新');
        }
      };
      reader.readAsDataURL(file);
      this.uploadInput.value = '';
    });
  },

  // 拖拽事件绑定
  bindDragEvent(cardEl, cardData) {
    const startDrag = (clientX, clientY) => {
      this.dragState.active = true;
      this.dragState.cardId = cardData.id;
      this.dragState.startX = clientX;
      this.dragState.startY = clientY;
      this.dragState.originX = cardData.x;
      this.dragState.originY = cardData.y;
      cardEl.style.transform = 'scale(1.08)';
      cardEl.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
      cardEl.style.zIndex = '99';
    };

    const moveDrag = (clientX, clientY) => {
      if (!this.dragState.active || this.dragState.cardId !== cardData.id) return;
      const dx = clientX - this.dragState.startX;
      const dy = clientY - this.dragState.startY;
      cardData.x = this.dragState.originX + dx;
      cardData.y = this.dragState.originY + dy;
      cardEl.style.left = cardData.x + 'px';
      cardEl.style.top = cardData.y + 'px';
    };

    const endDrag = () => {
      if (!this.dragState.active || this.dragState.cardId !== cardData.id) return;
      this.dragState.active = false;
      cardEl.style.transform = '';
      cardEl.style.boxShadow = '';
      cardEl.style.zIndex = '';
      this.saveConfig();
      Toast.show('布局已保存');
    };

    // 鼠标事件
    cardEl.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('card-upload-btn')) return;
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', (e) => {
      moveDrag(e.clientX, e.clientY);
    });
    document.addEventListener('mouseup', endDrag);

    // 触屏事件
    cardEl.addEventListener('touchstart', (e) => {
      if (e.target.classList.contains('card-upload-btn')) return;
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
      if (!this.dragState.active) return;
      const touch = e.touches[0];
      moveDrag(touch.clientX, touch.clientY);
    }, { passive: true });
    document.addEventListener('touchend', endDrag);
  },

  // 左右滑动切换分页
  bindSwipeEvent() {
    const canvas = this.canvasEl;
    if (!canvas) return;

    canvas.addEventListener('touchstart', (e) => {
      if (this.dragState.active) return;
      const touch = e.touches[0];
      this.swipeState.startX = touch.clientX;
      this.swipeState.startY = touch.clientY;
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      if (this.dragState.active) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - this.swipeState.startX;
      const dy = touch.clientY - this.swipeState.startY;

      // 横向滑动距离大于50且横向为主
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0 && this.config.currentPage < this.config.pages.length - 1) {
          this.switchPage(this.config.currentPage + 1);
        } else if (dx > 0 && this.config.currentPage > 0) {
          this.switchPage(this.config.currentPage - 1);
        }
      }
    });
  },

  switchPage(idx) {
    if (idx < 0 || idx >= this.config.pages.length) return;
    this.config.currentPage = idx;
    this.saveConfig();
    this.renderCards();
    this.renderPagination();
  },

  bindGlobalEvents() {
    // 防止拖拽时选中文本
    document.addEventListener('selectstart', (e) => {
      if (this.dragState.active) e.preventDefault();
    });
  }
};
