// ============================================================
// ZOOTO — Адмін-панель (demo prototype, local storage only)
// ============================================================

const STORAGE_KEY = 'zooto_demo_admin_v1';
const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const DOC_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>';
const SHELTER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
const BREEDER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z"/></svg>';

const TYPE_LABEL = { shelter:'Притулок / волонтер', breeder:'Заводчик' };
const TYPE_ICON = { shelter:SHELTER_ICON, breeder:BREEDER_ICON };
const STATUS_LABEL = { pending:'На розгляді', approved:'Схвалено', rejected:'Відхилено' };

const seedState = () => ({
  applications: [
    { id:cid(), type:'shelter', name:'Притулок "Другий Шанс"', city:'Одеса', contact:'@shelter_odesa', submittedAt: daysAgo(0.2), status:'pending',
      docs:['Опис притулку.pdf'] , extra:{ 'Статус':'Офіційний притулок' } },
    { id:cid(), type:'breeder', name:'Cattery Aurora', city:'Харків', contact:'@aurora_cats', submittedAt: daysAgo(0.5), status:'pending',
      docs:['Сертифікат_WCF.pdf','Паспорт_власника.jpg'], extra:{ 'Вид тварин':'Коти' } },
    { id:cid(), type:'shelter', name:'Волонтер Оксана К.', city:'Дніпро', contact:'@oksana_vol', submittedAt: daysAgo(1), status:'pending',
      docs:[], extra:{ 'Статус':'Приватний волонтер' } },
    { id:cid(), type:'breeder', name:'Пітомник "Королівський Дар"', city:'Львів', contact:'@royal_dar', submittedAt: daysAgo(2), status:'approved',
      docs:['Сертифікат_КСУ.pdf'], extra:{ 'Вид тварин':'Собаки' } },
    { id:cid(), type:'breeder', name:'Fluffy Paws Kennel', city:'Київ', contact:'@fluffy_kennel', submittedAt: daysAgo(3), status:'rejected',
      docs:['Паспорт_власника.jpg'], extra:{ 'Вид тварин':'Коти' }, rejectReason:'Не вистачає сертифіката розплідника.' }
  ],
  verifications: [
    { id:cid(), name:'Cattery Sonce', city:'Київ', submittedAt: daysAgo(0.3), status:'pending',
      docs:['Паспорт_власника.jpg','Сертифікат_WCF.pdf','Родовід_матері.pdf','Родовід_батька.pdf','Ветпаспорт.jpg'] },
    { id:cid(), name:'Німецька вівчарка Барон (Kennel Zorro)', city:'Вінниця', submittedAt: daysAgo(1.2), status:'pending',
      docs:['Паспорт_власника.jpg','Сертифікат_КСУ.pdf','Родовід_матері.pdf','Родовід_батька.pdf'] },
    { id:cid(), name:'Мейн-кун Хаус', city:'Запоріжжя', submittedAt: daysAgo(4), status:'approved',
      docs:['Паспорт_власника.jpg','Сертифікат_TICA.pdf','Родовід_матері.pdf','Родовід_батька.pdf','Ветпаспорт.jpg'] }
  ]
});

function cid(){ return 'id-' + Math.random().toString(36).slice(2,10); }
function daysAgo(n){ return Date.now() - n*24*60*60*1000; }
function loadState(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); }catch(e){}
  const fresh = seedState(); saveState(fresh); return fresh;
}
function saveState(s){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }catch(e){} }

let state = loadState();
let appFilter = 'all';
let currentDetailId = null;
let currentDetailKind = null; // 'application' | 'verification'

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModals();
  initToasts();
  bindFilters();
  bindDetailActions();
  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    if (!confirm('Скинути демо-дані адмінки до початкових значень?')) return;
    state = seedState(); saveState(state); renderAll(); toast('Демо-дані скинуто');
  });
  renderAll();

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
function closeModal(id){ const m=document.getElementById(id); if(!m) return; m.classList.remove('open'); document.body.style.overflow=''; document.getElementById('reject-reason-box').classList.remove('show'); }

/* ============================================================ TOASTS */
function initToasts(){ if (!document.querySelector('.toast-stack')){ const s=document.createElement('div'); s.className='toast-stack'; document.body.appendChild(s); } }
function toast(msg){
  const stack = document.querySelector('.toast-stack');
  const el = document.createElement('div'); el.className='toast';
  el.innerHTML = `${CHECK_ICON}<span>${msg}</span>`;
  stack.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.remove(),400); }, 2600);
}

/* ============================================================ FILTERS */
function bindFilters(){
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      appFilter = chip.dataset.filter;
      renderApplications();
    });
  });
}

/* ============================================================ RENDER: APPLICATIONS */
function renderApplications(){
  const list = document.getElementById('app-list');
  let items = state.applications;
  if (appFilter === 'shelter' || appFilter === 'breeder') items = items.filter(a => a.type === appFilter);
  else if (appFilter === 'pending' || appFilter === 'approved' || appFilter === 'rejected') items = items.filter(a => a.status === appFilter);
  items = [...items].sort((a,b) => b.submittedAt - a.submittedAt);

  if (!items.length){
    list.innerHTML = `<div class="cab-empty"><div class="icon-badge" style="margin:0 auto 16px;">${CHECK_ICON}</div><h4>Нічого не знайдено</h4><p>За цим фільтром заявок немає.</p></div>`;
  } else {
    list.innerHTML = items.map(a => `
      <div class="app-row reveal in-view">
        <div class="app-type-icon">${TYPE_ICON[a.type]}</div>
        <div class="app-main">
          <div class="name">${escapeHtml(a.name)}</div>
          <div class="meta">${TYPE_LABEL[a.type]} · ${escapeHtml(a.city)} · ${escapeHtml(a.contact)}</div>
        </div>
        <div class="app-date">${relativeDate(a.submittedAt)}</div>
        <span class="status-pill app-status status-${a.status}">${STATUS_LABEL[a.status]}</span>
        <button class="btn btn-ghost btn-sm" onclick="openAppDetail('${a.id}')">Переглянути</button>
      </div>
    `).join('');
  }
  updateFilterCounts();
}
function updateFilterCounts(){
  const all = state.applications.length;
  const shelter = state.applications.filter(a=>a.type==='shelter').length;
  const breeder = state.applications.filter(a=>a.type==='breeder').length;
  const pending = state.applications.filter(a=>a.status==='pending').length;
  const approved = state.applications.filter(a=>a.status==='approved').length;
  const rejected = state.applications.filter(a=>a.status==='rejected').length;
  const set = (sel,val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
  set('[data-count="all"]', all);
  set('[data-count="shelter"]', shelter);
  set('[data-count="breeder"]', breeder);
  set('[data-count="pending"]', pending);
  set('[data-count="approved"]', approved);
  set('[data-count="rejected"]', rejected);
}

function openAppDetail(id){
  const a = state.applications.find(x => x.id === id); if(!a) return;
  currentDetailId = id; currentDetailKind = 'application';
  document.getElementById('detail-title').textContent = a.name;
  document.getElementById('detail-sub').textContent = `${TYPE_LABEL[a.type]} · подано ${relativeDate(a.submittedAt)}`;
  document.getElementById('detail-fields').innerHTML = `
    <div class="app-detail-field"><div class="label">Місто</div><div class="value">${escapeHtml(a.city)}</div></div>
    <div class="app-detail-field"><div class="label">Контакт</div><div class="value">${escapeHtml(a.contact)}</div></div>
    ${Object.entries(a.extra || {}).map(([k,v]) => `<div class="app-detail-field"><div class="label">${escapeHtml(k)}</div><div class="value">${escapeHtml(v)}</div></div>`).join('')}
  `;
  renderDocGallery(a.docs);
  renderDetailStatus(a.status, a.rejectReason);
  openModal('modal-detail');
}

function openVerifyDetail(id){
  const v = state.verifications.find(x => x.id === id); if(!v) return;
  currentDetailId = id; currentDetailKind = 'verification';
  document.getElementById('detail-title').textContent = v.name;
  document.getElementById('detail-sub').textContent = `Верифікація заводчика · подано ${relativeDate(v.submittedAt)}`;
  document.getElementById('detail-fields').innerHTML = `
    <div class="app-detail-field"><div class="label">Місто</div><div class="value">${escapeHtml(v.city)}</div></div>
    <div class="app-detail-field"><div class="label">Документів</div><div class="value">${v.docs.length} з 4+</div></div>
  `;
  renderDocGallery(v.docs);
  renderDetailStatus(v.status, v.rejectReason);
  openModal('modal-detail');
}

function renderDocGallery(docs){
  const wrap = document.getElementById('doc-gallery');
  if (!docs || !docs.length){ wrap.innerHTML = '<p style="font-size:13px;opacity:.55;margin:0;">Документи не додано.</p>'; return; }
  wrap.innerHTML = docs.map(name => `<div class="doc-chip" title="Демо-перегляд недоступний">${DOC_SVG}<span>${escapeHtml(name)}</span></div>`).join('');
}
function renderDetailStatus(status, rejectReason){
  const box = document.getElementById('detail-status-box');
  if (status === 'pending'){
    box.innerHTML = '';
    document.getElementById('modal-action-row').style.display = 'flex';
  } else {
    document.getElementById('modal-action-row').style.display = 'none';
    box.innerHTML = `<div style="margin-bottom:16px;"><span class="status-pill status-${status}">${STATUS_LABEL[status]}</span>${rejectReason ? `<p style="font-size:13px;opacity:.65;margin-top:10px;">Причина відмови: ${escapeHtml(rejectReason)}</p>` : ''}</div>`;
  }
}

function bindDetailActions(){
  document.getElementById('btn-approve').addEventListener('click', () => {
    setDetailStatus('approved');
  });
  document.getElementById('btn-reject-toggle').addEventListener('click', () => {
    document.getElementById('reject-reason-box').classList.add('show');
    document.getElementById('modal-action-row').style.display = 'none';
  });
  document.getElementById('btn-reject-confirm').addEventListener('click', () => {
    const reason = document.getElementById('reject-reason-input').value.trim();
    setDetailStatus('rejected', reason);
  });
}
function setDetailStatus(status, reason){
  if (currentDetailKind === 'application'){
    const a = state.applications.find(x => x.id === currentDetailId);
    if (a){ a.status = status; if (reason) a.rejectReason = reason; }
    saveState(state); renderApplications(); renderStats();
  } else if (currentDetailKind === 'verification'){
    const v = state.verifications.find(x => x.id === currentDetailId);
    if (v){ v.status = status; if (reason) v.rejectReason = reason; }
    saveState(state); renderVerifications(); renderStats();
  }
  closeModal('modal-detail');
  toast(status === 'approved' ? 'Заявку схвалено' : 'Заявку відхилено');
}

/* ============================================================ RENDER: VERIFICATIONS */
function renderVerifications(){
  const list = document.getElementById('verify-list');
  const items = [...state.verifications].sort((a,b) => b.submittedAt - a.submittedAt);
  if (!items.length){
    list.innerHTML = `<div class="cab-empty"><div class="icon-badge" style="margin:0 auto 16px;">${CHECK_ICON}</div><h4>Запитів немає</h4><p>Тут з'являться заводчики, які подали повний пакет документів.</p></div>`;
    return;
  }
  list.innerHTML = items.map(v => `
    <div class="app-row reveal in-view">
      <div class="app-type-icon">${BREEDER_ICON}</div>
      <div class="app-main">
        <div class="name">${escapeHtml(v.name)}</div>
        <div class="meta">${escapeHtml(v.city)} · ${v.docs.length} документів</div>
      </div>
      <div class="app-date">${relativeDate(v.submittedAt)}</div>
      <span class="status-pill app-status status-${v.status}">${STATUS_LABEL[v.status]}</span>
      <button class="btn btn-ghost btn-sm" onclick="openVerifyDetail('${v.id}')">Переглянути</button>
    </div>
  `).join('');
}

/* ============================================================ STATS */
function renderStats(){
  const pendingApps = state.applications.filter(a => a.status === 'pending').length;
  const pendingVerify = state.verifications.filter(v => v.status === 'pending').length;
  const approvedToday = state.applications.filter(a => a.status === 'approved').length + state.verifications.filter(v=>v.status==='approved').length;
  const rejected = state.applications.filter(a => a.status === 'rejected').length + state.verifications.filter(v=>v.status==='rejected').length;
  document.getElementById('stat-pending-apps').textContent = pendingApps;
  document.getElementById('stat-pending-verify').textContent = pendingVerify;
  document.getElementById('stat-approved').textContent = approvedToday;
  document.getElementById('stat-rejected').textContent = rejected;
}

/* ============================================================ UTIL */
function escapeHtml(str){ return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function relativeDate(ts){
  const diffMs = Date.now() - ts;
  const hours = diffMs / (1000*60*60);
  if (hours < 1) return 'щойно';
  if (hours < 24) return Math.floor(hours) + ' год тому';
  const days = Math.floor(hours/24);
  if (days === 1) return 'вчора';
  return days + ' дн. тому';
}

function renderAll(){
  renderApplications();
  renderVerifications();
  renderStats();
}
