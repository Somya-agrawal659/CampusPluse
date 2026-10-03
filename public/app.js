/**
 * CampusPulse — Student Notice Board & Opportunities Hub
 * Exact Match to Visual Design Reference
 */

// ==========================================================================
// 1. DEFAULT NOTICES (Matches Screenshot & Requirements Exactly)
// ==========================================================================
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
  },
  {
    id: "not-ai-bootcamp",
    title: "AI & Machine Learning Bootcamp",
    category: "Workshops",
    description: "Two-day weekend bootcamp exploring deep learning models, prompt engineering, and PyTorch fundamentals.",
    date: "2025-10-28",
    deadline: "2025-10-25",
    isImportant: false,
    isFeatured: false,
    attachment: null
  },
  {
    id: "not-coding-sprint",
    title: "Annual Speed Coding Championship",
    category: "Competitions",
    description: "Compete with top college coders in algorithmic problem solving and win cash prizes and direct interview opportunities.",
    date: "2025-10-20",
    deadline: "2025-10-18",
    isImportant: false,
    isFeatured: false,
    attachment: null
  }
];

// ==========================================================================
// 2. STATE MANAGEMENT
// ==========================================================================
const AppState = {
  notices: [],
  activeFilter: 'All', // 'All' | 'Workshops' | 'Competitions' | 'Internships' | 'Important Notices'
  searchQuery: '',
  activeModalNotice: null
};

const STORAGE_KEY = 'campuspulse_notices_exact_v1';

// ==========================================================================
// 3. STORAGE & RECOVERY
// ==========================================================================
function loadNotices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      AppState.notices = JSON.parse(raw);
    } else {
      AppState.notices = [...DEFAULT_NOTICES];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState.notices));
    }
  } catch (e) {
    AppState.notices = [...DEFAULT_NOTICES];
  }
}

// ==========================================================================
// 4. RENDERING NOTICES SHOWCASE
// ==========================================================================
function renderAll() {
  renderOpportunitiesSection();
}

function getFilteredList() {
  return AppState.notices.filter(notice => {
    // 1. Filter Chip
    if (AppState.activeFilter !== 'All') {
      if (notice.category.toLowerCase() !== AppState.activeFilter.toLowerCase()) {
        return false;
      }
    }

    // 2. Search Query
    if (AppState.searchQuery.trim() !== '') {
      const q = AppState.searchQuery.toLowerCase().trim();
      const matchTitle = notice.title.toLowerCase().includes(q);
      const matchDesc = notice.description.toLowerCase().includes(q);
      const matchCat = notice.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    return true;
  });
}

function renderOpportunitiesSection() {
  const filtered = getFilteredList();
  const emptyState = document.getElementById('emptyNoticesState');
  const featuredCard = document.getElementById('featuredNoticeCard');
  const regularGrid = document.getElementById('regularNoticesGrid');

  if (filtered.length === 0) {
    if (featuredCard) featuredCard.style.display = 'none';
    if (regularGrid) regularGrid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // Find featured notice (or fallback to first matching)
  let featuredNotice = filtered.find(n => n.isFeatured) || filtered[0];
  let regularNotices = filtered.filter(n => n.id !== featuredNotice.id);

  // If filtered by a specific category and featured isn't in it, pick first
  if (AppState.activeFilter !== 'All' && featuredNotice.category.toLowerCase() !== AppState.activeFilter.toLowerCase()) {
    featuredNotice = filtered[0];
    regularNotices = filtered.slice(1);
  }

  // 1. Render Featured Card
  if (featuredCard) {
    featuredCard.style.display = 'grid';
    const featCatPill = document.getElementById('featCatPill');
    const featTitle = document.getElementById('featTitle');
    const featDesc = document.getElementById('featDesc');
    const featDate = document.getElementById('featDate');
    const featDeadline = document.getElementById('featDeadline');
    const btnViewFeatured = document.getElementById('btnViewFeatured');

    if (featCatPill) {
      featCatPill.textContent = featuredNotice.category.toUpperCase();
      featCatPill.className = `category-pill ${getCategoryPillClass(featuredNotice.category)}`;
    }
    if (featTitle) featTitle.textContent = featuredNotice.title;
    if (featDesc) featDesc.textContent = featuredNotice.description;
    if (featDate) featDate.textContent = formatDisplayDate(featuredNotice.date);
    if (featDeadline) {
      if (featuredNotice.deadline) {
        featDeadline.parentElement.style.display = 'inline-flex';
        featDeadline.textContent = formatDisplayDate(featuredNotice.deadline);
      } else {
        featDeadline.parentElement.style.display = 'none';
      }
    }

    if (btnViewFeatured) {
      btnViewFeatured.onclick = () => openNoticeDetailModal(featuredNotice.id);
    }
  }

  // 2. Render Regular Cards (3 in a row like screenshot)
  if (regularGrid) {
    regularGrid.innerHTML = regularNotices.map(n => renderRegularCardHTML(n)).join('');

    // Attach click events
    regularGrid.querySelectorAll('.regular-notice-card').forEach(card => {
      card.addEventListener('click', () => {
        openNoticeDetailModal(card.dataset.id);
      });
    });
  }
}

function renderRegularCardHTML(notice) {
  const catClass = getCategoryPillClass(notice.category);
  const iconConfig = getCategoryIconConfig(notice.category);
  const formattedDate = formatDisplayDate(notice.date);
  const formattedDeadline = notice.deadline ? formatDisplayDate(notice.deadline) : null;
  const isNew = isRecentlyAdded(notice.date, 72);

  return `
    <article class="regular-notice-card" data-id="${notice.id}">
      <div>
        <div class="reg-card-top">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="category-pill ${catClass}">${escapeHTML(notice.category.toUpperCase())}</span>
            ${isNew ? '<span class="new-tag-pill">NEW</span>' : ''}
          </div>
          <div class="reg-icon-box" style="background: ${iconConfig.bg}; color: ${iconConfig.color};">
            <i class="fa-solid ${iconConfig.icon}"></i>
          </div>
        </div>

        <h4 class="reg-notice-title">${escapeHTML(notice.title)}</h4>
        <p class="reg-notice-desc">${escapeHTML(notice.description)}</p>
      </div>

      <div>
        <div class="reg-card-meta">
          <span><i class="fa-regular fa-calendar"></i> ${formattedDate}</span>
          ${formattedDeadline ? `
            <span class="meta-reg-deadline"><i class="fa-regular fa-hourglass-half"></i> Deadline: ${formattedDeadline}</span>
          ` : ''}
        </div>

        <button class="btn-card-link">
          <span>View Details</span> <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </article>
  `;
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

function getCategoryIconConfig(cat) {
  switch (cat) {
    case 'Workshops':
      return { icon: 'fa-chalkboard-user', bg: '#ede7fc', color: '#7c3aed' };
    case 'Competitions':
      return { icon: 'fa-trophy', bg: '#fcefdc', color: '#ea580c' };
    case 'Internships':
      return { icon: 'fa-briefcase', bg: '#e0f0fd', color: '#0284c7' };
    case 'Important Notices':
      return { icon: 'fa-file-lines', bg: '#fef2f2', color: '#dc2626' };
    default:
      return { icon: 'fa-bullhorn', bg: '#f4efe9', color: '#18181b' };
  }
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isRecentlyAdded(dateStr, hours = 72) {
  if (!dateStr) return false;
  const d = new Date(dateStr).getTime();
  if (isNaN(d)) return false;
  const diffHours = (Date.now() - d) / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= hours;
}

// ==========================================================================
// 5. NOTICE DETAIL MODAL & PDF GENERATOR
// ==========================================================================
function openNoticeDetailModal(id) {
  const notice = AppState.notices.find(n => n.id === id);
  if (!notice) return;

  AppState.activeModalNotice = notice;

  const modal = document.getElementById('noticeDetailModal');
  const catPill = document.getElementById('detailModalCategoryPill');
  const newPill = document.getElementById('detailModalNewPill');
  const impPill = document.getElementById('detailModalImpPill');
  const title = document.getElementById('detailModalTitle');
  const dateEl = document.getElementById('detailModalDate');
  const deadlineGroup = document.getElementById('detailModalDeadlineGroup');
  const deadlineEl = document.getElementById('detailModalDeadline');
  const bodyEl = document.getElementById('detailModalBody');
  const attBox = document.getElementById('detailModalAttBox');
  const attName = document.getElementById('detailAttName');
  const attDownloadBtn = document.getElementById('detailAttDownloadBtn');
  const attIcon = document.getElementById('detailAttIcon');

  if (catPill) {
    catPill.textContent = notice.category.toUpperCase();
    catPill.className = `category-pill ${getCategoryPillClass(notice.category)}`;
  }

  const isNew = isRecentlyAdded(notice.date, 72);
  if (newPill) newPill.style.display = isNew ? 'inline-block' : 'none';
  if (impPill) impPill.style.display = notice.isImportant ? 'inline-block' : 'none';

  if (title) title.textContent = notice.title;
  if (dateEl) dateEl.textContent = formatDisplayDate(notice.date);

  if (deadlineGroup && deadlineEl) {
    if (notice.deadline) {
      deadlineGroup.style.display = 'inline-flex';
      deadlineEl.textContent = formatDisplayDate(notice.deadline);
    } else {
      deadlineGroup.style.display = 'none';
    }
  }

  if (bodyEl) bodyEl.textContent = notice.description;

  // Attachment
  if (notice.attachment && attBox) {
    attBox.style.display = 'flex';
    if (attName) attName.textContent = notice.attachment.name;
    if (attIcon) {
      attIcon.innerHTML = notice.attachment.type === 'image'
        ? '<i class="fa-solid fa-file-image"></i>'
        : '<i class="fa-solid fa-file-pdf"></i>';
    }
    if (attDownloadBtn) {
      if (notice.attachment.dataUrl) {
        attDownloadBtn.href = notice.attachment.dataUrl;
        attDownloadBtn.download = notice.attachment.name;
      } else {
        attDownloadBtn.href = "#";
        attDownloadBtn.onclick = (e) => {
          e.preventDefault();
          saveNoticeAsPdf(notice);
        };
      }
    }
  } else if (attBox) {
    attBox.style.display = 'none';
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeNoticeDetailModal() {
  const modal = document.getElementById('noticeDetailModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  AppState.activeModalNotice = null;
}

function saveNoticeAsPdf(notice) {
  if (!notice) notice = AppState.activeModalNotice;
  if (!notice) return;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Top Header Banner
    doc.setFillColor(250, 248, 245);
    doc.rect(0, 0, pageWidth, 36, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(24, 24, 27);
    doc.text("CAMPUSPULSE — OFFICIAL OPPORTUNITY & NOTICE", 20, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Category: ${notice.category.toUpperCase()} • Stay in the loop`, 20, 26);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(24, 24, 27);
    const splitTitle = doc.splitTextToSize(notice.title, 170);
    doc.text(splitTitle, 20, 48);

    // Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const metaY = 52 + (splitTitle.length * 6);
    doc.text(`Date Posted: ${formatDisplayDate(notice.date)} ${notice.deadline ? ' | Deadline: ' + formatDisplayDate(notice.deadline) : ''}`, 20, metaY);

    // Divider line
    doc.setDrawColor(234, 229, 222);
    doc.line(20, metaY + 5, 190, metaY + 5);

    // Body
    doc.setFontSize(10.5);
    doc.setTextColor(51, 65, 85);
    const splitBody = doc.splitTextToSize(notice.description, 170);
    doc.text(splitBody, 20, metaY + 16);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Verified CampusPulse Document • Scan Campus QR Code for Live Updates", pageWidth / 2, 280, { align: "center" });

    doc.save(`${notice.title.slice(0, 22).replace(/\s+/g, '_')}.pdf`);
    Toast.show("PDF Generated", "Downloaded official notice PDF.", "📄");
  } catch (e) {
    console.error(e);
    Toast.show("Error", "Could not generate PDF.", "⚠️");
  }
}

// ==========================================================================
// 6. QR CODE GENERATION & PUSH ALERTS
// ==========================================================================
function initQrCode() {
  const qrContainer = document.getElementById('qrCodeCanvas');
  if (!qrContainer) return;

  qrContainer.innerHTML = '';
  try {
    new QRCode(qrContainer, {
      text: window.location.href,
      width: 58,
      height: 58,
      colorDark: "#18181b",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch (e) {
    console.warn("QR generation error:", e);
  }

  // Copy portal link
  const btnCopy = document.getElementById('btnCopyPortalUrl');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        Toast.show("Link Copied!", "Notice board URL copied to clipboard.", "🔗");
      });
    });
  }
}

function initBrowserAlerts() {
  const btnAlerts = document.getElementById('btnEnableAlerts');
  const alertsLabel = document.getElementById('alertsBtnLabel');
  const btnBell = document.getElementById('btnBellAlerts');

  function requestPerm() {
    if (!('Notification' in window)) {
      Toast.show("Unsupported", "Desktop notifications not supported on this browser.", "ℹ️");
      return;
    }

    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        if (alertsLabel) alertsLabel.textContent = 'Notifications Active';
        Toast.show("Notifications Enabled!", "You'll be alerted when new opportunities drop.", "🔔");
        new Notification("CampusPulse Alerts Active", {
          body: "You're now subscribed to instant campus updates!"
        });
      } else {
        Toast.show("Alerts Disabled", "Permission was denied in browser settings.", "ℹ️");
      }
    });
  }

  if (btnAlerts) btnAlerts.addEventListener('click', requestPerm);
  if (btnBell) btnBell.addEventListener('click', requestPerm);
}

// ==========================================================================
// 7. TOAST STACK
// ==========================================================================
const Toast = {
  show(title, message, icon = '✨') {
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
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 250);
    }, 3800);
  }
};

// ==========================================================================
// 8. GLOBAL EVENT LISTENERS & NAVIGATION
// ==========================================================================
function setupEvents() {
  // Brand Logo Click
  const logoLink = document.getElementById('logoLink');
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      setFilter('All');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 4 Category Action Cards
  document.querySelectorAll('.cat-action-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.category;
      setFilter(cat);

      // Smooth scroll to Latest Opportunities
      const oppSection = document.getElementById('opportunities');
      if (oppSection) {
        oppSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Filter Chips in Latest Opportunities header
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      setFilter(chip.dataset.filter);
    });
  });

  // Search input & button
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const btnSearchArrow = document.getElementById('btnExecuteSearch');
  let debounce = null;

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';

      clearTimeout(debounce);
      debounce = setTimeout(() => {
        AppState.searchQuery = val;
        renderOpportunitiesSection();
      }, 160);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      AppState.searchQuery = '';
      renderOpportunitiesSection();
    });
  }

  if (btnSearchArrow) {
    btnSearchArrow.addEventListener('click', () => {
      const oppSection = document.getElementById('opportunities');
      if (oppSection) oppSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // "View all" link
  const btnViewAll = document.getElementById('btnViewAll');
  if (btnViewAll) {
    btnViewAll.addEventListener('click', (e) => {
      e.preventDefault();
      setFilter('All');
      const oppSection = document.getElementById('opportunities');
      if (oppSection) oppSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Reset filter button in empty state
  const btnResetFilters = document.getElementById('btnResetFilters');
  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
      AppState.searchQuery = '';
      setFilter('All');
    });
  }

  // Notice Detail Modal Close
  const btnCloseDetail = document.getElementById('btnCloseDetailModal');
  if (btnCloseDetail) btnCloseDetail.addEventListener('click', closeNoticeDetailModal);

  // Save PDF from modal
  const btnModalSavePdf = document.getElementById('btnModalSavePdf');
  if (btnModalSavePdf) {
    btnModalSavePdf.addEventListener('click', () => {
      saveNoticeAsPdf(AppState.activeModalNotice);
    });
  }

  // Share Notice Link from modal
  const btnModalShare = document.getElementById('btnModalShareNotice');
  if (btnModalShare) {
    btnModalShare.addEventListener('click', () => {
      if (AppState.activeModalNotice) {
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#notice-${AppState.activeModalNotice.id}`).then(() => {
          Toast.show("Notice Link Copied", "Share it with your batchmates.", "🔗");
        });
      }
    });
  }

  // Backdrop click to close modal
  window.addEventListener('click', (e) => {
    const detailModal = document.getElementById('noticeDetailModal');
    if (e.target === detailModal) closeNoticeDetailModal();
  });

  // Escape key to close modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNoticeDetailModal();
    }
  });

  // Nav link active toggle
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Cross-tab sync: if admin adds/edits a notice in /admin, auto-refresh student view!
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      loadNotices();
      renderAll();
      Toast.show("Board Updated", "New notices are now available.", "⚡");
    }
  });
}

function setFilter(cat) {
  AppState.activeFilter = cat;

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.filter.toLowerCase() === cat.toLowerCase());
  });

  renderOpportunitiesSection();
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

// ==========================================================================
// 9. BOOTSTRAP APPLICATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadNotices();
  initQrCode();
  initBrowserAlerts();
  setupEvents();
  renderAll();

  console.log("⚡ CampusPulse student board initialized!");
});
