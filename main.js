const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron');
const { GlobalKeyboardListener } = require("node-global-key-listener");
const mouseEvents = require("global-mouse-events");
const fs = require('fs');

let mainWindow;
let keyboardListener;
let mouseListener;
let shortcutWindow;

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    autoHideMenuBar: true,  // 自动隐藏菜单栏
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');

  // 禁用主窗口的默认右键菜单
  mainWindow.hookWindowMessage(278, function (e) {
    mainWindow.setEnabled(false);
    setTimeout(() => {
      mainWindow.setEnabled(true);
    }, 100);
    return true;
  });

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

  // 禁用快捷键窗口的默认右键菜单
  shortcutWindow.hookWindowMessage(278, function (e) {
    shortcutWindow.setEnabled(false);
    setTimeout(() => {
      shortcutWindow.setEnabled(true);
    }, 100);
    return true;
  });

  // 加载快捷键显示页面
  shortcutWindow.loadFile('shortcut.html');

  // 当主窗口关闭时，关闭所有窗口
  mainWindow.on('closed', () => {
    if (shortcutWindow) {
      shortcutWindow.close();
    }
    app.quit();
  });
}

// 当应用程序准备好时，创建一个新的窗口
app.whenReady().then(createWindow);

// 当所有窗口关闭时，退出应用程序
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 当应用程序激活时，创建一个新的窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 开始监听
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
    
    // 监听鼠标按下事件
    mouseEvents.on("mousedown", handleMouseDown);

    // 监听鼠标释放事件
    mouseEvents.on("mouseup", handleMouseUp);

    // 监听鼠标移动事件
    mouseEvents.on("mousemove", handleMouseMove);

    // 监听鼠标滚轮事件
    mouseEvents.on("mousewheel", handleMouseWheel);

    // 设置鼠标监听器为true
    mouseListener = true; 
  }
});

// 停止监听
ipcMain.on('stop-listening', () => {
  if (keyboardListener) {
    console.log('停止监听键盘事件');
    keyboardListener.kill(); // 停止监听键盘事件
    keyboardListener = null;
  }

  if (mouseListener) {
    console.log('停止监听鼠标事件');
    mouseEvents.removeListener("mousedown", handleMouseDown);
    mouseEvents.removeListener("mouseup", handleMouseUp);
    mouseEvents.removeListener("mousemove", handleMouseMove);
    mouseEvents.removeListener("mousewheel", handleMouseWheel);
    mouseListener = false;
  }
});

// 鼠标事件处理函数
function handleMouseDown(event) {
  console.log('mousedown:', event);
  sendMouseEvent(event, true);
}

function handleMouseUp(event) {
  console.log('mouseup:', event);
  sendMouseEvent(event, false);
}

function handleMouseMove(event) {
  // console.log('mousemove:', event);
  sendMouseMoveEvent(event);
}

function handleMouseWheel(event) {
  console.log('mousewheel:', event);
  sendMouseWheelEvent(event);
}

// 发送键盘事件
ipcMain.on('key-event', (event, data) => {
  shortcutWindow.webContents.send('update-shortcut', data);
});

// 发送键盘事件
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

// 发送鼠标按键事件
function sendMouseEvent(e, isMouseDown) {
  const mouseEvent = {
    button: e.button,
    x: e.x,
    y: e.y,
    timestamp: new Date().toISOString(),
    isMouseDown: isMouseDown
  };
  // console.log('捕获到鼠标按键事件:', mouseEvent);
  mainWindow.webContents.send('mouse-event', mouseEvent);
  shortcutWindow.webContents.send('mouse-event', mouseEvent); // 直接发送到shortcut窗口
}

// 发送鼠标移动事件
function sendMouseMoveEvent(e) {
  const mouseMoveEvent = {
    x: e.x,
    y: e.y,
    timestamp: new Date().toISOString()
  };
  // console.log('捕获到鼠标移动事件:', mouseMoveEvent);
  mainWindow.webContents.send('mouse-move-event', mouseMoveEvent);
}

// 发送鼠标滚轮事件
function sendMouseWheelEvent(e) {
  const mouseWheelEvent = {
    delta: e.delta,
    axis: e.axis,
    x: e.x,
    y: e.y,
    timestamp: new Date().toISOString()
  };
  console.log('mouse-wheel-event:', mouseWheelEvent);
  // mainWindow.webContents.send('mouse-wheel-event', mouseWheelEvent);
  shortcutWindow.webContents.send('mouse-wheel-event', mouseWheelEvent); // 直接发送到shortcut窗口
}

// 收到保存 SRT 请求
ipcMain.on('save-srt', (event, content) => {
  
  dialog.showSaveDialog(mainWindow, {
    title: '保存 SRT 文件',
    defaultPath: app.getPath('documents') + '/subtitle.srt',
    filters: [{ name: 'SRT 文件', extensions: ['srt'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFile(result.filePath, content, (err) => {
        if (err) {
          console.error('保存文件时出错:', err);
          event.reply('srt-saved', false);
        } else {
          event.reply('srt-saved', true);
        }
      });
    } else {
      event.reply('srt-saved', false);
    }
  }).catch(err => {
    console.error('显示保存对话框时出错:', err);
    event.reply('srt-saved', false);
  });
});


// 注销所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});