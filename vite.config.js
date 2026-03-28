import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/spaceTime/', // <--- أضف هذا السطر بالضبط (اسم المستودع بين سلاشين)
})