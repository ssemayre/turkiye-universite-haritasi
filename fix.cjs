const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(/className=\{"shrink-0 \\\$\{post\.is_anonymous \? 'cursor-default' : 'cursor-pointer'\}"\}/g, 'className={shrink-0 }');
code = code.replace(/className=\{"text-sm font-bold text-slate-900 \\\$\{post\.is_anonymous \? 'cursor-default' : 'cursor-pointer'\}"\}/g, 'className={	ext-sm font-bold text-slate-900 }');
code = code.replace(/<span className="bg-slate-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">.*?<\/span>/, '<span className="bg-slate-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">??</span>');
code = code.replace(/<span className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-base font-bold">.*?<\/span>/, '<span className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-base font-bold">??</span>');
code = code.replace(/<span className="text-base">.*?<\/span>/, '<span className="text-base">??</span>');

fs.writeFileSync('src/App.jsx', code);
