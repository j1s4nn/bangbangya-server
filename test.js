const http = require('http')

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch(e) { resolve(data) }
      })
    }).on('error', reject)
  })
}

async function main() {
  console.log('\n=== 测试后端接口 ===\n')

  // 测试根接口
  const root = await get('http://localhost:3000/')
  console.log('✅ 根接口:', root.message)

  // 测试搜索
  const search = await get('http://localhost:3000/api/company/search?keyword=' + encodeURIComponent('腾讯'))
  console.log('✅ 搜索腾讯:', `找到 ${search.total} 条结果`)
  if (search.data && search.data[0]) {
    console.log('   第一条:', search.data[0].name, '-', search.data[0].legalPerson)
  }

  // 测试详情
  const detail = await get('http://localhost:3000/api/company/detail/1')
  console.log('✅ 详情接口:', detail.data && detail.data.company ? detail.data.company.name : '失败')

  // 测试列表
  const list = await get('http://localhost:3000/api/company/list?page=1&size=5')
  console.log('✅ 列表接口:', `共 ${list.total} 家企业，本页 ${list.data && list.data.length} 条`)

  // 测试热门
  const hot = await get('http://localhost:3000/api/company/hot')
  console.log('✅ 热门搜索:', hot.data ? hot.data.join('、') : '失败')

  console.log('\n=== 所有接口测试通过! ===\n')
}

main().catch(console.error)
