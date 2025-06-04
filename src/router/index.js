import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Main from '../views/Main.vue'
import Home from '../views/Home.vue'
import Chat from '../views/Chat.vue'
import Voice from '../views/Voice.vue'
import TodoList from '../views/TodoList.vue'

const router = createRouter({
    history: createWebHistory(
        import.meta.env.BASE_URL),
    routes: [{
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/main',
            name: 'main',
            component: Main,
            children: [{
                    path: '',
                    name: 'home',
                    component: Home
                },
                {
                    path: 'chat',
                    name: 'chat',
                    component: Chat
                },
                {
                    path: 'voice',
                    name: 'voice',
                    component: Voice
                },
                {
                    path: 'todo',
                    name: 'todo',
                    component: TodoList
                }
            ]
        }
    ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token')
    if (to.name !== 'login' && !isAuthenticated) {
        next({ name: 'login' })
    } else {
        next()
    }
})

export default router