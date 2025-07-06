<template>
    <ScrollContainer class="chat-page" height="100vh">
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
          v-for="item in conversations"
          :key="item.id"
          :class="['history-item', { active: item.id === currentConversationId }]"
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
            v-for="(msg, msgIndex) in messages" 
            :key="msgIndex" 
            :class="['message', msg.type === 'user' ? 'user-message' : 'bot-message']"
          >
            <div class="message-content" v-html="renderMessage(msg.content)"></div>
            <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
          </div>
          <div v-if="loading" class="bot-typing">
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
            :disabled="loading"
            @keyup.enter.exact="sendUserMessage"
          />
          <div class="input-buttons">
            <el-button :icon="Picture" circle @click="openImageUpload" />
            <el-button 
              :icon="Microphone" 
              circle 
              @click="toggleVoice"
              :type="voiceEnabled ? 'primary' : 'default'"
              :loading="isPlaying"
            />
            <el-button type="primary" @click="sendUserMessage" :loading="loading">发送</el-button>
            <input 
              type="file" 
              ref="fileInput" 
              style="display: none" 
              accept="image/*"
              @change="handleImageUpload"
            />
          </div>
          <span></span><span></span><span></span>
        </div>
      </div>
    </main>
 
  </div>
</ScrollContainer>

</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ChatDotRound, Plus, Menu, ArrowRight, Picture, Microphone } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'
import markdownItKatex from 'markdown-it-katex'
import 'katex/dist/katex.min.css'
import { useChatStore } from '@/stores/chat'
import { useRoute, useRouter } from 'vue-router'

const chatStore = useChatStore()
const sidebarCollapsed = ref(false)
const md = new MarkdownIt({ html: true, linkify: true, typographer: true }).use(markdownItKatex)
const chatMessagesRef = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const route = useRoute()
const router = useRouter()

// 侧边栏会话列表
const conversations = computed(() => chatStore.conversations)
const currentConversationId = computed(() => chatStore.currentConversationId)
const messages = computed(() => chatStore.messages)
const inputText = computed({
  get: () => chatStore.inputText,
  set: v => chatStore.inputText = v
})
const loading = computed(() => chatStore.loading)
const voiceEnabled = computed(() => chatStore.voiceEnabled)
const isPlaying = computed(() => chatStore.isPlaying)

function createNewChat() {
  chatStore.startConversation('新建一个对话')
}

function switchChat(id: string) {
  chatStore.switchConversation(id)
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

async function sendUserMessage() {
  if (!inputText.value.trim() || loading.value) return
  if (!currentConversationId.value) {
    await chatStore.startConversation(inputText.value)
  } else {
    await chatStore.continueConversation(inputText.value)
  }
  chatStore.inputText = ''
  nextTick(scrollToBottom)
}

function renderMessage(content: string) {
  return md.render(content)
}

function formatTime(date: string | number | Date) {
  return dayjs(date).format('HH:mm')
}

function openImageUpload() {
  if (fileInput.value) fileInput.value.click()
}

function handleImageUpload() {
  // 可后续扩展为图片上传到后端
}

function scrollToBottom() {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

function toggleVoice() {
  chatStore.toggleVoice()
}

onMounted(async () => {
  await chatStore.fetchConversations()
  // 检查是否有 summary query
  if (route.query.summary) {
    await chatStore.startConversation(String(route.query.summary))
    // 清除 query，防止刷新重复触发
    router.replace({ path: '/chat' })
    return
  }
  if (chatStore.conversations.length > 0) {
    await chatStore.switchConversation(chatStore.conversations[0].id)
  }
  nextTick(scrollToBottom)
})

watch(messages, (newMessages, oldMessages) => {
  if (newMessages.length > oldMessages.length) {
    // 有新消息时，检查最后一条是否是 AI 回复
    const lastMessage = newMessages[newMessages.length - 1]
    if (lastMessage && lastMessage.type !== 'user' && voiceEnabled.value) {
      // 延迟播放，确保消息已渲染
      setTimeout(() => {
        chatStore.playAudio(lastMessage.content)
      }, 500)
    }
  }
  scrollToBottom()
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
    background: #007AFF;
    color: #fff;
    margin-left: auto;
    border-bottom-right-radius: 5px;
    box-shadow: 0 2px 8px rgba(0,122,255,0.3);
    .message-time {
      color: rgba(255,255,255,0.8);
    }
  }
  &.bot-message {
    background: #f8f9fa;
    color: #333;
    margin-right: auto;
    border-bottom-left-radius: 5px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border: 1px solid #e9ecef;
    .message-time {
      color: #6c757d;
    }
  }
  .message-content {
    word-break: break-word;
    :deep(p) { margin: 0 0 8px; &:last-child { margin-bottom: 0; } }
    :deep(img) { max-width: 100%; border-radius: 5px; }
    :deep(pre) { background: #f1f1f1; padding: 10px; border-radius: 5px; overflow-x: auto; }
  }
  .message-time {
    font-size: 12px;
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