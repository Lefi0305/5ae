/* ==========================================
   GA HUẾ – script.js
   Tính năng:
   1) Hero slider tự động + chấm điều hướng
   2) Scroll reveal (fade in khi cuộn)
   3) Header đổi trạng thái khi cuộn
   4) Hiệu ứng ripple cho nút bấm
   5) Form Đặt vé nhanh: validate + tính giá + lưu gần đây
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScrollState();     // (3)
  initRippleButtons();         // (4)
  initRevealOnScroll();        // (2)
  initHeroSlider();            // (1)
  initQuickBookForm();         // (5)
});

/* (3) Header đổi màu/đổ bóng khi cuộn */
function initHeaderScrollState() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const toggle = () => {
    if (window.scrollY > 10) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
}

/* (4) Hiệu ứng ripple khi bấm nút */
function initRippleButtons() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.btn-primary, .signup, .nav a');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
}

/* (2) Reveal khi cuộn – IntersectionObserver */
function initRevealOnScroll() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => io.observe(el));
}

/* (1) Hero slider đơn giản, tự động + dots */
function initHeroSlider() {
  const slider = document.querySelector('.slider');
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll('.slide'));
  const dotsWrap = slider.querySelector('.dots');
  let index = 0;
  let timer = null;

  // tạo dots
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Chuyển ảnh ' + (i + 1));
    b.addEventListener('click', () => go(i, true));
    dotsWrap.appendChild(b);
  });

  function render() {
    slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
    dotsWrap.querySelectorAll('button').forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  function go(i, user = false) {
    index = (i + slides.length) % slides.length;
    render();
    if (user) restart();
  }

  function next() { go(index + 1); }

  function start() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 4500);
  }

  function restart() { start(); }

  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', start);

  render();
  start();
}

/* (5) Form Đặt vé nhanh – validate + tính giá + lưu gần đây */
function initQuickBookForm() {
  const form = document.getElementById('quick-book');
  const result = document.getElementById('book-result');
  if (!form || !result) return;

  // Prefill từ localStorage
  const last = JSON.parse(localStorage.getItem('gahue:lastBooking') || 'null');
  if (last) {
    form.querySelector('#from').value  = last.from;
    form.querySelector('#to').value    = last.to;
    form.querySelector('#class').value = last.className;
    form.querySelector('#qty').value   = last.qty;
    // chỉ set ngày nếu còn hợp lệ
    const today = new Date().toISOString().slice(0,10);
    form.querySelector('#date').value = (last.date >= today) ? last.date : today;
  } else {
    // Set min cho ngày
    const today = new Date().toISOString().slice(0,10);
    form.querySelector('#date').min = today;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const from = form.querySelector('#from').value;
    const to = form.querySelector('#to').value;
    const date = form.querySelector('#date').value;
    const qty = parseInt(form.querySelector('#qty').value || '1', 10);
    const className = form.querySelector('#class').value;

    // Validate cơ bản
    const today = new Date().toISOString().slice(0,10);
    if (!date || date < today) {
      toast('Ngày đi không hợp lệ');
      return;
    }
    if (from === to) {
      toast('Ga đi và ga đến không được trùng nhau');
      return;
    }
    if (qty < 1) {
      toast('Số lượng tối thiểu là 1');
      return;
    }

    // Tính giá đơn giản theo tuyến + hạng
    const base = routeBasePrice(from, to);            // giá gốc 1 vé
    const classMul = { standard: 1.0, soft: 1.25, bed: 1.6 }[className] || 1;
    const total = Math.round(base * classMul * qty / 1000) * 1000;

    // Lưu gần đây
    localStorage.setItem('gahue:lastBooking', JSON.stringify({from,to,date,qty,className}));

    // Hiển thị kết quả
    result.innerHTML = `✅ Đã giữ chỗ tạm thời: <b>${qty}</b> vé ${labelClass(className)} tuyến <b>${labelStation(from)} → ${labelStation(to)}</b> ngày <b>${formatDateVN(date)}</b>. Ước tính: <b>${formatVND(total)}</b>.`;
    toast('Đặt giữ chỗ tạm thời thành công!');
  });

  function routeBasePrice(a,b){
    // bảng giá gốc theo khoảng cách tương đối (đơn vị VND / vé)
    const key = [a,b].sort().join('-');
    const table = {
      'SaiGon-HaNoi':     1127000,
      'Hue-DaNang':       162000,
      'Hue-HaNoi':        688000,
      'Hue-SaiGon':       731000,
      'Hue-QuangTri':     120000,
      'QuangTri-DaNang':  200000,
      'QuangTri-HaNoi':   630000,
      'QuangTri-SaiGon':  791000
    };
    return table[key] || 150000; // mặc định
  }
  function labelClass(c){ return {standard:'Ghế ngồi', soft:'Ghế mềm', bed:'Giường nằm'}[c] || c; }
  function labelStation(s){ return {Hue:'Huế', DaNang:'Đà Nẵng', QuangTri:'Quảng Trị', HaNoi: 'Hà Nội', SaiGon: 'Sài Gòn'}[s] || s; }
  function formatVND(n){ return n.toLocaleString('vi-VN', {style:'currency', currency:'VND'}); }
  function formatDateVN(d){ const [y,m,day]=d.split('-'); return `${day}/${m}/${y}`; }

  // Toast nhỏ thông báo
  function toast(msg){
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
      position:'fixed', left:'50%', transform:'translateX(-50%)',
      bottom:'24px', background:'#152a83', color:'#fff', padding:'10px 14px',
      borderRadius:'12px', boxShadow:'0 10px 24px rgba(0,0,0,.25)', zIndex:9999
    });
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 1800);
  }
}
/* (2) Reveal khi cuộn – phương pháp đơn giản */
document.addEventListener("DOMContentLoaded", () => {
  const reveals = document.querySelectorAll("[data-reveal], .highlights .card");
  const revealOnScroll = () => {
    const triggerBottom = window.innerHeight * 0.85;
    reveals.forEach(card => {
      const boxTop = card.getBoundingClientRect().top;
      if (boxTop < triggerBottom) card.classList.add("is-in");
    });
  };
  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();
});


