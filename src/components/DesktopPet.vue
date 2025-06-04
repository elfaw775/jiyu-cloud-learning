<template>
    <div
      class="desktop-pet"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      @mousedown="startDrag"
      @click="speak"
    >
      <!-- 右键菜单 -->
      <el-dropdown
        trigger="contextmenu"
        @command="handleCommand"
      >
        <span class="el-dropdown-link">
          <img :src="petImage" alt="桌宠" class="pet-image" />
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="chat">
              <el-icon><ChatDotRound /></el-icon>
              AI对话
            </el-dropdown-item>
            <el-dropdown-item command="voice">
              <el-icon><Microphone /></el-icon>
              语音聊天
            </el-dropdown-item>
            <el-dropdown-item command="todo">
              <el-icon><List /></el-icon>
              今日待办
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
  
      <!-- 语音气泡 -->
      <div v-if="speaking" class="speech-bubble">
        {{ currentSpeech }}
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ChatDotRound, Microphone, List } from '@element-plus/icons-vue'
  import petImage from '../assets/pet_jiyu.png'  // 导入图片
  
  const router = useRouter()
  const position = ref({ x: 100, y: 100 })
  const isDragging = ref(false)
  const dragOffset = ref({ x: 0, y: 0 })
  const speaking = ref(false)
  const currentSpeech = ref('')
  
  // 语音列表
  const speeches = [
    '主人，需要我帮你做什么吗？',
    '今天也要加油哦！',
    '要记得完成待办事项哦！',
    '需要我陪你聊天吗？',
    '学习累了要适当休息哦！'
  ]
  
  // 开始拖拽
  const startDrag = (e) => {
    isDragging.value = true
    dragOffset.value = {
      x: e.clientX - position.value.x,
      y: e.clientY - position.value.y
    }
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }
  
  // 拖拽中
  const onDrag = (e) => {
    if (isDragging.value) {
      position.value = {
        x: e.clientX - dragOffset.value.x,
        y: e.clientY - dragOffset.value.y
      }
    }
  }
  
  // 停止拖拽
  const stopDrag = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }
  
  // 说话
  const speak = () => {
    if (speaking.value) return
    
    speaking.value = true
    const randomSpeech = speeches[Math.floor(Math.random() * speeches.length)]
    currentSpeech.value = randomSpeech
    
    // 使用Web Speech API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(randomSpeech)
      // 设置语音参数
      utterance.lang = 'zh-CN'  // 设置语言为中文
      utterance.rate = 1.0      // 语速
      utterance.pitch = 1.0     // 音调
      utterance.volume = 1.0    // 音量

      // 获取可用的声音列表
      const voices = window.speechSynthesis.getVoices()
      // 尝试找到中文声音
      const chineseVoice = voices.find(voice => voice.lang.includes('zh'))
      if (chineseVoice) {
        utterance.voice = chineseVoice
      }

      // 开始说话
      window.speechSynthesis.speak(utterance)
    } else {
      console.warn('您的浏览器不支持语音合成')
    }
    
    // 3秒后隐藏语音气泡
    setTimeout(() => {
      speaking.value = false
    }, 3000)
  }
  
  // 处理菜单命令
  const handleCommand = (command) => {
    switch (command) {
      case 'chat':
        router.push('/main/chat')
        break
      case 'voice':
        router.push('/main/voice')
        break
      case 'todo':
        router.push('/main/todo')
        break
    }
  }
  
  // 组件卸载时清理事件监听和语音
  onUnmounted(() => {
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    // 停止所有语音
    window.speechSynthesis.cancel()
  })
  
  // 组件挂载时初始化语音
  onMounted(() => {
    // 确保语音列表已加载
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        console.log('可用的语音列表已加载')
      })
    }
  })
  </script>
  
  <style scoped>
  .desktop-pet {
    position: fixed;
    width: 100px;
    height: 100px;
    cursor: move;
    user-select: none;
    z-index: 1000;
  }
  
  .pet-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none; /* 防止图片影响拖拽 */
  }
  
  .speech-bubble {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    padding: 8px 12px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    max-width: 200px;
    white-space: nowrap;
    animation: fadeIn 0.3s ease;
    pointer-events: none; /* 防止气泡影响点击 */
  }
  
  .speech-bubble::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 8px 8px 0;
    border-style: solid;
    border-color: white transparent transparent;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, 10px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  .el-dropdown-link {
    display: block;
    width: 100%;
    height: 100%;
  }
  
  :deep(.el-dropdown-menu__item) {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  :deep(.el-icon) {
    margin-right: 4px;
  }
  </style>