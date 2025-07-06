<template>
  <div 
    class="desktop-pet"
    :class="{ 'pet-active': isActive, 'pet-dragging': isDragging }"
    :style="{ left: position.x + 'px', top: position.y + 'px', }"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousedown="startDrag"
  >
    <!-- <div class="pet-avatar">
      <el-icon :size="24"><ChatDotRound /></el-icon>
    </div> -->
    <div class="pet-avatar-img" :style="{ backgroundImage: `url(${petImg})` }"></div>
    <div v-if="showTooltip" class="pet-tooltip">
      {{ currentMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
//import { ChatDotRound } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import petImg from '../assets/jiyu.jpg'
const chatStore = useChatStore()

// 随机消息数组
const randomMessages = [
  '你好！我是你的学习助手小助手~',
  '有什么问题需要帮助吗？',
  '今天想学习什么新知识呢？',
  '我可以帮你解答各种问题哦！',
  '学习是一件很有趣的事情呢！',
  '有什么不懂的尽管问我吧！',
  '我是你的专属学习伙伴！',
  '让我们一起探索知识的海洋吧！',
  '有什么想法想和我分享吗？',
  '学习路上有我陪伴，不会孤单哦！'
]

const isActive = ref(false)
const showTooltip = ref(false)
const currentMessage = ref('')
const isDragging = ref(false)

// 位置状态
const position = ref({
  x: window.innerWidth - 110,
  y: window.innerHeight - 160
})

// 拖拽相关状态
const dragOffset = ref({ x: 0, y: 0 })

// 处理点击事件
async function handleClick() {
  if (isDragging.value) return // 如果正在拖拽，不触发点击事件
  
  // 随机选择一条消息
  const randomIndex = Math.floor(Math.random() * randomMessages.length)
  currentMessage.value = randomMessages[randomIndex]
  
  // 显示动画效果
  isActive.value = true
  showTooltip.value = true
  
  // 播放 TTS 语音
  await chatStore.playAudio(currentMessage.value)
  
  // 延迟隐藏提示
  setTimeout(() => {
    showTooltip.value = false
    isActive.value = false
  }, 3000)
}

// 鼠标悬停效果
function handleMouseEnter() {
  if (!isDragging.value) {
    showTooltip.value = true
    currentMessage.value = '点击我聊天吧！'
  }
}

function handleMouseLeave() {
  if (!isActive.value && !isDragging.value) {
    showTooltip.value = false
  }
}

// 开始拖拽
function startDrag(event: MouseEvent) {
  isDragging.value = true
  showTooltip.value = false
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  
  event.preventDefault()
}

// 拖拽中
function onDrag(event: MouseEvent) {
  if (!isDragging.value) return
  
  const newX = event.clientX - dragOffset.value.x
  const newY = event.clientY - dragOffset.value.y
  
  // 限制在窗口范围内
  const maxX = window.innerWidth - 60
  const maxY = window.innerHeight - 60
  
  position.value = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  }
}

// 停止拖拽
function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 窗口大小改变时调整位置
function handleResize() {
  const maxX = window.innerWidth - 60
  const maxY = window.innerHeight - 60
  
  position.value = {
    x: Math.min(position.value.x, maxX),
    y: Math.min(position.value.y, maxY)
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped lang="scss">
.desktop-pet {
  position: fixed;
  width: 60px;
  height: 60px;
  background: none;
  border-radius: 50%;
  cursor: grab;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  user-select: none;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
  }
  .pet-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: center center/contain no-repeat;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  border: 2px solid #fff;
}
  
  &.pet-active {
    animation: bounce 0.6s ease;
  }
  
  &.pet-dragging {
    cursor: grabbing;
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  }
  
  .pet-avatar {
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .pet-tooltip {
    position: absolute;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 14px;
    white-space: nowrap;
    max-width: 200px;
    word-wrap: break-word;
    z-index: 10000;
    
    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: rgba(0, 0, 0, 0.8);
    }
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .desktop-pet {
    width: 50px;
    height: 50px;
    
    .pet-avatar {
      font-size: 20px;
    }
  }
}
</style> 