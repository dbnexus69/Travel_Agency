const fs = require('fs');
let c = fs.readFileSync('VoucherPDF.css', 'utf-8');
c = c.replace(/font-size:\s*([\d.]+)px;/g, (m, p1) => `font-size: ${parseFloat(p1) + 2}px;`);
fs.writeFileSync('VoucherPDF.css', c, 'utf-8');
