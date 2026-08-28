const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove duplicate schoolCalendar attribute
code = code.replace(
  '         user={userProfile}\n         currentUser={currentUser}\n                      schoolCalendar={schoolCalendar}\n         sections={sections}',
  '         user={userProfile}\n         currentUser={currentUser}\n         sections={sections}'
);

// 2. Add onViewBlankReport to SummarySheetView type definition
code = code.replace(
  "  onToggleStudentStatus?: (studentId: string, status: 'Active' | 'Transferred Out' | 'Dropped Out' | 'Retained' | 'Promoted') => void,\n  onViewReport?: (s: Student) => void",
  "  onToggleStudentStatus?: (studentId: string, status: 'Active' | 'Transferred Out' | 'Dropped Out' | 'Retained' | 'Promoted') => void,\n  onViewReport?: (s: Student) => void,\n  onViewBlankReport?: (s: Student) => void"
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('App.tsx updated successfully');
