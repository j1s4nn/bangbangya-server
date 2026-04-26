const http = require('http');

console.log('\n=== 测试筛选功能 ===\n');

// 测试各筛选条件
const filters = ['all', 'active', 'large', 'it'];

filters.forEach(filter => {
  http.get(`http://localhost:3000/api/company/list?page=1&size=5&category=${filter}`, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const result = JSON.parse(data);
      console.log(`筛选 ${filter}: 找到 ${result.total} 条，显示 ${result.data.length} 条`);
      if (result.data.length > 0) {
        const item = result.data[0];
        console.log(`  示例: ${item.name} - ${item.industry || '无行业'} - ${item.status}`);
        console.log(`  statusType: ${item.statusType || '无'}`);
      }
    });
  }).on('error', err => {
    console.log(`筛选 ${filter} 失败:`, err.message);
  });
});

setTimeout(() => {
  console.log('\n=== 测试完成 ===\n');
}, 3000);
