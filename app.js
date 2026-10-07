const packages = [
  { name: 'BABY STEP', price: 1, description: 'Bắt đầu hành trình sẻ chia bằng một lời chào thật dễ thương.' },
  { name: 'SPARK', price: 3, description: 'Châm tia lửa đầu tiên và gặp gỡ cộng đồng tại Pop-up.' },
  { name: 'GROW', price: 5, description: 'Đưa sản phẩm vào nội dung creator và tạo một điểm chạm tại Pop-up.' },
  { name: 'RISE', price: 10, description: 'Cho thương hiệu thêm tiếng nói trên Facebook, Instagram và TikTok.' },
  { name: 'SHINE', price: 15, description: 'Thêm khoảnh khắc unboxing và chất liệu kể chuyện sau hành trình.' },
  { name: 'TURNING POINT', price: 20, description: 'Mở rộng câu chuyện với trải nghiệm sản phẩm từ KOC.' },
  { name: 'THRIVE', price: 25, description: 'Nâng diện tích trải nghiệm và tăng độ phủ nội dung.' },
  { name: 'SPREAD', price: 30, description: 'Lan tỏa câu chuyện từ màn hình, Pop-up đến chuyến đi thực tế.' },
  { name: 'AMPLIFY', price: 35, description: 'Khuếch đại trải nghiệm trực tiếp và thêm một người cùng lên đường.' },
  { name: 'TRIUMPH', price: 40, description: 'Một hành trình đồng hành trọn vẹn với nhiều điểm chạm nhất.' }
];

const packageButtons = [...document.querySelectorAll('.package-option')];
const detailName = document.querySelector('#detail-name');
const detailDescription = document.querySelector('#detail-description');
const detailHighlights = document.querySelector('#detail-highlights');
const detailPhases = document.querySelector('#detail-phases');
const contactMessage = document.querySelector('#contact-message');
let selectedPackage = 7;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getBenefits(index) {
  const before = ['Công bố chung trên Facebook & Instagram POET theo tuần.', 'Nhận ảnh chuyến tiền trạm và cập nhật tiến độ gây quỹ, quyền lợi hằng tuần.'];
  const popup = ['Phát voucher Little Joy kèm vé tham dự và hiển thị logo tại khu vực Pop-up.'];
  const trip = ['Cơ hội ưu tiên hợp tác CSR, đồng sáng tạo hoạt động cộng đồng và nhận chứng nhận đồng hành sau chương trình.'];

  if (index >= 1) {
    before.push('Được nhắc trong bình luận các bài cập nhật cột mốc chiến dịch.');
    popup.push('Xuất hiện trong bài recap chung Pop-up trên Facebook và Instagram.');
  }
  if (index >= 2) {
    const creatorCount = index === 9 ? 5 : index >= 5 ? 3 : 1;
    before.push(`${creatorCount} video 20–30 giây lồng ghép sản phẩm trên kênh creator team POET.`);
    popup.push('Có mặt trong video recap chung Pop-up của POET trên TikTok.');
  }
  if (index >= 3) {
    const poetVideos = index === 9 ? 3 : index >= 6 ? 2 : 1;
    before.push(`Bài công bố riêng trên Facebook & Instagram và ${poetVideos} video TikTok POET nhắc đến Little Joy (30 giây/video).`);
    popup.push('Có video UGC sản phẩm trên kênh creator team POET trong giai đoạn Pop-up.');
    trip.push('Xuất hiện trong bài recap sau chuyến đi trên Facebook & Instagram POET.');
  }
  if (index >= 4) {
    before.push('Sản phẩm được giới thiệu trong video unboxing túi quà trên kênh POET.');
    trip.push('Nhận hình ảnh không gian, hoạt động và source video từ chuyến đi.');
  }
  if (index >= 5) {
    const kocCount = index === 9 ? 5 : index >= 7 ? 2 : 1;
    before.push(`${kocCount} video KOC trải nghiệm sản phẩm (tối đa 60 giây/video).`);
    popup.push('Nhận hình ảnh thương hiệu, sản phẩm Little Joy tại Pop-up.');
    trip.push('Có bài recap riêng sau chuyến đi trên Facebook & Instagram POET.');
  }
  if (index >= 6) {
    popup.push('Có video recap Pop-up riêng của POET và bài recap riêng trên Instagram.');
    trip.push('Có mặt trong video recap chung chuyến đi trên TikTok POET.');
  }
  if (index >= 7) {
    popup.push('Được ưu tiên lựa chọn vị trí quầy hàng tại Pop-up.');
    trip.push('Tham gia trao tặng, bàn giao thành quả trong chuyến đi.');
  }
  if (index === 9) {
    popup.push('Được hỗ trợ sản xuất quầy tiêu chuẩn trong ngân sách 1 triệu đồng và ưu tiên độc quyền theo ngành hàng tùy triển khai.');
    trip.push('Có video recap chuyến đi riêng 30 giây trên TikTok POET và cơ hội để người thụ hưởng trải nghiệm sản phẩm.');
  }
  return { before, popup, trip };
}

function renderPackage(index) {
  const selected = packages[index];
  const booth = index >= 6 ? '8m²' : index >= 2 ? '5m²' : '—';
  const tickets = index === 9 ? 4 : index >= 6 ? 3 : index >= 3 ? 2 : index >= 1 ? 1 : 0;
  const tripTickets = index >= 7 ? index - 6 : 0;
  selectedPackage = index;
  packageButtons.forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
  detailName.replaceChildren(document.createTextNode(selected.name), createElement('span', '', ` / ${selected.price} triệu`));
  detailDescription.textContent = selected.description;
  detailHighlights.replaceChildren();

  const highlights = [
    { value: booth, label: booth === '—' ? 'Quầy Pop-up chưa bao gồm' : 'Không gian quầy Pop-up' },
    { value: tickets ? `${tickets} vé` : '—', label: tickets ? 'Vé mời tham dự Pop-up' : 'Vé Pop-up chưa bao gồm' },
    { value: tripTickets ? `${tripTickets} vé` : '—', label: tripTickets ? 'Vé mời tham gia chuyến đi' : 'Vé chuyến đi chưa bao gồm' }
  ];
  highlights.forEach(({ value, label }) => {
    const item = createElement('div', 'highlight');
    item.append(createElement('strong', '', value), createElement('span', '', label));
    detailHighlights.append(item);
  });

  const benefits = getBenefits(index);
  if (tickets) benefits.popup.unshift(`${tickets} vé mời tham dự Pop-up Big Joy.`);
  if (booth !== '—') benefits.popup.unshift(`Không gian quầy hàng ${booth} tại Pop-up.`);
  if (tripTickets) benefits.trip.unshift(`${tripTickets} vé mời chuyến đi (gồm ăn uống, di chuyển và ở).`);
  const phases = [
    { number: '01 / TRƯỚC SỰ KIỆN', title: 'Lan tỏa trên mạng xã hội', items: benefits.before },
    { number: '02 / POP-UP · 20–21.12.2026', title: 'Chạm nhau ngoài đời', items: benefits.popup },
    { number: '03 / CHUYẾN ĐI · 22–24.01.2027', title: 'Để niềm vui đi xa', items: benefits.trip }
  ];
  detailPhases.replaceChildren();
  phases.forEach(({ number, title, items }) => {
    const phase = createElement('section', 'phase');
    phase.append(createElement('span', 'phase-number', number), createElement('h4', '', title));
    const list = createElement('ul');
    items.forEach(item => list.append(createElement('li', '', item)));
    phase.append(list);
    detailPhases.append(phase);
  });
  contactMessage.value = `Xin chào POET, doanh nghiệp của tôi quan tâm đến gói Little Joy ${selected.name} (${selected.price} triệu đồng). Mong được trao đổi thêm về quyền lợi và cách đồng hành cùng chương trình Big Joy. Xin cảm ơn!`;
}

const packageDetail = document.querySelector('#package-detail');
packageButtons.forEach(button => button.addEventListener('click', () => {
  renderPackage(Number(button.dataset.package));
  packageDetail.classList.remove('is-switching');
  void packageDetail.offsetWidth;
  packageDetail.classList.add('is-switching');
}));
renderPackage(selectedPackage);

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Mở menu' : 'Đóng menu');
  mobileNav.hidden = isOpen;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Mở menu');
  mobileNav.hidden = true;
}));

const reelControl = document.querySelector('#reel-control');
const reelProgress = document.querySelector('#reel-progress');
const reelTime = document.querySelector('#reel-time');
const reelSlides = [...document.querySelectorAll('.reel-slide')];
const reelFrame = document.querySelector('#hero-reel');
const secondsPerSlide = 3;
const reelDuration = reelSlides.length * secondsPerSlide;
let reelTimer;
let reelElapsed = 0;

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function updateReel() {
  const activeSlide = Math.min(Math.floor(reelElapsed / secondsPerSlide), reelSlides.length - 1);
  reelSlides.forEach((slide, index) => slide.classList.toggle('is-visible', index === activeSlide));
  reelProgress.style.transition = reelElapsed === 0 ? 'none' : '';
  reelProgress.style.width = `${reelElapsed / reelDuration * 100}%`;
  reelTime.textContent = `${formatTime(reelElapsed)} / ${formatTime(reelDuration)}`;
}

function pauseReel() {
  clearInterval(reelTimer);
  reelTimer = undefined;
  reelFrame.classList.remove('is-playing');
  reelControl.querySelector('span').textContent = '▶';
  reelControl.setAttribute('aria-label', 'Phát bản xem trước hình ảnh');
}

function playReel() {
  updateReel();
  reelFrame.classList.add('is-playing');
  reelControl.querySelector('span').textContent = 'Ⅱ';
  reelControl.setAttribute('aria-label', 'Tạm dừng bản xem trước hình ảnh');
  reelTimer = setInterval(() => {
    reelElapsed = (reelElapsed + 1) % reelDuration;
    updateReel();
  }, 1000);
}

reelControl.addEventListener('click', () => (reelTimer ? pauseReel() : playReel()));
playReel();

const contactDialog = document.querySelector('#contact-dialog');
const copyStatus = document.querySelector('#copy-status');
document.querySelector('#contact-open').addEventListener('click', () => {
  copyStatus.textContent = '';
  contactDialog.showModal();
});
document.querySelector('#contact-close').addEventListener('click', () => contactDialog.close());
contactDialog.addEventListener('click', event => {
  if (event.target === contactDialog) contactDialog.close();
});
document.querySelector('#copy-message').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(contactMessage.value);
    copyStatus.textContent = 'Đã sao chép lời nhắn. Bạn có thể gửi cho POET qua Facebook.';
  } catch {
    contactMessage.focus();
    contactMessage.select();
    copyStatus.textContent = 'Đã chọn lời nhắn. Nhấn Ctrl+C (hoặc Sao chép trên điện thoại).';
  }
});

const siteHeader = document.querySelector('.site-header');
const onScroll = () => siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const revealGroups = [
  '.intro .section-kicker, .intro h2, .intro-right',
  '.section-heading > div, .section-heading > p, .packages-top > div, .packages-top > p',
  '.journey-card',
  '.ugc-copy > *, .social-back, .social-front, .ugc-sticker',
  '.perk-card',
  '.package-option',
  '.package-detail, .package-note',
  '.closing-inner > *:not(.closing-deco)',
  '.footer-main > div'
];

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealGroups.forEach(selector => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add('reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index, 9) * 70}ms`);
      revealObserver.observe(element);
    });
  });
}
