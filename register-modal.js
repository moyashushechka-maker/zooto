// ============================================================
// ZOOTO — unified registration modal
// Injected into every public page. Open with:
//   <button data-open-register data-register-role="breeder">...</button>
// role: 'buyer' | 'breeder' | 'shelter' (defaults to 'buyer')
// ============================================================
import { supabase, showError, hideError, setLoading, friendlyAuthError, GOOGLE_ICON, signInWithGoogle } from './auth-client.js';

const DOC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>';
const CARD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>';
const PEDIGREE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z"/></svg>';
const DIPLOMA_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M9 14 7 22l5-3 5 3-2-8"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const DZ_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>';
const KENNEL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>';
const EXOTIC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c-1 3-3 4-3 7a3 3 0 0 0 6 0c0-3-2-4-3-7Z"/><path d="M12 13v9M8 22h8"/></svg>';
const CHEVRON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
const BACK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6 9 12l6 6"/></svg>';

const ROLE_META = {
  buyer:   { label: 'Покупець' },
  breeder: { label: 'Заводчик' },
  shelter: { label: 'Притулок' }
};
const CABINET_BY_ROLE = { breeder: 'cabinet-breeder.html', shelter: 'cabinet-shelter.html', buyer: 'index.html' };

const MODAL_HTML = `
<div class="modal-backdrop reg-modal" id="modal-register">
  <div class="modal wide">
    <button class="modal-close" aria-label="Закрити">✕</button>

    <div id="reg-role-select-step">
      <h3 style="margin-bottom:6px;">Створити акаунт</h3>
      <p class="sub">Оберіть, хто ви — далі покажемо лише потрібні поля.</p>
      <div class="role-switcher" data-active="0" id="reg-role-switcher">
        <div class="role-switcher-thumb"></div>
        <button type="button" class="active" data-role="buyer">Покупець</button>
        <button type="button" data-role="breeder">Заводчик</button>
        <button type="button" data-role="shelter">Притулок</button>
      </div>
    </div>

    <div class="auth-error" id="reg-error"></div>

    <!-- ============ BUYER ============ -->
    <div class="reg-panel" data-panel="buyer">
      <form id="reg-form-buyer">
        <div class="field"><label>Ім'я</label><input type="text" name="name" required placeholder="Як до вас звертатись"></div>
        <div class="field"><label>Email</label><input type="email" name="email" required placeholder="you@example.com"></div>
        <div class="field"><label>Пароль</label><input type="password" name="password" required minlength="6" placeholder="Мінімум 6 символів"></div>
        <div class="field"><label>Повторіть пароль</label><input type="password" name="password2" required minlength="6" placeholder="Ще раз пароль"></div>
        <button class="btn btn-primary" type="submit" style="width:100%;">Зареєструватися</button>
      </form>
      <div class="auth-divider"><span>або</span></div>
      <button class="btn-google" type="button" data-google-btn><span class="g-icon"></span>Продовжити з Google</button>
    </div>

    <!-- ============ BREEDER — step 1: account ============ -->
    <div class="reg-panel" data-panel="breeder">
      <div class="reg-step active" data-step="1">
        <div class="reg-steps-dots"><span class="active"></span><span></span><span></span></div>
        <form id="reg-form-breeder-account">
          <div class="field"><label>Назва розплідника або ваше ім'я</label><input type="text" name="name" required placeholder="Напр. Cattery Sonce"></div>
          <div class="field"><label>Місто</label><input type="text" name="city" placeholder="Необов'язково"></div>
          <div class="field"><label>Email</label><input type="email" name="email" required placeholder="you@example.com"></div>
          <div class="field"><label>Пароль</label><input type="password" name="password" required minlength="6" placeholder="Мінімум 6 символів"></div>
          <div class="field"><label>Повторіть пароль</label><input type="password" name="password2" required minlength="6" placeholder="Ще раз пароль"></div>
          <button class="btn btn-primary" type="submit" style="width:100%;">Продовжити</button>
        </form>
        <div class="auth-divider"><span>або</span></div>
        <button class="btn-google" type="button" data-google-btn><span class="g-icon"></span>Продовжити з Google</button>
      </div>

      <!-- step: sub-type picker -->
      <div class="reg-step" data-step="subtype">
        <div class="reg-steps-dots"><span class="done"></span><span class="active"></span><span></span></div>
        <p class="sub" style="margin-top:-6px;">Що з переліченого стосується вас? Далі покажемо лише потрібні поля.</p>
        <div class="subtype-grid">
          <button type="button" class="subtype-card" data-subtype="private">
            <div class="icon-badge">${PEDIGREE_ICON}</div>
            <div class="txt"><div class="title">Приватний заводчик</div><div class="desc">Одна-дві тварини для розведення, офіційного розплідника немає.</div></div>
            <div class="chev">${CHEVRON_ICON}</div>
          </button>
          <button type="button" class="subtype-card" data-subtype="kennel">
            <div class="icon-badge">${KENNEL_ICON}</div>
            <div class="txt"><div class="title">Офіційний розплідник</div><div class="desc">Зареєстрований розплідник із сертифікатом КСУ, WCF тощо.</div></div>
            <div class="chev">${CHEVRON_ICON}</div>
          </button>
          <button type="button" class="subtype-card" data-subtype="exotic">
            <div class="icon-badge">${EXOTIC_ICON}</div>
            <div class="txt"><div class="title">Екзоти та гризуни</div><div class="desc">Птахи, рептилії, павуки, гризуни — інша система перевірки.</div></div>
            <div class="chev">${CHEVRON_ICON}</div>
          </button>
        </div>
      </div>

      <!-- step 2-private -->
      <div class="reg-step" data-step="2-private">
        <div class="reg-steps-dots"><span class="done"></span><span class="done"></span><span class="active"></span></div>
        <button type="button" class="reg-back-link" data-back-to="subtype">${BACK_ICON}Назад</button>
        <p class="sub" style="margin-top:-6px;">Останній крок — коротка заявка на модерацію. Кабінет відкриється одразу, документи перевіримо протягом 24 год.</p>
        <form id="reg-form-breeder-app">
          <div class="reg-name-row">
            <div class="field"><label>Прізвище</label><input type="text" name="lastname" required placeholder="Прізвище"></div>
            <div class="field"><label>Ім'я</label><input type="text" name="firstname" required placeholder="Ім'я"></div>
            <div class="field"><label>По батькові</label><input type="text" name="patronymic" placeholder="Необов'язково"></div>
          </div>
          <div class="field">
            <label>Фото паспорта або ID-картки</label>
            <label class="dropzone">
              <input type="file" name="passport" accept="image/*" required>
              <div class="dropzone-thumb" data-thumb="passport">${DZ_ICON}</div>
              <div class="dropzone-text">Натисніть, щоб завантажити<span>Лише для модерації, не публікується</span></div>
            </label>
          </div>
          <div class="field">
            <label>Один документ на підтвердження (оберіть, що є під рукою)</label>
            <div class="doc-type-picker" id="doc-type-picker">
              <button type="button" data-doc-type="club_card" class="active">${CARD_ICON}Членський квиток</button>
              <button type="button" data-doc-type="pedigree">${PEDIGREE_ICON}Родовід тварини</button>
              <button type="button" data-doc-type="diploma">${DIPLOMA_ICON}Диплом заводчика</button>
            </div>
            <label class="dropzone">
              <input type="file" name="proof" accept="image/*" required>
              <div class="dropzone-thumb" data-thumb="proof">${DZ_ICON}</div>
              <div class="dropzone-text">Натисніть, щоб завантажити обране вище</div>
            </label>
          </div>
          <button class="btn btn-primary" type="submit" style="width:100%;">Надіслати заявку</button>
        </form>
      </div>

      <!-- step 2-kennel -->
      <div class="reg-step" data-step="2-kennel">
        <div class="reg-steps-dots"><span class="done"></span><span class="done"></span><span class="active"></span></div>
        <button type="button" class="reg-back-link" data-back-to="subtype">${BACK_ICON}Назад</button>
        <p class="sub" style="margin-top:-6px;">Офіційна назва розплідника буде закріплена за вашим акаунтом назавжди.</p>
        <form id="reg-form-breeder-kennel">
          <div class="reg-name-row">
            <div class="field"><label>Прізвище</label><input type="text" name="lastname" required placeholder="Прізвище"></div>
            <div class="field"><label>Ім'я</label><input type="text" name="firstname" required placeholder="Ім'я"></div>
            <div class="field"><label>По батькові</label><input type="text" name="patronymic" placeholder="Необов'язково"></div>
          </div>
          <div class="field">
            <label>Фото паспорта або ID-картки</label>
            <label class="dropzone">
              <input type="file" name="k_passport" accept="image/*" required>
              <div class="dropzone-thumb" data-thumb="k_passport">${DZ_ICON}</div>
              <div class="dropzone-text">Натисніть, щоб завантажити<span>Лише для модерації</span></div>
            </label>
          </div>
          <div class="field"><label>Назва розплідника</label><input type="text" name="kennel_name" required placeholder="Напр. Golden Lion"></div>
          <div class="field">
            <label>Сертифікат реєстрації розплідника</label>
            <label class="dropzone">
              <input type="file" name="kennel_cert" accept="image/*" required>
              <div class="dropzone-thumb" data-thumb="kennel_cert">${DZ_ICON}</div>
              <div class="dropzone-text">Натисніть, щоб завантажити</div>
            </label>
          </div>
          <div class="field">
            <label>ПІБ у сертифікаті збігається з вашим паспортом?</label>
            <div class="yesno-row" id="kennel-yesno">
              <button type="button" data-val="yes" class="active">Так, збігається</button>
              <button type="button" data-val="no">Є різниця</button>
            </div>
          </div>
          <div class="conditional-block" id="kennel-marriage-block">
            <div class="reg-info-box">Буває, що в сертифікаті стоїть дівоче прізвище, або розплідник оформлено на двох співвласників — це нормально. Просто додайте один із документів нижче.</div>
            <div class="field">
              <label>Свідоцтво про шлюб / зміну прізвища АБО документ про спільне володіння</label>
              <label class="dropzone">
                <input type="file" name="marriage_cert" accept="image/*">
                <div class="dropzone-thumb" data-thumb="marriage_cert">${DZ_ICON}</div>
                <div class="dropzone-text">Натисніть, щоб завантажити</div>
              </label>
            </div>
          </div>
          <button class="btn btn-primary" type="submit" style="width:100%;">Надіслати заявку</button>
        </form>
      </div>

      <!-- step 2-exotic -->
      <div class="reg-step" data-step="2-exotic">
        <div class="reg-steps-dots"><span class="done"></span><span class="done"></span><span class="active"></span></div>
        <button type="button" class="reg-back-link" data-back-to="subtype">${BACK_ICON}Назад</button>
        <p class="sub" style="margin-top:-6px;">В Україні немає єдиного реєстру для екзотів, тому перевіряємо трохи інакше.</p>
        <form id="reg-form-breeder-exotic">
          <div class="field">
            <label>Фото паспорта або ID-картки</label>
            <label class="dropzone">
              <input type="file" name="e_passport" accept="image/*" required>
              <div class="dropzone-thumb" data-thumb="e_passport">${DZ_ICON}</div>
              <div class="dropzone-text">Натисніть, щоб завантажити<span>Лише для модерації</span></div>
            </label>
          </div>
          <div class="exotic-choice" id="exotic-choice">
            <button type="button" data-val="docs" class="active">У мене є клубний документ або CITES<span class="sub-hint">Довідка асоціації, свідоцтво клубу тощо</span></button>
            <button type="button" data-val="nodocs">Документів немає — підтверджу умови утримання<span class="sub-hint">Фото або відео вольєрів замість паперів</span></button>
          </div>
          <div class="conditional-block show" id="exotic-docs-block">
            <div class="field">
              <label>Клубний документ або CITES</label>
              <label class="dropzone">
                <input type="file" name="exotic_doc" accept="image/*" required>
                <div class="dropzone-thumb" data-thumb="exotic_doc">${DZ_ICON}</div>
                <div class="dropzone-text">Натисніть, щоб завантажити</div>
              </label>
            </div>
          </div>
          <div class="conditional-block" id="exotic-nodocs-block">
            <div class="reg-info-box">Зробіть коротке відео або 2–3 фото своїх вольєрів чи терраріумів. Покладіть поруч аркуш, де від руки написано "Zooto" і сьогоднішня дата — це підтвердить, що фото зняті саме зараз і саме вами.</div>
            <div class="field">
              <label>Фото або відео вольєрів з міткою</label>
              <label class="dropzone">
                <input type="file" name="exotic_proof" accept="image/*,video/*" required>
                <div class="dropzone-thumb" data-thumb="exotic_proof">${DZ_ICON}</div>
                <div class="dropzone-text">Натисніть, щоб завантажити</div>
              </label>
            </div>
          </div>
          <button class="btn btn-primary" type="submit" style="width:100%;">Надіслати заявку</button>
        </form>
      </div>
    </div>

    <!-- ============ SHELTER ============ -->
    <div class="reg-panel" data-panel="shelter">
      <div class="reg-step active" data-step="1">
        <div class="reg-steps-dots"><span class="active"></span><span></span></div>
        <form id="reg-form-shelter-account">
          <div class="field"><label>Назва притулку або ваше ім'я</label><input type="text" name="name" required placeholder="Напр. Притулок Хвостики"></div>
          <div class="field"><label>Місто</label><input type="text" name="city" required placeholder="Місто"></div>
          <div class="field"><label>Email</label><input type="email" name="email" required placeholder="you@example.com"></div>
          <div class="field"><label>Пароль</label><input type="password" name="password" required minlength="6" placeholder="Мінімум 6 символів"></div>
          <div class="field"><label>Повторіть пароль</label><input type="password" name="password2" required minlength="6" placeholder="Ще раз пароль"></div>
          <button class="btn btn-primary" type="submit" style="width:100%;">Продовжити</button>
        </form>
        <div class="auth-divider"><span>або</span></div>
        <button class="btn-google" type="button" data-google-btn><span class="g-icon"></span>Продовжити з Google</button>
      </div>

      <div class="reg-step" data-step="2">
        <div class="reg-steps-dots"><span class="done"></span><span class="active"></span></div>
        <p class="sub" style="margin-top:-6px;">Ще трохи — базові дані для перевірки. Кабінет відкриється одразу.</p>
        <form id="reg-form-shelter-app">
          <div class="field"><label>Контакт (Telegram або телефон)</label><input type="text" name="contact" required placeholder="@nickname"></div>
          <div class="field">
            <label>Статус</label>
            <select name="shelter_status">
              <option value="official">Офіційний притулок</option>
              <option value="volunteer">Приватний волонтер</option>
            </select>
          </div>
          <button class="btn btn-primary" type="submit" style="width:100%;">Надіслати заявку</button>
        </form>
      </div>
    </div>

    <!-- ============ SUCCESS ============ -->
    <div class="auth-success" id="reg-success" style="display:none;">
      <div class="icon-badge">${CHECK_ICON}</div>
      <h3 style="font-family:var(--ff-display); font-size:20px; margin-bottom:8px;" id="reg-success-title">Готово!</h3>
      <p style="font-size:14.5px; opacity:.7;" id="reg-success-text"></p>
      <button class="btn btn-primary btn-sm" id="reg-success-cta" style="margin-top:16px;">До кабінету</button>
    </div>

    <p class="auth-foot" id="reg-login-foot">Вже є акаунт? <a href="login.html">Увійти</a></p>
  </div>
</div>`;

function fileToPreview(input, thumbEl){
  input.addEventListener('change', () => {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { thumbEl.innerHTML = `<img src="${reader.result}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`; };
    reader.readAsDataURL(file);
  });
}

async function uploadDoc(userId, file, label){
  const path = `${userId}/${label}-${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('verification-docs').upload(path, file);
  if (error) throw error;
  return path;
}

function initRegisterModal(){
  if (document.getElementById('modal-register')) return; // already injected on this page
  document.body.insertAdjacentHTML('beforeend', MODAL_HTML);

  const modal = document.getElementById('modal-register');
  modal.querySelectorAll('.g-icon').forEach(el => el.innerHTML = GOOGLE_ICON);
  modal.querySelectorAll('[data-google-btn]').forEach(btn => btn.addEventListener('click', signInWithGoogle));

  const backdrop = modal;
  backdrop.querySelector('.modal-close').addEventListener('click', () => closeRegisterModal());
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeRegisterModal(); });

  // role switcher
  const switcher = document.getElementById('reg-role-switcher');
  function setRole(role){
    const idx = ['buyer','breeder','shelter'].indexOf(role);
    switcher.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.role === role));
    switcher.dataset.active = idx;
    switcher.querySelector('.role-switcher-thumb').style.transform = `translateX(${idx*100}%)`;
    modal.querySelectorAll('.reg-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === role));
    resetToStep1();
  }
  switcher.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => setRole(btn.dataset.role)));

  function resetToStep1(){
    modal.querySelectorAll('.reg-step').forEach(s => s.classList.toggle('active', s.dataset.step === '1'));
    document.getElementById('reg-role-select-step').style.display = 'block';
    document.getElementById('reg-success').style.display = 'none';
    document.getElementById('reg-login-foot').style.display = 'block';
    hideError('reg-error');
  }

  function goToStep2(role){
    document.getElementById('reg-role-select-step').style.display = 'none';
    document.querySelector(`.reg-panel[data-panel="${role}"] .reg-step[data-step="1"]`).classList.remove('active');
    document.querySelector(`.reg-panel[data-panel="${role}"] .reg-step[data-step="2"]`).classList.add('active');
    document.getElementById('reg-login-foot').style.display = 'none';
  }

  function goToBreederSubtype(){
    document.getElementById('reg-role-select-step').style.display = 'none';
    document.querySelector('.reg-panel[data-panel="breeder"] .reg-step[data-step="1"]').classList.remove('active');
    document.querySelector('.reg-panel[data-panel="breeder"] .reg-step[data-step="subtype"]').classList.add('active');
    document.getElementById('reg-login-foot').style.display = 'none';
  }

  // breeder sub-type cards
  let selectedBreederType = 'private';
  document.querySelectorAll('.subtype-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedBreederType = card.dataset.subtype;
      document.querySelector('.reg-panel[data-panel="breeder"] .reg-step[data-step="subtype"]').classList.remove('active');
      document.querySelector(`.reg-panel[data-panel="breeder"] .reg-step[data-step="2-${selectedBreederType}"]`).classList.add('active');
    });
  });

  // back links (any step -> subtype picker)
  document.querySelectorAll('[data-back-to]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-back-to');
      btn.closest('.reg-step').classList.remove('active');
      document.querySelector(`.reg-panel[data-panel="breeder"] .reg-step[data-step="${target}"]`).classList.add('active');
    });
  });

  // kennel: name-matches-certificate yes/no toggle
  let kennelNameMatches = true;
  const kennelYesNo = document.getElementById('kennel-yesno');
  kennelYesNo.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      kennelYesNo.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      kennelNameMatches = btn.dataset.val === 'yes';
      document.getElementById('kennel-marriage-block').classList.toggle('show', !kennelNameMatches);
    });
  });

  // exotic: docs vs no-docs choice
  let exoticHasDocs = true;
  const exoticChoice = document.getElementById('exotic-choice');
  exoticChoice.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      exoticChoice.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      exoticHasDocs = btn.dataset.val === 'docs';
      document.getElementById('exotic-docs-block').classList.toggle('show', exoticHasDocs);
      document.getElementById('exotic-nodocs-block').classList.toggle('show', !exoticHasDocs);
    });
  });

  function showSuccess(title, text, ctaHref, ctaLabel){
    modal.querySelectorAll('.reg-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('reg-role-select-step').style.display = 'none';
    document.getElementById('reg-login-foot').style.display = 'none';
    document.getElementById('reg-success-title').textContent = title;
    document.getElementById('reg-success-text').textContent = text;
    const cta = document.getElementById('reg-success-cta');
    cta.textContent = ctaLabel;
    cta.onclick = () => window.location.href = ctaHref;
    document.getElementById('reg-success').style.display = 'block';
  }

  // doc type picker
  const picker = document.getElementById('doc-type-picker');
  let selectedDocType = 'club_card';
  picker.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      picker.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDocType = btn.dataset.docType;
    });
  });

  // file previews
  modal.querySelectorAll('input[type=file]').forEach(input => {
    const thumb = modal.querySelector(`[data-thumb="${input.name}"]`);
    if (thumb) fileToPreview(input, thumb);
  });

  // ---------- BUYER submit ----------
  document.getElementById('reg-form-buyer').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('reg-error');
    const f = new FormData(e.target);
    if (f.get('password') !== f.get('password2')){ showError('Паролі не збігаються.', 'reg-error'); return; }
    const btn = e.target.querySelector('button[type=submit]');
    setLoading(btn, true);
    const { data, error } = await supabase.auth.signUp({
      email: f.get('email'), password: f.get('password'),
      options: { data: { role: 'buyer', display_name: f.get('name') }, emailRedirectTo: window.location.origin + '/login.html' }
    });
    setLoading(btn, false);
    if (error){ showError(friendlyAuthError(error), 'reg-error'); return; }
    if (data.session){
      showSuccess('Ласкаво просимо!', 'Акаунт створено — переходимо на сайт.', 'index.html', 'На сайт Zooto');
    } else {
      showSuccess('Перевірте пошту', `Ми надіслали лист із підтвердженням на ${f.get('email')}.`, 'login.html', 'До входу');
    }
  });

  // ---------- BREEDER: step 1 (account) ----------
  document.getElementById('reg-form-breeder-account').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('reg-error');
    const f = new FormData(e.target);
    if (f.get('password') !== f.get('password2')){ showError('Паролі не збігаються.', 'reg-error'); return; }
    const btn = e.target.querySelector('button[type=submit]');
    setLoading(btn, true);
    const { data, error } = await supabase.auth.signUp({
      email: f.get('email'), password: f.get('password'),
      options: { data: { role: 'breeder', display_name: f.get('name'), city: f.get('city') }, emailRedirectTo: window.location.origin + '/login.html' }
    });
    setLoading(btn, false);
    if (error){ showError(friendlyAuthError(error), 'reg-error'); return; }
    if (!data.session){
      showSuccess('Перевірте пошту', `Підтвердіть email за посиланням, яке ми надіслали на ${f.get('email')} — після цього зможете подати заявку у своєму кабінеті.`, 'login.html', 'До входу');
      return;
    }
    goToBreederSubtype();
  });

  // ---------- BREEDER: step 2 (application) ----------
  document.getElementById('reg-form-breeder-app').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('reg-error');
    const f = new FormData(e.target);
    const btn = e.target.querySelector('button[type=submit]');
    setLoading(btn, true);
    try{
      const { data: { user } } = await supabase.auth.getUser();
      const passportFile = e.target.querySelector('[name=passport]').files[0];
      const proofFile = e.target.querySelector('[name=proof]').files[0];
      const passportPath = await uploadDoc(user.id, passportFile, 'passport');
      const proofPath = await uploadDoc(user.id, proofFile, 'proof');
      const fullName = `${f.get('lastname')} ${f.get('firstname')} ${f.get('patronymic') || ''}`.trim();
      const { error } = await supabase.from('applications').insert({
        user_id: user.id, type: 'breeder', breeder_type: 'private', full_name: fullName,
        passport_doc_path: passportPath, proof_doc_type: selectedDocType, proof_doc_path: proofPath
      });
      if (error) throw error;
      setLoading(btn, false);
      showSuccess('Заявку надіслано! 🎉', 'Кабінет вже відкрито — документи перевіримо протягом 24 годин.', CABINET_BY_ROLE.breeder, 'Перейти в кабінет');
    } catch(err){
      setLoading(btn, false);
      showError('Не вдалося надіслати заявку. Перевірте файли та спробуйте ще раз.', 'reg-error');
    }
  });

  // ---------- BREEDER: step 2-kennel (official cattery) ----------
  document.getElementById('reg-form-breeder-kennel').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('reg-error');
    const f = new FormData(e.target);
    if (kennelNameMatches === false && !e.target.querySelector('[name=marriage_cert]').files[0]){
      showError('Додайте свідоцтво про шлюб або документ про спільне володіння.', 'reg-error');
      return;
    }
    const btn = e.target.querySelector('button[type=submit]');
    setLoading(btn, true);
    try{
      const { data: { user } } = await supabase.auth.getUser();
      const passportPath = await uploadDoc(user.id, e.target.querySelector('[name=k_passport]').files[0], 'k-passport');
      const certPath = await uploadDoc(user.id, e.target.querySelector('[name=kennel_cert]').files[0], 'kennel-cert');
      let marriagePath = null;
      const marriageFile = e.target.querySelector('[name=marriage_cert]').files[0];
      if (marriageFile) marriagePath = await uploadDoc(user.id, marriageFile, 'marriage-cert');
      const fullName = `${f.get('lastname')} ${f.get('firstname')} ${f.get('patronymic') || ''}`.trim();
      const { error } = await supabase.from('applications').insert({
        user_id: user.id, type: 'breeder', breeder_type: 'kennel', full_name: fullName,
        passport_doc_path: passportPath, kennel_name: f.get('kennel_name'),
        kennel_cert_doc_path: certPath, name_matches_cert: kennelNameMatches,
        marriage_cert_doc_path: marriagePath
      });
      if (error) throw error;
      setLoading(btn, false);
      showSuccess('Заявку надіслано! 🎉', 'Кабінет вже відкрито — документи розплідника перевіримо протягом 24 годин.', CABINET_BY_ROLE.breeder, 'Перейти в кабінет');
    } catch(err){
      setLoading(btn, false);
      showError('Не вдалося надіслати заявку. Перевірте файли та спробуйте ще раз.', 'reg-error');
    }
  });

  // ---------- BREEDER: step 2-exotic ----------
  document.getElementById('reg-form-breeder-exotic').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('reg-error');
    const requiredFile = exoticHasDocs
      ? e.target.querySelector('[name=exotic_doc]').files[0]
      : e.target.querySelector('[name=exotic_proof]').files[0];
    if (!requiredFile){
      showError(exoticHasDocs ? 'Додайте клубний документ або CITES.' : 'Додайте фото чи відео вольєрів.', 'reg-error');
      return;
    }
    const btn = e.target.querySelector('button[type=submit]');
    setLoading(btn, true);
    try{
      const { data: { user } } = await supabase.auth.getUser();
      const passportPath = await uploadDoc(user.id, e.target.querySelector('[name=e_passport]').files[0], 'e-passport');
      let exoticDocPath = null, exoticProofPath = null;
      if (exoticHasDocs){
        exoticDocPath = await uploadDoc(user.id, requiredFile, 'exotic-doc');
      } else {
        exoticProofPath = await uploadDoc(user.id, requiredFile, 'exotic-proof');
      }
      const { error } = await supabase.from('applications').insert({
        user_id: user.id, type: 'breeder', breeder_type: 'exotic',
        passport_doc_path: passportPath, exotic_has_docs: exoticHasDocs,
        exotic_doc_path: exoticDocPath, exotic_proof_path: exoticProofPath
      });
      if (error) throw error;
      setLoading(btn, false);
      showSuccess('Заявку надіслано! 🎉', 'Кабінет вже відкрито — перевіримо документи чи умови утримання протягом 24 годин.', CABINET_BY_ROLE.breeder, 'Перейти в кабінет');
    } catch(err){
      setLoading(btn, false);
      showError('Не вдалося надіслати заявку. Перевірте файли та спробуйте ще раз.', 'reg-error');
    }
  });

  // ---------- SHELTER: step 1 (account) ----------
  document.getElementById('reg-form-shelter-account').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('reg-error');
    const f = new FormData(e.target);
    if (f.get('password') !== f.get('password2')){ showError('Паролі не збігаються.', 'reg-error'); return; }
    const btn = e.target.querySelector('button[type=submit]');
    setLoading(btn, true);
    const { data, error } = await supabase.auth.signUp({
      email: f.get('email'), password: f.get('password'),
      options: { data: { role: 'shelter', display_name: f.get('name'), city: f.get('city') }, emailRedirectTo: window.location.origin + '/login.html' }
    });
    setLoading(btn, false);
    if (error){ showError(friendlyAuthError(error), 'reg-error'); return; }
    if (!data.session){
      showSuccess('Перевірте пошту', `Підтвердіть email за посиланням, яке ми надіслали на ${f.get('email')} — після цього зможете подати заявку у своєму кабінеті.`, 'login.html', 'До входу');
      return;
    }
    goToStep2('shelter');
  });

  // ---------- SHELTER: step 2 (application) ----------
  document.getElementById('reg-form-shelter-app').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('reg-error');
    const f = new FormData(e.target);
    const btn = e.target.querySelector('button[type=submit]');
    setLoading(btn, true);
    try{
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('applications').insert({
        user_id: user.id, type: 'shelter', contact: f.get('contact'), shelter_status: f.get('shelter_status')
      });
      if (error) throw error;
      setLoading(btn, false);
      showSuccess('Заявку надіслано! 🎉', 'Кабінет вже відкрито — дані перевіримо протягом 24 годин.', CABINET_BY_ROLE.shelter, 'Перейти в кабінет');
    } catch(err){
      setLoading(btn, false);
      showError('Не вдалося надіслати заявку. Спробуйте ще раз.', 'reg-error');
    }
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closeRegisterModal(); });

  // expose open/close + role presetting
  window.__zootoOpenRegister = (role) => {
    resetToStep1();
    setRole(role || 'buyer');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
}

function closeRegisterModal(){
  const modal = document.getElementById('modal-register');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  initRegisterModal();
  document.querySelectorAll('[data-open-register]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.__zootoOpenRegister(btn.getAttribute('data-register-role') || 'buyer');
    });
  });
});
