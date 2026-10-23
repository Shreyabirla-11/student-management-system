function validateStudent(student, students = [], editingRoll = "") {
  if (!student || typeof student !== "object") {
    return "Enter the student's name, roll number, and course.";
  }

  if (typeof student.name !== "string" || !student.name.trim()) {
    return "Please enter the student's name.";
  }

  if (typeof student.roll !== "string" || !student.roll.trim()) {
    return "Please enter the roll number.";
  }

  if (typeof student.course !== "string" || !student.course.trim()) {
    return "Please enter the course.";
  }

  const normalizedRoll = student.roll.trim().toLowerCase();
  const duplicate = students.some((item) =>
    item.roll.trim().toLowerCase() === normalizedRoll &&
    item.roll.trim().toLowerCase() !== editingRoll.trim().toLowerCase()
  );

  return duplicate
    ? "A student with this roll number already exists."
    : "";
}

function addStudent(students, student) {
  const error = validateStudent(student, students);

  if (error) {
    return { students, error };
  }

  return {
    students: [...students, {
      name: student.name.trim(),
      roll: student.roll.trim(),
      course: student.course.trim(),
    }],
    error: "",
  };
}

function editStudent(students, originalRoll, student) {
  const error = validateStudent(student, students, originalRoll);

  if (error) {
    return { students, error };
  }

  const normalizedOriginal = originalRoll.trim().toLowerCase();
  const existingStudent = students.find((item) =>
    item.roll.trim().toLowerCase() === normalizedOriginal
  );

  if (!existingStudent) {
    return { students, error: "The student record could not be found." };
  }

  const updatedStudents = students.map((item) =>
    item.roll.trim().toLowerCase() === normalizedOriginal
      ? {
        ...item,
        name: student.name.trim(),
        roll: student.roll.trim(),
        course: student.course.trim(),
      }
      : item
  );

  return {
    students: updatedStudents,
    error: "",
  };
}

function searchStudents(students, query, course = "") {
  const term = String(query).trim().toLowerCase();
  const selectedCourse = String(course).trim().toLowerCase();

  return students.filter((student) =>
    (!term ||
      student.name.toLowerCase().includes(term) ||
      student.roll.toLowerCase().includes(term)) &&
    (!selectedCourse || student.course.toLowerCase() === selectedCourse)
  );
}

function sortStudents(students, sortBy = "name-asc") {
  const [field, direction] = sortBy.split("-");
  const key = ["name", "roll", "course"].includes(field) ? field : "name";
  const multiplier = direction === "desc" ? -1 : 1;

  return [...students].sort((first, second) =>
    first[key].localeCompare(second[key], undefined, {
      numeric: true,
      sensitivity: "base",
    }) * multiplier
  );
}

function deleteStudent(students, roll) {
  return students.filter((student) => student.roll !== roll);
}

function getCourseSummaries(students) {
  const counts = new Map();

  students.forEach((student) => {
    const normalizedCourse = student.course.trim().toLocaleLowerCase();
    const current = counts.get(normalizedCourse);

    if (current) {
      current.count += 1;
    } else {
      counts.set(normalizedCourse, { name: student.course.trim(), count: 1 });
    }
  });

  return [...counts.values()].sort((first, second) =>
    first.name.localeCompare(second.name, undefined, { sensitivity: "base" })
  );
}

function getStatistics(students, now = Date.now()) {
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentlyAdded = students.filter((student) => {
    const createdAt = Date.parse(student.createdAt);

    return Number.isFinite(createdAt) && createdAt >= weekAgo && createdAt <= now;
  }).length;

  return {
    totalStudents: students.length,
    totalCourses: getCourseSummaries(students).length,
    recentlyAdded,
    uniqueCourses: getCourseSummaries(students).length,
    averageClassSize: students.length
      ? Math.round(students.length / getCourseSummaries(students).length)
      : 0,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    validateStudent,
    addStudent,
    editStudent,
    searchStudents,
    sortStudents,
    deleteStudent,
    getCourseSummaries,
    getStatistics,
  };
}

if (typeof document !== "undefined") {
  const element = (id) => document.getElementById(id);
  const studentDialog = element("student-dialog");
  const studentForm = element("student-form");
  const nameInput = element("student-name");
  const rollInput = element("roll-number");
  const courseInput = element("course");
  const formMessage = element("form-message");
  const studentList = element("student-list");
  const toastRegion = element("toast-region");
  let students = [];
  let editingRoll = "";
  let toastTimer;

  try {
    const savedRecords = localStorage.getItem("students");

    if (savedRecords) {
      const parsedRecords = JSON.parse(savedRecords);

      if (
        !Array.isArray(parsedRecords) ||
        parsedRecords.some((student) => validateStudent(student))
      ) {
        throw new Error("Saved student records have an invalid format.");
      }

      students = parsedRecords.map((student) => ({
        name: student.name.trim(),
        roll: student.roll.trim(),
        course: student.course.trim(),
        ...(typeof student.createdAt === "string"
          ? { createdAt: student.createdAt }
          : {}),
      }));
    }
  } catch (error) {
    showToast(`Saved records could not be loaded: ${error.message}`, "error");
  }

  function saveStudents(nextStudents) {
    try {
      localStorage.setItem("students", JSON.stringify(nextStudents));
      return true;
    } catch (error) {
      showToast(`Student records could not be saved: ${error.message}`, "error");
      return false;
    }
  }

  function showToast(message, state = "success") {
    if (!toastRegion) {
      return;
    }

    window.clearTimeout(toastTimer);
    toastRegion.replaceChildren();
    const toast = document.createElement("div");
    const icon = document.createElement("span");
    const text = document.createElement("span");

    toast.className = `toast toast-${state}`;
    toast.setAttribute("role", state === "error" ? "alert" : "status");
    icon.className = "toast-mark";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = state === "error" ? "!" : "✓";
    text.textContent = message;
    toast.append(icon, text);
    toastRegion.appendChild(toast);
    toastTimer = window.setTimeout(() => toast.remove(), 3800);
  }

  function currentFilteredStudents() {
    return sortStudents(
      searchStudents(
        students,
        element("student-search").value,
        element("course-filter").value
      ),
      element("student-sort").value
    );
  }

  function makeAvatar(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase()).join("");
  }

  function renderTable() {
    const visibleStudents = currentFilteredStudents();
    studentList.replaceChildren();
    element("directory-count").textContent =
      `${visibleStudents.length}${visibleStudents.length === 1 ? " student" : " students"}`;
    element("sidebar-student-count").textContent = String(students.length);
    const emptyState = element("directory-empty");
    emptyState.hidden = visibleStudents.length > 0;

    if (!visibleStudents.length) {
      const isFiltered = Boolean(
        element("student-search").value || element("course-filter").value
      );
      element("directory-empty-title").textContent = isFiltered
        ? "No matching students"
        : "No students yet";
      element("directory-empty-copy").textContent = isFiltered
        ? "Try changing your search or course filter."
        : "Add a student to see them in your directory.";
      emptyState.querySelector('[data-action="add"]').hidden = isFiltered;
      return;
    }

    visibleStudents.forEach((student) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const identity = document.createElement("div");
      const avatar = document.createElement("span");
      const identityCopy = document.createElement("span");
      const studentName = document.createElement("strong");
      const subtitle = document.createElement("small");

      identity.className = "student-identity";
      avatar.className = "student-avatar";
      avatar.textContent = makeAvatar(student.name);
      identityCopy.className = "student-identity-copy";
      studentName.textContent = student.name;
      subtitle.textContent = "Student";
      identityCopy.append(studentName, subtitle);
      identity.append(avatar, identityCopy);
      nameCell.appendChild(identity);

      const rollCell = document.createElement("td");
      const rollBadge = document.createElement("span");
      rollBadge.className = "roll-badge";
      rollBadge.textContent = student.roll;
      rollCell.appendChild(rollBadge);

      const courseCell = document.createElement("td");
      const coursePill = document.createElement("span");
      coursePill.className = "course-pill";
      coursePill.textContent = student.course;
      courseCell.appendChild(coursePill);

      const actionCell = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "row-actions";
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "row-action";
      editButton.textContent = "Edit";
      editButton.setAttribute("aria-label", `Edit ${student.name}`);
      editButton.addEventListener("click", () => openStudentForm(student));
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "row-action row-action-danger";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete ${student.name}`);
      deleteButton.addEventListener("click", () => removeStudent(student));
      actions.append(editButton, deleteButton);
      actionCell.appendChild(actions);
      row.append(nameCell, rollCell, courseCell, actionCell);
      studentList.appendChild(row);
    });
  }

  function renderOverview() {
    const stats = getStatistics(students);
    element("stat-total").textContent = String(stats.totalStudents);
    element("stat-courses").textContent = String(stats.totalCourses);
    element("stat-recent").textContent = String(stats.recentlyAdded);
    element("stat-unique").textContent = String(stats.averageClassSize);
    const recentList = element("recent-list");
    recentList.replaceChildren();
    const latest = [...students].slice(-4).reverse();
    element("overview-empty").hidden = students.length > 0;
    recentList.hidden = students.length === 0;

    latest.forEach((student) => {
      const item = document.createElement("div");
      const avatar = document.createElement("span");
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      const detail = document.createElement("small");
      const course = document.createElement("span");

      item.className = "recent-item";
      avatar.className = "student-avatar";
      avatar.textContent = makeAvatar(student.name);
      copy.className = "recent-copy";
      name.textContent = student.name;
      detail.textContent = `Roll no. ${student.roll}`;
      copy.append(name, detail);
      course.className = "recent-course";
      course.textContent = student.course;
      item.append(avatar, copy, course);
      recentList.appendChild(item);
    });

    renderCourseChart();
  }

  function renderCourseChart() {
    const chart = element("course-chart");
    const empty = element("course-empty");
    const summaries = getCourseSummaries(students);
    chart.replaceChildren();
    chart.hidden = summaries.length === 0;
    empty.hidden = summaries.length > 0;

    summaries.slice(0, 5).forEach((course, index) => {
      const row = document.createElement("button");
      const titleRow = document.createElement("span");
      const name = document.createElement("strong");
      const count = document.createElement("small");
      const track = document.createElement("span");
      const progress = document.createElement("span");
      const percentage = Math.round(course.count / students.length * 100);

      row.type = "button";
      row.className = "chart-course";
      row.setAttribute("aria-label", `${course.name}: ${course.count} ${course.count === 1 ? "student" : "students"}. Filter students by this course.`);
      name.textContent = course.name;
      count.textContent = `${course.count} ${course.count === 1 ? "student" : "students"}`;
      titleRow.className = "chart-course-heading";
      titleRow.append(name, count);
      track.className = "chart-track";
      progress.className = `chart-progress chart-color-${index + 1}`;
      progress.style.width = `${percentage}%`;
      track.appendChild(progress);
      row.append(titleRow, track);
      row.addEventListener("click", () => {
        element("course-filter").value = course.name;
        navigateTo("students");
        renderTable();
      });
      chart.appendChild(row);
    });
  }

  function renderCourses() {
    const grid = element("course-summary-grid");
    const summaries = getCourseSummaries(students);
    grid.replaceChildren();
    element("courses-empty").hidden = summaries.length > 0;

    summaries.forEach((course, index) => {
      const card = document.createElement("button");
      const icon = document.createElement("span");
      const count = document.createElement("strong");
      const title = document.createElement("span");
      const action = document.createElement("span");

      card.type = "button";
      card.className = "course-summary-card";
      card.setAttribute("aria-label", `View ${course.count} ${course.count === 1 ? "student" : "students"} in ${course.name}`);
      icon.className = `course-summary-icon chart-color-${index % 5 + 1}`;
      icon.textContent = course.name.slice(0, 1).toUpperCase();
      count.className = "course-summary-count";
      count.textContent = String(course.count);
      title.className = "course-summary-name";
      title.textContent = course.name;
      action.className = "course-summary-action";
      action.textContent = "View students →";
      card.append(icon, count, title, action);
      card.addEventListener("click", () => {
        element("course-filter").value = course.name;
        navigateTo("students");
        renderTable();
      });
      grid.appendChild(card);
    });
  }

  function renderCourseOptions() {
    const summaries = getCourseSummaries(students);
    const filter = element("course-filter");
    const currentSelection = filter.value;
    const options = [new Option("All courses", "")];
    const datalist = element("course-options");

    datalist.replaceChildren();
    summaries.forEach((course) => {
      options.push(new Option(course.name, course.name));
      const option = document.createElement("option");
      option.value = course.name;
      datalist.appendChild(option);
    });
    filter.replaceChildren(...options);
    filter.value = summaries.some((course) => course.name === currentSelection)
      ? currentSelection
      : "";
  }

  function renderAll() {
    renderCourseOptions();
    renderTable();
    renderOverview();
    renderCourses();
  }

  function navigateTo(view) {
    const validViews = ["overview", "students", "courses", "settings"];

    if (!validViews.includes(view)) {
      return;
    }

    document.querySelectorAll(".view-panel").forEach((panel) => {
      const isActive = panel.id === `view-${view}`;
      panel.hidden = !isActive;
      panel.classList.toggle("is-visible", isActive);
    });
    document.querySelectorAll("[data-view]").forEach((button) => {
      const isActive = button.dataset.view === view &&
        button.classList.contains("nav-link");
      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
    element("breadcrumb-current").textContent =
      view.charAt(0).toUpperCase() + view.slice(1);
    element("global-search").value = element("student-search").value;
    closeSidebar();
  }

  function openStudentForm(student = null) {
    editingRoll = student ? student.roll : "";
    studentForm.reset();
    clearFieldErrors();
    formMessage.textContent = "";
    element("dialog-title").textContent = student ? "Edit student" : "Add a student";
    studentForm.dataset.dirty = "false";
    element("save-student").querySelector("span").textContent =
      student ? "Save changes" : "Save student";
    studentForm.querySelector(".dialog-heading p").textContent = student
      ? "Update this student's information below."
      : "Enter the details below to add a student to your directory.";

    if (student) {
      nameInput.value = student.name;
      rollInput.value = student.roll;
      courseInput.value = student.course;
    }

    studentDialog.showModal();
    window.requestAnimationFrame(() => nameInput.focus());
  }

  function closeStudentForm(force = false) {
    if (!studentDialog.open) {
      return true;
    }

    if (!force && studentForm.dataset.dirty === "true" &&
      !window.confirm("Discard your unsaved changes?")) {
      return false;
    }

    studentDialog.close();
    studentForm.dataset.dirty = "false";
    return true;
  }

  function clearFieldErrors() {
    ["name", "roll", "course"].forEach((field) => {
      const input = element(field === "name"
        ? "student-name"
        : field === "roll" ? "roll-number" : "course");
      input.removeAttribute("aria-invalid");
      element(`${field}-error`).textContent = "";
    });
  }

  function displayValidationError(message, student) {
    clearFieldErrors();
    const fields = [
      ["name", !student.name.trim(), "student-name", "name-error"],
      ["roll", !student.roll.trim(), "roll-number", "roll-error"],
      ["course", !student.course.trim(), "course", "course-error"],
    ];
    const invalidField = fields.find((field) => field[1]);

    if (invalidField) {
      element(invalidField[2]).setAttribute("aria-invalid", "true");
      element(invalidField[3]).textContent = message;
      element(invalidField[2]).focus();
      return;
    }

    element("roll-number").setAttribute("aria-invalid", "true");
    element("roll-error").textContent = message;
    element("roll-number").focus();
  }

  function removeStudent(student) {
    if (!window.confirm(`Delete ${student.name} from your student records?`)) {
      return;
    }

    const updated = deleteStudent(students, student.roll);

    if (saveStudents(updated)) {
      students = updated;
      renderAll();
      showToast(`${student.name} was deleted.`);
    }
  }

  function updateTheme() {
    const isDark = document.documentElement.dataset.theme === "dark";
    const label = isDark ? "Switch to light theme" : "Switch to dark theme";

    element("theme-toggle").setAttribute("aria-label", label);
    element("theme-toggle").title = label;
    element("settings-theme-toggle").textContent = isDark
      ? "Switch to light mode"
      : "Switch to dark mode";
  }

  function toggleTheme() {
    const nextTheme = document.documentElement.dataset.theme === "dark"
      ? "light"
      : "dark";

    document.documentElement.dataset.theme = nextTheme;
    updateTheme();

    try {
      localStorage.setItem("sms-theme", nextTheme);
    } catch (error) {
      showToast(`Theme could not be saved: ${error.message}`, "error");
    }
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
    element("sidebar-toggle").setAttribute("aria-expanded", "false");
    element("sidebar-toggle").setAttribute("aria-label", "Open navigation");
    element("sidebar-backdrop").hidden = true;
  }

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.dataset.view));
  });
  document.querySelectorAll('[data-action="add"]').forEach((button) => {
    button.addEventListener("click", () => openStudentForm());
  });
  studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const student = {
      name: nameInput.value,
      roll: rollInput.value,
      course: courseInput.value,
    };
    const result = editingRoll
      ? editStudent(students, editingRoll, student)
      : addStudent(students, student);

    if (result.error) {
      formMessage.textContent = result.error;
      displayValidationError(result.error, student);
      return;
    }

    const savedStudent = result.students.find((item) =>
      item.roll.trim().toLowerCase() === student.roll.trim().toLowerCase()
    );
    const nextStudents = result.students.map((item) =>
      item === savedStudent && !item.createdAt
        ? { ...item, createdAt: new Date().toISOString() }
        : item
    );

    if (!saveStudents(nextStudents)) {
      return;
    }

    students = nextStudents;
    const wasEditing = Boolean(editingRoll);
    closeStudentForm(true);
    renderAll();
    showToast(wasEditing ? "Student details updated." : "Student added successfully.");
  });
  studentForm.addEventListener("input", () => {
    studentForm.dataset.dirty = "true";
    formMessage.textContent = "";
    clearFieldErrors();
  });
  element("cancel-form").addEventListener("click", () => closeStudentForm());
  element("dialog-close").addEventListener("click", () => closeStudentForm());
  studentDialog.addEventListener("click", (event) => {
    if (event.target === studentDialog) {
      closeStudentForm();
    }
  });
  studentDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeStudentForm();
  });
  studentDialog.addEventListener("close", () => {
    studentForm.dataset.dirty = "false";
  });

  element("student-search").addEventListener("input", () => {
    element("global-search").value = element("student-search").value;
    renderTable();
  });
  element("global-search").addEventListener("input", (event) => {
    element("student-search").value = event.target.value;
    renderTable();
    if (event.target.value) {
      navigateTo("students");
    }
  });
  element("global-search-wrapper").addEventListener("click", () => {
    if (window.matchMedia("(max-width: 600px)").matches) {
      element("global-search-wrapper").classList.add("is-open");
      element("global-search").focus();
    }
  });
  element("global-search").addEventListener("blur", () => {
    if (!element("global-search").value) {
      element("global-search-wrapper").classList.remove("is-open");
    }
  });
  element("course-filter").addEventListener("change", renderTable);
  element("student-sort").addEventListener("change", renderTable);
  element("clear-results").addEventListener("click", () => {
    element("student-search").value = "";
    element("global-search").value = "";
    element("course-filter").value = "";
    element("student-sort").value = "name-asc";
    renderTable();
    element("student-search").focus();
  });
  element("theme-toggle").addEventListener("click", toggleTheme);
  element("settings-theme-toggle").addEventListener("click", toggleTheme);
  element("clear-data").addEventListener("click", () => {
    if (!students.length) {
      showToast("There are no student records to clear.", "error");
      return;
    }

    if (window.confirm("Permanently clear all student records on this device?") &&
      saveStudents([])) {
      students = [];
      renderAll();
      showToast("All student records were cleared.");
    }
  });
  element("sidebar-toggle").addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("sidebar-open");
    element("sidebar-toggle").setAttribute("aria-expanded", String(isOpen));
    element("sidebar-toggle").setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
    element("sidebar-backdrop").hidden = !isOpen;
  });
  element("sidebar-backdrop").addEventListener("click", closeSidebar);
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(
      document.activeElement.tagName
    )) {
      event.preventDefault();
      if (window.matchMedia("(max-width: 600px)").matches) {
        element("global-search-wrapper").classList.add("is-open");
      }
      element("global-search").focus();
    }
  });

  updateTheme();
  renderAll();
}
