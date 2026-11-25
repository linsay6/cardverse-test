// core/context.js 事件总线 + 全局会话上下文
const EventBus = {
  events: {},
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  },
  emit(eventName, payload) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(cb => cb(payload));
    }
  }
};

// 全局上下文：保存当前会话ID、全局配置，全模块共享
window.GLOBAL_CONTEXT = {
  activeSessionId: null, // 当前激活的联系人/梦角sessionId
  config: {} // 预留：全局引擎、通知、美化配置
};

export { EventBus };
