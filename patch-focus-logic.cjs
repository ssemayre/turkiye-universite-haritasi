const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update getCampusGroupNames
const oldGroupNames = `  const getCampusGroupNames = useCallback((campus) => {
    return [
      ...(Array.isArray(campus?.facultyNames) ? campus.facultyNames : []),
      ...(Array.isArray(campus?.unitNames) ? campus.unitNames : []),
      ...(Array.isArray(campus?.unitAliases) ? campus.unitAliases : []),
    ]`;
const newGroupNames = `  const getCampusGroupNames = useCallback((campus) => {
    let extraUnits = [];
    if (campus?.academicUnits) {
       extraUnits = campus.academicUnits.map(u => u.name);
    }
    return [
      ...(Array.isArray(campus?.facultyNames) ? campus.facultyNames : []),
      ...(Array.isArray(campus?.unitNames) ? campus.unitNames : []),
      ...(Array.isArray(campus?.unitAliases) ? campus.unitAliases : []),
      ...extraUnits
    ]`;
app = app.replace(oldGroupNames, newGroupNames);

// 2. Update getCampusProgramNames
const oldProgramNames = `  const getCampusProgramNames = useCallback((campus) => {
    return (Array.isArray(campus?.programNames) ? campus.programNames : [])`;
const newProgramNames = `  const getCampusProgramNames = useCallback((campus) => {
    let extraProgs = [];
    if (campus?.academicUnits) {
       campus.academicUnits.forEach(u => {
          if (u.programs) extraProgs.push(...u.programs.map(p => p.name));
       });
    }
    return [
      ...(Array.isArray(campus?.programNames) ? campus.programNames : []),
      ...extraProgs
    ]`;
app = app.replace(oldProgramNames, newProgramNames);

// 3. Update focusSelectedProgramCampus
const oldFocus = `  const focusSelectedProgramCampus = () => {
    setSelectedProgram(null);
    if (window.innerWidth <= 800) {
      setUniversitySheetTop(window.innerHeight - 150);
    }
    const latitude = Number(selectedCampus?.latitude);
    const longitude = Number(selectedCampus?.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return;
    }

    setCampusFocusOnly(true);
    setCampusViewOpen(false);
    setMapFocus({
      latitude,
      longitude,
      zoom: 16,
    });
  };`;

const newFocus = `  const focusSelectedProgramCampus = () => {
    const campusToFocus = selectedCampus;
    setSelectedProgram(null);
    if (window.innerWidth <= 800) {
      setUniversitySheetTop(window.innerHeight - 150);
    }
    const latitude = Number(campusToFocus?.latitude);
    const longitude = Number(campusToFocus?.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return;
    }

    setCampusFocusOnly(true);
    setCampusViewOpen(false);
    
    // YENİ EKLENEN: Kartı aç ve Tüm Yerleşkeler moduna geç
    setShowAllCampuses(true);
    setSelectedSubCampus(campusToFocus);

    setMapFocus({
      latitude,
      longitude,
      zoom: 16,
    });
  };`;
app = app.replace(oldFocus, newFocus);

fs.writeFileSync('src/App.jsx', app);
console.log("App.jsx logic updated successfully.");
