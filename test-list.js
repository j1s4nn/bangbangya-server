const http = require('http');

http.get('http://localhost:3000/api/company/list?page=1&size=5&category=all', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('API响应:', data);
  });
}).on('error', (e) => {
  console.error('请求失败:', e.message);
});
