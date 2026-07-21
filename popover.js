// popover.js
(function() {
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

  function renderList() {
    const list = document.getElementById('cardList');
    const cards = getCardList();
    const statusBar = document.getElementById('statusBar');
    
    if (cards.length === 0) {
      list.innerHTML = `<div class="empty">暂无角色卡<br>点击"导入Excel"上传</div>`;
      if (statusBar) statusBar.textContent = '共 0 张角色卡';
      return;
    }
    
    let html = '';
    cards.forEach(card => {
      html += `<div class="list-item" data-id="${card.id}">${card.name}<span class="id">${card.id}</span></div>`;
    });
    list.innerHTML = html;
    if (statusBar) statusBar.textContent = `共 ${cards.length} 张角色卡`;

    list.querySelectorAll('.list-item').forEach(item => {
      item.addEventListener('click', function() {
        const cardId = this.dataset.id;
        window.parent.postMessage({
          type: 'fu-open-card',
          cardId: cardId
        }, '*');
      });
    });
  }

  const importBtn = document.getElementById('importBtn');
  if (importBtn) {
    importBtn.addEventListener('click', function() {
      window.parent.postMessage({ type: 'fu-import-excel' }, '*');
    });
  }

  window.addEventListener('storage', function(e) {
    if (e.key && e.key.startsWith(STORAGE_PREFIX)) {
      renderList();
    }
  });

  renderList();
  console.log('✅ popover.js 已加载');
})();