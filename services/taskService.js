/**
 * Task Service
 * Handles all task (帮帮鸭 errand/gig tasks) CRUD operations.
 * Persists data to db/tasks.json using node-json-db.
 */

const { JsonDB, Config } = require('node-json-db')
const path = require('path')
const NodeCache = require('node-cache')

const db = new JsonDB(new Config(path.join(__dirname, '../db/tasks'), true, true, '/'))
const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 })

// Seed default tasks if DB is empty
const SEED_TASKS = [
  {
    id: 'task001',
    title: '帮我代购一份麦当劳套餐',
    desc: '需要在附近麦当劳帮买一份双层牛堡套餐（大杯可乐），送到小区门口，急！',
    reward: 30,
    category: '代购跑腿',
    categoryIcon: '🛍️',
    address: '上海市浦东新区张江镇',
    distance: '0.8km',
    status: 'open',
    statusLabel: '招募中',
    publisherName: '小明',
    publisherAvatar: '👦',
    publisherLevel: 2,
    publisherLevelName: 'VIP会员',
    publishTime: '2025-03-20 10:00',
    deadline: '今天 18:00',
    applyCount: 3,
    viewCount: 42,
    tags: ['急单', '跑腿', '餐饮'],
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 'task002',
    title: '帮我取一下快递，楼下菜鸟驿站',
    desc: '有3个快递在楼下菜鸟驿站，取件码已发，帮忙取回放在3栋2单元门口即可。',
    reward: 15,
    category: '取件送件',
    categoryIcon: '📦',
    address: '北京市海淀区五道口',
    distance: '200m',
    status: 'open',
    statusLabel: '招募中',
    publisherName: '王女士',
    publisherAvatar: '👩',
    publisherLevel: 1,
    publisherLevelName: '注册会员',
    publishTime: '2025-03-20 09:35',
    deadline: '今天 20:00',
    applyCount: 5,
    viewCount: 68,
    tags: ['快递', '取件'],
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: 'task003',
    title: '寻找一位会修电脑的师傅上门',
    desc: '家里台式机突然黑屏，系统无法启动，需要专业人士上门排查，预计1-2小时，提供工具。',
    reward: 150,
    category: '电脑维修',
    categoryIcon: '💻',
    address: '广州市天河区珠江新城',
    distance: '1.2km',
    status: 'open',
    statusLabel: '招募中',
    publisherName: '张老板',
    publisherAvatar: '👨‍💼',
    publisherLevel: 3,
    publisherLevelName: '高级VIP',
    publishTime: '2025-03-20 08:00',
    deadline: '明天 12:00',
    applyCount: 2,
    viewCount: 31,
    tags: ['维修', '上门', '电脑'],
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'task004',
    title: '需要一位家教老师辅导高中数学',
    desc: '孩子高一，数学基础较弱，需要每周两次上门辅导，每次2小时，有教材。',
    reward: 200,
    category: '家教辅导',
    categoryIcon: '📚',
    address: '成都市武侯区桐梓林',
    distance: '2.5km',
    status: 'open',
    statusLabel: '招募中',
    publisherName: '李妈妈',
    publisherAvatar: '👩‍👦',
    publisherLevel: 1,
    publisherLevelName: '注册会员',
    publishTime: '2025-03-19 15:00',
    deadline: '3天后',
    applyCount: 7,
    viewCount: 95,
    tags: ['家教', '数学', '高中'],
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'task005',
    title: '设计一个企业LOGO，简洁大气',
    desc: '公司新成立，需要设计一个LOGO，行业是科技/软件，风格要简洁现代，需提供AI/SVG源文件。',
    reward: 300,
    category: '设计制作',
    categoryIcon: '🎨',
    address: '线上',
    distance: '线上',
    status: 'open',
    statusLabel: '招募中',
    publisherName: '陈总',
    publisherAvatar: '👨‍💼',
    publisherLevel: 4,
    publisherLevelName: '企业会员',
    publishTime: '2025-03-19 11:00',
    deadline: '5天后',
    applyCount: 12,
    viewCount: 156,
    tags: ['设计', 'LOGO', '线上'],
    createdAt: Date.now() - 86400000 * 1
  }
]

async function ensureSeed() {
  try {
    await db.getData('/tasks')
  } catch (e) {
    await db.push('/tasks', SEED_TASKS)
  }
}

ensureSeed()

function success(data, total, extra = {}) {
  return { code: 200, message: 'success', data, total, ...extra }
}

// ── Get task list ─────────────────────────────────────────
async function getTaskList({ page = 1, size = 10, category = 'all', status = '' } = {}) {
  cache.del('task_list_all')
  let tasks = await db.getData('/tasks')

  if (category && category !== 'all') {
    const MAP = {
      urgent:  t => t.tags && t.tags.includes('急单'),
      online:  t => t.address === '线上' || (t.distance && t.distance.includes('线上')),
      errand:  t => ['代购跑腿', '取件送件'].includes(t.category),
      repair:  t => ['电脑维修', '家电维修'].includes(t.category) || (t.tags && t.tags.includes('上门')),
      design:  t => ['设计制作', '文案写作', '摄影拍照', '翻译服务', '程序开发'].includes(t.category),
      teach:   t => t.category === '家教辅导',
      labor:   t => ['搬家搬运', '遛狗宠物'].includes(t.category)
    }
    if (MAP[category]) tasks = tasks.filter(MAP[category])
  }

  if (status) tasks = tasks.filter(t => t.status === status)

  // Sort: newest first
  tasks = tasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

  const total = tasks.length
  const start = (page - 1) * size
  return success(tasks.slice(start, start + size), total)
}

// ── Get single task ───────────────────────────────────────
async function getTaskDetail(id) {
  const tasks = await db.getData('/tasks')
  const task = tasks.find(t => t.id === id)
  if (!task) {
    const err = new Error('任务不存在')
    err.status = 404
    throw err
  }
  // increment view count
  task.viewCount = (task.viewCount || 0) + 1
  await db.push('/tasks', tasks)
  return task
}

// ── Create task ───────────────────────────────────────────
async function createTask(body) {
  const { title, content, address, reward, category = '其他' } = body
  if (!title || !content || !address || !reward) {
    const err = new Error('缺少必填字段: title, content, address, reward')
    err.status = 400
    throw err
  }

  const tasks = await db.getData('/tasks')
  const newTask = {
    id: `task_${Date.now()}`,
    title: String(title).trim(),
    desc: String(content).trim(),
    reward: parseFloat(reward),
    category: String(category).trim(),
    categoryIcon: '📋',
    address: String(address).trim(),
    distance: '',
    status: 'open',
    statusLabel: '招募中',
    publisherName: body.publisherName || '匿名用户',
    publisherAvatar: '👤',
    publisherLevel: body.publisherLevel || 1,
    publisherLevelName: body.publisherLevelName || '注册会员',
    publishTime: new Date().toLocaleString('zh-CN'),
    deadline: body.deadline || '待定',
    applyCount: 0,
    viewCount: 0,
    tags: body.tags || [],
    createdAt: Date.now()
  }

  tasks.unshift(newTask)
  await db.push('/tasks', tasks)
  cache.flushAll()
  return newTask
}

// ── Update task status ────────────────────────────────────
async function updateTaskStatus(id, status) {
  const VALID = ['open', 'assigned', 'completed', 'cancelled']
  if (!VALID.includes(status)) {
    const err = new Error(`无效状态，可选值: ${VALID.join(', ')}`)
    err.status = 400
    throw err
  }
  const LABEL_MAP = { open: '招募中', assigned: '进行中', completed: '已完成', cancelled: '已取消' }

  const tasks = await db.getData('/tasks')
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) {
    const err = new Error('任务不存在'); err.status = 404; throw err
  }
  tasks[idx].status = status
  tasks[idx].statusLabel = LABEL_MAP[status]
  await db.push('/tasks', tasks)
  cache.flushAll()
  return tasks[idx]
}

// ── Apply for a task ──────────────────────────────────────
async function applyTask(id) {
  const tasks = await db.getData('/tasks')
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) {
    const err = new Error('任务不存在'); err.status = 404; throw err
  }
  if (tasks[idx].status !== 'open') {
    const err = new Error('该任务已不接受报名'); err.status = 400; throw err
  }
  tasks[idx].applyCount = (tasks[idx].applyCount || 0) + 1
  await db.push('/tasks', tasks)
  return tasks[idx]
}

// ── Delete task ───────────────────────────────────────────
async function deleteTask(id) {
  const tasks = await db.getData('/tasks')
  const idx = tasks.findIndex(t => t.id === id)
  if (idx === -1) {
    const err = new Error('任务不存在'); err.status = 404; throw err
  }
  tasks.splice(idx, 1)
  await db.push('/tasks', tasks)
  cache.flushAll()
}

// ── Stats for admin ───────────────────────────────────────
async function getTaskStats() {
  const tasks = await db.getData('/tasks')
  return {
    total: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    assigned: tasks.filter(t => t.status === 'assigned').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length,
    totalReward: tasks.reduce((s, t) => s + (t.reward || 0), 0)
  }
}

module.exports = { getTaskList, getTaskDetail, createTask, updateTaskStatus, applyTask, deleteTask, getTaskStats }
