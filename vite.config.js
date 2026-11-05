import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Đổi `base` thành '/<tên-repo>/' khi deploy lên GitHub Pages
export default defineConfig({ plugins: [react()], base: './' })
