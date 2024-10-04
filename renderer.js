const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  const keyList = document.getElementById('keyList');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      console.log('点击了开始监听按钮');
      ipcRenderer.send('start-listening');
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      console.log('点击了停止监听按钮');
      ipcRenderer.send('stop-listening');
    });
  }


  const pressedKeys = new Set();  // 用于记录当前按下的所有键
  console.log(pressedKeys);

  function getActionText(isKeyDownObj, key) {
    // 确保 key 是大写的
    const upperKey = key.toUpperCase();
    // 检查 key 是否存在于 isKeyDownObj 中，如果存在则返回其状态，否则默认为 false
    const isKeyDown = isKeyDownObj.hasOwnProperty(upperKey) ? isKeyDownObj[upperKey] : false;
    return isKeyDown ? '按下' : '抬起';
  }

  ipcRenderer.on('key-event', (event, data) => {  // 监听来自主进程的'key-event'事件
    // console.log('接收到键盘事件:', data);  // 在控制台输出接收到的键盘事件数据
    if (keyList) {  // 如果keyList元素存在
      const li = document.createElement('li');  // 创建一个新的列表项元素
      const timestamp = new Date(data.timestamp).toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });  // 将时间戳转换为本地时间字符串，包括毫秒
      let keyText = data.key.toUpperCase();  // 将按键名称转换为大写

      if (data.ctrlKey || data.altKey || data.metaKey || data.shiftKey) {  // 如果有修饰键被按下
        let combination = [];  // 创建一个数组来存储组合键
        if (data.ctrlKey) combination.push('Ctrl');  // 如果Ctrl键被按下，添加到组合键数组
        if (data.altKey) combination.push('Alt');  // 如果Alt键被按下，添加到组合键数组
        if (data.metaKey) combination.push('Meta');  // 如果Meta键被按下，添加到组合键数组
        if (data.shiftKey) combination.push('Shift');  // 如果Shift键被按下，添加到组合键数组
        combination.push(keyText);  // 将主按键添加到组合键数组
        keyText = combination.join('+');  // 将组合键数组用'+'连接成字符串
        // console.log("组合键",keyText);
      }
      // console.log("data.isKeyDown",data);

      // 获取按键状态
      const actionText = getActionText(data.isKeyDown, data.key);

      if (actionText === '按下') {
        // 检查按键是否已经在pressedKeys集合中，避免重复显示
        if (!pressedKeys.has(keyText)) {
          li.textContent = `${timestamp} ${keyText} ${actionText}`;  // 设置列表项的文本内容
          keyList.prepend(li);  // 将新的列表项添加到列表的开头
        }
        pressedKeys.add(keyText);
      } else {
        li.textContent = `${timestamp} ${keyText} ${actionText}`;  // 设置列表项的文本内容
        keyList.prepend(li);  // 将新的列表项添加到列表的开头
        pressedKeys.delete(keyText);
      }
      console.log(pressedKeys);

      // 发送事件到主进程
      ipcRenderer.send('key-event', pressedKeys);
    }
  });

  console.log('渲染进程脚本已加载');
});