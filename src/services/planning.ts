//规划相关api 主要为了实现rag规划
//rag接口：post http://118.178.229.132:8000/rag/query
// 请求体：{"query": "获取今日规划", "collection_name": "my_test_diary_collection"}
// 响应体：{
//     "conversation_id": null,
//     "answer": "",
//     "sources": [...]
// }
import api from './api'



export const planningAPI = {

  //获取今日规划
  async getplanning(token: string) {
    try {
      const response = await api.post('/rag/query', { "query":"根据目前题库帮用户规划今日学习计划，只以形式 1… 2… 3… 来回复 不要带任何其他文本 你的回复只有这三行规划" , "collection_name":"daily_questiones" }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('获取今日规划响应:', response.data)
      return response.data
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'response' in error) {
        // @ts-expect-error axios error.response 类型不确定
        return { message: error.response?.data?.message || '新建会话失败', success: false }
      }
      return { message: '新建会话失败', success: false }
    }
  },

  //获取今日规划


}
