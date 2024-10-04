const { ipcRenderer } = require('electron');

const shortcutDisplay = document.getElementById('shortcut-display');
const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');
const scrollWheel = document.getElementById('scroll-wheel');

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

function animateButton(button) {
  button.classList.add('active', 'clicked');
  setTimeout(() => {
    button.classList.remove('active', 'clicked');
  }, 200);
}

ipcRenderer.on('mouse-event', (event, data) => {
  let button;
  switch(data.button) {
    case 'left':
      button = leftButton;
      break;
    case 'right':
      button = rightButton;
      break;
    case 'middle':
      button = scrollWheel;
      break;
  }

  if (button) {
    animateButton(button);
  }
});