const fs = require('fs');
const path = require('path');

const dlDir = 'C:\\Users\\Administrator\\Downloads';
const targetDir = 'd:\\bby\\server\\imports';

console.log('扫描Downloads目录...');
const files = fs.readdirSync(dlDir);
const xlsxFiles = files.filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

console.log('Excel文件列表:');
xlsxFiles.forEach(f => {
  console.log('  -', f);
});

// 查找企查查文件
const targetFile = xlsxFiles.find(f => f.includes('企查查') && f.includes('歌舞'));

if (!targetFile) {
  console.log('\n未找到企查查文件');
  process.exit(0);
}

const srcPath = path.join(dlDir, targetFile);
const destPath = path.join(targetDir, 'test.xlsx');

console.log('\n复制文件:');
console.log('  源:', srcPath);
console.log('  目标:', destPath);

fs.copyFileSync(srcPath, destPath);
console.log('复制完成！');
