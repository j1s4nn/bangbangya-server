const xlsx = require('xlsx');
const path = require('path');

const files = ['d:\\bby\\server\\imports\\imported\\1774008262303_test.xlsx'];

files.forEach(file => {
  console.log('\n文件:', file);
  const wb = xlsx.readFile(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

  console.log('总行数:', data.length);

  // 前5行内容
  for (let i = 0; i < Math.min(5, data.length); i++) {
    console.log(`\n第${i}行:`);
    const row = data[i];
    console.log('  列数:', row.length);
    console.log('  第0列:', row[0]);
    if (row[0]) {
      console.log('  第0列类型:', typeof row[0]);
      console.log('  第0列长度:', row[0].length);
      console.log('  包含企查查:', row[0].includes('企查查'));
      console.log('  包含声明:', row[0].includes('声明'));
    }
  }

  // 第3行
  if (data.length >= 4) {
    console.log('\n第3行详情:', JSON.stringify(data[3], null, 2));
  }
});
