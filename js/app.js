import { ThemeManager } from './core/css-theme.js';
import { Toast } from './core/toast.js';

// 全局挂载，方便调试（上线后可以删掉）
window.$Toast = Toast;
window.$Theme = ThemeManager;

/**
 * 应用启动入口
 */
async function bootstrap() {
  console.log("应用开始初始化");

  // 1. 加载主题，初始化全局样式变量
  ThemeManager.load();

  console.log("核心模块初始化完成");
  Toast.show("初始化完成");
}

// DOM加载完毕之后启动
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
