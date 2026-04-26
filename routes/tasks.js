/**
 * Task Routes
 *
 * GET  /api/tasks                  List tasks (paginated, filterable)
 * GET  /api/tasks/stats            Task statistics (admin)
 * GET  /api/tasks/:id              Task detail
 * POST /api/tasks                  Create a new task
 * POST /api/tasks/:id/apply        Apply for a task (increment applyCount)
 * PATCH /api/tasks/:id/status      Update task status (admin)
 * DELETE /api/tasks/:id            Delete a task (admin)
 */

const express = require('express')
const router = express.Router()
const svc = require('../services/taskService')

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const ok = (res, data, total, extra) =>
  res.json({ code: 200, message: 'success', data, total, ...extra })

// ── Stats ─────────────────────────────────────────────────
router.get('/stats', wrap(async (req, res) => {
  const stats = await svc.getTaskStats()
  res.json({ code: 200, message: 'success', data: stats })
}))

// ── List ──────────────────────────────────────────────────
router.get('/', wrap(async (req, res) => {
  const { page = 1, size = 10, category = 'all', status = '' } = req.query
  const result = await svc.getTaskList({ page: Number(page), size: Number(size), category, status })
  res.json(result)
}))

// ── Detail ────────────────────────────────────────────────
router.get('/:id', wrap(async (req, res) => {
  const task = await svc.getTaskDetail(req.params.id)
  res.json({ code: 200, message: 'success', data: task })
}))

// ── Create ────────────────────────────────────────────────
router.post('/', wrap(async (req, res) => {
  const task = await svc.createTask(req.body)
  res.status(201).json({ code: 201, message: '任务发布成功', data: task })
}))

// ── Apply ─────────────────────────────────────────────────
router.post('/:id/apply', wrap(async (req, res) => {
  const task = await svc.applyTask(req.params.id)
  res.json({ code: 200, message: '报名成功', data: task })
}))

// ── Update status ─────────────────────────────────────────
router.patch('/:id/status', wrap(async (req, res) => {
  const { status } = req.body
  const task = await svc.updateTaskStatus(req.params.id, status)
  res.json({ code: 200, message: '状态更新成功', data: task })
}))

// ── Delete ────────────────────────────────────────────────
router.delete('/:id', wrap(async (req, res) => {
  await svc.deleteTask(req.params.id)
  res.json({ code: 200, message: '任务已删除', data: null })
}))

module.exports = router
