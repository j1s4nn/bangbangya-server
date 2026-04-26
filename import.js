/**
 * 企业数据导入脚本
 * 支持格式：
 * 1. 风鸟 - 前3行元数据，第4行表头
 * 2. 企查查 - 第1行声明，第2行表头
 */

const xlsx = require('xlsx')
const fs = require('fs')
const path = require('path')

const DB_DIR = path.join(__dirname, 'db')
const DB_FILE = path.join(DB_DIR, 'companies.json')
const IMPORTS_DIR = path.join(__dirname, 'imports')
const IMPORTED_DIR = path.join(IMPORTS_DIR, 'imported')
const LOG_FILE = path.join(DB_DIR, 'import-log.json')

// 确保目录存在
;[DB_DIR, IMPORTS_DIR, IMPORTED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

// 字段映射（企查查 → 统一字段）
const FIELD_MAP = {
  '企业名称': 'name',
  '登记状态': 'status',
  '法定代表人': 'legalPerson',
  '注册资本': 'registeredCapital',
  '成立日期': 'establishDate',
  '注册地址': 'address',
  '所属省份': 'province',
  '所属城市': 'city',
  '所属区县': 'district',
  '有效手机号': 'phone',
  '更多电话': 'mobile',
  '邮箱': 'email',
  '企业(机构)类型': 'companyType',
  '企业规模': 'scale',
  '曾用名': 'formerName',
  '官网网址': 'website',
  '通信地址': 'mailAddress',
  '企业简介': 'description',
  '经营范围': 'businessScope'
}

/**
 * 检测Excel格式
 */
function detectFormat(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName]
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 })
  
  if (data.length < 2) {
    throw new Error('数据行数不足')
  }
  
  // 企查查：第1行是声明（长文本），第2行是表头（18个字段）
  const firstRow = data[0][0] || ''
  // 特殊字符处理：声明可能有不可见Unicode字符
  if (firstRow.includes('企查查') && firstRow.length > 100) {
    console.log('✓ 检测到企查查格式')
    return 'qcc'
  }
  
  // 风鸟：前3行是元数据，第4行（index=3）是表头（27个字段）
  if (data.length >= 4 && typeof data[3][0] === 'string' && data[3].length > 15) {
    console.log('✓ 检测到风鸟格式')
    return 'riskbird'
  }
  
  throw new Error('未识别的Excel格式')
}

/**
 * 解析Excel数据
 */
function parseExcel(filePath) {
  console.log(`\n📄 解析文件: ${path.basename(filePath)}`)
  
  const wb = xlsx.readFile(filePath)
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const raw = xlsx.utils.sheet_to_json(ws, { header: 1 })
  
  const format = detectFormat(wb, sheetName)
  
  let headerRowIndex, dataStartIndex
  let fields = []
  
  if (format === 'qcc') {
    headerRowIndex = 1
    dataStartIndex = 2
    fields = raw[headerRowIndex]
  } else {
    headerRowIndex = 3
    dataStartIndex = 4
    fields = raw[headerRowIndex]
  }
  
  console.log(`  表头行: ${headerRowIndex}`)
  console.log(`  数据起始行: ${dataStartIndex}`)
  console.log(`  字段数: ${fields.length}`)
  console.log(`  预计数据行: ${raw.length - dataStartIndex}`)
  
  // 构建字段映射表
  const fieldMap = {}
  fields.forEach((field, idx) => {
    if (FIELD_MAP[field]) {
      fieldMap[FIELD_MAP[field]] = idx
    } else {
      fieldMap[field] = idx
    }
  })
  
  // 解析数据行
  const companies = []
  for (let i = dataStartIndex; i < raw.length; i++) {
    const row = raw[i]
    if (!row || row.length === 0) continue
    
    const company = {}
    
    // 企查查格式：从简介中提取信用代码和行业
    if (format === 'qcc') {
      const descIdx = fieldMap['description']
      if (descIdx !== undefined && row[descIdx]) {
        const desc = row[descIdx]
        // 提取信用代码
        const codeMatch = desc.match(/统一社会信用代码为([A-Z0-9]+)/)
        if (codeMatch) {
          company.id = codeMatch[1]
        }
        // 提取行业信息
        const industryMatch = desc.match(/所属行业为(.+?)，/)
        if (industryMatch) {
          company.industry = industryMatch[1]
        }
      }
    }

    // 映射所有字段
    Object.keys(fieldMap).forEach(key => {
      const idx = fieldMap[key]
      company[key] = row[idx] || ''
    })

    // 字段名标准化：ensure compatibility with frontend and filter logic
    // 前端期望的字段名与模拟数据一致
    if (company.establishDate && !company.establishedDate) {
      company.establishedDate = company.establishDate
    }

    // 设置状态类型（用于筛选）
    if (company.status) {
      if (company.status === '存续' || company.status === '在业') {
        company.statusType = 'active'
      } else {
        company.statusType = 'cancelled'
      }
    }

    // 处理公司ID（去重唯一键）
    if (!company.id) {
      // 企查查没有独立信用代码列，从简介提取或用MD5(name)
      if (company.name) {
        const crypto = require('crypto')
        company.id = crypto.createHash('md5').update(company.name).digest('hex')
      }
    }

    if (company.name) {
      companies.push(company)
    }
  }

  console.log(`  解析出 ${companies.length} 条企业数据`)
  return { companies, format, filename: path.basename(filePath) }
}

/**
 * 加载现有数据库
 */
function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8')
      return JSON.parse(content)
    } catch (e) {
      console.error('读取数据库失败，将重建:', e.message)
      return {}
    }
  }
  return {}
}

/**
 * 保存数据库
 */
function saveDatabase(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8')
}

/**
 * 记录导入日志
 */
function logImport(stats) {
  const logs = fs.existsSync(LOG_FILE) ? JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')) : []
  logs.unshift({
    timestamp: new Date().toISOString(),
    ...stats
  })
  // 保留最近30条
  if (logs.length > 30) logs.length = 30
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2))
}

/**
 * 执行导入
 */
async function importFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`)
  }
  
  // 解析Excel
  const { companies, format, filename } = parseExcel(filePath)
  
  // 加载现有数据库
  const db = loadDatabase()
  
  // 去重导入（以id为唯一键）
  let newCount = 0
  let updateCount = 0
  
  companies.forEach(company => {
    const id = company.id
    if (!id) return
    
    if (db[id]) {
      // 更新现有记录
      db[id] = { ...db[id], ...company, updatedAt: new Date().toISOString() }
      updateCount++
    } else {
      // 新增记录
      db[id] = {
        ...company,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      newCount++
    }
  })
  
  // 保存数据库
  saveDatabase(db)
  
  // 统计
  const stats = {
    format,
    filename,
    totalProcessed: companies.length,
    newCount,
    updateCount,
    totalInDb: Object.keys(db).length
  }
  
  // 记录日志
  logImport(stats)
  
  // 归档Excel
  const archivePath = path.join(IMPORTED_DIR, `${Date.now()}_${filename}`)
  fs.copyFileSync(filePath, archivePath)
  fs.unlinkSync(filePath)
  console.log(`  📁 已归档到: ${path.basename(archivePath)}`)
  
  console.log('\n📊 导入统计:')
  console.log(`  - 格式: ${format}`)
  console.log(`  - 处理: ${stats.totalProcessed} 条`)
  console.log(`  - 新增: ${newCount} 条`)
  console.log(`  - 更新: ${updateCount} 条`)
  console.log(`  - 库存总数: ${stats.totalInDb} 条`)
  console.log(`  - 企业总数: ${Object.keys(db).length} 条`)
  
  return stats
}

/**
 * 批量扫描导入
 */
async function importAll() {
  const files = fs.readdirSync(IMPORTS_DIR)
    .filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
  
  if (files.length === 0) {
    console.log('📭 imports/ 目录为空，没有待导入文件')
    return
  }
  
  console.log(`📂 发现 ${files.length} 个Excel文件，开始导入...\n`)
  
  for (const file of files) {
    try {
      await importFile(path.join(IMPORTS_DIR, file))
    } catch (e) {
      console.error(`❌ 导入失败: ${file}`, e.message)
    }
  }
}

// 主入口
;(async () => {
  try {
    const args = process.argv.slice(2)
    
    if (args.length === 0) {
      await importAll()
    } else {
      const filePath = args[0]
      await importFile(filePath)
    }
    
    console.log('\n✅ 全部导入完成！')
    
    // 通知后端刷新缓存
    try {
      const http = require('http')
      await new Promise((resolve) => {
        const req = http.request({ hostname: 'localhost', port: 3000, path: '/api/company/reload-cache', method: 'POST' }, res => {
          console.log('🔄 已通知后端刷新缓存')
          resolve()
        })
        req.on('error', () => resolve())
        req.end()
      })
    } catch {}
    
  } catch (error) {
    console.error('\n❌ 导入失败:', error.message)
    process.exit(1)
  }
})()
