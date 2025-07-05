<template>
  <div class="chat-page-wide">
    <!-- 侧边栏：历史会话 -->
    <aside :class="['sidebar', { collapsed: sidebarCollapsed }]">
      <div class="sidebar-header">
        <el-button :icon="Plus" @click="createNewChat" circle size="small" />
        <el-button v-if="!sidebarCollapsed" :icon="Menu" @click="toggleSidebar" circle size="small" />
        <el-button v-else :icon="ArrowRight" @click="toggleSidebar" circle size="small" />
      </div>
      <div class="history-list" v-if="!sidebarCollapsed">
        <div
          v-for="item in chatHistory"
          :key="item.id"
          :class="['history-item', { active: item.id === currentChatId }]"
          @click="switchChat(item.id)"
        >
          <el-icon><ChatDotRound /></el-icon>
          <span class="history-title">{{ item.title }}</span>
        </div>
      </div>
    </aside>
    <!-- 主聊天区 -->
    <main class="chat-main">
      <div class="chat-container-wide">
        <div class="chat-messages-wide" ref="chatMessagesRef">
          <div 
            v-for="(msg, msgIndex) in currentChat?.messages || []" 
            :key="msgIndex" 
            :class="['message', msg.sender === 'user' ? 'user-message' : 'bot-message']"
          >
            <div class="message-content" v-html="renderMessage(msg.content)"></div>
            <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
          </div>
          <div v-if="currentChat?.isTyping" class="bot-typing">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
        <div class="chat-input-area-wide">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            placeholder="在这里输入问题..."
            resize="none"
             :disabled="currentChat?.isTyping"
            @keyup.enter.exact="sendUserMessage(currentChat.id, $event)"
          />
          <div class="input-buttons">
            <el-button :icon="Picture" circle @click="openImageUpload(currentChat.id)" />
            <el-button type="primary" @click="sendUserMessage(currentChat.id)">发送</el-button>
            <input 
              type="file" 
              ref="fileInput" 
              style="display: none" 
              accept="image/*"
              @change="handleImageUpload"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ChatDotRound, Plus, Menu, ArrowRight, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'

// 聊天历史与当前会话
const sidebarCollapsed = ref(false)
const chatHistory = ref<Array<any>>([])
const currentChatId = ref('')
const inputText = ref('') // 全局输入框内容

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

const chatMessagesRef = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// 聊天窗口结构
function createChat(title = '新会话') {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    title,
    messages: [],
    isTyping: false
  }
}

const currentChat = computed(() => chatHistory.value.find(c => c.id === currentChatId.value) || chatHistory.value[0])

function createNewChat() {
  const chat = createChat('新会话')
  chatHistory.value.unshift(chat)
  currentChatId.value = chat.id
  inputText.value = '' // 创建新会话时清空输入框
  nextTick(scrollToBottom)
}

function switchChat(id: string) {
  currentChatId.value = id
  inputText.value = '' // 切换会话时清空输入框
  nextTick(scrollToBottom)
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function sendUserMessage(chatId: string, event?: KeyboardEvent) {
  if (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
    } else {
      return
    }
  }
  const chat = chatHistory.value.find(c => c.id === chatId)
  if (!chat || !inputText.value.trim()) return
  const userMessage = inputText.value.trim()
  chat.messages.push({
    content: userMessage,
    sender: 'user',
    timestamp: new Date()
  })
  inputText.value = '' // 发送后清空输入框
  chat.isTyping = true
  nextTick(scrollToBottom)
  setTimeout(() => {
    chat.messages.push({
      content: generateBotResponse(userMessage),
      sender: 'bot',
      timestamp: new Date()
    })
    chat.isTyping = false
    nextTick(scrollToBottom)
  }, 1200)
}

function renderMessage(content: string) {
  return md.render(content)
}

function formatTime(date: Date) {
  return dayjs(date).format('HH:mm')
}

function openImageUpload(chatId: string) {
  if (fileInput.value) fileInput.value.click()
}

function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    const imageData = e.target?.result as string
    if (imageData) {
      const chat = currentChat.value
      chat.messages.push({
        content: `![上传的图片](${imageData})`,
        sender: 'user',
        timestamp: new Date()
      })
      chat.isTyping = true
      nextTick(scrollToBottom)
      setTimeout(() => {
        chat.messages.push({
          content: '我已收到您上传的图片，请问有什么可以帮助您的？',
          sender: 'bot',
          timestamp: new Date()
        })
        chat.isTyping = false
        nextTick(scrollToBottom)
      }, 1500)
    }
    if (target) target.value = ''
  }
  reader.readAsDataURL(file)
}

function generateBotResponse(userMessage: string) {
  const responses = [
    '我理解您的问题，这个知识点涉及到...',
    '根据我的理解，您问的是关于...',
    '这个问题的答案是...',
    '我可以从以下几个方面为您解答...',
    '这是一个很好的问题！让我为您详细解答...'
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

function scrollToBottom() {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

onMounted(() => {
  // 初始化一条会话
  if (chatHistory.value.length === 0) {
    createNewChat()
  }
  nextTick(scrollToBottom)
})
</script>

<style scoped lang="scss">
.chat-page-wide {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}
.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #eee;
  transition: width 0.2s;
  display: flex;
  flex-direction: column;
  &.collapsed {
    width: 48px;
    .history-list { display: none; }
  }
}
.sidebar-header {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
  gap: 8px;
  min-height: 48px;
  justify-content: flex-start;
}
.history-list {
  flex: 1;
  overflow-y: auto;
  padding-top: 8px;
}
.history-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  border-radius: 6px;
  margin: 4px 8px;
  transition: background 0.2s;
  font-size: 15px;
  color: #333;
  &:hover, &.active { background: #e6f0ff; }
  .el-icon { margin-right: 8px; }
  .history-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}
.chat-main {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  min-width: 0;
  background: #f5f7fa;
}
.chat-container-wide {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  overflow: hidden;
  position: relative;
}
.chat-messages-wide {
  flex: 1;
  overflow-y: auto;
  padding: 32px 32px 16px 32px;
  background: #f9f9f9;
}
.message {
  max-width: 80%;
  margin-bottom: 18px;
  padding: 14px 20px;
  border-radius: 12px;
  position: relative;
  font-size: 16px;
  line-height: 1.7;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  background: #fff;
  &.user-message {
    background: #e3f2fd;
    margin-left: auto;
    border-bottom-right-radius: 5px;
  }
  &.bot-message {
    background: #fff;
    border-bottom-left-radius: 5px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  }
  .message-content {
    word-break: break-word;
    :deep(p) { margin: 0 0 8px; &:last-child { margin-bottom: 0; } }
    :deep(img) { max-width: 100%; border-radius: 5px; }
    :deep(pre) { background: #f1f1f1; padding: 10px; border-radius: 5px; overflow-x: auto; }
  }
  .message-time {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
    text-align: right;
  }
}
.bot-typing {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  .typing-indicator {
    background: #f0f0f0;
    padding: 8px 15px;
    border-radius: 15px;
    display: inline-flex;
    align-items: center;
    span {
      height: 8px;
      width: 8px;
      background: #999;
      border-radius: 50%;
      display: inline-block;
      margin: 0 2px;
      animation: typing 1.4s infinite;
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }
}
.chat-input-area-wide {
  padding: 18px 32px 24px 32px;
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 10px;
  .input-buttons {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
    gap: 8px;
  }
}
@keyframes typing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
</style> 