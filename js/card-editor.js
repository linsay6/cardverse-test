import { EventBus } from './core/context.js';
import { Toast } from './core/toast.js';

export const CardEditorModule = {
  rootEl: null,
  activeTab: "custom", // 默认打开【自定义字卡】
  _cardSearch: "",
  _selectedCards: new Set(),
  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("字卡编辑容器找不到", containerSelector);
      return;
    }
    this.render();
    // 监听主题变更重渲染
    EventBus.on("themeChange", () => this.render());
    // 监听audit数据变更，刷新列表
    EventBus.on("my‑audit‑data‑updated", () => this.render());
  },

  render() {
    if (!this.rootEl || !window.AuditCardModule) return;
    this.rootEl.innerHTML = "";
    const wrap = document.createElement('div');
    wrap.style.padding = "14px";

    // 顶部三标签切换
    const tabKeys = ["custom", "system", "auditReport"];
    const tabNames = {
      custom: "自定义字卡",
      system: "系统预设字卡",
      auditReport: "审核报告字卡"
    };
    let tabHtml = `<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">`;
    tabKeys.forEach(k=>{
      const active = this.activeTab === k
        ? "background:var(--color-main);color:#fff"
        : "background:var(--color-bg);color:var(--color-text);border:1px solid var(--color-border)";
      tabHtml += `<button data-tab-key="${k}" style="padding:6px 10px;border-radius:99px;border:none;${active}">${tabNames[k]}</button>`;
    })
    tabHtml += `</div>`;
    wrap.innerHTML = tabHtml;

        const M = window.AuditCardModule;
    // ========= 区分分支：custom / system 使用原有渲染；auditReport 使用完整分类渲染（和audit‑panel字卡库UI完全对齐） =========
    if(this.activeTab !== "auditReport"){
        const group = M.cardGroups[this.activeTab];
        const list = group?.list || [];
        const isSystemGroup = this.activeTab === "system";
        if(!isSystemGroup){
          const formDiv = document.createElement("div");
          formDiv.style.cssText = "border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px;margin-bottom:14px;";
          formDiv.innerHTML = `
            <div style="font-weight:bold;margin-bottom:10px;color:var(--color-text)">新增字卡</div>
            <div style="margin-bottom:8px;">
              <div style="font-size:13px;color:var(--color-text-2);margin-bottom:4px;">标题</div>
              <input id="in-card-title" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--color-border);border-radius:var(--radius-btn);background:var(--color-bg);color:var(--color-text)" placeholder="标题">
            </div>
            <div style="margin-bottom:10px;">
              <div style="font-size:13px;color:var(--color-text-2);margin-bottom:4px;">内容</div>
              <textarea id="in-card-content" rows="3" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--color-border);border-radius:var(--radius-btn);background:var(--color-bg);color:var(--color-text);resize:none" placeholder="字卡内容"></textarea>
            </div>
            <button id="btn-add-new" style="width:100%;padding:8px;background:var(--color-main);color:#fff;border:none;border-radius:var(--radius-btn)">添加到当前分组</button>
          `;
          wrap.appendChild(formDiv);
        }else{
          const tipDiv = document.createElement("div");
          tipDiv.style.cssText = "border:1px dashed var(--color-border);border-radius:var(--radius-card);padding:12px;margin-bottom:14px;color:var(--color-text-2);font-size:13px;";
          tipDiv.innerText = "系统预设分组：仅可读，不可新增/删除";
          wrap.appendChild(tipDiv);
        }
        const listWrap = document.createElement("div");
        listWrap.innerHTML = `<div style="font-weight:bold;margin-bottom:8px;color:var(--color-text)">${group.name}（${list.length}条）</div>`;
        if(list.length === 0){
          listWrap.innerHTML += `<div style="color:var(--color-text-2);font-size:13px">暂无字卡</div>`;
        }else{
          list.forEach(card=>{
            const item = document.createElement("div");
            item.style.cssText = "border:1px solid var(--color-border);border-radius:var(--radius-card);padding:10px;margin-bottom:8px";
            item.innerHTML = `
              <div style="font-weight:bold;color:var(--color-main)">${card.title||"无标题"}</div>
              <div style="font-size:13px;color:var(--color-text-2);margin:4px 0;white-space:pre-wrap">${card.content}</div>
              <div style="display:flex;gap:6px;margin-top:6px">
                <button data-send-id="${card.id}" style="padding:3px 6px;font-size:12px;background:var(--color-main);color:#fff;border:none;border-radius:4px">发送</button>
                ${!isSystemGroup ? `<button data-del-id="${card.id}" style="padding:3px 6px;font-size:12px;background:#e53935;color:#fff;border:none;border-radius:4px">删除</button>`:""}
              </div>
            `;
            listWrap.appendChild(item);
          })
        }
        wrap.appendChild(listWrap);
    }else{
        // ========= auditReport：完整复刻 audit‑panel.js renderCardLib UI，操作全部调用M模块api，自动双向同步 =========
        const categories = M.getAuditCategories();
        const kw = this._cardSearch || "";
        const selectedCards = this._selectedCards || new Set();

        const head = document.createElement("div");
        head.style.cssText = `padding:12px 0;flex-shrink:0;border-bottom:1px solid var(--color-border);display:flex;flex-direction:column;gap:8px;`;
        const searchInput = document.createElement("input");
        searchInput.placeholder = "搜索字卡内容...";
        searchInput.value = kw;
        searchInput.style.cssText = `width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;`;
        searchInput.oninput = () => {
            this._cardSearch = searchInput.value.trim();
            this.render();
        };

        const textarea = document.createElement("textarea");
        textarea.rows = 3;
        textarea.placeholder = "逐行输入字卡，每行一条，可批量添加或提交审核";
        textarea.style.cssText = `width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;resize:none;`;

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
          this.render();
        };

        const submitAuditBtn = document.createElement("button");
        submitAuditBtn.textContent = "提交审核";
        submitAuditBtn.style = "flex:1;padding:8px;border:1px solid var(--color-main);border-radius:8px;background:transparent;color:var(--color-main);font-size:12px;cursor:pointer;";
        submitAuditBtn.onclick = () => {
          const lines = textarea.value.split(/\r?\n/).map(s => s.trim()).filter(s => !!s);
          if (lines.length === 0) { Toast.show("请输入字卡内容"); return; }
          lines.forEach(line => M.createPendingApply("add", { cardText: line, targetCatId: catSelect.value }, M.getMyNick()));
          Toast.show(`已提交 ${lines.length} 条审核申请`);
          textarea.value = "";
          this.render();
        };
        opRow.appendChild(catSelect);
        opRow.appendChild(batchAddBtn);
        opRow.appendChild(submitAuditBtn);
        head.appendChild(searchInput);
        head.appendChild(textarea);
        head.appendChild(opRow);

        const batchBar = document.createElement("div");
        batchBar.style.cssText = `display:flex;gap:6px;padding:10px 0;flex-wrap:wrap;align-items:center;font-size:12px;border-bottom:1px solid var(--color-border);flex-shrink:0;`;
        const allCheck = document.createElement("label");
        allCheck.style.cssText = "display:flex;align-items:center;gap:4px;cursor:pointer;";
        const allCheckInput = document.createElement("input");
        allCheckInput.type = "checkbox";
        const allCards = M.getAllAuditCards();
        const filteredCards = kw ? allCards.filter(c => c.content.toLowerCase().includes(kw.toLowerCase())) : allCards;
        allCheckInput.checked = filteredCards.length > 0 && filteredCards.every(c => this._selectedCards.has(c.id));
        allCheckInput.onchange = () => {
          if (allCheckInput.checked) filteredCards.forEach(c => this._selectedCards.add(c.id));
          else this._selectedCards.clear();
          this.render();
        };
        allCheck.appendChild(allCheckInput);
        allCheck.appendChild(document.createTextNode("全选"));

        const dedupBtn = document.createElement("button");
        dedupBtn.textContent = "一键去重";
        dedupBtn.style = "padding:5px 8px;border:1px solid var(--color-border);border-radius:6px;background:var(--color-bg);color:var(--color-text);font-size:11px;cursor:pointer;";
        dedupBtn.onclick = () => {
          if(categories.length === 0){ Toast.show("暂无分类"); return; }
          const catNameList = categories.map((c,idx)=>`${idx}: ${c.name}`).join("\n");
          const inputVal = prompt(`选择需要去重的分类序号:\n${catNameList}`,"0");
          if(inputVal === null) return;
          const selIdx = Number(inputVal);
          if(Number.isNaN(selIdx) || selIdx < 0 || selIdx >= categories.length){ Toast.show("输入序号无效"); return; }
          const targetCat = categories[selIdx];
          const count = M.deduplicateCategory(targetCat.id);
          Toast.show(`去重完成【${targetCat.name}】，剩余 ${count} 张`);
          this.render();
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
          this.render();
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
          this.render();
        };

        batchBar.appendChild(allCheck);
        batchBar.appendChild(dedupBtn);
        batchBar.appendChild(moveWrap);
        batchBar.appendChild(newCatBtn);

        const listWrap = document.createElement("div");
        listWrap.style.cssText = `flex:1;overflow-y:auto;min-height:0;padding:0;scrollbar-width:none;-ms-overflow-style:none;`;
        const styleHideScroll = document.createElement("style");
        styleHideScroll.textContent = `#scrollerHide::-webkit-scrollbar{display:none !important}`;
        listWrap.id = "scrollerHide";
        listWrap.appendChild(styleHideScroll);

        if (categories.length === 0) {
          listWrap.innerHTML = `<div style="text-align:center;padding:24px 0;color:var(--color-text-2);font-size:13px">暂无分类</div>`;
        } else {
          categories.forEach(cat => {
            const catEl = document.createElement("div");
            catEl.style.cssText = `border:1px solid var(--color-border);border-radius:12px;margin-bottom:10px;overflow:hidden;`;
            const catHead = document.createElement("div");
            catHead.style.cssText = `padding:8px 10px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;background:color-mix(in srgb, var(--color-main) 8%, transparent);font-size:13px;font-weight:bold;color:var(--color-text);`;
            const expandBtn = document.createElement("span");
            expandBtn.textContent = cat.expanded ? "▼" : "▶";
            expandBtn.style.cssText = "cursor:pointer;font-size:11px;";
            expandBtn.onclick = () => {
              M.toggleCategoryExpand(cat.id);
              this.render();
            };

            const catDisableCheck = document.createElement("input");
            catDisableCheck.type = "checkbox";
            catDisableCheck.checked = !cat.isDisabled;
            catDisableCheck.onchange = ()=>{
              M.toggleCategoryDisable(cat.id, !catDisableCheck.checked);
              this.render();
            };

            const groupCheck = document.createElement("input");
            groupCheck.type = "checkbox";
            groupCheck.dataset.catId = cat.id;
            const showCardsGroup = kw ? cat.cards.filter(c => c.content.toLowerCase().includes(kw.toLowerCase())) : cat.cards;
            const allSelectedInGroup = showCardsGroup.length>0 && showCardsGroup.every(c=>this._selectedCards.has(c.id));
            const someSelectedInGroup = showCardsGroup.some(c=>this._selectedCards.has(c.id));
            groupCheck.checked = allSelectedInGroup;
            groupCheck.indeterminate = !allSelectedInGroup && someSelectedInGroup;
            groupCheck.onchange = ()=>{
              if(groupCheck.checked){
                showCardsGroup.forEach(c=>this._selectedCards.add(c.id));
              }else{
                showCardsGroup.forEach(c=>this._selectedCards.delete(c.id));
              }
              this.render();
            };

            const catName = document.createElement("span");
            catName.textContent = `${cat.name} (${cat.cards.length})`;
            catName.style.flex = "1";

            const groupToggleBtn = document.createElement("button");
            const allCardDisabled = cat.cards.length > 0 && cat.cards.every(c => c.isDisabled);
            if(allCardDisabled){
              groupToggleBtn.textContent = "整组启用";
              groupToggleBtn.style = "padding:2px 5px;border:1px solid var(--color-main);border-radius:4px;background:var(--color-bg);color:var(--color-main);font-size:10px;cursor:pointer;";
              groupToggleBtn.onclick = ()=>{
                cat.cards.forEach(card=>{
                  M.updateCard(cat.id, card.id, {isDisabled:false, disabledBy:null});
                });
                Toast.show(`已将「${cat.name}」全部字卡设置为启用`);
                this.render();
              };
            }else{
              groupToggleBtn.textContent = "整组禁用";
              groupToggleBtn.style = "padding:2px 5px;border:1px solid #ff9500;border-radius:4px;background:var(--color-bg);color:#ff9500;font-size:10px;cursor:pointer;";
              groupToggleBtn.onclick = ()=>{
                const myNick = M.getMyNick();
                cat.cards.forEach(card=>{
                  M.updateCard(cat.id, card.id, {isDisabled:true, disabledBy: myNick});
                });
                Toast.show(`已将「${cat.name}」全部字卡设置为禁用`);
                this.render();
              };
            }

            const upBtn = document.createElement("button");
            upBtn.textContent = "↑";
            upBtn.style = "padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);font-size:11px;cursor:pointer;";
            upBtn.onclick = () => { M.moveCategorySort(cat.id, "up"); this.render(); };
            const downBtn = document.createElement("button");
            downBtn.textContent = "↓";
            downBtn.style = "padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);font-size:11px;cursor:pointer;";
            downBtn.onclick = () => { M.moveCategorySort(cat.id, "down"); this.render(); };
            const renameBtn = document.createElement("button");
            renameBtn.textContent = "重命名";
            renameBtn.style = "padding:2px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);font-size:11px;cursor:pointer;";
            renameBtn.onclick = () => {
              const name = prompt("输入新名称", cat.name);
              if (name) { M.renameCategory(cat.id, name.trim()); this.render(); }
            };
            const delBtn = document.createElement("button");
            delBtn.textContent = "删除";
            delBtn.style = "padding:2px 6px;border:1px solid #ff3b30;border-radius:4px;background:transparent;color:#ff3b30;font-size:11px;cursor:pointer;";
            delBtn.onclick = () => {
              if (cat.cards.length > 0) {
                const targetCatId = prompt(`分类【${cat.name}】存在字卡，请输入要迁移目标分类ID\n可选ID：${categories.filter(x=>x.id!==cat.id).map(i=>i.id).join(",")}`,"");
                if(!targetCatId) return;
                if(!M.deleteCategory(cat.id, targetCatId)) return;
              } else {
                if (!confirm(`确定删除空分类「${cat.name}」？`)) return;
                if(!M.deleteCategory(cat.id,null)) return;
              }
              Toast.show("分类已删除");
              this.render();
            };

            catHead.appendChild(expandBtn);
            catHead.appendChild(catDisableCheck);
            catHead.appendChild(groupCheck);
            catHead.appendChild(catName);
            catHead.appendChild(groupToggleBtn);
            catHead.appendChild(upBtn);
            catHead.appendChild(downBtn);
            catHead.appendChild(renameBtn);
            catHead.appendChild(delBtn);
            catEl.appendChild(catHead);

            if (cat.expanded) {
              const cardList = document.createElement("div");
              cardList.style.cssText = `padding:6px 10px;${cat.isDisabled ? "opacity:0.6;" : ""}`;
              const showCards = kw ? cat.cards.filter(c => c.content.toLowerCase().includes(kw.toLowerCase())) : cat.cards;
              if (showCards.length === 0) {
                cardList.innerHTML = `<div style="text-align:center;padding:10px 0;color:var(--color-text-2);font-size:12px">该分类暂无匹配字卡</div>`;
              } else {
                showCards.forEach(card => {
                  const cardEl = document.createElement("div");
                  cardEl.style.cssText = `padding:8px;border:1px solid var(--color-border);border-radius:8px;margin-bottom:6px;${card.isDisabled ? "opacity:0.6;background:var(--color-bg);" : ""}display:flex;align-items:flex-start;gap:6px;`;
                  const ck = document.createElement("input");
                  ck.type = "checkbox";
                  ck.style.cssText = "margin-top:2px";
                  ck.checked = this._selectedCards.has(card.id);
                  ck.onchange = ()=>{
                    if(ck.checked) this._selectedCards.add(card.id);
                    else this._selectedCards.delete(card.id);
                    const gCheckDom = catHead.querySelector('input[type="checkbox"][data-cat-id="'+cat.id+'"]');
                    if(gCheckDom){
                      const curShow = kw ? cat.cards.filter(c => c.content.toLowerCase().includes(kw.toLowerCase())) : cat.cards;
                      const allSel = curShow.length>0 && curShow.every(c=>this._selectedCards.has(c.id));
                      const someSel = curShow.some(c=>this._selectedCards.has(c.id));
                      gCheckDom.checked = allSel;
                      gCheckDom.indeterminate = !allSel && someSel;
                    }
                  };

                  const textwrap = document.createElement("div");
                  textwrap.style.cssText = "flex:1;min-width:0;";
                  let badgeHtml = "";
                  if (card.isDisabled) {
                    const by = card.disabledBy;
                    const isBoth = by && by !== M.getMyNick();
                    const badgeText = isBoth ? "双方禁用" : "单方禁用";
                    badgeHtml = `<span style="font-size:10px;padding:1px 4px;border-radius:4px;background:#ff3b30;color:#fff;white-space:nowrap;">${badgeText}</span>`;
                  }
                  textwrap.innerHTML = `
                    <div style="font-size:12px;color:var(--color-text-2);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;${card.isDisabled ? 'text-decoration:line-through;' : ''}">${card.content}</div>
                    <div style="text-align:right;margin-top:3px;">${badgeHtml}</div>
                  `;

                  const ops = document.createElement("div");
                  ops.style.cssText = "display:flex;gap:4px;flex-wrap:wrap;";
                  const sendBtn = document.createElement("button");
                  sendBtn.textContent = "发送";
                  sendBtn.style.cssText = "padding:3px 6px;border:none;border-radius:4px;background:var(--color-main);color:#fff;font-size:11px;cursor:pointer;";
                  sendBtn.onclick = () => {
                    if (M.sendCardToChat(card)) Toast.show("已发送到聊天");
                  };
                  const editBtn = document.createElement("button");
                  editBtn.textContent = "编辑";
                  editBtn.style.cssText = "padding:3px 6px;border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg);color:var(--color-text);font-size:11px;cursor:pointer;";
                  editBtn.onclick = () => {
                    const newText = prompt("编辑字卡内容：", card.content);
                    if (newText && newText.trim()) {
                      M.updateCard(cat.id, card.id, { content: newText.trim() });
                      this.render();
                    }
                  };
                  const toggleDisableBtn = document.createElement("button");
                  toggleDisableBtn.textContent = card.isDisabled ? "启用" : "禁用";
                  toggleDisableBtn.style.cssText = "padding:3px 6px;border:1px solid " + (card.isDisabled ? "var(--color-main)" : "#ff9500") + ";border-radius:4px;background:var(--color-bg);color:" + (card.isDisabled ? "var(--color-main)" : "#ff9500") + ";font-size:11px;cursor:pointer;";
                  toggleDisableBtn.onclick = () => {
                    if (card.isDisabled) {
                      M.updateCard(cat.id, card.id, { isDisabled: false, disabledBy: null });
                    } else {
                      M.updateCard(cat.id, card.id, { isDisabled: true, disabledBy: M.getMyNick() });
                    }
                    this.render();
                  };
                  const delBtnCard = document.createElement("button");
                  delBtnCard.textContent = "删除";
                  delBtnCard.style.cssText = "padding:3px 6px;border:none;border-radius:4px;background:#ff3b30;color:#fff;font-size:11px;cursor:pointer;";
                  delBtnCard.onclick = () => {
                    if(!confirm("确定删除这张字卡？")) return;
                    M.deleteCard(cat.id, card.id);
                    this.render();
                  };
                  ops.appendChild(sendBtn);
                  ops.appendChild(editBtn);
                  ops.appendChild(toggleDisableBtn);
                  ops.appendChild(delBtnCard);

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
        wrap.appendChild(head);
        wrap.appendChild(batchBar);
        wrap.appendChild(listWrap);
    }
    this.rootEl.appendChild(wrap);

       // 绑定标签切换
    wrap.querySelectorAll('[data-tab-key]').forEach(btn=>{
      btn.onclick = ()=>{
        this.activeTab = btn.dataset.tabKey;
        // 切换标签页时，重置auditReport的搜索和勾选状态
        if(this.activeTab === "auditReport"){
            this._cardSearch = "";
            this._selectedCards.clear();
        }
        this.render();
      }
    })

    // 【只在自定义/系统标签才执行下面表单按钮绑定，auditReport不走这里】
    if(this.activeTab !== "auditReport"){
        const group = window.AuditCardModule.cardGroups[this.activeTab];
        const list = group?.list || [];
        const isSystemGroup = this.activeTab === "system";

        // 新增按钮
        if(!isSystemGroup){
          const addBtn = document.getElementById("btn-add-new");
          if(addBtn){
            addBtn.onclick = ()=>{
              const title = document.getElementById("in-card-title").value.trim();
              const content = document.getElementById("in-card-content").value.trim();
              if(!content){
                Toast.show("内容不能为空");
                return;
              }
              window.AuditCardModule.addCard(this.activeTab, {title, content, side:"bot"});
              this.render();
            }
          }
        }
        // 发送按钮
        wrap.querySelectorAll('[data-send-id]').forEach(btn=>{
          btn.onclick = ()=>{
            const cid = Number(btn.dataset.sendId);
            const found = list.find(x=>x.id === cid);
            if(found){
              window.AuditCardModule.sendCardToChat(found);
            }
          }
        })
        // 删除按钮（非system分组）
        wrap.querySelectorAll('[data-del-id]').forEach(btn=>{
          btn.onclick = ()=>{
            const cid = Number(btn.dataset.delId);
            const idx = list.findIndex(x=>x.id === cid);
            if(idx === -1) return;
            list.splice(idx,1);
            window.AuditCardModule.saveToStorage();
            Toast.show("已删除");
            this.render();
          }
        })
    }
  }
};
