import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTodoStore = defineStore('todo', () => {
    // 状态
    const tasks = ref([])
    const todayStudyTime = ref(0) // 单位：秒
    const totalStudyTime = ref(0) // 单位：秒

    // 生成唯一ID
    const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2)
    }

    // 计算属性
    const pendingTasks = computed(() => tasks.value.filter(task => !task.completed))
    const completedTasks = computed(() => tasks.value.filter(task => task.completed))
    const learningProgress = computed(() => {
        if (tasks.value.length === 0) return 0
        return Math.round((completedTasks.value.length / tasks.value.length) * 100)
    })

    // 加载数据
    const loadData = () => {
        try {
            // 加载任务
            const savedTasks = localStorage.getItem('todos')
            if (savedTasks) {
                tasks.value = JSON.parse(savedTasks)
            }

            // 加载学习时长
            const today = new Date().toLocaleDateString()
            const savedTodayTime = localStorage.getItem('studyTime_' + today)
            const savedTotalTime = localStorage.getItem('totalStudyTime')

            if (savedTodayTime) {
                todayStudyTime.value = parseInt(savedTodayTime)
            }
            if (savedTotalTime) {
                totalStudyTime.value = parseInt(savedTotalTime)
            }
        } catch (error) {
            console.error('加载数据失败:', error)
                // 如果加载失败，重置数据
            tasks.value = []
            todayStudyTime.value = 0
            totalStudyTime.value = 0
        }
    }

    // 保存数据
    const saveData = () => {
        try {
            localStorage.setItem('todos', JSON.stringify(tasks.value))
            const today = new Date().toLocaleDateString()
            localStorage.setItem('studyTime_' + today, todayStudyTime.value.toString())
            localStorage.setItem('totalStudyTime', totalStudyTime.value.toString())
        } catch (error) {
            console.error('保存数据失败:', error)
        }
    }

    // 添加任务
    const addTask = (task) => {
        const newTask = {
            _id: generateId(),
            id: Date.now(),
            ...task,
            completed: false
        }
        tasks.value.push(newTask)
        saveData()
        return newTask
    }

    // 更新任务状态
    const updateTaskStatus = (taskId, completed) => {
        const task = tasks.value.find(t => t._id === taskId)
        if (task) {
            task.completed = completed
            saveData()
        }
    }

    // 删除任务
    const deleteTask = (taskId) => {
        const index = tasks.value.findIndex(t => t._id === taskId)
        if (index !== -1) {
            tasks.value.splice(index, 1)
            saveData()
        }
    }

    // 更新学习时长
    const updateStudyTime = (seconds) => {
        todayStudyTime.value += seconds
        totalStudyTime.value += seconds
        saveData()
    }

    // 设置自定义学习时长
    const setCustomStudyTime = (todayMinutes, totalHours) => {
        todayStudyTime.value = todayMinutes * 60
        totalStudyTime.value = totalHours * 3600
        saveData()
    }

    return {
        // 状态
        tasks,
        todayStudyTime,
        totalStudyTime,
        // 计算属性
        pendingTasks,
        completedTasks,
        learningProgress,
        // 方法
        loadData,
        saveData,
        addTask,
        updateTaskStatus,
        deleteTask,
        updateStudyTime,
        setCustomStudyTime
    }
})