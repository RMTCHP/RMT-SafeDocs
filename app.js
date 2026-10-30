const APP = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbxfzwAIoIGLZtbp11jHZPG_B5ifp_weRGcDTHAYCvmSNTbClUcSzgBtAU6FDPQOsA/exec'
};

async function postAction(payload) {
  const res = await fetch(APP.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

function themedSwal(options) {
  if (!window.Swal) return Promise.resolve({ isConfirmed: true });
  const baseCustomClass = {
    popup: 'rmt-swal',
    title: 'rmt-swal-title',
    htmlContainer: 'rmt-swal-html',
    confirmButton: 'rmt-swal-confirm',
    cancelButton: 'rmt-swal-cancel'
  };
  const mergedCustomClass = Object.assign({}, baseCustomClass, (options && options.customClass) || {});
  const defaults = {
    background: '#102535',
    color: '#f5fbff',
    buttonsStyling: false,
    customClass: mergedCustomClass
  };
  return Swal.fire(Object.assign({}, defaults, options || {}, { customClass: mergedCustomClass }));
}

function showLoading(text) {
  if (!window.Swal) return;
  themedSwal({
    title: text || 'Processing...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });
}

function closeLoading() {
  if (window.Swal) Swal.close();
}

function iconSvg(name) {
  const icons = {
    qr: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM17 17h4v4h-4zM14 19h2v2h-2z"/></svg>',
    view: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3.2"/></svg>',
    replace: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.3-6.4"/><path d="M18 2v4h-4"/><path d="M21 12a9 9 0 0 1-15.3 6.4"/><path d="M6 22v-4h4"/></svg>',
    history: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/><path d="M12 7v6l4 2"/></svg>',
    delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M7 7l1 13h8l1-13"/><path d="M10 11v6M14 11v6"/></svg>'
  };
  return icons[name] || '';
}

function buildHistoryTimelineHtml(doc, history) {
  const docId = doc && doc.docId ? doc.docId : '-';
  const docName = doc && doc.documentName ? doc.documentName : docId;
  if (!history || history.length === 0) {
    return '<div class="history-empty">No revision history</div>';
  }

  const latestVersion = Math.max.apply(null, history.map((h) => Number(h.newVersion || 0)));
  const nodes = history.map((h, idx) => {
    const version = Number(h.newVersion || 0);
    const isLatest = version === latestVersion;
    const userName = String(h.actionBy || '-');
    const initials = userName ? userName.substring(0, 1).toUpperCase() : '?';
    return (
      '<article class="history-item' + (isLatest ? ' is-latest' : '') + '">' +
      '<span class="history-marker"></span>' +
      (idx < history.length - 1 ? '<span class="history-line"></span>' : '') +
      '<div class="history-card">' +
      '<div class="history-card-head">' +
      '<span class="history-date">' + (h.actionDate || '-') + '</span>' +
      '<span class="history-version">v' + version + (isLatest ? ' Latest' : '') + '</span>' +
      '</div>' +
      '<div class="history-remark">' + (h.remark || h.action || '-') + '</div>' +
      '<div class="history-author">' +
      '<span class="history-avatar">' + initials + '</span>' +
      '<span>Updated by: ' + userName + '</span>' +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }).join('');

  return (
    '<section class="history-modal">' +
    '<div class="history-document">' +
    '<span>Document</span>' +
    '<strong>' + docName + '</strong>' +
    '<small>ID: ' + docId + '</small>' +
    '</div>' +
    '<div class="history-list">' + nodes + '</div>' +
    '</section>'
  );
}

function parseDateTimeSafe(dateText) {
  if (!dateText) return null;
  const isoLike = String(dateText).replace(' ', 'T');
  const d = new Date(isoLike);
  return isNaN(d.getTime()) ? null : d;
}

function isSameLocalDate(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function updateSummaryCards(docs) {
  const totalEl = document.getElementById('sumTotal');
  const todayEl = document.getElementById('sumToday');
  const weekEl = document.getElementById('sumWeek');
  const avgEl = document.getElementById('sumAvgVersion');
  if (!totalEl || !todayEl || !weekEl || !avgEl) return;

  const all = Array.isArray(docs) ? docs : [];
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  let todayCount = 0;
  let weekCount = 0;
  let versionSum = 0;

  all.forEach((d) => {
    const dt = parseDateTimeSafe(d.updatedDate);
    if (dt && isSameLocalDate(dt, now)) todayCount += 1;
    if (dt && dt >= sevenDaysAgo) weekCount += 1;
    versionSum += Number(d.version || 0);
  });

  const avgVersion = all.length ? (versionSum / all.length) : 0;
  totalEl.textContent = String(all.length);
  todayEl.textContent = String(todayCount);
  weekEl.textContent = String(weekCount);
  avgEl.textContent = avgVersion.toFixed(1);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function requireSession() {
  if (!localStorage.getItem('rmt_token')) {
    window.location.href = './index.html';
    return false;
  }
  return true;
}

async function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', async (ev) => {
    try {
      ev.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      if (window.Swal) {
        themedSwal({
          title: 'Signing in...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
      }
      const res = await postAction({ action: 'login', username, password });
      if (window.Swal) Swal.close();
      if (res.ok) {
        localStorage.setItem('rmt_token', res.token);
        localStorage.setItem('rmt_actor', username);
        if (window.Swal) {
          await themedSwal({
            icon: 'success',
            title: 'Login Success',
            timer: 900,
            showConfirmButton: false
          });
        }
        window.location.href = './dashboard.html';
        return;
      }
      if (window.Swal) {
        await themedSwal({
          icon: 'error',
          title: 'Login Failed',
          text: res.error || 'Invalid username or password'
        });
      }
      document.getElementById('loginError').textContent = res.error || 'Login failed';
      if (!window.Swal) alert(res.error || 'Login failed');
    } catch (err) {
      if (window.Swal) Swal.close();
      if (window.Swal) {
        await themedSwal({
          icon: 'error',
          title: 'Connection Error',
          text: 'Cannot connect to server. Please try again.'
        });
      }
      document.getElementById('loginError').textContent = 'Connection error';
      if (!window.Swal) alert('Connection error');
    }
  });
}

async function initDashboard() {
  if (!document.getElementById('docTableBody')) return;
  if (!requireSession()) return;
  const body = document.getElementById('docTableBody');
  const searchBox = document.getElementById('searchBox');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const btnAdd = document.getElementById('btnAdd');
  const btnSettings = document.getElementById('btnSettings');
  const btnLogout = document.getElementById('btnLogout');
  const documentPagination = document.getElementById('documentPagination');
  const summaryCards = Array.from(document.querySelectorAll('.summary-clickable'));
  const pageSize = 20;
  let docs = [];
  let activeSummaryFilter = 'all';
  let currentPage = 1;

  btnLogout.onclick = async () => {
    const result = await themedSwal({
      icon: 'warning',
      title: 'Logout?',
      text: 'You are about to sign out from this session.',
      showCancelButton: true,
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel',
      customClass: { confirmButton: 'rmt-swal-confirm rmt-swal-danger-confirm' }
    });
    if (!result.isConfirmed) return;
    localStorage.removeItem('rmt_token');
    localStorage.removeItem('rmt_actor');
    window.location.href = './index.html';
  };

  btnAdd.onclick = async () => {
    const result = await themedSwal({
      title: 'Add New Document',
      width: 760,
      html:
        '<section class="document-form-modal">' +
        '<p class="document-form-intro">Upload a controlled PDF document to Google Drive and generate a static QR code.</p>' +
        '<div class="document-form-fields">' +
        '<label class="document-form-field"><span>Document Name</span><input id="sw-name" class="swal2-input" placeholder="e.g. Safety Manual - Line A"></label>' +
        '<label class="document-upload-zone"><span>PDF File</span><input id="sw-file" class="swal2-file" type="file" accept=\"application/pdf\"><small>Allowed type: PDF, max size: 25 MB</small></label>' +
        '</div>' +
        '</section>',
      showCancelButton: true,
      confirmButtonText: 'Upload Document',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const name = document.getElementById('sw-name').value.trim();
        const file = document.getElementById('sw-file').files[0];
        if (!name || !file) {
          Swal.showValidationMessage('Please provide name and PDF file');
          return false;
        }
        return { name, file };
      }
    });
    if (!result.isConfirmed) return;
    const file = result.value.file;
    showLoading('Uploading PDF...');
    const res = await postAction({
      action: 'addDocument',
      documentName: result.value.name,
      actor: localStorage.getItem('rmt_actor') || 'admin',
      file: { name: file.name, mimeType: file.type, base64: await fileToBase64(file) }
    });
    closeLoading();
    if (!res.ok) return themedSwal({ icon: 'error', title: 'Error', text: res.error || 'Add failed' });
    themedSwal({ icon: 'success', title: 'Success', text: 'Created ' + res.docId });
    await loadDocuments();
  };

  btnSettings.onclick = async () => {
    showLoading('Loading users...');
    const usersRes = await postAction({ action: 'listUsers' });
    closeLoading();
    if (!usersRes.ok) return themedSwal({ icon: 'error', title: 'Error', text: usersRes.error || 'Cannot load users' });
    let users = usersRes.users || [];
    let notice = '';
    const modalHeader = () =>
      '<header class="user-admin-header">' +
      '<div><p class="user-admin-kicker">System Access</p><h3>User Management</h3><p>Manage system access and user accounts</p></div>' +
      '<button id="userAdminClose" class="user-admin-close" type="button" aria-label="Close user management">&times;</button>' +
      '</header>';
    const listRows = () => users.map((u) =>
      '<tr class="user-admin-row" data-user-row="' + u.username.toLowerCase() + '">' +
      '<td><div class="user-admin-identity"><strong>' + u.username + '</strong><span>' + u.userId + '</span></div></td>' +
      '<td><span class="settings-role-pill">' + u.role + '</span></td>' +
      '<td><span class="settings-status-pill">' + u.status + '</span></td>' +
      '<td><button class="user-admin-detail-btn" type="button" data-user-detail="' + u.userId + '">Details</button></td>' +
      '</tr>' +
      '<tr class="user-admin-detail-row" data-user-detail-row="' + u.userId + '" hidden><td colspan="4"><div><span>Created</span><strong>' + u.createdDate + '</strong><span>Created by</span><strong>' + (u.createdBy || '-') + '</strong></div></td></tr>'
    ).join('') || '<tr><td class="user-admin-empty" colspan="4">No user accounts found.</td></tr>';
    const listView = () =>
      modalHeader() +
      '<section class="user-admin-toolbar">' +
      '<span class="settings-badge">' + users.length + ' Users</span>' +
      '<label class="user-admin-search"><span aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg></span><input id="userAdminSearch" type="search" placeholder="Search username"></label>' +
      '<button id="userAdminAdd" class="user-admin-primary" type="button">+ Add User</button>' +
      '</section>' +
      (notice ? '<p class="user-admin-notice">' + notice + '</p>' : '') +
      '<section class="user-admin-table-wrap"><table class="user-admin-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + listRows() + '</tbody></table></section>' +
      '<footer class="user-admin-footer"><span>Total ' + users.length + ' user account' + (users.length === 1 ? '' : 's') + '</span><button id="userAdminFooterClose" class="user-admin-secondary" type="button">Close</button></footer>';
    const addView = () =>
      modalHeader() +
      '<button id="userAdminBack" class="user-admin-back" type="button">&larr; Back to Users</button>' +
      '<section class="user-admin-form-card">' +
      '<div class="user-admin-form-head"><span class="settings-card-icon">+</span><div><h4>Add User</h4><p>Create a username, password and access role.</p></div></div>' +
      '<form id="userAdminForm" class="user-admin-form-grid">' +
      '<label class="settings-field"><span>Username</span><input id="sw-user" class="settings-input" autocomplete="off" placeholder="e.g. somchai.s"></label>' +
      '<label class="settings-field"><span>Password</span><input id="sw-pass" class="settings-input" type="password" placeholder="Minimum 4 characters"></label>' +
      '<label class="settings-field user-admin-role-field"><span>Access Role</span><select id="sw-role" class="settings-select"><option value="user">User - View documents</option><option value="admin">Admin - Manage documents and users</option></select></label>' +
      '<p id="userAdminError" class="user-admin-inline-error" role="alert"></p>' +
      '<div class="user-admin-form-actions"><button id="userAdminCancel" class="user-admin-secondary" type="button">Cancel</button><button id="userAdminCreate" class="user-admin-primary" type="submit">Create User</button></div>' +
      '</form>' +
      '<p class="user-admin-form-note">User accounts are stored in the connected Google Sheet.</p>' +
      '</section>';
    await themedSwal({
      width: 860,
      html: '<div id="userAdminRoot" class="user-admin-root"></div>',
      background: '#102535',
      color: '#f5fbff',
      customClass: {
        popup: 'rmt-swal rmt-swal-settings',
        htmlContainer: 'rmt-swal-html rmt-swal-settings-html'
      },
      showConfirmButton: false,
      showCancelButton: false,
      didOpen: () => {
        const root = document.getElementById('userAdminRoot');
        if (!root) return;
        const bindClose = () => {
          const close = root.querySelector('#userAdminClose');
          const footerClose = root.querySelector('#userAdminFooterClose');
          if (close) close.onclick = () => Swal.close();
          if (footerClose) footerClose.onclick = () => Swal.close();
        };
        const renderList = () => {
          root.innerHTML = listView();
          bindClose();
          const search = root.querySelector('#userAdminSearch');
          const add = root.querySelector('#userAdminAdd');
          if (add) add.onclick = renderAdd;
          if (search) {
            search.oninput = () => {
              const query = search.value.toLowerCase().trim();
              root.querySelectorAll('[data-user-row]').forEach((row) => {
                const matched = !query || row.getAttribute('data-user-row').includes(query);
                row.hidden = !matched;
                const detail = root.querySelector('[data-user-detail-row="' + row.querySelector('[data-user-detail]').getAttribute('data-user-detail') + '"]');
                if (!matched && detail) detail.hidden = true;
              });
            };
          }
          root.querySelectorAll('[data-user-detail]').forEach((button) => {
            button.onclick = () => {
              const detail = root.querySelector('[data-user-detail-row="' + button.getAttribute('data-user-detail') + '"]');
              if (detail) detail.hidden = !detail.hidden;
            };
          });
        };
        const renderAdd = () => {
          root.innerHTML = addView();
          bindClose();
          const back = root.querySelector('#userAdminBack');
          const cancel = root.querySelector('#userAdminCancel');
          const form = root.querySelector('#userAdminForm');
          if (back) back.onclick = renderList;
          if (cancel) cancel.onclick = renderList;
          if (form) form.onsubmit = async (event) => {
            event.preventDefault();
            const username = root.querySelector('#sw-user').value.trim();
            const password = root.querySelector('#sw-pass').value.trim();
            const role = root.querySelector('#sw-role').value;
            const error = root.querySelector('#userAdminError');
            const create = root.querySelector('#userAdminCreate');
            if (!username || !password) {
              if (error) error.textContent = 'Please fill username and password.';
              return;
            }
            if (create) {
              create.disabled = true;
              create.textContent = 'Creating...';
            }
            try {
              const addRes = await postAction({ action: 'addUser', actor: localStorage.getItem('rmt_actor') || 'admin', username, password, role });
              if (!addRes.ok) {
                if (error) error.textContent = addRes.error || 'Cannot add user.';
                if (create) {
                  create.disabled = false;
                  create.textContent = 'Create User';
                }
                return;
              }
              const refreshed = await postAction({ action: 'listUsers' });
              if (refreshed.ok) users = refreshed.users || users;
              notice = 'User created: ' + addRes.username;
              renderList();
            } catch (err) {
              if (error) error.textContent = 'Cannot connect to server. Please try again.';
              if (create) {
                create.disabled = false;
                create.textContent = 'Create User';
              }
            }
          };
        };
        renderList();
      }
    });
  };

  async function onReplace(doc) {
    const docId = doc.docId;
    const docName = doc.documentName || docId;
    const result = await themedSwal({
      title: 'Replace PDF - ' + docName,
      width: 760,
      html:
        '<section class="document-form-modal">' +
        '<p class="document-form-intro">Upload a new revision file. The existing QR code remains active and opens the latest version.</p>' +
        '<div class="document-form-fields">' +
        '<label class="document-upload-zone"><span>New PDF Revision</span><input id="sw-file" class="swal2-file" type="file" accept="application/pdf"><small>Allowed type: PDF, max size: 25 MB</small></label>' +
        '<label class="document-form-field"><span>Revision Remark <em>Optional</em></span><input id="sw-remark" class="swal2-input" placeholder="e.g. Update section 4.2 for machine setup"></label>' +
        '</div>' +
        '</section>',
      showCancelButton: true,
      confirmButtonText: 'Upload Revision',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const file = document.getElementById('sw-file').files[0];
        const remark = document.getElementById('sw-remark').value.trim();
        if (!file) {
          Swal.showValidationMessage('Please choose PDF file');
          return false;
        }
        return { file, remark };
      }
    });
    if (!result.isConfirmed) return;
    const file = result.value.file;
    showLoading('Uploading new revision...');
    const res = await postAction({
      action: 'replaceDocument',
      docId,
      remark: result.value.remark,
      actor: localStorage.getItem('rmt_actor') || 'admin',
      file: { name: file.name, mimeType: file.type, base64: await fileToBase64(file) }
    });
    closeLoading();
    if (!res.ok) return themedSwal({ icon: 'error', title: 'Error', text: res.error || 'Replace failed' });
    themedSwal({ icon: 'success', title: 'Success', text: docId + ' upgraded to v' + res.version });
    await loadDocuments();
  }

  async function onHistory(doc) {
    const docId = doc.docId;
    showLoading('Loading history...');
    const res = await postAction({ action: 'getDocumentHistory', docId });
    closeLoading();
    if (!res.ok) return themedSwal({ icon: 'error', title: 'Error', text: res.error || 'Cannot load history' });
    const html = buildHistoryTimelineHtml(doc, res.history || []);
    themedSwal({
      title: 'Revision History',
      width: 920,
      html: html,
      confirmButtonText: 'Close'
    });
  }

  async function onDelete(docId) {
    const result = await themedSwal({
      icon: 'warning',
      title: 'Delete Document?',
      text: docId + ' will be set inactive and hidden from dashboard.',
      input: 'text',
      inputLabel: 'Remark (optional)',
      inputPlaceholder: 'Reason for deletion',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      customClass: { confirmButton: 'rmt-swal-confirm rmt-swal-danger-confirm' }
    });
    if (!result.isConfirmed) return;
    showLoading('Deleting document...');
    const res = await postAction({
      action: 'deleteDocument',
      docId,
      remark: result.value || '',
      actor: localStorage.getItem('rmt_actor') || 'admin'
    });
    closeLoading();
    if (!res.ok) return themedSwal({ icon: 'error', title: 'Error', text: res.error || 'Delete failed' });
    themedSwal({ icon: 'success', title: 'Deleted', text: docId + ' removed from active list.' });
    await loadDocuments();
  }

  function render(list) {
    const totalItems = list.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const pageStart = (currentPage - 1) * pageSize;
    const pageItems = list.slice(pageStart, pageStart + pageSize);
    body.innerHTML = '';
    pageItems.forEach((d, idx) => {
      const tr = document.createElement('tr');
      const fileIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5"/><path d="M10 14h4M10 18h4"/></svg>';
      tr.innerHTML = `<td><div class="doc-identity"><span class="doc-file-icon">${fileIcon}</span><span class="doc-identity-copy"><span class="doc-name">${d.documentName}</span><span class="doc-id">${d.docId}</span></span></div></td><td><span class="pill">v${d.version}</span></td><td><span class="doc-updated">${d.updatedDate}</span></td><td><button class="icon-btn" title="QR Code" aria-label="Show QR code" data-act="qr" data-id="${d.docId}">${iconSvg('qr')}</button></td><td><div class="actions"><button class="icon-btn" title="View document" aria-label="View document" data-act="view" data-id="${d.docId}">${iconSvg('view')}</button><button class="icon-btn" title="Update PDF" aria-label="Update PDF" data-act="replace" data-id="${d.docId}">${iconSvg('replace')}</button><button class="icon-btn" title="Version history" aria-label="View version history" data-act="history" data-id="${d.docId}">${iconSvg('history')}</button><button class="icon-btn icon-danger" title="Delete document" aria-label="Delete document" data-act="delete" data-id="${d.docId}">${iconSvg('delete')}</button></div></td>`;
      body.appendChild(tr);
    });
    renderPagination(totalItems, totalPages, pageStart);
    body.querySelectorAll('button[data-act]').forEach((btn) => {
      btn.onclick = () => {
        const act = btn.getAttribute('data-act');
        const id = btn.getAttribute('data-id');
        const doc = docs.find((x) => String(x.docId) === String(id));
        if (act === 'qr' && doc) {
          themedSwal({
            title: 'QR Code - ' + id,
            width: 460,
            showCloseButton: true,
            customClass: {
              popup: 'rmt-swal rmt-swal-qr',
              title: 'rmt-swal-title rmt-swal-qr-title',
              htmlContainer: 'rmt-swal-html rmt-swal-qr-html',
              closeButton: 'rmt-swal-qr-close'
            },
            html: '<section class="qr-modal"><div class="qr-modal-document"><span class="qr-modal-label">Document</span><strong id="swQrDocumentName" class="qr-modal-document-name"></strong><span id="swQrDocumentId" class="qr-modal-document-id"></span></div><div class="qr-modal-code-card"><div id="sw-qr" class="qr-modal-code"></div></div><p class="qr-modal-help">Scan to open the latest controlled document.</p><p id="swQrUrl" class="qr-modal-url"></p><button id="btnDownloadQr" class="qr-download-button" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14"/></svg>Download QR</button></section>',
            didOpen: () => {
              const node = document.getElementById('sw-qr');
              const documentName = document.getElementById('swQrDocumentName');
              const documentId = document.getElementById('swQrDocumentId');
              const qrUrl = document.getElementById('swQrUrl');
              if (documentName) documentName.textContent = doc.documentName || id;
              if (documentId) documentId.textContent = id;
              if (qrUrl) qrUrl.textContent = doc.qrUrl || '';
              if (node) {
                new QRCode(node, { text: doc.qrUrl, width: 220, height: 220 });
              }
              const btnDownloadQr = document.getElementById('btnDownloadQr');
              if (btnDownloadQr) {
                btnDownloadQr.onclick = () => {
                  const canvas = node ? node.querySelector('canvas') : null;
                  if (!canvas) return;
                  const link = document.createElement('a');
                  link.href = canvas.toDataURL('image/png');
                  link.download = id + '-qr.png';
                  link.click();
                };
              }
            }
          });
        }
        if (act === 'view') window.open('./view.html?docId=' + encodeURIComponent(id), '_blank');
        if (act === 'replace' && doc) onReplace(doc);
        if (act === 'history' && doc) onHistory(doc);
        if (act === 'delete') onDelete(id);
      };
    });
  }

  function renderPagination(totalItems, totalPages, pageStart) {
    if (!documentPagination) return;
    const firstItem = totalItems ? pageStart + 1 : 0;
    const lastItem = Math.min(pageStart + pageSize, totalItems);
    const pageNumbers = [];
    const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const lastPage = Math.min(totalPages, firstPage + 4);
    for (let page = firstPage; page <= lastPage; page += 1) pageNumbers.push(page);
    documentPagination.innerHTML =
      '<span class="pagination-summary">Showing ' + firstItem + '-' + lastItem + ' of ' + totalItems + ' documents</span>' +
      '<div class="pagination-controls">' +
      '<button class="pagination-button" type="button" data-page="prev" aria-label="Previous page"' + (currentPage === 1 ? ' disabled' : '') + '>Prev</button>' +
      pageNumbers.map((page) => '<button class="pagination-button' + (page === currentPage ? ' is-active' : '') + '" type="button" data-page="' + page + '" aria-label="Page ' + page + '"' + (page === currentPage ? ' aria-current="page"' : '') + '>' + page + '</button>').join('') +
      '<button class="pagination-button" type="button" data-page="next" aria-label="Next page"' + (currentPage === totalPages ? ' disabled' : '') + '>Next</button>' +
      '</div>';
    documentPagination.querySelectorAll('button[data-page]').forEach((button) => {
      button.onclick = () => {
        const target = button.getAttribute('data-page');
        if (target === 'prev') currentPage -= 1;
        else if (target === 'next') currentPage += 1;
        else currentPage = Number(target);
        applyFilters(false);
      };
    });
  }

  function docsBySummaryFilter(list, key) {
    const all = Array.isArray(list) ? list : [];
    if (key === 'all') return all;
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    if (key === 'today') {
      return all.filter((d) => {
        const dt = parseDateTimeSafe(d.updatedDate);
        return dt ? isSameLocalDate(dt, now) : false;
      });
    }
    if (key === 'week') {
      return all.filter((d) => {
        const dt = parseDateTimeSafe(d.updatedDate);
        return dt ? dt >= sevenDaysAgo : false;
      });
    }
    return all;
  }

  function setActiveSummaryCard(key) {
    summaryCards.forEach((card) => {
      const cardKey = card.getAttribute('data-filter');
      card.classList.toggle('is-active', cardKey === key);
    });
  }

  function applyFilters(resetPage = true) {
    if (resetPage) currentPage = 1;
    const q = searchBox.value.toLowerCase().trim();
    const bySummary = docsBySummaryFilter(docs, activeSummaryFilter);
    if (!q) {
      render(bySummary);
      return;
    }
    render(bySummary.filter((d) =>
      String(d.docId).toLowerCase().includes(q) ||
      String(d.documentName).toLowerCase().includes(q)
    ));
  }

  async function loadDocuments() {
    showLoading('Loading documents...');
    const res = await postAction({ action: 'listDocuments' });
    closeLoading();
    if (!res.ok) return themedSwal({ icon: 'error', title: 'Error', text: res.error || 'Cannot load documents' });
    docs = res.documents || [];
    updateSummaryCards(docs);
    applyFilters();
  }

  summaryCards.forEach((card) => {
    card.onclick = () => {
      activeSummaryFilter = card.getAttribute('data-filter') || 'all';
      setActiveSummaryCard(activeSummaryFilter);
      applyFilters();
    };
  });

  searchBox.oninput = () => applyFilters();
  if (btnClearSearch) {
    btnClearSearch.onclick = () => {
      searchBox.value = '';
      applyFilters();
      searchBox.focus();
    };
  }

  await loadDocuments();
}

async function initView() {
  const pages = document.getElementById('pdfPages');
  if (!pages) return;
  const qs = new URLSearchParams(window.location.search);
  const docId = qs.get('docId') || '';
  const title = document.getElementById('docTitle');
  const meta = document.getElementById('docMeta');
  const dl = document.getElementById('downloadLink');
  const openLink = document.getElementById('openLink');
  const loading = document.getElementById('pdfLoading');
  const loadingTitle = document.getElementById('pdfLoadingTitle');
  const loadingText = document.getElementById('pdfLoadingText');
  const overlay = document.getElementById('viewerOverlay');
  const overlayTitle = document.getElementById('viewerOverlayTitle');
  const overlayText = document.getElementById('viewerOverlayText');
  const isMobileViewer = window.matchMedia('(max-width: 820px)').matches;
  const setViewerLoading = (head, text) => {
    if (loadingTitle) loadingTitle.textContent = head || 'Loading document...';
    if (loadingText) loadingText.textContent = text || '';
    if (loading) loading.classList.remove('is-hidden');
    if (overlayTitle) overlayTitle.textContent = head || 'Loading document...';
    if (overlayText) overlayText.textContent = text || '';
    if (overlay) overlay.classList.remove('is-hidden');
  };
  const clearViewerLoading = () => {
    if (loading) loading.classList.add('is-hidden');
    if (overlay) overlay.classList.add('is-hidden');
  };
  if (!docId) return (title.textContent = 'Missing docId');
  let objectUrl = null;
  setViewerLoading('Loading document...', 'Reading document metadata');
  const res = await postAction({ action: 'getDocumentByDocId', docId });
  if (!res.ok) {
    clearViewerLoading();
    return (title.textContent = res.error || 'Document not found');
  }
  const d = res.document;
  title.textContent = d.documentName;
  meta.textContent = `Version ${d.version} | Updated ${d.updatedDate}`;
  setViewerLoading('Loading document...', 'Downloading PDF file from server');
  const fileRes = await postAction({ action: 'getDocumentFile', docId });
  if (!fileRes.ok || !fileRes.file || !fileRes.file.base64) {
    clearViewerLoading();
    return themedSwal({
      icon: 'error',
      title: 'Open failed',
      text: (fileRes && fileRes.error) || 'Cannot load PDF file'
    });
  }
  const fileData = fileRes.file;
  const binary = atob(fileData.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: fileData.mimeType || 'application/pdf' });
  objectUrl = URL.createObjectURL(blob);
  if (openLink) {
    openLink.href = objectUrl;
    openLink.textContent = isMobileViewer ? 'Open Full PDF' : 'Open PDF';
  }
  dl.href = objectUrl;
  dl.download = fileData.fileName || `${d.docId}_v${d.version}.pdf`;
  dl.textContent = `Download ${d.docId} v${d.version}`;
  dl.onclick = () => {
    themedSwal({
      title: 'Preparing download...',
      timer: 900,
      showConfirmButton: false,
      didOpen: () => {
        if (window.Swal) Swal.showLoading();
      }
    });
  };
  pages.innerHTML = '';
  if (!window.pdfjsLib) {
    clearViewerLoading();
    const fallback = document.createElement('div');
    fallback.className = 'pdf-page-card';
    fallback.innerHTML = '<div class="pdf-page-head"><span class="pdf-page-label">Preview unavailable</span></div><p class="muted">PDF viewer library could not be loaded. Please use the download button.</p>';
    pages.appendChild(fallback);
    return;
  }
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    setViewerLoading('Rendering PDF...', 'Preparing document pages');
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      setViewerLoading('Rendering PDF...', `Rendering page ${pageNumber} of ${pdf.numPages}`);
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(320, pages.clientWidth - (isMobileViewer ? 20 : 28));
      const fitScale = availableWidth / baseViewport.width;
      const renderScale = isMobileViewer ? Math.min(fitScale, 0.82) : Math.min(fitScale, 1.35);
      const viewport = page.getViewport({ scale: renderScale });
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      const context = canvas.getContext('2d');
      const outputScale = isMobileViewer ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
      await page.render({ canvasContext: context, viewport }).promise;

      const card = document.createElement('div');
      card.className = 'pdf-page-card';
      card.innerHTML = `<div class="pdf-page-head"><span class="pdf-page-label">Page ${pageNumber}</span><span class="pdf-page-size">${Math.round(baseViewport.width)} x ${Math.round(baseViewport.height)}</span></div>`;
      card.appendChild(canvas);
      pages.appendChild(card);
      if (isMobileViewer) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  } catch (err) {
    const fallback = document.createElement('div');
    fallback.className = 'pdf-page-card';
    fallback.innerHTML = '<div class="pdf-page-head"><span class="pdf-page-label">Preview limited on this device</span></div><p class="muted">Tap Open Full PDF to use your phone or tablet PDF viewer directly.</p>';
    pages.appendChild(fallback);
    if (isMobileViewer && openLink) {
      setTimeout(() => openLink.click(), 250);
    } else {
      themedSwal({
        icon: 'warning',
        title: 'Preview issue',
        text: err && err.message ? err.message : 'Cannot render PDF preview'
      });
    }
  }
  clearViewerLoading();
  window.addEventListener('beforeunload', () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, { once: true });
}

document.addEventListener('DOMContentLoaded', async () => {
  await initLogin();
  await initDashboard();
  await initView();
});



