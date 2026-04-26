const http = require('http');

console.log('\n=== 测试数据库中的企查查数据 ===\n');

// 测试搜索歌舞
testSearch('歌舞');

// 测试搜索文旅
testSearch('文旅');

// 测试搜索传媒
testSearch('传媒');

function testSearch(keyword) {
  http.get(`http://localhost:3000/api/company/search?keyword=${encodeURIComponent(keyword)}`, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const result = JSON.parse(data);
      console.log(`✅ 搜索"${keyword}": 找到 ${result.data.length} 条结果`);
      if (result.data.length > 0) {
        console.log(`   示例: ${result.data[0].name} - ${result.data[0].legalPerson}`);
      }
    });
  }).on('error', err => {
    console.log(`❌ 搜索"${keyword}"失败:`, err.message);
  });
}

setTimeout(() => {
  console.log('\n=== 测试完成 ===\n');
}, 2000);
