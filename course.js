// =====================
// course.js — 授業詳細ページの動き
// =====================

// URLからcourseIdを取得
const params = new URLSearchParams(location.search);
const courseId = params.get('id');

document.addEventListener('DOMContentLoaded', function() {
  if (!courseId) { location.href = 'index.html'; return; }

  renderCourseInfo();
  renderEvalDisplay();
  renderAttendance();
  renderCourseTasks();
  renderSessions();
  renderFreeNotes();

  // 評価方法
  document.getElementById('btn-edit-eval').addEventListener('click', toggleEvalForm);
  document.getElementById('btn-add-eval-item').addEventListener('click', addEvalItem);
  document.getElementById('btn-save-eval').addEventListener('click', saveEval);

  // 出席
  document.getElementById('btn-add-attendance').addEventListener('click', function() {
    document.getElementById('input-att-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('modal-attendance').style.display = 'flex';
  });
  document.getElementById('modal-att-close').addEventListener('click', function() {
    document.getElementById('modal-attendance').style.display = 'none';
  });
  document.getElementById('btn-submit-attendance').addEventListener('click', submitAttendance);

  // 課題
  document.getElementById('btn-add-task-detail').addEventListener('click', function() {
    document.getElementById('modal-task-detail').style.display = 'flex';
  });
  document.getElementById('modal-task-detail-close').addEventListener('click', function() {
    document.getElementById('modal-task-detail').style.display = 'none';
  });
  document.getElementById('btn-submit-detail-task').addEventListener('click', submitDetailTask);

  // メモ
  document.getElementById('btn-add-session').addEventListener('click', addSession);
  document.getElementById('btn-add-free-note').addEventListener('click', addFreeNote);
});

// --- 授業基本情報 ---
function renderCourseInfo() {
  const course = getCourses().find(c => c.id === courseId);
  if (!course) return;
  document.getElementById('course-title').textContent = course.name;
  document.title = course.name;
  const dayMap = {mon:'月',tue:'火',wed:'水',thu:'木',fri:'金',sat:'土'};
  const colorMap = {blue:'履修登録',green:'メディア',red:'仮参加'};
  document.getElementById('course-info').innerHTML = `
    <div class="info-item"><span class="info-label">担当教員</span><span class="info-val">${course.teacher||'—'}</span></div>
    <div class="info-item"><span class="info-label">教室</span><span class="info-val">${course.room||'—'}</span></div>
    <div class="info-item"><span class="info-label">曜日・時限</span><span class="info-val">${dayMap[course.day]}曜 ${course.period}限</span></div>
    <div class="info-item"><span class="info-label">単位数</span><span class="info-val">${course.credits}単位</span></div>
    <div class="info-item"><span class="info-label">種別</span><span class="info-val">${colorMap[course.colorType]||'—'}</span></div>
  `;
}

// --- 評価方法 ---
function getEval() {
  const data = localStorage.getItem('eval_' + courseId);
  return data ? JSON.parse(data) : [];
}
function saveEvalData(items) {
  localStorage.setItem('eval_' + courseId, JSON.stringify(items));
}
function renderEvalDisplay() {
  const items = getEval();
  const el = document.getElementById('eval-display');
  if (items.length === 0) {
    el.innerHTML = '<p class="empty-text">評価方法が登録されていません</p>';
    return;
  }
  el.innerHTML = items.map(item => `
    <div class="eval-row">
      <span class="eval-name">${item.name}</span>
      <span class="eval-pct">${item.pct}%</span>
    </div>
  `).join('');
}
function toggleEvalForm() {
  const form = document.getElementById('eval-form');
  const display = document.getElementById('eval-display');
  if (form.style.display === 'none') {
    form.style.display = 'block';
    display.style.display = 'none';
    const items = getEval();
    document.getElementById('eval-items').innerHTML = '';
    items.forEach(item => addEvalItemRow(item.name, item.pct));
    updateEvalTotal();
  } else {
    form.style.display = 'none';
    display.style.display = 'block';
  }
}
function addEvalItem() { addEvalItemRow('', ''); }
function addEvalItemRow(name, pct) {
  const div = document.createElement('div');
  div.className = 'eval-item-row';
  div.innerHTML = `
    <input type="text" class="form-input eval-name-input" placeholder="例：期末試験" value="${name}">
    <input type="number" class="form-input eval-pct-input" placeholder="%" min="0" max="100" value="${pct}" style="width:80px">
    <button class="btn-remove" onclick="this.parentElement.remove();updateEvalTotal()">✕</button>
  `;
  document.getElementById('eval-items').appendChild(div);
  div.querySelector('.eval-pct-input').addEventListener('input', updateEvalTotal);
}
function updateEvalTotal() {
  const inputs = document.querySelectorAll('.eval-pct-input');
  const total = Array.from(inputs).reduce((s, i) => s + (Number(i.value)||0), 0);
  const el = document.getElementById('eval-total');
  el.textContent = total;
  el.style.color = total === 100 ? '#1D9E75' : total > 100 ? '#E24B4A' : '#f0a500';
}
function saveEval() {
  const names = document.querySelectorAll('.eval-name-input');
  const pcts = document.querySelectorAll('.eval-pct-input');
  const items = Array.from(names).map((n, i) => ({
    name: n.value.trim(),
    pct: Number(pcts[i].value)||0
  })).filter(item => item.name);
  saveEvalData(items);
  toggleEvalForm();
  renderEvalDisplay();
}

// --- 出席記録 ---
function getAttendance() {
  const data = localStorage.getItem('attendance_' + courseId);
  return data ? JSON.parse(data) : [];
}
function saveAttendance(records) {
  localStorage.setItem('attendance_' + courseId, JSON.stringify(records));
}
function renderAttendance() {
  const records = getAttendance().sort((a,b) => new Date(b.date)-new Date(a.date));
  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  document.getElementById('att-present-count').textContent = presentCount;
  document.getElementById('att-absent-count').textContent = absentCount;
  const el = document.getElementById('attendance-list');
  if (records.length === 0) {
    el.innerHTML = '<p class="empty-text">出席記録がありません</p>';
    return;
  }
  el.innerHTML = records.map((r, i) => `
    <div class="att-row">
      <span class="att-date">${r.date}</span>
      <span class="att-status ${r.status === 'present' ? 'att-present' : 'att-absent'}">
        ${r.status === 'present' ? '出席' : '欠席'}
      </span>
      <button class="btn-remove" onclick="deleteAttendance(${i})">✕</button>
    </div>
  `).join('');
}
function submitAttendance() {
  const date = document.getElementById('input-att-date').value;
  const status = document.getElementById('input-att-status').value;
  if (!date) { alert('日付を選んでください'); return; }
  const records = getAttendance();
  records.push({ date, status });
  saveAttendance(records);
  document.getElementById('modal-attendance').style.display = 'none';
  renderAttendance();
}
function deleteAttendance(idx) {
  const records = getAttendance().sort((a,b) => new Date(b.date)-new Date(a.date));
  records.splice(idx, 1);
  saveAttendance(records);
  renderAttendance();
}

// --- 課題一覧 ---
function renderCourseTasks() {
  const tasks = getTasksByCourse(courseId).sort((a,b) => new Date(a.deadline)-new Date(b.deadline));
  const el = document.getElementById('course-task-list');
  if (tasks.length === 0) {
    el.innerHTML = '<p class="empty-text">課題がありません</p>';
    return;
  }
  el.innerHTML = tasks.map(task => {
    const days = daysUntilDeadline(task.deadline);
    const urgencyClass = days <= 0 ? 'urgent' : days <= 3 ? 'warning' : '';
    const typeLabel = task.type === 'report' ? 'レポート' : task.type === 'quiz' ? '小テスト' : 'その他';
    return `
      <div class="task-card ${urgencyClass}">
        <div class="task-top">
          <span class="task-type-badge type-${task.type}">${typeLabel}</span>
          <span class="task-deadline ${urgencyClass}">${days <= 0 ? '今日締切！' : 'あと'+days+'日'}</span>
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-bottom">
          <span class="task-date">締切: ${task.deadline}</span>
          <button class="stamp-btn" onclick="handleCourseStamp('${task.id}')">
            <div class="stamp-owl ${task.stamped ? 'stamped' : 'unstamped'}">
              <div class="owl-body"></div>
              <div class="owl-eyes"><div class="owl-eye"></div><div class="owl-eye"></div></div>
              <div class="owl-beak"></div>
              <div class="owl-text">${task.stamped ? '済' : '提出'}</div>
            </div>
          </button>
        </div>
      </div>
    `;
  }).join('');
}
function handleCourseStamp(taskId) {
  toggleStamp(taskId);
  renderCourseTasks();
}
function submitDetailTask() {
  const title = document.getElementById('input-detail-task-title').value.trim();
  const deadline = document.getElementById('input-detail-task-deadline').value;
  if (!title || !deadline) { alert('課題名と締切日を入力してください'); return; }
  addTask({
    courseId,
    title,
    type: document.getElementById('input-detail-task-type').value,
    deadline,
    plannedDate: document.getElementById('input-detail-task-planned').value,
    memo: '',
  });
  document.getElementById('modal-task-detail').style.display = 'none';
  document.getElementById('input-detail-task-title').value = '';
  document.getElementById('input-detail-task-deadline').value = '';
  renderCourseTasks();
}

// --- 回別メモ ---
function getSessions() {
  const data = localStorage.getItem('sessions_' + courseId);
  return data ? JSON.parse(data) : [];
}
function saveSessions(sessions) {
  localStorage.setItem('sessions_' + courseId, JSON.stringify(sessions));
}
function renderSessions() {
  const sessions = getSessions();
  const el = document.getElementById('session-list');
  if (sessions.length === 0) {
    el.innerHTML = '<p class="empty-text">回別メモがありません</p>';
    return;
  }
  el.innerHTML = sessions.map((s, i) => `
    <div class="note-card">
      <div class="note-header">
        <span class="note-label">第${s.no}回</span>
        <button class="btn-remove" onclick="deleteSession(${i})">✕</button>
      </div>
      ${s.slideUrl ? `<a href="${s.slideUrl}" target="_blank" class="slide-link">📎 スライドを開く</a>` : ''}
      <textarea class="note-textarea" placeholder="要約・メモを入力..." onchange="updateSession(${i},'content',this.value)">${s.content||''}</textarea>
      <input type="url" class="form-input" placeholder="スライドURL" value="${s.slideUrl||''}" onchange="updateSession(${i},'slideUrl',this.value)" style="margin-top:6px;font-size:12px">
    </div>
  `).join('');
}
function addSession() {
  const sessions = getSessions();
  sessions.push({ no: sessions.length + 1, content: '', slideUrl: '' });
  saveSessions(sessions);
  renderSessions();
}
function updateSession(idx, key, val) {
  const sessions = getSessions();
  sessions[idx][key] = val;
  saveSessions(sessions);
}
function deleteSession(idx) {
  const sessions = getSessions();
  sessions.splice(idx, 1);
  sessions.forEach((s, i) => s.no = i + 1);
  saveSessions(sessions);
  renderSessions();
}

// --- フリーメモ ---
function getFreeNotes() {
  const data = localStorage.getItem('freenotes_' + courseId);
  return data ? JSON.parse(data) : [];
}
function saveFreeNotes(notes) {
  localStorage.setItem('freenotes_' + courseId, JSON.stringify(notes));
}
function renderFreeNotes() {
  const notes = getFreeNotes();
  const el = document.getElementById('free-note-list');
  if (notes.length === 0) {
    el.innerHTML = '<p class="empty-text">フリーメモがありません</p>';
    return;
  }
  el.innerHTML = notes.map((n, i) => `
    <div class="note-card">
      <div class="note-header">
        <input type="text" class="note-title-input" placeholder="タイトル" value="${n.title||''}" onchange="updateFreeNote(${i},'title',this.value)">
        <button class="btn-remove" onclick="deleteFreeNote(${i})">✕</button>
      </div>
      <textarea class="note-textarea" placeholder="メモを入力..." onchange="updateFreeNote(${i},'content',this.value)">${n.content||''}</textarea>
    </div>
  `).join('');
}
function addFreeNote() {
  const notes = getFreeNotes();
  notes.push({ title: '', content: '' });
  saveFreeNotes(notes);
  renderFreeNotes();
}
function updateFreeNote(idx, key, val) {
  const notes = getFreeNotes();
  notes[idx][key] = val;
  saveFreeNotes(notes);
}
function deleteFreeNote(idx) {
  const notes = getFreeNotes();
  notes.splice(idx, 1);
  saveFreeNotes(notes);
  renderFreeNotes();
}

// --- 取得済みトグル ---
function toggleComplete() {
  const courses = getCourses();
  const course = courses.find(c => c.id === courseId);
  if (!course) return;
  course.completed = !course.completed;
  saveCourses(courses);
  const btn = document.getElementById('btn-complete');
  if (course.completed) {
    btn.textContent = '✓ 取得済み';
    btn.classList.add('completed');
  } else {
    btn.textContent = '単位を取得済みにする';
    btn.classList.remove('completed');
  }
}

// 初期状態を反映
document.addEventListener('DOMContentLoaded', function() {
  const course = getCourses().find(c => c.id === courseId);
  if (course && course.completed) {
    const btn = document.getElementById('btn-complete');
    if (btn) { btn.textContent = '✓ 取得済み'; btn.classList.add('completed'); }
  }
}, { once: false });
