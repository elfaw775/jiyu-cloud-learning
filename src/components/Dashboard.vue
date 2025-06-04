<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <!-- 任务统计卡片 -->
      <el-col :span="8">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <el-icon><List /></el-icon>
              <span>任务统计</span>
            </div>
          </template>
          <div class="stat-content">
            <div class="stat-item">
              <div class="stat-label">已完成任务</div>
              <div class="stat-value">{{ store.completedTasks.length }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">待办任务</div>
              <div class="stat-value">{{ store.pendingTasks.length }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 学习进度卡片 -->
      <el-col :span="8">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <el-icon><Reading /></el-icon>
              <span>学习进度</span>
            </div>
          </template>
          <div class="progress-content">
            <el-progress 
              type="dashboard"
              :percentage="store.learningProgress"
              :color="progressColor"
            >
              <template #default="{ percentage }">
                <div class="progress-value">
                  <span class="percentage">{{ percentage }}%</span>
                  <span class="label">完成度</span>
                </div>
              </template>
            </el-progress>
          </div>
        </el-card>
      </el-col>

      <!-- 学习时长卡片 -->
      <el-col :span="8">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <el-icon><Timer /></el-icon>
              <span>学习时长</span>
              <el-button 
                type="primary" 
                size="small" 
                class="custom-time-btn"
                @click="showCustomTimeDialog"
              >
                自定义时长
              </el-button>
            </div>
          </template>
          <div class="stat-content">
            <div class="stat-item">
              <div class="stat-label">今日学习</div>
              <div class="stat-value">{{ formatTime(store.todayStudyTime) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">累计学习</div>
              <div class="stat-value">{{ formatTime(store.totalStudyTime) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 自定义时长对话框 -->
    <el-dialog
      v-model="customTimeDialogVisible"
      title="自定义学习时长"
      width="30%"
    >
      <el-form :model="customTimeForm" label-width="100px">
        <el-form-item label="今日学习时长">
          <el-input-number 
            v-model="customTimeForm.todayMinutes" 
            :min="0" 
            :max="1440"
            placeholder="请输入分钟数"
          />
        </el-form-item>
        <el-form-item label="累计学习时长">
          <el-input-number 
            v-model="customTimeForm.totalHours" 
            :min="0" 
            :max="10000"
            placeholder="请输入小时数"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="customTimeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCustomTime">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { List, Reading, Timer } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useTodoStore } from '../stores/todo'

const store = useTodoStore()
const customTimeDialogVisible = ref(false)
const customTimeForm = ref({
  todayMinutes: 0,
  totalHours: 0
})

// 格式化时间显示
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

// 根据进度计算颜色
const progressColor = computed(() => {
  if (store.learningProgress >= 80) return '#67C23A'
  if (store.learningProgress >= 60) return '#E6A23C'
  return '#F56C6C'
})

// 显示自定义时长对话框
const showCustomTimeDialog = () => {
  customTimeForm.value = {
    todayMinutes: Math.floor(store.todayStudyTime / 60),
    totalHours: Math.floor(store.totalStudyTime / 3600)
  }
  customTimeDialogVisible.value = true
}

// 保存自定义时长
const saveCustomTime = () => {
  store.setCustomStudyTime(
    customTimeForm.value.todayMinutes,
    customTimeForm.value.totalHours
  )
  customTimeDialogVisible.value = false
  ElMessage.success('学习时长已更新')
}

// 开始计时
let studyTimer = null
let lastActiveTime = Date.now()

const startTimer = () => {
  studyTimer = setInterval(() => {
    const now = Date.now()
    const timeDiff = Math.floor((now - lastActiveTime) / 1000)
    if (timeDiff > 0) {
      store.updateStudyTime(timeDiff)
      lastActiveTime = now
    }
  }, 1000)
}

// 监听页面可见性变化
const handleVisibilityChange = () => {
  if (document.hidden) {
    clearInterval(studyTimer)
  } else {
    lastActiveTime = Date.now()
    startTimer()
  }
}

onMounted(() => {
  store.loadData()
  startTimer()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  clearInterval(studyTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.stat-card {
  height: 100%;
  transition: all 0.3s;
  margin-bottom: 20px;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
  flex-wrap: wrap;
}

.custom-time-btn {
  margin-left: auto;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 0;
}

.stat-item {
  text-align: center;
  padding: 10px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.progress-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.progress-value {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.percentage {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

:deep(.el-progress__text) {
  font-size: 24px !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media screen and (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }

  .stat-card {
    margin-bottom: 15px;
  }

  .card-header {
    font-size: 14px;
  }

  .stat-value {
    font-size: 20px;
  }

  .percentage {
    font-size: 20px;
  }
}
</style> 