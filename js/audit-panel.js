import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

const ACTION_META = {
  add:      { label: "新增", color: "var(--color-main)" },
  delete:   { label: "删除", color: "#ff3b30" },
  disable:  { label: "禁用", color: "#ff9500" },
  move:     { label: "迁移", color: "#0a84ff" },
  restore:  { label: "恢复", color: "#af52de" }
};

const AuditPanelModule = {
  panelEl: null,
  activeTab: "pending",
  // 【修复】提升到顶层，不要open()的时候重置，解决添加字卡渲染丢失
  selectedIds: new Set(),
  _selectedCards: new Set(),
  searchKeyword: "",
  _cardSearch: "",
  lastSwitchAt: 0,

  floatBallEl: null,
  _isDraggingBall: false,
  _dragStartX: 0,
  _dragStartY: 0,
  _ballStartX: 0,
  _ballStartY: 0,
  _dragMoved: false,
  _touchSlop: 8,

  init() {
    EventBus.on("open‑panel", (payload) => {
      if (payload && payload.panel === "audit") this.open();
    });
    EventBus.on("themeChange", () => {
      if (this.panelEl) this.render(this.panelEl.firstElementChild);
      this.updateFloatBallStyle();
    });
    EventBus.on("my‑audit‑data‑updated", () => {
      if (this.panelEl) this.render(this.panelEl.firstElementChild);
    });
    this.initFloatBall();
  },

  // ========== 悬浮球【修复】弹窗关闭不会销毁悬浮球，只有配置开关关闭才销毁 ==========
  initFloatBall() {
    const cfg = AuditCardModule.auditConfig.floatBall;
    const forceShow = new URLSearchParams(location.search).get("show_audit") === "true";
    if (!cfg.enable && !forceShow) {
      if(this.floatBallEl) this.floatBallEl.remove();
      this.floatBallEl = null;
      return;
    }
    if(this.floatBallEl){
      this.updateFloatBallStyle();
      return;
    }

    const ball = document.createElement("div");
    ball.style.cssText = `
      position:fixed;right:16px;bottom:80px;width:${cfg.size}px;height:${cfg.size}px;
      border-radius:50%;background:${cfg.color || "#7c68ee"};
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:bold;cursor:pointer;z-index:9998;
      transform:translate3d(0,0,0);will-change:transform;
      user-select:none;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.15);
      touch-action:manipulation;
    `;
    if (cfg.avatarBase64) {
      ball.innerHTML = `<img src="${cfg.avatarBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      ball.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${cfg.size*0.5}" height="${cfg.size*0.5}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    }
    if (cfg.posX != null && cfg.posY != null) {
      ball.style.transform = `translate3d(${cfg.posX}px, ${cfg.posY}px, 0)`;
    }

    let downX = 0, downY = 0;
    const startDrag = (clientX, clientY) => {
      this._isDraggingBall = true;
      this._dragMoved = false;
      downX = clientX;
      downY = clientY;
      const rect = ball.getBoundingClientRect();
      this._ballStartX = rect.left;
      this._ballStartY = rect.top;
    };
    const moveDrag = (clientX, clientY) => {
      if (!this._isDraggingBall) return;
      const dx = clientX - downX;
      const dy = clientY - downY;
      if(Math.hypot(dx, dy) > this._touchSlop) this._dragMoved = true;
      const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const size = parseFloat(getComputedStyle(ball).width);
      let x = this._ballStartX + dx;
      let y = this._ballStartY + dy;
      x = Math.max(0, Math.min(vw - size, x));
      y = Math.max(0, Math.min(vh - size, y));
      ball.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const endDrag = () => {
      if (!this._isDraggingBall) return;
      if (!this._dragMoved) {
        this.open();
      }else{
        const rect = ball.getBoundingClientRect();
        AuditCardModule.auditConfig.floatBall.posX = rect.left;
        AuditCardModule.auditConfig.floatBall.posY = rect.top;
        AuditCardModule.saveToStorage();
      }
      this._isDraggingBall = false;
    };

    ball.addEventListener("mousedown", e => startDrag(e.clientX, e.clientY));
    document.addEventListener("mousemove", e=>moveDrag(e.clientX,e.clientY));
    document.addEventListener("mouseup", endDrag);

    ball.addEventListener("touchstart", e => {
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    }, { passive:true });
    document.addEventListener("touchmove", e=>{
      if(!this._isDraggingBall) return;
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }, { passive:false });
    document.addEventListener("touchend", endDrag);

    document.body.appendChild(ball);
    this.floatBallEl = ball;
  },

  updateFloatBallStyle() {
    const cfg = AuditCardModule.auditConfig.floatBall;
    const forceShow = new URLSearchParams(location.search).get("show_audit") === "true";
    if (!cfg.enable && !forceShow) {
      if(this.floatBallEl) this.floatBallEl.remove();
      this.floatBallEl = null;
      return;
    }
    if (!this.floatBallEl) {
      this.initFloatBall();
      return;
    }
    this.floatBallEl.style.width = cfg.size + "px";
    this.floatBallEl.style.height = cfg.size + "px";
    this.floatBallEl.style.background = cfg.color;
    if(cfg.avatarBase64){
      this.floatBallEl.innerHTML = `<img src="${cfg.avatarBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    }else{
      this.floatBallEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${cfg.size*0.5}" height="${cfg.size*0.5}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    }
  },

  // ========== 弹窗基础【修复】open不再重置 _selectedCards / _cardSearch ==========
  open() {
    if (this.panelEl) this.close();
    this.selectedIds = new Set();
    // 【重点】不再重置 _selectedCards、_cardSearch，字卡库状态保留
    const mask = document.createElement("div");
    mask.style.cssText = `
      position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.45);z-index:9999;padding:12px;box-sizing:border-box;
      -webkit-overflow-scrolling:touch;
    `;
    const box = document.createElement("div");
    box.style.cssText = `
      width:100%;max-width:460px;max-height:86vh;display:flex;flex-direction:column;
      background:var(--color-bg);border-radius:18px;overflow:hidden;
      box-shadow:0 12px 40px rgba(0,0,0,0.25);box-sizing:border-box;
      accent-color:var(--color-main);
    `;
    mask.appendChild(box);
    document.body.appendChild(mask);
    this.panelEl = mask;

    this.render(box);
    this.bindMaskClose(mask);
    if (!('ontouchstart' in window)) {
      document.addEventListener("keydown", this._escHandler);
    }
  },

  close() {
    if (this.panelEl) {
      this.panelEl.remove();
      this.panelEl = null;
    }
    if (!('ontouchstart' in window)) {
      document.removeEventListener("keydown", this._escHandler);
    }
    // ⚠️ close()绝对不碰悬浮球实例，悬浮球只受配置开关控制！
  },

  _escHandler: (e) => {
    if (e.key === "Escape") AuditPanelModule.close();
  },

  bindMaskClose(mask) {
    mask.onclick = (e) => {
      if (e.target === mask) this.close();
    };
  },

  // ========== 主渲染 ==========
  render(box) {
    const tabs = [
      { key: "pending",     name: "待审核", count: AuditCardModule.pendingApply.length },
      { key: "history",     name: "历史档案", count: AuditCardModule.auditHistory.length },
      { key: "cardlib",     name: "字卡库", count: AuditCardModule.getAuditCardCount() },
      { key: "settings",    name: "设置", count: 0 }
    ];

    const tabBar = document.createElement("div");
    tabBar.style.cssText = `
      display:flex;gap:6px;padding:12px 12px 0;flex-wrap:wrap;flex-shrink:0;
      border-bottom:1px solid var(--color-border);
    `;
    tabs.forEach(t => {
      const btn = document.createElement("button");
      const active = this.activeTab === t.key;
      btn.innerHTML = `${t.name}${t.count > 0 ? `<span style="margin-left:4px;font-size:11px;opacity:0.8">${t.count}</span>` : ""}`;
      btn.dataset.tab = t.key;
      btn.style.cssText = `
        flex:1;padding:8px 4px;border:none;border-radius:999px;cursor:pointer;
        font-size:13px;min-height:36px;touch-action:manipulation;
        ${active
          ? "background:var(--color-main);color:#fff"
          : "background:transparent;color:var(--color-text);border:1px solid var(--color-border)"}
      `;
      btn.onclick = () => {
        const now = Date.now();
        if (now - this.lastSwitchAt < 120) return;
        this.lastSwitchAt = now;
        this.activeTab = t.key;
        this.render(box);
      };
      tabBar.appendChild(btn);
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = `
      width:34px;height:34px;border:none;background:transparent;
      color:var(--color-text);font-size:22px;cursor:pointer;flex-shrink:0;
      touch-action:manipulation;
    `;
    closeBtn.onclick = () => this.close();
    tabBar.appendChild(closeBtn);

    const body = document.createElement("div");
    // 【修复滚动关键】flex子项增加 min‑height:0，允许收缩触发滚动
    body.style.cssText = `
      flex:1;
      display:flex;
      flex-direction:column;
      min-height:0;
      padding:0 12px 12px;
      box-sizing:border-box;
    `;

    box.innerHTML = "";
    box.appendChild(tabBar);
    box.appendChild(body);

    if (this.activeTab === "pending")  this.renderPending(body);
    if (this.activeTab === "history") this.renderHistory(body);
    if (this.activeTab === "cardlib")  this.renderCardLib(body);
    if (this.activeTab === "settings") this.renderSettings(body);
  },

  // ========== Tab1 待审核 ==========
  renderPending(body) {
    const list = AuditCardModule.pendingApply || [];

    const toolbar = document.createElement("div");
    toolbar.style.cssText = `
      display:flex;gap:6px;padding:12px 0;margin-bottom:8px;flex-wrap:wrap;align-items:center;
      flex-shrink:0;border-bottom:1px solid var(--color-border);
    `;
    const countTip = document.createElement("span");
    countTip.style.cssText = `font-size:12px;color:var(--color-text-2);margin-right:auto;`;
    countTip.textContent = `共 ${list.length} 条待审`;

    const checkAll = document.createElement("label");
    checkAll.style.cssText = `font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;`;
    const checkInput = document.createElement("input");
    checkInput.type = "checkbox";
    checkInput.checked = list.length > 0 && this.selectedIds.size === list.length;
    checkInput.onchange = () => {
      if (checkInput.checked) list.forEach(p => this.selectedIds.add(p.applyId));
      else this.selectedIds.clear();
      this.render(this.panelEl.firstElementChild);
    };
    checkAll.appendChild(checkInput);
    checkAll.appendChild(document.createTextNode("全选"));

    const agreeAll = document.createElement("button");
    agreeAll.textContent = "批量同意";
    agreeAll.style = "padding:8px 10px;border:none;border-radius:8px;background:var(--color-main);color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
    agreeAll.onclick = () => this.batchApprove("agree");

    const rejectAll = document.createElement("button");
    rejectAll.textContent = "批量驳回";
    rejectAll.style = "padding:8px 10px;border:none;border-radius:8px;background:#ff3b30;color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
    rejectAll.onclick = () => this.batchApprove("reject");

    toolbar.appendChild(countTip);
    toolbar.appendChild(checkAll);
    toolbar.appendChild(agreeAll);
    toolbar.appendChild(rejectAll);

    const listWrap = document.createElement("div");
    // 【修复】滚动容器统一css min‑height:0
    listWrap.style.cssText = `
      flex:1;
      overflow‑y:auto;
      min‑height:0;
      padding:0;
      scrollbar‑width:none;
    `;
    listWrap.style.setProperty("-webkit‑scrollbar","display:none");

    if (list.length === 0) {
      listWrap.innerHTML = `<div style="text-align:center;padding:30px 0;color:var(--color-text-2);font-size:13px">暂无待审申请</div>`;
    } else {
      list.forEach(item => {
        const meta = ACTION_META[item.action] || { label: item.action, color: "#888" };
        const card = document.createElement("div");
        card.style.cssText = `
          border:1px solid var(--color-border);border-radius:12px;padding:10px;margin-top:10px;
          box-sizing:border-box;
        `;
        const top = document.createElement("div");
        top.style.cssText = `display:flex;align-items:center;gap:6px;margin-bottom:6px;`;

        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = this.selectedIds.has(item.applyId);
        check.onchange = () => {
          if (check.checked) this.selectedIds.add(item.applyId);
          else this.selectedIds.delete(item.applyId);
        };

        const tag = document.createElement("span");
        tag.textContent = meta.label;
        tag.style.cssText = `
          padding:2px 8px;border-radius:999px;font-size:11px;color:#fff;
          background:${meta.color};
        `;

        const applicant = document.createElement("span");
        applicant.style.cssText = `font-size:11px;color:var(--color-text-2);margin-left:auto;`;
        applicant.textContent = item.applicant || "我";

        top.appendChild(check);
        top.appendChild(tag);
        top.appendChild(applicant);

        const text = document.createElement("div");
        text.style.cssText = `font-size:13px;margin:4px 0;white-space:pre-wrap;word-break:break-all;`;
        const actionText = {
          add: `申请新增字卡：「${item.cardText || "无文本"}」`,
          delete: `申请删除字卡：「${item.cardText || "无文本"}」`,
          disable: `申请禁用字卡：「${item.cardText || "无文本"}」`,
          restore: `申请恢复字卡：「${item.cardText || "无文本"}」`,
          move: `申请迁移字卡：「${item.cardText || "无文本"}」`
        };
        text.textContent = actionText[item.action] || item.cardText;

        const time = document.createElement("div");
        time.style.cssText = `font-size:11px;color:var(--color-text-2);`;
        time.textContent = new Date(item.lastApplyTime).toLocaleString();

        const remarkInput = document.createElement("input");
        remarkInput.placeholder = "审批备注（可选）";
        remarkInput.value = item.remark || "";
        remarkInput.style.cssText = `
          width:100%;box-sizing:border-box;margin:8px 0 6px;padding:8px 8px;
          border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);
          color:var(--color-text);font-size:12px;
        `;
        remarkInput.oninput = () => { item.remark = remarkInput.value; };

        const btns = document.createElement("div");
        btns.style.cssText = `display:flex;gap:8px;`;
        const agreeBtn = document.createElement("button");
        agreeBtn.textContent = "同意";
        agreeBtn.style = "flex:1;padding:9px;border:none;border-radius:8px;background:var(--color-main);color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
        agreeBtn.onclick = () => this.singleApprove(item, "agree", remarkInput.value);

        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "驳回";
        rejectBtn.style = "flex:1;padding:9px;border:none;border-radius:8px;background:#ff3b30;color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
        rejectBtn.onclick = () => this.singleApprove(item, "reject", remarkInput.value);

        btns.appendChild(agreeBtn);
        btns.appendChild(rejectBtn);

        card.appendChild(top);
        card.appendChild(text);
        card.appendChild(time);
        card.appendChild(remarkInput);
        card.appendChild(btns);
        listWrap.appendChild(card);
      });
    }

    body.appendChild(toolbar);
    body.appendChild(listWrap);
  },

  singleApprove(item, result, remark) {
    if (result === "agree") this.applyCardChange(item);
    AuditCardModule.approveApply(item.applyId, result, remark || "");
    this.selectedIds.delete(item.applyId);
    Toast.show(result === "agree" ? "已同意" : "已驳回");
    this.render(this.panelEl.firstElementChild);
  },

  batchApprove(result) {
    const list = AuditCardModule.pendingApply || [];
    const targets = list.filter(p => this.selectedIds.has(p.applyId));
    if (targets.length === 0) {
      Toast.show("请先勾选申请");
      return;
    }
    targets.forEach(item => {
      if (result === "agree") this.applyCardChange(item);
      AuditCardModule.approveApply(item.applyId, result, "");
    });
    this.selectedIds.clear();
    Toast.show(`已批量${result === "agree" ? "同意" : "驳回"} ${targets.length} 条`);
    this.render(this.panelEl.firstElementChild);
  },

  applyCardChange(item) {
    const M = AuditCardModule;
    const findCard = (text) => {
      const all = M.getAllAuditCards();
      return all.find(c => c.content === text);
    };

    switch (item.action) {
      case "add": {
        const catId = item.targetCatId || "default";
        const existed = findCard(item.cardText);
        if (!existed) {
          M.addCardToCategory(catId, {
            title: item.cardText.slice(0, 10),
            content: item.cardText,
            side: "bot"
          });
        }
        break;
      }
      case "delete": {
        const hit = findCard(item.cardText);
        if (hit) M.deleteCard(hit.categoryId, hit.id);
        break;
      }
      case "disable": {
        const hit = findCard(item.cardText);
        if (hit) M.updateCard(hit.categoryId, hit.id, { isDisabled: true });
        break;
      }
      case "restore": {
        const hit = findCard(item.cardText);
        if (hit) M.updateCard(hit.categoryId, hit.id, { isDisabled: false });
        break;
      }
      case "move": {
        const hit = findCard(item.cardText);
        if (hit && item.targetCatId && hit.categoryId !== item.targetCatId) {
          M.moveCard(hit.id, hit.categoryId, item.targetCatId);
        }
        break;
      }
    }
  },

  // ========== Tab2 历史档案 ==========
  renderHistory(body) {
    const list = AuditCardModule.auditHistory || [];

    const bar = document.createElement("div");
    bar.style.cssText = `
      display:flex;gap:8px;padding:12px 0;align-items:center;
      flex-shrink:0;border-bottom:1px solid var(--color-border);
      position:sticky;top:0;background:var(--color-bg);z-index:1;
    `;
    const search = document.createElement("input");
    search.placeholder = "搜索申请人 / 文本 / 类型";
    search.value = this.searchKeyword;
    search.style = "flex:1;padding:8px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;box-sizing:border-box;";
    search.oninput = () => {
      this.searchKeyword = search.value.trim();
      this.renderHistory(body);
    };

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "清空全部";
    clearBtn.style = "padding:8px 10px;border:none;border-radius:8px;background:#ff3b30;color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
    clearBtn.onclick = () => {
      if (!confirm("确定清空全部历史档案？此操作不可恢复")) return;
      AuditCardModule.auditHistory = [];
      AuditCardModule.saveToStorage();
      Toast.show("历史档案已清空");
      this.render(this.panelEl.firstElementChild);
    };

    bar.appendChild(search);
    bar.appendChild(clearBtn);

    const listWrap = document.createElement("div");
    listWrap.style.cssText = `
      flex:1;
      overflow‑y:auto;
      min‑height:0;
      padding:0 0 12px 0;
      scrollbar‑width:none;
    `;
    listWrap.style.setProperty("-webkit‑scrollbar","display:none");

    const kw = this.searchKeyword.toLowerCase();
    const filtered = list.filter(h => {
      if (!kw) return true;
      return [h.cardText, h.applicant, h.action, h.auditResult]
        .join(" ")
        .toLowerCase()
        .includes(kw);
    });

    if (filtered.length === 0) {
      listWrap.innerHTML = `<div style="text-align:center;padding:30px 0;color:var(--color-text-2);font-size:13px">暂无历史记录</div>`;
    } else {
      filtered.forEach(h => {
        const meta = ACTION_META[h.action] || { label: h.action, color: "#888" };
        const resultColor = h.auditResult === "agree" ? "var(--color-main)" : "#ff3b30";
        const row = document.createElement("div");
        row.style.cssText = `border:1px solid var(--color-border);border-radius:12px;padding:10px;margin-top:10px;box-sizing:border-box;`;
        row.innerHTML = `
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
            <span style="padding:2px 8px;border-radius:999px;font-size:11px;color:#fff;background:${meta.color}">${meta.label}</span>
            <span style="padding:2px 8px;border-radius:999px;font-size:11px;color:#fff;background:${resultColor}">${h.auditResult === "agree" ? "同意" : "驳回"}</span>
            <span style="font-size:11px;color:var(--color-text-2);margin-left:auto">${h.applicant || "我"}</span>
          </div>
          <div style="font-size:13px;white-space:pre-wrap;word-break:break-all;">${h.cardText || "（无文本）"}</div>
          <div style="font-size:11px;color:var(--color-text-2);margin-top:6px">
            申请 ${new Date(h.applyTime).toLocaleString()} ｜ 完成 ${new Date(h.auditFinishTime).toLocaleString()}
          </div>
          ${h.auditRemark ? `<div style="font-size:11px;color:var(--color-text-2);margin-top:4px">备注：${h.auditRemark}</div>` : ""}
        `;
        listWrap.appendChild(row);
      });
    }

    body.innerHTML = "";
    body.appendChild(bar);
    body.appendChild(listWrap);
  },

  // ========== Tab3 字卡库 ==========
  renderCardLib(body) {
    const M = AuditCardModule;
    const categories = M.getAuditCategories();
    const kw = this._cardSearch || "";
    const selectedCards = this._selectedCards || new Set();

    const head = document.createElement("div");
    head.style.cssText = `
      padding:12px 0;flex-shrink:0;border-bottom:1px solid var(--color-border);
      display:flex;flex-direction:column;gap:8px;
    `;
    const searchInput = document.createElement("input");
    searchInput.placeholder = "搜索字卡内容...";
    searchInput.value = kw;
    searchInput.style.cssText = `
      width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--color-border);
      border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;
    `;
    searchInput.oninput = () => {
      this._cardSearch = searchInput.value.trim();
      this.renderCardLib(body);
    };

    const textarea = document.createElement("textarea");
    textarea.rows = 3;
    textarea.placeholder = "逐行输入字卡，每行一条，可批量添加或提交审核";
    textarea.style.cssText = `
      width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--color-border);
      border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;resize:none;
    `;

    const opRow = document.createElement("div");
    opRow.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;";

    const catSelect = document.createElement("select");
    categories.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      catSelect.appendChild(opt);
    });
    catSelect.style.cssText = "padding:6px 8px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;";

    const batchAddBtn = document.createElement("button");
    batchAddBtn.textContent = "批量添加";
    batchAddBtn.style = "flex:1;padding:8px;border:none;border-radius:8px;background:var(--color-main);color:#fff;font-size:12px;cursor:pointer;";
    batchAddBtn.onclick = () => {
      const lines = textarea.value.split(/\r?\n/).map(s => s.trim()).filter(s => !!s);
      if (lines.length === 0) { Toast.show("请输入字卡内容"); return; }
      const catId = catSelect.value;
      lines.forEach(line => M.addCardToCategory(catId, { content: line }));
      Toast.show(`已添加 ${lines.length} 张字卡`);
      textarea.value = "";
      this.renderCardLib(body);
    };

    const submitAuditBtn = document.createElement("button");
    submitAuditBtn.textContent = "提交审核";
    submitAuditBtn.style = "flex:1;padding:8px;border:1px solid var(--color-main);border-radius:8px;background:transparent;color:var(--color-main);font-size:12px;cursor:pointer;";
    submitAuditBtn.onclick = () => {
      const lines = textarea.value.split(/\r?\n/).map(s => s.trim()).filter(s => !!s);
      if (lines.length === 0) { Toast.show("请输入字卡内容"); return; }
      lines.forEach(line => M.createPendingApply("add", { cardText: line, targetCatId: catSelect.value }, "我"));
      Toast.show(`已提交 ${lines.length} 条审核申请`);
      textarea.value = "";
      this.renderCardLib(body);
    };

    opRow.appendChild(catSelect);
    opRow.appendChild(batchAddBtn);
    opRow.appendChild(submitAuditBtn);

    head.appendChild(searchInput);
    head.appendChild(textarea);
    head.appendChild(opRow);

    // 批量操作栏
    const batchBar = document.createElement("div");
    batchBar.style.cssText = `
      display:flex;gap:6px;padding:10px 0;flex-wrap:wrap;align-items:center;
      font-size:12px;border-bottom:1px solid var(--color-border);flex-shrink:0;
    `;
    const allCheck = document.createElement("label");
    allCheck.style.cssText = "display:flex;align-items:center;gap:4px;cursor:pointer;";
    const allCheckInput = document.createElement("input");
    allCheckInput.type = "checkbox";
    const allCards = M.getAllAuditCards();
    const filteredCards = kw
      ? allCards.filter(c => c.content.toLowerCase().includes(kw.toLowerCase()))
      : allCards;
    allCheckInput.checked = filteredCards.length > 0 && filteredCards.every(c => this._selectedCards.has(c.id));
    allCheckInput.onchange = () => {
      if (allCheckInput.checked) filteredCards.forEach(c => this._selectedCards.add(c.id));
      else this._selectedCards.clear();
      this.renderCardLib(body);
    };
    allCheck.appendChild(allCheckInput);
    allCheck.appendChild(document.createTextNode("全选"));

    const dedupBtn = document.createElement("button");
    dedupBtn.textContent = "一键去重";
    dedupBtn.style = "padding:5px 8px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);color:var(--color-text);font-size:11px;cursor:pointer;";
    dedupBtn.onclick = () => {
      const catId = categories[0]?.id;
      if (!catId) return;
      const count = M.deduplicateCategory(catId);
      Toast.show(`去重完成，剩余 ${count} 张`);
      this.renderCardLib(body);
    };

    // 批量转移分组
    const moveWrap = document.createElement("span");
    moveWrap.style.cssText = "display:flex;gap:4px;align-items:center;";
    const moveSel = document.createElement("select");
    categories.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      moveSel.appendChild(opt);
    });
    moveSel.style.fontSize = "11px";
    const moveBtn = document.createElement("button");
    moveBtn.textContent = "批量转移";
    moveBtn.style = "padding:4px 7px;border:none;border-radius:6px;background:var(--color-main);color:#fff;font-size:11px;cursor:pointer;";
    moveBtn.onclick = ()=>{
      const targetCat = moveSel.value;
      const selArr = Array.from(this._selectedCards);
      if(!selArr.length){Toast.show("请勾选字卡");return;}
      selArr.forEach(cardId=>{
        const info = allCards.find(x=>x.id===cardId);
        if(info && info.categoryId !== targetCat){
          M.moveCard(cardId, info.categoryId, targetCat);
        }
      });
      this._selectedCards.clear();
      Toast.show(`已批量转移${selArr.length}张`);
      this.renderCardLib(body);
    };
    moveWrap.appendChild(moveSel);
    moveWrap.appendChild(moveBtn);

    const newCatBtn = document.createElement("button");
    newCatBtn.textContent = "+ 新建分类";
    newCatBtn.style = "padding:5px 8px;border:none;border-radius:6px;background:var(--color-main);color:#fff;font-size:11px;cursor:pointer;margin-left:auto;";
    newCatBtn.onclick = () => {
      const name = prompt("输入分类名称");
      if (!name) return;
      M.addCategory(name.trim());
      Toast.show("分类已创建");
      this.renderCardLib(body);
    };

    batchBar.appendChild(allCheck);
    batchBar.appendChild(dedupBtn);
    batchBar.appendChild(moveWrap);
    batchBar.appendChild(newCatBtn);

    const listWrap = document.createElement("div");
    listWrap.style.cssText = `
      flex:1;
      overflow‑y:auto;
      min‑height:0;
      padding:0 0 12px;
      scrollbar‑width:none;
    `;
    listWrap.style.setProperty("-webkit‑scrollbar","display:none");

    if (categories.length === 0) {
      listWrap.innerHTML = `<div style="text-align:center;padding:24px 0;color:var(--color-text-2);font-size:13px">暂无分类</div>`;
    } else {
      categories.forEach(cat => {
        const catEl = document.createElement("div");
        catEl.style.cssText = `
          border:1px solid var(--color-border);border-radius:12px;margin-bottom:10px;overflow:hidden;
          ${cat.isDisabled ? "opacity:0.6;" : ""}
        `;

        const catHead = document.createElement("div");
        catHead.style.cssText = `
          padding:8px 10px;display:flex;align-items:center;gap:6px;
          background:color-mix(in srgb, var(--color-main) 8%, transparent);
          font-size:13px;font-weight:bold;color:var(--color-text);
        `;
        const expandBtn = document.createElement("span");
        expandBtn.textContent = cat.expanded ? "▼" : "▶";
        expandBtn.style.cssText = "cursor:pointer;font-size:11px;";
        expandBtn.onclick = () => {
          M.toggleCategoryExpand(cat.id);
          this.renderCardLib(body);
        };

        const catDisableCheck = document.createElement("input");
        catDisableCheck.type = "checkbox";
        catDisableCheck.checked = !cat.isDisabled;
        catDisableCheck.onchange = ()=>{
          M.toggleCategoryDisable(cat.id, !catDisableCheck.checked);
          this.renderCardLib(body);
        };

        const catName = document.createElement("span");
        catName.textContent = `${cat.name} (${cat.cards.length})`;
        catName.style.flex = "1";

        const upBtn = document.createElement("button");
        upBtn.textContent = "↑";
        upBtn.style = "padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);font-size:11px;cursor:pointer;";
        upBtn.onclick = () => { M.moveCategorySort(cat.id, "up"); this.renderCardLib(body); };

        const downBtn = document.createElement("button");
        downBtn.textContent = "↓";
        downBtn.style = "padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);font-size:11px;cursor:pointer;";
        downBtn.onclick = () => { M.moveCategorySort(cat.id, "down"); this.renderCardLib(body); };

        const renameBtn = document.createElement("button");
        renameBtn.textContent = "重命名";
        renameBtn.style = "padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);font-size:11px;cursor:pointer;";
        renameBtn.onclick = () => {
          const name = prompt("输入新名称", cat.name);
          if (name) { M.renameCategory(cat.id, name.trim()); this.renderCardLib(body); }
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "删除";
        delBtn.style = "padding:2px 6px;border:1px solid #ff3b30;border-radius:4px;background:transparent;color:#ff3b30;font-size:11px;cursor:pointer;";
        delBtn.onclick = () => {
          const targetId = prompt("删除后卡片将转移到目标分类ID，输入目标分类ID：", "default");
          if (!targetId) return;
          if (M.deleteCategory(cat.id, targetId.trim())) {
            Toast.show("分类已删除");
            this.renderCardLib(body);
          }
        };

        catHead.appendChild(expandBtn);
        catHead.appendChild(catDisableCheck);
        catHead.appendChild(catName);
        catHead.appendChild(upBtn);
        catHead.appendChild(downBtn);
        catHead.appendChild(renameBtn);
        catHead.appendChild(delBtn);
        catEl.appendChild(catHead);

        if (cat.expanded) {
  const cardList = document.createElement("div");
  cardList.style.cssText = "padding:6px 10px;";
  const showCards = kw
    ? cat.cards.filter(c => c.content.toLowerCase().includes(kw.toLowerCase()))
    : cat.cards;

  if (showCards.length === 0) {
    cardList.innerHTML = `<div style="text-align:center;padding:10px 0;color:var(--color-text-2);font-size:12px">该分类暂无匹配字卡</div>`;
  } else {
    showCards.forEach(card => {
      const cardEl = document.createElement("div");
      cardEl.style.cssText = `
        padding:8px;border:1px solid var(--color-border);border-radius:8px;margin-bottom:6px;
        ${card.isDisabled ? "opacity:0.5;text-decoration:line-through;" : ""}
        display:flex;align-items:flex-start;gap:6px;
      `;
      const ck = document.createElement("input");
      ck.type = "checkbox";
      ck.style.cssText = "margin-top:2px";
      ck.checked = this._selectedCards.has(card.id);
      ck.onchange = ()=>{
        if(ck.checked) this._selectedCards.add(card.id);
        else this._selectedCards.delete(card.id);
      };

      const textwrap = document.createElement("div");
      textwrap.style.cssText = "flex:1;min-width:0;";
      textwrap.innerHTML = `
        <div style="font-size:12px;color:var(--color-text-2);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
          ${card.content}
        </div>
      `;

      const ops = document.createElement("div");
      ops.style.cssText = "display:flex;gap:4px;flex-wrap:wrap;";

      const sendBtn = document.createElement("button");
      sendBtn.textContent = "发送";
      sendBtn.style.cssText = "padding:3px 6px;border:none;border-radius:4px;background:var(--color-main);color:#fff;font-size:11px;cursor:pointer;";
      sendBtn.onclick = () => M.sendCardToChat(card);

      const copyBtn = document.createElement("button");
      copyBtn.textContent = "复制";
      copyBtn.style.cssText = "padding:3px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);color:var(--color-text);font-size:11px;cursor:pointer;";
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(card.content);
        Toast.show("已复制");
      };

      const editBtn = document.createElement("button");
      editBtn.textContent = "编辑";
      editBtn.style.cssText = "padding:3px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);color:var(--color-text);font-size:11px;cursor:pointer;";

      const delBtn = document.createElement("button");
      delBtn.textContent = "删除";
      delBtn.style.cssText = "padding:3px 6px;border:none;border-radius:4px;background:#ff3b30;color:#fff;font-size:11px;cursor:pointer;";
      delBtn.onclick = () => {
        if(!confirm("确定删除这张字卡？")) return;
        M.deleteCard(cat.id, card.id);
        Toast.show("已删除");
        this.renderCardLib(body);
      };

      ops.appendChild(sendBtn);
      ops.appendChild(copyBtn);
      ops.appendChild(editBtn);
      ops.appendChild(delBtn);

      cardEl.appendChild(ck);
      cardEl.appendChild(textwrap);
      cardEl.appendChild(ops);
      cardList.appendChild(cardEl);
    }); // 【重点！这里是forEach的闭合，很多人漏这个}
  }
  catEl.appendChild(cardList);
}
listWrap.appendChild(catEl);
      });
    }

    body.innerHTML = "";
    body.appendChild(head);
    body.appendChild(batchBar);
    body.appendChild(listWrap);
  },

  // ========== Tab4 设置【修复布局；删除梦角昵称输入；滑块touch‑action；输入框右对齐】 ==========
  renderSettings(body) {
    const M = AuditCardModule;
    const cfg = M.auditConfig;
    const engine = cfg.dreamEngine;
    const float = cfg.floatBall;

    const sectionTitle = (text) => {
      const el = document.createElement("div");
      el.style.cssText = "font-weight:bold;font-size:13px;margin:14px 0 8px;color:var(--color-text);";
      el.textContent = text;
      return el;
    };

    const toggle = (label, checked, onChange) => {
      const wrap = document.createElement("label");
      wrap.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;cursor:pointer;";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = checked;
      input.onchange = () => onChange(input.checked);
      wrap.appendChild(input);
      wrap.appendChild(document.createTextNode(label));
      return wrap;
    };

    const numberInputMinute = (label, secValue, onChangeSec) => {
      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;";
      const span = document.createElement("span");
      span.style.cssText = "width:110px;flex:0 0 110px;color:var(--color-text-2);";
      span.textContent = label;
      const input = document.createElement("input");
      input.type = "number";
      input.value = Math.round(secValue / 60);
      input.style = "flex:1;padding:7px 8px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;box-sizing:border-box;";
      input.onchange = () => onChangeSec(Number(input.value)*60);
      wrap.appendChild(span);
      wrap.appendChild(input);
      return wrap;
    };

    const numberInputRaw = (label, value, onChange) => {
      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;";
      const span = document.createElement("span");
      span.style.cssText = "width:110px;flex:0 0 110px;color:var(--color-text-2);";
      span.textContent = label;
      const input = document.createElement("input");
      input.type = "number";
      input.value = value;
      input.style = "flex:1;padding:7px 8px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;box-sizing:border-box;";
      input.onchange = () => onChange(Number(input.value));
      wrap.appendChild(span);
      wrap.appendChild(input);
      return wrap;
    };

    body.style.padding = "16px 18px";
    body.style.overflowY = "auto";
    body.style.minHeight = "0";
    body.style.scrollbarWidth = "none";
    body.style.setProperty("-webkit-scrollbar","display:none");

    // --------悬浮球设置--------
    body.appendChild(sectionTitle("悬浮球"));
    body.appendChild(toggle("启用悬浮球", float.enable, v => {
      float.enable = v;
      M.saveToStorage();
      this.updateFloatBallStyle();
    }));

    const colorRow = document.createElement("div");
    colorRow.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;";
    colorRow.innerHTML = `<span style="width:110px;flex:0 0 110px;color:var(--color-text-2)">悬浮球颜色</span>`;
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = float.color;
    colorInput.style.cssText = "width:40px;height:28px;border:none;padding:0;cursor:pointer;";
    colorInput.oninput = () => {
      float.color = colorInput.value;
      M.saveToStorage();
      this.updateFloatBallStyle();
    };
    const resetColorBtn = document.createElement("button");
    resetColorBtn.textContent = "恢复默认";
    resetColorBtn.style = "padding:4px 8px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);font-size:11px;cursor:pointer;margin-left:auto;";
    resetColorBtn.onclick = () => {
      float.color = "#7c68ee";
      colorInput.value = float.color;
      M.saveToStorage();
      this.updateFloatBallStyle();
    };
    colorRow.appendChild(colorInput);
    colorRow.appendChild(resetColorBtn);
    body.appendChild(colorRow);

    const sizeRow = document.createElement("div");
    sizeRow.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;";
    sizeRow.innerHTML = `<span style="width:110px;flex:0 0 110px;color:var(--color-text-2)">大小 ${float.size}px</span>`;
    const sizeSlider = document.createElement("input");
    sizeSlider.type = "range";
    sizeSlider.min = 32;
    sizeSlider.max = 80;
    sizeSlider.value = float.size;
    sizeSlider.style.width = "140px";
    sizeSlider.style.touchAction = "none";
    sizeSlider.oninput = () => {
      float.size = Number(sizeSlider.value);
      sizeRow.querySelector("span").textContent = `大小 ${float.size}px`;
      M.saveToStorage();
      this.updateFloatBallStyle();
    };
    const resetSizeBtn = document.createElement("button");
    resetSizeBtn.textContent = "恢复默认";
    resetSizeBtn.style = "padding:4px 8px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);font-size:11px;cursor:pointer;margin-left:auto;";
    resetSizeBtn.onclick = () => {
      float.size = 48;
      sizeSlider.value = 48;
      sizeRow.querySelector("span").textContent = `大小 48px`;
      M.saveToStorage();
      this.updateFloatBallStyle();
    };
    sizeRow.appendChild(sizeSlider);
    sizeRow.appendChild(resetSizeBtn);
    body.appendChild(sizeRow);

    // 头像上传
    const avatarRow = document.createElement("div");
    avatarRow.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;";
    avatarRow.innerHTML = `<span style="width:110px;flex:0 0 110px;color:var(--color-text-2)">自定义头像</span>`;
    const avatarPreview = document.createElement("div");
    avatarPreview.style.cssText = `
      width:40px;height:40px;border-radius:50%;overflow:hidden;border:1px solid var(--color-border);
      background:#eee;
    `;
    if (float.avatarBase64) {
      avatarPreview.innerHTML = `<img src="${float.avatarBase64}" style="width:100%;height:100%;object-fit:cover;">`;
    }
    const uploadBtn = document.createElement("button");
    uploadBtn.textContent = "上传";
    uploadBtn.style = "padding:4px 8px;border:1px solid var(--color-main);border-radius:6px;background:transparent;color:var(--color-main);font-size:11px;cursor:pointer;";
    uploadBtn.onclick = () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.onchange = (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const size = 128;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
            ctx.clip();
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide)/2;
            const sy = (img.height - minSide)/2;
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
            float.avatarBase64 = canvas.toDataURL("image/png");
            M.saveToStorage();
            Toast.show("头像已更新");
            this.renderSettings(body);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        fileInput.remove();
      };
      fileInput.click();
    };
    const resetAvatarBtn = document.createElement("button");
    resetAvatarBtn.textContent = "恢复默认";
    resetAvatarBtn.style = "padding:4px 8px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);font-size:11px;cursor:pointer;margin-left:auto;";
    resetAvatarBtn.onclick = () => {
      float.avatarBase64 = "";
      M.saveToStorage();
      Toast.show("已恢复默认头像");
      this.renderSettings(body);
    };
    avatarRow.appendChild(avatarPreview);
    avatarRow.appendChild(uploadBtn);
    avatarRow.appendChild(resetAvatarBtn);
    body.appendChild(avatarRow);

    // 引擎设置
    body.appendChild(sectionTitle("梦角拟人引擎"));
    body.appendChild(toggle("抓取聊天生成申请", engine.enableGrabChat, v => { engine.enableGrabChat = v; M.saveToStorage(); }));
    body.appendChild(toggle("混沌随机变更", engine.enableChaos, v => { engine.enableChaos = v; M.saveToStorage(); }));
    body.appendChild(toggle("主动发消息", engine.enableActiveSend, v => { engine.enableActiveSend = v; M.saveToStorage(); }));

    body.appendChild(sectionTitle("引擎参数（UI单位：分钟，存储：秒）"));
    body.appendChild(numberInputMinute("巡检周期", engine.scanIntervalSec, v => { engine.scanIntervalSec = v; M.saveToStorage(); }));
    body.appendChild(numberInputRaw("基础触发概率", engine.baseProb, v => { engine.baseProb = v; M.saveToStorage(); }));
    body.appendChild(numberInputRaw("情绪命中概率", engine.emotionProb, v => { engine.emotionProb = v; M.saveToStorage(); }));
    body.appendChild(numberInputRaw("混沌操作概率", engine.chaosProb, v => { engine.chaosProb = v; M.saveToStorage(); }));
    body.appendChild(numberInputRaw("待审上限", engine.pendingMax, v => { engine.pendingMax = v; M.saveToStorage(); }));
    body.appendChild(numberInputMinute("冷却时间", engine.applyCoolDownMs/1000, v => { engine.applyCoolDownMs = v*1000; M.saveToStorage(); }));

    // 【删除】梦角昵称输入框

    body.appendChild(sectionTitle("通知与调试"));
    body.appendChild(toggle("浏览器通知", cfg.notification.enable, v => { cfg.notification.enable = v; M.saveToStorage(); }));
    body.appendChild(toggle("debug 日志", cfg.debug, v => { cfg.debug = v; M.saveToStorage(); }));

    body.appendChild(sectionTitle("数据导入导出"));
    const exportBtn = document.createElement("button");
    exportBtn.textContent = "导出 JSON";
    exportBtn.style = "width:100%;padding:10px;margin-bottom:8px;border:none;border-radius:8px;background:var(--color-main);color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
    exportBtn.onclick = () => {
      const data = {
        customCards: M.cardGroups.custom.list,
        auditReportCategories: M.cardGroups.auditReport.categories,
        pendingApply: M.pendingApply,
        auditHistory: M.auditHistory,
        auditConfig: M.auditConfig,
        exportTime: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `audit-backup-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const importBtn = document.createElement("button");
    importBtn.textContent = "导入 JSON";
    importBtn.style = "width:100%;padding:10px;border:none;border-radius:8px;border:1px solid var(--color-border);background:transparent;color:var(--color-text);font-size:12px;cursor:pointer;touch-action:manipulation;";
    importBtn.onclick = () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "application/json";
      fileInput.onchange = () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            if (!confirm("导入将覆盖当前字卡、待审与历史数据，确定继续？")) return;
            M.cardGroups.custom.list = data.customCards || [];
            M.cardGroups.auditReport.categories = data.auditReportCategories || [
              { id: "default", name: "默认分类", sort: 0, isDisabled: false, expanded: true, cards: [] }
            ];
            M.pendingApply = data.pendingApply || [];
            M.auditHistory = data.auditHistory || [];
            if (data.auditConfig) M.auditConfig = { ...M.auditConfig, ...data.auditConfig };
            M.saveToStorage();
            Toast.show("导入成功");
            this.renderSettings(body);
          } catch (e) {
            Toast.show("导入失败：文件格式错误");
            console.error(e);
          }
        };
        reader.readAsText(file);
        fileInput.remove();
      };
      fileInput.click();
    };

    body.appendChild(exportBtn);
    body.appendChild(importBtn);
  }
};

window.AuditPanelModule = AuditPanelModule;
AuditPanelModule.init();
export { AuditPanelModule };
