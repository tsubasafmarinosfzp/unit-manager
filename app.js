// =====================
// app.js — 画面の動き
// ボタンを押したとき・画面を更新するときの処理
// =====================

// --- 初期設定 ---
let currentYear  = '2026';
let currentSemester = 'spring';

// ページが読み込まれたら最初に実行される
document.addEventListener('DOMContentLoaded', function() {
  renderTimetable();   // 時間割を描画
  updateDashboard();   // バッジの数を更新

  // 「授業を追加」ボタンを押したらモーダルを開く
  document.getElementById('btn-add-course').addEventListener('click', function() {
    document.getElementById('modal-add').style.display = 'flex';
  });

  // 「✕」ボタンでモーダルを閉じる
  document.getElementById('modal-close').addEventListener('click', function() {
    document.getElementById('modal-add').style.display = 'none';
  });

  // モーダルの外側をクリックでも閉じる
  document.getElementById('modal-add').addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
  });

  // 「追加する」ボタンを押したときの処理
  document.getElementById('btn-submit-course').addEventListener('click', submitCourse);

  // 年度変更
  document.getElementById('year-select').addEventListener('change', function() {
    currentYear = this.value;
    renderTimetable();
  });

  // 学期変更（ラジオボタン）
  document.querySelectorAll('input[name="semester"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
      currentSemester = this.value;
      renderTimetable();
    });
  });
});

// --- 時間割の描画 ---
function renderTimetable() {
  // まず全セルを空にする
  document.querySelectorAll('.course-slot').forEach(function(slot) {
    slot.innerHTML = '';
  });

  // 現在の年度・学期の授業を取得して配置
  const courses = getFilteredCourses(currentYear, currentSemester);
  courses.forEach(function(course) {
    const slot = document.querySelector(
      `.course-slot[data-day="${course.day}"][data-period="${course.period}"]`
    );
    if (slot) {
      slot.innerHTML = createCourseCardHTML(course);
    }
  });
}

// 授業カードのHTMLを作る関数
function createCourseCardHTML(course) {
  return `
    <div class="course-card color-${course.colorType}" onclick="openCourseDetail('${course.id}')">
      <span class="course-arrow">→</span>
      <div class="course-name">${course.name}</div>
      <div class="course-meta">${course.teacher || ''}<br>${course.room || ''}</div>
    </div>
  `;
}

// --- 授業追加フォームの送信 ---
function submitCourse() {
  const name = document.getElementById('input-name').value.trim();
  if (!name) {
    alert('科目名を入力してください');
    return;
  }

  const course = {
    name:      name,
    year:      currentYear,
    semester:  currentSemester,
    day:       document.getElementById('input-day').value,
    period:    document.getElementById('input-period').value,
    credits:   document.getElementById('input-credits').value,
    colorType: document.getElementById('input-color').value,
    teacher:   document.getElementById('input-teacher').value.trim(),
    room:      document.getElementById('input-room').value.trim(),
    completed: false,
  };

  addCourse(course);            // data.jsの関数でlocalStorageに保存
  document.getElementById('modal-add').style.display = 'none';
  renderTimetable();            // 時間割を再描画
  updateDashboard();

  // フォームをリセット
  document.getElementById('input-name').value = '';
  document.getElementById('input-teacher').value = '';
  document.getElementById('input-room').value = '';
}

// --- ダッシュボードのバッジ更新 ---
function updateDashboard() {
  const courses = getFilteredCourses(currentYear, currentSemester);
  // 取得単位の合計（completed=trueのものだけ）
  const totalCredits = courses
    .filter(c => c.completed)
    .reduce((sum, c) => sum + Number(c.credits), 0);
  document.getElementById('credit-count').textContent = totalCredits;
  // ※ 課題バッジはフェーズ2で実装
}

// --- 授業詳細を開く（フェーズ2で実装） ---
function openCourseDetail(courseId) {
  alert('授業詳細はフェーズ2で実装します！\n（授業ID: ' + courseId + '）');
}
