export const SCHOOL_INFO = {
  name: "S.D.M. Academy Shaulana",
  shortName: "SDM Academy",
  motto: "तमसो मा ज्योतिर्गमय",
  mottoEnglish: "Lead me from darkness to light",
  address: "Shaulana, Dhaulana, Hapur, Uttar Pradesh",
  phone: "+91-XXXXXXXXXX",
  whatsapp: "+91-XXXXXXXXXX",
  email: "info@sdmacademy.in",
  established: "2006",
  affiliation: "UP Board",
  classes: "Play to Class 8",
  principal: "Ms. Mansi Sharma",
};

export const CLASSES = [
  { id: "play", name: "Play", order: 1 },
  { id: "nursery", name: "Nursery", order: 2 },
  { id: "kg", name: "KG", order: 3 },
  { id: "class1", name: "Class 1", order: 4 },
  { id: "class2", name: "Class 2", order: 5 },
  { id: "class3", name: "Class 3", order: 6 },
  { id: "class4", name: "Class 4", order: 7 },
  { id: "class5", name: "Class 5", order: 8 },
  { id: "class6", name: "Class 6", order: 9 },
  { id: "class7", name: "Class 7", order: 10 },
  { id: "class8", name: "Class 8", order: 11 },
];

export const SUBJECTS_BY_CLASS: Record<string, string[]> = {
  "Play": ["English", "Hindi", "Mathematics", "Drawing", "Activity"],
  "Nursery": ["English", "Hindi", "Mathematics", "Drawing", "Activity"],
  "KG": ["English", "Hindi", "Mathematics", "Drawing", "Activity", "EVS"],
  "Class 1": ["English", "Hindi", "Mathematics", "EVS", "Drawing", "Computer"],
  "Class 2": ["English", "Hindi", "Mathematics", "EVS", "Drawing", "Computer"],
  "Class 3": ["English", "Hindi", "Mathematics", "EVS", "Drawing", "Computer"],
  "Class 4": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Drawing", "Computer"],
  "Class 5": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Drawing", "Computer"],
  "Class 6": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer", "Drawing"],
  "Class 7": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer", "Drawing"],
  "Class 8": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer", "Drawing"],
};

export const EXAM_TYPES = ["Unit Test 1", "Unit Test 2", "Half Yearly", "Annual"];

export const FEE_TYPES = ["Tuition Fee", "Admission Fee", "Exam Fee", "Computer Fee", "Sports Fee", "Late Fine"];

export const ROLES = {
  PRINCIPAL: "PRINCIPAL",
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  HALF_DAY: "HALF_DAY",
} as const;

export const LOCK_HOUR = 10; // Attendance locks after 10 AM
