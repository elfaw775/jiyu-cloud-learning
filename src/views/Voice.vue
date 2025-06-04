<template>
  <div class="voice-container">
    <div class="voice-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" class="message-item" :class="message.role">
        <el-avatar :size="32" :src="message.role === 'user' ? userAvatar : aiAvatar" />
        <div class="message-content">
          <div class="message-text">
            <audio v-if="message.type === 'audio'" :src="message.content" controls></audio>
            <span v-else>{{ message.content }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="voice-controls">
      <el-button
        type="primary"
        :icon="isRecording ? 'VideoPause' : 'VideoPlay'"
        @click="toggleRecording"
        :loading="loading"
      >
        {{ isRecording ? '停止录音' : '开始录音' }}
      </el-button>
      
      <div class="recording-status" v-if="isRecording">
        <el-icon class="recording-icon"><VideoPlay /></el-icon>
        <span>正在录音...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'

const messages = ref([])
const loading = ref(false)
const isRecording = ref(false)
const messagesContainer = ref(null)
const userAvatar = ref('')
const aiAvatar = ref('')
let mediaRecorder = null
let audioChunks = []

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 开始录音
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // 添加用户语音消息
      const userMessage = {
        role: 'user',
        type: 'audio',
        content: audioUrl
      }
      messages.value.push(userMessage)
      await scrollToBottom()
      
      // TODO: 发送语音到后端处理
      loading.value = true
      
      // 模拟AI回复
      setTimeout(() => {
        const aiMessage = {
          role: 'assistant',
          type: 'text',
          content: '这是一个模拟的AI回复。在实际应用中，这里会调用AI接口获取回复。'
        }
        messages.value.push(aiMessage)
        loading.value = false
        scrollToBottom()
      }, 1000)
    }

    mediaRecorder.start()
    isRecording.value = true
  } catch (error) {
    console.error('录音失败:', error)
    ElMessage.error('录音失败，请检查麦克风权限')
  }
}

// 停止录音
const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    mediaRecorder.stream.getTracks().forEach(track => track.stop())
    isRecording.value = false
  }
}

// 切换录音状态
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

onMounted(() => {
  // 加载历史消息
  // TODO: 从本地存储或后端加载历史消息
})
</script>

<style scoped>
.voice-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.voice-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 70%;
  min-width: 200px;
}

.message-text {
  padding: 12px;
  border-radius: 8px;
  background-color: #f0f2f5;
  word-break: break-word;
}

.user .message-text {
  background-color: #409EFF;
  color: white;
}

.voice-controls {
  padding: 20px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  background-color: #fff;
}

.recording-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
}

.recording-icon {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@media screen and (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }
  
  .voice-controls {
    padding: 10px;
  }
}
</style> 