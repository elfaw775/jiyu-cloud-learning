import { defineStore } from 'pinia'
import { chatAPI } from '@/services/chat-new'
import type { ChatWindow, ChatMessage, SendMessageRequest } from '@/types/chat'
import { generateId } from '@/utils/helpers'
import { useAuthStore } from './auth'

interface ConversationInfo {
  id: string
  title: string
  updatedAt: string
}

interface ChatState {
  windows: ChatWindow[]
  maxWindows: number
  currentWindowId: string | null
  isGlobalLoading: boolean
  conversations: ConversationInfo[]
  currentConversationId: string | null
  messages: ChatMessage[]
  inputText: string
  loading: boolean
  voiceEnabled: boolean
  isPlaying: boolean
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    windows: [],
    maxWindows: 2,
    currentWindowId: null,
    isGlobalLoading: false,
    conversations: [],
    currentConversationId: null,
    messages: [],
    inputText: '',
    loading: false,
    voiceEnabled: false,
    isPlaying: false
  }),
  
  getters: {
    getWindowById: (state) => (id: string) => {
      return state.windows.find(window => window.id === id)
    },
    
    canCreateWindow: (state) => {
      return state.windows.length < state.maxWindows
    },
    
    hasTypingBot: (state) => {
      return state.windows.some(window => 
        window.messages.some(msg => msg.isTyping)
      )
    }
  },
  
  actions: {
    createWindow(config: {
      type: ChatWindow['type']
      title: string
      knowledge?: string
      problem?: string
      materialUrl?: string
    }) {
      if (!this.canCreateWindow) {
        throw new Error('窗口已满，请关闭一个窗口后重试')
      }
      
      const windowId = generateId()
      const position = this.calculatePosition()
      
      const newWindow: ChatWindow = {
        id: windowId,
        type: config.type,
        title: config.title,
        position,
        isFullscreen: false,
        isMinimized: false,
        knowledge: config.knowledge,
        problem: config.problem,
        materialUrl: config.materialUrl,
        messages: [],
        isLoading: false,
        conversationId: generateId(), // 生成对话ID
        step: 0,                     // 初始化步骤
        stage: 1                     // 初始化阶段
      }
      
      // 添加欢迎消息
      if (config.type !== 'material') {
        newWindow.messages.push({
          id: generateId(),
          type: 'bot',
          content: this.getWelcomeMessage(config.type),
          timestamp: Date.now()
        })
      }
      
      this.windows.push(newWindow)
      this.currentWindowId = windowId
      
      return windowId
    },
    
    closeWindow(windowId: string) {
      const index = this.windows.findIndex(w => w.id === windowId)
      if (index > -1) {
        this.windows.splice(index, 1)
        this.rearrangeWindows()
        
        // 如果关闭的是当前窗口，切换到其他窗口
        if (this.currentWindowId === windowId) {
          this.currentWindowId = this.windows.length > 0 ? this.windows[0].id : null
        }
      }
    },
    
    async sendMessage(request: SendMessageRequest) {
      const window = this.getWindowById(request.chatId)
      if (!window) return
      
      // 添加用户消息
      const userMessage: ChatMessage = {
        id: generateId(),
        type: 'user',
        content: request.content,
        timestamp: Date.now(),
        metadata: {
          knowledge: request.knowledge,
          problem: request.problem,
          images: request.images
        }
      }
      
      window.messages.push(userMessage)
      
      // 添加正在输入的bot消息
      const botMessageId = generateId()
      const botMessage: ChatMessage = {
        id: botMessageId,
        type: 'bot',
        content: '',
        timestamp: Date.now(),
        isTyping: true
      }
      
      window.messages.push(botMessage)
      window.isLoading = true
      
      try {
        const authStore = useAuthStore()
        const token = authStore.token || localStorage.getItem('jiyu_token')
        
        if (!token) {
          throw new Error('用户未登录')
        }
        
        let response
        
        // 根据窗口类型调用不同的API
        switch (window.type) {
          case 'normal':
            response = await chatAPI.sendNormalMessage({
              userId: token,
              conId: window.conversationId,
              userinfo: request.content,
              step: window.step || 0
            })
            break
            
          case 'feynman':
            response = await chatAPI.sendFeynmanMessage({
              userId: token,
              conId: window.conversationId,
              knowledge: request.knowledge || window.knowledge || '',
              userinfo: request.content,
              stage: window.stage || 1,
              step: window.step || 0
            })
            break
            
          case 'correction':
            response = await chatAPI.sendCorrectionMessage({
              userId: token,
              conId: window.conversationId,
              question: request.problem || '批改订正',
              userinfo: request.content,
              stage: window.stage || 1,
              step: window.step || 0,
              answer: request.content
            })
            break
            
          default:
            throw new Error('未知的聊天类型')
        }
        
        // 更新bot消息
        const messageIndex = window.messages.findIndex(msg => msg.id === botMessageId)
        if (messageIndex > -1 && response.success) {
          window.messages[messageIndex] = {
            ...botMessage,
            content: response.botanswer || response.message,
            isTyping: false
          }
          
          // 更新窗口状态
          if (response.step !== undefined) {
            window.step = response.step
          }
          if (response.stage !== undefined) {
            window.stage = response.stage
          }
        }
      } catch {
        // 错误处理
      } finally {
        window.isLoading = false
      }
    },
    
    toggleWindowFullscreen(windowId: string) {
      const window = this.getWindowById(windowId)
      if (window) {
        window.isFullscreen = !window.isFullscreen
      }
    },
    
    minimizeWindow(windowId: string) {
      const window = this.getWindowById(windowId)
      if (window) {
        window.isMinimized = true
      }
    },
    
    restoreWindow(windowId: string) {
      const window = this.getWindowById(windowId)
      if (window) {
        window.isMinimized = false
      }
    },
    
    calculatePosition() {
      const baseLeft = 20
      const baseTop = 100
      const offset = this.windows.length * 30
      
      return {
        left: `${baseLeft + offset}px`,
        top: `${baseTop + offset}px`
      }
    },
    
    updateWindowPosition(windowId: string, position: { left: string, top: string }) {
      const window = this.getWindowById(windowId)
      if (window) {
        window.position = position
      }
    },
    
    rearrangeWindows() {
      this.windows.forEach((window, index) => {
        window.position = {
          left: `${20 + index * 30}px`,
          top: `${100 + index * 30}px`
        }
      })
    },
    
    getWelcomeMessage(type: ChatWindow['type']) {
      const messages: Record<ChatWindow['type'], string> = {
        normal: '您好！我是您的AI学习助手，有什么可以帮助您的吗？',
        correction: '请上传您需要批改的作业，我会为您详细分析并提供改进建议。',
        feynman: '欢迎使用费曼学习法！请告诉我您想要学习的知识点，我会引导您用自己的话来解释它。',
        homework: '准备好开始今天的练习了吗？让我们一起提升您的学习水平！',
        material: '正在加载学习资料...'
      }
      
      return messages[type]
    },
    
    clearAllWindows() {
      this.windows = []
      this.currentWindowId = null
    },
    
    async fetchConversations() {
      const authStore = useAuthStore()
      const token = authStore.token || localStorage.getItem('jiyu_token')
      if (!token) return
      try {
        const res = await chatAPI.getConversations(token)
        if (res && Array.isArray(res)) {
          // 兼容后端返回数组
          this.conversations = res.map((item: unknown) => {
            if (typeof item === 'object' && item !== null) {
              const obj = item as Record<string, unknown>
              return {
                id: String(obj.id || obj.conversation_id || ''),
                title: String(obj.title || '未命名会话'),
                updatedAt: String(obj.updatedAt || obj.last_update_time || '')
              }
            }
            return { id: '', title: '未命名会话', updatedAt: '' }
          })
        } else if (res && res.data && Array.isArray(res.data)) {
          this.conversations = res.data.map((item: unknown) => {
            if (typeof item === 'object' && item !== null) {
              const obj = item as Record<string, unknown>
              return {
                id: String(obj.id || obj.conversation_id || ''),
                title: String(obj.title || '未命名会话'),
                updatedAt: String(obj.updatedAt || obj.last_update_time || '')
              }
            }
            return { id: '', title: '未命名会话', updatedAt: '' }
          })
        } else if (res && Array.isArray(res.conversations)) {
          this.conversations = res.conversations.map((item: unknown) => {
            if (typeof item === 'object' && item !== null) {
              const obj = item as Record<string, unknown>
              return {
                id: String(obj.id),
                title: String(obj.title || '未命名会话'),
                updatedAt: String(obj.last_updated || '')
              }
            }
            return { id: '', title: '未命名会话', updatedAt: '' }
          })
        } else {
          this.conversations = []
        }
      } catch {
        this.conversations = []
      }
    },
    
    async startConversation(userinfo: string) {
      const authStore = useAuthStore()
      const token = authStore.token || localStorage.getItem('jiyu_token')
      if (!token) return
      this.loading = true
      try {
        const res = await chatAPI.startConversation(token, userinfo)
        if (res && res.conversation_id) {
          this.currentConversationId = res.conversation_id
          this.messages = res.history || []
          await this.fetchConversations()
        }
      } finally {
        this.loading = false
      }
    },
    
    async continueConversation(userinfo: string) {
      const authStore = useAuthStore()
      const token = authStore.token || localStorage.getItem('jiyu_token')
      if (!token || !this.currentConversationId) return
      this.loading = true
      try {
        const res = await chatAPI.continueConversation(token, this.currentConversationId, userinfo)
        if (res && res.history) {
          this.messages = res.history
        }
      } finally {
        this.loading = false
      }
    },
    
    async fetchConversationHistory(conversationId: string) {
      const authStore = useAuthStore()
      const token = authStore.token || localStorage.getItem('jiyu_token')
      if (!token) return
      try {
        const res = await chatAPI.getConversationHistory(token, conversationId)
        if (res && res.history) {
          this.messages = res.history
        } else {
          this.messages = []
        }
      } catch {
        this.messages = []
      }
    },
    
    async switchConversation(conversationId: string) {
      this.currentConversationId = conversationId
      this.inputText = ''
      await this.fetchConversationHistory(conversationId)
    },
    
    toggleVoice() {
      this.voiceEnabled = !this.voiceEnabled
    },
    
    async playAudio(text: string) {
      if (!this.voiceEnabled || !text.trim()) return
      
      const authStore = useAuthStore()
      const token = authStore.token || localStorage.getItem('jiyu_token')
      if (!token) return
      
      this.isPlaying = true
      try {
        const res = await chatAPI.synthesizeSpeech({ text })
        if (res.success && res.audio_data) {
          // PCM base64 转 WAV Blob
          const wavBlob = pcmBase64ToWavBlob(res.audio_data, res.sample_rate || 24000)
          const audioUrl = URL.createObjectURL(wavBlob)
          const audio = new Audio(audioUrl)
          audio.onended = () => {
            this.isPlaying = false
            URL.revokeObjectURL(audioUrl)
          }
          audio.onerror = () => {
            this.isPlaying = false
            URL.revokeObjectURL(audioUrl)
          }
          await audio.play()
        }
      } catch {
        this.isPlaying = false
      }
    }
  }
})

// PCM base64 封装为 WAV Blob
function pcmBase64ToWavBlob(base64: string, sampleRate = 24000) {
  const pcm = atob(base64)
  const pcmData = new Uint8Array(pcm.length)
  for (let i = 0; i < pcm.length; i++) {
    pcmData[i] = pcm.charCodeAt(i)
  }
  // WAV 头部
  const wavBuffer = encodeWAV(pcmData, sampleRate)
  return new Blob([wavBuffer], { type: 'audio/wav' })
}

// PCM Uint8Array 封装为 WAV ArrayBuffer
function encodeWAV(pcmData: Uint8Array, sampleRate: number) {
  const numChannels = 1
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataLength = pcmData.length
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)
  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // Subchunk1Size
  view.setUint16(20, 1, true) // AudioFormat PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bytesPerSample * 8, true)
  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)
  // PCM 数据写入
  for (let i = 0; i < dataLength; i++) {
    view.setUint8(44 + i, pcmData[i])
  }
  return buffer
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}
