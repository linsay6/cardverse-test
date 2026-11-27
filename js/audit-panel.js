import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

const ACTION_META = {
  add:      { label: "新增", color: "var(--color-main)" },
  delete:   { label: "删除", color: "#ff3b30" },
  disable:  { label: "禁用", color: "#ff9500" },
  move:     { label: "迁移", color: "#0a84ff" },
  restore:  { label: "恢复", color: "#af52de" }
};
/**
 /**
 * 【公共导出函数】审核报告字卡列表渲染
 * @param {HTMLElement} rootEl 目标容器DOM
 * @param {Object} M AuditCardModule 实例
 * @param {Set} selectedCards 选中卡片ID集合
 * @param {string} searchKeyword 搜索关键词
 * @param {Function} onStateChange 状态变更回调，返回{selectedCards,searchKeyword}
 */
function renderAuditCardLibContainer(rootEl, M, selectedCards, searchKeyword, onStateChange) {
  const categories = M.getAuditCategories();
  const kw = searchKeyword || "";

  rootEl.innerHTML = "";

  // 头部搜索+批量输入区
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
    onStateChange({ selectedCards, searchKeyword: searchInput.value.trim() });
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
  batchAddBtn.style.cssText = "flex:1;padding:8px;border:none;border-radius:8px;background:var(--color-main);color:#fff;font-size:12px;cursor:pointer;";
  batchAddBtn.onclick = () => {
    const lines = textarea.value.split(/\r?\n/).map(s => s.trim()).filter(s => !!s);
    if (lines.length === 0) { Toast.show("请输入字卡内容"); return; }
    const catId = catSelect.value;
    lines.forEach(line => M.addCardToCategory(catId, { content: line }));
    Toast.show(`已添加 ${lines.length} 张字卡`);
    textarea.value = "";
    onStateChange({ selectedCards: new Set(), searchKeyword: searchInput.value.trim() });
  };

  const submitAuditBtn = document.createElement("button");
  submitAuditBtn.textContent = "提交审核";
  submitAuditBtn.style.cssText = "flex:1;padding:8px;border:1px solid var(--color-main);border-radius:8px;background:transparent;color:var(--color-main);font-size:12px;cursor:pointer;";
  submitAuditBtn.onclick = () => {
    const lines = textarea.value.split(/\r?\n/).map(s => s.trim()).filter(s => !!s);
    if (lines.length === 0) { Toast.show("请输入字卡内容"); return; }
    lines.forEach(line => M.createPendingApply("add", { cardText: line, targetCatId: catSelect.value }, "我"));
    Toast.show(`已提交 ${lines.length} 条审核申请`);
    textarea.value = "";
    onStateChange({ selectedCards: new Set(), searchKeyword: searchInput.value.trim() });
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
  allCheckInput.checked = filteredCards.length > 0 && filteredCards.every(c => selectedCards.has(c.id));
  allCheckInput.onchange = () => {
    const newSel = new Set(selectedCards);
    if (allCheckInput.checked) filteredCards.forEach(c => newSel.add(c.id));
    else filteredCards.forEach(c => newSel.delete(c.id));
    onStateChange({ selectedCards: newSel, searchKeyword: kw });
  };
  allCheck.appendChild(allCheckInput);
  allCheck.appendChild(document.createTextNode("全选"));

  const dedupBtn = document.createElement("button");
  dedupBtn.textContent = "一键去重";
  dedupBtn.style.cssText = "padding:5px 8px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);color:var(--color-text);font-size:11px;cursor:pointer;";
  dedupBtn.onclick = () => {
    const catId = categories[0]?.id;
    if (!catId) return;
    const count = M.deduplicateCategory(catId);
    Toast.show(`去重完成，剩余 ${count} 张`);
    onStateChange({ selectedCards, searchKeyword: kw });
  };

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
  moveBtn.style.cssText = "padding:4px 7px;border:none;border-radius:6px;background:var(--color-main);color:#fff;font-size:11px;cursor:pointer;";
  moveBtn.onclick = ()=>{
    const targetCat = moveSel.value;
    const selArr = Array.from(selectedCards);
    if(!selArr.length){Toast.show("请勾选字卡");return;}
    selArr.forEach(cardId=>{
      const info = allCards.find(x=>x.id===cardId);
      if(info && info.categoryId !== targetCat){
        M.moveCard(cardId, info.categoryId, targetCat);
      }
    });
    Toast.show(`已批量转移${selArr.length}张`);
    onStateChange({ selectedCards: new Set(), searchKeyword: kw });
  };
  moveWrap.appendChild(moveSel);
  moveWrap.appendChild(moveBtn);

  const newCatBtn = document.createElement("button");
  newCatBtn.textContent = "+ 新建分类";
  newCatBtn.style.cssText = "padding:5px 8px;border:none;border-radius:6px;background:var(--color-main);color:#fff;font-size:11px;cursor:pointer;margin-left:auto;";
  newCatBtn.onclick = () => {
    const name = prompt("输入分类名称");
    if (!name) return;
    M.addCategory(name.trim());
    Toast.show("分类已创建");
    onStateChange({ selectedCards, searchKeyword: kw });
  };

  batchBar.appendChild(allCheck);
  batchBar.appendChild(dedupBtn);
  batchBar.appendChild(moveWrap);
  batchBar.appendChild(newCatBtn);

  const listWrap = document.createElement("div");
  listWrap.style.cssText = `
    flex:1;
    overflow-y:auto;
    min-height:0;
    padding:0 0 12px;
    scrollbar-width:none;
    -ms-overflow-style:none;
  `;
  listWrap.style.setProperty("-webkit-scrollbar","display:none");

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
        onStateChange({ selectedCards, searchKeyword: kw });
      };

      //整组全选
      const groupSelectAllCb = document.createElement("input");
      groupSelectAllCb.type = "checkbox";
      const groupAllCardIds = cat.cards.map(c=>c.id);
      const groupAllSelected = groupAllCardIds.every(id=>selectedCards.has(id));
      const groupSomeSelected = groupAllCardIds.some(id=>selectedCards.has(id));
      groupSelectAllCb.checked = groupAllSelected;
      groupSelectAllCb.indeterminate = (!groupAllSelected) && groupSomeSelected;
      groupSelectAllCb.onchange = ()=>{
        const newSel = new Set(selectedCards);
        if(groupSelectAllCb.checked){
          groupAllCardIds.forEach(id=>newSel.add(id));
        }else{
          groupAllCardIds.forEach(id=>newSel.delete(id));
        }
        onStateChange({ selectedCards: newSel, searchKeyword: kw });
      };

      //整组启用禁用
      const catDisableCheck = document.createElement("input");
      catDisableCheck.type = "checkbox";
      catDisableCheck.checked = !cat.isDisabled;
      catDisableCheck.onchange = ()=>{
        M.toggleCategoryDisable(cat.id, !catDisableCheck.checked);
        onStateChange({ selectedCards, searchKeyword: kw });
      };

      const catName = document.createElement("span");
      catName.textContent = `${cat.name} (${cat.cards.length})`;
      catName.style.flex = "1";

      const upBtn = document.createElement("button");
      upBtn.textContent = "↑";
      upBtn.style.cssText = "padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);font-size:11px;cursor:pointer;";
      upBtn.onclick = () => { M.moveCategorySort(cat.id, "up"); onStateChange({ selectedCards, searchKeyword: kw }); };

      const downBtn = document.createElement("button");
      downBtn.textContent = "↓";
      downBtn.style.cssText = "padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);font-size:11px;cursor:pointer;";
      downBtn.onclick = () => { M.moveCategorySort(cat.id, "down"); onStateChange({ selectedCards, searchKeyword: kw }); };

      const renameBtn = document.createElement("button");
      renameBtn.textContent = "重命名";
      renameBtn.style.cssText = "padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);font-size:11px;cursor:pointer;";
      renameBtn.onclick = () => {
        const name = prompt("输入新名称", cat.name);
        if (name) { M.renameCategory(cat.id, name.trim()); onStateChange({ selectedCards, searchKeyword: kw }); }
      };

      const delBtn = document.createElement("button");
      delBtn.textContent = "删除";
      delBtn.style.cssText = "padding:2px 6px;border:1px solid #ff3b30;border-radius:4px;background:transparent;color:#ff3b30;font-size:11px;cursor:pointer;";
      delBtn.onclick = () => {
        const targetId = prompt("删除后卡片将转移到目标分类ID，输入目标分类ID：", "default");
        if (!targetId) return;
        if (M.deleteCategory(cat.id, targetId.trim())) {
          Toast.show("分类已删除");
          onStateChange({ selectedCards, searchKeyword: kw });
        }
      };

      catHead.appendChild(expandBtn);
      catHead.appendChild(groupSelectAllCb);
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
            ck.checked = selectedCards.has(card.id);
            ck.onchange = ()=>{
              const newSel = new Set(selectedCards);
              if(ck.checked) newSel.add(card.id);
              else newSel.delete(card.id);
              onStateChange({ selectedCards: newSel, searchKeyword: kw });
            };

            const textwrap = document.createElement("div");
            textwrap.style.cssText = `flex:1;min-width:0;`;
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
            editBtn.onclick = () => {
              const newText = prompt("修改字卡内容", card.content);
              if (newText !== null) {
                M.updateCard(cat.id, card.id, { content: newText.trim(), title: newText.trim().slice(0,10) });
                onStateChange({ selectedCards, searchKeyword: kw });
              }
            };

            if (card.isDisabled) {
              const restoreBtn = document.createElement("button");
              restoreBtn.textContent = "恢复";
              restoreBtn.style.cssText = "padding:3px 6px;border:none;border-radius:4px;background:#34c759;color:#fff;font-size:11px;cursor:pointer;";
              restoreBtn.onclick = () => {
                M.updateCard(cat.id, card.id, { isDisabled: false });
                onStateChange({ selectedCards, searchKeyword: kw });
              };
              ops.appendChild(restoreBtn);
            } else {
              const disableBtn = document.createElement("button");
              disableBtn.textContent = "禁用";
              disableBtn.style.cssText = "padding:3px 6px;border:1px solid #ff9500;border-radius:4px;background:transparent;color:#ff9500;font-size:11px;cursor:pointer;";
              disableBtn.onclick = () => {
                M.updateCard(cat.id, card.id, { isDisabled: true });
                onStateChange({ selectedCards, searchKeyword: kw });
              };
              ops.appendChild(disableBtn);
            }

            const delBtn2 = document.createElement("button");
            delBtn2.textContent = "删除";
            delBtn2.style.cssText = "padding:3px 6px;border:none;border-radius:4px;background:#ff3b30;color:#fff;font-size:11px;cursor:pointer;";
            delBtn2.onclick = () => {
              if (!confirm("确定删除这张字卡？")) return;
              M.deleteCard(cat.id, card.id);
              Toast.show("已删除");
              onStateChange({ selectedCards, searchKeyword: kw });
            };

            ops.appendChild(sendBtn);
            ops.appendChild(copyBtn);
            ops.appendChild(editBtn);
            ops.appendChild(delBtn2);

            cardEl.appendChild(ck);
            cardEl.appendChild(textwrap);
            cardEl.appendChild(ops);
            cardList.appendChild(cardEl);
          });
        }
        catEl.appendChild(cardList);
      }
      listWrap.appendChild(catEl);
    });
  }

  rootEl.appendChild(head);
  rootEl.appendChild(batchBar);
  rootEl.appendChild(listWrap);
}

const AuditPanelModule = {
  panelEl: null,
  activeTab: "pending",
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
      // 角标更新，只在这里注册一次，不在initFloatBall内部重复注册
      this.updateBadge?.();
    });
    this.initFloatBall();
  },
  // ✅提升为顶层正式方法，不再在initFloatBall内部动态定义
  updateBadge() {
    if(!this.badgeEl) return;
    const count = this.M.pendingApply.length;
    if(count <= 0){
      this.badgeEl.style.display = "none";
      return;
    }
    this.badgeEl.style.display = "flex";
    this.badgeEl.innerText = count > 99 ? "99+" : String(count);
  },

  // ========== 悬浮球 ==========
     initFloatBall() {
   const cfg = this.M.auditConfig.floatBall;
    const forceShow = new URLSearchParams(location.search).get("show_audit") === "true";
    // 销毁旧DOM
    if(this.floatBallEl){
      if(this.floatBallEl.parentNode) this.floatBallEl.remove();
      this.floatBallEl = null;
      this.ballInner = null;
      this.badgeEl = null;
    }
    if (!cfg.enable && !forceShow) {
      return;
    }
    // fixed定位，不用transform
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      position:fixed;
      z-index:99999;
    `;
    const ball = document.createElement("div");
    ball.style.cssText = `
      position:relative;
      border-radius:50%;
      background:${cfg.color || "#7c68ee"};
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:bold;cursor:pointer;
      user-select:none;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.15);
      touch-action:none;
      width:${cfg.size}px;height:${cfg.size}px;
      pointer-events:auto;
    `;
    // 角标 top:-4px
    const badge = document.createElement("div");
    badge.className = "audit-badge";
    badge.style.cssText = `
      position:absolute;
      top:-4px;
      right:-6px;
      min-width:18px;
      height:18px;
      padding:0 4px;
      background:#ef4444;
      color:#fff;
      font-size:11px;
      font-weight:bold;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 2px 4px rgba(0,0,0,0.2);
      pointer-events:none;
    `;
    wrapper.appendChild(ball);
    wrapper.appendChild(badge);
    if (cfg.avatarBase64) {
      ball.innerHTML += `<img src="${cfg.avatarBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      ball.innerHTML += `<svg xmlns="http://www.w3.org/2000/svg" width="${cfg.size*0.5}" height="${cfg.size*0.5}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    }
    document.body.appendChild(wrapper);
    this.floatBallEl = wrapper;
    this.ballInner = ball;
    this.badgeEl = badge;
    // 初始化角标
    this.updateBadge();
    // 读取配置，0是合法值，仅null/undefined用默认
    let currentX = (cfg.posX === null || cfg.posX === undefined) ? 50 : cfg.posX;
    let currentY = (cfg.posY === null || cfg.posY === undefined) ? 80 : cfg.posY;
    wrapper.style.left = `${currentX}px`;
    wrapper.style.top = `${currentY}px`;
    let rafId = null;
    let dragState = {
      dragging: false,
      moved: false,
      offsetX:0,
      offsetY:0
    };

    // 【关键】捕获阶段拦截所有原生click，彻底干掉浏览器合成click事件，杜绝拖拽松手弹窗
    ball.addEventListener("click",(e)=>{
      e.stopImmediatePropagation();
      e.preventDefault();
    },true);

    const startDrag = (clientX, clientY) => {
      dragState.dragging = true;
      dragState.moved = false;
      const rect = wrapper.getBoundingClientRect();
      dragState.offsetX = clientX - rect.left;
      dragState.offsetY = clientY - rect.top;
    };
    const moveDrag = (clientX, clientY) => {
      if (!dragState.dragging) return;
      let x = clientX - dragState.offsetX;
      let y = clientY - dragState.offsetY;
      // 修复：全部英文减号
      const dist = Math.hypot( (clientX - dragState.offsetX) - x , (clientY - dragState.offsetY) - y );
      if( dist > this._touchSlop ){
        dragState.moved = true;
      }
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const size = ball.offsetWidth;
      x = Math.max(0, Math.min(vw - size, x));
      y = Math.max(0, Math.min(vh - size, y));
      if(!rafId){
        rafId = requestAnimationFrame(()=>{
          rafId = null;
          wrapper.style.left = `${x}px`;
          wrapper.style.top = `${y}px`;
          currentX = x;
          currentY = y;
          cfg.posX = currentX;
          cfg.posY = currentY;
        });
      }
    };
    const endDrag = () => {
      if (!dragState.dragging) return;
      // 抬起：没有拖拽位移→轻点打开弹窗；拖拽过→保存位置，不打开弹窗
      if (!dragState.moved) {
        this.open();
      } else {
        AuditCardModule.saveToStorage();
      }
      dragState.dragging = false;
    };
    // =========鼠标事件=========
    ball.addEventListener("mousedown", e=>{
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
      const onMouseMove = (e)=>moveDrag(e.clientX, e.clientY);
      const onMouseUp = ()=>{
        endDrag();
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
    // =========触屏事件=========
    ball.addEventListener("touchstart", e=>{
      // 不调用e.preventDefault()，部分移动端浏览器拒绝touchstart preventDefault，会报错；靠捕获click拦截合成事件
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
      const touchMove = (te)=>{
        if(!dragState.dragging) return;
        if(te.cancelable) te.preventDefault();
        const tt = te.touches[0];
        moveDrag(tt.clientX, tt.clientY);
      };
      const touchEnd = ()=>{
        endDrag();
        document.removeEventListener("touchmove", touchMove);
        document.removeEventListener("touchend", touchEnd);
        document.removeEventListener("touchcancel", touchEnd);
      };
      document.addEventListener("touchmove", touchMove, {passive:false});
      document.addEventListener("touchend", touchEnd);
      document.addEventListener("touchcancel", touchEnd);
    }, {passive:true});
  },

      updateFloatBallStyle() {
    const cfg = AuditCardModule.auditConfig.floatBall;
    const forceShow = new URLSearchParams(location.search).get("show_audit") === "true";
    if (!cfg.enable && !forceShow) {
      if(this.floatBallEl){
        if(this.floatBallEl.parentNode) this.floatBallEl.remove();
      }
      this.floatBallEl = null;
      this.ballInner = null;
      this.badgeEl = null;
      return;
    }
    if (!this.floatBallEl) {
      this.initFloatBall();
      return;
    }
    const ball = this.ballInner;
    if(!ball) return;
    ball.style.width = cfg.size + "px";
    ball.style.height = cfg.size + "px";
    ball.style.background = cfg.color || "#7c68ee";
    const oldImg = ball.querySelector("img");
    const oldSvg = ball.querySelector("svg");
    if(oldImg) oldImg.remove();
    if(oldSvg) oldSvg.remove();

    if(cfg.avatarBase64){
      ball.insertAdjacentHTML("beforeend",`<img src="${cfg.avatarBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`);
    }else{
      ball.insertAdjacentHTML("beforeend",`<svg xmlns="http://www.w3.org/2000/svg" width="${cfg.size*0.5}" height="${cfg.size*0.5}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`);
    }
    // 修复：posX=0 合法，只排除 null undefined
    if ((cfg.posX !== null && cfg.posX !== undefined) && (cfg.posY !== null && cfg.posY !== undefined) && this.floatBallEl){
      this.floatBallEl.style.left = `${cfg.posX}px`;
      this.floatBallEl.style.top = `${cfg.posY}px`;
    }
    this.updateBadge();
  },

  // ========== 弹窗 ==========
  open() {
    if (this.panelEl) this.close();
    this.selectedIds = new Set();
    const mask = document.createElement("div");
    mask.style.cssText = `
      position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.45);z-index:100000;padding:12px;box-sizing:border-box;
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
    const M = AuditCardModule;
    const list = M.pendingApply || [];
    const cats = M.getAuditCategories();

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
    listWrap.style.cssText = `
      flex:1;overflow-y:auto;min-height:0;padding:0;
      scrollbar-width:none;-ms-overflow-style:none;
    `;
    const styleHideScroll = document.createElement("style");
    styleHideScroll.textContent = `#scrollerHide::-webkit-scrollbar{display:none !important}`;
    listWrap.id = "scrollerHide";
    listWrap.appendChild(styleHideScroll);

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
        // 使用申请人字段，如果是梦角引擎发起则已经存了实时昵称
        applicant.textContent = item.applicant || "我";

        top.appendChild(check);
        top.appendChild(tag);
        top.appendChild(applicant);

        const text = document.createElement("div");
        text.style.cssText = `font-size:13px;margin:4px 0;white-space:pre-wrap;word-break:break-all;`;
        const catInfo = M.getAuditCategoryById(item.targetCatId || item.sourceCatId);
        const catName = catInfo ? catInfo.name : "未知分类";
        
        let actionDesc = "";
        switch(item.action) {
          case "add": actionDesc = `申请新增字卡到【${catName}】：「${item.cardText}」`; break;
          case "delete": actionDesc = `申请删除【${catName}】中的字卡：「${item.cardText}」`; break;
          case "disable": actionDesc = `申请禁用【${catName}】中的字卡：「${item.cardText}」`; break;
          case "restore": actionDesc = `申请恢复【${catName}】中的字卡：「${item.cardText}」`; break;
          case "move": {
            const src = M.getAuditCategoryById(item.sourceCatId);
            const dst = M.getAuditCategoryById(item.targetCatId);
            actionDesc = `申请将字卡「${item.cardText}」从【${src?.name || "未知"}】迁移至【${dst?.name || "未知"}】`;
            break;
          }
          default: actionDesc = item.cardText;
        }
        text.textContent = actionDesc;

        card.appendChild(top);
        card.appendChild(text);

        // 分类下拉框
        if (item.action === "add" || item.action === "move") {
          const selectWrap = document.createElement("div");
          selectWrap.style.cssText = "display:flex;gap:6px;margin:8px 0;font-size:12px;align-items:center;";
          selectWrap.innerHTML = item.action === "move" ? `<span>源分类：</span>` : "";
          
          if (item.action === "move") {
            const srcSel = document.createElement("select");
            cats.forEach(c => {
              const opt = document.createElement("option");
              opt.value = c.id; opt.textContent = c.name;
              if (c.id === item.sourceCatId) opt.selected = true;
              srcSel.appendChild(opt);
            });
            srcSel.onchange = () => { item.sourceCatId = srcSel.value; };
            selectWrap.appendChild(srcSel);
            selectWrap.appendChild(document.createTextNode(" 目标分类："));
          }

          const tgtSel = document.createElement("select");
          cats.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id; opt.textContent = c.name;
            if (c.id === item.targetCatId) opt.selected = true;
            tgtSel.appendChild(opt);
          });
          tgtSel.onchange = () => { item.targetCatId = tgtSel.value; };
          selectWrap.appendChild(tgtSel);
          card.appendChild(selectWrap);
        }

        const time = document.createElement("div");
        time.style.cssText = `font-size:11px;color:var(--color-text-2);`;
        time.textContent = new Date(item.lastApplyTime).toLocaleString();
        card.appendChild(time);

        const remarkInput = document.createElement("input");
        remarkInput.placeholder = "审批备注（可选）";
        remarkInput.value = item.remark || "";
        remarkInput.style.cssText = `
          width:100%;box-sizing:border-box;margin:8px 0 6px;padding:8px 8px;
          border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);
          color:var(--color-text);font-size:12px;
        `;
        remarkInput.oninput = () => { item.remark = remarkInput.value; };
        card.appendChild(remarkInput);

        const btns = document.createElement("div");
        btns.style.cssText = `display:flex;gap:8px;`;
        const agreeBtn = document.createElement("button");
        agreeBtn.textContent = "同意";
        agreeBtn.style = "flex:1;padding:9px;border:none;border-radius:8px;background:var(--color-main);color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
        agreeBtn.onclick = () => {
          if (item.action === "move" && item.sourceCatId === item.targetCatId) {
            Toast.show("源分类与目标分类不能相同");
            return;
          }
          this.singleApprove(item, "agree", remarkInput.value);
        };

        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "驳回";
        rejectBtn.style = "flex:1;padding:9px;border:none;border-radius:8px;background:#ff3b30;color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
        rejectBtn.onclick = () => this.singleApprove(item, "reject", remarkInput.value);

        btns.appendChild(agreeBtn);
        btns.appendChild(rejectBtn);
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
        if (hit) M.updateCard(hit.categoryId, hit.id, { isDisabled: true, disabledBy: item.applicant });
        break;
      }
      case "restore": {
        const hit = findCard(item.cardText);
        if (hit) M.updateCard(hit.categoryId, hit.id, { isDisabled: false, disabledBy: null });
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
      flex:1;overflow-y:auto;min-height:0;padding:0;
      scrollbar-width:none;-ms-overflow-style:none;
    `;
    const styleHideScroll = document.createElement("style");
    styleHideScroll.textContent = `#scrollerHide::-webkit-scrollbar{display:none !important}`;
    listWrap.id = "scrollerHide";
    listWrap.appendChild(styleHideScroll);

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
  const M = AuditCardModule;
  // UI层动态替换申请人昵称，不修改原始存储历史数据
  let showApplicant = h.applicant || "我";
  if (h.applicant === "梦角") {
    showApplicant = M.getContactNick();
  } else if (h.applicant === "我") {
    showApplicant = M.getMyNick();
  }
  const row = document.createElement("div");
  row.style.cssText = `border:1px solid var(--color-border);border-radius:12px;padding:10px;margin-top:10px;box-sizing:border-box;`;
  row.innerHTML = `
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
      <span style="padding:2px 8px;border-radius:999px;font-size:11px;color:#fff;background:${meta.color}">${meta.label}</span>
      <span style="padding:2px 8px;border-radius:999px;font-size:11px;color:#fff;background:${resultColor}">${h.auditResult === "agree" ? "同意" : "驳回"}</span>
      <span style="font-size:11px;color:var(--color-text-2);margin-left:auto">${showApplicant}</span>
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
    renderAuditCardLibContainer(
      body,
      AuditCardModule,
      this._selectedCards,
      this._cardSearch,
      (state)=>{
        this._selectedCards = state.selectedCards;
        this._cardSearch = state.searchKeyword;
        this.render(this.panelEl.firstElementChild);
      }
    );
  },

  // 删除分类转移模态框
  showTransferModal(cat, categories, body) {
    const mask = document.createElement("div");
    mask.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:100001;";
    const modal = document.createElement("div");
    modal.style.cssText = "background:var(--color-bg);border-radius:14px;padding:20px;width:80%;max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,0.2);";
    modal.innerHTML = `<div style="font-weight:bold;margin-bottom:12px;color:var(--color-text);">转移字卡</div>
      <div style="font-size:13px;color:var(--color-text-2);margin-bottom:8px;">将「${cat.name}」中的 ${cat.cards.length} 张字卡转移到：</div>`;
    
    const sel = document.createElement("select");
    sel.style.cssText = "width:100%;padding:8px;margin-bottom:16px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);";
    categories.forEach(c => {
      if (c.id !== cat.id) {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        sel.appendChild(opt);
      }
    });
    modal.appendChild(sel);

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:8px;justify-content:flex-end;";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "取消";
    cancelBtn.style.cssText = "padding:8px 16px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:13px;cursor:pointer;";
    cancelBtn.onclick = () => mask.remove();

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "确认转移并删除";
    confirmBtn.style.cssText = "padding:8px 16px;border:none;border-radius:8px;background:var(--color-main);color:#fff;font-size:13px;cursor:pointer;";
    confirmBtn.onclick = () => {
      const targetCatId = sel.value;
      if (!targetCatId) return;
      AuditCardModule.deleteCategory(cat.id, targetCatId);
      Toast.show("分类已删除，字卡已转移");
      mask.remove();
      this.renderCardLib(body);
    };

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    modal.appendChild(btnRow);
    mask.appendChild(modal);
    document.body.appendChild(mask);
  },

  // ========== Tab4 设置 ==========
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

    // 输入框右对齐布局
    const numberInputMinute = (label, secValue, onChangeSec) => {
      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:13px;";
      const span = document.createElement("span");
      span.style.cssText = "color:var(--color-text-2);";
      span.textContent = label;
      const input = document.createElement("input");
      input.type = "number";
      input.value = Math.round(secValue / 60);
      input.style = "width:90px;padding:7px 8px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;box-sizing:border-box;text-align:right;";
      input.onchange = () => onChangeSec(Number(input.value)*60);
      wrap.appendChild(span);
      wrap.appendChild(input);
      return wrap;
    };

    const numberInputRaw = (label, value, onChange) => {
      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:13px;";
      const span = document.createElement("span");
      span.style.cssText = "color:var(--color-text-2);";
      span.textContent = label;
      const input = document.createElement("input");
      input.type = "number";
      input.value = value;
      input.style = "width:90px;padding:7px 8px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;box-sizing:border-box;text-align:right;";
      input.onchange = () => onChange(Number(input.value));
      wrap.appendChild(span);
      wrap.appendChild(input);
      return wrap;
    };

    body.style.padding = "16px 18px";
    body.style.overflowY = "auto";
    body.style.minHeight = "0";
    body.style.scrollbarWidth = "none";
    body.style.msOverflowStyle = "none";
    const styleSetScroll = document.createElement("style");
    styleSetScroll.textContent = `#settingScroller::-webkit-scrollbar{display:none !important}`;
    body.id = "settingScroller";
    body.appendChild(styleSetScroll);

    // -------- 悬浮球设置 --------
    body.appendChild(sectionTitle("悬浮球"));
    body.appendChild(toggle("启用悬浮球", float.enable, v => {
      float.enable = v;
      M.saveToStorage();
      this.updateFloatBallStyle();
    }));

    const colorRow = document.createElement("div");
    colorRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:13px;";
    colorRow.innerHTML = `<span style="color:var(--color-text-2)">悬浮球颜色</span>`;
    const colorWrap = document.createElement("div");
    colorWrap.style.cssText = "display:flex;align-items:center;gap:8px;";
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = float.color;
    colorInput.style.cssText = "width:40px;height:28px;border:none;padding:0;cursor:pointer;";
      colorInput.oninput = () => {
      float.color = colorInput.value;
      this.updateFloatBallStyle();
    };
    colorInput.onchange = () => {
      M.saveToStorage();
    };
    const resetColorBtn = document.createElement("button");
    resetColorBtn.textContent = "恢复默认";
    resetColorBtn.style = "padding:4px 8px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);font-size:11px;cursor:pointer;";
    resetColorBtn.onclick = () => {
      float.color = "#7c68ee";
      colorInput.value = float.color;
      M.saveToStorage();
      this.updateFloatBallStyle();
    };
    colorWrap.appendChild(colorInput);
    colorWrap.appendChild(resetColorBtn);
    colorRow.appendChild(colorWrap);
    body.appendChild(colorRow);

    const sizeRow = document.createElement("div");
    sizeRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:13px;";
    const sizeLabel = document.createElement("span");
    sizeLabel.style.cssText = "color:var(--color-text-2);";
    sizeLabel.textContent = `大小 ${float.size}px`;
    const sizeWrap = document.createElement("div");
    sizeWrap.style.cssText = "display:flex;align-items:center;gap:8px;";
    const sizeSlider = document.createElement("input");
    sizeSlider.type = "range";
    sizeSlider.min = 32;
    sizeSlider.max = 80;
    sizeSlider.value = float.size;
    sizeSlider.style.width = "100px";
    sizeSlider.style.touchAction = "manipulation";
    sizeSlider.oninput = () => {
      float.size = Number(sizeSlider.value);
      sizeLabel.textContent = `大小 ${float.size}px`;
      this.updateFloatBallStyle();
    };
    sizeSlider.onchange = () => {
      M.saveToStorage();
    };
    const resetSizeBtn = document.createElement("button");
    resetSizeBtn.textContent = "恢复默认";
    resetSizeBtn.style = "padding:4px 8px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);font-size:11px;cursor:pointer;";
    resetSizeBtn.onclick = () => {
      float.size = 48;
      sizeSlider.value = 48;
      sizeLabel.textContent = `大小 48px`;
      M.saveToStorage();
      this.updateFloatBallStyle();
    };
    sizeWrap.appendChild(sizeSlider);
    sizeWrap.appendChild(resetSizeBtn);
    sizeRow.appendChild(sizeLabel);
    sizeRow.appendChild(sizeWrap);
    body.appendChild(sizeRow);

    const avatarRow = document.createElement("div");
    avatarRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:13px;";
    avatarRow.innerHTML = `<span style="color:var(--color-text-2)">自定义头像</span>`;
    const avatarWrap = document.createElement("div");
    avatarWrap.style.cssText = "display:flex;align-items:center;gap:8px;";
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
      fileInput.onchange = async (ev) => {
        const file = ev.target.files[0];
        if (!file) { fileInput.remove(); return; }
        // ========== 圆形裁剪弹窗（复刻my‑new‑feature openCropper圆形模式） ==========
        const reader = new FileReader();
        reader.onload = (e)=>{
          const img = new Image();
          img.onload = ()=>{
            const CANVAS = 220;
            const modal = document.createElement('div');
            modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:100003;`;
            modal.innerHTML = `
              <div style="background:#fff;border-radius:14px;padding:18px;width:340px;max-width:92vw;box-shadow:0 20px 40px rgba(0,0,0,.2);">
                <div style="font-weight:600;font-size:14px;margin-bottom:14px;text-align:center;color:#111827;">裁剪悬浮球头像（圆形）</div>
                <div style="position:relative;width:220px;height:220px;margin:0 auto 14px;background:#f3f4f6;overflow:hidden;">
                  <canvas width="${CANVAS}" height="${CANVAS}" style="display:block;width:220px;height:220px;"></canvas>
                  <div style="position:absolute;inset:0;pointer-events:none;box-shadow:0 0 0 2000px rgba(0,0,0,.35);border-radius:50%;"></div>
                </div>
                <div style="padding:0 10px;margin-bottom:14px;">
                  <input type="range" min="1" max="3" step="0.01" value="1" style="width:100%;">
                </div>
                <div style="display:flex;gap:8px;justify-content:center;">
                  <button class="cropper-cancel" style="padding:8px 14px;border-radius:8px;border:1px solid #d1d5db;background:#fff;cursor:pointer;">取消</button>
                  <button class="cropper-confirm" style="padding:8px 14px;border-radius:8px;border:none;background:#3b82f6;color:#fff;cursor:pointer;">确认</button>
                </div>
              </div>
            `;
            document.body.appendChild(modal);
            const canvasEl = modal.querySelector("canvas");
            const ctx = canvasEl.getContext("2d");
            const slider = modal.querySelector('input[type="range"]');
            let zoom = 1;
            let offsetX = 0, offsetY =0;
            let dragging = false, dsx=0,dsy=0,dox=0,doy=0;

            function draw(){
              ctx.clearRect(0,0,CANVAS,CANVAS);
              const minScale = Math.max(CANVAS/img.width, CANVAS/img.height);
              const scale = minScale * zoom;
              const drawW = img.width*scale;
              const drawH = img.height*scale;
              const dx = (CANVAS - drawW)/2 + offsetX;
              const dy = (CANVAS - drawH)/2 + offsetY;
              ctx.drawImage(img, dx, dy, drawW, drawH);
            }
            slider.oninput = ()=>{
              zoom = Number(slider.value); draw();
            };
            const startDrag = (pe)=>{
              const p = pe.touches ? pe.touches[0] : pe;
              dragging = true;
              dsx = p.clientX; dsy = p.clientY;
              dox = offsetX; doy = offsetY;
            };
            const moveDrag = (pe)=>{
              if(!dragging) return;
              const p = pe.touches ? pe.touches[0] : pe;
              offsetX = dox + (p.clientX - dsx);
              offsetY = doy + (p.clientY - dsy);
              draw();
              if(pe.cancelable && pe.touches) pe.preventDefault();
            };
            const endDrag = ()=>{ dragging = false; };
            canvasEl.addEventListener("mousedown", startDrag);
            canvasEl.addEventListener("touchstart", startDrag, {passive:true});
            document.addEventListener("mousemove", moveDrag);
            document.addEventListener("touchmove", moveDrag, {passive:false});
            document.addEventListener("mouseup", endDrag);
            document.addEventListener("touchend", endDrag);
            modal.querySelector(".cropper-cancel").onclick = ()=>{ modal.remove(); };
            modal.querySelector(".cropper-confirm").onclick = ()=>{
              const outSize = 192;
              const outCanvas = document.createElement("canvas");
              outCanvas.width = outSize; outCanvas.height = outSize;
              const octx = outCanvas.getContext("2d");
              octx.beginPath();
              octx.arc(outSize/2, outSize/2, outSize/2, 0, Math.PI*2);
              octx.clip();
              const scaleOut = outSize / CANVAS;
              const minScale = Math.max(CANVAS/img.width, CANVAS/img.height);
              const scale = minScale * zoom;
              const drawW = img.width*scale;
              const drawH = img.height*scale;
              const dx = (CANVAS - drawW)/2 + offsetX;
              const dy = (CANVAS - drawH)/2 + offsetY;
              octx.drawImage(img, dx*scaleOut, dy*scaleOut, drawW*scaleOut, drawH*scaleOut);
              float.avatarBase64 = outCanvas.toDataURL("image/png");
              M.saveToStorage();
              Toast.show("头像已更新");
              this.updateFloatBallStyle();
              this.renderSettings(body);
              modal.remove();
            };
            draw();
          };
          img.onerror = ()=>{ Toast.show("图片读取失败","#b91c1c"); };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        fileInput.remove();
      };
      fileInput.click();
    };

    const resetAvatarBtn = document.createElement("button");
    resetAvatarBtn.textContent = "恢复默认";
    resetAvatarBtn.style = "padding:4px 8px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);font-size:11px;cursor:pointer;";
    resetAvatarBtn.onclick = () => {
      float.avatarBase64 = "";
      M.saveToStorage();
      Toast.show("已恢复默认头像");
      this.updateFloatBallStyle();
      this.renderSettings(body);
    };
    avatarWrap.appendChild(avatarPreview);
    avatarWrap.appendChild(uploadBtn);
    avatarWrap.appendChild(resetAvatarBtn);
    avatarRow.appendChild(avatarWrap);
    body.appendChild(avatarRow);

    // -------- 梦角引擎 --------
    body.appendChild(sectionTitle("梦角拟人引擎"));
    body.appendChild(toggle("抓取聊天生成申请", engine.enableGrabChat, v => {
      engine.enableGrabChat = v;
      M.saveToStorage();
      M.restartEngineTimer();
    }));
    body.appendChild(toggle("混沌随机变更", engine.enableChaos, v => {
      engine.enableChaos = v;
      M.saveToStorage();
      M.restartEngineTimer();
    }));
    body.appendChild(toggle("主动发消息", engine.enableActiveSend, v => {
      engine.enableActiveSend = v;
      M.saveToStorage();
      M.restartEngineTimer();
    }));

    body.appendChild(sectionTitle("引擎参数"));
    body.appendChild(numberInputMinute("巡检周期(分)", engine.scanIntervalSec, v => { engine.scanIntervalSec = v; M.saveToStorage(); }));
    body.appendChild(numberInputRaw("基础触发概率", engine.baseProb, v => { engine.baseProb = v; M.saveToStorage(); }));
    body.appendChild(numberInputRaw("情绪命中概率", engine.emotionProb, v => { engine.emotionProb = v; M.saveToStorage(); }));
    body.appendChild(numberInputRaw("混沌操作概率", engine.chaosProb, v => { engine.chaosProb = v; M.saveToStorage(); }));
    body.appendChild(numberInputRaw("主动发送概率", engine.activeSendProb, v => { engine.activeSendProb = v; M.saveToStorage(); }));
    // 主动发送冷却：读取时毫秒转分钟，保存时分钟转毫秒
    body.appendChild(numberInputRaw("主动发送冷却(分)", engine.activeSendCoolDownMs / 60000, v => {engine.activeSendCoolDownMs = v * 60000;M.saveToStorage();}));
    body.appendChild(numberInputRaw("待审上限(条)", engine.pendingMax, v => { engine.pendingMax = v; M.saveToStorage(); }));
    body.appendChild(numberInputRaw("冷却时间(分)", engine.applyCoolDownMs / 60000, v => {const val = Math.max(1, Number(v));engine.applyCoolDownMs = val * 60000;M.saveToStorage();}));


    // -------- 其他设置 --------
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
export { AuditPanelModule, renderAuditCardLibContainer };

