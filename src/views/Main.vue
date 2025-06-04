<template>
  <div class="main-container">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="logo">积语_云伴学</div>
      <div class="header-right">
        <el-dropdown>
          <span class="user-info">
            <el-avatar :size="32" :src="userAvatar" />
            <span class="username">{{ username }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="showUserInfo">个人信息</el-dropdown-item>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <div class="main-content">
      <!-- 侧边栏 -->
      <el-aside width="200px" class="aside">
        <el-menu
          :default-active="activeIndex"
          class="el-menu-vertical"
          @select="handleSelect"
        >
          <el-menu-item index="1">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="2">
            <el-icon><ChatDotRound /></el-icon>
            <span>AI对话</span>
          </el-menu-item>
          <el-menu-item index="3">
            <el-icon><Microphone /></el-icon>
            <span>语音聊天</span>
          </el-menu-item>
          <el-menu-item index="4">
            <el-icon><List /></el-icon>
            <span>今日待办</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主要内容区域 -->
      <el-main class="content">
        <router-view></router-view>
      </el-main>
    </div>

    <!-- 桌宠 -->
    <DesktopPet />

    <!-- 用户信息对话框 -->
    <el-dialog
      v-model="userInfoVisible"
      title="个人信息"
      width="30%"
    >
      <el-form :model="userInfo" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="userInfo.username" disabled />
        </el-form-item>
        <el-form-item label="高数水平">
          <el-select v-model="userInfo.mathLevel" >
            <el-option label="初级" value="beginner" />
            <el-option label="中级" value="intermediate" />
            <el-option label="高级" value="advanced" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { HomeFilled, ChatDotRound, Microphone, List } from '@element-plus/icons-vue'
import DesktopPet from '../components/DesktopPet.vue'

const router = useRouter()
const route = useRoute()
const username = ref(localStorage.getItem('username') || '用户名')
const userAvatar = ref('')
const userInfoVisible = ref(false)
const userInfo = ref({
  username: username.value,
  mathLevel: 'beginner' // TODO: 从后端获取
})

const activeIndex = ref('1')

const handleSelect = (key) => {
  switch (key) {
    case '1':
      router.push('/main')
      break
    case '2':
      router.push('/main/chat')
      break
    case '3':
      router.push('/main/voice')
      break
    case '4':
      router.push('/main/todo')
      break
  }
}

const showUserInfo = () => {
  userInfoVisible.value = true
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  ElMessage.success('退出登录成功')
  router.push('/login')
}
</script>

<style scoped>
.main-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  width: 100%;
  box-sizing: border-box;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-left: 8px;
}

.main-content {
  flex: 1;
  display: flex;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.aside {
  background-color: #fff;
  border-right: 1px solid #dcdfe6;
  min-width: 200px;
  max-width: 200px;
}

.el-menu {
  border-right: none;
}

.el-menu-vertical {
  height: 100%;
}

.content {
  padding: 20px;
  background-color: #f5f7fa;
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}

@media screen and (max-width: 768px) {
  .aside {
    min-width: 160px;
    max-width: 160px;
  }
  
  .header {
    padding: 0 10px;
  }
  
  .logo {
    font-size: 16px;
  }
}
</style> 