const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

const stateBlock = `
  const [showKyk, setShowKyk] = useState(false);
  const [kykGenderFilter, setKykGenderFilter] = useState("Tümü");
  const [selectedKyk, setSelectedKyk] = useState(null);
`;

app = app.replace(
  /const \[selectedUniversity, setSelectedUniversity\] = useState\(null\);/,
  '$&\n' + stateBlock
);

fs.writeFileSync('src/App.jsx', app);
