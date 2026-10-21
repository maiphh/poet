(() => {
  const API_BASE = window.POET_API_BASE;
  const ANON_NAME = 'Một nhà hảo tâm';
  const CONFIG = window.POET_DONATE_CONFIG || { items: [], campaign: null };
  const ITEMS = (CONFIG.items || []).slice().sort((x, y) => x.price - y.price);
  const MIN = 10000;
  const MAX = 20000000;
  const SUGGEST = [50000, 100000, 200000, 500000];
  // Concept D: one gift type per donation. sel = item or null (custom amount).
  let sel = null;
  let count = 0;
  let capHit = false;

  const form = document.getElementById('donate-form');
  const giftTotal = document.getElementById('gift-total');
  const giftSummary = document.getElementById('gift-summary');
  const customAmount = document.getElementById('custom-amount');
  const displayName = document.getElementById('display-name');
  const message = document.getElementById('message');
  const anonymous = document.getElementById('anonymous');
  const submitBtn = document.getElementById('donate-submit');
  const errorEl = document.getElementById('donate-error');
  const wall = document.getElementById('donate-wall');
  const emptyEl = document.getElementById('donate-empty');
  const totalEl = document.getElementById('donate-total');
  const totalAmountEl = document.getElementById('donate-total-amount');
  const heroTitle = document.getElementById('donate-title');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let totalTarget = null;
  let totalAnimated = false;
  let heroVisible = false;
  const disabledBanner = document.getElementById('donate-disabled');
  let donationsEnabled = true;
  const searchInput = document.getElementById('donate-search');
  const paginationEl = document.getElementById('donate-pagination');
  const historyCountEl = document.getElementById('donate-history-count');
  const PER_PAGE = 10;
  let allDonations = [];
  let searchQuery = '';
  let currentPage = 1;

  function money(n) {
    return new Intl.NumberFormat('vi-VN').format(n) + ' đ';
  }

  function showError(text) {
    errorEl.hidden = !text;
    errorEl.textContent = text || '';
  }

  const rail = document.getElementById('gift-rail');
  const qtyBox = document.getElementById('gift-qty');
  const suggestBox = document.getElementById('gift-suggest');
  const limitEl = document.getElementById('gift-limit');
  const customToggle = document.getElementById('gift-custom-toggle');
  const customPanel = document.getElementById('gift-custom-panel');
  const SUBMIT_DEFAULT = 'Tiếp tục thanh toán';

  function chip(label, onClick, aria) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gift-chip';
    btn.textContent = label;
    if (aria) btn.setAttribute('aria-label', aria);
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', onClick);
    return btn;
  }

  function customValue() {
    const raw = customAmount.value.trim();
    return raw === '' ? null : Number(raw);
  }

  function usingCustom() {
    return !sel && customValue() !== null;
  }

  // Try to set the gift count; refuses (and flags the cap) above MAX.
  function setCount(n) {
    if (!sel) return false;
    if (sel.price * n > MAX) { capHit = true; return false; }
    capHit = false;
    count = n;
    return true;
  }

  function clearCustom() {
    customAmount.value = '';
  }

  function popPlus(card) {
    if (reduceMotion) return;
    const p = document.createElement('span');
    p.className = 'gift-plus';
    p.setAttribute('aria-hidden', 'true');
    p.textContent = '+1';
    card.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }

  function shake(el) {
    if (reduceMotion || !el) return;
    el.classList.remove('is-shake');
    void el.offsetWidth;
    el.classList.add('is-shake');
  }

  function buildPicker() {
    if (!rail) return;
    ITEMS.forEach((i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'gift-card';
      card.dataset.id = i.id;
      card.setAttribute('aria-pressed', 'false');
      const icon = document.createElement('span');
      icon.className = 'gift-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = i.svg; // static SVG from items.js, never user input
      const name = document.createElement('b');
      name.textContent = i.name;
      const price = document.createElement('small');
      price.className = 'gift-price';
      price.textContent = money(i.price);
      const badge = document.createElement('span');
      badge.className = 'gift-badge';
      badge.hidden = true;
      card.append(icon, name, price, badge);
      card.addEventListener('click', () => {
        showError('');
        if (sel === i) {
          if (setCount(count + 1)) popPlus(card);
          else shake(badge);
        } else {
          sel = i;
          count = 1;
          capHit = false;
          clearCustom();
          popPlus(card);
        }
        update();
      });
      rail.appendChild(card);
    });
    // Repeat taps add +1; this one button takes one away (0 = deselect).
    if (qtyBox) {
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.className = 'gift-minus';
      minus.id = 'gift-minus';
      minus.addEventListener('click', () => {
        if (!sel) return;
        showError('');
        capHit = false;
        if (count > 1) count -= 1;
        else { sel = null; count = 0; }
        update();
        if (!sel) { const first = rail.querySelector('.gift-card'); if (first) first.focus(); }
      });
      qtyBox.appendChild(minus);
    }
    SUGGEST.forEach((v) => {
      const btn = chip(`${v / 1000}k`, () => {
        customAmount.value = String(v);
        sel = null; count = 0; capHit = false;
        update();
      }, money(v));
      btn.dataset.v = String(v);
      suggestBox.appendChild(btn);
    });
  }

  function currentAmount() {
    if (sel) return sel.price * count;
    const c = customValue();
    return c === null ? 0 : c;
  }

  function update() {
    const custom = usingCustom();
    rail.querySelectorAll('.gift-card').forEach((card) => {
      const on = !!sel && card.dataset.id === sel.id;
      card.setAttribute('aria-pressed', String(on));
      card.classList.toggle('is-on', on);
      const badge = card.querySelector('.gift-badge');
      badge.hidden = !on;
      badge.textContent = on ? `×${count}` : '';
    });
    const minusBtn = qtyBox && qtyBox.querySelector('.gift-minus');
    if (minusBtn) {
      qtyBox.hidden = !sel;
      if (sel) {
        minusBtn.textContent = count > 1 ? `− Bớt 1 ${sel.name}` : `✕ Bỏ chọn ${sel.name}`;
        minusBtn.setAttribute('aria-label', count > 1 ? `Bớt 1 ${sel.name}, còn ${count - 1}` : `Bỏ chọn ${sel.name}`);
      }
    }
    const cv = customValue();
    suggestBox.querySelectorAll('.gift-chip').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(custom && Number(btn.dataset.v) === cv));
    });
    rail.classList.toggle('is-overridden', custom);

    const total = currentAmount();
    if (sel) {
      giftSummary.textContent = `${count} ${sel.name} ${sel.emoji || ''}`.trim();
    } else if (custom) {
      giftSummary.textContent = 'Số tiền tuỳ ý';
    } else {
      giftSummary.textContent = '';
    }
    if (total === 0) {
      giftTotal.textContent = 'Chọn món quà hoặc nhập số tiền';
      giftTotal.classList.add('is-hint');
    } else {
      giftTotal.textContent = money(total);
      giftTotal.classList.remove('is-hint');
    }
    const wholeK = Number.isInteger(total) && total % 1000 === 0;
    const valid = total >= MIN && total <= MAX && wholeK;
    if (limitEl) {
      limitEl.textContent = capHit || total > MAX ? 'Tối đa 20.000.000 đ'
        : total > 0 && total < MIN ? 'Tối thiểu 10.000 đ'
          : total > 0 && !wholeK ? 'Số tiền phải là bội số của 1.000 đ' : '';
    }

    setSubmitEnabled(valid);
    if (submitBtn.dataset.busy !== '1' && donationsEnabled) {
      submitBtn.textContent = sel ? `Tặng ${count} ${sel.name} · ${money(total)}`
        : custom && valid ? `Tặng ${money(total)}` : SUBMIT_DEFAULT;
    }
    if (!reduceMotion) {
      giftTotal.classList.remove('is-bump');
      void giftTotal.offsetWidth;
      giftTotal.classList.add('is-bump');
    }
  }

  customAmount.addEventListener('input', () => {
    if (customAmount.value.trim() !== '') { sel = null; count = 0; capHit = false; }
    update();
  });
  displayName.addEventListener('input', update);
  message.addEventListener('input', update);
  customToggle.addEventListener('click', () => {
    const open = customToggle.getAttribute('aria-expanded') !== 'true';
    customToggle.setAttribute('aria-expanded', String(open));
    customPanel.hidden = !open;
    customToggle.querySelector('.gift-custom-chev').textContent = open ? '▴' : '▾';
    if (open) customAmount.focus();
  });

  let amountValid = false;
  function setSubmitEnabled(valid) {
    amountValid = valid;
    if (!donationsEnabled || submitBtn.dataset.busy === '1') return;
    submitBtn.disabled = !valid;
    submitBtn.setAttribute('aria-disabled', valid ? 'false' : 'true');
  }

  anonymous.addEventListener('change', () => {
    displayName.disabled = anonymous.checked;
    displayName.required = !anonymous.checked;
    if (anonymous.checked) displayName.value = '';
    update();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError('');

    if (!donationsEnabled) {
      showError('Trang ủng hộ đang tạm tắt. Quay lại sau giúp nhé.');
      return;
    }

    const amount = currentAmount();
    if (!Number.isInteger(amount) || amount < MIN || amount > MAX || amount % 1000 !== 0) {
      showError('Số tiền phải từ 10.000 đến 20.000.000 đồng, là bội số của 1.000 đ.');
      return;
    }
    const gift = sel ? { id: sel.id, qty: count } : null;

    const isAnonymous = anonymous.checked;
    const name = displayName.value.trim();
    const note = message.value.trim();

    if (!isAnonymous && (name.length < 1 || name.length > 40)) {
      showError('Tên hiển thị phải từ 1 đến 40 ký tự.');
      return;
    }
    if (note.length > 160) {
      showError('Lời tối đa 160 ký tự.');
      return;
    }

    submitBtn.dataset.busy = '1';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang mở thanh toán…';

    try {
      const res = await fetch(`${API_BASE}/api/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          displayName: isAnonymous ? '' : name,
          message: note,
          anonymous: isAnonymous,
          ...(gift ? { giftId: gift.id, giftQty: gift.qty } : {}),
          returnUrl: new URL('return.html', new URL('.', location.href)).href,
          cancelUrl: new URL('cancel.html', new URL('.', location.href)).href,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.checkoutUrl) {
        showError(data.error || 'Không tạo được liên kết thanh toán.');
        delete submitBtn.dataset.busy;
        submitBtn.disabled = false;
        update();
        return;
      }
      // Keep donor details in THIS browser only, so the success page and
      // thank-you card can show them without the public status API ever
      // returning names/messages (orderCodes are enumerable).
      if (data.orderCode) {
        const record = JSON.stringify({
          amount,
          displayName: isAnonymous ? '' : name,
          anonymous: isAnonymous,
          message: note,
          items: gift ? [{ id: gift.id, qty: gift.qty }] : [],
          giftId: gift ? gift.id : null,
          giftQty: gift ? gift.qty : null,
          createdAt: new Date().toISOString(),
        });
        const key = 'poet-donation-' + data.orderCode;
        try { sessionStorage.setItem(key, record); } catch { /* private mode */ }
        try { localStorage.setItem(key, record); } catch { /* private mode */ }
      }
      location.href = data.checkoutUrl;
    } catch {
      showError('Không kết nối được máy chủ. Thử lại giúp nhé.');
      delete submitBtn.dataset.busy;
      submitBtn.disabled = false;
      update();
    }
  });

  function renderTotal(totalAmount, totalCount) {
    if (!totalEl) return;
    const amount = Number(totalAmount) || 0;
    const count = Number(totalCount) || 0;
    if (count === 0) {
      totalEl.textContent = 'Chưa ghi nhận khoản ủng hộ nào.';
      if (totalAmountEl) totalAmountEl.textContent = money(0);
      totalAnimated = true;
      return;
    }
    totalEl.textContent = `Được góp từ ${count} món quà.`;
    totalTarget = amount;
    maybeAnimateTotal();
  }

  function maybeAnimateTotal() {
    if (totalAnimated || totalTarget === null || !heroVisible || !totalAmountEl) return;
    totalAnimated = true;
    if (reduceMotion) {
      totalAmountEl.textContent = money(totalTarget);
      return;
    }
    const duration = 1600;
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      totalAmountEl.textContent = money(Math.round(totalTarget * eased));
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (heroTitle && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        heroVisible = true;
        maybeAnimateTotal();
        heroObserver.disconnect();
      }
    }, { threshold: 0.2 });
    heroObserver.observe(heroTitle);
  } else {
    heroVisible = true;
  }

  function normalizeName(text) {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
  }

  function filteredDonations() {
    const q = normalizeName(searchQuery.trim());
    if (!q) return allDonations;
    return allDonations.filter((item) =>
      normalizeName(item.displayName).includes(q),
    );
  }

  const NOTE_COLORS = ['#fff3c4', '#ffe0d8', '#dff1f9', '#e6f4d4', '#f9e1ec', '#ece3fb'];
  const relFmt = 'Intl' in window && Intl.RelativeTimeFormat
    ? new Intl.RelativeTimeFormat('vi', { numeric: 'auto' })
    : null;

  function timeAgo(date) {
    const sec = (Date.now() - date.getTime()) / 1000;
    if (sec < 60) return 'vừa xong';
    const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unit, size] of units) {
      if (sec >= size) {
        const n = Math.floor(sec / size);
        return relFmt ? relFmt.format(-n, unit) : date.toLocaleString('vi-VN');
      }
    }
    return 'vừa xong';
  }

  function iconFor(amount) {
    const by = (id) => ITEMS.find((i) => i.id === id);
    const pick = amount >= 1000000 ? by('balo')
      : amount >= 300000 ? by('ao')
      : amount >= 100000 ? by('sach')
      : amount >= 50000 ? by('tap')
      : by('but');
    return pick || ITEMS[0];
  }

  // Gift line only for a known gift with a sane count (server already checks).
  function giftOf(item) {
    const it = item && ITEMS.find((i) => i.id === item.giftId);
    const qty = Number(item && item.giftQty);
    return it && Number.isInteger(qty) && qty >= 1 ? { item: it, qty } : null;
  }

  function buildNote(item, index) {
    const note = document.createElement('article');
    note.className = 'wall-note';
    note.style.setProperty('--rot', `${(index * 37) % 7 - 3}deg`);
    note.style.setProperty('--note-bg', NOTE_COLORS[index % NOTE_COLORS.length]);
    if (!reduceMotion) note.style.animationDelay = `${(index % 10) * 50}ms`;

    const paid = item.paidAt ? new Date(item.paidAt) : null;
    const valid = paid && !Number.isNaN(paid.getTime());
    if (valid && Date.now() - paid.getTime() < 3600 * 1000) {
      const badge = document.createElement('span');
      badge.className = 'wall-note-new';
      badge.textContent = 'MỚI';
      note.appendChild(badge);
    }

    const msg = document.createElement('p');
    msg.className = 'wall-note-msg';
    if (item.message) {
      msg.textContent = item.message;
    } else {
      msg.classList.add('is-empty');
      msg.textContent = '💛 (không để lại lời nhắn)';
    }
    note.appendChild(msg);

    const gift = giftOf(item);
    if (gift) {
      const line = document.createElement('p');
      line.className = 'wall-note-gift';
      line.textContent = `tặng ${gift.qty} ${gift.item.name} ${gift.item.emoji || ''}`.trimEnd();
      note.appendChild(line);
    }

    const meta = document.createElement('div');
    meta.className = 'wall-note-meta';
    const icon = gift ? gift.item : iconFor(Number(item.amount) || 0);
    if (icon) {
      const ic = document.createElement('span');
      ic.className = 'wall-note-icon';
      ic.setAttribute('aria-hidden', 'true');
      ic.innerHTML = icon.svg; // static SVG from items.js
      meta.appendChild(ic);
    }
    const who = document.createElement('div');
    who.className = 'wall-note-who';
    const nameEl = document.createElement('b');
    // Old rows stored 'Ẩn danh'; show the warmer wording everywhere.
    nameEl.textContent = !item.displayName || item.displayName === 'Ẩn danh' ? ANON_NAME : item.displayName;
    who.appendChild(nameEl);
    if (item.paidAt) {
      const timeEl = document.createElement('time');
      timeEl.dateTime = item.paidAt;
      if (valid) {
        timeEl.textContent = timeAgo(paid);
        timeEl.title = paid.toLocaleString('vi-VN');
      } else {
        timeEl.textContent = item.paidAt;
      }
      who.appendChild(timeEl);
    }
    meta.appendChild(who);
    const amt = document.createElement('span');
    amt.className = 'wall-note-amount';
    amt.textContent = money(item.amount);
    meta.appendChild(amt);
    note.appendChild(meta);
    return note;
  }

  function renderWallPage() {
    const rows = filteredDonations();
    const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    wall.textContent = '';
    if (!rows.length) {
      const p = document.createElement('p');
      p.className = 'donate-empty';
      p.id = 'donate-empty';
      p.textContent = searchQuery.trim()
        ? `Không tìm thấy món quà nào tên “${searchQuery.trim()}”.`
        : 'Chưa có lời nhắn nào. Hãy là người đầu tiên nhé.';
      wall.appendChild(p);
    } else {
      const start = (currentPage - 1) * PER_PAGE;
      const pageRows = rows.slice(start, start + PER_PAGE);
      pageRows.forEach((item, index) => {
        wall.appendChild(buildNote(item, start + index));
      });
    }

    renderHistoryCount(rows);
    renderPagination(rows.length, totalPages);
  }

  function renderHistoryCount(rows) {
    if (!historyCountEl) return;
    if (!rows.length) {
      historyCountEl.textContent = allDonations.length
        ? `${allDonations.length} món quà`
        : '';
      return;
    }
    const start = (currentPage - 1) * PER_PAGE + 1;
    const end = Math.min(currentPage * PER_PAGE, rows.length);
    const suffix = searchQuery.trim()
      ? ` · tìm “${searchQuery.trim()}”`
      : '';
    historyCountEl.textContent = `${start}–${end} / ${rows.length} món quà${suffix}`;
  }

  function pageButton(label, page, { disabled = false, current = false, ariaLabel = '' } = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'donate-page-btn' + (current ? ' is-current' : '');
    btn.textContent = label;
    if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
    if (current) btn.setAttribute('aria-current', 'page');
    btn.disabled = disabled;
    btn.dataset.page = String(page);
    return btn;
  }

  function pageWindow(totalPages) {
    const windowSize = 5;
    let from = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let to = Math.min(totalPages, from + windowSize - 1);
    from = Math.max(1, to - windowSize + 1);
    const list = [];
    for (let p = from; p <= to; p++) list.push(p);
    return list;
  }

  function renderPagination(totalRows, totalPages) {
    if (!paginationEl) return;
    paginationEl.textContent = '';
    if (totalRows <= PER_PAGE) return;

    paginationEl.appendChild(
      pageButton('←', currentPage - 1, {
        disabled: currentPage <= 1,
        ariaLabel: 'Trang trước',
      }),
    );
    pageWindow(totalPages).forEach((p) => {
      paginationEl.appendChild(
        pageButton(String(p), p, {
          current: p === currentPage,
          ariaLabel: `Trang ${p}`,
        }),
      );
    });
    paginationEl.appendChild(
      pageButton('→', currentPage + 1, {
        disabled: currentPage >= totalPages,
        ariaLabel: 'Trang sau',
      }),
    );

    const info = document.createElement('span');
    info.className = 'donate-page-info';
    info.textContent = `Trang ${currentPage} / ${totalPages}`;
    paginationEl.appendChild(info);
  }

  if (paginationEl) {
    paginationEl.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      const next = Number(btn.dataset.page);
      if (!Number.isInteger(next) || next < 1) return;
      currentPage = next;
      renderWallPage();
      wall.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      currentPage = 1;
      renderWallPage();
    });
  }

  function renderWall(donations) {
    allDonations = Array.isArray(donations) ? donations : [];
    currentPage = 1;
    renderWallPage();
  }

  // Sorting happens on the server (same row limit, own cache key per sort).
  let wallSort = 'new';
  const sortBox = document.getElementById('donate-sort');
  if (sortBox) {
    sortBox.querySelectorAll('button[data-sort]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.sort === wallSort) return;
        wallSort = btn.dataset.sort;
        sortBox.querySelectorAll('button[data-sort]').forEach((b) =>
          b.setAttribute('aria-pressed', String(b === btn)));
        loadWall();
      });
    });
  }

  // One request per sort per page view; the server caches each sort for 30s.
  const wallCache = {};
  function fetchWall(sort) {
    if (!wallCache[sort]) {
      const q = sort === 'amount' ? '?sort=amount' : '';
      wallCache[sort] = fetch(`${API_BASE}/api/donations${q}`).then((res) => {
        if (!res.ok) throw new Error('bad status');
        return res.json();
      });
      wallCache[sort].catch(() => { delete wallCache[sort]; });
    }
    return wallCache[sort];
  }

  // Podium: top 3 single donations from the amount-sorted wall (same hidden rule).
  const MEDALS = [
    { place: 1, label: 'Hạng nhất', crown: '👑', cls: 'is-1' },
    { place: 2, label: 'Hạng nhì', crown: '', cls: 'is-2' },
    { place: 3, label: 'Hạng ba', crown: '', cls: 'is-3' },
  ];
  function wallName(item) {
    return !item.displayName || item.displayName === 'Ẩn danh' ? ANON_NAME : item.displayName;
  }
  function renderPodium(donations) {
    const box = document.getElementById('podium');
    const list = document.getElementById('podium-list');
    if (!box || !list) return;
    const top = (donations || []).filter((d) => Number(d.amount) > 0).slice(0, 3);
    list.textContent = '';
    box.hidden = !top.length;
    box.dataset.count = String(top.length);
    top.forEach((d, i) => {
      const m = MEDALS[i];
      const li = document.createElement('li');
      li.className = `podium-step ${m.cls}`;
      li.setAttribute('aria-label', `${m.label}: ${wallName(d)}, ${money(d.amount)}`);
      if (m.crown) {
        const c = document.createElement('span');
        c.className = 'podium-crown';
        c.setAttribute('aria-hidden', 'true');
        c.textContent = m.crown;
        li.appendChild(c);
      }
      const n = document.createElement('b');
      n.className = 'podium-name';
      n.textContent = wallName(d);
      const a = document.createElement('small');
      a.className = 'podium-amount';
      a.textContent = money(d.amount);
      const block = document.createElement('span');
      block.className = 'podium-block';
      block.setAttribute('aria-hidden', 'true');
      block.textContent = String(m.place);
      li.append(n, a, block);
      list.appendChild(li);
    });
  }
  async function loadPodium() {
    try { renderPodium((await fetchWall('amount')).donations); } catch { /* podium is optional */ }
  }

  async function loadWall() {
    try {
      const data = await fetchWall(wallSort);
      renderTotal(data.totalAmount, data.totalCount);
      renderWall(data.donations || []);
    } catch {
      if (totalEl) totalEl.textContent = 'Chưa tải được tổng ủng hộ.';
      if (totalAmountEl) totalAmountEl.textContent = '—';
      wall.textContent = '';
      const p = document.createElement('p');
      p.className = 'donate-empty';
      p.textContent = 'Chưa tải được tường lời nhắn. Thử lại sau nhé.';
      wall.appendChild(p);
      if (paginationEl) paginationEl.textContent = '';
      if (historyCountEl) historyCountEl.textContent = '';
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      if (!res.ok) return;
      const data = await res.json();
      donationsEnabled = data.donationsEnabled !== false;
    } catch {
      return;
    }
    if (!donationsEnabled) {
      if (disabledBanner) disabledBanner.hidden = false;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang tạm tắt nhận ủng hộ';
    }
  }

  // B1: keep focused/scrolled-to controls above the sticky total bar.
  const totalBar = document.querySelector('.gift-total');
  if (totalBar && 'ResizeObserver' in window) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty('--gift-bar-h', `${Math.ceil(totalBar.offsetHeight)}px`);
    }).observe(totalBar);
  }

  buildPicker();
  update();
  loadSettings();
  loadWall();
  loadPodium();
})();
