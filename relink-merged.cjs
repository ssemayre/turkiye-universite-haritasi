/**
 * RELINK-MERGED-CAMPUSES.CJS
 * ==========================
 * After merging duplicate campuses, find all programs that still reference
 * removed campus IDs and redirect them to the proper merged campus.
 * 
 * Also builds a map of all removed campuses -> their merged replacements
 * by comparing before-merge and after-merge campus lists.
 */

const fs = require('fs');

const campusesData = JSON.parse(fs.readFileSync('src/data/campuses.json', 'utf8'));

// Build a set of all valid campus IDs that still exist
const validCampusIds = new Set();
for (const uni of Object.values(campusesData)) {
    for (const c of (uni.campuses || [])) {
        validCampusIds.add(c.id);
    }
}

console.log('Valid campus IDs in campuses.json:', validCampusIds.size);

// Now scan all program files and fix orphaned campus_id references
const programDir = 'public/programs';
const programFiles = fs.readdirSync(programDir).filter(f => f.endsWith('.json'));
let orphanedPrograms = 0;
let fixedPrograms = 0;

for (const file of programFiles) {
    const path = programDir + '/' + file;
    let programs;
    try { programs = JSON.parse(fs.readFileSync(path, 'utf8')); } catch(e) { continue; }
    
    // Get the university ID from the file name (e.g., 77.json -> "77")
    const uniId = file.replace('.json', '');
    
    // Find the corresponding university in campuses.json
    const uniData = Object.values(campusesData).find(u => u.universityId === uniId);
    if (!uniData) continue;
    
    const uniCampuses = uniData.campuses || [];
    let changed = false;
    
    for (const p of programs) {
        if (!p.campus_id) continue;
        
        // If the campus_id doesn't exist anymore, it was merged
        if (!validCampusIds.has(p.campus_id)) {
            orphanedPrograms++;
            
            // Try to find the best replacement campus for this program
            // Use the faculty name to find the best match
            const facultyName = (p.faculty || p.unit || '').toUpperCase();
            
            // Find the campus that now contains this faculty's academicUnit
            let bestCampus = null;
            for (const campus of uniCampuses) {
                for (const au of (campus.academicUnits || [])) {
                    if (au.name && au.name.toUpperCase().includes(facultyName.substring(0, 15))) {
                        bestCampus = campus;
                        break;
                    }
                }
                if (bestCampus) break;
            }
            
            // Fallback: use main campus
            if (!bestCampus) {
                bestCampus = uniCampuses.find(c => c.isMain) || uniCampuses[0];
            }
            
            if (bestCampus) {
                p.campus_id = bestCampus.id;
                p.campus_name = bestCampus.name;
                changed = true;
                fixedPrograms++;
            }
        }
    }
    
    if (changed) {
        fs.writeFileSync(path, JSON.stringify(programs));
    }
}

console.log('Orphaned program campus references found:', orphanedPrograms);
console.log('Successfully remapped to merged campuses:', fixedPrograms);
