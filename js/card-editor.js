import { EventBus } from './core/context.js';
import { Toast } from './core/toast.js';

export const CardEditorModule = {
  rootEl: null,
  activeTab: "custom", // 默认打开【自定义字卡】
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

    const group = window.AuditCardModule.cardGroups[this.activeTab];
    const list = group?.list || [];
    const isSystemGroup = this.activeTab === "system";

    // 新增卡片表单（系统预设分组禁止新增）
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

    // 列表渲染
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
    this.rootEl.appendChild(wrap);

    // 绑定标签切换
    wrap.querySelectorAll('[data-tab-key]').forEach(btn=>{
      btn.onclick = ()=>{
        this.activeTab = btn.dataset.tabKey;
        this.render();
      }
    })

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
};
