<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const router = useRouter()
const route = useRoute()
const isAuthenticated = ref(false)

// 检查用户认证状态
const checkAuth = () => {
  const token = localStorage.getItem('token')
  isAuthenticated.value = !!token
}

// 全局错误处理
const handleGlobalError = (error) => {
  console.error('全局错误:', error)
  ElMessage.error('发生错误，请稍后重试')
}

// 全局网络错误处理
const handleNetworkError = (error) => {
  console.error('网络错误:', error)
  ElMessage.error('网络连接失败，请检查网络设置')
}

// 初始化应用
onMounted(() => {
  checkAuth()
  
  // 添加全局错误监听
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleGlobalError)
  
  // 添加网络错误监听
  window.addEventListener('offline', handleNetworkError)
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('error', handleGlobalError)
  window.removeEventListener('unhandledrejection', handleGlobalError)
  window.removeEventListener('offline', handleNetworkError)
})
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <el-container class="layout-container">
        <el-main class="main">
          <router-view></router-view>
        </el-main>
      </el-container>
    </div>
  </el-config-provider>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

#app {
  display: flex; /* 或 grid */
  height: 100%;
  width: 100%;
}

.app-container {
  width: 100%; 
  height: 100%;
  display: flex; /* 推荐 */
  flex-direction: column; /* 或 row，根据需求 */
}

.layout-container {
  display: flex; /* 或 grid */
 
  height: 100%;
  width: 100%;
}

.main {
  display: flex; /* 或 grid */
  background-color: #f0f2f5;
  padding: 0;
  height: 100%;
 
  width: 100%;
  min-width: 100%;
  height: 100%;
  overflow-y: auto;
}
</style> 