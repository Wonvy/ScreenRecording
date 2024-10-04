const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { GlobalKeyboardListener } = require("node-global-key-listener");

let mainWindow;
let keyboardListener;

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
  mainWindow.webContents.openDevTools();
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
      console.log(`Key ${e.name} ${down ? 'pressed' : 'released'}`);
      sendKeyEvent(e, down);
    });
  }
});

ipcMain.on('stop-listening', () => {
  if (keyboardListener) {
    console.log('停止监听键盘事件');
    keyboardListener.kill();
    keyboardListener = null;
  }
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

// 删除 handleKeyPress 和 addToList 函数，它们将被移到渲染进程中