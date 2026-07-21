import OBR from 'https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm';

const STORAGE_PREFIX = 'cc-fu-data-';
let isSdkReady = false;

// 初始化 OBR SDK
OBR.onReady(() => {
  isSdkReady = true;
  document.getElementById('statusBar').textContent = 'SDK 已就绪';
  renderList();
});

// 读取所有本地保存的角色卡列表
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

// 渲染角色卡列表
function renderList() {
  const list = document.getElementById('cardList');
  const cards = getCardList();
  if (cards.length === 0) {
    list.innerHTML = `<div class="empty">暂无角色卡<br>点击"导入Excel"上传</div>`;
    document.getElementById('statusBar').textContent = '共 0 张角色卡';
    return;
  }
  let html = '';
  cards.forEach(card => {
    html += `
      <div class="list-item" data-id="${card.id}">
        <span>${card.name} <span class="id">${card.id}</span></span>
        <button class="btn-import" style="background:#8b2c3a; padding: 2px 6px; font-size:10px;" onclick="deleteCard(event, '${card.id}')">删除</button>
      </div>
    `;
  });
  list.innerHTML = html;
  document.getElementById('statusBar').textContent = `共 ${cards.length} 张角色卡｜选中 Token 棋子后点击列表可绑定`;

  // 点击列表项进行 Token 绑定
  list.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      if (e.target.tagName === 'BUTTON') return; // 点击删除按钮不触发绑定
      const cardId = item.dataset.id;
      
      if (!isSdkReady) {
        alert('OBR SDK 未初始化完成，请稍候');
        return;
      }

      // 获取当前选中的 Token
      const selection = await OBR.player.getSelection();
      if (!selection || selection.length === 0) {
        alert('请先在枭熊地图上选择一个 Token 棋子，然后再点击此角色卡进行绑定！');
        return;
      }

      const tokenId = selection[0];
      const data = JSON.parse(localStorage.getItem(STORAGE_PREFIX + cardId));
      if (!data) return;

      // 将属性写入 Token 元数据 (Item Metadata)
      await OBR.scene.items.updateItems([tokenId], (items) => {
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
            
            // 自动更新 Token 的原生 Label（在棋子下方显示血量）
            item.text.plainText = `${data.name}\nHP ${data.hp}/${data.hpMax}`;
          }
        }
      });

      alert(`✅ 已成功将角色卡「${data.name}」绑定到选中的 Token！\n现在你可以右键该 Token 选择“🃏 打开FU角色卡”查看完整卡片。`);
    });
  });
}

// 删除角色卡
function deleteCard(event, cardId) {
  event.stopPropagation();
  if (!confirm(`确定要删除角色卡「${cardId}」吗？`)) return;
  localStorage.removeItem(STORAGE_PREFIX + cardId);
  renderList();
}
// 将删除函数挂载 to window 全局，确保 HTML 中的 onclick 能够正常触发
window.deleteCard = deleteCard;

// 绑定导入文件按钮
const importBtn = document.getElementById('importBtn');
const excelFile = document.getElementById('excelFile');

importBtn.addEventListener('click', () => {
  excelFile.click();
});

excelFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById('statusBar').textContent = '正在解析 Excel...';
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets['主要'];
    if (!sheet) {
      throw new Error('在 Excel 中找不到名为“主要”的工作表，请检查文件！');
    }

    const getCell = (addr) => {
      const cell = sheet[addr];
      if (!cell) return '';
      return cell.v !== undefined ? cell.v : (cell.w || '');
    };

    const characterData = {
      name: getCell('E2') || '未命名角色',
      level: Number(getCell('S2')) || 0,
      dex: Number(getCell('H7')) || 0,
      ins: Number(getCell('H8')) || 0,
      mig: Number(getCell('H9')) || 0,
      wlp: Number(getCell('H10')) || 0,
      init: Number(getCell('F14')) || 0,
      pd: Number(getCell('F15')) || 0,
      md: Number(getCell('F16')) || 0,
      hp: Number(getCell('S14')) || 0,
      hpMax: Number(getCell('W14')) || 0,
      mp: Number(getCell('S15')) || 0,
      mpMax: Number(getCell('W15')) || 0,
      ip: Number(getCell('S16')) || 0,
      ipMax: Number(getCell('W16')) || 0,
      weakness: getCell('AE14') || '',
      resistance: getCell('AO14') || '',
      immunity: getCell('AE25') || '',
      absorb: getCell('AO15') || '',
      crisisName: getCell('B20') || '',
      crisisCondition: getCell('H20') || '',
      crisisSlots: getCell('M20') || '',
      crisisCurrent: Number(getCell('S20')) || 0,
      crisisMax: Number(getCell('Z20')) || 0,
      weapon1: {
        category: getCell('B24') || '',
        name: getCell('H24') || '',
        attack: getCell('M24') || '',
        attr: getCell('W24') || '',
        type: getCell('AB24') || '',
        damage: getCell('AH24') || '',
      },
      weapon2: {
        category: getCell('B25') || '',
        name: getCell('H25') || '',
        attack: getCell('M25') || '',
        attr: getCell('W25') || '',
        type: getCell('AB25') || '',
        damage: getCell('AH25') || '',
      }
    };

    const cardId = characterData.name + '_' + Date.now().toString().slice(-4);
    localStorage.setItem(STORAGE_PREFIX + cardId, JSON.stringify(characterData));
    document.getElementById('statusBar').textContent = `成功导入角色: ${characterData.name}`;
    
    // 重置以允许重新上传相同文件
    excelFile.value = '';
    renderList();
  } catch (err) {
    alert('❌ 解析失败: ' + err.message);
    document.getElementById('statusBar').textContent = '解析失败';
    excelFile.value = '';
  }
});
