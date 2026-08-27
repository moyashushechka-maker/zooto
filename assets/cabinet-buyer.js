// ============================================================
// ZOOTO — Кабінет покупця (demo prototype, local storage only)
// ============================================================

const STORAGE_KEY = 'zooto_demo_buyer_v1';
const PAW_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 13.5c-2.6 0-6 3-6 5.8 0 1.5 1.1 2.4 2.6 2.4.9 0 1.7-.3 2.6-.6.5-.2 1.1-.4 1.6-.4h.4c.5 0 1.1.2 1.6.4.9.3 1.7.6 2.6.6 1.5 0 2.6-.9 2.6-2.4 0-2.8-3.4-5.8-6-5.8Z"/><ellipse cx="5.2" cy="10.2" rx="2" ry="2.6"/><ellipse cx="9.6" cy="6.2" rx="2" ry="2.6"/><ellipse cx="14.4" cy="6.2" rx="2" ry="2.6"/><ellipse cx="18.8" cy="10.2" rx="2" ry="2.6"/></svg>';
const HEART_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
const CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

const seedState = () => ({
  buyer: { name: 'Оксана Петренко', city: 'Київ', initials: 'ОП' },
  favorites: [
    { id: cid(), name: 'Луна', breed: 'Британська короткошерста', sellerType: 'breeder', sellerName: 'Cattery Sonce', city: 'Київ', price: 12000 },
    { id: cid(), name: 'Барон', breed: 'Німецька вівчарка', sellerType: 'breeder', sellerName: 'Kennel Zorro', city: 'Вінниця', price: 25000 },
    { id: cid(), name: 'Рекс', breed: 'Метис', sellerType: 'shelter', sellerName: 'Притулок Хвостики', city: 'Львів', price: null }
  ],
  wantList: [
    { id: cid(), name: 'Зіронька', breed: 'Британська короткошерста', sellerType: 'breeder', sellerName: 'Cattery Sonce', city: 'Київ', price: 12000 }
  ],
  subscriptions: [
    { id: cid(), name: 'Притулок Хвостики', type: 'shelter', city: 'Львів', initials: 'ПХ' },
    { id: cid(), name: 'Cattery Sonce', type: 'breeder', city: 'Київ', initials: 'CS' }
  ]
});

function cid(){ return 'id-' + Math.random().toString(36).slice(2, 10); }
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  }catch(e){}
  const fresh = seedState();
  saveState(fresh);
  return fresh;
}
function saveState(state){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} }

let state = loadState();

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initToasts();
  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    if (!confirm('Скинути демо-дані кабінету до початкових значень?')) return;
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

/* ============================================================ FAVORITES */
function renderFavorites(){
  const grid = document.getElementById('favorites-grid');
  if (!state.favorites.length){
    grid.innerHTML = emptyState(HEART_ICON, 'В обраному поки нічого немає', 'Тицяйте на сердечко біля оголошень у каталозі — вони з\'являться тут.', 'marketplace.html', 'До каталогу');
    return;
  }
  grid.innerHTML = state.favorites.map(a => animalCard(a, 'favorites')).join('');
}

/* ============================================================ WANT LIST */
function renderWantList(){
  const grid = document.getElementById('want-grid');
  if (!state.wantList.length){
    grid.innerHTML = emptyState(PAW_ICON, 'Список поки порожній', 'Коли визначитесь, кого хочете забрати додому — додайте сюди з обраного або з каталогу.', 'marketplace.html', 'До каталогу');
    return;
  }
  grid.innerHTML = state.wantList.map(a => animalCard(a, 'wantList')).join('');
}

function animalCard(a, listKey){
  const priceLabel = a.price ? `${a.price.toLocaleString('uk-UA')} грн` : 'Безкоштовно';
  const isWant = listKey === 'wantList';
  return `
    <div class="buy-card reveal in-view">
      <div class="buy-photo">
        ${PAW_ICON}
        <button class="icon-btn danger buy-remove-btn" title="Прибрати" onclick="removeFrom('${listKey}','${a.id}')">${CLOSE_ICON}</button>
      </div>
      <div class="buy-body">
        <div class="buy-body-top">
          <h4>${escapeHtml(a.name)}</h4>
          <span class="price-tag">${priceLabel}</span>
        </div>
        <p style="font-size:13px; opacity:.6; margin:0 0 10px;">${escapeHtml(a.breed)}</p>
        <div class="buy-seller">
          <span class="buy-seller-avatar">${escapeHtml((a.sellerName||'?').slice(0,2).toUpperCase())}</span>
          <span>${escapeHtml(a.sellerName)} · ${escapeHtml(a.city)}</span>
        </div>
        <div class="buy-actions-row">
          ${isWant
            ? `<button class="btn btn-primary btn-sm" onclick="toast('Напишіть у Telegram — контакти на сторінці ${escapeAttr(a.sellerName)} (демо)')">Зв'язатися</button>`
            : `<button class="btn btn-ghost btn-sm" onclick="addToWantList('${a.id}')">🐾 Хочу забрати</button>`
          }
        </div>
      </div>
    </div>`;
}

function addToWantList(favId){
  const a = state.favorites.find(x => x.id === favId); if (!a) return;
  if (state.wantList.some(x => x.name === a.name && x.sellerName === a.sellerName)){
    toast('Вже у списку «Хочу забрати»');
    return;
  }
  state.wantList.unshift({ ...a, id: cid() });
  saveState(state);
  renderWantList(); renderStats();
  toast('Додано до «Хочу забрати»');
}

function removeFrom(listKey, id){
  state[listKey] = state[listKey].filter(x => x.id !== id);
  saveState(state);
  if (listKey === 'favorites') renderFavorites(); else renderWantList();
  renderStats();
}

/* ============================================================ SUBSCRIPTIONS */
function renderSubscriptions(){
  const list = document.getElementById('sub-list');
  if (!state.subscriptions.length){
    list.innerHTML = emptyState(HEART_ICON, 'Ще немає підписок', 'Підпишіться на профіль притулку чи заводчика, щоб не пропускати нових вихованців.', 'shelters.html', 'До притулків');
    return;
  }
  list.innerHTML = state.subscriptions.map(s => `
    <div class="sub-row reveal in-view">
      <div class="sub-avatar">${escapeHtml(s.initials)}</div>
      <div class="sub-main">
        <div class="name">${escapeHtml(s.name)}</div>
        <div class="meta">${s.type === 'shelter' ? 'Притулок' : 'Заводчик'} · ${escapeHtml(s.city)}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="unsubscribe('${s.id}')">Відписатися</button>
    </div>
  `).join('');
}
function unsubscribe(id){
  state.subscriptions = state.subscriptions.filter(s => s.id !== id);
  saveState(state);
  renderSubscriptions(); renderStats();
  toast('Відписано');
}

/* ============================================================ STATS */
function renderStats(){
  document.getElementById('stat-favorites').textContent = state.favorites.length;
  document.getElementById('stat-want').textContent = state.wantList.length;
  document.getElementById('stat-subs').textContent = state.subscriptions.length;
}

/* ============================================================ UTIL */
function emptyState(icon, title, text, href, cta){
  return `
    <div class="cab-empty">
      <div class="icon-badge" style="margin:0 auto 16px;">${icon}</div>
      <h4>${title}</h4>
      <p>${text}</p>
      <a class="btn btn-primary btn-sm" href="${href}">${cta}</a>
    </div>`;
}
function escapeHtml(str){ return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(str){ return escapeHtml(str).replace(/`/g, '&#96;'); }

function renderAll(){
  document.getElementById('cab-buyer-name').textContent = state.buyer.name;
  document.getElementById('cab-buyer-name-2').textContent = state.buyer.name;
  document.getElementById('cab-buyer-city').textContent = state.buyer.city;
  document.getElementById('cab-avatar-initials').textContent = state.buyer.initials;
  renderFavorites();
  renderWantList();
  renderSubscriptions();
  renderStats();
}
