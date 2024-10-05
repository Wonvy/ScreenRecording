const { ipcRenderer} = require('electron');


document.addEventListener('DOMContentLoaded', () => {
  const keyList = document.getElementById('keyList');
  const toggleBtn = document.getElementById('toggleBtn');
  let isListening = false;

  // 切换监听状态
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isListening = !isListening;
      if (isListening) {
        console.log('开始监听');
        ipcRenderer.send('start-listening');
        toggleBtn.classList.add('active');
      } else {
        console.log('停止监听');
        ipcRenderer.send('stop-listening');
        toggleBtn.classList.remove('active');
      }
    });
  }

  // 创建一个集合来存储按下的按键
  const pressedKeys = new Set(); 
  // console.log(pressedKeys);

  // 获取按键状态
  function getActionText(isKeyDownObj, key) {
    const upperKey = key.toUpperCase();  // 确保 key 是大写的
    // 检查 key 是否存在于 isKeyDownObj 中，如果存在则返回其状态，否则默认为 false
    const isKeyDown = isKeyDownObj.hasOwnProperty(upperKey) ? isKeyDownObj[upperKey] : false;
    return isKeyDown ? '按下' : '抬起';
  }

  // 监听来自主进程的'key-event'事件
  ipcRenderer.on('key-event', (event, data) => { 

    // 如果keyList元素存在
    if (keyList) { 
      const li = document.createElement('li');  // 创建一个新的列表项元素

      // 将时间戳转换为本地时间字符串，包括毫秒
      const timestamp = new Date(data.timestamp).toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      }); 
      
      let keyText = data.key.toUpperCase();  // 将按键名称转换为大写


      if (data.ctrlKey || data.altKey || data.metaKey || data.shiftKey) {  // 如果有修饰键被按下
        let combination = [];  // 创建一个数组来存储组合键
        if (data.ctrlKey) combination.push('Ctrl');  // 如果Ctrl键被按下，添加到组合键数组
        if (data.altKey) combination.push('Alt');  // 如果Alt键被按下，添加到组合键数组
        if (data.metaKey) combination.push('Meta');  // 如果Meta键被按下，添加到组合键数组
        if (data.shiftKey) combination.push('Shift');  // 如果Shift键被按下，添加到组合键数组
        combination.push(keyText);  // 将主按键添加到组合键数组
        keyText = combination.join('+');  // 将组合键数组用'+'连接成字符串
      }


      // 获取按键状态
      const actionText = getActionText(data.isKeyDown, data.key);

      if (actionText === '按下') {
        // 检查按键是否已经在pressedKeys集合中，避免重复显示
        if (!pressedKeys.has(keyText)) {
          li.textContent = `${timestamp} ${keyText} ${actionText}`;  // 设置列表项的文本内容
          keyList.prepend(li);  // 将新的列表项添加到列表的开头
        }

        pressedKeys.add(keyText); // 将按键添加到集合中
        ipcRenderer.send('key-event', pressedKeys); // 发送事件到主进程
        
       
      } else {

        li.textContent = `${timestamp} ${keyText} ${actionText}`;  // 设置列表项的文本内容
        keyList.prepend(li);  // 将新的列表项添加到列表的开头
        pressedKeys.delete(keyText); // 从集合中删除按键
      }
      console.log(pressedKeys);

    }
  });




  // 监听鼠标事件
  ipcRenderer.on('mouse-event', (event, data) => {
    console.log('捕获到鼠标事件:', data);
    const li = document.createElement('li');  // 创建一个新的列表项元素
    let MouseText = '';
    switch (data.button) {
      case 1:
        MouseText = ('左键');
        console.log('左键');
        break;
      case 2:
        MouseText = ('右键');
        console.log('右键');
        break;
      case 3:
        MouseText = ('滚轮');
        console.log('滚轮');
        break;
    }

    // 将时间戳转换为本地时间字符串，包括毫秒
    const timestamp = new Date(data.timestamp).toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    }); 

    li.textContent = `${timestamp} ${MouseText} ${data.isMouseDown ? '按下' : '抬起'  }`;  // 设置列表项的文本内容
    keyList.prepend(li);  // 将新的列表项添加到列表的开头


  });

  console.log('渲染进程脚本已加载');
});