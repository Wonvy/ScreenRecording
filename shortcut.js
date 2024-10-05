const { ipcRenderer } = require('electron');

const shortcutDisplay = document.getElementById('shortcut-display');
const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');
const scrollWheel = document.getElementById('scroll-wheel');
const scrollUp = document.getElementById('scroll-up');
const scrollDown = document.getElementById('scroll-down');

const fs = require('fs');
const path = require('path');
const shortcutDescription = document.getElementById('shortcut-description');

// 在文件顶部添加这个映射对象
const keyNameMap = {
  'LEFT CTRL': 'Ctrl',
  'RIGHT CTRL': 'Ctrl',
  'LEFT ALT': 'Alt',
  'RIGHT ALT': 'Alt',
  'LEFT SHIFT': 'Shift',
  'RIGHT SHIFT': 'Shift',
  'LEFT META': 'Win',
  'RIGHT META': 'Win'
};

let shortcuts;

// 读取快捷键 JSON 文件
const shortcutsPath = path.join(__dirname, 'shortcuts.json');
fs.readFile(shortcutsPath, 'utf8', (err, data) => {
  if (err) {
    console.error('无法读取快捷键文件:', err);
    return;
  }
  shortcuts = JSON.parse(data);
});

// 更新快捷键显示
ipcRenderer.on('update-shortcut', (event, data) => {
  if (data.size === 0) {
    console.log("快捷键集合为空");
    shortcutDisplay.innerHTML = '';
  } else {
    const pressedKeys = Array.from(data).map(key => keyNameMap[key] || key);
    shortcutDisplay.innerHTML = pressedKeys.map(key => `<span class="key">${key}</span>`).join('');

    // 查找并显示快捷键描述（不区分大小写）
    const shortcutKey = pressedKeys.join('+').toLowerCase();
    console.log('shortcutKey:', shortcutKey);
    const description = Object.keys(shortcuts).find(key => key.toLowerCase() === shortcutKey);
    shortcutDescription.textContent = description ? shortcuts[description] : '未知快捷键';
  
  }

  // 2秒后清除显示
  setTimeout(() => {
    shortcutDisplay.innerHTML = '';
  }, 2000);
});


// 鼠标事件

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

// 监听滚轮事件
ipcRenderer.on('mouse-wheel-event', (event, data) => {
  console.log('捕获到滚轮事件:', data);
  if (data.delta === 1) {
    animateButton(scrollUp, true);
    setTimeout(() => animateButton(scrollUp, false), 100);
    animateButton(scrollWheel, true);
    setTimeout(() => animateButton(scrollWheel, false), 100);
  } else if (data.delta === -1) {
    animateButton(scrollDown, true);
    setTimeout(() => animateButton(scrollDown, false), 100);
    animateButton(scrollWheel, true);
    setTimeout(() => animateButton(scrollWheel, false), 100);
  }
});
