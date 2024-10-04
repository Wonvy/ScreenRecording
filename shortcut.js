const { ipcRenderer } = require('electron');

const shortcutDisplay = document.getElementById('shortcut-display');

ipcRenderer.on('update-shortcut', (event, data) => {
  if (data.size === 0) {
    console.log("快捷键集合为空");
    shortcutDisplay.textContent = '';
  } else {
    shortcutDisplay.textContent = Array.from(data).join('+');
  }

  // 2秒后清除显示
  setTimeout(() => {
    shortcutDisplay.textContent = '';
  }, 2000);
});