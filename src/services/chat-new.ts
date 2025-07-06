// 聊天相关API - 对接后端Flask服务
import api from './api'

export interface ChatResponse {
  message: string
  botanswer?: string
  step?: number
  stage?: number
  success?: boolean
}

export interface HistoryResponse {
  message: string
  theme?: string[]
  conversationID?: string[]
  history?: any[]
  success?: boolean
}

export const chatAPI = {

  // 新增：获取所有会话
  async getConversations(token: string) {
    try {
      const response = await api.get('/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'response' in error) {
        // @ts-expect-error axios error.response 类型不确定
        return { message: error.response?.data?.message || '获取会话列表失败', success: false }
      }
      return { message: '获取会话列表失败', success: false }
    }
  },

  // 新增：新建会话
  async startConversation(token: string, userinfo: string) {
    try {
      const response = await api.post('/chat/normal', { userinfo }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'response' in error) {
        // @ts-expect-error axios error.response 类型不确定
        return { message: error.response?.data?.message || '新建会话失败', success: false }
      }
      return { message: '新建会话失败', success: false }
    }
  },

  // 新增：继续会话
  async continueConversation(token: string, conversation_id: string, userinfo: string) {
    try {
      const response = await api.post('/chat/normal', { conversation_id, userinfo }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'response' in error) {
        // @ts-expect-error axios error.response 类型不确定
        return { message: error.response?.data?.message || '继续会话失败', success: false }
      }
      return { message: '继续会话失败', success: false }
    }
  },

  // 新增：获取会话历史
  async getConversationHistory(token: string, conversation_id: string) {
    try {
      const response = await api.get(`/chat/conversations/${conversation_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'response' in error) {
        // @ts-expect-error axios error.response 类型不确定
        return { message: error.response?.data?.message || '获取历史失败', success: false }
      }
      return { message: '获取历史失败', success: false }
    }
  },

  // 新增：TTS 语音合成
  async synthesizeSpeech(data: {
    text: string
    voice?: string
    speed?: number
    volume?: number
  }) {
    try {
      const response = await api.post('/tts/synthesize', {
        text: data.text,
        voice: data.voice || 'yige',
        speed: data.speed || 50,
        volume: data.volume || 50
      })
      return response.data
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'response' in error) {
        // @ts-expect-error axios error.response 类型不确定
        return { message: error.response?.data?.message || '语音合成失败', success: false }
      }
      return { message: '语音合成失败', success: false }
    }
  },
}
