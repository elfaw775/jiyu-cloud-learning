import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { planningAPI } from '@/services/planning'
import { useAuthStore } from './auth'
//import { start } from 'repl'


export const usePlanningStore = defineStore('planning', {
  state: () => ({
    planning: '',
    startTime: '',
    loading: false,
  }),

  getters: {
    formattedStartTime: (state) => {
      return state.startTime ? new Date(state.startTime).toLocaleDateString() : ''
    },
  },

  actions: {
    async getPlanning() {
      const authStore = useAuthStore()
      const token = authStore.token || localStorage.getItem('jiyu_token')
      if (!token) return

      this.loading = true
      try {
        const response = await planningAPI.getplanning(token)
        if (response && response.answer) {
          if(this.planning==='')
          {
            this.planning = response.answer;
            this.startTime = new Date().toLocaleDateString() // 获取当前日期
            ElMessage.success('今日规划获取成功')
          }
          else
          {
          ElMessage.warning('今日规划已存在，请勿重复获取')
          return;
          }

        } else {
          ElMessage.error('获取规划失败，请稍后再试')
        }
      } catch (error) {
        console.error('获取规划失败:', error)
        ElMessage.error('获取规划失败，请稍后再试')
      } finally {
        this.loading = false
      }
    },
  },
})




// async startConversation(userinfo: string) {
//       const authStore = useAuthStore()
//       const token = authStore.token || localStorage.getItem('jiyu_token')
//       if (!token) return
//       this.loading = true
//       try {
//         const res = await chatAPI.startConversation(token, userinfo)
//         if (res && res.conversation_id) {
//           this.currentConversationId = res.conversation_id
//           this.messages = res.history || []
//           await this.fetchConversations()
//         }
//       } finally {
//         this.loading = false
//       }
//     },
