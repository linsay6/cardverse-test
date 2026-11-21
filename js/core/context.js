// 全局状态上下文
window.GLOBAL_CONTEXT = {
  activeSessionId: "default-mj",
  config: {}
};

// 事件总线：用来模块之间互相发消息，解耦
window.EventBus = {
  events: {},

  // 订阅事件：监听某个消息
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  },

  // 触发事件：发出消息，通知所有订阅这个事件的地方
  emit(eventName, payload) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(cb => cb(payload));
  },

  // 取消订阅（暂时先用不上，先预留）
  off(eventName, callback) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
  }
};
