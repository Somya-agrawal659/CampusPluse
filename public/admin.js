/**
 * CampusPulse — Dedicated Admin Dashboard Logic
 * Runs on /admin and /admin.html
 */

const STORAGE_KEY = 'campuspulse_notices_exact_v1';
const ADMIN_SESSION_KEY = 'campuspulse_admin_session_v1';

const DEFAULT_NOTICES = [
  {
    id: "not-hackathon-2026",
    title: "Hackathon 2026",
    category: "Competitions",
    description: "Big ideas. Real impact. Participate in our annual national-level hackathon and showcase your problem-solving skills.",
    date: "2026-01-10",
    deadline: "2025-12-25",
    isImportant: true,
    isFeatured: true,
    attachment: {
      name: "hackathon_2026_guidelines.pdf",
      size: "2.4 MB",
      type: "pdf"
    }
  },
  {
    id: "not-web-dev",
    title: "Web Development Workshop",
    category: "Workshops",
    description: "Hands-on workshop on modern web development technologies for beginners.",
    date: "2025-11-12",
    deadline: "2025-11-10",
    isImportant: false,
    isFeatured: false,
    attachment: {
      name: "web_dev_workshop_curriculum.pdf",
      size: "1.2 MB",
      type: "pdf"
    }
  },
  {
    id: "not-internship",
    title: "Summer Internship Opportunity",
    category: "Internships",
    description: "Internship opportunity for second and third year students at a leading tech company.",
    date: "2025-11-05",
    deadline: "2025-11-20",
    isImportant: false,
    isFeatured: false,
    attachment: {
      name: "summer_internship_jd.pdf",
      size: "890 KB",
      type: "pdf"
    }
  },
  {
    id: "not-midsem-exam",
    title: "Mid-Sem Examination Schedule",
    category: "Important Notices",
    description: "Mid-semester examination schedule for all branches has been released. Kindly check the details.",
    date: "2025-11-01",
    deadline: null,
    isImportant: true,
    isFeatured: false,
    attachment: {
      name: "mid_sem_exam_schedule.pdf",
      size: "1.6 MB",
      type: "pdf"
    }
  }
];

let notices = [];
let selectedUploadFile = null;

function loadNotices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      notices = JSON.parse(raw);
    } else {
      notices = [...DEFAULT_NOTICES];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
    }
  } catch (e) {
    notices = [...DEFAULT_NOTICES];
  }
}

function saveNotices() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
  } catch (e) {
    console.error("Save error:", e);
  }
}

function notifyNewNotice(notice) {
  fetch('/api/push/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notice)
  }).catch(error => console.warn('Push notification request failed:', error.message));
}

function checkAuth() {
  const isAuth = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  const loginBox = document.getElementById('adminLoginBox');
  const dashBox = document.getElementById('adminDashboardBox');

  if (isAuth) {
    if (loginBox) loginBox.style.display = 'none';
    if (dashBox) dashBox.style.display = 'block';
    renderDashboard();
  } else {
    if (loginBox) loginBox.style.display = 'block';
    if (dashBox) dashBox.style.display = 'none';
  }
}

function login(u, p) {
  if (u === 'admin' && p === 'admin123') {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    checkAuth();
    showToast("Signed In", "Welcome to CampusPulse Coordinator Portal", "👋");
  } else {
    showToast("Login Failed", "Invalid credentials. Use admin / admin123", "⚠️");
  }
}

function logout() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  checkAuth();
  showToast("Logged Out", "Admin session ended.", "🔒");
}

function renderDashboard() {
  const total = notices.length;
  const workshops = notices.filter(n => n.category === 'Workshops').length;
  const comps = notices.filter(n => n.category === 'Competitions').length;
  const interns = notices.filter(n => n.category === 'Internships').length;
  const imp = notices.filter(n => n.category === 'Important Notices').length;

  document.getElementById('adminStatTotal').textContent = total;
  document.getElementById('adminStatWorkshops').textContent = workshops;
  document.getElementById('adminStatCompetitions').textContent = comps;
  document.getElementById('adminStatInternships').textContent = interns;
  document.getElementById('adminStatImportant').textContent = imp;

  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  if (notices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 28px; color: var(--text-muted);">No notices posted yet. Click "Post New Notice" above.</td></tr>`;
    return;
  }

  tbody.innerHTML = notices.map(n => `
    <tr>
      <td>
        <strong>${escapeHTML(n.title)}</strong>
        ${n.isImportant ? '<span style="color: #f59e0b; margin-left: 6px;">★</span>' : ''}
      </td>
      <td>
        <span class="category-pill ${getCategoryPillClass(n.category)}">${escapeHTML(n.category.toUpperCase())}</span>
      </td>
      <td>${formatDate(n.date)}</td>
      <td>${n.deadline ? formatDate(n.deadline) : '<span style="color: var(--text-light);">None</span>'}</td>
      <td>
        ${n.attachment ? `<span style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-solid fa-paperclip"></i> Attached</span>` : '<span style="font-size: 0.8rem; color: var(--text-light);">None</span>'}
      </td>
      <td style="text-align: right;">
        <div class="table-actions-cell">
          <button class="btn-action-small btn-edit" data-id="${n.id}" title="Edit Notice">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-action-small text-rose btn-delete" data-id="${n.id}" title="Delete Notice">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.onclick = () => {
      const notice = notices.find(n => n.id === btn.dataset.id);
      if (notice) openNoticeModal(notice);
    };
  });

  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = () => {
      const notice = notices.find(n => n.id === btn.dataset.id);
      if (notice && confirm(`Delete notice: "${notice.title}"?`)) {
        notices = notices.filter(n => n.id !== notice.id);
        saveNotices();
        renderDashboard();
        showToast("Deleted", "Notice removed from board.", "🗑️");
      }
    };
  });
}

function getCategoryPillClass(cat) {
  switch (cat) {
    case 'Competitions': return 'pill-competition';
    case 'Workshops': return 'pill-workshop';
    case 'Internships': return 'pill-internship';
    case 'Important Notices': return 'pill-important';
    default: return 'pill-workshop';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function openNoticeModal(notice = null) {
  const modal = document.getElementById('noticeFormModal');
  const form = document.getElementById('noticeEditForm');
  const titleInput = document.getElementById('inputNoticeTitle');
  const catSelect = document.getElementById('selectNoticeCategory');
  const deadInput = document.getElementById('inputNoticeDeadline');
  const descInput = document.getElementById('inputNoticeDesc');
  const impCheck = document.getElementById('checkIsImportant');
  const idInput = document.getElementById('editNoticeId');
  const modalTitle = document.getElementById('formModalTitle');
  const saveLabel = document.getElementById('saveNoticeLabel');

  selectedUploadFile = null;
  clearDropzone();

  if (notice) {
    idInput.value = notice.id;
    titleInput.value = notice.title;
    catSelect.value = notice.category;
    deadInput.value = notice.deadline || '';
    descInput.value = notice.description;
    impCheck.checked = !!notice.isImportant;

    if (modalTitle) modalTitle.textContent = "Edit Notice";
    if (saveLabel) saveLabel.textContent = "Save Changes";

    if (notice.attachment) {
      selectedUploadFile = notice.attachment;
      showDropzone(notice.attachment.name);
    }
  } else {
    form.reset();
    idInput.value = '';
    impCheck.checked = false;
    if (modalTitle) modalTitle.textContent = "Add New Notice";
    if (saveLabel) saveLabel.textContent = "Publish Notice";
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeNoticeModal() {
  const modal = document.getElementById('noticeFormModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function handleSaveNotice() {
  const id = document.getElementById('editNoticeId').value;
  const title = document.getElementById('inputNoticeTitle').value.trim();
  const category = document.getElementById('selectNoticeCategory').value;
  const deadline = document.getElementById('inputNoticeDeadline').value;
  const description = document.getElementById('inputNoticeDesc').value.trim();
  const isImportant = document.getElementById('checkIsImportant').checked;

  if (!title || !description) {
    showToast("Missing Fields", "Please provide title and description.", "⚠️");
    return;
  }

  if (id) {
    const idx = notices.findIndex(n => n.id === id);
    if (idx !== -1) {
      notices[idx].title = title;
      notices[idx].category = category;
      notices[idx].deadline = deadline || null;
      notices[idx].description = description;
      notices[idx].isImportant = isImportant;
      if (selectedUploadFile) {
        notices[idx].attachment = selectedUploadFile;
      }
      saveNotices();
      notifyNewNotice(notices[idx]);
      renderDashboard();
      closeNoticeModal();
      showToast("Updated", `"${title}" saved successfully.`, "✏️");
    }
  } else {
    const newNotice = {
      id: `not-${Date.now()}`,
      title,
      category,
      deadline: deadline || null,
      description,
      date: new Date().toISOString().slice(0, 10),
      isImportant,
      isFeatured: false,
      attachment: selectedUploadFile || null
    };
    notices.unshift(newNotice);
    saveNotices();
    notifyNewNotice(newNotice);
    renderDashboard();
    closeNoticeModal();
    showToast("Published! ✨", `"${title}" is now active.`, "🚀");
  }
}

function initDropzone() {
  const dropzone = document.getElementById('fileDropzone');
  const fileInput = document.getElementById('inputFileAttachment');
  const btnRemove = document.getElementById('btnRemoveFile');

  if (!dropzone || !fileInput) return;

  dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); };
  dropzone.ondragleave = () => { dropzone.classList.remove('drag-over'); };
  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  fileInput.onchange = () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFile(fileInput.files[0]);
    }
  };

  if (btnRemove) {
    btnRemove.onclick = (e) => {
      e.stopPropagation();
      selectedUploadFile = null;
      fileInput.value = '';
      clearDropzone();
    };
  }
}

function handleFile(file) {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

  if (!isImage && !isPdf) {
    showToast("File Error", "Please upload a PDF or Image.", "⚠️");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    selectedUploadFile = {
      name: file.name,
      size: (file.size / 1024).toFixed(0) + ' KB',
      type: isImage ? 'image' : 'pdf',
      dataUrl: e.target.result
    };
    showDropzone(file.name);
  };
  reader.readAsDataURL(file);
}

function showDropzone(name) {
  const prompt = document.getElementById('dropPrompt');
  const info = document.getElementById('dropFileInfo');
  const label = document.getElementById('fileNameLabel');
  if (prompt) prompt.style.display = 'none';
  if (info) info.style.display = 'flex';
  if (label) label.textContent = name;
}

function clearDropzone() {
  const prompt = document.getElementById('dropPrompt');
  const info = document.getElementById('dropFileInfo');
  if (prompt) prompt.style.display = 'block';
  if (info) info.style.display = 'none';
}

function showToast(title, message, icon = '✨') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast-item';
  el.innerHTML = `
    <div class="toast-icon-wrap">${icon}</div>
    <div class="toast-body-text">
      <h5>${escapeHTML(title)}</h5>
      <p>${escapeHTML(message)}</p>
    </div>
  `;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-leave');
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
  }, 3500);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  loadNotices();
  checkAuth();
  initDropzone();

  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const u = document.getElementById('adminUser').value.trim();
      const p = document.getElementById('adminPass').value.trim();
      login(u, p);
    };
  }

  const btnLogout = document.getElementById('btnAdminLogout');
  if (btnLogout) btnLogout.onclick = logout;

  const btnNewNotice = document.getElementById('btnOpenNewNoticeModal');
  if (btnNewNotice) btnNewNotice.onclick = () => openNoticeModal(null);

  const btnResetDefaults = document.getElementById('btnResetToDefaults');
  if (btnResetDefaults) {
    btnResetDefaults.onclick = () => {
      if (confirm("Restore original sample notices?")) {
        notices = JSON.parse(JSON.stringify(DEFAULT_NOTICES));
        saveNotices();
        renderDashboard();
        showToast("Restored", "Sample notices reloaded.", "✨");
      }
    };
  }

  const btnCloseModal = document.getElementById('btnCloseFormModal');
  const btnCancelModal = document.getElementById('btnCancelFormModal');
  if (btnCloseModal) btnCloseModal.onclick = closeNoticeModal;
  if (btnCancelModal) btnCancelModal.onclick = closeNoticeModal;

  const editForm = document.getElementById('noticeEditForm');
  if (editForm) {
    editForm.onsubmit = (e) => {
      e.preventDefault();
      handleSaveNotice();
    };
  }

  window.onclick = (e) => {
    const modal = document.getElementById('noticeFormModal');
    if (e.target === modal) closeNoticeModal();
  };

  window.onkeydown = (e) => {
    if (e.key === 'Escape') closeNoticeModal();
  };
});
