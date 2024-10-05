const { ipcRenderer } = require('electron');

const shortcutDisplay = document.getElementById('shortcut-display');
const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');
const scrollWheel = document.getElementById('scroll-wheel');
const scrollUp = document.getElementById('scroll-up');
const scrollDown = document.getElementById('scroll-down');

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

// 修改动画函数
function animateButton(button, isPressed) {
  if (isPressed) {
    button.classList.add('active', 'pressed');
  } else {
    button.classList.remove('pressed');
    button.classList.add('released');
    button.classList.remove('active', 'released');

  }
}

// 修改鼠标事件监听
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
    case 4:
      button = scrollUp;
      break;
    case 5:
      button = scrollDown;
      break;
  }

  if (button) {
    animateButton(button, data.isMouseDown);
  }
});