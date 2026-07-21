// index.js - 扩展主入口（枭熊2集成版）

// ============================================================
// 1. 导入样式文件
// ============================================================
import './styles/main.css';
import './styles/token-bubble.css';
import './styles/dropdown.css';

// ============================================================
// 2. 导入核心模块
// ============================================================
import { DataManager } from './src/core/DataManager.js';
import { ExcelParser } from './src/core/ExcelParser.js';
import { FullCard } from './src/ui/FullCard.js';
import { TokenBinder } from './src/integration/TokenBinder.js';
import { RoleCardManager } from './src/ui/RoleCardManager.js';
import { OwlbearIntegration } from './src/integration/OwlbearIntegration.js';

// ============================================================
// 3. 控制台提示：扩展已加载
// ============================================================
console.log('🎉 FU角色卡扩展加载成功了！');

// ============================================================
// 4. 测试函数（仅在开发环境可用）
// ============================================================
// 检测是否在 test.html 中运行
const isTestEnvironment = window.location.pathname.includes('test.html') || 
                          document.querySelector('#fileInput') !== null;

if (isTestEnvironment) {
  console.log('🧪 检测到测试环境，加载测试函数...');
  
  window.testParseExcel = async (file) => {
    try {
      console.log('📂 开始解析Excel文件...');
      const data = await ExcelParser.parse(file);
      console.log('✅ 解析成功！下面是读取到的角色数据：');
      console.log(data);
      return data;
    } catch (error) {
      console.error('❌ 解析失败：', error);
      alert('解析失败：' + error.message);
    }
  };

  window.testSaveData = (cardId, data) => {
    const result = DataManager.save(cardId, data);
    if (result) {
      alert(`✅ 数据已保存！ID: ${cardId}`);
    } else {
      alert('❌ 保存失败，请查看控制台错误信息');
    }
    return result;
  };

  window.testLoadData = (cardId) => {
    const data = DataManager.load(cardId);
    if (data) {
      console.log(`📂 读取到数据 (ID: ${cardId}):`, data);
      alert(`✅ 读取成功！请查看控制台输出`);
    } else {
      alert(`❌ 未找到 ID 为 ${cardId} 的数据`);
    }
    return data;
  };

  window.testListAll = () => {
    const summaries = DataManager.listSummary();
    console.log('📋 所有已保存的角色：');
    console.table(summaries);
    alert(`共找到 ${summaries.length} 个角色，请查看控制台`);
    return summaries;
  };

  window.testDeleteData = (cardId) => {
    const result = DataManager.delete(cardId);
    if (result) {
      alert(`🗑️ 已删除 ID: ${cardId}`);
    } else {
      alert('❌ 删除失败，请查看控制台错误信息');
    }
    return result;
  };

  window.testShowCard = (cardId) => {
    const data = DataManager.load(cardId);
    if (!data) {
      alert(`❌ 未找到 ID 为 "${cardId}" 的角色数据，请先保存。`);
      return;
    }
    if (window.__currentFullCard) {
      window.__currentFullCard.close();
      window.__currentFullCard = null;
    }
    const card = new FullCard(cardId, data, () => {
      console.log('📕 卡片已关闭');
      window.__currentFullCard = null;
    });
    card.open();
    window.__currentFullCard = card;
    console.log(`🃏 显示卡片，ID: ${cardId}`);
  };

  window.testShowRoleManager = () => {
    if (window.__roleManager) {
      window.__roleManager.close();
      window.__roleManager = null;
    }
    const manager = new RoleCardManager();
    manager.onClose = () => {
      window.__roleManager = null;
    };
    manager.open();
    window.__roleManager = manager;
    console.log('📋 角色卡管理界面已打开');
  };

  // TokenBinder 测试
  let __testBinder = null;
  window.__tokenBinder = null;

  window.testCreateToken = (cardId) => {
    const data = DataManager.load(cardId);
    if (!data) {
      alert(`❌ 未找到角色卡: ${cardId}`);
      return;
    }

    const token = document.createElement('div');
    token.style.cssText = `
      position: fixed;
      top: ${30 + Math.random() * 30}%;
      left: ${20 + Math.random() * 30}%;
      width: 70px;
      height: 70px;
      background: radial-gradient(circle at 35% 35%, #4a2a6a, #1a0a2a);
      border-radius: 50%;
      border: 3px solid #f0c060;
      box-shadow: 0 0 30px rgba(240, 192, 96, 0.15);
      z-index: 9997;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: #f0c060;
      user-select: none;
      font-weight: bold;
    `;
    const nameStr = String(data.name || '?');
    token.textContent = nameStr.charAt(0).toUpperCase();
    token.dataset.tokenId = `token-${Date.now()}`;
    document.body.appendChild(token);

    if (!window.__tokenBinder) {
      window.__tokenBinder = new TokenBinder();
    }
    const binder = window.__tokenBinder;
    binder.bindRole(token.dataset.tokenId, token, cardId);

    let isDragging = false;
    let offsetX, offsetY;
    const onMove = (e) => {
      if (!isDragging) return;
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      const maxX = window.innerWidth - token.offsetWidth;
      const maxY = window.innerHeight - token.offsetHeight;
      token.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
      token.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
      token.style.transform = 'none';
      const bubble = binder.getBubble(token.dataset.tokenId);
      if (bubble) bubble._updatePosition();
    };
    const onUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    token.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      const rect = token.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });

    console.log(`✅ 已创建Token并绑定角色卡: ${data.name}`);
    console.log(`💡 拖拽Token移动，气泡跟随`);
    console.log(`💡 点击Token打开卡片`);
    return token;
  };

  window.testCreateHpBar = () => {
    const token = document.createElement('div');
    token.style.cssText = `
      position: fixed;
      top: ${30 + Math.random() * 30}%;
      left: ${20 + Math.random() * 30}%;
      width: 70px;
      height: 70px;
      background: radial-gradient(circle at 35% 35%, #2a4a6a, #0a1a2a);
      border-radius: 50%;
      border: 3px solid #5dade2;
      box-shadow: 0 0 30px rgba(93, 173, 226, 0.15);
      z-index: 9997;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: #5dade2;
      user-select: none;
    `;
    token.textContent = '⚔️';
    token.dataset.tokenId = `hpbar-${Date.now()}`;
    document.body.appendChild(token);

    if (!window.__tokenBinder) {
      window.__tokenBinder = new TokenBinder();
    }
    const binder = window.__tokenBinder;
    binder.bindHpBar(token.dataset.tokenId, token, {
      name: '测试勇士',
      pd: 8,
      md: 12,
      hp: 75,
      hpMax: 100,
      mp: 40,
      mpMax: 80,
    });

    let isDragging = false;
    let offsetX, offsetY;
    const onMove = (e) => {
      if (!isDragging) return;
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      const maxX = window.innerWidth - token.offsetWidth;
      const maxY = window.innerHeight - token.offsetHeight;
      token.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
      token.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
      token.style.transform = 'none';
      const bubble = binder.getBubble(token.dataset.tokenId);
      if (bubble) bubble._updatePosition();
    };
    const onUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    token.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      const rect = token.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });

    console.log(`✅ 已创建Token并绑定血条组件`);
    return token;
  };

  window.testSetGM = (isGM) => {
    const binder = window.__tokenBinder;
    if (!binder) {
      alert('请先创建一个Token');
      return;
    }
    let count = 0;
    for (const [tokenId, binding] of binder.bindings) {
      if (binding.bubble) {
        binding.bubble.setGM(isGM);
        count++;
      }
    }
    console.log(`👑 GM模式: ${isGM ? '已开启' : '已关闭'}，更新了 ${count} 个气泡`);
    alert(`👑 GM模式已${isGM ? '开启' : '关闭'}，已更新 ${count} 个气泡`);
  };

  console.log('💡 测试函数已就绪：');
  console.log('  testParseExcel(文件)  : 解析Excel');
  console.log('  testSaveData(id, 数据) : 保存数据');
  console.log('  testLoadData(id)      : 读取数据');
  console.log('  testListAll()         : 列出所有角色');
  console.log('  testDeleteData(id)    : 删除角色');
  console.log('  testShowCard(id)      : 显示全屏大卡片');
  console.log('  testShowRoleManager() : 显示角色卡管理界面');
  console.log('  testCreateToken(id)   : 创建Token并绑定角色卡');
  console.log('  testCreateHpBar()     : 创建Token并绑定血条');
  console.log('  testSetGM(true/false) : 切换GM模式');
}

// ============================================================
// 5. 初始化枭熊2集成（自动检测环境）
// ============================================================
const isOwlbearEnvironment = !isTestEnvironment && 
                              (typeof window.OBR !== 'undefined' || 
                               document.querySelector('.or-toolbar') !== null);

if (isOwlbearEnvironment) {
  console.log('🦉 检测到枭熊2环境，启动集成模块...');
  const integration = new OwlbearIntegration();
  integration.init();
  // 暴露到全局以便调试
  window.__fuIntegration = integration;
} else if (!isTestEnvironment) {
  console.log('💡 未检测到枭熊2环境，扩展处于待机状态');
  console.log('💡 在枭熊2中加载此扩展将自动激活');
}

// ============================================================
// 6. 监听 popover 窗口发来的消息（修复语法错误）
// ============================================================
window.addEventListener('message', function(event) {
  // 安全验证：只接受来自我们自己 popover 的消息
  // if (event.origin !== 'https://erial8823-star.github.io') return;

  const message = event.data;
  console.log('📨 收到消息:', message);

  // 处理：导入Excel
  if (message.type === 'fu-import-excel') {
    console.log('📂 触发导入Excel');
    let fileInput = document.getElementById('fu-file-input');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.xlsx,.xls';
      fileInput.id = 'fu-file-input';
      fileInput.style.display = 'none';
      fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
          console.log('📂 选择文件:', file.name);
          if (typeof window.testParseExcel === 'function') {
            const data = await window.testParseExcel(file);
            if (data) {
              const name = data.name || `card-${Date.now()}`;
              window.testSaveData(name, data);
            }
          } else {
            alert('testParseExcel 函数未加载，请刷新页面后重试');
          }
        }
        this.value = '';
      });
      document.body.appendChild(fileInput);
    }
    fileInput.click();
  }

  // 处理：打开卡片
  if (message.type === 'fu-open-card') {
    const cardId = message.cardId;
    console.log('🃏 打开卡片:', cardId);
    if (typeof window.testShowCard === 'function') {
      window.testShowCard(cardId);
    } else {
      // 直接加载卡片（修复语法错误：先检查 FullCard 是否可用）
      const data = DataManager.load(cardId);
      if (data && typeof FullCard !== 'undefined') {
        const card = new FullCard(cardId, data, () => {});
        card.open();
      }
    }
  }
});

console.log('✅ 消息监听器已启动');