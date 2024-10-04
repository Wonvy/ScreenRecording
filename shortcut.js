const { ipcRenderer } = require('electron');

const shortcutDisplay = document.getElementById('shortcut-display');

ipcRenderer.on('update-shortcut', (event, data) => {
  if (data.size === 0) {
    console.log("快捷键集合为空");
    shortcutDisplay.innerHTML = '';
  } else {
    shortcutDisplay.innerHTML = Array.from(data).map(key => `<span class="key">${key}</span>`).join('');
  }

  // 2秒后清除显示
  setTimeout(() => {
    shortcutDisplay.innerHTML = '';
  }, 2000);
});