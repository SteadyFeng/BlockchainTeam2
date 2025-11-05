import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // 允许访问到项目根目录（用于导入 ../build/contracts/*.json）
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
