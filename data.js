// =====================
// data.js — データ管理
// 授業・課題・出席のデータをlocalStorageに保存・取得する
// =====================

// --- 授業データ ---

// 授業一覧を取得（なければ空配列を返す）
function getCourses() {
  const data = localStorage.getItem('courses');
  return data ? JSON.parse(data) : [];
}

// 授業一覧を保存
function saveCourses(courses) {
  localStorage.setItem('courses', JSON.stringify(courses));
}

// 授業を1件追加
function addCourse(course) {
  const courses = getCourses();
  // IDは「現在時刻のミリ秒」で一意にする
  course.id = Date.now().toString();
  courses.push(course);
  saveCourses(courses);
  return course;
}

// 授業を1件削除
function deleteCourse(id) {
  const courses = getCourses().filter(c => c.id !== id);
  saveCourses(courses);
}

// 今の年度・学期でフィルタした授業を返す
function getFilteredCourses(year, semester) {
  return getCourses().filter(c => c.year === year && c.semester === semester);
}
