/**
 * 本地存储封装层
 * 所有读写 localStorage 都统一走这里，不要在其他地方直接写 localStorage
 */
export const Store = {
  /**
   * 读取数据
   * @param {string} key 存储键名
   * @param {any} defaultValue 如果没有数据，返回默认值
   * @returns {any}
   */
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (err) {
      console.error(`读取存储[${key}]失败`, err);
      return defaultValue;
    }
  },

  /**
   * 保存数据
   * @param {string} key 存储键名
   * @param {any} value 要保存的值（支持对象、数组）
   */
  set(key, value) {
    try {
      const raw = JSON.stringify(value);
      localStorage.setItem(key, raw);
    } catch (err) {
      console.error(`写入存储[${key}]失败`, err);
    }
  },

  /**
   * 删除一条数据
   * @param {string} key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error(`删除存储[${key}]失败`, err);
    }
  },

  /**
   * 清空全部本地存储
   */
  clearAll() {
    try {
      localStorage.clear();
    } catch (err) {
      console.error("清空存储失败", err);
    }
  }
};
