<template>
  <ScrollContainer class="daily-practice-container" height="100vh">
    <!-- 页面头部 -->
    <div class="practice-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon><EditPen /></el-icon>
            每日刷题
          </h1>
          <p class="page-subtitle">坚持每日练习</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handleSummaryClick" :icon="ChatDotRound" size="large">
            今日做题总结
          </el-button>
          <el-button @click="$router.push('/')" :icon="ArrowLeft">
            返回主页
          </el-button>
        </div>
      </div>
    </div>

    <!-- 今日统计 -->
    <div class="daily-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <el-icon class="stat-icon" color="#409EFF"><Trophy /></el-icon>
              <div class="stat-info">
                <div class="stat-value">{{ todayCompleted }}</div>
                <div class="stat-label">今日完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <el-icon class="stat-icon" color="#67C23A"><Clock /></el-icon>
              <div class="stat-info">
                <div class="stat-value">{{ streak }}</div>
                <div class="stat-label">连续天数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <el-icon class="stat-icon" color="#E6A23C"><Star /></el-icon>
              <div class="stat-info">
                <div class="stat-value">{{ totalPoints }}</div>
                <div class="stat-label">总积分</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <el-icon class="stat-icon" color="#F56C6C"><DataLine /></el-icon>
              <div class="stat-info">
                <div class="stat-value">{{ accuracy }}%</div>
                <div class="stat-label">正确率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 题目分类选择 -->
    <div class="category-selector">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>选择练习类型</span>
          </div>
        </template>
        <el-row :gutter="16">
          <el-col :span="8" v-for="category in categories" :key="category.id">
            <div
              class="category-item"
              :class="{ active: selectedCategory?.id === category.id }"
              @click="selectCategory(category)"
            >
              <el-icon :size="40" :color="category.color">
                <component :is="category.icon" />
              </el-icon>
              <h3>{{ category.name }}</h3>
              <p>{{ category.description }}</p>
              <div class="category-stats">
                <span>{{ category.questionCount }} 题</span>
                <span>难度: {{ category.difficulty }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 题目练习区域 -->
    <div v-if="selectedCategory && currentQuestion" class="practice-area">
      <el-card>
        <template #header>
          <div class="practice-header-content">
            <span>{{ selectedCategory.name }} - 第 {{ currentQuestionIndex + 1 }} 题</span>
            <div class="progress-info">
              <el-progress
                :percentage="progressPercentage"
                :stroke-width="8"
                status="primary"
              />
            </div>
          </div>
        </template>
        <!-- 题目内容 -->
        <div class="question-content">
          <h3>{{ currentQuestion?.title }}</h3>
          <div class="question-description" v-html="renderMd(currentQuestion?.title || '')"></div>
          <!-- 选择题选项 -->
          <div class="options">
            <el-radio-group v-model="userAnswer" @change="handleAnswerChange">
              <el-radio
                v-for="(option, index) in currentQuestion?.options"
                :key="index"
                :label="option.key"
                class="option-item"
              >
                <span v-html="renderMd(option.key + '. ' + option.text)"></span>
              </el-radio>
            </el-radio-group>
          </div>
        </div>
        <!-- 操作按钮 -->
        <div class="practice-actions">
          <el-button @click="previousQuestion" :disabled="currentQuestionIndex === 0">
            上一题
          </el-button>
          <el-button type="primary" @click="submitAnswer" :loading="submitting">
            {{ submitted ? '查看解析' : '提交答案' }}
          </el-button>
          <el-button @click="nextQuestion" :disabled="selectedCategory && currentQuestionIndex >= selectedCategory.questions.length - 1">
            下一题
          </el-button>
          <el-button type="info" @click="showHint" v-if="!submitted">
            提示
          </el-button>
        </div>
        <!-- 答案解析 -->
        <div v-if="submitted && showExplanation" class="explanation">
          <el-divider content-position="left">答案解析</el-divider>
          <div class="result-info">
            <el-tag :type="isCorrect ? 'success' : 'danger'" size="large">
              {{ isCorrect ? '回答正确！' : '回答错误' }}
            </el-tag>
            <span v-if="!isCorrect" class="correct-answer">
              正确答案：{{ currentQuestion?.correctAnswer }}
            </span>
          </div>
          <div class="explanation-content">
            {{ currentQuestion?.explanation }}
          </div>
        </div>
      </el-card>
    </div>

    <!-- 选择提示 -->
    <div v-if="!selectedCategory" class="empty-state">
      <el-empty description="请选择一个练习类型开始刷题">
        <el-button type="primary" @click="selectCategory(categories[0])">
          开始练习
        </el-button>
      </el-empty>
    </div>
  </ScrollContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import ScrollContainer from '@/components/common/ScrollContainer.vue'
import {
  EditPen,
  ChatDotRound,
  ArrowLeft,
  Trophy,
  Clock,
  Star,
  DataLine,
  Cpu,
  Document,
  Lightning
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Component } from 'vue'
import MarkdownIt from 'markdown-it'
import mk from 'markdown-it-katex'
import 'katex/dist/katex.min.css'

const md = MarkdownIt({ html: true }).use(mk)

interface Question {
  id: number
  title: string
  options: { key: string; text: string }[]
  correctAnswer: string
  explanation: string
  answered: boolean
  userAnswer: string
}
interface Category {
  id: number
  name: string
  description: string
  icon: Component
  color: string
  difficulty: string
  questionCount: number
  questions: Question[]
}

const router = useRouter()

// 数据状态
const todayCompleted = ref(0)
const streak = ref(12)
const totalPoints = ref(1248)
const accuracy = ref(0)

const selectedCategory = ref<Category | null>(null)
const currentQuestionIndex = ref(0)
const userAnswer = ref('')
const codeAnswer = ref('')
const submitted = ref(false)
const submitting = ref(false)
const showExplanation = ref(false)

// 题目分类（重构：从 daily_homework 目录集成高数题库）
const simpleQuestions = [
  {
    id: 1,
    title: '当 x → 0 时，若 x - tan x 与 x^k 是同阶无穷小，则 k = （    ）',
    options: [
      { key: 'A', text: '1' },
      { key: 'B', text: '2' },
      { key: 'C', text: '3' },
      { key: 'D', text: '4' }
    ],
    correctAnswer: 'C',
    explanation: 'x - tan x ~ x^3，k=3。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 2,
    title: '下列反常积分发散的是（ ）',
    options: [
      { key: 'A', text: '∫₀^∞ x e^{-x} dx' },
      { key: 'B', text: '∫₀^∞ x e^{-x^2} dx' },
      { key: 'C', text: '∫₀^∞ arctan x/(1+x^2) dx' },
      { key: 'D', text: '∫₀^∞ x/(1+x^2) dx' }
    ],
    correctAnswer: 'D',
    explanation: '∫₀^∞ x/(1+x^2) dx 发散。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 3,
    title: 'limₓ→0 (x + 2^x)^{2/x} = ______.',
    options: [
      { key: 'A', text: '4e²' },
      { key: 'B', text: '2e²' },
      { key: 'C', text: '4e⁴' },
      { key: 'D', text: '2e⁴' }
    ],
    correctAnswer: 'A',
    explanation: '利用洛必达法则，答案为4e²。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 4,
    title: '曲线 x = t - sin t，在 t = 3π/2 对应点处的切线在y轴上的截距为______。',
    options: [
      { key: 'A', text: '3π/3+2' },
      { key: 'B', text: '3π/2+1' },
      { key: 'C', text: '3π/2' },
      { key: 'D', text: '3π/2+2' }
    ],
    correctAnswer: 'D',
    explanation: '代入求导并计算截距。',
    answered: true,
    userAnswer: ''
  }
]

const middleQuestions = [
  {
    id: 1,
    title: '曲线 y = x sin x + 2 cos x ( -π/2 < x < 2π ) 的拐点坐标为（ ）',
    options: [
      { key: 'A', text: '(0,2)' },
      { key: 'B', text: '(π,-2)' },
      { key: 'C', text: '(π/2,π/2)' },
      { key: 'D', text: '(3π/2,-3π/2)' }
    ],
    correctAnswer: 'B',
    explanation: '拐点需二阶导为0，代入可得。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 2,
    title: '已知微分方程 y" + ay\' + by = ce^x 的通解为 y = (C₁ + C₂ x) e^{-x} + e^x，则 a, b, c 依次为（ ）',
    options: [
      { key: 'A', text: '1, 0, 1' },
      { key: 'B', text: '1, 0, 2' },
      { key: 'C', text: '2, 1, 3' },
      { key: 'D', text: '2, 1, 4' }
    ],
    correctAnswer: 'B',
    explanation: '代入通解形式与原方程对比可得。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 3,
    title: '已知 f(x), g(x) 阶可导且 2 阶导函数在 x=a 处连续，则 limₓ→a [f(x)-g(x)]/(x-a)² = 0 是曲线 y=f(x) 与 y=g(x) 在 x=a 处对应点相切且曲率相等的（ ）',
    options: [
      { key: 'A', text: '充分非必要条件' },
      { key: 'B', text: '充分必要条件' },
      { key: 'C', text: '必要非充分条件' },
      { key: 'D', text: '既非充分又非必要条件' }
    ],
    correctAnswer: 'A',
    explanation: '极限为0是相切且曲率相等的充分非必要条件。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 4,
    title: '设A是4阶矩阵，A*是A的伴随矩阵，若线性方程组 Ax=0 的基础解系中只有2个向量，则 r(A*) = （ ）',
    options: [
      { key: 'A', text: '0' },
      { key: 'B', text: '1' },
      { key: 'C', text: '2' },
      { key: 'D', text: '3' }
    ],
    correctAnswer: 'B',
    explanation: '秩的性质，伴随矩阵秩为1。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 5,
    title: '设函数 f(u) 可导，z = y f(y²/x)，则 2x∂z/∂x + y∂z/∂y = ______。',
    options: [
      { key: 'A', text: 'y f(y²/y)' },
      { key: 'B', text: 'y f(y²/x)' },
      { key: 'C', text: 'x f(y²/x)' },
      { key: 'D', text: 'x f(x²/y)' }
    ],
    correctAnswer: 'B',
    explanation: '链式法则求偏导。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 6,
    title: '曲线 y = ln cos x (0 ≤ x ≤ π/6) 的弧长为 ______。',
    options: [
      { key: 'A', text: '1/2 ln3' },
      { key: 'B', text: '1/3 ln3' },
      { key: 'C', text: '1/2 ln2' },
      { key: 'D', text: '3/2 ln3' }
    ],
    correctAnswer: 'A',
    explanation: '利用弧长公式计算。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 7,
    title: '已知矩阵 A = [[1,-1,0,0],[-2,1,-1,1],[3,-2,2,-1],[0,0,3,4]]，A₁₁-A₁₂ = ______。',
    options: [
      { key: 'A', text: '-2' },
      { key: 'B', text: '-3' },
      { key: 'C', text: '-4' },
      { key: 'D', text: '-1' }
    ],
    correctAnswer: 'A',
    explanation: '代数余子式计算。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 8,
    title: '求不定积分 ∫ (3x+6)/[(x-1)²(x²+x+1)] dx。',
    options: [
      { key: 'A', text: '-2ln|x-1| - 3/(x-1) + ln(x²+x+1) + C' },
      { key: 'B', text: '-2ln|x| - 3/(x-1) + ln(x²+x+1) + C' },
      { key: 'C', text: '-2ln|x-1| - 3/(x-1) + ln(x²+x) + C' },
      { key: 'D', text: '-2ln|x-1| - 3/(x-1) + ln x² + C' }
    ],
    correctAnswer: 'A',
    explanation: '分式分解后积分。',
    answered: true,
    userAnswer: ''
  }
]

const hardQuestions = [
  {
    id: 1,
    title: '已知平面区域 D = { (x, y) | |x| + |y| ≤ π/2 }，I₁ = ∬_D √(x²+y²) dxdy，I₂ = ∬_D sin√(x²+y²) dxdy，I₃ = ∬_D (1-cos√(x²+y²)) dxdy，则（ ）',
    options: [
      { key: 'A', text: 'I₃ < I₂ < I₁' },
      { key: 'B', text: 'I₂ < I₁ < I₃' },
      { key: 'C', text: 'I₁ < I₂ < I₃' },
      { key: 'D', text: 'I₂ < I₃ < I₁' }
    ],
    correctAnswer: 'A',
    explanation: '由积分性质可知。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 2,
    title: '设A是3阶实对称矩阵，E是3阶单位矩阵。若 A² + A = 2E 且 |A|=4，则二次型 x^T A x 的规范形为（ ）',
    options: [
      { key: 'A', text: 'y₁² + y₂² + y₃²' },
      { key: 'B', text: 'y₁² + y₂² - y₃²' },
      { key: 'C', text: 'y₁² - y₂² - y₃²' },
      { key: 'D', text: 'y₁² - y₂² - y₃²' }
    ],
    correctAnswer: 'A',
    explanation: '规范形由特征值符号决定。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 3,
    title: '已知函数 f(x) = x ∫₁ˣ (sin t²)/t dt，则 ∫₀¹ f(x) dx = ______。',
    options: [
      { key: 'A', text: '(cos2-1)/4' },
      { key: 'B', text: 'cos1/4' },
      { key: 'C', text: '(cos1-1)/2' },
      { key: 'D', text: '(cos1-1)/4' }
    ],
    correctAnswer: 'D',
    explanation: '换元积分法。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 4,
    title: '已知函数 y(x) 是微分方程 y\' - x y = 1/(2√x) e^{-x²/2} 满足 y(1)=√e 的特解。(I) 求 y(x)；(II) 设平面区域 D = {(x,y) | 1≤x≤2, 0≤y≤y(x)}，求 D 绕 x 轴旋转所得旋转体的体积。',
    options: [
      { key: 'A', text: '(I) y(x)=√x e^{t²/2}；(II) V=π/2(e⁴-e)' },
      { key: 'B', text: '(I) y(x)=√x e^{t²/2}；(II) V=π/2(e⁴-1)' },
      { key: 'C', text: '(I) y(x)=√x e^{t²/2}；(II) V=π/2 e⁴' },
      { key: 'D', text: '(I) y(x)=√x e^{t/2}；(II) V=π/2(e⁴-e)' }
    ],
    correctAnswer: 'A',
    explanation: '分步解题，积分与微分结合。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 5,
    title: '已知平面区域 D = {(x,y) | |x|≤y, (x²+y²)³≤y⁴}，计算二重积分 ∬_D (x+y)/√(x²+y²) dxdy',
    options: [
      { key: 'A', text: '43/120√3' },
      { key: 'B', text: '43/120√2' },
      { key: 'C', text: '42/120√2' },
      { key: 'D', text: '43/123√2' }
    ],
    correctAnswer: 'A',
    explanation: '极坐标变换。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 6,
    title: '已知函数 u(x,y) 满足 2∂²u/∂x² - 2∂²u/∂y² + 3∂u/∂x + 3∂u/∂y = 0，求 a,b 的值，使得在变换 u(x,y)=v(x,y)e^{ax+by} 下，上述方程可化为 v(x,y) 不含一阶偏导数的方程。',
    options: [
      { key: 'A', text: 'a=-3/4, b=3/4' },
      { key: 'B', text: 'a=-1/2, b=3/4' },
      { key: 'C', text: 'a=-3/4, b=3/2' },
      { key: 'D', text: 'a=-1/4, b=3/4' }
    ],
    correctAnswer: 'A',
    explanation: '代入变换消去一阶项。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 7,
    title: '已知函数 f(x) 在 [0,1] 上具有 2 阶导数，且 f(0)=0, f(1)=1, ∫₀¹ f(x) dx=1，证明：(Ⅰ) 存在 ξ∈(0,1) 使 f(ξ)=0；(Ⅱ) 存在 η∈(0,1) 使 f(η)<-2。',
    options: [
      { key: 'A', text: '(Ⅰ) 存在 ξ∈(-1,1) 使 f\'(ξ)=0；(Ⅱ) 存在 η∈(0,1) 使 f(η)<-2' },
      { key: 'B', text: '(Ⅰ) 存在 ξ∈(0,1) 使 f\'(ξ)=0；(Ⅱ) 存在 η∈(0,1) 使 f(η)<-2' },
      { key: 'C', text: '(Ⅰ) 存在 ξ∈(0,1) 使 f\'(ξ)=0；(Ⅱ) 存在 η∈(-1,1) 使 f(η)<-2' },
      { key: 'D', text: '(Ⅰ) 存在 ξ∈(0,1) 使 f\'(ξ)=0；(Ⅱ) 存在 η∈(0,1) 使 f(η)<0' }
    ],
    correctAnswer: 'B',
    explanation: '拉格朗日中值定理与二阶导性质。',
    answered: true,
    userAnswer: ''
  },
  {
    id: 8,
    title: '已知矩阵 A = [[-2,-2,1],[2,x,-2],[0,0,-2]] 与 B = [[2,1,0],[0,-1,0],[0,0,y]] 相似。(Ⅰ) 求 x, y；(Ⅱ) 求可逆矩阵 P 使 P⁻¹AP=B。',
    options: [
      { key: 'A', text: '(Ⅰ)x=3, y=-2；(Ⅱ)P=[[-1,-1,-1],[2,1,2],[0,0,4]]' },
      { key: 'B', text: '(Ⅰ)x=3, y=-2；(Ⅱ)P=[[1,1,1],[2,1,2],[0,0,4]]' },
      { key: 'C', text: '(Ⅰ)x=3, y=2；(Ⅱ)P=[[-1,-1,-1],[2,1,2],[0,0,4]]' },
      { key: 'D', text: '(Ⅰ)x=-3, y=-2；(Ⅱ)P=[[-1,-1,-1],[2,1,2],[0,0,4]]' }
    ],
    correctAnswer: 'A',
    explanation: '相似矩阵的特征值与变换。',
    answered: true,
    userAnswer: ''
  }
]

const categories = ref([
  {
    id: 1,
    name: '简单题',
    description: '高数基础题',
    icon: Cpu,
    color: '#409EFF',
    difficulty: '简单',
    questionCount: simpleQuestions.length,
    questions: simpleQuestions
  },
  {
    id: 2,
    name: '中等题',
    description: '高数中等题',
    icon: Document,
    color: '#67C23A',
    difficulty: '中等',
    questionCount: middleQuestions.length,
    questions: middleQuestions
  },
  {
    id: 3,
    name: '难题',
    description: '高数难题',
    icon: Lightning,
    color: '#E6A23C',
    difficulty: '困难',
    questionCount: hardQuestions.length,
    questions: hardQuestions
  }
])

// 计算属性
const currentQuestion = computed(() => {
  if (!selectedCategory.value || !selectedCategory.value.questions) return null
  return selectedCategory.value.questions[currentQuestionIndex.value]
})

const progressPercentage = computed(() => {
  if (!selectedCategory.value) return 0
  return Math.round(((currentQuestionIndex.value + 1) / selectedCategory.value.questions.length) * 100)
})

const isCorrect = computed(() => {
  if (!currentQuestion.value) return false
  return userAnswer.value === currentQuestion.value.correctAnswer
})

// 方法
const selectCategory = (category: Category) => {
  selectedCategory.value = category
  currentQuestionIndex.value = 0
  userAnswer.value = ''
  codeAnswer.value = ''
  submitted.value = false
  showExplanation.value = false
}

const handleAnswerChange = () => {
  console.log('答案选择:', userAnswer.value)
}

const submitAnswer = () => {
  if (submitted.value) {
    showExplanation.value = !showExplanation.value
    return
  }
  if (!userAnswer.value && !codeAnswer.value) {
    ElMessage.warning('请先选择或填写答案')
    return
  }
  submitting.value = true
  setTimeout(() => {
    submitted.value = true
    showExplanation.value = true
    submitting.value = false
    // 记录答题
    if (currentQuestion.value) {
      currentQuestion.value.answered = true
      currentQuestion.value.userAnswer = userAnswer.value
    }
    if (isCorrect.value) {
      ElMessage.success('恭喜答对了！')
      totalPoints.value += 10
    } else {
      ElMessage.error('答案不正确，请查看解析')
    }
    // 触发统计刷新
    todayCompleted.value++
    accuracy.value = Math.round((categories.value.reduce((acc, cat) => acc + cat.questions.filter(q => q.answered && q.userAnswer === q.correctAnswer).length, 0) / todayCompleted.value) * 100)
  }, 1000)
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    resetQuestion()
  }
}

const nextQuestion = () => {
  if (selectedCategory.value && currentQuestionIndex.value < selectedCategory.value.questions.length - 1) {
    currentQuestionIndex.value++
    resetQuestion()
  }
}

const resetQuestion = () => {
  userAnswer.value = ''
  codeAnswer.value = ''
  submitted.value = false
  showExplanation.value = false
}

const showHint = () => {
  ElMessage.info('提示：仔细分析题目要求，考虑时间和空间复杂度')
}

const handleSummaryClick = () => {
  const wrongList: string[] = []
  let total = 0, correct = 0
  categories.value.forEach(cat => {
    cat.questions.forEach(q => {
      if (q.answered) {
        total++
        if (q.userAnswer === q.correctAnswer) {
          correct++
        } else {
          wrongList.push(`【${cat.name}】${q.title}，你的答案：${q.userAnswer}，正确答案：${q.correctAnswer}`)
        }
      }
    })
  })
  const accuracyVal = total ? Math.round((correct / total) * 100) : 0
  const summary = `请帮我总结一下今日刷题情况：\n正确率：${accuracyVal}%\n错题如下：\n${wrongList.length ? wrongList.join('\n') : '无'}\n请给出针对性的学习建议。`
  router.push({ path: '/chat', query: { summary } })
}

watch([categories, selectedCategory], () => {
  // 统计今日完成题数和正确率
  let total = 0, correct = 0
  categories.value.forEach(cat => {
    cat.questions.forEach(q => {
      if (q.answered) {
        total++
        if (q.userAnswer === q.correctAnswer) correct++
      }
    })
  })
  todayCompleted.value = total
  accuracy.value = total ? Math.round((correct / total) * 100) : 0
})

onMounted(() => {
  console.log('每日刷题页面已加载')
})

function renderMd(content: string) {
  return md.render(content)
}
</script>

<style scoped>
.daily-practice-container {
  padding: 20px;
  background-color: #f5f7fa;
}

.practice-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-left {
  text-align: left;
}

.header-right {
  flex-shrink: 0;
  display: flex;
  gap: 10px;
}

.page-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.page-subtitle {
  color: #606266;
  margin: 0;
  font-size: 14px;
}

.daily-stats {
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.stat-icon {
  font-size: 30px;
}

.stat-info {
  text-align: left;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.category-selector {
  margin-bottom: 30px;
}

.category-item {
  text-align: center;
  padding: 20px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 16px;
}

.category-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.category-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.category-item h3 {
  margin: 10px 0;
  color: #303133;
}

.category-item p {
  color: #606266;
  font-size: 14px;
  margin-bottom: 10px;
}

.category-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.practice-area {
  margin-bottom: 30px;
}

.practice-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-info {
  width: 200px;
}

.question-content {
  margin-bottom: 30px;
}

.question-description {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  line-height: 1.6;
}

.options {
  margin: 20px 0;
}

.option-item {
  display: block;
  margin-bottom: 15px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  transition: all 0.3s;
}

.option-item:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
}

.coding-area {
  margin: 20px 0;
}

.code-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.practice-actions {
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #e4e7ed;
  margin-top: 20px;
}

.practice-actions .el-button {
  margin: 0 10px;
}

.explanation {
  margin-top: 20px;
  padding: 20px 0;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.correct-answer {
  color: #f56c6c;
  font-weight: bold;
}

.explanation-content {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  line-height: 1.6;
}

.empty-state {
  text-align: center;
  padding: 50px 0;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .practice-header .header-content {
    flex-direction: column;
    gap: 15px;
  }

  .header-right {
    width: 100%;
    justify-content: center;
  }

  .daily-practice-container {
    padding: 10px;
  }
}
</style>
