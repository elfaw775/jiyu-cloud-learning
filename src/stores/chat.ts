import { defineStore } from 'pinia'
import { chatAPI } from '@/services/chat-new'
import type { ChatWindow, ChatMessage, SendMessageRequest } from '@/types/chat'
//import { generateId } from '@/utils/helpers'
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
    maxWindows: 1,
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
