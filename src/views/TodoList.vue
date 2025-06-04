<template>
  <div class="todo-container">
    <div class="todo-header">
      <h2>今日待办</h2>
      <div class="header-actions">
        <el-button type="primary" @click="requestAIPlan" :loading="aiLoading">
          <el-icon><Star /></el-icon>
          请求AI规划
        </el-button>
        <el-button type="success" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加任务
        </el-button>
      </div>
    </div>

    <div class="todo-content">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="待完成" name="pending">
          <div class="task-list">
            <el-empty v-if="store.pendingTasks.length === 0" description="暂无待办任务" />
            <el-card v-for="task in store.pendingTasks" :key="task._id" class="task-item">
              <div class="task-content">
                <el-checkbox 
                  :model-value="task.completed" 
                  @change="(val) => handleStatusChange(task._id, val)"
                >
                  <span :class="{ 'completed': task.completed }">{{ task.title }}</span>
                </el-checkbox>
                <div class="task-actions">
                  <el-tag size="small" :type="getPriorityType(task.priority)">
                    {{ task.priority }}
                  </el-tag>
                  <el-button type="danger" size="small" @click="store.deleteTask(task._id)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <div class="task-description" v-if="task.description">
                {{ task.description }}
              </div>
            </el-card>
          </div>
        </el-tab-pane>
        <el-tab-pane label="已完成" name="completed">
          <div class="task-list">
            <el-empty v-if="store.completedTasks.length === 0" description="暂无已完成任务" />
            <el-card v-for="task in store.completedTasks" :key="task._id" class="task-item completed">
              <div class="task-content">
                <el-checkbox 
                  :model-value="task.completed" 
                  @change="(val) => handleStatusChange(task._id, val)"
                >
                  <span class="completed">{{ task.title }}</span>
                </el-checkbox>
                <div class="task-actions">
                  <el-tag size="small" :type="getPriorityType(task.priority)">
                    {{ task.priority }}
                  </el-tag>
                  <el-button type="danger" size="small" @click="store.deleteTask(task._id)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <div class="task-description" v-if="task.description">
                {{ task.description }}
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 添加任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加任务"
      width="500px"
    >
      <el-form :model="newTask" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="newTask.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="newTask.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="newTask.priority" placeholder="请选择优先级">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addTask">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Star, Plus, Delete } from '@element-plus/icons-vue'
import { useTodoStore } from '../stores/todo'

const store = useTodoStore()
const activeTab = ref('pending')
const dialogVisible = ref(false)
const aiLoading = ref(false)

// 新任务表单
const newTask = ref({
  title: '',
  description: '',
  priority: '中'
})

// 获取优先级对应的类型
const getPriorityType = (priority) => {
  const types = {
    '高': 'danger',
    '中': 'warning',
    '低': 'info'
  }
  return types[priority] || 'info'
}

// 处理任务状态变更
const handleStatusChange = (taskId, completed) => {
  store.updateTaskStatus(taskId, completed)
  ElMessage.success(completed ? '任务已完成' : '任务已重新开始')
}

// 显示添加任务对话框
const showAddDialog = () => {
  newTask.value = {
    title: '',
    description: '',
    priority: '中'
  }
  dialogVisible.value = true
}

// 添加任务
const addTask = () => {
  if (!newTask.value.title) {
    ElMessage.warning('请输入任务标题')
    return
  }

  store.addTask(newTask.value)
  dialogVisible.value = false
  ElMessage.success('添加任务成功')
}

// 请求AI规划
const requestAIPlan = async () => {
  aiLoading.value = true
  try {
    // TODO: 调用后端AI接口获取任务规划
    // 模拟AI返回的任务
    const aiTasks = [
      {
        title: '复习高等数学第一章',
        description: '重点复习极限和连续性的概念',
        priority: '高'
      },
      {
        title: '完成线性代数作业',
        description: '完成矩阵运算相关习题',
        priority: '中'
      }
    ]
    
    aiTasks.forEach(task => store.addTask(task))
    ElMessage.success('AI已为您规划今日任务')
  } catch (error) {
    ElMessage.error('获取AI规划失败，请稍后重试')
  } finally {
    aiLoading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  store.loadData()
})
</script>

<style scoped>
.todo-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.todo-content {
  flex: 1;
  overflow-y: auto;
  width: 100%;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.task-item {
  margin-bottom: 10px;
  width: 100%;
}

.task-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.task-description {
  margin-top: 10px;
  color: #666;
  font-size: 14px;
  width: 100%;
}

.completed {
  text-decoration: line-through;
  color: #999;
}

:deep(.el-tabs__content) {
  height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 20px 0;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 20px;
}

:deep(.el-card__body) {
  padding: 15px;
}

@media screen and (max-width: 768px) {
  .todo-container {
    padding: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .task-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .task-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style> 