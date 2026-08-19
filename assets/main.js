// ============================================================
// ZOOTO — shared interactivity
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- mobile drawer ---------- */
  const burger = document.querySelector('.nav-burger');
  const drawer = document.querySelector('.mobile-drawer');
  const drawerClose = document.querySelector('.mobile-drawer-close');
  if (burger && drawer) {
    burger.addEventListener('click', () => drawer.classList.add('open'));
    drawerClose && drawerClose.addEventListener('click', () => drawer.classList.remove('open'));
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('open')));
  }

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el, i) => {
      el.style.setProperty('--i', i % 6);
      io.observe(el);
    });
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---------- cursor glow (desktop) ---------- */
  const glow = document.querySelector('.cursor-glow');
  if (glow && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let raf = null, mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      glow.classList.add('active');
      if (!raf) {
        raf = requestAnimationFrame(() => {
          glow.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
          raf = null;
        });
      }
    });
    document.addEventListener('mouseleave', () => glow.classList.remove('active'));
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.closest('.faq').querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
          other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        }
      });
      if (isOpen) {
        item.classList.remove('open');
        a.style.maxHeight = null;
        q.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- audience switcher (marketplace page) ---------- */
  const switcher = document.querySelector('.switcher');
  if (switcher) {
    const buttons = switcher.querySelectorAll('button[data-audience]');
    buttons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        switcher.dataset.active = idx;
        document.querySelectorAll('.audience-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('panel-' + btn.dataset.audience).classList.add('active');
        history.replaceState(null, '', '#' + btn.dataset.audience);
      });
    });
    const hash = location.hash.replace('#', '');
    const target = switcher.querySelector(`button[data-audience="${hash}"]`);
    if (target) target.click();
  }

  /* ---------- cooperation category tabs ---------- */
  const coopCats = document.querySelectorAll('.coop-cat');
  if (coopCats.length) {
    coopCats.forEach(cat => {
      cat.addEventListener('click', () => {
        coopCats.forEach(c => c.classList.remove('active'));
        cat.classList.add('active');
        document.querySelectorAll('.coop-block').forEach(b => b.classList.remove('active'));
        document.getElementById('coop-' + cat.dataset.coop).classList.add('active');
        document.getElementById('coop-detail-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ---------- modals ---------- */
  const openers = document.querySelectorAll('[data-modal-open]');
  const backdrops = document.querySelectorAll('.modal-backdrop');
  function closeAll() {
    backdrops.forEach(b => b.classList.remove('open'));
    document.body.style.overflow = '';
  }
  openers.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-modal-open');
      const modal = document.getElementById(id);
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });
  backdrops.forEach(backdrop => {
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeAll(); });
    backdrop.querySelectorAll('.modal-close').forEach(c => c.addEventListener('click', closeAll));
    const form = backdrop.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const success = backdrop.querySelector('.modal-success');
        const formEl = backdrop.querySelector('.modal-form');
        if (success && formEl) {
          formEl.style.display = 'none';
          success.style.display = 'block';
        }
      });
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

});
