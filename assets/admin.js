// ============================================================
// ZOOTO — Адмін-панель (РЕАЛЬНІ дані з Supabase)
// ============================================================
import { supabase } from './auth-client.js';

const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const DOC_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>';
const SHELTER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
const BREEDER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z"/></svg>';

const TYPE_LABEL = { shelter:'Притулок / волонтер', breeder:'Заводчик' };
const BREEDER_TYPE_LABEL = { private:'Приватний заводчик', kennel:'Офіційний розплідник', exotic:'Екзоти / гризуни' };
const TYPE_ICON = { shelter:SHELTER_ICON, breeder:BREEDER_ICON };
const STATUS_LABEL = { pending:'На розгляді', approved:'Схвалено', rejected:'Відхилено', verified:'Перевірено' };

let applications = [];
let parentAnimals = [];
let profilesById = {};
let appFilter = 'all';
let currentDetailId = null;
let currentDetailKind = null; // 'application' | 'parent'

document.addEventListener('DOMContentLoaded', async () => {
  const allowed = await checkAdminAccess();
  if (!allowed) return;

  initTabs();
  initModals();
  initToasts();
  bindFilters();
  bindDetailActions();
  document.getElementById('btn-refresh').addEventListener('click', async () => {
    await loadAll(); renderAll(); toast('Оновлено');
  });

  await loadAll();
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

/* ============================================================ ACCESS GUARD */
async function checkAdminAccess(){
  const gate = document.getElementById('admin-gate');
  const app = document.getElementById('admin-app');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user){
    gate.style.display = 'flex';
    document.getElementById('admin-gate-title').textContent = 'Потрібен вхід';
    document.getElementById('admin-gate-text').textContent = 'Увійдіть у акаунт з правами адміністратора.';
    const cta = document.getElementById('admin-gate-cta');
    cta.textContent = 'Увійти'; cta.href = 'login.html'; cta.style.display = 'inline-flex';
    return false;
  }
  const { data: profile, error } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (error || !profile || !profile.is_admin){
    gate.style.display = 'flex';
    document.getElementById('admin-gate-title').textContent = 'Немає доступу';
    document.getElementById('admin-gate-text').textContent = 'У цього акаунту немає прав адміністратора Zooto.';
    const cta = document.getElementById('admin-gate-cta');
    cta.textContent = 'На сайт Zooto'; cta.href = 'index.html'; cta.style.display = 'inline-flex';
    return false;
  }
  gate.style.display = 'none';
  app.style.display = 'block';
  return true;
}

/* ============================================================ DATA LOADING */
async function loadAll(){
  const { data: apps } = await supabase.from('applications').select('*').order('created_at', { ascending:false });
  applications = apps || [];

  const { data: parents } = await supabase.from('parent_animals').select('*').order('created_at', { ascending:false });
  parentAnimals = parents || [];

  const ids = new Set();
  applications.forEach(a => ids.add(a.user_id));
  parentAnimals.forEach(p => ids.add(p.breeder_id));
  profilesById = {};
  if (ids.size){
    const { data: profs } = await supabase.from('profiles').select('*').in('id', Array.from(ids));
    (profs || []).forEach(p => profilesById[p.id] = p);
  }
}

function profileFor(userId){
  return profilesById[userId] || { display_name: '', email: '', city: '' };
}

async function docUrl(path){
  if (!path) return null;
  const { data, error } = await supabase.storage.from('verification-docs').createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

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
  let items = applications;
  if (appFilter === 'shelter' || appFilter === 'breeder') items = items.filter(a => a.type === appFilter);
  else if (appFilter === 'pending' || appFilter === 'approved' || appFilter === 'rejected') items = items.filter(a => a.status === appFilter);

  if (!items.length){
    list.innerHTML = `<div class="cab-empty"><div class="icon-badge" style="margin:0 auto 16px;">${CHECK_ICON}</div><h4>Нічого не знайдено</h4><p>За цим фільтром заявок немає.</p></div>`;
  } else {
    list.innerHTML = items.map(a => {
      const prof = profileFor(a.user_id);
      const name = a.full_name || a.kennel_name || prof.display_name || prof.email || 'Без назви';
      const subMeta = [
        TYPE_LABEL[a.type] + (a.type === 'breeder' && a.breeder_type ? ` · ${BREEDER_TYPE_LABEL[a.breeder_type] || a.breeder_type}` : ''),
        prof.city, prof.email
      ].filter(Boolean).join(' · ');
      return `
      <div class="app-row reveal in-view">
        <div class="app-type-icon">${TYPE_ICON[a.type] || SHELTER_ICON}</div>
        <div class="app-main">
          <div class="name">${escapeHtml(name)}</div>
          <div class="meta">${escapeHtml(subMeta)}</div>
        </div>
        <div class="app-date">${relativeDate(a.created_at)}</div>
        <span class="status-pill app-status status-${a.status}">${STATUS_LABEL[a.status]}</span>
        <button class="btn btn-ghost btn-sm" onclick="window.__adminOpenAppDetail('${a.id}')">Переглянути</button>
      </div>
    `;}).join('');
  }
  updateFilterCounts();
}
function updateFilterCounts(){
  const set = (sel,val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
  set('[data-count="all"]', applications.length);
  set('[data-count="shelter"]', applications.filter(a=>a.type==='shelter').length);
  set('[data-count="breeder"]', applications.filter(a=>a.type==='breeder').length);
  set('[data-count="pending"]', applications.filter(a=>a.status==='pending').length);
  set('[data-count="approved"]', applications.filter(a=>a.status==='approved').length);
  set('[data-count="rejected"]', applications.filter(a=>a.status==='rejected').length);
}

async function openAppDetail(id){
  const a = applications.find(x => x.id === id); if(!a) return;
  currentDetailId = id; currentDetailKind = 'application';
  const prof = profileFor(a.user_id);
  const name = a.full_name || a.kennel_name || prof.display_name || prof.email;

  document.getElementById('detail-title').textContent = name;
  document.getElementById('detail-sub').textContent = `${TYPE_LABEL[a.type]}${a.breeder_type ? ' · ' + (BREEDER_TYPE_LABEL[a.breeder_type]||a.breeder_type) : ''} · подано ${relativeDate(a.created_at)}`;

  const fields = [
    ['Email', prof.email], ['Місто', prof.city], ['Контакт', a.contact],
    a.shelter_status ? ['Статус притулку', a.shelter_status === 'official' ? 'Офіційний притулок' : 'Приватний волонтер'] : null,
    a.kennel_name ? ['Назва розплідника', a.kennel_name] : null,
    (a.name_matches_cert !== null && a.name_matches_cert !== undefined) ? ['ПІБ = сертифікат?', a.name_matches_cert ? 'Так' : 'Ні (є свідоцтво)'] : null,
    a.proof_doc_type ? ['Тип документа', {club_card:'Членський квиток', pedigree:'Родовід тварини', diploma:'Диплом заводчика'}[a.proof_doc_type] || a.proof_doc_type] : null,
    (a.exotic_has_docs !== null && a.exotic_has_docs !== undefined) ? ['Тип перевірки', a.exotic_has_docs ? 'Клубний документ / CITES' : 'Візуальна перевірка умов'] : null,
  ].filter(Boolean);
  document.getElementById('detail-fields').innerHTML = fields.map(([k,v]) => `<div class="app-detail-field"><div class="label">${escapeHtml(k)}</div><div class="value">${escapeHtml(v || '—')}</div></div>`).join('');

  const docs = [
    a.passport_doc_path ? ['Паспорт власника', a.passport_doc_path] : null,
    a.proof_doc_path ? ['Документ на підтвердження', a.proof_doc_path] : null,
    a.kennel_cert_doc_path ? ['Сертифікат розплідника', a.kennel_cert_doc_path] : null,
    a.marriage_cert_doc_path ? ['Свідоцтво про шлюб / спільне володіння', a.marriage_cert_doc_path] : null,
    a.exotic_doc_path ? ['Клубний документ / CITES', a.exotic_doc_path] : null,
    a.exotic_proof_path ? ['Фото/відео умов утримання', a.exotic_proof_path] : null,
  ].filter(Boolean);
  await renderDocGallery(docs);
  renderDetailStatus(a.status, a.reject_reason);
  openModal('modal-detail');
}

async function openParentDetail(id){
  const p = parentAnimals.find(x => x.id === id); if(!p) return;
  currentDetailId = id; currentDetailKind = 'parent';
  const prof = profileFor(p.breeder_id);

  document.getElementById('detail-title').textContent = p.home_name || p.official_name;
  document.getElementById('detail-sub').textContent = `Тварина-батько · ${prof.display_name || prof.email} · подано ${relativeDate(p.created_at)}`;

  const fields = [
    ['Вид', p.species === 'dog' ? 'Собака' : 'Кішка'], ['Стать', p.gender === 'female' ? 'Самка' : 'Самець'],
    ['Порода', p.breed], ['Кличка за документами', p.official_name],
    p.color ? ['Окрас', p.color] : null, p.ems_code ? ['EMS-код', p.ems_code] : null,
    ['Заводчик', prof.display_name || prof.email], ['Місто', prof.city],
  ].filter(Boolean);
  document.getElementById('detail-fields').innerHTML = fields.map(([k,v]) => `<div class="app-detail-field"><div class="label">${escapeHtml(k)}</div><div class="value">${escapeHtml(v || '—')}</div></div>`).join('');

  const docs = [
    p.photo_path ? ['Фото тварини', p.photo_path] : null,
    p.pedigree_doc_path ? ['Родовід (Pedigree)', p.pedigree_doc_path] : null,
    p.vetpassport_doc_path ? ['Ветпаспорт', p.vetpassport_doc_path] : null,
  ].filter(Boolean);
  await renderDocGallery(docs);
  renderDetailStatus(p.status === 'verified' ? 'approved' : p.status, p.reject_reason);
  openModal('modal-detail');
}
window.__adminOpenAppDetail = openAppDetail;
window.__adminOpenParentDetail = openParentDetail;

async function renderDocGallery(docs){
  const wrap = document.getElementById('doc-gallery');
  if (!docs.length){ wrap.innerHTML = '<p style="font-size:13px;opacity:.55;margin:0;">Документи не додано.</p>'; return; }
  wrap.innerHTML = docs.map(([label]) => `<div class="doc-chip">${DOC_SVG}<span>${escapeHtml(label)}</span></div>`).join('');
  const chips = wrap.querySelectorAll('.doc-chip');
  docs.forEach(async ([label, path], i) => {
    const url = await docUrl(path);
    const chip = chips[i];
    if (!chip) return;
    if (url){
      const a = document.createElement('a');
      a.className = 'doc-chip'; a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.innerHTML = `${DOC_SVG}<span>${escapeHtml(label)}</span>`;
      chip.replaceWith(a);
    } else {
      chip.querySelector('span').textContent += ' (недоступно)';
    }
  });
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
  document.getElementById('btn-approve').addEventListener('click', () => setDetailStatus('approved'));
  document.getElementById('btn-reject-toggle').addEventListener('click', () => {
    document.getElementById('reject-reason-box').classList.add('show');
    document.getElementById('modal-action-row').style.display = 'none';
  });
  document.getElementById('btn-reject-confirm').addEventListener('click', () => {
    const reason = document.getElementById('reject-reason-input').value.trim();
    setDetailStatus('rejected', reason);
  });
}
async function setDetailStatus(status, reason){
  try{
    if (currentDetailKind === 'application'){
      const patch = { status };
      if (reason) patch.reject_reason = reason;
      const { error } = await supabase.from('applications').update(patch).eq('id', currentDetailId);
      if (error) throw error;
      const a = applications.find(x => x.id === currentDetailId);
      if (a){ a.status = status; if (reason) a.reject_reason = reason; }
      renderApplications(); renderStats();
    } else if (currentDetailKind === 'parent'){
      const dbStatus = status === 'approved' ? 'verified' : 'rejected';
      const patch = { status: dbStatus };
      if (reason) patch.reject_reason = reason;
      const { error } = await supabase.from('parent_animals').update(patch).eq('id', currentDetailId);
      if (error) throw error;
      const p = parentAnimals.find(x => x.id === currentDetailId);
      if (p){ p.status = dbStatus; if (reason) p.reject_reason = reason; }
      renderParents(); renderStats();
    }
    closeModal('modal-detail');
    toast(status === 'approved' ? 'Заявку схвалено' : 'Заявку відхилено');
  } catch(err){
    toast('Не вдалося зберегти. Спробуйте ще раз.');
  }
}

/* ============================================================ RENDER: PARENT ANIMALS */
function renderParents(){
  const list = document.getElementById('verify-list');
  if (!parentAnimals.length){
    list.innerHTML = `<div class="cab-empty"><div class="icon-badge" style="margin:0 auto 16px;">${CHECK_ICON}</div><h4>Тварин-батьків ще немає</h4><p>Тут з'являться племінні тварини, яких заводчики додають у своєму кабінеті.</p></div>`;
    return;
  }
  list.innerHTML = parentAnimals.map(p => {
    const prof = profileFor(p.breeder_id);
    const statusKey = p.status === 'verified' ? 'approved' : p.status;
    return `
    <div class="app-row reveal in-view">
      <div class="app-type-icon">${BREEDER_ICON}</div>
      <div class="app-main">
        <div class="name">${escapeHtml(p.home_name || p.official_name)}</div>
        <div class="meta">${escapeHtml(p.breed)} · ${escapeHtml(prof.display_name || prof.email || '')}</div>
      </div>
      <div class="app-date">${relativeDate(p.created_at)}</div>
      <span class="status-pill app-status status-${statusKey}">${STATUS_LABEL[p.status]}</span>
      <button class="btn btn-ghost btn-sm" onclick="window.__adminOpenParentDetail('${p.id}')">Переглянути</button>
    </div>
  `;}).join('');
}

/* ============================================================ STATS */
function renderStats(){
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const pendingParents = parentAnimals.filter(p => p.status === 'pending').length;
  const approved = applications.filter(a => a.status === 'approved').length + parentAnimals.filter(p=>p.status==='verified').length;
  const rejected = applications.filter(a => a.status === 'rejected').length + parentAnimals.filter(p=>p.status==='rejected').length;
  document.getElementById('stat-pending-apps').textContent = pendingApps;
  document.getElementById('stat-pending-verify').textContent = pendingParents;
  document.getElementById('stat-approved').textContent = approved;
  document.getElementById('stat-rejected').textContent = rejected;
}

/* ============================================================ UTIL */
function escapeHtml(str){ return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function relativeDate(ts){
  if (!ts) return '';
  const diffMs = Date.now() - new Date(ts).getTime();
  const hours = diffMs / (1000*60*60);
  if (hours < 1) return 'щойно';
  if (hours < 24) return Math.floor(hours) + ' год тому';
  const days = Math.floor(hours/24);
  if (days === 1) return 'вчора';
  return days + ' дн. тому';
}

function renderAll(){
  renderApplications();
  renderParents();
  renderStats();
}
