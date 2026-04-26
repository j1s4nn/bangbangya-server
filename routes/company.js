/**
 * 企业相关路由
 * GET  /api/company/search?keyword=腾讯&page=1&size=10
 * GET  /api/company/detail/:id
 * GET  /api/company/list?page=1&size=10&category=all&province=广东省&city=深圳市
 * GET  /api/company/hot
 * GET  /api/company/db-status      数据库状态（数据量、最后导入时间）
 * POST /api/company/reload-cache   导入新数据后刷新缓存
 */

const express = require('express')
const router  = express.Router()
const service = require('../services/companyService')

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// ── 搜索企业 ─────────────────────────────────────────────
router.get('/search', wrap(async (req, res) => {
  const { keyword, page = 1, size = 10 } = req.query
  if (!keyword || !keyword.trim()) {
    return res.json({ code: 400, message: '请输入搜索关键词', data: [], total: 0 })
  }
  const result = await service.searchCompany(keyword.trim(), Number(page), Number(size))
  res.json(result)
}))

// ── 企业详情 ─────────────────────────────────────────────
router.get('/detail/:id', wrap(async (req, res) => {
  const result = await service.getCompanyDetail(req.params.id)
  res.json({ code: 200, message: 'success', data: result })
}))

// ── 企业列表 ─────────────────────────────────────────────
router.get('/list', wrap(async (req, res) => {
  const { page = 1, size = 10, category = 'all', province = '', city = '' } = req.query
  const result = await service.getCompanyList({
    page: Number(page), size: Number(size), category, province, city
  })
  res.json(result)
}))

// ── 热门搜索 ─────────────────────────────────────────────
router.get('/hot', wrap(async (req, res) => {
  res.json(await service.getHotSearch())
}))

// ── 数据库状态 ────────────────────────────────────────────
router.get('/db-status', wrap(async (req, res) => {
  res.json(await service.getDBStatus())
}))

// ── 刷新缓存（导入新数据后调用）────────────────────────────
router.post('/reload-cache', (req, res) => {
  service.clearCache()
  res.json({ code: 200, message: '缓存已刷新' })
})

module.exports = router
