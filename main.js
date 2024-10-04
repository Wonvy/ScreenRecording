const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { GlobalKeyboardListener } = require("node-global-key-listener");
const mouseEvents = require("global-mouse-events");

let mainWindow;
let keyboardListener;
let mouseListener;
let shortcutWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');

  // 创建快捷键显示窗口
  shortcutWindow = new BrowserWindow({
    width: 300,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  shortcutWindow.loadFile('shortcut.html');
  
  // 移除这行，允许鼠标事件
  // shortcutWindow.setIgnoreMouseEvents(true);

  // 添加全局鼠标事件监听
  globalShortcut.register('CommandOrControl+Alt+LeftMouseButton', () => {
    shortcutWindow.webContents.send('mouse-event', { button: 'left', state: 'down' });
  });
  globalShortcut.register('CommandOrControl+Alt+RightMouseButton', () => {
    shortcutWindow.webContents.send('mouse-event', { button: 'right', state: 'down' });
  });
  globalShortcut.register('CommandOrControl+Alt+MiddleMouseButton', () => {
    shortcutWindow.webContents.send('mouse-event', { button: 'middle', state: 'down' });
  });

  // 当主窗口关闭时，关闭所有窗口
  mainWindow.on('closed', () => {
    if (shortcutWindow) {
      shortcutWindow.close();
    }
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('start-listening', () => {
  if (!keyboardListener) {
    console.log('开始监听键盘事件');
    keyboardListener = new GlobalKeyboardListener();
    keyboardListener.addListener(function (e, down) {
      console.log(`键盘按键 ${e.name} ${down ? '按下' : '释放'}`);
      sendKeyEvent(e, down);
    });
  }

  if (!mouseListener) {
    console.log('开始监听鼠标事件');
    
    mouseEvents.on("mousedown", (event) => {
      console.log('鼠标按下:', event);
      sendMouseEvent(event, true);
    });

    mouseEvents.on("mouseup", (event) => {
      console.log('鼠标释放:', event);
      sendMouseEvent(event, false);
    });

    mouseEvents.on("mousemove", (event) => {
      console.log('鼠标移动:', event);
      sendMouseMoveEvent(event);
    });

    mouseEvents.on("mousewheel", (event) => {
      console.log('鼠标滚轮:', event);
      sendMouseWheelEvent(event);
    });

    mouseListener = true;
  }
});

ipcMain.on('stop-listening', () => {
  if (keyboardListener) {
    console.log('停止监听键盘事件');
    keyboardListener.kill();
    keyboardListener = null;
  }

  if (mouseListener) {
    console.log('停止监听鼠标事件');
    mouseEvents.pauseMouseEvents();
    mouseListener = false;
  }
});

ipcMain.on('key-event', (event, data) => {
  shortcutWindow.webContents.send('update-shortcut', data);
});

function sendKeyEvent(e, isKeyDown) {
  const keyEvent = {
    key: e.name,
    ctrlKey: e.state.includes('LEFT CTRL') || e.state.includes('RIGHT CTRL'),
    altKey: e.state.includes('LEFT ALT') || e.state.includes('RIGHT ALT'),
    metaKey: e.state.includes('LEFT META') || e.state.includes('RIGHT META'),
    shiftKey: e.state.includes('LEFT SHIFT') || e.state.includes('RIGHT SHIFT'),
    timestamp: new Date().toISOString(),
    isKeyDown: isKeyDown
  };
  console.log('捕获到键盘事件:', keyEvent);
  mainWindow.webContents.send('key-event', keyEvent);
}

function sendMouseEvent(e, isMouseDown) {
  const mouseEvent = {
    button: e.button,
    x: e.x,
    y: e.y,
    timestamp: new Date().toISOString(),
    isMouseDown: isMouseDown
  };
  console.log('捕获到鼠标按键事件:', mouseEvent);
  mainWindow.webContents.send('mouse-event', mouseEvent);
}

function sendMouseMoveEvent(e) {
  const mouseMoveEvent = {
    x: e.x,
    y: e.y,
    timestamp: new Date().toISOString()
  };
  console.log('捕获到鼠标移动事件:', mouseMoveEvent);
  mainWindow.webContents.send('mouse-move-event', mouseMoveEvent);
}

function sendMouseWheelEvent(e) {
  const mouseWheelEvent = {
    delta: e.delta,
    axis: e.axis,
    x: e.x,
    y: e.y,
    timestamp: new Date().toISOString()
  };
  console.log('捕获到鼠标滚轮事件:', mouseWheelEvent);
  mainWindow.webContents.send('mouse-wheel-event', mouseWheelEvent);
}

// 删除 handleKeyPress 和 addToList 函数，它们将被移到渲染进程中

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll();
});