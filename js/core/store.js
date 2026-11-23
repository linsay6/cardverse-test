/**
 * IndexedDB存储层（兼容原有Store接口，业务代码无需改动）
 * 自动迁移 localStorage 旧数据，解决5MB空间上限问题
 */
const DB_NAME = "chatAppDB";
const DB_VERSION = 1;
const STORE_NAME = "kvStore";
let dbInstance = null;
let memoryCache = {};
let migrateDone = false;

// 初始化数据库
async function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    req.onerror = (e) => {
      reject(e.target.error);
    };
  });
}

// 从IDB读取单条
async function idbGet(key) {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => {
      resolve(req.result ? req.result.value : null);
    };
    req.onerror = () => resolve(null);
  });
}

// IDB写入【真正等待事务完成】
async function idbSet(key, value) {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ key, value });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}

// IDB删除key
async function idbRemove(key) {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}

// IDB清空全部
async function idbClearAll() {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}

/**
 * 自动迁移：把 localStorage 全部键值迁移进 IndexedDB
 */
async function migrateLocalStorageToIDB() {
  if (migrateDone) return;
  try {
    if (!window.localStorage) {
      migrateDone = true;
      return;
    }
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      let val;
      try {
        val = JSON.parse(raw);
      } catch {
        val = raw;
      }
      await idbSet(k, val);
      memoryCache[k] = val;
    }
  } catch (e) {
    console.warn("localStorage迁移发生异常", e);
  }
  migrateDone = true;
}

// 启动初始化迁移，后台执行不阻塞页面渲染
(async function bootstrapMigrate() {
  await migrateLocalStorageToIDB();
})();

export const Store = {
  /**
   * 读取数据【对外接口完全不变，上层代码无需改动】
   * @param {string} key
   * @param {any} defaultValue
   * @returns {any}
   */
  get(key, defaultValue = null) {
    // 优先返回内存缓存，模拟同步行为，兼容旧业务
    if (Object.prototype.hasOwnProperty.call(memoryCache, key)) {
      const v = memoryCache[key];
      return v === null ? defaultValue : v;
    }
    // 同步读不到，后台异步去IDB拉取更新缓存；本次返回默认兜底
    (async () => {
      const val = await idbGet(key);
      memoryCache[key] = val;
    })();
    // 兜底降级读取旧localStorage
    try {
      const raw = localStorage.getItem(key);
      if(raw !== null){
        const parsed = JSON.parse(raw);
        memoryCache[key] = parsed;
        return parsed;
      }
    } catch(err) {
      // ignore
    }
    return defaultValue;
  },

  /**
   * 原有同步set，不等待IDB完成，旧业务继续使用
   * @param {string} key
   * @param {any} value
   * @returns {boolean}
   */
  set(key, value) {
    memoryCache[key] = value;
    // 后台异步写入IndexedDB，不阻塞UI逻辑
    (async () => {
      await idbSet(key, value);
    })();
    try {
      const raw = JSON.stringify(value);
      localStorage.setItem(key, raw);
    } catch(err) {
      console.warn(`localStorage写入超限，仅使用IndexedDB存储 key=${key}`);
    }
    return true;
  },

  /**
   * ✅新增：关键业务【等待IndexedDB写入完成再返回】，头像/昵称修改业务使用
   * @param {string} key
   * @param {any} value
   * @returns {Promise<boolean>}
   */
  async setAsync(key, value) {
    memoryCache[key] = value;
    let localOk = true;
    try {
      const raw = JSON.stringify(value);
      localStorage.setItem(key, raw);
    } catch(err) {
      localOk = false;
      console.warn(`localStorage写入超限，仅使用IndexedDB存储 key=${key}`);
    }
    const idbOk = await idbSet(key, value);
    return idbOk || localOk;
  },

  /**
   * 删除一条
   * @param {string} key
   */
  remove(key) {
    delete memoryCache[key];
    (async () => {
      await idbRemove(key);
    })();
    try {
      localStorage.removeItem(key);
    } catch (e) { /* ignore */ }
  },

  /**
   * 清空全部存储
   */
  clearAll() {
    memoryCache = {};
    (async () => {
      await idbClearAll();
    })();
    try {
      localStorage.clear();
    } catch (e) { /* ignore */ }
  }
};
