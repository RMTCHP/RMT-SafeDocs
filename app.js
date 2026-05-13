const APP = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbxNvvqLyztF8qzkhUo0rCG6gw4I5zKzGUmOPGiTWIJdakBYiaP2hygWKOW-URdnosE/exec'
};

async function postAction(payload) {
  const res = await fetch(APP.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

function showLoading(text) {
  if (!window.Swal) return;
  Swal.fire({
    title: text || 'Processing...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });
}

function closeLoading() {
  if (window.Swal) Swal.close();
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
      const res = await postAction({ action: 'login', username, password });
      if (res.ok) {
        localStorage.setItem('rmt_token', res.token);
        localStorage.setItem('rmt_actor', username);
        window.location.href = './dashboard.html';
        return;
      }
      if (window.Swal) {
        await Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: res.error || 'Invalid username or password'
        });
      }
      document.getElementById('loginError').textContent = res.error || 'Login failed';
    } catch (err) {
      if (window.Swal) {
        await Swal.fire({
          icon: 'error',
          title: 'Connection Error',
          text: 'Cannot connect to server. Please try again.'
        });
      }
      document.getElementById('loginError').textContent = 'Connection error';
    }
  });
}

async function initDashboard() {
  if (!document.getElementById('docTableBody')) return;
  if (!requireSession()) return;
  const body = document.getElementById('docTableBody');
  const searchBox = document.getElementById('searchBox');
  const btnAdd = document.getElementById('btnAdd');
  const btnSettings = document.getElementById('btnSettings');
  const btnLogout = document.getElementById('btnLogout');
  let docs = [];

  btnLogout.onclick = () => {
    localStorage.removeItem('rmt_token');
    localStorage.removeItem('rmt_actor');
    window.location.href = './index.html';
  };

  btnAdd.onclick = async () => {
    const result = await Swal.fire({
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
    if (!res.ok) return Swal.fire('Error', res.error || 'Add failed', 'error');
    Swal.fire('Success', 'Created ' + res.docId, 'success');
    await loadDocuments();
  };

  btnSettings.onclick = async () => {
    showLoading('Loading users...');
    const usersRes = await postAction({ action: 'listUsers' });
    closeLoading();
    if (!usersRes.ok) return Swal.fire('Error', usersRes.error || 'Cannot load users', 'error');
    const userRows = (usersRes.users || []).map((u) => `<tr><td style="padding:8px;border-top:1px solid #edf1f5">${u.userId}</td><td style="padding:8px;border-top:1px solid #edf1f5">${u.username}</td><td style="padding:8px;border-top:1px solid #edf1f5">${u.role}</td><td style="padding:8px;border-top:1px solid #edf1f5">${u.status}</td><td style="padding:8px;border-top:1px solid #edf1f5">${u.createdDate}</td></tr>`).join('');
    const html = '<div style="text-align:left">' +
      '<div style="background:#f5fbfa;border:1px solid #d7ebe8;border-radius:12px;padding:12px;margin-bottom:12px">' +
      '<h3 style="margin:0 0 10px;font-size:15px">Add New User</h3>' +
      '<div style="display:grid;gap:8px">' +
      '<input id="sw-user" class="swal2-input" placeholder="Username" style="margin:0;width:100%">' +
      '<input id="sw-pass" class="swal2-input" type="password" placeholder="Password" style="margin:0;width:100%">' +
      '<select id="sw-role" class="swal2-select" style="margin:0;width:100%"><option value="user">User</option><option value="admin">Admin</option></select>' +
      '</div></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 8px">' +
      '<h3 style="margin:0;font-size:15px">Current Users</h3>' +
      '<span style="font-size:12px;color:#607080">Total: ' + (usersRes.users || []).length + '</span>' +
      '</div>' +
      '<div style="max-height:280px;overflow:auto;border:1px solid #e2e9ef;border-radius:10px">' +
      '<table style="width:100%;text-align:left;border-collapse:collapse">' +
      '<thead><tr style="background:#f8fbfd"><th style="padding:8px">ID</th><th style="padding:8px">Username</th><th style="padding:8px">Role</th><th style="padding:8px">Status</th><th style="padding:8px">Created</th></tr></thead>' +
      '<tbody>' + userRows + '</tbody></table></div></div>';
    const result = await Swal.fire({ title: 'User Settings', width: 920, html, showCancelButton: true, confirmButtonText: 'Add User', preConfirm: () => {
      const username = document.getElementById('sw-user').value.trim();
      const password = document.getElementById('sw-pass').value.trim();
      const role = document.getElementById('sw-role').value;
      if (!username || !password) {
        Swal.showValidationMessage('Please fill username and password');
        return false;
      }
      return { username, password, role };
    }});
    if (!result.isConfirmed) return;
    const addRes = await postAction({ action: 'addUser', actor: localStorage.getItem('rmt_actor') || 'admin', username: result.value.username, password: result.value.password, role: result.value.role });
    if (!addRes.ok) return Swal.fire('Error', addRes.error || 'Cannot add user', 'error');
    Swal.fire('Success', 'User created: ' + addRes.username, 'success');
  };

  async function onReplace(docId) {
    const result = await Swal.fire({
      title: 'Replace PDF - ' + docId,
      html: '<input id="sw-file" class="swal2-file" type="file" accept="application/pdf"><input id="sw-remark" class="swal2-input" placeholder="Remark (optional)">',
      showCancelButton: true,
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
    if (!res.ok) return Swal.fire('Error', res.error || 'Replace failed', 'error');
    Swal.fire('Success', docId + ' upgraded to v' + res.version, 'success');
    await loadDocuments();
  }

  async function onHistory(docId) {
    showLoading('Loading history...');
    const res = await postAction({ action: 'getDocumentHistory', docId });
    closeLoading();
    if (!res.ok) return Swal.fire('Error', res.error || 'Cannot load history', 'error');
    const rows = (res.history || []).map((h) => `<tr><td>${h.newVersion}</td><td>${h.action}</td><td>${h.actionBy}</td><td>${h.actionDate}</td><td>${h.remark || '-'}</td></tr>`).join('');
    Swal.fire({ title: 'History - ' + docId, width: 900, html: '<div style="overflow:auto"><table style="width:100%;text-align:left"><thead><tr><th>Version</th><th>Action</th><th>By</th><th>Date</th><th>Remark</th></tr></thead><tbody>' + rows + '</tbody></table></div>' });
  }

  function render(list) {
    body.innerHTML = '';
    list.forEach((d, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${d.docId}</td><td>${d.documentName}</td><td><span class="pill">v${d.version}</span></td><td>${d.updatedDate}</td><td><button data-act="qr" data-id="${d.docId}">QR</button></td><td><div class="actions"><button data-act="view" data-id="${d.docId}">View</button><button data-act="replace" data-id="${d.docId}">Replace</button><button data-act="history" data-id="${d.docId}">History</button></div></td>`;
      body.appendChild(tr);
    });
    body.querySelectorAll('button[data-act]').forEach((btn) => {
      btn.onclick = () => {
        const act = btn.getAttribute('data-act');
        const id = btn.getAttribute('data-id');
        const doc = docs.find((x) => String(x.docId) === String(id));
        if (act === 'qr' && doc) {
          Swal.fire({
            title: 'QR Code - ' + id,
            width: 420,
            html: '<div id="sw-qr" style="display:flex;justify-content:center;padding:8px 0"></div><p style="font-size:12px;color:#66798b;margin:8px 0 0;word-break:break-all">' + doc.qrUrl + '</p>',
            didOpen: () => {
              const node = document.getElementById('sw-qr');
              if (node) new QRCode(node, { text: doc.qrUrl, width: 220, height: 220 });
            }
          });
        }
        if (act === 'view') window.open('./view.html?docId=' + encodeURIComponent(id), '_blank');
        if (act === 'replace') onReplace(id);
        if (act === 'history') onHistory(id);
      };
    });
  }

  async function loadDocuments() {
    showLoading('Loading documents...');
    const res = await postAction({ action: 'listDocuments' });
    closeLoading();
    if (!res.ok) return Swal.fire('Error', res.error || 'Cannot load documents', 'error');
    docs = res.documents || [];
    render(docs);
  }

  searchBox.oninput = () => {
    const q = searchBox.value.toLowerCase().trim();
    if (!q) return render(docs);
    render(docs.filter((d) => String(d.docId).toLowerCase().includes(q) || String(d.documentName).toLowerCase().includes(q)));
  };

  await loadDocuments();
}

async function initView() {
  const frame = document.getElementById('pdfViewer');
  if (!frame) return;
  const qs = new URLSearchParams(window.location.search);
  const docId = qs.get('docId') || '';
  const title = document.getElementById('docTitle');
  const meta = document.getElementById('docMeta');
  const dl = document.getElementById('downloadLink');
  if (!docId) return (title.textContent = 'Missing docId');
  showLoading('Loading document...');
  const res = await postAction({ action: 'getDocumentByDocId', docId });
  closeLoading();
  if (!res.ok) return (title.textContent = res.error || 'Document not found');
  const d = res.document;
  title.textContent = `${d.documentName} (${d.docId})`;
  meta.textContent = `Version ${d.version} | Updated ${d.updatedDate}`;
  frame.src = d.viewerUrl;
  dl.href = d.downloadUrl;
  dl.textContent = `Download ${d.docId} v${d.version}`;
  dl.onclick = () => {
    if (window.Swal) {
      Swal.fire({
        title: 'Starting download...',
        timer: 1200,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });
    }
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  await initLogin();
  await initDashboard();
  await initView();
});
