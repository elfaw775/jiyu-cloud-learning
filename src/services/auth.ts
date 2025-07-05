// 认证相关API - 对接后端Flask服务
import api from './api'
import type { User, LoginCredentials, RegisterData } from '@/types/auth'

export interface LoginResponse {
  message: string
  token?: string
  success?: boolean
}

export interface RegisterResponse {
  message: string
  success?: boolean
}

export const authAPI = {
  // 用户登录
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
        // 构造 x-www-form-urlencoded 数据
    const formData = new URLSearchParams()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)

      const response = await api.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      })
      //.then((res)=>console.log('Login response:', res));
      console.log('Login response:', response.data.access_token)

      // 后端返回格式：{"message": "login success", "token": jwt_token}
      if (response.data.access_token) {
        return {
          message: '登录成功',
          token: response.data.access_token,
          success: true
        }
      } else {
        return {
          message: '登录失败',
          success: false
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      return {
        message: '登录失败',
        success: false
      }
    }
  },

  // 用户注册
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {

      const response = await api.post('/auth/signup', {
        username: data.username,  // 后端使用userName字段
        password: data.password
      })

      // 后端返回格式：{"message": "signup success"} 或 {"message": "duplicate userName"}
      if (response.data.message === "signup success") {
        return {
          message: '注册成功',
          success: true
        }
      } else {
        return {
          message: response.data.message === "duplicate userName" ? '用户名已存在' : '注册失败',
          success: false
        }
      }
    } catch (error: any) {
      console.error('Register error:', error)
      return {
        message: error.response?.data?.message || '注册失败',
        success: false
      }
    }
  },

  // 获取用户信息
  async getUserInfo(): Promise<{ user: User | null; success: boolean }> {
    try {
      const token = localStorage.getItem('jiyu_token')
      if (!token) {
        return { user: null, success: false }
      }

      const response = await api.get('/auth/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      // 兼容后端返回格式，避免undefined.message报错
      if (response.data &&  response.data.username) {
        //localStorage.setItem('jiyu_user', JSON.stringify(response.data.username))
        return { user: response.data.username, success: true }
      } else {
        return { user: null, success: false }
      }
    } catch (error) {
      console.error('Get user info error:', error)
      return { user: null, success: false }
    }
  },

  // 更新用户信息（暂不支持）
  async updateProfile(data: Partial<User>): Promise<User | null> {
    // 后端暂不支持用户信息更新
    console.warn('用户信息更新功能暂不支持')
    return null
  },

  // 退出登录
  async logout(): Promise<{ success: boolean }> {
    try {
      localStorage.removeItem('jiyu_token')
      localStorage.removeItem('jiyu_user')
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false }
    }
  }
}
