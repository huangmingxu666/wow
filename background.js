import OBR from '@owlbear-rodeo/sdk';

console.log('🔥 FU角色卡扩展后台已加载！');

const STORAGE_PREFIX = 'cc-fu-data-';

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

OBR.onReady(() => {
  console.log('🎯 OBR SDK 已就绪');

  // 1. 右键菜单：绑定角色卡（快捷绑定列表第一张卡）
  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-role',
    icons: [{
      icon: '/wow/assets/icon.png',
      label: '📋 绑定第一个FU角色卡',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }]
      }
    }],
    onClick: async (context) => {
      const cards = getCardList();
      if (cards.length === 0) {
        OBR.notification.show('暂无角色卡，请先在工具栏中导入Excel角色卡');
        return;
      }
      const items = await OBR.scene.items.getSelected();
      if (items.length === 0) {
        OBR.notification.show('请选择一个棋子 Token');
        return;
      }
      const token = items[0];
      const cardId = cards[0].id;
      const data = JSON.parse(localStorage.getItem(STORAGE_PREFIX + cardId));
      if (!data) return;

      await OBR.scene.items.updateItems([token.id], (items) => {
        for (let item of items) {
          if (item.type === 'IMAGE') {
            item.metadata['com.wow.fu-character/data'] = {
              cardId: cardId,
              name: data.name,
              level: data.level,
              hp: data.hp,
              hpMax: data.hpMax,
              mp: data.mp,
              mpMax: data.mpMax,
              ip: data.ip,
              ipMax: data.ipMax,
              dex: data.dex,
              ins: data.ins,
              mig: data.mig,
              wlp: data.wlp,
              init: data.init,
              pd: data.pd,
              md: data.md,
              weakness: data.weakness,
              resistance: data.resistance,
              immunity: data.immunity,
              absorb: data.absorb,
              crisisName: data.crisisName,
              crisisCondition: data.crisisCondition,
              crisisSlots: data.crisisSlots,
              crisisCurrent: data.crisisCurrent,
              crisisMax: data.crisisMax,
              weapon1: data.weapon1,
              weapon2: data.weapon2
            };
            item.text.plainText = `${data.name}\nHP ${data.hp}/${data.hpMax}`;
          }
        }
      });
      OBR.notification.show(`已成功绑定角色卡: ${data.name}`);
    }
  });

  // 2. 右键菜单：绑定默认血条组件
  OBR.contextMenu.create({
    id: 'fu-character-extension/bind-hpbar',
    icons: [{
      icon: '/wow/assets/icon.png',
      label: '❤️ 绑定FU默认血条',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }]
      }
    }],
    onClick: async (context) => {
      const items = await OBR.scene.items.getSelected();
      if (items.length === 0) {
        OBR.notification.show('请选择一个棋子 Token');
        return;
      }
      const token = items[0];
      const data = {
        name: token.name || '测试勇士',
        level: 5,
        pd: 8,
        md: 12,
        hp: 75,
        hpMax: 100,
        mp: 40,
        mpMax: 80,
        ip: 6,
        ipMax: 6,
        dex: 8,
        ins: 10,
        mig: 8,
        wlp: 8,
        init: 6,
        crisisCurrent: 6,
        crisisMax: 6
      };

      await OBR.scene.items.updateItems([token.id], (items) => {
        for (let item of items) {
          if (item.type === 'IMAGE') {
            item.metadata['com.wow.fu-character/data'] = data;
            item.text.plainText = `${data.name}\nHP ${data.hp}/${data.hpMax}`;
          }
        }
      });
      OBR.notification.show('已成功绑定默认血条');
    }
  });

  // 3. 右键菜单：打开角色卡 (popover)
  OBR.contextMenu.create({
    id: 'fu-character-extension/open-card',
    icons: [{
      icon: '/wow/assets/icon.png',
      label: '🃏 打开FU角色卡',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }],
        some: [{ key: ['metadata', 'com.wow.fu-character/data'], operator: 'EXISTS' }]
      }
    }],
    onClick: async (context) => {
      const items = await OBR.scene.items.getSelected();
      if (items.length === 0) return;
      const token = items[0];
      
      OBR.popover.open({
        id: 'fu-card-popover',
        url: `/wow/full-card.html?tokenId=${token.id}`,
        width: 620,
        height: 600
      });
    }
  });

  // 4. 右键菜单：解绑角色卡
  OBR.contextMenu.create({
    id: 'fu-character-extension/unbind',
    icons: [{
      icon: '/wow/assets/icon.png',
      label: '🗑️ 解除绑定',
      filter: {
        every: [{ key: 'type', value: 'IMAGE' }],
        some: [{ key: ['metadata', 'com.wow.fu-character/data'], operator: 'EXISTS' }]
      }
    }],
    onClick: async (context) => {
      const items = await OBR.scene.items.getSelected();
      if (items.length === 0) return;
      const token = items[0];

      await OBR.scene.items.updateItems([token.id], (items) => {
        for (let item of items) {
          if (item.type === 'IMAGE') {
            delete item.metadata['com.wow.fu-character/data'];
            item.text.plainText = item.name || '';
          }
        }
      });
      OBR.notification.show('已解除角色卡绑定');
    }
  });

  console.log('✅ 右键菜单已成功注册');
});