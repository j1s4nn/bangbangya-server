/**
 * User / Member Service
 * Handles user profiles and membership level management.
 * Persists to db/users.json
 */

const { JsonDB, Config } = require('node-json-db')
const path = require('path')

const db = new JsonDB(new Config(path.join(__dirname, '../db/users'), true, true, '/'))

const MEMBER_LEVELS = [
  { level: 0, name: '游客',     color: '#999999', price: 0,   features: [] },
  { level: 1, name: '注册会员', color: '#4CAF50', price: 0,   features: ['发布任务', '接单'] },
  { level: 2, name: 'VIP会员',  color: '#2196F3', price: 29,  features: ['发布任务', '接单', '优先排序', '每月3次免费提现'] },
  { level: 3, name: '高级VIP',  color: '#9C27B0', price: 59,  features: ['发布任务', '接单', '优先排序', '每月10次免费提现', '专属客服'] },
  { level: 4, name: '企业会员', color: '#FF9800', price: 199, features: ['发布任务', '接单', '优先排序', '无限免费提现', '专属客服', '数据报告'] },
  { level: 5, name: '钻石会员', color: '#F44336', price: 499, features: ['发布任务', '接单', '优先排序', '无限免费提现', '专属客服', '数据报告', '商务对接'] }
]

const SEED_USERS = {
  'demo_user': {
    userId: 'demo_user',
    nickName: '演示用户',
    avatarUrl: '',
    memberLevel: 1,
    joinDate: Date.now() - 86400000 * 30,
    memberExpire: null,
    publishCount: 3,
    acceptCount: 5,
    rating: 4.8
  }
}

async function ensureSeed() {
  try { await db.getData('/users') } catch (e) { await db.push('/users', SEED_USERS) }
}
ensureSeed()

function success(data, extra = {}) {
  return { code: 200, message: 'success', data, ...extra }
}

async function getUserProfile(userId = 'demo_user') {
  const users = await db.getData('/users')
  if (!users[userId]) {
    users[userId] = { userId, nickName: '新用户', avatarUrl: '', memberLevel: 1, joinDate: Date.now(), memberExpire: null, publishCount: 0, acceptCount: 0, rating: 5.0 }
    await db.push('/users', users)
  }
  const user = users[userId]
  const levelInfo = MEMBER_LEVELS.find(l => l.level === user.memberLevel) || MEMBER_LEVELS[1]
  return { ...user, levelInfo }
}

async function updateMemberLevel(userId = 'demo_user', level, months = 1) {
  if (level < 0 || level > 5) {
    const err = new Error('无效会员等级，范围 0-5'); err.status = 400; throw err
  }
  const users = await db.getData('/users')
  if (!users[userId]) users[userId] = { userId, nickName: '新用户', avatarUrl: '', memberLevel: 1, joinDate: Date.now(), memberExpire: null, publishCount: 0, acceptCount: 0, rating: 5.0 }

  users[userId].memberLevel = level
  // Calculate expiry: if downgrading to 0/1, no expiry; else set months from now
  if (level <= 1) {
    users[userId].memberExpire = null
  } else {
    const expireTs = (users[userId].memberExpire && users[userId].memberExpire > Date.now())
      ? users[userId].memberExpire + months * 30 * 86400000
      : Date.now() + months * 30 * 86400000
    users[userId].memberExpire = expireTs
  }
  await db.push('/users', users)
  return users[userId]
}

async function getAllUsers({ page = 1, size = 20 } = {}) {
  const users = await db.getData('/users')
  const list = Object.values(users).sort((a, b) => (b.joinDate || 0) - (a.joinDate || 0))
  const total = list.length
  const start = (page - 1) * size
  return { users: list.slice(start, start + size), total }
}

async function getMemberStats() {
  const users = await db.getData('/users')
  const list = Object.values(users)
  const byLevel = {}
  MEMBER_LEVELS.forEach(l => { byLevel[l.name] = 0 })
  list.forEach(u => {
    const l = MEMBER_LEVELS.find(lv => lv.level === (u.memberLevel || 1))
    if (l) byLevel[l.name]++
  })
  return { totalUsers: list.length, byLevel }
}

module.exports = { getUserProfile, updateMemberLevel, getAllUsers, getMemberStats, MEMBER_LEVELS }
