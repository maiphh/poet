(() => {
  const API_BASE = window.POET_API_BASE;
  if (document.body?.dataset?.result !== 'return') return;

  const $ = (id) => document.getElementById(id);
  const statusEl = $('result-status');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const orderCode = new URLSearchParams(location.search).get('orderCode');
  const validCode = orderCode && /^\d{1,10}$/.test(orderCode);

  // Details saved by donate.js in this browser before going to payOS.
  // The public status API never returns names or messages.
  function loadLocal() {
    if (!validCode) return null;
    const key = 'poet-donation-' + orderCode;
    let raw = null;
    try { raw = sessionStorage.getItem(key); } catch { /* ignore */ }
    if (!raw) { try { raw = localStorage.getItem(key); } catch { /* ignore */ } }
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  function showWait(text, title) {
    $('thanks-success').hidden = true;
    $('thanks-wait').hidden = false;
    if (title) $('thanks-wait-title').textContent = title;
    statusEl.textContent = text;
    statusEl.className = 'thanks-status is-wait';
  }

  // ---- confetti: ~3s, once per order, never with reduced motion ----
  const cv = $('thanks-confetti');
  function burst() {
    if (reduceMotion || !cv) return;
    const cx = cv.getContext('2d');
    cv.width = innerWidth;
    cv.height = innerHeight;
    const cols = ['#ff8a76', '#f6c43f', '#8cc63f', '#6aa5c4', '#f3a9c4', '#8a6bd1'];
    const ps = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
      r: Math.random() * 6 + 4, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3,
      c: cols[(Math.random() * 6) | 0], s: (Math.random() * 3) | 0,
    }));
    const t0 = performance.now();
    (function f(t) {
      cx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach((p) => {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c;
        if (p.s === 0) cx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        else if (p.s === 1) { cx.beginPath(); cx.arc(0, 0, p.r / 1.4, 0, 7); cx.fill(); }
        else { cx.font = p.r * 3 + 'px serif'; cx.fillText('✿', 0, 0); }
        cx.restore();
      });
      if (t - t0 < 3200) requestAnimationFrame(f);
      else cx.clearRect(0, 0, cv.width, cv.height);
    })(t0);
  }

  function celebrateOnce() {
    const key = 'poet-confetti-' + orderCode;
    let seen = false;
    try { seen = !!localStorage.getItem(key); localStorage.setItem(key, '1'); } catch { /* ignore */ }
    if (!seen) setTimeout(burst, 350);
    else document.body.classList.add('thanks-no-anim'); // don't re-pop the gift box on reload
  }

  function showSuccess(data, local) {
    $('thanks-wait').hidden = true;
    $('thanks-success').hidden = false;
    statusEl.className = 'thanks-status is-ok';
    statusEl.textContent = '✓ Đã nhận thanh toán';
    const name = local && !local.anonymous ? String(local.displayName || '').trim() : '';
    if (name) {
      const lead = $('thanks-lead');
      lead.textContent = '';
      const b = document.createElement('b');
      b.textContent = name;
      lead.append(b, ' ơi, món quà của bạn đã đến POET. Đây là lá thư cảm ơn dành riêng cho bạn.');
    }
    celebrateOnce();

    // The letter needs the donor details; without them (other device/browser) skip it.
    if (local && window.POETCard) {
      $('thanks-card').hidden = false;
      const canvas = $('card-canvas');
      window.POETCard.draw(canvas, local);
      window.POETCard.bind(canvas, { save: $('card-save'), fb: $('card-fb'), toast: $('card-toast') });
    } else {
      $('thanks-lead').textContent = 'Món quà của bạn đã đến POET. Cảm ơn bạn rất nhiều!';
    }
  }

  if (!validCode) {
    showWait('Không tìm thấy mã đơn.', 'Chưa xác định được món quà');
    return;
  }

  const local = loadLocal();
  let tries = 0;
  function check() {
    tries++;
    fetch(`${API_BASE}/api/donations/${encodeURIComponent(orderCode)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.status === 'success') return showSuccess(data, local);
        if (data && data.status === 'pending') {
          showWait('Đang chờ xác nhận thanh toán…');
          if (tries < 3) setTimeout(check, 3000); // at most 3 reads per visit
          return;
        }
        if (data && data.status) {
          showWait('Trạng thái hiện tại: ' + data.status, 'Thanh toán chưa hoàn tất');
          return;
        }
        showWait('Chưa đọc được trạng thái. Quà của bạn vẫn được ghi nhận khi thanh toán thành công.');
      })
      .catch(() => {
        showWait('Chưa đọc được trạng thái. Quà của bạn vẫn được ghi nhận khi thanh toán thành công.');
      });
  }
  check();
})();
