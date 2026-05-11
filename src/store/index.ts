import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Create pinia instance
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia

// Export stores for easier access if needed
export * from './user'
export * from './util'
export * from './facility'