/**
 * Wallet Service
 * Manages user wallet: points balance, transactions, recharge, withdraw.
 * Persists to db/wallets.json
 */

const { JsonDB, Config } = require('node-json-db')
const path = require('path')

const db = new JsonDB(new Config(path.join(__dirname, '../db/wallets'), true, true, '/'))

// Seed a demo wallet if empty
const SEED_WALLET = {
  'demo_user': {
    userId: 'demo_user',
    points: 320,
    totalEarned: 842,
    totalWithdrawn: 300,
    memberLevel: 1,
    transactions: [
      { id: 'tx001', type: 'recharge',   amount: +100, desc: '充值100积分',      createdAt: Date.now() - 86400000 * 10 },
      { id: 'tx002', type: 'earn',       amount: +50,  desc: '完成任务获得积分',  createdAt: Date.now() - 86400000 * 7 },
      { id: 'tx003', type: 'publish',    amount: -30,  desc: '发布任务扣除积分',  createdAt: Date.now() - 86400000 * 5 },
      { id: 'tx004', type: 'withdraw',   amount: -300, desc: '积分提现',          createdAt: Date.now() - 86400000 * 3 },
      { id: 'tx005', type: 'bonus',      amount: +200, desc: '会员赠送积分',      createdAt: Date.now() - 86400000 * 1 }
    ]
  }
}

async function ensureSeed() {
  try {
    await db.getData('/wallets')
  } catch (e) {
    await db.push('/wallets', SEED_WALLET)
  }
}
ensureSeed()

function success(data, extra = {}) {
  return { code: 200, message: 'success', data, ...extra }
}

async function getWalletData(userId = 'demo_user') {
  const wallets = await db.getData('/wallets')
  if (!wallets[userId]) {
    wallets[userId] = {
      userId,
      points: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      memberLevel: 1,
      transactions: []
    }
    await db.push('/wallets', wallets)
  }
  return wallets[userId]
}

async function recharge(userId = 'demo_user', { amount, bonusPoints = 0, payMethod = 'wechat' } = {}) {
  if (!amount || amount <= 0) {
    const err = new Error('充值金额必须大于0'); err.status = 400; throw err
  }
  const wallets = await db.getData('/wallets')
  if (!wallets[userId]) wallets[userId] = { userId, points: 0, totalEarned: 0, totalWithdrawn: 0, memberLevel: 1, transactions: [] }

  const basePoints = Math.floor(amount)   // 1元 = 1积分
  const total = basePoints + bonusPoints

  wallets[userId].points += total
  wallets[userId].totalEarned += total
  wallets[userId].transactions.unshift({
    id: `tx_${Date.now()}`,
    type: 'recharge',
    amount: +total,
    desc: `充值 ${amount} 元，获得 ${basePoints} 积分${bonusPoints > 0 ? `（含赠送 ${bonusPoints} 积分）` : ''}`,
    payMethod,
    createdAt: Date.now()
  })
  await db.push('/wallets', wallets)
  return wallets[userId]
}

async function withdraw(userId = 'demo_user', { amount, receiveMethod = 'wechat', feeRate = 0.05 } = {}) {
  if (!amount || amount <= 0) {
    const err = new Error('提现金额必须大于0'); err.status = 400; throw err
  }
  const wallets = await db.getData('/wallets')
  const wallet = wallets[userId]
  if (!wallet) { const err = new Error('用户钱包不存在'); err.status = 404; throw err }
  if (wallet.points < amount) {
    const err = new Error('积分余额不足'); err.status = 400; throw err
  }
  const fee = Math.round(amount * feeRate)
  const actual = amount - fee

  wallet.points -= amount
  wallet.totalWithdrawn += actual
  wallet.transactions.unshift({
    id: `tx_${Date.now()}`,
    type: 'withdraw',
    amount: -amount,
    fee,
    actual,
    desc: `提现 ${amount} 积分，手续费 ${fee}，实际到账 ${actual}`,
    receiveMethod,
    status: 'pending',
    createdAt: Date.now()
  })
  await db.push('/wallets', wallets)
  return wallet
}

async function getTransactions(userId = 'demo_user', { page = 1, size = 20, type = '' } = {}) {
  const wallet = await getWalletData(userId)
  let txs = wallet.transactions || []
  if (type && type !== 'all') txs = txs.filter(t => t.type === type)
  const total = txs.length
  const start = (page - 1) * size
  return { transactions: txs.slice(start, start + size), total, points: wallet.points }
}

// Admin stats
async function getAllWalletStats() {
  const wallets = await db.getData('/wallets')
  const users = Object.values(wallets)
  return {
    totalUsers: users.length,
    totalPoints: users.reduce((s, u) => s + (u.points || 0), 0),
    totalRechargeEver: users.reduce((s, u) => s + (u.totalEarned || 0), 0),
    totalWithdrawnEver: users.reduce((s, u) => s + (u.totalWithdrawn || 0), 0)
  }
}

module.exports = { getWalletData, recharge, withdraw, getTransactions, getAllWalletStats }
