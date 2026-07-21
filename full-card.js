import OBR from 'https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm';

// 从 URL 解析 tokenId 或 previewCardId
const urlParams = new URLSearchParams(window.location.search);
const tokenId = urlParams.get('tokenId');
const previewCardId = urlParams.get('previewCardId');
let characterData = null;
let isGMAccess = false;

if (!tokenId && !previewCardId) {
  document.getElementById('cardContainer').innerHTML = `
    <div style="text-align: center; padding: 40px; color: #e74c3c;">
      ❌ 错误：未指定 Token ID 或角色卡 ID
    </div>
  `;
} else {
  // 初始化 OBR SDK
  OBR.onReady(async () => {
    try {
      const role = await OBR.player.getRole();
      isGMAccess = (role === 'GM');
    } catch (e) {
      isGMAccess = true;
    }

    // 加载数据并渲染
    await loadAndRender();

    if (tokenId) {
      // 监听场景棋子发生的数据改变，实现多人联机实时同步更新
      OBR.scene.items.onChange(async (items) => {
        const token = items.find(item => item.id === tokenId);
        if (token && token.metadata['com.wow.fu-character/data']) {
          characterData = token.metadata['com.wow.fu-character/data'];
          renderCard(characterData);
        }
      });
    }
  });
}

// 从 OBR 棋子 metadata 或本地存储中读取数据
async function loadAndRender() {
  if (previewCardId) {
    try {
      const raw = localStorage.getItem('cc-fu-data-' + previewCardId);
      if (raw) {
        characterData = JSON.parse(raw);
        renderCard(characterData);
      } else {
        throw new Error('该角色卡已从本地删除');
      }
    } catch (err) {
      document.getElementById('cardContainer').innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
          加载预览卡片失败: ${err.message}
        </div>
      `;
    }
    return;
  }

  try {
    const items = await OBR.scene.items.getItems([tokenId]);
    if (items.length > 0 && items[0].metadata['com.wow.fu-character/data']) {
      characterData = items[0].metadata['com.wow.fu-character/data'];
      renderCard(characterData);
    } else {
      document.getElementById('cardContainer').innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e67e22;">
          ⚠️ 此 Token 未绑定任何角色卡，或绑定数据已丢失。<br>
          请先在右侧管理界面中，选择棋子并点击一张导入的角色卡进行绑定。
        </div>
      `;
    }
  } catch (err) {
    document.getElementById('cardContainer').innerHTML = `
      <div style="text-align: center; padding: 40px; color: #e74c3c;">
        读取数据失败: ${err.message}
      </div>
    `;
  }
}

// 渲染卡片 HTML
function renderCard(d) {
  const container = document.getElementById('cardContainer');
  const isLocked = d.isLocked || false;
  const shouldHide = isLocked && !isGMAccess;
  const editableClass = (isGMAccess || !tokenId) ? 'fu-editable' : '';

  // 渲染 HP/MP/IP 等进度条
  const renderResource = (label, current, max, fieldKey, cssClass) => {
    const percent = max > 0 ? Math.min((current / max) * 100, 100) : 0;
    const currentDisplay = shouldHide ? '??' : current;
    const maxDisplay = shouldHide ? '??' : max;
    const useEditableClass = (!shouldHide && (isGMAccess || !tokenId)) ? 'fu-editable' : '';

    return `
      <div class="resource-row ${cssClass}">
        <span class="label">${label}</span>
        <div class="bar-wrap" data-field="${fieldKey}">
          <div class="bar-fill" style="width:${percent}%;"></div>
          <div class="bar-text">
            <span class="${useEditableClass}" data-field="${fieldKey}Cur">${currentDisplay}</span>
            <span style="margin:0 2px;">/</span>
            <span class="${useEditableClass}" data-field="${fieldKey}Max">${maxDisplay}</span>
          </div>
        </div>
      </div>
    `;
  };

  // 渲染武器行
  const renderWeaponRow = (weapon) => {
    if (!weapon || !weapon.name || weapon.name.trim() === '') {
      return `<tr class="empty-row"><td colspan="6" style="text-align:center; color:#555;">（无武器）</td></tr>`;
    }
    const wAttack = shouldHide ? '??' : (weapon.attack || '-');
    const wDamage = shouldHide ? '??' : (weapon.damage || '-');
    return `
      <tr>
        <td>${weapon.category || '-'}</td>
        <td class="weapon-name">${weapon.name}</td>
        <td>${wAttack}</td>
        <td>${weapon.attr || '-'}</td>
        <td>${weapon.type || '-'}</td>
        <td>${wDamage}</td>
      </tr>
    `;
  };

  const dexDisplay = shouldHide ? '??' : (d.dex || 0);
  const insDisplay = shouldHide ? '??' : (d.ins || 0);
  const migDisplay = shouldHide ? '??' : (d.mig || 0);
  const wlpDisplay = shouldHide ? '??' : (d.wlp || 0);

  const initDisplay = shouldHide ? '??' : (d.init || 0);
  const pdDisplay = shouldHide ? '??' : (d.pd || 0);
  const mdDisplay = shouldHide ? '??' : (d.md || 0);

  const lockIcon = isLocked ? '🔒' : '🔓';
  const lockTitle = isLocked ? '已锁定（非GM隐藏数值，进度条仍可见）' : '未锁定（所有玩家可见数值）';
  const lockBtnHtml = (isGMAccess || !tokenId)
    ? `<button id="fuLockBtn" title="${lockTitle}" style="background:none; border:none; cursor:pointer; font-size:16px; margin-left:8px; color:#f0c060;">${lockIcon}</button>`
    : `<span title="${lockTitle}" style="font-size:16px; margin-left:8px;">${lockIcon}</span>`;

  container.innerHTML = `
    <div class="fu-card-header">
      <div style="display:flex; align-items:center;">
        <span style="font-size:22px; color:#f0c060;">${d.name || '未命名角色'}</span>
        <span class="level" style="margin-left:8px;">Lv.${d.level || 0}</span>
        ${lockBtnHtml}
      </div>
      <button class="fu-card-close" id="fuCloseBtn">×</button>
    </div>

    <div class="fu-card-body">
      <div class="fu-attributes">
        <div class="fu-attr-item"><span class="label">敏捷</span><span class="value">D${dexDisplay}</span></div>
        <div class="fu-attr-item"><span class="label">洞察</span><span class="value">D${insDisplay}</span></div>
        <div class="fu-attr-item"><span class="label">力量</span><span class="value">D${migDisplay}</span></div>
        <div class="fu-attr-item"><span class="label">意志</span><span class="value">D${wlpDisplay}</span></div>
      </div>

      <div class="fu-combat-stats">
        <span>⚔️ 先攻 <span class="num ${editableClass}" data-field="init">${initDisplay}</span></span>
        <span>🛡️ 物防 <span class="num ${editableClass}" data-field="pd">${pdDisplay}</span></span>
        <span>✨ 魔防 <span class="num ${editableClass}" data-field="md">${mdDisplay}</span></span>
      </div>

      ${renderResource('HP', d.hp, d.hpMax, 'hp', 'resource-hp')}
      ${renderResource('MP', d.mp, d.mpMax, 'mp', 'resource-mp')}
      ${renderResource('IP', d.ip, d.ipMax, 'ip', 'resource-ip')}
      ${renderResource('命刻', d.crisisCurrent, d.crisisMax, 'crisis', 'resource-crisis')}

      <div class="fu-crisis-box">
        <div class="title">🔥 零界能力</div>
        <div class="detail">
          <strong>${d.crisisName || '（未设置）'}</strong>
          ${d.crisisCondition ? `｜ 条件：${d.crisisCondition}` : ''}
          ${d.crisisSlots ? `｜ 填充格数：${d.crisisSlots}` : ''}
        </div>
      </div>

      <div class="fu-defenses">
        <span class="tag"><strong>弱点：</strong>${d.weakness || '无'}</span>
        <span class="tag"><strong>抵抗：</strong>${d.resistance || '无'}</span>
        <span class="tag"><strong>免疫：</strong>${d.immunity || '无'}</span>
        <span class="tag"><strong>吸收：</strong>${d.absorb || '无'}</span>
      </div>

      <table class="fu-weapons">
        <thead><tr><th>类别</th><th>名称</th><th>检定</th><th>属性</th><th>类型</th><th>伤害</th></tr></thead>
        <tbody>
          ${renderWeaponRow(d.weapon1)}
          ${renderWeaponRow(d.weapon2)}
        </tbody>
      </table>
    </div>
  `;

  // 绑定关闭窗口事件
  const closeBtn = document.getElementById('fuCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', async () => {
      OBR.popover.close('fu-card-popover');
      OBR.popover.close('fu-card-preview');
    });
  }

  // 绑定锁事件
  const lockBtn = document.getElementById('fuLockBtn');
  if (lockBtn && (isGMAccess || !tokenId)) {
    lockBtn.addEventListener('click', async () => {
      const newLocked = !isLocked;
      d.isLocked = newLocked;

      if (previewCardId) {
        localStorage.setItem('cc-fu-data-' + previewCardId, JSON.stringify(d));
        renderCard(d);
      } else if (tokenId) {
        await OBR.scene.items.updateItems([tokenId], (items) => {
          for (let item of items) {
            if (item.type === 'IMAGE' && item.metadata['com.wow.fu-character/data']) {
              item.metadata['com.wow.fu-character/data'].isLocked = newLocked;
            }
          }
        });
      }
    });
  }

  // 初始化数值点击修改监听
  setupEditableFields();
}

// 设置可编辑数值点击处理
function setupEditableFields() {
  const editables = document.querySelectorAll('.fu-editable');
  editables.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const field = el.dataset.field;
      const oldValue = el.textContent.trim();
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'fu-editable-input';
      input.value = oldValue;
      input.style.width = '55px';
      input.style.background = '#0d0d1a';
      input.style.color = '#fff';
      input.style.border = '1px solid #555';
      input.style.borderRadius = '3px';
      input.style.padding = '2px';
      
      el.replaceWith(input);
      input.focus();
      input.select();

      const saveNewValue = async () => {
        let newVal = input.value.trim();
        if (newVal === '') newVal = '0';
        const numVal = Number(newVal);
        if (isNaN(numVal)) {
          alert('请输入有效数字');
          input.replaceWith(el);
          return;
        }
        
        // 更新元数据
        await updateMetadataField(field, numVal);
        el.textContent = numVal;
        input.replaceWith(el);
      };

      input.addEventListener('blur', saveNewValue);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          input.blur();
        }
        if (ev.key === 'Escape') {
          input.replaceWith(el);
        }
      });
    });
  });
}

// 更新 OBR 上的元数据
async function updateMetadataField(field, value) {
  let targetKey = '';
  if (field === 'init' || field === 'pd' || field === 'md') {
    targetKey = field;
  } else if (field.endsWith('Cur')) {
    const base = field.slice(0, -3);
    if (base === 'hp') targetKey = 'hp';
    else if (base === 'mp') targetKey = 'mp';
    else if (base === 'ip') targetKey = 'ip';
    else if (base === 'crisis') targetKey = 'crisisCurrent';
  } else if (field.endsWith('Max')) {
    const base = field.slice(0, -3);
    if (base === 'hp') targetKey = 'hpMax';
    else if (base === 'mp') targetKey = 'mpMax';
    else if (base === 'ip') targetKey = 'ipMax';
    else if (base === 'crisis') targetKey = 'crisisMax';
  }

  if (!targetKey) return;

  // 更新本地变量
  characterData[targetKey] = value;

  if (previewCardId) {
    localStorage.setItem('cc-fu-data-' + previewCardId, JSON.stringify(characterData));
    console.log(`💾 本地角色卡数据已更新: ${targetKey} = ${value}`);
    return;
  }

  // 更新 OBR Token 元数据并广播给全房间
  await OBR.scene.items.updateItems([tokenId], (items) => {
    for (let item of items) {
      if (item.type === 'IMAGE' && item.metadata['com.wow.fu-character/data']) {
        item.metadata['com.wow.fu-character/data'][targetKey] = value;
        
        // 实时更新 Token 在地图上显示的原生标签文本
        const d = item.metadata['com.wow.fu-character/data'];
        if (item.text) {
          item.text.plainText = `${d.name}\nHP ${d.hp}/${d.hpMax}`;
        }
      }
    }
  });
  console.log(`💾 元数据已写入: ${targetKey} = ${value}`);
}
