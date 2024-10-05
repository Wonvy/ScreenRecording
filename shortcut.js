const { ipcRenderer } = require('electron');

const shortcutDisplay = document.getElementById('shortcut-display');
const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');
const scrollWheel = document.getElementById('scroll-wheel');

// 更新快捷键显示
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

// 动画函数
function animateButton(button) {
  button.classList.add('active', 'clicked');
  setTimeout(() => {
    button.classList.remove('active', 'clicked');
  }, 2000);
}

// 监听鼠标事件
ipcRenderer.on('mouse-event', (event, data) => {
  console.log('捕获到鼠标事件:', data);
  let button;
  switch(data.button) {
    case 1:
      button = leftButton;
      break;
    case 2:
      button = rightButton;
      break;
    case 3:
      button = scrollWheel;
      break;
  }

  if (button) {
    animateButton(button);
  }
});