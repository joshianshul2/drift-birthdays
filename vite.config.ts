import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' so the bundle loads from Capacitor's local file server
export default defineConfig({ base: './', plugins: [react()] })
