<template>
  <div class="chat-container">
    <div class="chat-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" class="message-item" :class="message.role">
        <el-avatar :size="32" :src="message.role === 'user' ? userAvatar : aiAvatar" />
        <div class="message-content">
          <div class="message-text" v-html="renderMessage(message.content)"></div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="3"
        placeholder="请输入您的问题..."
        @keyup.enter.ctrl="sendMessage"
      />
      <el-button type="primary" @click="sendMessage" :loading="loading">
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const messagesContainer = ref(null)
const userAvatar = ref('')
const aiAvatar = ref('')

// 渲染数学公式
const renderMessage = (content) => {
  // 使用正则表达式匹配数学公式
  const mathRegex = /\$\$(.*?)\$\$/g
  return content.replace(mathRegex, (match, formula) => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false
      })
    } catch (e) {
      console.error('公式渲染错误:', e)
      return match
    }
  })
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }

  const userMessage = {
    role: 'user',
    content: inputMessage.value
  }
  
  messages.value.push(userMessage)
  inputMessage.value = ''
  await scrollToBottom()
  
  loading.value = true
  
  try {
    // TODO: 调用AI接口
    // 模拟AI回复
    setTimeout(() => {
      const aiMessage = {
        role: 'assistant',
        content: '这是一个模拟的AI回复。在实际应用中，这里会调用AI接口获取回复。'
      }
      messages.value.push(aiMessage)
      loading.value = false
      scrollToBottom()
    }, 1000)
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
    loading.value = false
  }
}

onMounted(() => {
  // 加载历史消息
  // TODO: 从本地存储或后端加载历史消息
})
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.chat-messages {
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

.chat-input {
  padding: 20px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  background-color: #fff;
}

.chat-input .el-button {
  align-self: flex-end;
  flex-shrink: 0;
}

.chat-input .el-textarea {
  flex: 1;
}

@media screen and (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }
  
  .chat-input {
    padding: 10px;
  }
}
</style> 