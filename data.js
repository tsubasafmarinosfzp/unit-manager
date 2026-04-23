// =====================
// data.js — データ管理
// =====================

// --- 授業データ ---
function getCourses() {
  const data = localStorage.getItem('courses');
  return data ? JSON.parse(data) : [];
}
function saveCourses(courses) {
  localStorage.setItem('courses', JSON.stringify(courses));
}
function addCourse(course) {
  const courses = getCourses();
  course.id = Date.now().toString();
  courses.push(course);
  saveCourses(courses);
  return course;
}
function deleteCourse(id) {
  saveCourses(getCourses().filter(c => c.id !== id));
}
function getFilteredCourses(year, semester) {
  return getCourses().filter(c => c.year === year && c.semester === semester);
}

// --- 課題データ ---
function getTasks() {
  const data = localStorage.getItem('tasks');
  return data ? JSON.parse(data) : [];
}
function saveTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
function addTask(task) {
  const tasks = getTasks();
  task.id = Date.now().toString();
  task.stamped = false;
  tasks.push(task);
  saveTasks(tasks);
  return task;
}
function toggleStamp(taskId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.stamped = !task.stamped;
    saveTasks(tasks);
  }
}
function deleteTask(id) {
  saveTasks(getTasks().filter(t => t.id !== id));
}
function getTasksByCourse(courseId) {
  return getTasks().filter(t => t.courseId === courseId);
}
function getFilteredTasks(year, semester) {
  const courseIds = getFilteredCourses(year, semester).map(c => c.id);
  return getTasks().filter(t => courseIds.includes(t.courseId));
}

// 締切までの日数を計算
function daysUntilDeadline(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}
