/**
 * Wallet Routes
 *
 * GET  /api/wallet                    Get wallet info (userId from query)
 * GET  /api/wallet/transactions       Transaction history (filterable by type)
 * GET  /api/wallet/stats              Admin-level stats for all wallets
 * POST /api/wallet/recharge           Add points (recharge)
 * POST /api/wallet/withdraw           Withdraw points
 */

const express = require('express')
const router = express.Router()
const svc = require('../services/walletService')

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// ── Admin stats ───────────────────────────────────────────
router.get('/stats', wrap(async (req, res) => {
  const stats = await svc.getAllWalletStats()
  res.json({ code: 200, message: 'success', data: stats })
}))

// ── Get wallet info ───────────────────────────────────────
router.get('/', wrap(async (req, res) => {
  const userId = req.query.userId || 'demo_user'
  const wallet = await svc.getWalletData(userId)
  res.json({ code: 200, message: 'success', data: wallet })
}))

// ── Transaction history ───────────────────────────────────
router.get('/transactions', wrap(async (req, res) => {
  const { userId = 'demo_user', page = 1, size = 20, type = '' } = req.query
  const result = await svc.getTransactions(userId, { page: Number(page), size: Number(size), type })
  res.json({ code: 200, message: 'success', data: result.transactions, total: result.total, points: result.points })
}))

// ── Recharge ──────────────────────────────────────────────
router.post('/recharge', wrap(async (req, res) => {
  const { userId = 'demo_user', amount, bonusPoints = 0, payMethod = 'wechat' } = req.body
  const wallet = await svc.recharge(userId, { amount: Number(amount), bonusPoints: Number(bonusPoints), payMethod })
  res.json({ code: 200, message: '充值成功', data: { points: wallet.points, totalEarned: wallet.totalEarned } })
}))

// ── Withdraw ──────────────────────────────────────────────
router.post('/withdraw', wrap(async (req, res) => {
  const { userId = 'demo_user', amount, receiveMethod = 'wechat', feeRate = 0.05 } = req.body
  const wallet = await svc.withdraw(userId, { amount: Number(amount), receiveMethod, feeRate: Number(feeRate) })
  res.json({ code: 200, message: '提现申请已提交', data: { points: wallet.points, totalWithdrawn: wallet.totalWithdrawn } })
}))

module.exports = router
