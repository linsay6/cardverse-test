import { Toast } from './core/toast.js';

const AuditCardModule = {
  // 卡组，你后续可以在这里加更多字卡
  cardPool: [
    {
      id: 1,
      title: "温柔提示",
      content: "我一直在，慢慢来就好。",
      side: "bot"
    },
    {
      id: 2,
      title: "简短回应",
      content: "我看到你的心意了。",
      side: "bot"
    },
    {
      id: 3,
      title: "你的台词",
      content: "今天也很想你。",
      side: "user"
    }
  ],

  // 抽一张随机卡
  drawRandomCard() {
    const randomIdx = Math.floor(Math.random() * this.cardPool.length);
    return this.cardPool[randomIdx];
  },

  // 发送抽到的卡片消息到聊天
  sendCardToChat(card) {
    if (!window.sendAuditCard) {
      Toast.show("聊天注入接口未就绪");
      return false;
    }
    window.sendAuditCard(card.content, card.side);
    Toast.show(`抽到：${card.title}`);
    return true;
  },

  // 一键抽卡并发送
  drawAndSend() {
    const card = this.drawRandomCard();
    this.sendCardToChat(card);
    return card;
  },

  // 外部手动添加新卡
  addCard(newCard) {
    if (!newCard.content) return;
    this.cardPool.push({
      id: Date.now(),
      title: newCard.title || "字卡",
      content: newCard.content,
      side: newCard.side || "bot"
    });
    Toast.show("字卡已添加到卡组");
  }
};

// 挂载全局，控制台可以直接测试
window.AuditCardModule = AuditCardModule;

// 命名导出，方便app.js导入
export { AuditCardModule };
