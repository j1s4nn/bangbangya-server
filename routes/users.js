/**
 * User / Member Routes
 *
 * GET  /api/users                    List all users (admin)
 * GET  /api/users/stats              Member statistics (admin)
 * GET  /api/users/levels             All membership level definitions
 * GET  /api/users/:userId            Get user profile
 * POST /api/users/:userId/upgrade    Upgrade/change member level
 */

const express = require('express')
const router = express.Router()
const svc = require('../services/userService')

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// ── All level definitions ─────────────────────────────────
router.get('/levels', (req, res) => {
  res.json({ code: 200, message: 'success', data: svc.MEMBER_LEVELS })
})

// ── Admin: all users ──────────────────────────────────────
router.get('/', wrap(async (req, res) => {
  const { page = 1, size = 20 } = req.query
  const result = await svc.getAllUsers({ page: Number(page), size: Number(size) })
  res.json({ code: 200, message: 'success', data: result.users, total: result.total })
}))

// ── Admin: member stats ───────────────────────────────────
router.get('/stats', wrap(async (req, res) => {
  const stats = await svc.getMemberStats()
  res.json({ code: 200, message: 'success', data: stats })
}))

// ── Get user profile ──────────────────────────────────────
router.get('/:userId', wrap(async (req, res) => {
  const user = await svc.getUserProfile(req.params.userId)
  res.json({ code: 200, message: 'success', data: user })
}))

// ── Upgrade member level ──────────────────────────────────
router.post('/:userId/upgrade', wrap(async (req, res) => {
  const { level, months = 1 } = req.body
  if (level === undefined) {
    return res.json({ code: 400, message: '缺少字段: level', data: null })
  }
  const user = await svc.updateMemberLevel(req.params.userId, Number(level), Number(months))
  res.json({ code: 200, message: '会员等级已更新', data: user })
}))

module.exports = router
