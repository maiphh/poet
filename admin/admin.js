(() => {
  const API_BASE = window.POET_API_BASE;
  const TOKEN_KEY = 'poetAdminToken';
  const USER_KEY = 'poetAdminUser';

  const loginSection = document.getElementById('login-section');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('login-form');
  const loginUser = document.getElementById('login-username');
  const loginPass = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const loginSubmit = document.getElementById('login-submit');
  const currentUserEl = document.getElementById('current-user');
  const logoutBtn = document.getElementById('logout-btn');

  const toggle = document.getElementById('donations-toggle');
  const toggleLabel = document.getElementById('donations-toggle-label');
  const settingsStatus = document.getElementById('settings-status');

  const statusFilter = document.getElementById('status-filter');
  const hiddenFilter = document.getElementById('hidden-filter');
  const searchInput = document.getElementById('search-input');
  const reloadBtn = document.getElementById('reload-btn');
  const exportBtn = document.getElementById('export-btn');
  const historySummary = document.getElementById('history-summary');
  const historyBody = document.getElementById('history-body');
  const totalReceivedEl = document.getElementById('total-received');
  const totalReceivedCountEl = document.getElementById('total-received-count');
  const totalFilteredEl = document.getElementById('total-filtered');

  const passwordForm = document.getElementById('password-form');
  const currentPass = document.getElementById('current-password');
  const newPass = document.getElementById('new-password');
  const confirmPass = document.getElementById('confirm-password');
  const passwordError = document.getElementById('password-error');
  const passwordStatus = document.getElementById('password-status');
  const passwordSubmit = document.getElementById('password-submit');

  const recoverForm = document.getElementById('recover-form');
  const recoverUser = document.getElementById('recover-username');
  const recoverToken = document.getElementById('recover-token');
  const recoverPass = document.getElementById('recover-password');
  const recoverConfirm = document.getElementById('recover-confirm');
  const recoverError = document.getElementById('recover-error');
  const recoverStatus = document.getElementById('recover-status');
  const recoverSubmit = document.getElementById('recover-submit');

  const adminLayout = document.getElementById('admin-layout');
  const navToggle = document.getElementById('admin-nav-toggle');
  const sideNav = document.getElementById('admin-side-nav');
  const navButtons = document.querySelectorAll('.admin-nav-btn');
  const panels = document.querySelectorAll('.admin-panel');
  const NAV_COLLAPSE_KEY = 'poetAdminNavCollapsed';

  let allDonations = [];
  let totalReceived = 0;
  let receivedCount = 0;

  function token() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  function authHeaders(extra = {}) {
    return { ...extra, Authorization: `Bearer ${token()}` };
  }

  function money(n) {
    return new Intl.NumberFormat('vi-VN').format(n) + ' đ';
  }

  function fmtTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('vi-VN');
  }

  function isHidden(d) {
    return Boolean(d.hidden);
  }

  function showLogin() {
    loginSection.hidden = false;
    dashboard.hidden = true;
  }

  function showDashboard(username) {
    loginSection.hidden = true;
    dashboard.hidden = false;
    currentUserEl.textContent = username || '';
    switchTab('donations');
    loadSettings();
    loadHistory();
  }

  function setLoginError(text) {
    loginError.hidden = !text;
    loginError.textContent = text || '';
  }

  function setPasswordError(text) {
    passwordError.hidden = !text;
    passwordError.textContent = text || '';
  }

  function setPasswordStatus(text) {
    passwordStatus.textContent = text || '';
  }

  function setRecoverError(text) {
    recoverError.hidden = !text;
    recoverError.textContent = text || '';
  }

  function setRecoverStatus(text) {
    recoverStatus.textContent = text || '';
  }

  function setSettingsStatus(text) {
    settingsStatus.textContent = text || '';
  }

  function switchTab(tab) {
    if (!tab) return;
    navButtons.forEach((btn) => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('is-active', active);
      if (active) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    panels.forEach((panel) => {
      const active = panel.dataset.panel === tab;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  }

  if (sideNav) {
    sideNav.addEventListener('click', (event) => {
      const btn = event.target.closest('.admin-nav-btn');
      if (!btn || !sideNav.contains(btn)) return;
      event.preventDefault();
      switchTab(btn.dataset.tab);
    });
  }

  const desktopNavQuery = window.matchMedia('(min-width: 901px)');

  function isDesktopNav() {
    return desktopNavQuery.matches;
  }

  function setNavCollapsed(collapsed, { persist = true } = {}) {
    if (!adminLayout || !navToggle) return;
    const next = isDesktopNav() ? Boolean(collapsed) : false;
    adminLayout.classList.toggle('is-nav-collapsed', next);
    navToggle.setAttribute('aria-expanded', next ? 'false' : 'true');
    navToggle.title = next ? 'Mở rộng menu' : 'Thu gọn menu';
    const label = navToggle.querySelector('.admin-nav-toggle-label');
    if (label) label.textContent = next ? 'Mở' : 'Thu gọn';
    if (!persist) return;
    try {
      localStorage.setItem(NAV_COLLAPSE_KEY, next ? '1' : '0');
    } catch {
      // ignore quota / private mode
    }
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      if (!isDesktopNav()) return;
      setNavCollapsed(!adminLayout.classList.contains('is-nav-collapsed'));
    });
    const applyStoredCollapse = () => {
      let stored = false;
      try {
        stored = localStorage.getItem(NAV_COLLAPSE_KEY) === '1';
      } catch {
        stored = false;
      }
      setNavCollapsed(stored, { persist: false });
    };
    applyStoredCollapse();
    const onNavBreakpoint = () => applyStoredCollapse();
    if (typeof desktopNavQuery.addEventListener === 'function') {
      desktopNavQuery.addEventListener('change', onNavBreakpoint);
    } else if (typeof desktopNavQuery.addListener === 'function') {
      desktopNavQuery.addListener(onNavBreakpoint);
    }
  }

  function logout(localOnly) {
    const t = token();
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    showLogin();
    if (!localOnly && t) {
      fetch(`${API_BASE}/api/admin/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {});
    }
  }

  async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, options);
    if (res.status === 401) {
      logout(true);
      throw new Error('Phiên đăng nhập hết hạn. Đăng nhập lại nhé.');
    }
    return res;
  }

  // ---- Login ----

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setLoginError('');
    const username = loginUser.value.trim();
    const password = loginPass.value;
    if (!username || !password) {
      setLoginError('Nhập tên đăng nhập và mật khẩu.');
      return;
    }
    loginSubmit.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        setLoginError(data.error || 'Đăng nhập thất bại.');
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(USER_KEY, data.username || username);
      loginPass.value = '';
      showDashboard(data.username || username);
    } catch {
      setLoginError('Không kết nối được máy chủ. Thử lại giúp nhé.');
    } finally {
      loginSubmit.disabled = false;
    }
  });

  logoutBtn.addEventListener('click', () => logout(false));

  // ---- Password recovery (dev ADMIN_TOKEN) ----

  recoverForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setRecoverError('');
    setRecoverStatus('');
    const username = recoverUser.value.trim() || 'admin';
    const recoveryToken = recoverToken.value.trim();
    const next = recoverPass.value;
    const confirm = recoverConfirm.value;
    if (!recoveryToken) {
      setRecoverError('Nhập mã khôi phục ADMIN_TOKEN.');
      return;
    }
    if (next.length < 4 || next.length > 72) {
      setRecoverError('Mật khẩu mới phải từ 4 đến 72 ký tự.');
      return;
    }
    if (next !== confirm) {
      setRecoverError('Hai mật khẩu mới chưa khớp.');
      return;
    }
    recoverSubmit.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/api/admin/recover-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryToken, username, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRecoverError(data.error || 'Khôi phục thất bại.');
        return;
      }
      recoverToken.value = '';
      recoverPass.value = '';
      recoverConfirm.value = '';
      setRecoverStatus(`Đã đặt lại mật khẩu cho ${data.username || username}. Đăng nhập lại nhé.`);
      loginUser.value = data.username || username;
    } catch {
      setRecoverError('Không kết nối được máy chủ. Thử lại giúp nhé.');
    } finally {
      recoverSubmit.disabled = false;
    }
  });

  // ---- On/off toggle ----

  async function loadSettings() {
    setSettingsStatus('');
    toggle.disabled = true;
    toggleLabel.textContent = 'Đang tải…';
    try {
      const res = await api('/api/admin/settings', { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'bad status');
      toggle.checked = data.donationsEnabled !== false;
      toggleLabel.textContent = toggle.checked
        ? 'Đang nhận ủng hộ — form Ủng hộ mở.'
        : 'Đang tạm tắt — form Ủng hộ ẩn.';
    } catch (err) {
      toggleLabel.textContent = 'Chưa tải được trạng thái.';
      setSettingsStatus(err.message || 'Không tải được cài đặt.');
    } finally {
      toggle.disabled = false;
    }
  }

  toggle.addEventListener('change', async () => {
    const next = toggle.checked;
    toggle.disabled = true;
    setSettingsStatus('Đang lưu…');
    try {
      const res = await api('/api/admin/settings', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ donationsEnabled: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Lưu thất bại.');
      toggle.checked = data.donationsEnabled !== false;
      toggleLabel.textContent = toggle.checked
        ? 'Đang nhận ủng hộ — form Ủng hộ mở.'
        : 'Đang tạm tắt — form Ủng hộ ẩn.';
      setSettingsStatus('Đã lưu.');
    } catch (err) {
      toggle.checked = !next;
      setSettingsStatus(err.message || 'Lưu thất bại.');
    } finally {
      toggle.disabled = false;
    }
  });

  // ---- Donate history ----

  // Display only: PayOS links expire after 30 min (PAYMENT_TTL_SECONDS).
  // The row stays 'pending' in D1 so a late webhook can still mark it paid.
  const PAYMENT_TTL_MS = 30 * 60 * 1000;
  function isExpiredPending(d) {
    if (d.status !== 'pending' || !d.createdAt) return false;
    const t = Date.parse(d.createdAt);
    return Number.isFinite(t) && Date.now() - t > PAYMENT_TTL_MS;
  }
  function isManual(d) {
    return /^manual:/.test(d.payosReference || '') || /^manual:/.test(d.payosDescription || '');
  }
  function statusLabel(d) {
    if (isExpiredPending(d)) return 'hết hạn';
    if (d.status === 'success' && isManual(d)) return 'success · thủ công';
    return d.status || '—';
  }
  function manualNote(d) {
    if (!isManual(d) || !d.payosDescription) return '';
    // Drop the leading 'manual:<admin> | ' marker when PayOS later filled the reference.
    return d.payosDescription.replace(/^manual:[^|]*\|?\s*/, '').trim();
  }

  function filteredDonations() {
    const status = statusFilter.value;
    const q = searchInput.value.trim().toLowerCase();
    return allDonations.filter((d) => {
      if (status === 'expired') {
        if (!isExpiredPending(d)) return false;
      } else if (status === 'pending') {
        if (d.status !== 'pending' || isExpiredPending(d)) return false;
      } else if (status && d.status !== status) {
        return false;
      }
      if (!q) return true;
      const hay = [
        d.displayName,
        d.message,
        d.orderCode,
        d.status,
        statusLabel(d),
        d.counterAccountName,
        d.counterAccountNumber,
        d.counterAccountBankName,
        d.payosReference,
        d.payosAccountNumber,
        d.payosDescription,
        d.virtualAccountName,
        d.virtualAccountNumber,
        d.paymentLinkId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function updateTotals(rows) {
    totalReceivedEl.textContent = money(totalReceived);
    totalReceivedCountEl.textContent = String(receivedCount);
    const filteredSum = rows.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    totalFilteredEl.textContent = `${rows.length} khoản · ${money(filteredSum)}`;
  }

  function renderHistory() {
    const rows = filteredDonations();
    historyBody.textContent = '';
    updateTotals(rows);
    historySummary.textContent = `${rows.length}/${allDonations.length} khoản khớp bộ lọc.`;

    if (!rows.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 10;
      td.className = 'admin-table-empty';
      td.textContent = 'Chưa có khoản nào khớp.';
      tr.appendChild(td);
      historyBody.appendChild(tr);
      return;
    }

    rows.forEach((d) => {
      const tr = document.createElement('tr');
      if (isHidden(d)) tr.classList.add('is-hidden-row');

      const cells = [
        d.orderCode != null ? `#${d.orderCode}` : '—',
        statusLabel(d),
        money(d.amount),
        d.displayName || '—',
        d.message || '—',
        d.status === 'success' ? (isHidden(d) ? 'ẩn' : 'hiện') : '—',
        d.anonymous ? 'có' : 'không',
        fmtTime(d.createdAt),
        fmtTime(d.paidAt),
      ];

      cells.forEach((value, index) => {
        const td = document.createElement('td');
        td.textContent = value;
        if (index === 2) td.className = 'admin-table-amount';
        if (index === 4) td.className = 'admin-table-message';
        if (index === 5) {
          td.className = 'admin-table-hidden';
          if (isHidden(d)) td.classList.add('is-hidden');
        }
        if (index === 1 && d.status === 'success' && isManual(d)) {
          const who = (/^manual:([^|\s]+)/.exec(d.payosReference || '') ||
            /^manual:([^|\s]+)/.exec(d.payosDescription || '') || [])[1] || 'admin';
          const note = manualNote(d);
          td.textContent = '';
          td.append('success ');
          const tag = document.createElement('span');
          tag.textContent = 'thủ công';
          tag.title = `Xác nhận thủ công bởi ${who}`;
          tag.style.cssText = 'display:inline-block;padding:1px 8px;border-radius:999px;background:var(--yellow);border:1.5px solid var(--outline);font-size:12px;font-weight:800';
          td.appendChild(tag);
          if (note) {
            const n = document.createElement('div');
            n.textContent = `Ghi chú: ${note}`;
            n.style.cssText = 'font-size:12px;color:var(--ink-soft);margin-top:4px';
            td.appendChild(n);
          }
        }
        if (index === 1 && isExpiredPending(d)) {
          td.title = 'Link thanh toán đã hết hạn (quá 30 phút), vẫn giữ trạng thái pending';
          td.style.color = 'var(--ink-soft)';
          td.style.fontStyle = 'italic';
          tr.style.opacity = '0.7';
        }
        tr.appendChild(td);
      });

      const actionsTd = document.createElement('td');
      actionsTd.className = 'admin-table-actions';
      const actions = document.createElement('div');
      actions.className = 'admin-actions';

      if (d.status === 'success' && !isHidden(d)) {
        const hideBtn = document.createElement('button');
        hideBtn.type = 'button';
        hideBtn.className = 'button button-outline';
        hideBtn.textContent = 'Ẩn lời nhắn';
        hideBtn.addEventListener('click', () => actOn(d.orderCode, 'hide', hideBtn));
        actions.appendChild(hideBtn);
      } else if (d.status === 'success' && isHidden(d)) {
        const showBtn = document.createElement('button');
        showBtn.type = 'button';
        showBtn.className = 'button button-purple';
        showBtn.textContent = 'Hiện lời nhắn';
        showBtn.addEventListener('click', () => actOn(d.orderCode, 'show', showBtn));
        actions.appendChild(showBtn);
      } else {
        const span = document.createElement('span');
        span.className = 'admin-meta';
        span.textContent = '—';
        actions.appendChild(span);
      }

      actionsTd.appendChild(actions);
      tr.appendChild(actionsTd);
      historyBody.appendChild(tr);
    });
  }

  async function loadHistory() {
    historySummary.textContent = 'Đang tải lịch sử…';
    historyBody.textContent = '';
    try {
      // Hidden filter runs on the server (the list is row-limited).
      const hf = hiddenFilter ? hiddenFilter.value : 'all';
      const q = hf === 'all' ? '' : `?hidden=${encodeURIComponent(hf)}`;
      const res = await api(`/api/admin/donations${q}`, { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Không tải được lịch sử.');
      allDonations = data.donations || [];
      totalReceived = Number(data.totalReceived) || 0;
      receivedCount = Number(data.receivedCount) || 0;
      renderHistory();
    } catch (err) {
      historySummary.textContent = err.message || 'Không tải được lịch sử.';
      totalReceivedEl.textContent = '—';
      totalReceivedCountEl.textContent = '—';
      totalFilteredEl.textContent = '—';
    }
  }

  async function actOn(orderCode, action, btn) {
    btn.disabled = true;
    try {
      const res = await api(`/api/admin/donations/${orderCode}/${action}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Thao tác thất bại.');
      await loadHistory();
    } catch (err) {
      historySummary.textContent = err.message || 'Thao tác thất bại.';
      btn.disabled = false;
    }
  }

  function xmlEscape(value) {
    return String(value == null ? '' : value).replace(
      /[&<>"'\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
      (ch) => {
        if (ch === '&') return '&amp;';
        if (ch === '<') return '&lt;';
        if (ch === '>') return '&gt;';
        if (ch === '"') return '&quot;';
        if (ch === "'") return '&apos;';
        return '';
      },
    );
  }

  function colName(index) {
    let name = '';
    let n = index + 1;
    while (n > 0) {
      const rem = (n - 1) % 26;
      name = String.fromCharCode(65 + rem) + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  }

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32Bytes(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // Minimal ZIP writer (stored, no compression) — enough for a valid .xlsx.
  function zipStore(files) {
    const enc = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;
    const pushU16 = (v) => chunks.push([v & 0xff, (v >>> 8) & 0xff]);
    const pushU32 = (v) => chunks.push([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]);
    const pushBytes = (bytes) => chunks.push(Array.from(bytes));

    const centralStartCounts = [];
    files.forEach(({ name, data }) => {
      const nameBytes = enc.encode(name);
      const crc = crc32Bytes(data);
      const localOffset = offset;
      const local = [];
      const w16 = (v) => local.push(v & 0xff, (v >>> 8) & 0xff);
      const w32 = (v) => local.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
      // Local file header
      w32(0x04034b50);
      w16(20);
      w16(0x0800); // UTF-8 filenames
      w16(0); // stored
      w16(0);
      w16(0x21); // DOS date/time placeholder
      w32(crc);
      w32(data.length);
      w32(data.length);
      w16(nameBytes.length);
      w16(0);
      const header = new Uint8Array(local);
      const record = new Uint8Array(header.length + nameBytes.length + data.length);
      record.set(header, 0);
      record.set(nameBytes, header.length);
      record.set(data, header.length + nameBytes.length);
      pushBytes(record);
      offset += record.length;
      centralStartCounts.push({ nameBytes, crc, size: data.length, localOffset });
    });

    const centralOffset = offset;
    const centralBytes = [];
    centralStartCounts.forEach(({ nameBytes, crc, size, localOffset }) => {
      const c = [];
      const w16 = (v) => c.push(v & 0xff, (v >>> 8) & 0xff);
      const w32 = (v) => c.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
      w32(0x02014b50);
      w16(20);
      w16(20);
      w16(0x0800);
      w16(0);
      w16(0);
      w16(0x21);
      w32(crc);
      w32(size);
      w32(size);
      w16(nameBytes.length);
      w16(0);
      w16(0);
      w16(0);
      w16(0);
      w32(0);
      w32(localOffset);
      const header = new Uint8Array(c);
      const record = new Uint8Array(header.length + nameBytes.length);
      record.set(header, 0);
      record.set(nameBytes, header.length);
      for (let i = 0; i < record.length; i++) centralBytes.push(record[i]);
    });
    pushBytes(new Uint8Array(centralBytes));
    offset += centralBytes.length;

    const end = [];
    const e16 = (v) => end.push(v & 0xff, (v >>> 8) & 0xff);
    const e32 = (v) => end.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
    e32(0x06054b50);
    e16(0);
    e16(0);
    e16(files.length);
    e16(files.length);
    e32(centralBytes.length);
    e32(centralOffset);
    e16(0);
    pushBytes(new Uint8Array(end));

    const flat = [];
    chunks.forEach((arr) => {
      for (let i = 0; i < arr.length; i++) flat.push(arr[i]);
    });
    void central;
    return new Uint8Array(flat);
  }

  function buildXlsx(rows, headers) {
    const enc = new TextEncoder();
    const sheetRows = [];
    sheetRows.push(
      `    <row r="1">${headers
        .map((h, i) => `<c r="${colName(i)}1" s="1" t="inlineStr"><is><t>${xmlEscape(h)}</t></is></c>`)
        .join('')}</row>`,
    );
    rows.forEach((values, r) => {
      const rowNum = r + 2;
      const cells = values
        .map((value, i) => {
          const ref = `${colName(i)}${rowNum}`;
          if (value != null && value.type === 'n') {
            return `<c r="${ref}"><v>${value.v}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value != null && value.type === 's' ? value.v : value)}</t></is></c>`;
        })
        .join('');
      sheetRows.push(`    <row r="${rowNum}">${cells}</row>`);
    });

    const sheetXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<cols><col min="1" max="' +
      headers.length +
      '" width="20" customWidth="1"/></cols>' +
      '<sheetData>\n' +
      sheetRows.join('\n') +
      '\n</sheetData></worksheet>';

    const contentTypes =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '</Types>';

    const rels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
      '</Relationships>';

    const workbook =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="Donations" sheetId="1" r:id="rId1"/></sheets></workbook>';

    const workbookRels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>';

    const styles =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
      '</styleSheet>';

    const appProps =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
      '<Application>POET Admin</Application></Properties>';

    const coreProps =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<dc:title>POET donations</dc:title><cp:revision>1</cp:revision></cp:coreProperties>';

    return zipStore([
      { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
      { name: '_rels/.rels', data: enc.encode(rels) },
      { name: 'docProps/app.xml', data: enc.encode(appProps) },
      { name: 'docProps/core.xml', data: enc.encode(coreProps) },
      { name: 'xl/workbook.xml', data: enc.encode(workbook) },
      { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(workbookRels) },
      { name: 'xl/styles.xml', data: enc.encode(styles) },
      { name: 'xl/worksheets/sheet1.xml', data: enc.encode(sheetXml) },
    ]);
  }

  function exportExcel() {
    const rows = filteredDonations();
    if (!rows.length) {
      historySummary.textContent = 'Không có dữ liệu để xuất.';
      return;
    }

    const headers = [
      'orderCode',
      'status',
      'hidden',
      'amount',
      'displayName',
      'message',
      'anonymous',
      'createdAt',
      'paidAt',
      'payosReference',
      'payosAccountNumber',
      'counterAccountBankId',
      'counterAccountBankName',
      'counterAccountName',
      'counterAccountNumber',
      'virtualAccountName',
      'virtualAccountNumber',
      'payosDescription',
      'payosTransactionTime',
      'payosCurrency',
      'paymentLinkId',
    ];

    const numericKeys = new Set(['orderCode', 'amount', 'anonymous', 'hidden']);
    const data = rows.map((d) =>
      headers.map((key) => {
        let raw = d[key];
        if (key === 'anonymous') raw = d.anonymous ? 1 : 0;
        if (key === 'hidden') raw = isHidden(d) ? 1 : 0;
        if (numericKeys.has(key) && raw !== '' && raw != null && Number.isFinite(Number(raw))) {
          return { type: 'n', v: String(Number(raw)) };
        }
        return { type: 's', v: raw == null ? '' : String(raw) };
      }),
    );

    const bytes = buildXlsx(data, headers);
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poet-donations-${stamp}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    historySummary.textContent = `Đã xuất ${rows.length} khoản.`;
  }

  statusFilter.addEventListener('change', renderHistory);
  if (hiddenFilter) hiddenFilter.addEventListener('change', loadHistory);
  searchInput.addEventListener('input', renderHistory);
  reloadBtn.addEventListener('click', loadHistory);
  exportBtn.addEventListener('click', exportExcel);

  // ---- Change password ----

  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordStatus('');
    const cur = currentPass.value;
    const next = newPass.value;
    const confirm = confirmPass.value;
    if (!cur) {
      setPasswordError('Nhập mật khẩu hiện tại.');
      return;
    }
    if (next.length < 4 || next.length > 72) {
      setPasswordError('Mật khẩu mới phải từ 4 đến 72 ký tự.');
      return;
    }
    if (next !== confirm) {
      setPasswordError('Hai mật khẩu mới chưa khớp.');
      return;
    }
    passwordSubmit.disabled = true;
    try {
      const res = await api('/api/admin/change-password', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordError(data.error || 'Đổi mật khẩu thất bại.');
        return;
      }
      currentPass.value = '';
      newPass.value = '';
      confirmPass.value = '';
      setPasswordStatus('Đã đổi mật khẩu.');
    } catch (err) {
      setPasswordError(err.message || 'Đổi mật khẩu thất bại.');
    } finally {
      passwordSubmit.disabled = false;
    }
  });

  // ---- Boot ----

  (async () => {
    if (!token()) {
      showLogin();
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/me`, { headers: authHeaders() });
      if (res.status === 401) {
        logout(true);
        showLogin();
        return;
      }
      const data = await res.json().catch(() => ({}));
      showDashboard(data.username || sessionStorage.getItem(USER_KEY) || 'admin');
    } catch {
      showDashboard(sessionStorage.getItem(USER_KEY) || 'admin');
    }
  })();
})();
