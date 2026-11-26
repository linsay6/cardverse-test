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
const CARD_WIDTH = 52;     
const CARD_HEIGHT = 52;    
const WIDGET_AREA_HEIGHT = 110;
const INDICATOR_HEIGHT = 30;
const V_GAP = 22;          
const SIDE_MARGIN = 24;    
const SNAP_DISTANCE = 18;
const PAGE_SWIPE_THRESHOLD = 60;
const LABEL_HEIGHT = 26;   
// ========== 36个功能卡片元数据 ==========
const CARD_META = [
  // ===== 已开发 8个 =====
  { id: 'chat', name: '聊天', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'></path></svg>", isDev: false, type: 'tab', target: 'chat' },
  { id: 'card', name: '字卡库', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'></path><path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'></path></svg>", isDev: false, type: 'tab', target: 'card' },
  { id: 'contact', name: '联系人', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path><circle cx='12' cy='7' r='4'></circle></svg>", isDev: false, type: 'tab', target: 'setting', sub: 'contact' },
  { id: 'treehole', name: '树洞', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22V12'></path><path d='M8 14a4 4 0 0 0 4-4 4 4 0 0 0 4 4'></path><path d='M12 2C9 5 4 8 4 13a8 8 0 0 0 16 0c0-5-5-8-8-11Z'></path></svg>", isDev: false, type: 'action', action: 'treehole' },
  { id: 'tarot', name: '卜星', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'></path><path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41'></path></svg>", isDev: false, type: 'action', action: 'tarot' },
  { id: 'house', name: '小屋', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path><polyline points='9 22 9 12 15 12 15 22'></polyline></svg>", isDev: false, type: 'action', action: 'house' },
  { id: 'audit', name: '审核', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path><polyline points='22 4 12 14.01 9 11.01'></polyline></svg>", isDev: false, type: 'action', action: 'audit' },
  { id: 'setting', name: '设置', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='3'></circle><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'></path></svg>", isDev: false, type: 'tab', target: 'setting' },
  // ===== 开发中 28个 =====
  { id: 'groupchat', name: '群聊', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path><circle cx='9' cy='7' r='4'></circle><path d='M23 21v-2a4 4 0 0 0-3-3.87'></path><path d='M16 3.13a4 4 0 0 1 0 7.75'></path></svg>", isDev: true },
  { id: 'heartletter', name: '心信笺', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'></path><polyline points='22,6 12,13 2,6'></polyline></svg>", isDev: true },
  { id: 'moments', name: '朋友圈', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'></circle><path d='M2 12h20'></path><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'></path></svg>", isDev: true },
  { id: 'favorite', name: '收藏', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'></polygon></svg>", isDev: true },
  { id: 'track', name: '行迹', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'></path><circle cx='12' cy='10' r='3'></circle></svg>", isDev: true },
  { id: 'resonance', name: '共鸣', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='2 12 7 12 10 6 14 18 17 12 22 12'></polyline></svg>", isDev: true },
  { id: 'dwelling', name: '朝夕之居', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path><polyline points='9 22 9 12 15 12 15 22'></polyline></svg>", isDev: true },
  { id: 'garden', name: '花园', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22v-6'></path><path d='M12 16c-2-2-4-5-4-8 1 1 3 2 4 4 1-2 3-3 4-4 0 3-2 6-4 8z'></path><path d='M12 16c-1-1-2-3-2-5 1 1 2 2 2 4 0-2 1-3 2-4 0 2-1 4-2 5z'></path></svg>", isDev: true },
  { id: 'music', name: '音乐', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 18V5l12-2v13'></path><circle cx='6' cy='18' r='3'></circle><circle cx='18' cy='16' r='3'></circle></svg>", isDev: true },
  { id: 'reach', name: '伸手', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0'></path><path d='M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2'></path><path d='M10 10.5V5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7'></path><path d='M18 10a2 2 0 0 1 2 2v3a8 8 0 0 1-8 8H9a8 8 0 0 1-8-8v-2a2 2 0 0 1 2-2h7'></path></svg>", isDev: true },
  { id: 'here', name: '此间', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'></path><circle cx='12' cy='13' r='4'></circle></svg>", isDev: true },
  { id: 'calendar', name: '日历', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line></svg>", isDev: true },
  { id: 'anniversary', name: '纪念日', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'></path></svg>", isDev: true },
  { id: 'narrate', name: '叙心', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'></path></svg>", isDev: true },
  { id: 'qa', name: '提答录', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'></circle><path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'></path><line x1='12' y1='17' x2='12.01' y2='17'></line></svg>", isDev: true },
  { id: 'moonletter', name: '月信', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'></path></svg>", isDev: true },
  { id: 'chatnote', name: '聊记', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20'></path><path d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'></path></svg>", isDev: true },
  { id: 'letternote', name: '汇笺', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z'></path><path d='M7 8h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8z'></path></svg>", isDev: true },
  { id: 'dreambook', name: '梦册', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'></path></svg>", isDev: true },
  { id: 'selfintro', name: '自叙', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 20h9'></path><path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'></path></svg>", isDev: true },
  { id: 'memo', name: '备忘', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 11l3 3L22 4'></path><path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'></path></svg>", isDev: true },
    { id: 'pomodoro', name: '专注', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><ellipse cx='12' cy='13' rx='7' ry='6'></ellipse><path d='M12 2.5v3'></path><path d='M9 2.5h6'></path></svg>", isDev: true },
  { id: 'piggybank', name: '扑满', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='8'></circle><path d='M12 6v12M6 12h12'></path></svg>", isDev: true },
  { id: 'account', name: '账簿', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'></path></svg>", isDev: true },
  { id: 'water', name: '饮水', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z'></path></svg>", isDev: true },
   { id: 'foodchoice', name: '寻味', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M8 2v7a3 3 0 0 0 3 3v10'></path><path d='M16 2v17'></path><path d='M12 2v17'></path></svg>", isDev: true },
  { id: 'heartmarket', name: '心意市集', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='9' cy='21' r='1'></circle><circle cx='20' cy='21' r='1'></circle><path d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'></path></svg>", isDev: true },
  { id: 'heartcabinet', name: '心意柜', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M2 2h20v20H2z'></path><path d='M2 8h20'></path><path d='M8 22V8'></path></svg>", isDev: true },
  { id: 'petroom', name: '萌宠屋', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10 5.5a2.5 2.5 0 0 1 5 0'></path><circle cx='12.5' cy='11' r='4.5'></circle><path d='M5.5 17c1.7-2.5 4.2-4 7-4s5.3 1.5 7 4'></path><path d='M8 17.5v3.5h9v-3.5'></path></svg>", isDev: true },
  { id: 'fishwork', name: '摸鱼小计', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M2 21l4-4 4 4 4-4 4 4 4-4'></path><path d='M2 17c2-2 4-3 6-3s4 1 6 3 4 3 6 3'></path><path d='M22 4v4a4 4 0 0 1-4 4h-2'></path></svg>", isDev: true },
  { id: 'taphone', name: 'TA的手机', defaultIcon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='5' y='2' width='14' height='20' rx='2' ry='2'></rect><line x1='12' y1='18' x2='12.01' y2='18'></line></svg>", isDev: true }
];
export const DesktopModule = {
  rootEl: null,
  config: null,
  isEditMode: false,
  
  init(selector) {
    this.rootEl = document.querySelector(selector);
    if (!this.rootEl) return;
    this.loadConfig();
    
    // 初始尝试渲染
    this.render();
    // 【核心修复】：如果初始加载时容器被隐藏(宽度为0)，监听尺寸变化，等展示后自动触发重新计算布局
    if (window.ResizeObserver) {
      this._resizeObserver = new ResizeObserver((entries) => {
        const width = entries[0].contentRect.width;
        if (width > 0 && width !== this._lastRenderedWidth) {
          this.render();
        }
      });
      this._resizeObserver.observe(this.rootEl);
    }
    this.bindGlobalEvents();
    EventBus.on('themeChange', () => {
      this.render();
    });

        // ========== 新增：待审角标自动更新 ==========
    EventBus.on("my‑audit‑data‑updated", ()=>{
      this.renderAllCards();
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
  // 计算网格间距，拒绝使用 window.innerWidth，防止在桌面端宽度过宽导致间距爆炸
  getGridInfo(pageWidth) {
    const perRow = 4;
    const marginLeft = SIDE_MARGIN;
    let safeWidth = pageWidth;
    
    // 如果无法获取有效宽度，兜底 375
    if (!safeWidth || safeWidth < 320) {
      safeWidth = 375;
    }
    // 防止在超宽屏幕(如平板)上拉得太散
    if (safeWidth > 600) safeWidth = 600; 
    const availableWidth = safeWidth - marginLeft * 2 - perRow * CARD_WIDTH;
    let gap = availableWidth / (perRow - 1);
    
    gap = Math.max(8, gap);
    
    return {
      marginLeft,
      gap
    };
  },
  getGridMarginLeft(pageWidth) {
    return this.getGridInfo(pageWidth).marginLeft;
  },
  getDefaultConfig() {
    const pages = [];
    const perRow = 4;
    const perPageRow = 4;
    const perPage = perRow * perPageRow;
    let pageCards = [];
    
    const pageW = this.rootEl && this.rootEl.clientWidth > 0 ? this.rootEl.clientWidth : 375;
    const { marginLeft, gap } = this.getGridInfo(pageW);
    CARD_META.forEach((meta, idx) => {
      const col = idx % perRow;
      const row = Math.floor((idx % perPage) / perRow);
      const x = Math.round(marginLeft + col * (CARD_WIDTH + gap));
      const y = 16 + row * (CARD_HEIGHT + V_GAP + LABEL_HEIGHT);
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
    const pageW = this.rootEl.clientWidth > 0 ? this.rootEl.clientWidth : 375;
    const pageH = this.rootEl.clientHeight - WIDGET_AREA_HEIGHT - INDICATOR_HEIGHT;
    const { marginLeft, gap } = this.getGridInfo(pageW);
    const perRow = 4;
    const maxCol = perRow;
    const maxRow = Math.floor((pageH - 16) / (CARD_HEIGHT + V_GAP + LABEL_HEIGHT));
    for(let r=0; r<maxRow; r++){
      for(let c=0; c<maxCol; c++){
        const testX = Math.round(marginLeft + c * (CARD_WIDTH + gap));
        const testY = 16 + r * (CARD_HEIGHT + V_GAP + LABEL_HEIGHT);
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
  reArrangePageCards(page, width) {
    const perRow = 4;
    const pageW = width > 0 ? width : (this.rootEl.clientWidth > 0 ? this.rootEl.clientWidth : 375);
    const { marginLeft, gap } = this.getGridInfo(pageW);
    const sorted = [...page.cards].sort((a,b)=>{
      if(a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    sorted.forEach((card, idx)=>{
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      card.x = Math.round(marginLeft + col * (CARD_WIDTH + gap));
      card.y = 16 + row * (CARD_HEIGHT + V_GAP + LABEL_HEIGHT);
    });
    page.cards = sorted;
  },
  render(retryCount = 0) {
    if (!this.rootEl) return;
    
    // 【核心修复】：获取真实宽度，如果为0（比如还在切换Tab/隐藏状态），延迟重试
    let realWidth = this.rootEl.clientWidth;
    if (realWidth <= 0) {
      if (retryCount < 10) {
        setTimeout(() => this.render(retryCount + 1), 50);
      }
      return;
    }
    
    this._lastRenderedWidth = realWidth;
   
    // 渲染前保存滚动位置
    const wrapBefore = document.getElementById('desktop-pages-wrap');
    let restoreScrollLeft = 0;
    if(wrapBefore){
      restoreScrollLeft = wrapBefore.scrollLeft;
    }
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
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-drag: none;
  touch-action: manipulation;
  box-sizing: border-box;
  will-change: transform;
  position:relative;
}
/* 重点：针对内部img自定义图标，屏蔽长按保存图片菜单 */
.desktop-card .card-icon img{
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-drag: none;
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
          filter:grayscale(0.1) var(--icon-filter,none);
        }
         .desktop-card .card-icon img{
          width:100%;
          height:100%;
          object-fit: cover;
          object-position: center center;
          border-radius:14px;
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
                .card-move-btn{
          position:absolute;
          bottom:-6px;
          left:50%;
          transform:translateX(-50%);
          width:18px;
          height:16px;
          border-radius:4px;
          background:rgba(30,180,80,0.85);
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
        .desktop-card .card-icon svg {
          max-width:60%;
          max-height:60%;
          width:auto;
          height:auto;
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
    // 渲染完成后强制滚动到当前页
    requestAnimationFrame(() => {
      const wrap = document.getElementById('desktop-pages-wrap');
      if (wrap) {
        wrap.scrollLeft = restoreScrollLeft;
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

        // ========== 新增：审核图标右上角待审角标 ==========
        if(cardData.id === 'audit'){
          const pendingCount = window.AuditCardModule?.pendingApply?.length || 0;
          const badgeEl = document.createElement('div');
          badgeEl.style.cssText = `
position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 5px;
background:#ff3b30;color:#fff;font-size:10px;border-radius:999px;
display:flex;align-items:center;justify-content:center;line-height:1;
font-weight:bold;z-index:10;white-space:nowrap;
`;
          if(pendingCount > 0){
            badgeEl.textContent = pendingCount > 99 ? '99+' : String(pendingCount);
            badgeEl.style.display = 'flex';
          }else{
            badgeEl.style.display = 'none';
          }
          cardEl.appendChild(badgeEl);
        }

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
          const moveBtn = document.createElement('button');
          moveBtn.className = 'card-move-btn';
          moveBtn.textContent = '📐';
          moveBtn.dataset.pageIndex = pageIdx;
          moveBtn.dataset.cardId = cardData.id;
          cardEl.appendChild(moveBtn);
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
      const addCardBtn = document.createElement('button');
      addCardBtn.className = 'page-control-btn';
      addCardBtn.innerText = '+ 添加图标';
      addCardBtn.style.marginLeft = '6px';
      addCardBtn.onclick = () => this.showAddCardModal();
      indicator.appendChild(addCardBtn);
      const arrangeBtn = document.createElement('button');
      arrangeBtn.className = 'page-control-btn';
      arrangeBtn.innerText = '收拢图标';
      arrangeBtn.style.marginLeft = '6px';
      arrangeBtn.onclick = ()=>{
        this.reArrangePageCards(this.getCurrentPage());
        this.saveConfig();
        this.render();
        Toast.show('已手动收拢全部图标');
      };
      indicator.appendChild(arrangeBtn);
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
      const moveBtn = cardEl.querySelector('.card-move-btn');
      if(moveBtn){
        moveBtn.onclick = (e)=>{
          e.stopPropagation();
          const sourcePageIdx = Number(moveBtn.dataset.pageIndex);
          const cardId = moveBtn.dataset.cardId;
          const cardObj = this.findCard(sourcePageIdx, cardId);
          if(!cardObj) return;
          const inputText = prompt("请输入目标位置，格式：页面号,排号,列号\n全部数字从0开始，例：0,1,2 → 第0页，第1排，第2列");
          if(!inputText) return;
          const arr = inputText.split(',').map(s=>parseInt(s.trim(),10));
          const [targetPageIdx, targetRow, targetCol] = arr;
          if(isNaN(targetPageIdx)||isNaN(targetRow)||isNaN(targetCol)){
            Toast.show("输入格式错误，请按 页面号,排号,列号","error");
            return;
          }
          if(targetPageIdx<0 || targetPageIdx >= this.config.pages.length){
            Toast.show("目标页面不存在","error");
            return;
          }
          const targetPage = this.config.pages[targetPageIdx];
          const wrap = document.getElementById('desktop-pages-wrap');
          const pageW = wrap.clientWidth > 0 ? wrap.clientWidth : 375;
          const { marginLeft, gap } = this.getGridInfo(pageW);
          const targetX = Math.round(marginLeft + targetCol * (CARD_WIDTH + gap));
          const targetY = 16 + targetRow * (CARD_HEIGHT + V_GAP + LABEL_HEIGHT);
          const srcPage = this.config.pages[sourcePageIdx];
          const srcIdx = srcPage.cards.findIndex(c=>c.id===cardObj.id);
          if(srcIdx>-1) srcPage.cards.splice(srcIdx,1);
          let isOccupied = false;
          for(const oc of targetPage.cards){
            const overlap = !(
              targetX + CARD_WIDTH < oc.x
              || targetX > oc.x + CARD_WIDTH
              || targetY + CARD_HEIGHT < oc.y
              || targetY > oc.y + CARD_HEIGHT
            );
            if(overlap){
              isOccupied = true;
              const shiftH = CARD_HEIGHT + V_GAP + LABEL_HEIGHT;
              for(const cc of targetPage.cards){
                if(cc.y >= targetY){
                  cc.y += shiftH;
                }
              }
              break;
            }
          }
          cardObj.x = targetX;
          cardObj.y = targetY;
          targetPage.cards.push(cardObj);
          this.config.currentPage = targetPageIdx;
          this.saveConfig();
          this.render();
          Toast.show(isOccupied?"目标格子已有图标，原有图标已自动后移":"移动完成","success");
                };
      }
      // 只有编辑模式开启拖拽，普通浏览模式禁止拖拽
      if(this.isEditMode){
        this.bindDragEvents(wrapEl, cardEl, cardData, pageIndex);
      }
    }
  },
    /**
   * 对标鸿蒙 DesktopGrid.ets：长按才触发拖拽，短按为点击
   */
  bindDragEvents(wrapEl, cardEl, cardData, pageIndex) {
    const self = this;
    let longPressTimer = null;
    let touchEventCache = null;
    const LONG_PRESS_MS = 220; // 长按阈值，220ms长按触发拖拽
    function clearTimer(){
      if(longPressTimer){
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      touchEventCache = null;
    }
    const startHold = (evt) => {
      clearTimer();
      touchEventCache = evt;
      // 长按定时器
      longPressTimer = setTimeout(()=>{
        // 真正触发长按的时候阻止系统长按菜单
        if(touchEventCache && touchEventCache.preventDefault){
          try { touchEventCache.preventDefault(); }catch(e){}
        }
        self.startRealDrag(evt.clientX, evt.clientY, wrapEl, cardEl, cardData, pageIndex);
      }, LONG_PRESS_MS);
    };

    wrapEl.addEventListener('mousedown', (e) => {
      // 如果点的是按钮，不触发长按
      if(["card-del-btn","card-icon-btn","card-move-btn"].some(cls=>e.target.classList.contains(cls))) return;
      startHold(e);
    });
    wrapEl.addEventListener('mouseup', clearTimer);
    wrapEl.addEventListener('mouseleave', clearTimer);

    wrapEl.addEventListener('touchstart', (e) => {
      if(["card-del-btn","card-icon-btn","card-move-btn"].some(cls=>e.target.classList.contains(cls))) return;
      const t = e.touches[0];
      // 将touches信息挂载到event对象
      e.clientX = t.clientX;
      e.clientY = t.clientY;
      startHold(e);
    }, { passive:false });

    wrapEl.addEventListener('touchend', clearTimer, { passive:false });
    wrapEl.addEventListener('touchcancel', clearTimer, { passive:false });
    wrapEl.addEventListener('touchmove', clearTimer, { passive:false });

    // 阻止移动端长按弹出系统菜单（安卓长按、ios模拟长按菜单）
    wrapEl.addEventListener('contextmenu', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  },

  // 真正开始拖拽（长按触发后执行）
  startRealDrag(clientX, clientY, wrapEl, cardEl, cardData, pageIndex){
    const self = this;
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
      /**
   * 对标鸿蒙元服务 DesktopGrid.ets：拖拽松手，网格交换换位，而不是向下挤压
   */
  onGlobalDragEnd(wrapEl, cardEl, cardData, pageIndex){
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

    const pageW = wrap.clientWidth > 0 ? wrap.clientWidth : 375;
    const { marginLeft, gap } = this.getGridInfo(pageW);
    // 计算目标网格行列
    const col = Math.round((finalX - marginLeft) / (CARD_WIDTH + gap));
    const row = Math.round((finalY - 16) / (CARD_HEIGHT + V_GAP + LABEL_HEIGHT));
    const snapX = Math.round(marginLeft + col * (CARD_WIDTH + gap));
    const snapY = 16 + row * (CARD_HEIGHT + V_GAP + LABEL_HEIGHT);

    // 吸附到网格
    if (Math.abs(finalX - snapX) < SNAP_DISTANCE) finalX = snapX;
    if (Math.abs(finalY - snapY) < SNAP_DISTANCE) finalY = snapY;

    const currentPage = this.config.pages[this.config.currentPage];

    // ========== 跨页面拖拽处理 ==========
    if(pageIndex !== this.config.currentPage){
      const srcPage = this.config.pages[pageIndex];
      const srcIdx = srcPage.cards.findIndex(c=>c.id === cardData.id);
      if(srcIdx>-1) srcPage.cards.splice(srcIdx,1);
      const targetPage = this.config.pages[this.config.currentPage];
      const pos = this.findEmptyPosition(targetPage);
      if(pos){
        cardData.x = pos.x;
        cardData.y = pos.y;
        targetPage.cards.push(cardData);
      }else{
        srcPage.cards.push(cardData);
        Toast.show('目标页面已满，放回原页面');
      }
      wrapEl.style.transform = '';
      this.saveConfig();
      this.render();
      this.draggingCardId = null;
      return;
    }

    // ========== 同页面：查找目标网格位置上是否存在别的卡片，交换位置（DesktopGrid核心逻辑） ==========
    let swapTargetCard = null;
    for(const otherCard of currentPage.cards){
      if(otherCard.id === cardData.id) continue;
      // 判断是否落到另外一个卡片的网格区域
      const overlap = !(
        finalX + CARD_WIDTH < otherCard.x
        || finalX > otherCard.x + CARD_WIDTH
        || finalY + CARD_HEIGHT < otherCard.y
        || finalY > otherCard.y + CARD_HEIGHT
      );
      if(overlap){
        swapTargetCard = otherCard;
        break;
      }
    }

    if(swapTargetCard){
      // 交换两个卡片的xy，【交换位置，而不是向下挤！对标鸿蒙DesktopGrid】
      const tempX = cardData.x;
      const tempY = cardData.y;
      cardData.x = swapTargetCard.x;
      cardData.y = swapTargetCard.y;
      swapTargetCard.x = tempX;
      swapTargetCard.y = tempY;
      Toast.show("已交换图标位置");
    }else{
      // 目标格子为空，直接落到吸附网格
      cardData.x = finalX;
      cardData.y = finalY;
      Toast.show('布局已保存');
    }

    wrapEl.style.transform = '';
    this.saveConfig();
    this.render();
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
    window.addEventListener('resize', () => {
      this.render();
    });
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
        setTimeout(() => { document.dispatchEvent(new CustomEvent('setting:open-contact')); }, 80);
      }
    } else if (meta.type === 'action') {
      // ✅不直接toast，向外广播open‑panel事件，业务模块自己监听弹出面板
      EventBus.emit('open‑panel', { panel: meta.action });
    }
  },
    deleteCard(pageIdx, cardId) {
    const page = this.config.pages[pageIdx];
    const idx = page.cards.findIndex(c => c.id === cardId);
    if (idx > -1) {
      page.cards.splice(idx, 1);
      this.saveConfig();
      this.renderAllCards();
      Toast.show('已删除图标，空位保留');
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
