import { Store } from './core/store.js';
import { EventBus } from './core/context.js';
import { Toast } from './core/toast.js';

export const CardEditorModule = {
  rootEl: null,
  cardList: [],

  init(containerSelector) {
    this.rootEl = document.querySelector(containerSelector);
    if (!this.rootEl) {
      console.error("字卡编辑容器找不到", containerSelector);
      return;
    }
    this.cardList = Store.get("card-list", []);
    this.render();

    EventBus.on("themeChange", () => {
      this.render();
    });
  },

  render() {
    if (!this.rootEl) return;
    this.rootEl.innerHTML = "";

    const wrap = document.createElement('div');
    wrap.style.padding = "14px";

    // 新增卡片表单
    const formHtml = `
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-card);padding:14px;margin-bottom:16px;">
        <div style="font-weight:bold;margin-bottom:10px;color:var(--color-text)">新建字卡</div>
        <div style="margin-bottom:8px;">
          <div style="font-size:13px;color:var(--color-text-2);margin-bottom:4px;">名称</div>
          <input id="card-name" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--color-border);border-radius:var(--radius-btn);background:var(--color-bg);color:var(--color-text)" placeholder="梦角名字">
        </div>
        <div style="margin-bottom:10px;">
          <div style="font-size:13px;color:var(--color-text-2);margin-bottom:4px;">简介</div>
          <textarea id="card-desc" rows="3" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--color-border);border-radius:var(--radius-btn);background:var(--color-bg);color:var(--color-text);resize:none" placeholder="人设简介、提示词等"></textarea>
        </div>
        <button id="btn-add-card" style="width:100%;padding:8px;background:var(--color-main);color:#fff;border:none;border-radius:var(--radius-btn)">添加字卡</button>
      </div>
    `;
    wrap.innerHTML = formHtml;

    // 卡片列表区域
    const listBox = document.createElement('div');
    listBox.innerHTML = `<div style="font-weight:bold;margin-bottom:10px;color:var(--color-text)">已保存字卡</div>`;

    if (this.cardList.length === 0) {
      listBox.innerHTML += `<div style="color:var(--color-text-2);font-size:13px">暂无字卡</div>`;
    } else {
      this.cardList.forEach((card, index) => {
        const item = document.createElement('div');
        item.style.cssText = `border:1px solid var(--color-border);border-radius:var(--radius-card);padding:12px;margin-bottom:8px`;
        item.innerHTML = `
          <div style="font-weight:bold;color:var(--color-main)">${card.name}</div>
          <div style="font-size:13px;color:var(--color-text-2);margin:6px 0">${card.desc || "无简介"}</div>
          <button data-idx="${index}" class="btn-del" style="padding:4px 8px;background:#e53935;color:#fff;border:none;border-radius:var(--radius-btn);font-size:12px">删除</button>
        `;
        listBox.appendChild(item);
      });
    }
    wrap.appendChild(listBox);
    this.rootEl.appendChild(wrap);

    // 绑定新增按钮
    document.getElementById("btn-add-card").onclick = () => {
      const nameInput = document.getElementById("card-name");
      const descInput = document.getElementById("card-desc");
      const name = nameInput.value.trim();
      const desc = descInput.value.trim();
      if (!name) {
        Toast.show("名称不能为空");
        return;
      }
      const newCard = {
        id: Date.now().toString(),
        name,
        desc
      };
      this.cardList.push(newCard);
      Store.set("card-list", this.cardList);
      EventBus.emit("card:add", newCard);
      Toast.show("字卡创建成功");
      nameInput.value = "";
      descInput.value = "";
      this.render();
    };

    // 绑定删除
    document.querySelectorAll(".btn-del").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        this.cardList.splice(idx, 1);
        Store.set("card-list", this.cardList);
        Toast.show("已删除");
        this.render();
      };
    });
  }
};
