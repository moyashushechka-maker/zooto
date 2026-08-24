// ============================================================
// ZOOTO — Кабінет заводчика (demo prototype, local storage only)
// ============================================================

const STORAGE_KEY = 'zooto_demo_breeder_v1';
const PAW_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 13.5c-2.6 0-6 3-6 5.8 0 1.5 1.1 2.4 2.6 2.4.9 0 1.7-.3 2.6-.6.5-.2 1.1-.4 1.6-.4h.4c.5 0 1.1.2 1.6.4.9.3 1.7.6 2.6.6 1.5 0 2.6-.9 2.6-2.4 0-2.8-3.4-5.8-6-5.8Z"/><ellipse cx="5.2" cy="10.2" rx="2" ry="2.6"/><ellipse cx="9.6" cy="6.2" rx="2" ry="2.6"/><ellipse cx="14.4" cy="6.2" rx="2" ry="2.6"/><ellipse cx="18.8" cy="10.2" rx="2" ry="2.6"/></svg>';
const DOC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

const VERIFY_ITEMS = [
  { key:'id', title:'Фото паспорта / ID власника', sub:'Лише для внутрішньої перевірки та арбітражу — не публікується на сайті.' },
  { key:'kennel', title:'Сертифікат розплідника', sub:'КСУ, WCF, TICA, FIFe, CFA, УКФ, ККУ чи інша офіційна організація.' },
  { key:'pedigree', title:'Родоводи батьків приплоду', sub:'Офіційні родоводи матері та батька з печатками організації.' },
  { key:'vetpassport', title:'Ветпаспорт з щепленнями', sub:'Сторінка з відмітками про чипування, обробку від паразитів і вакцинацію.' }
];

const PROMO_ANCHORS = [[3,120],[7,240],[14,420]]; // [days, total grn] — 40 грн/день база, знижки за обсяг
const BANNER_RATE = 75;

const seedState = () => ({
  kennel: { name: 'Cattery Sonce', city: 'Київ', initials: 'CS' },
  animals: [
    { id: cid(), name: 'Луна', breed: 'Британська короткошерста', gender: 'female', color: 'Блакитний', age: '3 місяці', desc: 'Грайлива, привчена до лотка, є перші щеплення.', price: 12000, status: 'available', photo: '', chip:'', vetPhoto:'', promoted:false, promoUntil:null },
    { id: cid(), name: '', breed: 'Мейн-кун', gender: 'male', color: 'Мармуровий', age: '2 місяці', desc: '', price: 18000, status: 'available', photo: '', chip:'UA123456789', vetPhoto:'', promoted:true, promoUntil: Date.now()+1000*60*60*24*3 },
    { id: cid(), name: 'Барон', breed: 'Німецька вівчарка', gender: 'male', color: 'Чорно-рудий', age: '4 місяці', desc: 'Родовід КСУ, обидва батьки — чемпіони породи.', price: 25000, status: 'reserved', photo: '', chip:'', vetPhoto:'', promoted:false, promoUntil:null }
  ],
  verify: { id:'', kennel:'', pedigree:'', vetpassport:'' },
  wallet: { balance: 0 }
});

function cid(){ return 'id-' + Math.random().toString(36).slice(2,10); }
function loadState(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); }catch(e){}
  const fresh = seedState(); saveState(fresh); return fresh;
}
function saveState(s){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }catch(e){} }

let state = loadState();
let editingAnimalId = null;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModals();
  initToasts();
  bindAnimalControls();
  bindPromoControls();
  renderAll(); // renderVerify() (called within) builds the checklist DOM and binds its own file inputs

  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting){ en.target.classList.add('in-view'); io.unobserve(en.target); } });
  }, { threshold:.1 }) : null;
  document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in-view'));

  const glow = document.querySelector('.cursor-glow');
  if (glow && matchMedia('(hover:hover) and (pointer:fine)').matches){
    let raf=null,mx=0,my=0;
    window.addEventListener('mousemove', e=>{
      mx=e.clientX; my=e.clientY; glow.classList.add('active');
      if(!raf) raf=requestAnimationFrame(()=>{ glow.style.transform=`translate(${mx}px, ${my}px) translate(-50%,-50%)`; raf=null; });
    });
  }
});

/* ============================================================ TABS */
function initTabs(){
  const tabs = document.querySelectorAll('.cab-tab');
  const indicator = document.querySelector('.cab-tabs-indicator');
  function move(tab){ indicator.style.width = tab.offsetWidth+'px'; indicator.style.transform = `translateX(${tab.offsetLeft}px)`; }
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t=>t.classList.remove('active')); tab.classList.add('active');
    document.querySelectorAll('.cab-panel').forEach(p=>p.classList.remove('active'));
    document.getElementById('cab-panel-'+tab.dataset.tab).classList.add('active');
    move(tab);
    if (tab.dataset.tab === 'promote') populatePromoTargetSelect();
  }));
  const active = document.querySelector('.cab-tab.active') || tabs[0];
  requestAnimationFrame(()=>move(active));
  window.addEventListener('resize', () => move(document.querySelector('.cab-tab.active')));
}

/* ============================================================ MODALS */
function initModals(){
  document.querySelectorAll('[data-modal-open]').forEach(btn => btn.addEventListener('click', () => openModal(btn.getAttribute('data-modal-open'))));
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', e => { if (e.target === bd) closeModal(bd.id); });
    bd.querySelectorAll('.modal-close').forEach(c => c.addEventListener('click', () => closeModal(bd.id)));
  });
  document.addEventListener('keydown', e => { if (e.key==='Escape') document.querySelectorAll('.modal-backdrop.open').forEach(bd=>closeModal(bd.id)); });
}
function openModal(id){ const m=document.getElementById(id); if(!m) return; m.classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id){ const m=document.getElementById(id); if(!m) return; m.classList.remove('open'); document.body.style.overflow=''; }

/* ============================================================ TOASTS */
function initToasts(){ if (!document.querySelector('.toast-stack')){ const s=document.createElement('div'); s.className='toast-stack'; document.body.appendChild(s); } }
function toast(msg){
  const stack = document.querySelector('.toast-stack');
  const el = document.createElement('div'); el.className='toast';
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>${msg}</span>`;
  stack.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.remove(),400); }, 2600);
}

/* ============================================================ ANIMALS */
function bindAnimalControls(){
  document.getElementById('btn-add-animal').addEventListener('click', () => {
    editingAnimalId = null;
    resetAnimalForm();
    document.getElementById('animal-modal-title').textContent = 'Новий вихованець';
    openModal('modal-animal');
  });
  document.getElementById('animal-form').addEventListener('submit', onAnimalSubmit);
  document.getElementById('animal-photo-input').addEventListener('change', (e) => filePreview(e, 'animal-photo-preview', (result) => document.getElementById('animal-form').dataset.photo = result));
  document.getElementById('animal-vet-input').addEventListener('change', (e) => filePreview(e, 'animal-vet-preview', (result) => document.getElementById('animal-form').dataset.vetphoto = result));

  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    if (!confirm('Скинути всі демо-дані кабінету до початкових значень?')) return;
    state = seedState(); saveState(state); renderAll(); toast('Демо-дані скинуто');
  });
}
function filePreview(e, previewId, onLoad){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const isPdf = file.type === 'application/pdf';
    document.getElementById(previewId).innerHTML = isPdf ? DOC_ICON : `<img src="${reader.result}" alt="">`;
    onLoad(reader.result);
  };
  reader.readAsDataURL(file);
}
function resetAnimalForm(){
  const f = document.getElementById('animal-form'); f.reset();
  document.getElementById('animal-photo-preview').innerHTML = dzIcon();
  document.getElementById('animal-vet-preview').innerHTML = dzIcon();
  f.dataset.photo = ''; f.dataset.vetphoto = '';
}
function dzIcon(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>'; }

function onAnimalSubmit(e){
  e.preventDefault();
  const f = e.target;
  const data = {
    name: f.querySelector('[name=name]').value.trim(),
    breed: f.querySelector('[name=breed]').value.trim(),
    gender: f.querySelector('[name=gender]').value,
    color: f.querySelector('[name=color]').value.trim(),
    age: f.querySelector('[name=age]').value.trim(),
    desc: f.querySelector('[name=desc]').value.trim(),
    price: Number(f.querySelector('[name=price]').value) || 0,
    status: f.querySelector('[name=status]').value,
    chip: f.querySelector('[name=chip]').value.trim(),
    photo: f.dataset.photo || '',
    vetPhoto: f.dataset.vetphoto || ''
  };
  if (!data.breed || !data.gender || !data.color || !data.price) return;

  if (editingAnimalId){
    const idx = state.animals.findIndex(a => a.id === editingAnimalId);
    if (idx > -1){
      const keepPhoto = data.photo || state.animals[idx].photo;
      const keepVet = data.vetPhoto || state.animals[idx].vetPhoto;
      state.animals[idx] = { ...state.animals[idx], ...data, photo:keepPhoto, vetPhoto:keepVet };
    }
    toast('Картку оновлено');
  } else {
    state.animals.unshift({ id: cid(), promoted:false, promoUntil:null, ...data });
    toast('Вихованця додано');
  }
  saveState(state); closeModal('modal-animal'); renderAnimals(); renderStats();
}
function editAnimal(id){
  const a = state.animals.find(x=>x.id===id); if(!a) return;
  editingAnimalId = id;
  const f = document.getElementById('animal-form');
  f.querySelector('[name=name]').value = a.name;
  f.querySelector('[name=breed]').value = a.breed;
  f.querySelector('[name=gender]').value = a.gender;
  f.querySelector('[name=color]').value = a.color;
  f.querySelector('[name=age]').value = a.age;
  f.querySelector('[name=desc]').value = a.desc;
  f.querySelector('[name=price]').value = a.price;
  f.querySelector('[name=status]').value = a.status;
  f.querySelector('[name=chip]').value = a.chip;
  f.dataset.photo = a.photo || ''; f.dataset.vetphoto = a.vetPhoto || '';
  document.getElementById('animal-photo-preview').innerHTML = a.photo ? `<img src="${a.photo}" alt="">` : dzIcon();
  document.getElementById('animal-vet-preview').innerHTML = a.vetPhoto ? (a.vetPhoto.startsWith('data:application/pdf') ? DOC_ICON : `<img src="${a.vetPhoto}" alt="">`) : dzIcon();
  document.getElementById('animal-modal-title').textContent = 'Редагувати картку';
  openModal('modal-animal');
}
function deleteAnimal(id){
  if (!confirm('Видалити цю картку вихованця?')) return;
  state.animals = state.animals.filter(a=>a.id!==id);
  saveState(state); renderAnimals(); renderStats();
  toast('Картку видалено');
}

const STATUS_LABEL = { available:'Доступний', reserved:'Резерв', sold:'Продано' };
const GENDER_LABEL = { male:'Хлопчик', female:'Дівчинка' };

function renderAnimals(){
  const grid = document.getElementById('animal-grid');
  if (!state.animals.length){
    grid.innerHTML = `
      <div class="cab-empty">
        <div class="icon-badge" style="margin:0 auto 16px;">${PAW_ICON}</div>
        <h4>Поки що немає жодного оголошення</h4>
        <p>Додайте першого вихованця — без обмежень по кількості карток.</p>
        <button class="btn btn-primary btn-sm" onclick="document.getElementById('btn-add-animal').click()">+ Додати вихованця</button>
      </div>`;
    return;
  }
  grid.innerHTML = state.animals.map(a => {
    const isPromoted = a.promoted && a.promoUntil && a.promoUntil > Date.now();
    return `
    <div class="b-animal-card reveal in-view ${isPromoted ? 'is-promoted' : ''}">
      <div class="b-photo" style="${a.photo ? `background-image:url('${a.photo}')` : ''}">
        ${a.photo ? '' : PAW_ICON}
        ${isPromoted ? `<span class="promo-flag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h8l-1 8 10-12h-8z"/></svg>У топі</span>` : ''}
        <div class="b-actions">
          <button class="icon-btn" title="Редагувати" onclick="editAnimal('${a.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn danger" title="Видалити" onclick="deleteAnimal('${a.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
          </button>
        </div>
      </div>
      <div class="b-body">
        <div class="b-body-top">
          <h4>${escapeHtml(a.name || a.breed)}</h4>
          <span class="price-tag">${a.price.toLocaleString('uk-UA')} грн</span>
        </div>
        <div class="b-meta">
          <span class="b-tag gender-pill">${GENDER_LABEL[a.gender] || ''}</span>
          <span class="b-tag">${escapeHtml(a.breed)}</span>
          <span class="b-tag">${escapeHtml(a.color)}</span>
          <span class="status-pill status-${a.status === 'available' ? 'available' : (a.status==='reserved' ? 'reserved' : 'adopted')}">${STATUS_LABEL[a.status]}</span>
        </div>
        ${a.desc ? `<p class="b-desc">${escapeHtml(a.desc)}</p>` : ''}
        <button class="btn btn-ghost btn-sm b-promote-btn" onclick="goPromote('${a.id}')">
          ${isPromoted ? 'Керувати просуванням' : '🚀 Просунути в топ'}
        </button>
      </div>
    </div>`;
  }).join('');
}
function goPromote(animalId){
  document.querySelector('.cab-tab[data-tab="promote"]').click();
  setTimeout(() => {
    const sel = document.getElementById('promo-target-select');
    if (sel) sel.value = animalId;
  }, 50);
}

/* ============================================================ VERIFICATION */
function bindVerifyControls(){
  VERIFY_ITEMS.forEach(item => {
    const input = document.getElementById('verify-file-' + item.key);
    input.addEventListener('change', (e) => {
      const file = e.target.files[0]; if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.verify[item.key] = reader.result;
        saveState(state);
        renderVerify();
        toast('Документ завантажено');
      };
      reader.readAsDataURL(file);
    });
  });
}
function removeVerifyDoc(key){
  state.verify[key] = '';
  saveState(state); renderVerify();
}
function renderVerify(){
  const doneCount = VERIFY_ITEMS.filter(i => !!state.verify[i.key]).length;
  const total = VERIFY_ITEMS.length;
  const pct = Math.round((doneCount/total)*100);

  // ring
  const r = 34, c = 2*Math.PI*r;
  document.getElementById('vp-ring-fill').setAttribute('stroke-dasharray', c);
  document.getElementById('vp-ring-fill').setAttribute('stroke-dashoffset', c - (pct/100)*c);
  document.getElementById('vp-ring-label').textContent = doneCount + '/' + total;

  let state_, label;
  if (doneCount === 0){ state_='none'; label='Не верифіковано'; }
  else if (doneCount < total){ state_='pending'; label='На розгляді'; }
  else { state_='done'; label='Перевірений заводчик'; }

  document.querySelectorAll('.verify-badge').forEach(b => {
    b.className = 'verify-badge state-' + state_;
    b.innerHTML = (state_==='done' ? CHECK_ICON : '') + `<span>${label}</span>`;
  });
  document.getElementById('verify-progress-note').textContent =
    state_ === 'done' ? 'Усі документи завантажено — бейдж активний на вашому профілі.'
    : `Завантажено ${doneCount} з ${total} документів. Заповніть решту, щоб отримати бейдж «Перевірений заводчик».`;

  const list = document.getElementById('verify-checklist');
  list.innerHTML = VERIFY_ITEMS.map((item, idx) => {
    const val = state.verify[item.key];
    const isPdf = val && val.startsWith('data:application/pdf');
    return `
    <div class="verify-item ${val ? 'done' : ''}">
      <div class="verify-num">${val ? CHECK_ICON : (idx+1)}</div>
      <div>
        <div class="verify-item-title">${item.title}</div>
        <div class="verify-item-sub">${item.sub}</div>
      </div>
      <div class="verify-item-file">
        <label class="dropzone" style="min-width:180px;">
          <input type="file" id="verify-file-${item.key}-visual" accept="image/*,.pdf" style="display:none;" onchange="document.getElementById('verify-file-${item.key}').files = this.files; document.getElementById('verify-file-${item.key}').dispatchEvent(new Event('change'));">
          <div class="dropzone-thumb">${val ? (isPdf ? DOC_ICON : `<img src="${val}" alt="">`) : dzIcon()}</div>
          <div class="dropzone-text">${val ? 'Замінити файл' : 'Завантажити'}<span></span></div>
        </label>
        ${val ? `<button type="button" class="icon-btn danger" title="Прибрати" onclick="removeVerifyDoc('${item.key}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>` : ''}
      </div>
    </div>`;
  }).join('') + VERIFY_ITEMS.map(item => `<input type="file" id="verify-file-${item.key}" accept="image/*,.pdf" style="display:none;">`).join('');

  // rebind (list was re-created)
  bindVerifyControls();
}

/* ============================================================ PROMOTION */
function bindPromoControls(){
  const topSlider = document.getElementById('promo-top-slider');
  const topInput = document.getElementById('promo-top-days');
  const bannerSlider = document.getElementById('promo-banner-slider');
  const bannerInput = document.getElementById('promo-banner-days');

  function syncTop(days){
    days = clamp(days, 3, 30);
    topSlider.value = days; topInput.value = days;
    const pct = ((days-3)/(30-3))*100;
    topSlider.style.setProperty('--pct', pct+'%');
    updateTopSummary(days);
  }
  function syncBanner(days){
    days = clamp(days, 1, 30);
    bannerSlider.value = days; bannerInput.value = days;
    const pct = ((days-1)/(30-1))*100;
    bannerSlider.style.setProperty('--pct', pct+'%');
    updateBannerSummary(days);
  }
  topSlider.addEventListener('input', () => syncTop(Number(topSlider.value)));
  topInput.addEventListener('input', () => syncTop(Number(topInput.value)||3));
  bannerSlider.addEventListener('input', () => syncBanner(Number(bannerSlider.value)));
  bannerInput.addEventListener('input', () => syncBanner(Number(bannerInput.value)||1));

  syncTop(7); syncBanner(3);

  document.getElementById('btn-order-top').addEventListener('click', () => {
    const sel = document.getElementById('promo-target-select');
    const animalId = sel.value;
    if (!animalId) { toast('Оберіть вихованця для просування'); return; }
    const days = Number(topInput.value);
    const animal = state.animals.find(a => a.id === animalId);
    if (animal){
      animal.promoted = true;
      animal.promoUntil = Date.now() + days*24*60*60*1000;
      saveState(state);
      renderAnimals(); renderActivePromos(); renderStats();
      toast(`Просування замовлено на ${days} дн. (демо)`);
    }
  });
  document.getElementById('btn-order-banner').addEventListener('click', () => {
    toast('Заявку на банер збережено (демо) — оплата підключиться пізніше');
  });
}
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function totalForDays(days){
  const anchors = PROMO_ANCHORS;
  if (days <= anchors[0][0]) return Math.round(days * (anchors[0][1]/anchors[0][0]));
  for (let i=0;i<anchors.length-1;i++){
    const [d1,p1] = anchors[i], [d2,p2] = anchors[i+1];
    if (days >= d1 && days <= d2){
      const t = (days-d1)/(d2-d1);
      return Math.round(p1 + t*(p2-p1));
    }
  }
  const [ld, lp] = anchors[anchors.length-1];
  const perDay = lp/ld * 0.8; // ~30 грн/день continuing rate beyond 14 days
  return Math.round(lp + (days-ld)*30);
}
function updateTopSummary(days){
  const total = totalForDays(days);
  const base = days*40;
  const savePct = base > total ? Math.round((1-total/base)*100) : 0;
  document.getElementById('promo-top-total').innerHTML =
    (savePct>0 ? `<span class="promo-total-strike">${base.toLocaleString('uk-UA')} грн</span>` : '') +
    `${total.toLocaleString('uk-UA')} грн` +
    (savePct>0 ? `<span class="promo-save-chip">-${savePct}%</span>` : '');
}
function updateBannerSummary(days){
  const total = days*BANNER_RATE;
  document.getElementById('promo-banner-total').textContent = total.toLocaleString('uk-UA') + ' грн';
}
function populatePromoTargetSelect(){
  const sel = document.getElementById('promo-target-select');
  if (!state.animals.length){
    sel.innerHTML = '<option value="">Спочатку додайте вихованця</option>';
    return;
  }
  sel.innerHTML = state.animals.map(a => `<option value="${a.id}">${escapeHtml(a.name || a.breed)} — ${a.price.toLocaleString('uk-UA')} грн</option>`).join('');
  renderActivePromos();
}
function renderActivePromos(){
  const wrap = document.getElementById('active-promo-list');
  const active = state.animals.filter(a => a.promoted && a.promoUntil > Date.now());
  if (!active.length){ wrap.innerHTML = '<p style="font-size:13.5px;opacity:.55;margin:0;">Активних просувань поки немає.</p>'; return; }
  wrap.innerHTML = active.map(a => {
    const daysLeft = Math.max(1, Math.ceil((a.promoUntil - Date.now())/(24*60*60*1000)));
    return `<div class="active-promo-item">
      <div class="left">🚀 ${escapeHtml(a.name || a.breed)}</div>
      <div class="days-left">залишилось ${daysLeft} дн.</div>
    </div>`;
  }).join('');
}

/* ============================================================ STATS */
function renderStats(){
  document.getElementById('stat-total').textContent = state.animals.length;
  document.getElementById('stat-available').textContent = state.animals.filter(a=>a.status==='available').length;
  document.getElementById('stat-sold').textContent = state.animals.filter(a=>a.status==='sold').length;
  document.getElementById('stat-promoted').textContent = state.animals.filter(a=>a.promoted && a.promoUntil > Date.now()).length;
}

/* ============================================================ UTIL */
function escapeHtml(str){ return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function renderAll(){
  document.getElementById('cab-kennel-name').textContent = state.kennel.name;
  document.getElementById('cab-kennel-name-2').textContent = state.kennel.name;
  document.getElementById('cab-kennel-city').textContent = state.kennel.city;
  document.getElementById('cab-avatar-initials').textContent = state.kennel.initials;
  document.getElementById('wallet-balance').innerHTML = state.wallet.balance.toLocaleString('uk-UA') + ' <span>грн</span>';
  renderAnimals();
  renderVerify();
  populatePromoTargetSelect();
  renderStats();
}
