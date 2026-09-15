const fs = require('fs');
let css = fs.readFileSync('src/App.css', 'utf8');

css += `
/* ================================================== */
/* KYK MARKERS */
/* ================================================== */
.kyk-marker {
  background: none;
  border: none;
}
.kyk-marker-inner {
  width: 36px;
  height: 36px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  border: 2px solid #fff;
}
.kyk-kiz-marker .kyk-marker-inner {
  background: #fdf2f8;
  border-color: #ec4899;
}
.kyk-erkek-marker .kyk-marker-inner {
  background: #eff6ff;
  border-color: #3b82f6;
}
.kyk-tooltip {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}
`;

fs.writeFileSync('src/App.css', css);
