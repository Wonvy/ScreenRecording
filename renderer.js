const { ipcRenderer} = require('electron');

// 添加这个新对象来存储按键状态
const keyStates = {};
let idCounter = 0;

// 在文件顶部添加这个新对象来存储鼠标按键状态
const mouseStates = {};

document.addEventListener('DOMContentLoaded', () => {
  const keyList = document.getElementById('keyList');
  const toggleBtn = document.getElementById('toggleBtn');
  const titleElement = document.querySelector('.container h1'); // 获取 h1 元素
  let isListening = false;

  // 切换监听状态
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isListening = !isListening;
      if (isListening) {
        console.log('开始监听');
        ipcRenderer.send('start-listening');
        toggleBtn.classList.add('active');
        titleElement.textContent = '正在记录'; // 更新标题文字
      } else {
        console.log('停止监听');
        ipcRenderer.send('stop-listening');
        toggleBtn.classList.remove('active');
        titleElement.textContent = '开始记录'; // 更新标题文字
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

  // 添加这个新的辅助函数
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds},${milliseconds}`;
  }


  // 在创建新的列表项时使用这个函数
  function createListItem(timestamp, keyText, actionText) {
    const li = document.createElement('li');
    const timeSpan = document.createElement('span');
    timeSpan.className = 'time';
    timeSpan.textContent = timestamp;
    const keySpan = document.createElement('span');
    keySpan.className = 'key-description';
    keySpan.textContent = `${keyText} ${actionText}`;
    li.appendChild(timeSpan);
    li.appendChild(keySpan);
    return li;
  }


  // 监听来自主进程的'key-event'事件
  ipcRenderer.on('key-event', (event, data) => { 

    // 如果keyList UI 元素存在
    if (keyList) { 
      const timestamp = formatTimestamp(data.timestamp); // 使用新的格式化函数
      let keyText = data.key.toUpperCase();  // 将按键名称转换为大写

      // 如果有修饰键被按下
      if (data.ctrlKey || data.altKey || data.metaKey || data.shiftKey) {  
        let combination = [];  // 创建一个数组来存储组合键
        if (data.ctrlKey) combination.push('Ctrl');  // 如果Ctrl键被按下，添加到组合键数组
        if (data.altKey) combination.push('Alt');  // 如果Alt键被按下，添加到组合键数组
        if (data.metaKey) combination.push('Meta');  // 如果Meta键被按下，添加到组合键数组
        if (data.shiftKey) combination.push('Shift');  // 如果Shift键被按下，添加到组合键数组
        combination.push(keyText);  // 将主按键添加到组合键数组
        keyText = combination.join('+');  // 将组合键数组用'+'连接成字符串
      }

      const actionText = getActionText(data.isKeyDown, data.key); // 获取按键状态


      if (actionText === '按下') {
        if (!keyStates[keyText]) {
          const id = `key-${idCounter++}`;
          // const li = document.createElement('li');  // 创建一个新的列表项元素
          const li = createListItem(timestamp, keyText, actionText);
          li.dataset.key = keyText;
          li.dataset.startTime = timestamp;
          li.id = id;
          // li.textContent = `${timestamp} ${keyText} ${actionText}`;  // 设置列表项的文本内容
          keyList.prepend(li);  // 将新的列表项添加到列表的开头
          keyStates[keyText] = { id, startTime: timestamp };
          pressedKeys.add(keyText); // 将按键添加到集合中
          ipcRenderer.send('key-event', pressedKeys); // 发送事件到主进程显示按键图标
        }
      } else { 
        const keyState = keyStates[keyText];
        if (keyState) {
          const { id, startTime } = keyState; 
          const li = document.getElementById(id);
          if (li) {
            const timeSpan = li.querySelector('.time');
            const keySpan = li.querySelector('.key-description');
            if (timeSpan && keySpan) {
              timeSpan.textContent = `${startTime} --> ${timestamp}`;
              keySpan.textContent = keyText;
            }
            keyList.prepend(li); // 将列表项移动到列表的开头
            delete keyStates[keyText];
          }

          pressedKeys.delete(keyText); // 从集合中删除按键
        }

      }
      console.log("keyStates", keyStates);
      console.log("pressedKeys", pressedKeys);

    }
  });


  // 监听鼠标事件
  ipcRenderer.on('mouse-event', (event, data) => {
    console.log('捕获到鼠标事件:', data);
    const timestamp = formatTimestamp(data.timestamp);
    let mouseText = '';
    switch (data.button) {
      case 1:
        mouseText = '左键';
        break;
      case 2:
        mouseText = '右键';
        break;
      case 3:
        mouseText = '滚轮';
        break;
    }

    const actionText = data.isMouseDown ? '按下' : '抬起';

    if (data.isMouseDown) {
      if (!mouseStates[mouseText]) {
        const id = `mouse-${idCounter++}`;
        const li = createListItem(timestamp, mouseText, actionText);
        li.dataset.mouseButton = mouseText;
        li.dataset.startTime = timestamp;
        li.id = id;
        keyList.prepend(li);
        mouseStates[mouseText] = { id, startTime: timestamp };
      }
    } else {
      const mouseState = mouseStates[mouseText];
      if (mouseState) {
        const { id, startTime } = mouseState;
        const li = document.getElementById(id);
        if (li) {
          const timeSpan = li.querySelector('.time');
          const keySpan = li.querySelector('.key-description');
          if (timeSpan && keySpan) {
            timeSpan.textContent = `${startTime} --> ${timestamp}`;
            keySpan.textContent = mouseText;
          }
          keyList.prepend(li);
        }
        delete mouseStates[mouseText];
      }
    }

    console.log("mouseStates", mouseStates);
  });

  // 添加导出按钮的事件监听
  const exportBtn = document.getElementById('exportBtn');
  exportBtn.addEventListener('click', exportSRT);

  function exportSRT() {
    console.log('开始导出 SRT');
    const keyList = document.getElementById('keyList');
    const items = keyList.getElementsByTagName('li');
    let srtContent = '';

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const timeSpan = item.querySelector('.time').textContent;
      const keySpan = item.querySelector('.key-description').textContent;

      // 解析时间
      const [startTime, endTime] = timeSpan.split(' --> ');
      
      // 添加检查，确保 startTime 和 endTime 都存在
      if (startTime && endTime) {
        const startTimeSRT = convertToSRTTime(startTime);
        const endTimeSRT = convertToSRTTime(endTime);

        // 构建 SRT 格式
        srtContent += `${i + 1}\n`;
        srtContent += `${startTimeSRT} --> ${endTimeSRT}\n`;
        srtContent += `${keySpan}\n\n`;
      } else {
        console.warn(`时间格式错误：${timeSpan}`);
      }
    }

    console.log('srtContent', srtContent);
    // 发送消息给主进程，请求保存文件
    ipcRenderer.send('save-srt', srtContent);
  }

  // 修改 convertToSRTTime 函数以处理可能的错误
  function convertToSRTTime(timeString) {
    const [time, milliseconds] = timeString.split(',');
    if (!time || !milliseconds) {
      console.warn(`无效的时间格式：${timeString}`);
      return '00:00:00,000'; // 返回默认值
    }
    
    const [hours, minutes, seconds] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')},${milliseconds.padStart(3, '0')}`;
  }

  // 监听保存文件的结果
  ipcRenderer.on('srt-saved', (event, success) => {
    if (success) {
      alert('SRT 文件已成功保存！');
    } else {
      alert('保存 SRT 文件时出错。');
    }
  });

  console.log('渲染进程脚本已加载');
});