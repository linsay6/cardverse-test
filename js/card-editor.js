import { EventBus } from './core/context.js';
import { Toast } from './core/toast.js';
import { Store } from './core/store.js';

export const CardEditorModule = {
  rootEl: null,
  activeTab: "custom",
  activeSubTab: null,
  activeSg: null,   // ← 新增这一行
  inSubgroupDetail: false,
  _cardSearch: "",
  _selectedCards: new Set(),
  // === 模块元配置，对应需求JSON，不要修改subgroupId，desc可改 ===
  moduleMeta: [
    { subgroupId:"custom-global", name:"公用字卡", type:"A", desc:"公用字卡，全部联系人可用。" },
    { subgroupId:"custom-contact", name:"专属字卡", type:"A", desc:"专属字卡，仅当前激活联系人可用。" },
    { subgroupId:"custom-fun-global", name:"其他互动功能字卡·公用", type:"A", desc:"其他互动功能相关字卡，添加后全部联系人都可以使用。" },
    { subgroupId:"custom-fun-contact", name:"其他互动功能字卡·专属", type:"A", desc:"其他互动功能字卡·专属，仅当前联系人可用。" },
    { subgroupId:"custom-trace", name:"寻踪日常·我的添加", type:"B", desc:"寻踪日常相关字卡，添加后全部联系人都可以使用。" },
    { subgroupId:"custom-love-words", name:"今日情话·我的添加", type:"C", desc:"今日情话相关字卡，添加后全部联系人都可以使用。" },
    { subgroupId:"custom-ask-open", name:"TA的询问·我的添加", type:"D", desc:"TA的询问相关字卡，添加后全部联系人都可以使用。" },
    { subgroupId:"custom-ask-choice", name:"TA的小问题·我的添加", type:"E", desc:"TA的小问题相关字卡，添加后全部联系人都可以使用。" },
    { subgroupId:"custom-curious", name:"TA的好奇·我的添加", type:"A", desc:"TA的好奇相关字卡，添加后全部联系人都可以使用。" },
    { subgroupId:"custom-complain", name:"TA的吐槽·我的添加", type:"A", desc:"TA的吐槽相关字卡，添加后全部联系人都可以使用。" },
    { subgroupId:"custom-check", name:"TA的查岗·我的添加", type:"A", desc:"TA的查岗相关字卡，添加后全部联系人都可以使用。" },
    { subgroupId:"custom-invite", name:"TA的邀请·我的添加", type:"A", desc:"TA的邀请相关字卡，添加后全部联系人都可以使用。" }
  ],
  // 根据subgroupId获取模块元信息
  getModuleMeta(sgId){
    return this.moduleMeta.find(m=>m.subgroupId === sgId) ?? {type:"A",desc:""};
  },
  // 辅助：获取当前tab下所有子分组总卡片数
  getTabTotalCardCount(tabKey, contactId) {
    const M = window.AuditCardModule;
    const group = M.cardGroups[tabKey];
    if(!group || !group.subgroups) return 0;
    let total = 0;
    group.subgroups.forEach(sg=>{
      if(sg.scope === "global"){
        total += sg.list.length;
      }else if(contactId){
        total += sg.list.filter(c=>c.contactId === contactId).length;
      }
    })
    return total;
  },
  // 辅助：获取单个子分组卡片数量
  getSubgroupCardCount(tabKey, sgId, contactId) {
    const M = window.AuditCardModule;
    const list = M.getSubgroupCards(tabKey, sgId, contactId);
    return list.length;
  },
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
    EventBus.on("my-audit-data-updated", () => this.render());
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
    const contactId = window.GLOBAL_CONTEXT?.activeSessionId || Store.get("activeContactId");
    let tabHtml = `<div style="display:flex;gap:6px;margin-bottom:14px;justify-content:center;flex-shrink:0;">`;
    tabKeys.forEach(k=>{
      const active = this.activeTab === k
        ? "background:var(--color-main);color:#fff"
        : "background:var(--color-bg);color:var(--color-text);border:1px solid var(--color-border)";
      let badge = "";
      if(k === "custom" || k === "system"){
        const count = this.getTabTotalCardCount(k, contactId);
        badge = `<span style="margin-left:6px;padding:1px 6px;border-radius:99px;background:rgba(255,255,255,0.25);font-size:11px">${count}</span>`;
      }else if(k === "auditReport"){
        const count = window.AuditCardModule.getAuditCardCount();
        badge = `<span style="margin-left:6px;padding:1px 6px;border-radius:99px;background:rgba(255,255,255,0.25);font-size:11px">${count}</span>`;
      }
      tabHtml += `<button data-tab-key="${k}" style="padding:6px 10px;border-radius:99px;border:none;${active};display:flex;align-items:center">${tabNames[k]}${badge}</button>`;
    })
    tabHtml += `</div>`;
    wrap.innerHTML = tabHtml;

        const M = window.AuditCardModule;
    // ========= 区分分支：custom / system 使用原有渲染；auditReport 使用完整分类渲染（和audit‑panel字卡库UI完全对齐） =========
             if(this.activeTab !== "auditReport"){
      const group = M.cardGroups[this.activeTab];
      const contactId = window.GLOBAL_CONTEXT?.activeSessionId || Store.get("activeContactId");
      const isSystemGroup = this.activeTab === "system";

      // ---------------- 分支A：分组首页（卡片列表，点击进详情） ----------------
      if(!this.inSubgroupDetail){
     // 搜索框
        const searchWrap = document.createElement("div");
        searchWrap.style.cssText = "margin-bottom:12px;";
        const searchInput = document.createElement("input");
        searchInput.placeholder = "搜索当前分类下所有字卡标题/内容...";
        searchInput.value = this._cardSearch || "";
        searchInput.style.cssText = `width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--color-border);border-radius:var(--radius-btn);background:var(--color-bg);color:var(--color-text);font-size:13px;`;
        searchInput.oninput = ()=>{
            this._cardSearch = searchInput.value.trim();
            this.render();
        };
        searchWrap.appendChild(searchInput);
        wrap.appendChild(searchWrap);

        // 滚动容器，使用全局panel-scroll（css-theme已经写好隐藏滚动条）
       const scrollWrap = document.createElement("div");
        scrollWrap.className = "panel-scroll";
        scrollWrap.style.cssText = `
          flex:1;
          min-height:0;
          overflow-y:auto;
          scrollbar-width:none;
          -ms-overflow-style:none;
        `;
        // webkit内核隐藏滚动条
        const stylePanelScroll = document.createElement('style');
        stylePanelScroll.textContent = `.panel-scroll::-webkit-scrollbar { display:none !important; }`;
        scrollWrap.appendChild(stylePanelScroll);
        // 过滤：当前tab下，匹配搜索关键词的子分组卡片
        const kw = (this._cardSearch || "").toLowerCase();
        group.subgroups.forEach(sg=>{
          let sgCardList = M.getSubgroupCards(this.activeTab, sg.subgroupId, contactId);
          // 关键词过滤
          if(kw){
            sgCardList = sgCardList.filter(card=>{
              const t = (card.title || "").toLowerCase();
              const c = (card.content || "").toLowerCase();
              return t.includes(kw) || c.includes(kw);
            })
          }
          const sgCount = sgCardList.length;
          // 无搜索匹配，不渲染这个分组
          if(kw && sgCount <= 0) return;

          const cardItem = document.createElement("div");
          const isGroupOff = !!sg.isGroupDisabled;
          cardItem.style.cssText = `
            border:1px solid var(--color-border);
            border-radius:var(--radius-card);
            padding:14px;
            margin-bottom:10px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            cursor:pointer;
            background:var(--color-bg);
            ${isGroupOff ? "opacity:0.6;" : ""}
          `;
                   // system分组才显示整组开关，custom不渲染
          let groupSwitchHtml = "";
          if(this.activeTab === "system"){
            const groupOff = !!sg.isGroupDisabled;
            groupSwitchHtml = `<button data-sg-toggle="${sg.subgroupId}" style="margin-left:8px;padding:2px 6px;font-size:10px;border-radius:4px;border:none;background:${groupOff ? "#ff9500" : "var(--color-main)"};color:#fff;cursor:pointer">${groupOff ? "整组启用":"整组停用"}</button>`;
          }

          cardItem.innerHTML = `
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <div>
                <div style="font-weight:bold;color:var(--color-text)">${sg.name}</div>
                <div style="font-size:12px;color:var(--color-text-2);margin-top:3px">
                  ${sg.scope === "global" ? "全局公用，所有联系人可用" : "仅当前联系人专属"}
                </div>
              </div>
              ${groupSwitchHtml}
            </div>
            <div style="padding:2px 8px;border-radius:99px;background:var(--color-main);color:#fff;font-size:11px">${sgCount}</div>
          `;
          cardItem.onclick = ()=>{
            this.activeSubTab = sg.subgroupId;
            this.inSubgroupDetail = true;
            this.render();
          };
          scrollWrap.appendChild(cardItem);
        })
        wrap.appendChild(scrollWrap);
        // 绑定system分组整组开关
        if(this.activeTab === "system"){
          scrollWrap.querySelectorAll('[data-sg-toggle]').forEach(btn=>{
            btn.onclick = (e)=>{
              e.stopPropagation(); // 阻止冒泡，不要触发进入分组详情
              const sgId = btn.dataset.sgToggle;
              const sgObj = group.subgroups.find(s=>s.subgroupId === sgId);
              const newOff = !sgObj.isGroupDisabled;
              M.setSubgroupGroupDisable(this.activeTab, sgId, newOff);
              Toast.show(newOff ? "已整组停用":"已整组启用");
              this.render();
            }
          })
        }
      }
           // ---------------- 分支B：子分组详情页（支持A/B/C/D/E多类型模块） ----------------
      else {
        const activeSg = group.subgroups.find(sg=>sg.subgroupId === this.activeSubTab);
        const sgCardList = M.getSubgroupCards(this.activeTab, this.activeSubTab, contactId);
        const meta = this.getModuleMeta(activeSg.subgroupId);
        // 返回按钮
        const backBtn = document.createElement("button");
        backBtn.textContent = "← 返回分组列表";
        backBtn.style.cssText = "margin-bottom:12px;padding:4px 8px;background:transparent;border:none;color:var(--color-main);cursor:pointer;text-align:left";
        backBtn.onclick = ()=>{
          this.inSubgroupDetail = false;
          this.render();
        };
        wrap.appendChild(backBtn);

        // system页面增加说明提示文本
        if(isSystemGroup){
          const sysTip = document.createElement("div");
          sysTip.style.cssText = "border:1px dashed var(--color-border);border-radius:var(--radius-card);padding:12px;margin-bottom:12px;color:var(--color-text-2);font-size:13px;";
          sysTip.innerText = "说明：本站「系统预设字卡」均为自搓字卡（AI辅助设计），按分类/分组展示，可逐张开启或关闭；想一次停掉一组，用分组标题右侧的「整组停用」开关。当前状态：系统预设字卡已解锁，联系人回复与各功能可正常取用。";
          wrap.appendChild(sysTip);
        }else{
          // custom：权限+分组描述提示框
          const tipDiv = document.createElement("div");
          tipDiv.style.cssText = "border:1px dashed var(--color-border);border-radius:var(--radius-card);padding:12px;margin-bottom:12px;color:var(--color-text-2);font-size:13px;";
          const scopeText = activeSg.scope === "global" ? "🔹权限：全局公用，所有联系人可用" : "🔹权限：仅当前联系人专属";
          tipDiv.innerText = meta.desc ? `${scopeText}\n${meta.desc}` : scopeText;
          wrap.appendChild(tipDiv);

          // ========== 根据模块type分支渲染 ==========
          if(meta.type === "A"){
            // A型纯字卡列表：原有表单、导入导出逻辑完整保留
            const formDiv = document.createElement("div");
            formDiv.style.cssText = "border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px;margin-bottom:14px;";
            formDiv.innerHTML = `
              <div style="font-weight:bold;margin-bottom:10px;color:var(--color-text)">新增字卡【${activeSg.name}】</div>
              <div style="margin-bottom:8px;">
                <div style="font-size:13px;color:var(--color-text-2);margin-bottom:4px;">标题</div>
                <input id="in-card-title" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--color-border);border-radius:var(--radius-btn);background:var(--color-bg);color:var(--color-text)" placeholder="标题">
              </div>
              <div style="margin-bottom:10px;">
                <div style="font-size:13px;color:var(--color-text-2);margin-bottom:4px;">内容</div>
                <textarea id="in-card-content" rows="3" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--color-border);border-radius:var(--radius-btn);background:var(--color-bg);color:var(--color-text);resize:none" placeholder="字卡内容"></textarea>
              </div>
              <button id="btn-add-new" style="width:100%;padding:8px;background:var(--color-main);color:#fff;border:none;border-radius:var(--radius-btn)">添加到当前子分组</button>
              <div style="display:flex;gap:8px;margin-top:10px;">
                <button id="btn-export-custom" style="flex:1;padding:7px;border:1px solid var(--color-border);border-radius:var(--radius-btn);background:var(--color-bg);color:var(--color-text)">全量导出json</button>
                <button id="btn-import-custom" style="flex:1;padding:7px;border:none;border-radius:var(--radius-btn);background:var(--color-main);color:#fff">导入json</button>
              </div>
            `;
            wrap.appendChild(formDiv);
          }else if(["B","C","D","E"].includes(meta.type)){
            // B寻踪日常 / C今日情话 / D TA询问 / E TA小问题：【占位提示，后续在这里替换为完整UI DOM】
            const placeHolderBox = document.createElement("div");
            placeHolderBox.style.cssText = "border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px;margin-bottom:14px;background:color-mix(in srgb, var(--color-main) 6%, transparent);";
            placeHolderBox.innerHTML = `
              <div style="font-weight:bold;color:var(--color-text);margin-bottom:6px;">模块【${meta.name}】type=${meta.type}</div>
              <div style="font-size:12px;color:var(--color-text-2);">此模块UI待开发，下方为原始字卡列表，可发送、删除卡片。后续将在此位置渲染开关、概率滑块、Tab、批量录入表单。</div>
            `;
            wrap.appendChild(placeHolderBox);
          }
        }

        // ========== 通用字卡列表渲染，A/B/C/D/E全部共用这一份列表渲染 ==========
        const listWrap = document.createElement("div");
        listWrap.className = "panel-scroll";
        listWrap.style.cssText = "flex:1;min-height:0;";
        listWrap.innerHTML = `<div style="font-weight:bold;margin-bottom:8px;color:var(--color-text)">${activeSg.name}（${sgCardList.length}条）</div>`;
        if(sgCardList.length === 0){
          listWrap.innerHTML += `<div style="color:var(--color-text-2);font-size:13px">暂无字卡</div>`;
        }else{
          sgCardList.forEach(card=>{
            const item = document.createElement("div");
            const groupDisabled = !!activeSg.isGroupDisabled;
            const cardDisabled = !!card.isDisabled;
            item.style.cssText = `border:1px solid var(--color-border);border-radius:var(--radius-card);padding:10px;margin-bottom:8px;${(groupDisabled || cardDisabled) ? "opacity:0.6;" : ""}`;
            let cardToggleBtn = "";
            if(isSystemGroup){
              const cardDisabled = !!card.isDisabled;
              cardToggleBtn = `<button data-card-toggle="${card.id}" style="padding:3px 6px;font-size:12px;border:none;border-radius:4px;background:${cardDisabled ? "#ff9500":"var(--color-main)"};color:#fff">${cardDisabled?"启用":"禁用"}</button>`;
            }
            item.innerHTML = `
              <div style="font-weight:bold;color:var(--color-main)">${card.title||"无标题"}</div>
              <div style="font-size:13px;color:var(--color-text-2);margin:4px 0;white-space:pre-wrap">${card.content}</div>
              <div style="display:flex;gap:6px;margin-top:6px">
                <button data-send-id="${card.id}" style="padding:3px 6px;font-size:12px;background:var(--color-main);color:#fff;border:none;border-radius:4px">发送</button>
                ${cardToggleBtn}
                ${!isSystemGroup ? `<button data-del-id="${card.id}" style="padding:3px 6px;font-size:12px;background:#e53935;color:#fff;border:none;border-radius:4px">删除</button>`:""}
              </div>
            `;
            listWrap.appendChild(item);
          })
        }
        wrap.appendChild(listWrap);
      }
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
        // 切顶层tab强制回到分组首页
        this.inSubgroupDetail = false;
        this.activeSubTab = null;
        // 切换标签页时重置搜索
        this._cardSearch = "";
        if(this.activeTab === "auditReport"){
            this._selectedCards.clear();
        }
        this.render();
      }
    })

    // 【只在自定义/系统标签、并且进入了子分组详情页，才执行下面表单按钮绑定，auditReport不走这里】
        if(this.activeTab !== "auditReport" && this.inSubgroupDetail){
      const M = window.AuditCardModule;
      const group = M.cardGroups[this.activeTab];
      const activeSg = group.subgroups.find(sg=>sg.subgroupId === this.activeSubTab);
      const contactId = window.GLOBAL_CONTEXT?.activeSessionId || Store.get("activeContactId");
      const sgCardList = M.getSubgroupCards(this.activeTab, this.activeSubTab, contactId);
      const isSystemGroup = this.activeTab === "system";

      if(!isSystemGroup){
        const addBtn = document.getElementById("btn-add-new");
        const expBtn = document.getElementById("btn-export-custom");
        const impBtn = document.getElementById("btn-import-custom");
        if(addBtn){
          addBtn.onclick = ()=>{
            const title = document.getElementById("in-card-title").value.trim();
            const content = document.getElementById("in-card-content").value.trim();
            if(!content){ Toast.show("内容不能为空"); return; }
            M.addCardToSubgroup(this.activeTab, this.activeSubTab, {title, content, side:"bot"}, contactId);
            this.render();
          }
        }
        // 导出
        if(expBtn){
          expBtn.onclick = async ()=>{
            const json = M.exportCustomCardJson(contactId);
            const blob = new Blob([JSON.stringify(json,null,2)], {type:"application/json"});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `自定义字卡备份-${new Date().toLocaleDateString()}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(a.href);
            Toast.show("导出完成");
          }
        }
        // 导入
        if(impBtn){
          impBtn.onclick = ()=>{
            const input = document.createElement('input');
            input.type="file";
            input.accept=".json";
            input.onchange = async (ev)=>{
              const file = ev.target.files[0];
              if(!file) return;
              const txt = await file.text();
              try{
                const obj = JSON.parse(txt);
                const ok = M.importCustomCardJson(obj, contactId);
                if(ok){ Toast.show("导入完成"); this.render(); }
                else { Toast.show("导入失败，文件格式错误"); }
              }catch(e){ Toast.show("JSON解析失败"); }
            }
            input.click();
          }
        }
      }

            // 发送按钮
      wrap.querySelectorAll('[data-send-id]').forEach(btn=>{
        btn.onclick = ()=>{
          const cid = Number(btn.dataset.sendId);
          const found = sgCardList.find(x=>x.id === cid);
          if(found){
            M.sendCardToChat(found);
          }
        }
      })
      // system单张字卡启用/禁用
      wrap.querySelectorAll('[data-card-toggle]').forEach(btn=>{
        btn.onclick = ()=>{
          const cid = Number(btn.dataset.cardToggle);
          const found = sgCardList.find(x=>x.id === cid);
          const newState = !found.isDisabled;
          M.setSubgroupCardDisable(this.activeTab, this.activeSubTab, cid, newState);
          Toast.show(newState ? "卡片已禁用":"卡片已启用");
          this.render();
        }
      })
      // 删除按钮
      wrap.querySelectorAll('[data-del-id]').forEach(btn=>{
        btn.onclick = (e)=>{
          const cid = Number(e.target.dataset.delId);
          M.deleteCardFromSubgroup(this.activeTab, this.activeSubTab, cid);
          Toast.show("已删除");
          this.render();
        }
      })
    }
  }
};
