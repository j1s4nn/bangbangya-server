/**
 * 企业数据服务层（升级版）
 *
 * 数据优先级：
 *   1. 本地数据库 db/companies.json（由 import.js 定时导入Excel生成）
 *   2. 内置模拟数据（兜底，db为空时使用）
 *   3. 真实API（配置Token后可启用）
 */

const fs      = require('fs')
const path    = require('path')
const axios   = require('axios')
const NodeCache = require('node-cache')
const { companies: mockCompanies, shareholders, personnel, investments, risks } = require('../data/mockData')

// 缓存 TTL 5分钟（数据库更新后自动刷新）
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 })

// 数据库路径
const DB_FILE = path.join(__dirname, '../db/companies.json')

// ── 真实API配置（填入Key即可启用）─────────────────────────
const API_CONFIG = {
  tianyancha: {
    enabled: false,
    token: process.env.TIANYANCHA_TOKEN || '',
    baseURL: 'https://www.tianyancha.com/cloud-other-information/zxInfo/p/search'
  }
}

// ── 读取本地数据库 ─────────────────────────────────────────
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
      // 数据库结构: { "信用代码1": {...}, "信用代码2": {...} }
      return Object.values(raw)
    }
  } catch (e) {
    console.warn('[DB] 读取数据库失败，使用模拟数据:', e.message)
  }
  return null
}

function getDBMeta() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
      return raw.meta || {}
    }
  } catch {}
  return {}
}

// 获取当前数据源（db 或 mock）
function getCompanyList_source() {
  const dbList = loadDB()
  if (dbList && dbList.length > 0) return { list: dbList, source: 'db' }
  return { list: mockCompanies, source: 'mock' }
}

// ── 统一返回格式 ──────────────────────────────────────────
const success = (data, total, extra) => ({ code: 200, message: 'success', data, total, ...extra })

// ── 搜索企业 ──────────────────────────────────────────────
async function searchCompany(keyword, page = 1, size = 10) {
  const cacheKey = `search_${keyword}_${page}_${size}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  let result

  // 尝试真实API
  if (API_CONFIG.tianyancha.enabled && API_CONFIG.tianyancha.token) {
    try { result = await searchByTianyancha(keyword, page, size) } catch (e) {
      console.warn('[TYC] 降级到本地:', e.message)
    }
  }

  // 本地搜索（db优先，无db用mock）
  if (!result) {
    result = searchLocal(keyword, page, size)
  }

  cache.set(cacheKey, result)
  return result
}

function searchLocal(keyword, page, size) {
  const { list, source } = getCompanyList_source()
  const kw = keyword.toLowerCase()

  const filtered = list.filter(c =>
    (c.name && c.name.includes(keyword)) ||
    (c.shortName && c.shortName.includes(keyword)) ||
    (c.legalPerson && c.legalPerson.includes(keyword)) ||
    (c.industry && c.industry.toLowerCase().includes(kw)) ||
    (c.creditCode && c.creditCode.includes(keyword)) ||
    (c.address && c.address.includes(keyword)) ||
    (c.businessScope && c.businessScope.includes(keyword)) ||
    (c.tags && c.tags.some && c.tags.some(t => t.includes(keyword)))
  )

  const total = filtered.length
  const start = (page - 1) * size
  const pageData = filtered.slice(start, start + size)

  return success(pageData, total, { source })
}

async function searchByTianyancha(keyword, page, size) {
  const { data } = await axios.get(API_CONFIG.tianyancha.baseURL, {
    params: { word: keyword, pageSize: size, pageNum: page },
    headers: { Authorization: `Bearer ${API_CONFIG.tianyancha.token}` },
    timeout: 8000
  })
  if (data.state !== 'ok') throw new Error(data.message)
  const list = (data.data?.data || []).map(item => ({
    id: item.id, name: item.name, status: item.regStatus,
    legalPerson: item.legalPersonName, registeredCapital: item.regCapital,
    establishedDate: item.estiblishTime ? new Date(item.estiblishTime).toISOString().slice(0, 10) : '',
    industry: item.industry, tags: item.tags ? item.tags.split(',') : []
  }))
  return success(list, data.data?.total || list.length, { source: 'api' })
}

// ── 获取企业详情 ──────────────────────────────────────────
async function getCompanyDetail(id) {
  const cacheKey = `detail_${id}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const { list } = getCompanyList_source()

  // 按id或信用代码匹配
  const company = list.find(c => String(c.id) === String(id) || c.creditCode === id)

  if (!company) {
    const err = new Error('企业不存在')
    err.status = 404
    throw err
  }

  const result = {
    company,
    risks: risks[id] || [],
    shareholders: shareholders[id] || [{ name: '信息暂未公开', ratio: '-', type: '-' }],
    personnel: personnel[id] || [{ name: company.legalPerson || '-', role: '法定代表人' }],
    investments: investments[id] || []
  }

  cache.set(cacheKey, result)
  return result
}

// ── 企业列表（分类/分页）─────────────────────────────────
async function getCompanyList({ page = 1, size = 10, category = 'all', province = '', city = '' } = {}) {
  const { list, source } = getCompanyList_source()
  let filtered = [...list]

  if (category === 'active')  filtered = filtered.filter(c => c.status === '在业' || c.statusType === 'active')
  else if (category === 'large')   filtered = filtered.filter(c => c.employees && parseInt(c.employees) > 50000)
  else if (category === 'it')      filtered = filtered.filter(c => c.industry && (c.industry.includes('IT') || c.industry.includes('互联网') || c.industry.includes('软件')))
  else if (category === 'finance') filtered = filtered.filter(c => c.industry && (c.industry.includes('金融') || c.industry.includes('银行') || c.industry.includes('保险')))
  else if (category === 'cancelled') filtered = filtered.filter(c => c.statusType === 'cancelled')

  if (province) filtered = filtered.filter(c => c.province && c.province.includes(province))
  if (city)     filtered = filtered.filter(c => c.city && c.city.includes(city))

  const total = filtered.length
  const start = (page - 1) * size
  return success(filtered.slice(start, start + size), total, { source })
}

// ── 热门搜索 ──────────────────────────────────────────────
async function getHotSearch() {
  return success(['腾讯', '阿里巴巴', '华为', '字节跳动', '小米', '美团', '百度', '京东', '比亚迪', '宁德时代'])
}

// ── 数据库状态 ─────────────────────────────────────────────
async function getDBStatus() {
  const meta = getDBMeta()
  const { list, source } = getCompanyList_source()
  return success({
    source,
    total: list.length,
    lastImport: meta.lastImport || null,
    lastFile: meta.lastFile || null
  })
}

// 清除缓存（导入新数据后调用）
function clearCache() {
  cache.flushAll()
  console.log('[Cache] 已清除所有缓存')
}

module.exports = { searchCompany, getCompanyDetail, getCompanyList, getHotSearch, getDBStatus, clearCache }
