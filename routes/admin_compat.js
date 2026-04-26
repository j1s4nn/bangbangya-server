/**
 * HR Admin Panel Compatible Routes
 * 
 * The HR admin panel at 159.75.208.229:3000/admin uses these exact endpoints:
 * 
 * TASKS:
 *   GET  /api/task/list           → list all tasks
 *   GET  /api/task/stats          → task statistics
 *   POST /api/task/create         → create new task
 *   POST /api/task/:id/accept     → accept a task
 *   POST /api/task/:id/complete   → complete a task
 *   POST /api/task/:id/cancel     → cancel a task
 *
 * FINANCE:
 *   GET  /api/finance/wallet      → get wallet info
 *   GET  /api/finance/transactions→ list transactions
 *   GET  /api/finance/stats       → finance statistics
 *   POST /api/finance/recharge    → recharge points
 *   POST /api/finance/withdraw    → withdraw points
 */

const express = require('express')
const router = express.Router()

// Load existing services
const taskSvc   = require('../services/taskService')
const walletSvc = require('../services/walletService')

const DEFAULT_USER = 'demo_user'

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// ── TASK ROUTES ──────────────────────────────────────────────────────────────

// GET /api/task/list
router.get('/task/list', wrap(async (req, res) => {
  const { status = '', category = '', page = 1, size = 50 } = req.query
  const result = await taskSvc.getTaskList({ page: Number(page), size: Number(size), category: 'all', status })
  res.json({ code: 200, message: 'success', data: result.data, total: result.total })
}))

// GET /api/task/stats
router.get('/task/stats', wrap(async (req, res) => {
  const stats = await taskSvc.getTaskStats()
  res.json({
    code: 200, message: 'success',
    data: {
      total: stats.total,
      open: stats.open,
      done: stats.completed,
      doing: stats.assigned,
      cancelled: stats.cancelled,
      totalReward: stats.totalReward
    }
  })
}))

// POST /api/task/create
router.post('/task/create', wrap(async (req, res) => {
  const { title, desc, category = '跑腿代办', reward, address = '线上', deadline = '待定' } = req.body
  if (!title || !reward) {
    return res.json({ code: 400, message: '缺少必填字段: title, reward', data: null })
  }
  const task = await taskSvc.createTask({
    title,
    content: desc || title,
    category,
    reward: parseInt(reward),
    address,
    deadline,
    publisherName: '管理员',
    publisherId: 'user_admin'
  })
  res.json({ code: 200, message: '任务发布成功', data: task })
}))

// POST /api/task/:id/accept
router.post('/task/:id/accept', wrap(async (req, res) => {
  const task = await taskSvc.applyTask(req.params.id)
  // Also update status to assigned
  await taskSvc.updateTaskStatus(req.params.id, 'assigned')
  res.json({ code: 200, message: '接单成功', data: task })
}))

// POST /api/task/:id/complete
router.post('/task/:id/complete', wrap(async (req, res) => {
  const task = await taskSvc.updateTaskStatus(req.params.id, 'completed')
  res.json({ code: 200, message: '任务已完成，赏金已发放', data: task })
}))

// POST /api/task/:id/cancel
router.post('/task/:id/cancel', wrap(async (req, res) => {
  const task = await taskSvc.updateTaskStatus(req.params.id, 'cancelled')
  res.json({ code: 200, message: '任务已取消，积分已退还', data: task })
}))

// ── FINANCE ROUTES ───────────────────────────────────────────────────────────

// GET /api/finance/wallet
router.get('/finance/wallet', wrap(async (req, res) => {
  const userId = req.query.userId || DEFAULT_USER
  const wallet = await walletSvc.getWalletData(userId)
  res.json({ code: 200, message: 'success', data: wallet })
}))

// GET /api/finance/transactions
router.get('/finance/transactions', wrap(async (req, res) => {
  const { type = '', page = 1, size = 50, userId = DEFAULT_USER } = req.query
  const result = await walletSvc.getTransactions(userId, { page: Number(page), size: Number(size), type })

  // Map to format admin expects: { id, type, points, desc, time }
  const transactions = (result.transactions || []).map(tx => ({
    id: tx.id,
    type: tx.type,
    points: tx.amount || 0,
    desc: tx.desc || '',
    time: tx.createdAt ? new Date(tx.createdAt).toLocaleString('zh-CN') : ''
  }))

  res.json({ code: 200, message: 'success', data: transactions, total: result.total })
}))

// GET /api/finance/stats
router.get('/finance/stats', wrap(async (req, res) => {
  const stats = await walletSvc.getAllWalletStats()
  res.json({
    code: 200, message: 'success',
    data: {
      totalRecharge: stats.totalRechargeEver || 0,
      totalWithdraw: stats.totalWithdrawnEver || 0,
      totalEarn: 0,
      totalCommission: 0,
      totalPoints: stats.totalPoints || 0
    }
  })
}))

// POST /api/finance/recharge
router.post('/finance/recharge', wrap(async (req, res) => {
  const { amount, bonusRate = 0, userId = DEFAULT_USER } = req.body
  if (!amount || amount <= 0) {
    return res.json({ code: 400, message: '请输入有效的充值金额', data: null })
  }
  const bonusPoints = Math.floor(amount * bonusRate)
  const wallet = await walletSvc.recharge(userId, {
    amount: Number(amount),
    bonusPoints,
    payMethod: 'admin'
  })
  res.json({
    code: 200, message: '充值成功',
    data: {
      points: wallet.points,
      totalPoints: wallet.points,
      addedPoints: Number(amount) + bonusPoints
    }
  })
}))

// POST /api/finance/withdraw
router.post('/finance/withdraw', wrap(async (req, res) => {
  const { amount, feeRate = 0.05, userId = DEFAULT_USER } = req.body
  if (!amount || amount <= 0) {
    return res.json({ code: 400, message: '请输入有效的提现金额', data: null })
  }
  const fee = Math.ceil(amount * feeRate)
  const actual = amount - fee
  const wallet = await walletSvc.withdraw(userId, {
    amount: Number(amount),
    feeRate: Number(feeRate),
    receiveMethod: 'wechat'
  })
  res.json({
    code: 200, message: '提现申请已提交',
    data: {
      points: wallet.points,
      withdrawAmount: amount,
      fee,
      actualAmount: actual
    }
  })
}))

module.exports = router
