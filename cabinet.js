// ============================================================
// ZOOTO — Кабінет притулку (demo prototype, local storage only)
// ============================================================

const STORAGE_KEY = 'zooto_demo_shelter_v1';

const PAW_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 13.5c-2.6 0-6 3-6 5.8 0 1.5 1.1 2.4 2.6 2.4.9 0 1.7-.3 2.6-.6.5-.2 1.1-.4 1.6-.4h.4c.5 0 1.1.2 1.6.4.9.3 1.7.6 2.6.6 1.5 0 2.6-.9 2.6-2.4 0-2.8-3.4-5.8-6-5.8Z"/><ellipse cx="5.2" cy="10.2" rx="2" ry="2.6"/><ellipse cx="9.6" cy="6.2" rx="2" ry="2.6"/><ellipse cx="14.4" cy="6.2" rx="2" ry="2.6"/><ellipse cx="18.8" cy="10.2" rx="2" ry="2.6"/></svg>';
const SPECIES_ICONS = { cat: PAW_ICON, dog: PAW_ICON, other: PAW_ICON };

const seedState = () => ({
  shelter: { name: 'Притулок Хвостики', city: 'Львів', initials: 'ПХ' },
  animals: [
    { id: cryptoId(), name: 'Мурчик', species: 'cat', age: '2 роки', character: 'Ласкавий, любить обійми, ладнає з дітьми.', status: 'available', photo: '' },
    { id: cryptoId(), name: 'Рекс', species: 'dog', age: '4 роки', character: 'Активний, потребує простору для прогулянок.', status: 'reserved', photo: '' },
    { id: cryptoId(), name: 'Зіронька', species: 'cat', age: '6 місяців', character: '', status: 'adopted', photo: '' }
  ],
  funds: [
    { id: cryptoId(), title: 'Ветеринарна допомога для Рекса', desc: 'Терміновий збір на операцію та реабілітацію.', link: 'https://send.monobank.ua/jar/example', goal: 15000, raised: 6400, status: 'active' }
  ],
  announcement: {
    enabled: true,
    text: 'У нас з\'явились нові хвостики, які шукають дім! Завітайте до розділу «Тварини» — можливо, саме тут ваш майбутній улюбленець 🐾',
    image: ''
  }
});

function cryptoId(){ return 'id-' + Math.random().toString(36).slice(2, 10); }

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  }catch(e){}
  const fresh = seedState();
  saveState(fresh);
  return fresh;
}
function saveState(state){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

let state = loadState();
let editingAnimalId = null;
let editingFundId = null;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModals();
  initToasts();
  bindStaticControls();
  renderAll();

  // reveal on scroll
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting){ en.target.classList.add('in-view'); io.unobserve(en.target); } });
  }, { threshold:.1 }) : null;
  document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in-view'));

  // cursor glow
  const glow = document.querySelector('.cursor-glow');
  if (glow && matchMedia('(hover:hover) and (pointer:fine)').matches){
    let raf=null,mx=0,my=0;
    window.addEventListener('mousemove', e=>{
      mx=e.clientX; my=e.clientY; glow.classList.add('active');
      if(!raf) raf=requestAnimationFrame(()=>{ glow.style.transform=`translate(${mx}px, ${my}px) translate(-50%,-50%)`; raf=null; });
    });
  }
});

/* ============================================================
   TABS
   ============================================================ */
function initTabs(){
  const tabs = document.querySelectorAll('.cab-tab');
  const indicator = document.querySelector('.cab-tabs-indicator');
  function moveIndicator(tab){
    indicator.style.width = tab.offsetWidth + 'px';
    indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
  }
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.cab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('cab-panel-' + tab.dataset.tab).classList.add('active');
      moveIndicator(tab);
    });
  });
  const active = document.querySelector('.cab-tab.active') || tabs[0];
  requestAnimationFrame(() => moveIndicator(active));
  window.addEventListener('resize', () => moveIndicator(document.querySelector('.cab-tab.active')));
}

/* ============================================================
   MODALS
   ============================================================ */
function initModals(){
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.getAttribute('data-modal-open')));
  });
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', e => { if (e.target === bd) closeModal(bd.id); });
    bd.querySelectorAll('.modal-close').forEach(c => c.addEventListener('click', () => closeModal(bd.id)));
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach(bd => closeModal(bd.id)); });
}
function openModal(id){ const m = document.getElementById(id); if(!m) return; m.classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id){ const m = document.getElementById(id); if(!m) return; m.classList.remove('open'); document.body.style.overflow=''; }

/* ============================================================
   TOASTS
   ============================================================ */
function initToasts(){
  if (!document.querySelector('.toast-stack')){
    const stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
}
function toast(msg){
  const stack = document.querySelector('.toast-stack');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>${msg}</span>`;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 2600);
}

/* ============================================================
   STATIC CONTROLS (add buttons, forms, announcement, reset)
   ============================================================ */
function bindStaticControls(){
  // ---- animal modal open for "add" ----
  document.getElementById('btn-add-animal').addEventListener('click', () => {
    editingAnimalId = null;
    resetAnimalForm();
    document.getElementById('animal-modal-title').textContent = 'Новий вихованець';
    openModal('modal-animal');
  });
  document.getElementById('animal-form').addEventListener('submit', onAnimalSubmit);
  document.getElementById('animal-photo-input').addEventListener('change', onAnimalPhotoChange);

  // ---- fundraiser modal ----
  document.getElementById('btn-add-fund').addEventListener('click', () => {
    editingFundId = null;
    document.getElementById('fund-form').reset();
    document.getElementById('fund-modal-title').textContent = 'Новий збір';
    openModal('modal-fund');
  });
  document.getElementById('fund-form').addEventListener('submit', onFundSubmit);

  // ---- announcement ----
  document.getElementById('announce-toggle').checked = state.announcement.enabled;
  document.getElementById('announce-toggle').addEventListener('change', (e) => {
    state.announcement.enabled = e.target.checked;
    saveState(state); renderAnnouncement();
  });
  document.getElementById('announce-text').value = state.announcement.text;
  document.getElementById('announce-text').addEventListener('input', (e) => {
    state.announcement.text = e.target.value; saveState(state); renderAnnouncement();
  });
  document.getElementById('announce-photo-input').addEventListener('change', (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.announcement.image = reader.result;
      saveState(state); renderAnnouncement();
      document.getElementById('announce-dropzone-thumb').innerHTML = `<img src="${reader.result}" alt="">`;
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('btn-clear-announce-photo').addEventListener('click', () => {
    state.announcement.image = '';
    document.getElementById('announce-photo-input').value = '';
    document.getElementById('announce-dropzone-thumb').innerHTML = dropzoneIconSvg();
    saveState(state); renderAnnouncement();
  });

  // ---- reset demo ----
  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    if (!confirm('Скинути всі демо-дані кабінету до початкових значень?')) return;
    state = seedState();
    saveState(state);
    renderAll();
    toast('Демо-дані скинуто');
  });
}

function dropzoneIconSvg(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>';
}

/* ============================================================
   ANIMALS
   ============================================================ */
function resetAnimalForm(){
  const f = document.getElementById('animal-form');
  f.reset();
  document.getElementById('animal-photo-preview').innerHTML = dropzoneIconSvg();
  f.dataset.photo = '';
}
function onAnimalPhotoChange(e){
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('animal-photo-preview').innerHTML = `<img src="${reader.result}" alt="">`;
    document.getElementById('animal-form').dataset.photo = reader.result;
  };
  reader.readAsDataURL(file);
}
function onAnimalSubmit(e){
  e.preventDefault();
  const f = e.target;
  const data = {
    name: f.querySelector('[name=name]').value.trim(),
    species: f.querySelector('[name=species]').value,
    age: f.querySelector('[name=age]').value.trim(),
    character: f.querySelector('[name=character]').value.trim(),
    status: f.querySelector('[name=status]').value,
    photo: f.dataset.photo || ''
  };
  if (!data.name) return;

  if (editingAnimalId){
    const idx = state.animals.findIndex(a => a.id === editingAnimalId);
    if (idx > -1){
      const keepPhoto = data.photo || state.animals[idx].photo;
      state.animals[idx] = { ...state.animals[idx], ...data, photo: keepPhoto };
    }
    toast('Картку оновлено');
  } else {
    state.animals.unshift({ id: cryptoId(), ...data });
    toast('Вихованця додано');
  }
  saveState(state);
  closeModal('modal-animal');
  renderAnimals();
  renderStats();
}
function editAnimal(id){
  const a = state.animals.find(x => x.id === id); if(!a) return;
  editingAnimalId = id;
  const f = document.getElementById('animal-form');
  f.querySelector('[name=name]').value = a.name;
  f.querySelector('[name=species]').value = a.species;
  f.querySelector('[name=age]').value = a.age;
  f.querySelector('[name=character]').value = a.character;
  f.querySelector('[name=status]').value = a.status;
  f.dataset.photo = a.photo || '';
  document.getElementById('animal-photo-preview').innerHTML = a.photo ? `<img src="${a.photo}" alt="">` : dropzoneIconSvg();
  document.getElementById('animal-modal-title').textContent = 'Редагувати картку';
  openModal('modal-animal');
}
function deleteAnimal(id){
  if (!confirm('Видалити цю картку вихованця?')) return;
  state.animals = state.animals.filter(a => a.id !== id);
  saveState(state);
  renderAnimals(); renderStats();
  toast('Картку видалено');
}

const STATUS_LABEL = { available:'Доступний', reserved:'Резерв', adopted:'Прилаштований' };

function renderAnimals(){
  const grid = document.getElementById('animal-grid');
  if (!state.animals.length){
    grid.innerHTML = `
      <div class="cab-empty">
        <div class="icon-badge" style="margin:0 auto 16px;">${dropzoneIconSvg()}</div>
        <h4>Поки що немає жодного вихованця</h4>
        <p>Додайте першу картку — вона одразу зʼявиться на вашій сторінці притулку в каталозі Zooto.</p>
        <button class="btn btn-primary btn-sm" onclick="document.getElementById('btn-add-animal').click()">+ Додати вихованця</button>
      </div>`;
    return;
  }
  grid.innerHTML = state.animals.map(a => `
    <div class="animal-card reveal in-view">
      <div class="animal-photo" style="${a.photo ? `background-image:url('${a.photo}')` : ''}">
        ${a.photo ? '' : SPECIES_ICONS[a.species] || SPECIES_ICONS.other}
        <div class="animal-actions">
          <button class="icon-btn" title="Редагувати" onclick="editAnimal('${a.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn danger" title="Видалити" onclick="deleteAnimal('${a.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
          </button>
        </div>
      </div>
      <div class="animal-body">
        <div class="animal-body-top">
          <h4>${escapeHtml(a.name)}</h4>
          <span class="status-pill status-${a.status}">${STATUS_LABEL[a.status]}</span>
        </div>
        <div class="animal-meta">${a.age ? escapeHtml(a.age) : 'Вік не вказано'}</div>
        ${a.character ? `<p class="animal-desc">${escapeHtml(a.character)}</p>` : ''}
      </div>
    </div>
  `).join('');
}

/* ============================================================
   FUNDRAISERS
   ============================================================ */
function onFundSubmit(e){
  e.preventDefault();
  const f = e.target;
  const data = {
    title: f.querySelector('[name=title]').value.trim(),
    desc: f.querySelector('[name=desc]').value.trim(),
    link: f.querySelector('[name=link]').value.trim(),
    goal: Number(f.querySelector('[name=goal]').value) || 0,
    raised: Number(f.querySelector('[name=raised]').value) || 0,
    status: f.querySelector('[name=status]').value
  };
  if (!data.title || !data.link) return;

  if (editingFundId){
    const idx = state.funds.findIndex(x => x.id === editingFundId);
    if (idx > -1) state.funds[idx] = { ...state.funds[idx], ...data };
    toast('Збір оновлено');
  } else {
    state.funds.unshift({ id: cryptoId(), ...data });
    toast('Збір опубліковано');
  }
  saveState(state);
  closeModal('modal-fund');
  renderFunds(); renderStats();
}
function editFund(id){
  const fnd = state.funds.find(x => x.id === id); if(!fnd) return;
  editingFundId = id;
  const f = document.getElementById('fund-form');
  f.querySelector('[name=title]').value = fnd.title;
  f.querySelector('[name=desc]').value = fnd.desc;
  f.querySelector('[name=link]').value = fnd.link;
  f.querySelector('[name=goal]').value = fnd.goal || '';
  f.querySelector('[name=raised]').value = fnd.raised || '';
  f.querySelector('[name=status]').value = fnd.status;
  document.getElementById('fund-modal-title').textContent = 'Редагувати збір';
  openModal('modal-fund');
}
function deleteFund(id){
  if (!confirm('Видалити цей збір?')) return;
  state.funds = state.funds.filter(x => x.id !== id);
  saveState(state);
  renderFunds(); renderStats();
  toast('Збір видалено');
}
function copyFundLink(link){
  navigator.clipboard?.writeText(link).then(() => toast('Посилання скопійовано'));
}

function renderFunds(){
  const grid = document.getElementById('fund-grid');
  if (!state.funds.length){
    grid.innerHTML = `
      <div class="cab-empty">
        <div class="icon-badge" style="margin:0 auto 16px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
        </div>
        <h4>Активних зборів немає</h4>
        <p>Створіть збір і вставте посилання на банку (Monobank, PayPal тощо) — він зʼявиться на вашій сторінці.</p>
        <button class="btn btn-primary btn-sm" onclick="document.getElementById('btn-add-fund').click()">+ Створити збір</button>
      </div>`;
    return;
  }
  grid.innerHTML = state.funds.map(f => {
    const pct = f.goal ? Math.min(100, Math.round((f.raised / f.goal) * 100)) : null;
    return `
    <div class="fund-card reveal in-view">
      <div class="fund-top">
        <h4>${escapeHtml(f.title)}</h4>
        <span class="status-pill ${f.status === 'active' ? 'status-available' : 'status-adopted'}">${f.status === 'active' ? 'Активний' : 'Завершено'}</span>
      </div>
      ${f.desc ? `<p class="fund-desc">${escapeHtml(f.desc)}</p>` : ''}
      ${pct !== null ? `
        <div class="fund-bar-track"><div class="fund-bar-fill" style="width:${pct}%"></div></div>
        <div class="fund-goal-row"><span>${f.raised.toLocaleString('uk-UA')} грн</span><span>ціль ${f.goal.toLocaleString('uk-UA')} грн</span></div>
      ` : `<div style="height:18px"></div>`}
      <div class="fund-actions">
        <a class="btn btn-primary btn-sm fund-link-btn" href="${escapeAttr(f.link)}" target="_blank" rel="noopener">Відкрити банку</a>
        <button class="icon-btn" title="Копіювати посилання" onclick="copyFundLink('${escapeAttr(f.link)}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="icon-btn" title="Редагувати" onclick="editFund('${f.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="icon-btn danger" title="Видалити" onclick="deleteFund('${f.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');
}

/* ============================================================
   ANNOUNCEMENT
   ============================================================ */
function renderAnnouncement(){
  const card = document.getElementById('pinned-preview');
  const a = state.announcement;
  if (!a.enabled){
    card.innerHTML = `<p style="opacity:.55;font-style:italic;position:relative;z-index:1;">Оголошення вимкнено — на сторінці притулку воно не показується.</p>`;
    card.classList.add('empty');
    return;
  }
  card.classList.remove('empty');
  card.innerHTML = `
    <span class="pin-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5M9 3h6l-1 7 4 3H6l4-3Z"/></svg>
      Закріплено
    </span>
    ${a.image ? `<img src="${a.image}" alt="">` : ''}
    <p>${a.text ? escapeHtml(a.text) : 'Текст оголошення поки порожній — заповніть поле ліворуч.'}</p>
  `;
}

/* ============================================================
   STATS
   ============================================================ */
function renderStats(){
  const total = state.animals.length;
  const available = state.animals.filter(a => a.status === 'available').length;
  const adopted = state.animals.filter(a => a.status === 'adopted').length;
  const activeFunds = state.funds.filter(f => f.status === 'active').length;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-available').textContent = available;
  document.getElementById('stat-adopted').textContent = adopted;
  document.getElementById('stat-funds').textContent = activeFunds;
}

/* ============================================================
   UTIL
   ============================================================ */
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function escapeAttr(str){ return escapeHtml(str).replace(/`/g, '&#96;'); }

function renderAll(){
  document.getElementById('cab-shelter-name').textContent = state.shelter.name;
  document.getElementById('cab-shelter-city').textContent = state.shelter.city;
  document.getElementById('cab-avatar-initials').textContent = state.shelter.initials;
  document.getElementById('announce-toggle').checked = state.announcement.enabled;
  document.getElementById('announce-text').value = state.announcement.text;
  document.getElementById('announce-dropzone-thumb').innerHTML = state.announcement.image ? `<img src="${state.announcement.image}" alt="">` : dropzoneIconSvg();
  renderAnimals();
  renderFunds();
  renderAnnouncement();
  renderStats();
}
