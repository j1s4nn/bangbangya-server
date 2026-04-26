/**
 * 帮帮鸭小程序 - 后端服务 v2.0
 * Node.js + Express — Port 3000
 *
 * Routes:
 *   /admin          → Admin panel (static HTML)
 *   /api/company/*  → Business directory
 *   /api/tasks/*    → Task marketplace
 *   /api/wallet/*   → Wallet / points
 *   /api/users/*    → Users / membership
 *   /api/admin/*    → Admin dashboard data
 */

const express = require('express')
const cors    = require('cors')
const path    = require('path')
const rateLimit = require('express-rate-limit')

const companyRoutes = require('./routes/company')
const taskRoutes    = require('./routes/tasks')
const walletRoutes  = require('./routes/wallet')
const userRoutes    = require('./routes/users')
const { errorHandler, notFound } = require('./middleware/errorHandler')

const app  = express()
const PORT = process.env.PORT || 3000

// ── Middleware ───────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
})
app.use(limiter)

// ── Admin Panel (static) ────────────────────────────────────
// Serves the HTML admin panel at /admin and /admin/
app.use('/admin', express.static(path.join(__dirname, 'public/admin')))
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'))
})

// ── Root Info ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '帮帮鸭后端服务运行中 🚀',
    version: '2.0.0',
    admin: `http://localhost:${PORT}/admin`,
    endpoints: {
      companySearch:  'GET  /api/company/search?keyword=腾讯',
      companyDetail:  'GET  /api/company/detail/:id',
      companyList:    'GET  /api/company/list?page=1&size=10',
      taskList:       'GET  /api/tasks?page=1&size=10&category=all',
      taskCreate:     'POST /api/tasks',
      taskApply:      'POST /api/tasks/:id/apply',
      taskStatus:     'PATCH /api/tasks/:id/status',
      walletInfo:     'GET  /api/wallet?userId=demo_user',
      walletRecharge: 'POST /api/wallet/recharge',
      walletWithdraw: 'POST /api/wallet/withdraw',
      userProfile:    'GET  /api/users/:userId',
      userUpgrade:    'POST /api/users/:userId/upgrade',
      adminDashboard: 'GET  /api/admin/dashboard'
    }
  })
})

// ── Admin Dashboard API ─────────────────────────────────────
app.get('/api/admin/dashboard', async (req, res, next) => {
  try {
    const taskSvc   = require('./services/taskService')
    const walletSvc = require('./services/walletService')
    const userSvc   = require('./services/userService')
    const [tasks, wallet, members] = await Promise.all([
      taskSvc.getTaskStats(),
      walletSvc.getAllWalletStats(),
      userSvc.getMemberStats()
    ])
    res.json({ code: 200, message: 'success', data: { tasks, wallet, members } })
  } catch (e) { next(e) }
})

// ── API Routes ──────────────────────────────────────────────
app.use('/api/company', companyRoutes)
app.use('/api/tasks',   taskRoutes)
app.use('/api/wallet',  walletRoutes)
app.use('/api/users',   userRoutes)

// ── Error Handling ──────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🚀 帮帮鸭后端服务已启动')
  console.log(`📡 服务地址:   http://localhost:${PORT}`)
  console.log(`🖥️  管理后台:   http://localhost:${PORT}/admin`)
  console.log(`📋 任务接口:   GET  http://localhost:${PORT}/api/tasks`)
  console.log(`💰 钱包接口:   GET  http://localhost:${PORT}/api/wallet?userId=demo_user`)
  console.log(`👤 用户接口:   GET  http://localhost:${PORT}/api/users/demo_user`)
  console.log('\n按 Ctrl+C 停止服务\n')
})

module.exports = app
