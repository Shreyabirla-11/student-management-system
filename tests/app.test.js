
const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  validateStudent,
  addStudent,
  editStudent,
  searchStudents,
  sortStudents,
  deleteStudent,
  getCourseSummaries,
  getStatistics,
} = require("../src/app.js");

test("valid student details should be accepted", () => {
  const student = {
    name: "Aarav Sharma",
    roll: "101",
    course: "Information Technology",
  };

  assert.equal(validateStudent(student), "");
});

test("whitespace-only required fields are rejected", () => {
  assert.match(validateStudent({
    name: " ",
    roll: "101",
    course: "Information Technology",
  }), /name/i);
  assert.match(validateStudent({
    name: "Aarav Sharma",
    roll: " ",
    course: "Information Technology",
  }), /roll number/i);
  assert.match(validateStudent({
    name: "Aarav Sharma",
    roll: "101",
    course: " ",
  }), /course/i);
});

test("missing or invalid student input is handled", () => {
  assert.match(validateStudent(null), /name, roll number, and course/i);
  assert.match(validateStudent({
    name: 42,
    roll: "101",
    course: "IT",
  }), /name/i);
});

test("student name is required", () => {
  const student = {
    name: "",
    roll: "101",
    course: "Information Technology",
  };

  assert.match(validateStudent(student), /name/i);
});

test("roll number is required", () => {
  const student = {
    name: "Aarav Sharma",
    roll: "",
    course: "Information Technology",
  };

  assert.match(validateStudent(student), /roll number/i);
});

test("course is required", () => {
  const student = {
    name: "Aarav Sharma",
    roll: "101",
    course: "",
  };

  assert.match(validateStudent(student), /course/i);
});

test("a valid student should be added", () => {
  const result = addStudent([], {
    name: "Aarav Sharma",
    roll: "101",
    course: "IT",
  });

  assert.equal(result.students.length, 1);
  assert.equal(result.students[0].name, "Aarav Sharma");
  assert.equal(result.error, "");
});

test("student fields are trimmed when added", () => {
  const result = addStudent([], {
    name: "  Aarav Sharma ",
    roll: " 101 ",
    course: " IT  ",
  });

  assert.deepEqual(result.students[0], {
    name: "Aarav Sharma",
    roll: "101",
    course: "IT",
  });
});

test("duplicate roll numbers should be rejected", () => {
  const existing = [
    { name: "Aarav Sharma", roll: "101", course: "IT" },
  ];

  const result = addStudent(existing, {
    name: "Riya Patel",
    roll: "101",
    course: "Computer Engineering",
  });

  assert.equal(result.students.length, 1);
  assert.match(result.error, /already exists/i);
});

test("duplicate roll number comparison ignores letter case and whitespace", () => {
  const result = addStudent(
    [{ name: "Aarav", roll: "Ab-101", course: "IT" }],
    { name: "Riya", roll: " ab-101 ", course: "CS" }
  );

  assert.match(result.error, /already exists/i);
  assert.equal(result.students.length, 1);
});

test("editing a student updates the matching record without creating a duplicate", () => {
  const existing = [
    { name: "Aarav", roll: "Ab-101", course: "IT" },
    { name: "Riya", roll: "102", course: "CS" },
  ];
  const result = editStudent(existing, "Ab-101", {
    name: "Aarav Sharma",
    roll: "AB-101",
    course: "Data Science",
  });

  assert.equal(result.error, "");
  assert.equal(result.students.length, 2);
  assert.deepEqual(result.students[0], {
    name: "Aarav Sharma",
    roll: "AB-101",
    course: "Data Science",
  });
});

test("editing a student cannot take another student's roll number", () => {
  const existing = [
    { name: "Aarav", roll: "101", course: "IT" },
    { name: "Riya", roll: "102", course: "CS" },
  ];
  const result = editStudent(existing, "101", {
    name: "Aarav",
    roll: "102",
    course: "IT",
  });

  assert.match(result.error, /already exists/i);
  assert.deepEqual(result.students, existing);
});

test("students should be searchable by name or roll number", () => {
  const students = [
    { name: "Aarav Sharma", roll: "101", course: "IT" },
    { name: "Riya Patel", roll: "102", course: "Computer Engineering" },
  ];

  assert.equal(searchStudents(students, "aarav").length, 1);
  assert.equal(searchStudents(students, "102")[0].name, "Riya Patel");
});

test("search is case-insensitive and ignores surrounding whitespace", () => {
  const students = [
    { name: "Aarav Sharma", roll: "Ab-101", course: "IT" },
  ];

  assert.equal(searchStudents(students, "  AARAV ").length, 1);
  assert.equal(searchStudents(students, " ab-101")[0].name, "Aarav Sharma");
});

test("an empty search returns every student", () => {
  const students = [
    { name: "Aarav", roll: "101", course: "IT" },
    { name: "Riya", roll: "102", course: "CS" },
  ];

  assert.deepEqual(searchStudents(students, "  "), students);
});

test("course filtering can be combined with search", () => {
  const students = [
    { name: "Aarav", roll: "101", course: "IT" },
    { name: "Riya", roll: "102", course: "CS" },
    { name: "Aarav Patel", roll: "103", course: "CS" },
  ];

  assert.deepEqual(
    searchStudents(students, "aarav", "CS").map((student) => student.roll),
    ["103"]
  );
});

test("students can be sorted by name, roll, and course in either direction", () => {
  const students = [
    { name: "Riya", roll: "10", course: "Zoology" },
    { name: "Aarav", roll: "2", course: "Biology" },
  ];

  assert.deepEqual(sortStudents(students, "name-asc").map((item) => item.name), [
    "Aarav",
    "Riya",
  ]);
  assert.deepEqual(sortStudents(students, "roll-asc").map((item) => item.roll), [
    "2",
    "10",
  ]);
  assert.deepEqual(sortStudents(students, "course-desc").map((item) => item.course), [
    "Zoology",
    "Biology",
  ]);
});

test("course summaries are derived from records without case-sensitive duplicates", () => {
  const summaries = getCourseSummaries([
    { name: "Aarav", roll: "1", course: "Computer Science" },
    { name: "Riya", roll: "2", course: "computer science" },
    { name: "Sam", roll: "3", course: "Design" },
  ]);

  assert.deepEqual(summaries, [
    { name: "Computer Science", count: 2 },
    { name: "Design", count: 1 },
  ]);
});

test("statistics count only recent records with valid timestamps", () => {
  const now = Date.parse("2026-10-23T12:00:00Z");
  const students = [
    { name: "Aarav", roll: "1", course: "IT", createdAt: "2026-10-22T12:00:00Z" },
    { name: "Riya", roll: "2", course: "CS", createdAt: "2026-10-01T12:00:00Z" },
    { name: "Sam", roll: "3", course: "IT" },
  ];

  assert.deepEqual(getStatistics(students, now), {
    totalStudents: 3,
    totalCourses: 2,
    recentlyAdded: 1,
    uniqueCourses: 2,
    averageClassSize: 2,
  });
});

test("a student should be deleted by roll number", () => {
  const students = [
    { name: "Aarav Sharma", roll: "101", course: "IT" },
    { name: "Riya Patel", roll: "102", course: "Computer Engineering" },
  ];

  const result = deleteStudent(students, "101");

  assert.equal(result.length, 1);
  assert.equal(result[0].roll, "102");
});

test("deleting an unknown roll number leaves records unchanged", () => {
  const students = [
    { name: "Aarav", roll: "101", course: "IT" },
  ];

  assert.deepEqual(deleteStudent(students, "999"), students);
});
