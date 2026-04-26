const xlsx = require('xlsx')

const filePath = 'C:/Users/Administrator/Downloads/company_search_WEB202603201941178711527.xlsx'
const wb = xlsx.readFile(filePath)
const ws = wb.Sheets[wb.SheetNames[0]]
const raw = xlsx.utils.sheet_to_json(ws, { header: 1 })

// 找到真正的表头行（第4行，index=3）
const headerRow = raw[3]
console.log('表头字段数:', headerRow.length)
console.log('表头:', JSON.stringify(headerRow))
console.log('总行数:', raw.length)
console.log('数据行数:', raw.length - 4)

// 看前3条数据
for (let i = 4; i < Math.min(7, raw.length); i++) {
  const row = {}
  headerRow.forEach((h, idx) => { if (h) row[h] = raw[i][idx] })
  console.log(`\n第${i-3}条数据:`, JSON.stringify(row, null, 2))
}
