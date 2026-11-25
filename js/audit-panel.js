import { Toast } from './core/toast.js';
import { EventBus } from './core/context.js';

const ACTION_META = {
  add:      { label: "新增", color: "#34c759" },
  delete:   { label: "删除", color: "#ff3b30" },
  disable:  { label: "禁用", color: "#ff9500" },
  move:     { label: "迁移", color: "#0a84ff" },
  restore:  { label: "恢复", color: "#af52de" }
};

const AuditPanelModule = {
  panelEl: null,
  activeTab: "pending",
  selectedIds: new Set(),
  searchKeyword: "",
  lastSwitchAt: 0,

    init() {
    EventBus.on("open‑panel", (payload) => {
      if (payload && payload.panel === "audit") this.open();
    });
  },

  open() {
    if (this.panelEl) this.close();
    this.selectedIds = new Set();
    this.searchKeyword = "";

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
      box-shadow:0 12px 40px rgba(0,0,0,0.25);
      box-sizing:border-box;
    `;

    mask.appendChild(box);
    document.body.appendChild(mask);
    this.panelEl = mask;

    this.render(box);
    this.bindMaskClose(mask);
    // 仅电脑端监听ESC
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

  // ---------- 主渲染 ----------
  render(box) {
    const tabs = [
      { key: "pending",     name: "待审核" },
      { key: "history",     name: "历史档案" },
      { key: "cardlib",     name: "字卡库" },
      { key: "settings",    name: "设置" }
    ];

    const tabBar = document.createElement("div");
    tabBar.style.cssText = `
      display:flex;gap:4px;padding:12px 12px 0;flex-wrap:wrap;
    `;
    tabs.forEach(t => {
      const btn = document.createElement("button");
      const active = this.activeTab === t.key;
      btn.textContent = t.name;
      btn.dataset.tab = t.key;
      btn.style.cssText = `
        flex:1;padding:10px 4px;border:none;border-radius:999px;cursor:pointer;
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
    body.style.cssText = `flex:1;overflow-y:auto;padding:12px;box-sizing:border-box;-webkit-overflow-scrolling:touch;`;

    box.innerHTML = "";
    box.appendChild(tabBar);
    box.appendChild(body);

    if (this.activeTab === "pending")  this.renderPending(body);
    if (this.activeTab === "history") this.renderHistory(body);
    if (this.activeTab === "cardlib")  this.renderCardLib(body);
    if (this.activeTab === "settings") this.renderSettings(body);
  },

  // ---------- Tab1 待审核 ----------
  renderPending(body) {
    const list = AuditCardModule.pendingApply || [];

    const toolbar = document.createElement("div");
    toolbar.style.cssText = `
      display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;align-items:center;
    `;

    const total = list.length;
    const countTip = document.createElement("span");
    countTip.style.cssText = `font-size:12px;color:var(--color-text-2);margin-right:auto;`;
    countTip.textContent = `共 ${total} 条待审`;

    const checkAll = document.createElement("label");
    checkAll.style.cssText = `font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;`;
    const checkInput = document.createElement("input");
    checkInput.type = "checkbox";
    checkInput.checked = total > 0 && this.selectedIds.size === total;
    checkInput.onchange = () => {
      if (checkInput.checked) list.forEach(p => this.selectedIds.add(p.applyId));
      else this.selectedIds.clear();
      this.render(body.parentElement.querySelector("div:nth-child(2)") || body);
    };
    checkAll.appendChild(checkInput);
    checkAll.appendChild(document.createTextNode("全选"));

    const agreeAll = document.createElement("button");
    agreeAll.textContent = "批量同意";
    agreeAll.style = "padding:8px 10px;border:none;border-radius:8px;background:#34c759;color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
    agreeAll.onclick = () => this.batchApprove("agree");

    const rejectAll = document.createElement("button");
    rejectAll.textContent = "批量驳回";
    rejectAll.style = "padding:8px 10px;border:none;border-radius:8px;background:#ff3b30;color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
    rejectAll.onclick = () => this.batchApprove("reject");

    toolbar.appendChild(countTip);
    toolbar.appendChild(checkAll);
    toolbar.appendChild(agreeAll);
    toolbar.appendChild(rejectAll);
    body.appendChild(toolbar);

    if (list.length === 0) {
      body.innerHTML += `<div style="text-align:center;padding:30px 0;color:var(--color-text-2);font-size:13px">暂无待审申请</div>`;
      return;
    }

    list.forEach(item => {
      const meta = ACTION_META[item.action] || { label: item.action, color: "#888" };
      const card = document.createElement("div");
      card.style.cssText = `
        border:1px solid var(--color-border);border-radius:12px;padding:10px;margin-bottom:8px;
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
      text.textContent = item.cardText || "（无文本）";

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
      agreeBtn.style = "flex:1;padding:9px;border:none;border-radius:8px;background:#34c759;color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
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
      body.appendChild(card);
    });
  },

  singleApprove(item, result, remark) {
    if (result === "agree") this.applyCardChange(item);
    AuditCardModule.approveApply(item.applyId, result, remark || "");
    this.selectedIds.delete(item.applyId);
    Toast.show(result === "agree" ? "已同意" : "已驳回");
    this.render(this.panelEl.querySelector("div:nth-child(2)"));
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
    this.render(this.panelEl.querySelector("div:nth-child(2)"));
  },

  // 同意后执行真实字卡变更
  applyCardChange(item) {
    const M = AuditCardModule;
    const findCard = (text) => {
      for (const key of ["custom", "auditReport"]) {
        const found = M.cardGroups[key].list.find(c => c.content === text);
        if (found) return { groupKey: key, card: found };
      }
      return null;
    };

    switch (item.action) {
      case "add": {
        const groupKey = item.targetGroupId || "auditReport";
        const existed = findCard(item.cardText);
        if (!existed) {
          M.addCard(groupKey, {
            title: item.cardText.slice(0, 10) || "字卡",
            content: item.cardText,
            side: "bot"
          });
        }
        break;
      }
      case "delete": {
        const hit = findCard(item.cardText);
        if (hit) {
          const idx = M.cardGroups[hit.groupKey].list.indexOf(hit.card);
          M.cardGroups[hit.groupKey].list.splice(idx, 1);
          M.saveToStorage();
        }
        break;
      }
      case "disable": {
        const hit = findCard(item.cardText);
        if (hit) { hit.card.isDisabled = true; M.saveToStorage(); }
        break;
      }
      case "restore": {
        const hit = findCard(item.cardText);
        if (hit) { hit.card.isDisabled = false; M.saveToStorage(); }
        break;
      }
      case "move": {
        const from = item.sourceGroupId;
        const to = item.targetGroupId;
        if (!from || !to || from === to) break;
        const hit = M.cardGroups[from]?.list.find(c => c.content === item.cardText);
        if (hit) {
          const idx = M.cardGroups[from].list.indexOf(hit);
          M.cardGroups[from].list.splice(idx, 1);
          M.cardGroups[to].list.push(hit);
          M.saveToStorage();
        }
        break;
      }
    }
  },

  // ---------- Tab2 历史档案 ----------
  renderHistory(body) {
    const list = AuditCardModule.auditHistory || [];

    const bar = document.createElement("div");
    bar.style.cssText = `display:flex;gap:8px;margin-bottom:10px;align-items:center;`;

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
      this.renderHistory(body);
    };

    bar.appendChild(search);
    bar.appendChild(clearBtn);
    body.appendChild(bar);

    const kw = this.searchKeyword.toLowerCase();
    const filtered = list.filter(h => {
      if (!kw) return true;
      return [h.cardText, h.applicant, h.action, h.auditResult]
        .join(" ")
        .toLowerCase()
        .includes(kw);
    });

    if (filtered.length === 0) {
      body.innerHTML += `<div style="text-align:center;padding:30px 0;color:var(--color-text-2);font-size:13px">暂无历史记录</div>`;
      return;
    }

    filtered.forEach(h => {
      const meta = ACTION_META[h.action] || { label: h.action, color: "#888" };
      const resultColor = h.auditResult === "agree" ? "#34c759" : "#ff3b30";
      const row = document.createElement("div");
      row.style.cssText = `border:1px solid var(--color-border);border-radius:12px;padding:10px;margin-bottom:8px;box-sizing:border-box;`;
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
      body.appendChild(row);
    });
  },

  // ---------- Tab3 字卡库 ----------
  renderCardLib(body) {
    const M = AuditCardModule;
    const groupKeys = ["custom", "system", "auditReport"];

    const seg = document.createElement("div");
    seg.style.cssText = `display:flex;gap:6px;margin-bottom:10px;`;
    const segState = this._libTab || "custom";

    groupKeys.forEach(key => {
      const g = M.cardGroups[key];
      const btn = document.createElement("button");
      btn.textContent = `${g.name}(${g.list.length})`;
      btn.style = `
        flex:1;padding:8px 4px;border:none;border-radius:999px;font-size:12px;cursor:pointer;min-height:34px;touch-action:manipulation;
        ${segState === key ? "background:var(--color-main);color:#fff" : "background:transparent;color:var(--color-text);border:1px solid var(--color-border)"}
      `;
      btn.onclick = () => { this._libTab = key; this.renderCardLib(body); };
      seg.appendChild(btn);
    });
    body.appendChild(seg);

    const group = M.cardGroups[segState];
    const list = group.list;
    const isSystem = segState === "system";

    if (!isSystem) {
      const form = document.createElement("div");
      form.style.cssText = `border:1px dashed var(--color-border);border-radius:12px;padding:10px;margin-bottom:10px;box-sizing:border-box;`;
      form.innerHTML = `
        <input id="lib-title" placeholder="标题（可选）" style="width:100%;box-sizing:border-box;padding:8px 8px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;margin-bottom:6px;">
        <textarea id="lib-content" rows="2" placeholder="字卡内容" style="width:100%;box-sizing:border-box;padding:8px 8px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-bg);color:var(--color-text);font-size:12px;resize:none;margin-bottom:6px;"></textarea>
      `;
      const addBtn = document.createElement("button");
      addBtn.textContent = "添加到当前分组";
      addBtn.style = "width:100%;padding:9px;border:none;border-radius:8px;background:var(--color-main);color:#fff;font-size:12px;cursor:pointer;touch-action:manipulation;";
      addBtn.onclick = () => {
        const title = form.querySelector("#lib-title").value.trim();
        const content = form.querySelector("#lib-content").value.trim();
        if (!content) { Toast.show("内容不能为空"); return; }
        M.addCard(segState, { title, content, side: "bot" });
        Toast.show("字卡已添加");
        this.renderCardLib(body);
      };
      form.appendChild(addBtn);
      body.appendChild(form);
    }

    if (list.length === 0) {
      body.innerHTML += `<div style="text-align:center;padding:24px 0;color:var(--color-text-2);font-size:13px">暂无字卡</div>`;
      return;
    }

    list.forEach(card => {
      const row = document.createElement("div");
      row.style.cssText = `
        border:1px solid var(--color-border);border-radius:12px;padding:10px;margin-bottom:8px;box-sizing:border-box;
        ${card.isDisabled ? "opacity:0.5;text-decoration:line-through;" : ""}
      `;
      row.innerHTML = `
        <div style="font-weight:bold;font-size:13px;color:var(--color-main)">${card.title || "无标题"}</div>
        <div style="font-size:12px;color:var(--color-text-2);margin:4px 0;white-space:pre-wrap;word-break:break-all;">${card.content}</div>
      `;
      const ops = document.createElement("div");
      ops.style.cssText = `display:flex;gap:6px;margin-top:6px;`;

      const sendBtn = document.createElement("button");
      sendBtn.textContent = "发送";
      sendBtn.style = "padding:6px 10px;border:none;border-radius:6px;background:var(--color-main);color:#fff;font-size:11px;cursor:pointer;touch-action:manipulation;";
      sendBtn.onclick = () => { M.sendCardToChat(card); };

      ops.appendChild(sendBtn);

      if (!isSystem) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "删除";
        delBtn.style = "padding:6px 10px;border:none;border-radius:6px;background:#ff3b30;color:#fff;font-size:11px;cursor:pointer;touch-action:manipulation;";
        delBtn.onclick = () => {
          const idx = list.indexOf(card);
          list.splice(idx, 1);
          M.saveToStorage();
          Toast.show("已删除");
          this.renderCardLib(body);
        };
        ops.appendChild(delBtn);
      }
      row.appendChild(ops);
      body.appendChild(row);
    });
  },

  // ---------- Tab4 设置 ----------
  renderSettings(body) {
    const M = AuditCardModule;
    const cfg = M.auditConfig;
    const engine = cfg.dreamEngine;

    const sectionTitle = (text) => {
      const el = document.createElement("div");
      el.style.cssText = "font-weight:bold;font-size:13px;margin:10px 0 8px;color:var(--color-text);";
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

    const numberInput = (label, value, onChange) => {
      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;";
      const span = document.createElement("span");
      span.style.cssText = "width:110px;color:var(--color-text-2);";
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

    body.appendChild(sectionTitle("梦角拟人引擎"));
    body.appendChild(toggle("抓取聊天生成申请", engine.enableGrabChat, v => { engine.enableGrabChat = v; M.saveToStorage(); }));
    body.appendChild(toggle("混沌随机变更", engine.enableChaos, v => { engine.enableChaos = v; M.saveToStorage(); }));
    body.appendChild(toggle("主动发消息", engine.enableActiveSend, v => { engine.enableActiveSend = v; M.saveToStorage(); }));

    body.appendChild(sectionTitle("引擎参数"));
    body.appendChild(numberInput("巡检周期(秒)", engine.scanIntervalSec, v => { engine.scanIntervalSec = v; M.saveToStorage(); }));
    body.appendChild(numberInput("基础触发概率", engine.baseProb, v => { engine.baseProb = v; M.saveToStorage(); }));
    body.appendChild(numberInput("情绪命中概率", engine.emotionProb, v => { engine.emotionProb = v; M.saveToStorage(); }));
    body.appendChild(numberInput("混沌操作概率", engine.chaosProb, v => { engine.chaosProb = v; M.saveToStorage(); }));
    body.appendChild(numberInput("待审上限", engine.pendingMax, v => { engine.pendingMax = v; M.saveToStorage(); }));
    body.appendChild(numberInput("冷却(毫秒)", engine.applyCoolDownMs, v => { engine.applyCoolDownMs = v; M.saveToStorage(); }));

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
        auditReportCards: M.cardGroups.auditReport.list,
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
            M.cardGroups.auditReport.list = data.auditReportCards || [];
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
