// background.js - 使用枭熊2 SDK 注册右键菜单

import OBR from '@owlbear-rodeo/sdk';

console.log('🔥 FU角色卡扩展后台已加载！');

// 存储键名
const STORAGE_PREFIX = 'cc-fu-data-';
const BINDING_KEY = 'fu-binding-';

// 获取角色卡列表
function getCardList() {
  const keys = Object.keys(localStorage);
  const ourKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
  return ourKeys.map(key => {
    const id = key.slice(STORAGE_PREFIX.length);
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return { id, name: data.name || '未命名' };
    } catch (e) {
      return { id, name: '未知' };
    }
  });
}

// 查找Token元素
function findTokenElement(tokenId) {
  return document.querySelector(`[data-token-id="${tokenId}"]`);
}

// 注入气泡（简化版）
function injectBubble(tokenId, tokenEl, data, cardId) {
  // ... 气泡注入代码（和之前一样） ...
  // 这里省略，可以复用之前的 injectBubble 函数
}

// 绑定角色卡
function bindRoleToToken(tokenId, cardId) {
  const tokenEl = findTokenElement(tokenId);
  if (!tokenEl) return;
  const data = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${cardId}`));
  if (!data) return;
  injectBubble(tokenId, tokenEl, data, cardId);
}

// 绑定血条组件
function bindHpBarToToken(tokenId) {
  const tokenEl = findTokenElement(tokenId);
  if (!tokenEl) return;
  const data = { name: '测试勇士', pd: 8, md: 12, hp: 75, hpMax: 100, mp: 40, mpMax: 80 };
  injectBubble(tokenId, tokenEl, data, null);
}

// ============================================================
// 使用枭熊2 SDK 注册右键菜单
// ============================================================

OBR.onReady(() => {
  console.log('🎯 OBR SDK 已就绪');

  // 获取当前房间的用户角色
  OBR.room.getRole().then(role => {
    console.log('👤 当前角色:', role);
  });

  // 注册右键菜单
  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-role',
    icons: [{
      icon: '📋',
      label: '绑定FU角色卡',
      filter: {
        every: [{ key: 'type', value: 'TOKEN' }]
      }
    }],
    onClick: async (context) => {
      const cards = getCardList();
      if (cards.length === 0) {
        OBR.notification.show('暂无角色卡，请先导入');
        return;
      }

      // 获取当前选中的Token
      const items = await OBR.scene.items.getSelected();
      if (items.length === 0) {
        OBR.notification.show('请先选择一个Token');
        return;
      }

      // 简化：绑定第一张卡
      const token = items[0];
      const cardId = cards[0].id;
      bindRoleToToken(token.id, cardId);
      OBR.notification.show(`已绑定角色卡: ${cards[0].name}`);
    }
  });

  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-hpbar',
    icons: [{
      icon: '❤️',
      label: '绑定FU血条组件',
      filter: {
        every: [{ key: 'type', value: 'TOKEN' }]
      }
    }],
    onClick: async (context) => {
      const items = await OBR.scene.items.getSelected();
      if (items.length === 0) {
        OBR.notification.show('请先选择一个Token');
        return;
      }
      const token = items[0];
      bindHpBarToToken(token.id);
      OBR.notification.show('已绑定血条组件');
    }
  });

  OBR.contextMenu.create({
    id: 'fu-character-extension/unbind',
    icons: [{
      icon: '🗑️',
      label: '解绑',
      filter: {
        every: [{ key: 'type', value: 'TOKEN' }]
      }
    }],
    onClick: async (context) => {
      const items = await OBR.scene.items.getSelected();
      if (items.length === 0) return;
      const token = items[0];
      const container = document.querySelector(`.fu-token-bubble-container[data-token-id="${token.id}"]`);
      if (container) container.remove();
      localStorage.removeItem(`${BINDING_KEY}${token.id}`);
      OBR.notification.show('已解绑');
    }
  });

  console.log('✅ 右键菜单已注册');
});

console.log('✅ background.js 完全加载');