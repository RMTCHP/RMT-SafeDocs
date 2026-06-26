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
    background: '#ffffff',
    color: '#132433',
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
    return '<div style="padding:16px;border:1px solid #e2e9ef;border-radius:12px;background:#fff">No revision history</div>';
  }

  const latestVersion = Math.max.apply(null, history.map((h) => Number(h.newVersion || 0)));
  const nodes = history.map((h, idx) => {
    const version = Number(h.newVersion || 0);
    const isLatest = version === latestVersion;
    const userName = String(h.actionBy || '-');
    const initials = userName ? userName.substring(0, 1).toUpperCase() : '?';
    const bg = isLatest ? '#eef6f4' : '#ffffff';
    const border = isLatest ? '#bfe0d8' : '#dbe3ea';
    const badgeBg = isLatest ? '#0f766e' : '#eef2f6';
    const badgeColor = isLatest ? '#ffffff' : '#4a5c6f';
    return (
      '<div style="position:relative;padding-left:34px;margin-bottom:14px">' +
      '<div style="position:absolute;left:0;top:2px;width:18px;height:18px;border-radius:999px;background:' + (isLatest ? '#0f766e' : '#fff') + ';border:2px solid ' + (isLatest ? '#0f766e' : '#b8c4cf') + ';"></div>' +
      (idx < history.length - 1 ? '<div style="position:absolute;left:8px;top:22px;width:2px;height:calc(100% + 8px);background:#dbe3ea;"></div>' : '') +
      '<div style="border:1px solid ' + border + ';background:' + bg + ';border-radius:12px;padding:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">' +
      '<span style="font-weight:700;color:#1f3447">' + (h.actionDate || '-') + '</span>' +
      '<span style="font-size:12px;padding:3px 8px;border-radius:999px;background:' + badgeBg + ';color:' + badgeColor + '">v' + version + (isLatest ? ' (latest)' : '') + '</span>' +
      '</div>' +
      '<div style="font-size:13px;color:#4c5f73;line-height:1.5">' + (h.remark || h.action || '-') + '</div>' +
      '<div style="margin-top:8px;display:flex;align-items:center;gap:8px;font-size:12px;color:#5d7083">' +
      '<div style="width:20px;height:20px;border-radius:999px;background:#1f4b7a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">' + initials + '</div>' +
      '<span>????????: ' + userName + '</span>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }).join('');

  return (
    '<div style="text-align:left">' +
    '<div style="margin-bottom:10px;padding:10px 12px;border:1px solid #dbe3ea;background:#f5f8fb;border-radius:10px;">' +
    '<div style="font-size:13px;color:#5c7185">Document</div>' +
    '<div style="font-weight:800;color:#12273a;font-size:15px">' + docName + '</div>' +
    '<div style="font-size:12px;color:#72869a;margin-top:2px">ID: ' + docId + '</div>' +
    '</div>' +
    '<div style="max-height:420px;overflow:auto;padding-right:4px">' + nodes + '</div>' +
    '</div>'
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
  const summaryCards = Array.from(document.querySelectorAll('.summary-clickable'));
  let docs = [];
  let activeSummaryFilter = 'all';

  btnLogout.onclick = async () => {
    const result = await themedSwal({
      icon: 'warning',
      title: 'Logout?',
      text: 'You are about to sign out from this session.',
      showCancelButton: true,
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel'
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
        '<div style="text-align:left">' +
        '<p style="margin:0 0 12px;color:#5f6f7f;font-size:13px">Upload a controlled PDF document to Google Drive and generate a static QR code.</p>' +
        '<div style="display:grid;gap:12px">' +
        '<div>' +
        '<label style="display:block;margin-bottom:6px;font-weight:700;color:#1f3447">Document Name</label>' +
        '<input id="sw-name" class="swal2-input" placeholder="e.g. Safety Manual - Line A" style="margin:0;width:100%">' +
        '</div>' +
        '<div style="border:1px dashed #aac6cf;border-radius:12px;background:#f7fcfb;padding:14px">' +
        '<label style="display:block;margin-bottom:8px;font-weight:700;color:#1f3447">PDF File</label>' +
        '<input id="sw-file" class="swal2-file" type="file" accept=\"application/pdf\" style="margin:0;width:100%">' +
        '<p style="margin:8px 0 0;color:#688092;font-size:12px">Allowed type: PDF, max size: 25 MB</p>' +
        '</div>' +
        '</div>' +
        '</div>',
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
    const userRows = (usersRes.users || []).map((u) =>
      `<tr>
        <td>${u.userId}</td>
        <td>${u.username}</td>
        <td><span class="settings-role-pill">${u.role}</span></td>
        <td><span class="settings-status-pill">${u.status}</span></td>
        <td>${u.createdDate}</td>
      </tr>`
    ).join('');
    const html = '<div class="settings-modal">' +
      '<div class="settings-modal-head">' +
      '<div>' +
      '<p class="settings-kicker">System Access Control</p>' +
      '<h3 class="settings-heading">Manage user accounts for SafeDocs</h3>' +
      '</div>' +
      '<div class="settings-badge">Total Users: ' + (usersRes.users || []).length + '</div>' +
      '</div>' +
      '<div class="settings-tabs">' +
      '<button id="tabAdd" type="button" class="settings-tab is-active">Add User</button>' +
      '<button id="tabList" type="button" class="settings-tab">User List</button>' +
      '</div>' +
      '<div id="paneAdd" class="settings-pane">' +
      '<section class="settings-card settings-card-accent">' +
      '<div class="settings-card-head">' +
      '<span class="settings-card-icon">+</span>' +
      '<div><h4>Add New User</h4><p>Create credentials and assign access level.</p></div>' +
      '</div>' +
      '<div class="settings-form-grid">' +
      '<label class="settings-field"><span>Username</span><input id="sw-user" class="swal2-input settings-input" placeholder="Enter username"></label>' +
      '<label class="settings-field"><span>Password</span><input id="sw-pass" class="swal2-input settings-input" type="password" placeholder="Enter password"></label>' +
      '<label class="settings-field"><span>Role</span><select id="sw-role" class="swal2-select settings-select"><option value="user">User</option><option value="admin">Admin</option></select></label>' +
      '</div>' +
      '</section>' +
      '</div>' +
      '<div id="paneList" class="settings-pane" style="display:none">' +
      '<div class="settings-card">' +
      '<div class="settings-list-head">' +
      '<div><h4>Current Users</h4><p>Active credentials available in the system.</p></div>' +
      '<span class="settings-badge">Sheet Records: ' + (usersRes.users || []).length + '</span>' +
      '</div>' +
      '<div class="settings-table-wrap">' +
      '<table class="settings-table">' +
      '<thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Status</th><th>Created</th></tr></thead>' +
      '<tbody>' + userRows + '</tbody></table></div></div></div></div>';
    const result = await themedSwal({
      title: 'User Settings',
      width: 920,
      html,
      showCancelButton: true,
      confirmButtonText: 'Add User',
      didOpen: () => {
        const tabAdd = document.getElementById('tabAdd');
        const tabList = document.getElementById('tabList');
        const paneAdd = document.getElementById('paneAdd');
        const paneList = document.getElementById('paneList');
        if (!tabAdd || !tabList || !paneAdd || !paneList) return;
        const activateTab = (showAdd) => {
          paneAdd.style.display = showAdd ? '' : 'none';
          paneList.style.display = showAdd ? 'none' : '';
          tabAdd.classList.toggle('is-active', showAdd);
          tabList.classList.toggle('is-active', !showAdd);
        };
        tabAdd.onclick = () => {
          activateTab(true);
        };
        tabList.onclick = () => {
          activateTab(false);
        };
        activateTab(true);
      },
      preConfirm: () => {
        const paneAdd = document.getElementById('paneAdd');
        if (paneAdd && paneAdd.style.display === 'none') return false;
        const username = document.getElementById('sw-user').value.trim();
        const password = document.getElementById('sw-pass').value.trim();
        const role = document.getElementById('sw-role').value;
        if (!username || !password) {
          Swal.showValidationMessage('Please fill username and password');
          return false;
        }
        return { username, password, role };
      }
    });
    if (!result.isConfirmed) return;
    if (!result.value) return;
    const addRes = await postAction({ action: 'addUser', actor: localStorage.getItem('rmt_actor') || 'admin', username: result.value.username, password: result.value.password, role: result.value.role });
    if (!addRes.ok) return themedSwal({ icon: 'error', title: 'Error', text: addRes.error || 'Cannot add user' });
    themedSwal({ icon: 'success', title: 'Success', text: 'User created: ' + addRes.username });
  };

  async function onReplace(doc) {
    const docId = doc.docId;
    const docName = doc.documentName || docId;
    const result = await themedSwal({
      title: 'Replace PDF - ' + docName,
      width: 760,
      html:
        '<div style="text-align:left">' +
        '<p style="margin:0 0 12px;color:#5f6f7f;font-size:13px">Upload a new revision file. QR code will remain the same and users will see the latest version.</p>' +
        '<div style="display:grid;gap:12px">' +
        '<div style="border:1px dashed #aac6cf;border-radius:12px;background:#f7fcfb;padding:14px">' +
        '<label style="display:block;margin-bottom:8px;font-weight:700;color:#1f3447">New PDF Revision</label>' +
        '<input id="sw-file" class="swal2-file" type="file" accept="application/pdf" style="margin:0;width:100%">' +
        '<p style="margin:8px 0 0;color:#688092;font-size:12px">Allowed type: PDF, max size: 25 MB</p>' +
        '</div>' +
        '<div>' +
        '<label style="display:block;margin-bottom:6px;font-weight:700;color:#1f3447">Revision Remark (Optional)</label>' +
        '<input id="sw-remark" class="swal2-input" placeholder="e.g. Update section 4.2 for machine setup" style="margin:0;width:100%">' +
        '</div>' +
        '</div>' +
        '</div>',
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
      cancelButtonText: 'Cancel'
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
    body.innerHTML = '';
    list.forEach((d, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${d.docId}</td><td>${d.documentName}</td><td><span class="pill">v${d.version}</span></td><td>${d.updatedDate}</td><td><button class="icon-btn" title="QR Code" data-act="qr" data-id="${d.docId}">${iconSvg('qr')}</button></td><td><div class="actions"><button class="icon-btn" title="View" data-act="view" data-id="${d.docId}">${iconSvg('view')}</button><button class="icon-btn" title="Replace" data-act="replace" data-id="${d.docId}">${iconSvg('replace')}</button><button class="icon-btn" title="History" data-act="history" data-id="${d.docId}">${iconSvg('history')}</button><button class="icon-btn icon-danger" title="Delete" data-act="delete" data-id="${d.docId}">${iconSvg('delete')}</button></div></td>`;
      body.appendChild(tr);
    });
    body.querySelectorAll('button[data-act]').forEach((btn) => {
      btn.onclick = () => {
        const act = btn.getAttribute('data-act');
        const id = btn.getAttribute('data-id');
        const doc = docs.find((x) => String(x.docId) === String(id));
        if (act === 'qr' && doc) {
          themedSwal({
            title: 'QR Code - ' + id,
            width: 440,
            html: '<div id="sw-qr" style="display:flex;justify-content:center;padding:8px 0"></div><p style="font-size:12px;color:#66798b;margin:8px 0 12px;word-break:break-all">' + doc.qrUrl + '</p><div style="display:flex;justify-content:center"><button id="btnDownloadQr" type="button" style="padding:10px 14px;border-radius:10px;border:1px solid #d7e2ea;background:#fff;color:#274157;font-weight:700;cursor:pointer">Download QR</button></div>',
            didOpen: () => {
              const node = document.getElementById('sw-qr');
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

  function applyFilters() {
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



