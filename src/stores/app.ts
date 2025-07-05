import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
    state: () => ({
        isLoggingOut: false
    }),
    actions: {
        setLoggingOut(val: boolean) {
            this.isLoggingOut = val
        }
    }
})