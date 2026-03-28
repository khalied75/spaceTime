import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/REPO-NAME/',  // ← اسم الـ repo حقك بالضبط
})