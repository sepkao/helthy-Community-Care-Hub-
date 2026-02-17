import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import elderly from './routes/elderly'
import visit from './routes/visit'
import dashboard from './routes/dashboard'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()
// CORS Middleware - อนุญาตให้ frontend เรียก API ได้
// เมื่อ frontend (Vercel) กับ backend (Workers) คนละ domain
// เบราว์เซอร์จะบล็อกถ้าไม่ตั้งค่า CORS
app.use('/*', cors({
    origin: (origin) => {
        // อนุญาต localhost สำหรับ development
        if (origin.startsWith('http://localhost')) return origin
        // อนุญาต Vercel deployments
        if (origin.endsWith('.vercel.app')) return origin
        // อนุญาต production domain (ถ้ามี)
        return null
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.get('/', c => c.text('OK'))

// 🔥 ผูก routes
app.route('/auth', auth)
app.route('/elderly', elderly)
app.route('/visits', visit)
app.route('/dashboard', dashboard)

export default app

