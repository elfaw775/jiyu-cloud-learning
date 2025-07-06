<template>
  <div class="main-layout">

    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <img src="@/assets/jiyu.jpg" alt="Logo" class="toolbar-logo">
      <div class="buttons">
        <el-button text @click="navigateTo('/chat')" :class="{ active: $route.path === '/chat' }">智能问答</el-button>
        <el-button text @click="navigateTo('/daily-practice')" :class="{ active: $route.path === '/daily-practice' }">每日刷题</el-button>
        <el-button text @click="navigateTo('/planning')" :class="{ active: $route.path === '/planning' }">事项规划</el-button>
        <el-button text @click="navigateTo('/materials')" :class="{ active: $route.path === '/materials' }">学习资料</el-button>
        <el-button text @click="navigateTo('/correction')" :class="{ active: $route.path === '/correction' }">批改订正</el-button>
        <el-button text @click="showExpPointsDialog = true">经验值与奖励</el-button>
       
        <!-- 个性化学习下拉菜单 -->
        <div class="dropdown-container" @mouseover="showPersonalizedMenu = true" @mouseleave="showPersonalizedMenu = false">
          <el-button text>个性化学习</el-button>
          <div class="dropdown-menu" v-show="showPersonalizedMenu">
            <div class="dropdown-buttons">
              <el-button class="learn-btn" @click="createFeynmanChatWindow">
                费曼学习法
                <span class="description">用自己的语言解释所学知识来加深理解和记忆</span>
              </el-button>
              <el-button class="learn-btn" @click="showFeatureComingSoon">
                智能规划
                <span class="description">让AI来帮您定制学习路线吧！</span>
              </el-button>
              <el-button class="learn-btn" @click="showFeatureComingSoon">
                敬请期待
                <span class="description">敬请期待多种学习方法</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="settings">
        <span class="username-display">{{ username }}</span>
        <el-button :icon="Setting" circle @click="toggleSidebar" />
      </div>
    </div>
    
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ open: sidebarOpen }">
      <h2>设置</h2>
      <el-button text @click="showGuide">使用指南</el-button>
      <el-button text @click="showChangePasswordDialog = true">修改密码</el-button>
      <el-button type="danger" @click="logout">退出登录</el-button>
    </div>
    
    <!-- 主内容区域 -->
    <div class="main-content" :class="{ 'sidebar-open': sidebarOpen }">
      <router-view />
    </div>
    
    <!-- 桌宠组件 -->
    <DesktopPet />
    
    <!-- 功能即将推出提示框 -->
    <el-dialog
      v-model="showComingSoonDialog"
      title="功能开发中"
      width="30%"
    >
      <p>更多学习方法敬请期待!</p>
    </el-dialog>
    
    <!-- 经验值与奖励对话框 -->
    <el-dialog
      v-model="showExpPointsDialog"
      title="经验值与奖励"
      width="40%"
    >
      <div class="exp-points-container">
        <div class="user-level">
          <h3>当前等级: {{ userLevel }}</h3>
          <el-progress :percentage="expPercentage" :format="formatExpProgress" />
          <p>距离下一等级还需 {{ nextLevelExp - currentExp }} 经验值</p>
        </div>
        
        <div class="rewards">
          <h3>我的奖励</h3>
          <div class="rewards-list">
            <el-empty v-if="rewards.length === 0" description="暂无奖励" />
            <el-card v-for="(reward, index) in rewards" :key="index" class="reward-item">
              <template #header>
                <div class="reward-header">
                  <span>{{ reward.name }}</span>
                  <el-tag size="small" :type="reward.used ? 'info' : 'success'">
                    {{ reward.used ? '已使用' : '可使用' }}
                  </el-tag>
                </div>
              </template>
              <div class="reward-content">
                <p>{{ reward.description }}</p>
                <p class="reward-date">获得时间: {{ formatDate(reward.date) }}</p>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showChangePasswordDialog"
      title="修改密码"
      width="30%"
    >
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangePasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确认</el-button>
      </template>
    </el-dialog>
    
    <!-- 使用指南对话框 -->
    <el-dialog
      v-model="showGuideDialog"
      title="使用指南"
      width="60%"
      fullscreen
    >
      <div class="guide-content">
        <h2>欢迎使用积语伴学</h2>
        <p>本软件是为学生打造的智能学习助手，通过以下功能助力您的学习：</p>
        
        <h3>1. 智能问答</h3>
        <p>您可以向AI助手提问任何学习相关的问题，包括但不限于课程知识、解题方法、学习技巧等。</p>
        <p>支持上传图片进行识别和分析，如拍摄课本或作业中的问题。</p>
        
        <h3>2. 每日刷题</h3>
        <p>系统提供各难度等级的练习题，帮助您巩固所学知识。</p>
        <p>完成题目后可获得经验值和积分奖励。</p>
        
        <h3>3. 批改订正</h3>
        <p>上传您的作业或练习题答案，AI将帮您批改并给出改进建议。</p>
        
        <h3>4. 个性化学习</h3>
        <p>提供费曼学习法等多种学习方法，帮助您更有效地掌握知识。</p>
        
        <h3>5. 事项规划</h3>
        <p>帮助您管理学习任务，提高学习效率。</p>
        
        <h3>6. 学习资料</h3>
        <p>提供丰富的学习资源，包括教材解析、知识点总结、解题技巧等。</p>
      </div>
    </el-dialog>
    
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { Setting } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import type { FormInstance } from 'element-plus'
import DesktopPet from '@/components/DesktopPet.vue'
//import ScrollContainer from '@/components/common/ScrollContainer.vue'

// 路由和状态
const router = useRouter();
const authStore = useAuthStore()
const appStore = useAppStore()
const username = computed(() => authStore.username || '用户')

// 侧边栏状态
const sidebarOpen = ref(false)
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

// 对话框状态
const showComingSoonDialog = ref(false)
const showExpPointsDialog = ref(false)
const showChangePasswordDialog = ref(false)
const showGuideDialog = ref(false)
const showPersonalizedMenu = ref(false)

// 用户经验相关
const userLevel = computed(() => authStore.userLevel || 1)
const currentExp = computed(() => authStore.experience || 0)
const nextLevelExp = computed(() => userLevel.value * 100)
const expPercentage = computed(() => {
  const levelExp = userLevel.value * 100
  const prevLevelExp = (userLevel.value - 1) * 100
  const currentLevelExp = currentExp.value - prevLevelExp
  const requiredExp = levelExp - prevLevelExp
  return Math.floor((currentLevelExp / requiredExp) * 100)
})

// 奖励数据
const rewards = ref<Array<{
  name: string;
  description: string;
  date: Date;
  used: boolean;
}>>([])

// 修改密码表单
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码表单验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 路由导航
const navigateTo = (path: string) => {
  router.push(path)
}

// 显示功能即将推出提示
const showFeatureComingSoon = () => {
  showComingSoonDialog.value = true
}

// 创建费曼学习法聊天窗口
const createFeynmanChatWindow = () => {
  // 跳转到聊天页面并创建费曼学习法窗口
  router.push('/chat?type=feynman')
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    const valid = await passwordFormRef.value.validate()
    if (!valid) return
    
    ElMessage.success('密码修改成功！')
    showChangePasswordDialog.value = false
    
    // 重置表单
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    console.error('Form validation error:', error)
  }
}

// 展示使用指南
const showGuide = () => {
  showGuideDialog.value = true
}

// 退出登录
const logout = () => {
  appStore.setLoggingOut(true)
  ElMessageBox.confirm('确定要退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    authStore.logout()
    router.push('/login')
    ElMessage.success('已成功退出登录')
    setTimeout(() => appStore.setLoggingOut(false), 1000)
  }).catch(() => {
    appStore.setLoggingOut(false)
  })
}

// 格式化日期
const formatDate = (date: Date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 格式化经验值进度
const formatExpProgress = () => {
  return `${currentExp.value}/${nextLevelExp.value}`
}
</script>

<style scoped lang="scss">
.main-layout {
  position: relative;
  width: 100%;
  height: 100vh;
  background-image: url('@/assets/bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

// 工具栏样式
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-bottom: 2px solid #ddd;
  padding: 10px;
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 50px;
  z-index: 1200;
  
  .toolbar-logo {
    width: 8vw;
    height: 3vw;
    object-fit: contain;
    margin-left: 10%;
  }
  
  .buttons {
    flex-grow: 1;
    display: flex;
    justify-content: flex-start;
    
    :deep(.el-button) {
      background: none;
      border: none;
      color: #333;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      padding: 10px 15px;
      position: relative;
      transition: color 0.3s;
      
      &::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: -2px;
        width: 0;
        height: 2px;
        background-color: #007bff;
        transition: width 0.3s ease-in-out;
      }
      
      &:hover, &.active {
        color: #007bff;
        
        &::after {
          width: 100%;
        }
      }
    }
  }
  
  .settings {
    position: absolute;
    right: 10%;
    text-align: right;
    z-index: 1001;
    
    .username-display {
      margin-right: 15px;
      font-weight: bold;
      font-size: 18px;
      color: #1a17db;
      margin-top: -10px;
      display: inline-block;
      vertical-align: middle;
    }
  }
}

// 下拉菜单样式
.dropdown-container {
  position: relative;
  z-index: 1200;
  
  .dropdown-menu {
    position: fixed;
    top: 50px;
    left: 10vw;
    width: 80vw;
    background-color: white;
    border-bottom: 2px solid #ddd;
    border-top: none;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 1199;
    padding: 1px;
    
    .dropdown-buttons {
      display: flex;
      justify-content: center;
      gap: 40px;
      
      .learn-btn {
        background: none;
        border: 1px solid #ddd;
        padding: 10px 20px;
        font-size: 10px;
        color: black;
        text-align: center;
        cursor: pointer;
        position: relative;
        transition: box-shadow 0.3s ease-in-out;
        
        .description {
          display: block;
          font-size: 10px;
          color: gray;
          margin-top: 5px;
        }
        
        &:hover {
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        }
      }
    }
  }
}

// 侧边栏样式
.sidebar {
  height: 100%;
  width: 200px;
  position: fixed;
  top: 0;
  left: -200px;
  background-color: #f0f0f0;
  overflow-x: hidden;
  padding-top: 60px;
  transition: 0.5s;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  h2 {
    color: #333;
    text-align: center;
    margin-bottom: 20px;
  }
  
  :deep(.el-button) {
    width: 80%;
    margin: 5px 0;
    text-align: left;
  }
  
  &.open {
    left: 0;
  }
}

// 主内容区域
.main-content {
  padding-top: 60px;
  height: 100vh;
  transition: margin-left 0.5s;
  
  &.sidebar-open {
    margin-left: 200px;
  }
}

// 奖励相关样式
.exp-points-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .user-level {
    text-align: center;
    padding: 20px;
    border-radius: 8px;
    background-color: #f5f7fa;
    
    h3 {
      margin-bottom: 15px;
      color: #409EFF;
    }
  }
  
  .rewards {
    h3 {
      margin-bottom: 15px;
      text-align: center;
    }
    
    .rewards-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
      
      .reward-item {
        .reward-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .reward-content {
          .reward-date {
            font-size: 12px;
            color: #999;
            margin-top: 10px;
          }
        }
      }
    }
  }
}

// 使用指南样式
.guide-content {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  
  h2 {
    text-align: center;
    margin-bottom: 20px;
    color: #409EFF;
  }
  
  h3 {
    margin-top: 25px;
    color: #409EFF;
  }
  
  p {
    line-height: 1.6;
    margin-bottom: 15px;
  }
}
</style> 