export interface GradeLevel {
  id: string;
  label: string;
  description: string;
  group: 'school' | 'exam';
}

export const GRADE_LEVELS: GradeLevel[] = [
  { id: 'none',   label: 'No Limit',  description: 'No vocabulary restriction',            group: 'school' },
  { id: 'grade1', label: 'Grade 1',   description: 'Junior school — grade 1 (~150 words)',  group: 'school' },
  { id: 'grade2', label: 'Grade 2',   description: 'Junior school — grade 2 (~300 words)',  group: 'school' },
  { id: 'grade3', label: 'Grade 3',   description: 'Junior school — grade 3 (~500 words)',  group: 'school' },
  { id: 'grade4', label: 'Grade 4',   description: 'Junior school — grade 4 (~700 words)',  group: 'school' },
  { id: 'grade5', label: 'Grade 5',   description: 'Junior school — grade 5 (~900 words)',  group: 'school' },
  { id: 'grade6', label: 'Grade 6',   description: 'Junior school — grade 6 (~1100 words)', group: 'school' },
  { id: 'grade7', label: 'Grade 7',   description: 'Junior school — grade 7 (~1400 words)', group: 'school' },
  { id: 'grade8', label: 'Grade 8',   description: 'Junior school — grade 8 (~1700 words)', group: 'school' },
  { id: 'grade9', label: 'Grade 9',   description: 'Junior school — grade 9 (~2000 words)', group: 'school' },
  { id: 'ket',    label: 'KET (A2)',  description: 'Cambridge Key English Test',             group: 'exam'   },
  { id: 'pet',    label: 'PET (B1)',  description: 'Cambridge Preliminary English Test',     group: 'exam'   },
  { id: 'gre',    label: 'GRE',       description: 'Graduate Record Examination',            group: 'exam'   },
];

/** All grade IDs that have an associated word list (excludes 'none'). */
export const EDITABLE_GRADE_IDS = new Set(
  GRADE_LEVELS.filter(g => g.id !== 'none').map(g => g.id)
);

/** Returns the grade metadata or undefined when the id is unknown. */
export function findGradeLevel(id: string): GradeLevel | undefined {
  return GRADE_LEVELS.find(g => g.id === id);
}
