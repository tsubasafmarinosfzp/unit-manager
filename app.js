// =====================
// app.js — 画面の動き
// =====================

let currentYear = '2026';
let currentSemester = 'spring';

document.addEventListener('DOMContentLoaded', function() {
  renderTimetable();
  renderTaskList();
  updateDashboard();

  document.getElementById('btn-add-course').addEventListener('click', function() {
    document.getElementById('modal-add-course').style.display = 'flex';
  });
  document.getElementById('modal-course-close').addEventListener('click', function() {
    document.getElementById('modal-add-course').style.display = 'none';
  });
  document.getElementById('modal-add-course').addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
  });
  document.getElementById('btn-submit-course').addEventListener('click', submitCourse);

  document.getElementById('btn-add-task').addEventListener('click', function() {
    openTaskModal(null);
  });
  document.getElementById('modal-task-close').addEventListener('click', function() {
    document.getElementById('modal-add-task').style.display = 'none';
  });
  document.getElementById('modal-add-task').addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
  });
  document.getElementById('btn-submit-task').addEventListener('click', submitTask);

  document.getElementById('year-select').addEventListener('change', function() {
    currentYear = this.value;
    renderTimetable();
    renderTaskList();
    updateDashboard();
  });
  document.querySelectorAll('input[name="semester"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
      currentSemester = this.value;
      renderTimetable();
      renderTaskList();
      updateDashboard();
    });
  });
});

// 授業形式によって曜日・時限の表示切り替え
function toggleDayPeriod(format) {
  const row = document.getElementById('day-period-row');
  row.style.display = format === 'ondemand' ? 'none' : 'block';
}

// 形式→色タイプのマッピング
function formatToColor(format) {
  const map = { face:'blue', media:'green', trial:'red', ondemand:'purple', hybrid:'orange' };
  return map[format] || 'blue';
}

// --- 時間割描画 ---
function renderTimetable() {
  document.querySelectorAll('.course-slot').forEach(function(slot) {
    slot.innerHTML = '';
  });

  const courses = getFilteredCourses(currentYear, currentSemester);
  const ondemandList = document.getElementById('ondemand-list');
  ondemandList.innerHTML = '';

  courses.forEach(function(course) {
    if (course.format === 'ondemand') {
      const card = document.createElement('div');
      card.className = 'ondemand-card color-' + formatToColor(course.format);
      card.innerHTML = `
        <span class="course-name">${course.name}</span>
        <span class="course-meta">${course.teacher || ''}</span>
      `;
      card.onclick = function() { openCourseDetail(course.id); };
      ondemandList.appendChild(card);
    } else {
      const slot = document.querySelector(
        `.course-slot[data-day="${course.day}"][data-period="${course.period}"]`
      );
      if (slot) slot.innerHTML = createCourseCardHTML(course);
    }
  });

  if (ondemandList.children.length === 0) {
    ondemandList.innerHTML = '<p class="ondemand-empty">オンデマンド授業なし</p>';
  }
}

function createCourseCardHTML(course) {
  const colorType = formatToColor(course.format || 'face');
  return `
    <div class="course-card color-${colorType}" onclick="openCourseDetail('${course.id}')">
      <span class="course-arrow">→</span>
      <div class="course-name">${course.name}</div>
      <div class="course-meta">${course.teacher || ''}<br>${course.room || ''}</div>
    </div>
  `;
}

// --- 授業追加 ---
function submitCourse() {
  const name = document.getElementById('input-name').value.trim();
  if (!name) { alert('科目名を入力してください'); return; }
  const format = document.getElementById('input-format').value;
  const course = {
    name,
    year: currentYear,
    semester: currentSemester,
    format,
    colorType: formatToColor(format),
    day: format === 'ondemand' ? null : document.getElementById('input-day').value,
    period: format === 'ondemand' ? null : document.getElementById('input-period').value,
    credits: document.getElementById('input-credits').value,
    teacher: document.getElementById('input-teacher').value.trim(),
    room: document.getElementById('input-room').value.trim(),
    completed: false,
  };
  addCourse(course);
  document.getElementById('modal-add-course').style.display = 'none';
  renderTimetable();
  updateDashboard();
  document.getElementById('input-name').value = '';
  document.getElementById('input-teacher').value = '';
  document.getElementById('input-room').value = '';
}

// --- 課題一覧描画 ---
function renderTaskList() {
  const container = document.getElementById('task-list');
  const tasks = getFilteredTasks(currentYear, currentSemester)
    .filter(t => !t.stamped)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  if (tasks.length === 0) {
    container.innerHTML = '<p class="task-empty">未提出の課題はありません 🎉</p>';
    return;
  }

  const courses = getCourses();
  container.innerHTML = tasks.map(task => {
    const course = courses.find(c => c.id === task.courseId);
    const courseName = course ? course.name : '不明';
    const days = daysUntilDeadline(task.deadline);
    const urgencyClass = days <= 0 ? 'urgent' : days <= 3 ? 'warning' : '';
    const urgencyLabel = days <= 0 ? '今日締切！' : `あと${days}日`;
    const typeLabel = task.type === 'report' ? 'レポート' : task.type === 'quiz' ? '小テスト' : 'その他';
    return `
      <div class="task-card ${urgencyClass}">
        <div class="task-top">
          <div>
            <span class="task-type-badge type-${task.type}">${typeLabel}</span>
            <span class="task-course">${courseName}</span>
          </div>
          <span class="task-deadline ${urgencyClass}">${urgencyLabel}</span>
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-bottom">
          <span class="task-date">締切: ${task.deadline}${task.plannedDate ? '　予定日: ' + task.plannedDate : ''}</span>
          <button class="stamp-btn" onclick="handleStamp('${task.id}')">
            <div class="stamp-owl unstamped">
              <div class="owl-body"></div>
              <div class="owl-eyes"><div class="owl-eye"></div><div class="owl-eye"></div></div>
              <div class="owl-beak"></div>
              <div class="owl-text">提出</div>
            </div>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function handleStamp(taskId) {
  toggleStamp(taskId);
  renderTaskList();
  updateDashboard();
}

function openTaskModal(courseId) {
  const courses = getFilteredCourses(currentYear, currentSemester);
  const select = document.getElementById('input-task-course');
  select.innerHTML = courses.map(c =>
    `<option value="${c.id}" ${courseId === c.id ? 'selected' : ''}>${c.name}</option>`
  ).join('');
  if (courses.length === 0) { alert('先に授業を登録してください'); return; }
  document.getElementById('modal-add-task').style.display = 'flex';
}

function submitTask() {
  const title = document.getElementById('input-task-title').value.trim();
  const deadline = document.getElementById('input-task-deadline').value;
  if (!title || !deadline) { alert('課題名と締切日を入力してください'); return; }
  addTask({
    courseId: document.getElementById('input-task-course').value,
    title,
    type: document.getElementById('input-task-type').value,
    deadline,
    plannedDate: document.getElementById('input-task-planned').value,
    memo: '',
  });
  document.getElementById('modal-add-task').style.display = 'none';
  renderTaskList();
  updateDashboard();
  document.getElementById('input-task-title').value = '';
  document.getElementById('input-task-deadline').value = '';
  document.getElementById('input-task-planned').value = '';
}

// --- ダッシュボード更新 ---
function updateDashboard() {
  const tasks = getFilteredTasks(currentYear, currentSemester).filter(t => !t.stamped);
  document.getElementById('report-count').textContent = tasks.filter(t => t.type === 'report').length;
  document.getElementById('quiz-count').textContent = tasks.filter(t => t.type === 'quiz').length;
  const courses = getFilteredCourses(currentYear, currentSemester);
  const totalCredits = courses.filter(c => c.completed).reduce((sum, c) => sum + Number(c.credits), 0);
  document.getElementById('credit-count').textContent = totalCredits;
}

// --- 授業詳細 ---
function openCourseDetail(courseId) {
  location.href = 'course.html?id=' + courseId;
}
