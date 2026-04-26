const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// 列出Downloads目录
const dlDir = 'C:\\Users\\Administrator\\Downloads';
console.log('Downloads目录文件:');
const files = fs.readdirSync(dlDir);
files.filter(f => f.endsWith('.xlsx')).forEach(f => console.log('  -', f));

// 找到正确的文件
const targetFile = files.find(f => f.includes('企查查') && f.includes('歌舞'));
if (!targetFile) {
  console.log('\n未找到目标文件');
  process.exit(1);
}

const filePath = path.join(dlDir, targetFile);
console.log('\n读取文件:', filePath);

const wb = xlsx.readFile(filePath);
console.log('SheetNames:', wb.SheetNames);

const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

console.log('\n总行数:', data.length);
console.log('\n前10行数据:');
for (let i = 0; i < Math.min(10, data.length); i++) {
  console.log(`第${i}行:`, JSON.stringify(data[i]));
}
