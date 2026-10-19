// E6 Konfiguracja aplikacji, E7 Import pakietu konfiguracji.

interface Draft {
  values: Record<string, ConfigValue>;
  secrets: Record<string, string>;        // wpisane w tej sesji (jeszcze nie zapisane)
  editingSecret: Set<string>;             // pola haseł w trybie edycji
  fromPackage: Set<string>;               // sekrety dostarczone w pakiecie serwisu
  highlight: Set<string>;                 // pola do uzupełnienia po imporcie
  touched: Set<string>;
  showSecret: Set<string>;
  imported?: { by: string; at: string };
  testResult?: { text: string; kind: BadgeKind };
}
const drafts: Record<string, Draft> = {};
function getDraft(app: App): Draft {
  if (!drafts[app.name]) drafts[app.name] = { values: { ...app.config.values }, secrets: {}, editingSecret: new Set(), fromPackage: new Set(), highlight: new Set(), touched: new Set(), showSecret: new Set() };
  return drafts[app.name];
}
function secretIsSet(app: App, d: Draft, key: string): boolean { return !!app.config.secrets[key]?.isSet || !!d.secrets[key] || d.fromPackage.has(key); }
function draftError(app: App, d: Draft, f: ConfigField): string | null { return validateField(f, d.values[f.key], secretIsSet(app, d, f.key)); }
function draftCompleteness(app: App, d: Draft): { done: number; total: number; missing: ConfigField[] } {
  let total = 0, done = 0; const missing: ConfigField[] = [];
  app.config.sections.forEach(s => s.fields.forEach(f => { if (!f.required) return; total++; if (draftError(app, d, f)) missing.push(f); else done++; }));
  return { done, total, missing };
}
function draftChanges(app: App, d: Draft): string[] {
  const out: string[] = [];
  Object.keys(d.values).forEach(k => { if (String(d.values[k] ?? '') !== String(app.config.values[k] ?? '')) out.push(k); });
  Object.keys(d.secrets).forEach(k => { if (d.secrets[k]) out.push(k); });
  d.fromPackage.forEach(k => { if (!app.config.secrets[k]?.isSet) out.push(k); });
  return out;
}

function configForm(app: App, standalone: boolean, forVersion?: string): HTMLElement {
  if (app.isPlatform) return card(null, emptyState('Agent nie ma konfiguracji aplikacyjnej. Parametry agenta są w Ustawieniach.', btn('Ustawienia', { href: '#/ustawienia?sekcja=agent' })));
  if (demo.override === 'loading') return card(null, h('div', null, skeleton(3), skeleton(4), skeleton(2)));
  if (demo.override === 'empty') return card(null, emptyState('Aplikacja nie dostarczyła schematu konfiguracji w pakiecie. Skontaktuj się z serwisem.', btn('Diagnostyka', { href: '#/diagnostyka' })));
  const ciError = demo.override === 'error';
  const d = getDraft(app);
  const firstTime = !app.installed && Object.values(app.config.values).every(v => v === '' || v === false || v === null) && Object.values(app.config.secrets).every(s => !s.isSet);

  const progress = h('div', { class: 'row' }, h('div', { class: 'progress' }, h('div', { id: 'cfg-progress-bar' })), h('span', { id: 'cfg-progress-text', class: 'small muted' }));
  const saveBtn = btn('Zapisz', { kind: 'primary' }) as HTMLButtonElement;
  const draftBtn = btn('Zapisz szkic') as HTMLButtonElement;
  const changesText = h('span', { class: 'muted small', id: 'cfg-changes' });
  const missingText = h('div', { class: 'small', id: 'cfg-missing', style: 'color:var(--warn)' });

  const refreshSummary = (): void => {
    const c = draftCompleteness(app, d); const changes = draftChanges(app, d);
    (progress.querySelector('#cfg-progress-bar') as HTMLElement).style.width = `${c.total ? Math.round(100 * c.done / c.total) : 100}%`;
    (progress.querySelector('#cfg-progress-text') as HTMLElement).textContent = `${c.done} z ${c.total} wymaganych pól`;
    changesText.textContent = changes.length ? `${changes.length} ${plural(changes.length, 'zmiana', 'zmiany', 'zmian')} do zapisania` : 'brak zmian';
    missingText.textContent = c.missing.length ? `Brakuje: ${c.missing.map(m => m.label).join(', ')}` : '';
    saveBtn.disabled = ciError || c.missing.length > 0 || changes.length === 0;
    draftBtn.disabled = ciError || changes.length === 0;
  };

  const renderField = (f: ConfigField): HTMLElement => {
    const err = d.touched.has(f.key) || !firstTime ? draftError(app, d, f) : null;
    const labelNode = h('span', { class: 'row', style: 'gap:6px' }, f.label, f.restart ? badge('wymaga restartu', 'neutral', 'Zmiana zadziała po restarcie usługi') : null, f.newInVersion ? badge(`nowe w ${f.newInVersion}`, 'accent') : null, d.highlight.has(f.key) ? badge('do uzupełnienia przez Ciebie', 'warn') : null);
    let input: HTMLElement;
    const onChange = (v: ConfigValue): void => { d.values[f.key] = v; d.touched.add(f.key); const e = draftError(app, d, f); wrap.classList.toggle('invalid', !!e); (wrap.querySelector('.error') as HTMLElement).textContent = e || ''; refreshSummary(); };
    if (f.type === 'secret') {
      const set = !!app.config.secrets[f.key]?.isSet; const meta = app.config.secrets[f.key];
      if (d.fromPackage.has(f.key) && !d.editingSecret.has(f.key)) input = h('div', { class: 'secret-state' }, badge('ustawione przez serwis (z pakietu)', 'ok'), btn('Wpisz własne', { small: true, kind: 'ghost', onClick: () => { d.editingSecret.add(f.key); rerender(); } }));
      else if (set && !d.editingSecret.has(f.key)) input = h('div', { class: 'secret-state' }, badge('ustawione', 'ok'), h('span', null, `zmieniono ${fmtDate(meta.changedAt!)} przez ${meta.changedBy}`), btn('Zmień', { small: true, onClick: () => { d.editingSecret.add(f.key); rerender(); } }));
      else {
        const inp = h('input', { type: d.showSecret.has(f.key) ? 'text' : 'password', value: d.secrets[f.key] || '', autocomplete: 'new-password', placeholder: 'wpisz hasło', onInput: (e: Event) => { d.secrets[f.key] = (e.target as HTMLInputElement).value; d.touched.add(f.key); const er = draftError(app, d, f); wrap.classList.toggle('invalid', !!er); (wrap.querySelector('.error') as HTMLElement).textContent = er || ''; refreshSummary(); } });
        input = h('div', null, h('div', { class: 'inline' }, inp, set ? btn('Anuluj', { small: true, kind: 'ghost', onClick: () => { d.editingSecret.delete(f.key); delete d.secrets[f.key]; rerender(); } }) : null), checkbox('pokaż podczas wpisywania', d.showSecret.has(f.key), v => { if (v) d.showSecret.add(f.key); else d.showSecret.delete(f.key); (inp as HTMLInputElement).type = v ? 'text' : 'password'; }));
      }
    } else if (f.type === 'bool') {
      input = checkbox(f.label, d.values[f.key] === true, v => {
        if (v && f.key === 'jobs.mcSyncEnabled') {
          confirmModal('Czy wysyłka w starej instalacji IIS jest już wyłączona?', 'Włączenie wysyłki w obu instalacjach spowoduje podwójne wysyłki zobowiązań do Ministerstwa Cyfryzacji. Włącz dopiero po wyłączeniu wysyłki w IIS.', 'Tak, IIS już nie wysyła', () => { onChange(true); rerender(); });
          (input.querySelector('input') as HTMLInputElement).checked = false; return;
        }
        onChange(v);
      }, f.help);
    } else if (f.type === 'select') {
      input = select([{ value: '', label: '— wybierz —' }, ...(f.options || [])], String(d.values[f.key] ?? ''), v => onChange(v));
    } else {
      input = h('input', { type: 'text', value: String(d.values[f.key] ?? ''), placeholder: f.placeholder, disabled: ciError, onInput: (e: Event) => onChange((e.target as HTMLInputElement).value) });
    }
    const wrap = field(f.type === 'bool' ? '' : labelNode, input, { help: f.type === 'bool' ? undefined : f.help, error: err || undefined, required: f.required && f.type !== 'bool', cls: d.highlight.has(f.key) ? 'highlight' : '' });
    if (f.type === 'bool') { (wrap.querySelector('label') as HTMLElement).remove(); wrap.insertBefore(labelNode.cloneNode(true), wrap.firstChild); (wrap.firstChild as HTMLElement).classList.add('small', 'muted'); }
    return wrap;
  };

  const testDb = (): void => {
    const host = String(d.values['database.host'] || ''); const port = String(d.values['database.port'] || '');
    const f = app.config.sections[0].fields;
    if (validateField(f[0], host, true) || validateField(f[1], port, true)) { d.testResult = { text: 'Uzupełnij poprawnie serwer i port przed testem.', kind: 'warn' }; rerender(); return; }
    d.testResult = { text: 'Łączenie…', kind: 'info' }; rerender();
    setTimeout(() => {
      if (host.includes('zly') || port === '3051') d.testResult = { text: port === '3051' ? 'Połączono z Firebird 2.5.9, dialekt 1. Aplikacja wymaga Firebird 3 i dialektu 3. Skontaktuj się z serwisem w sprawie migracji.' : `Nie można połączyć się z ${host}:${port}: połączenie odrzucone (sprawdź nazwę serwera, port i zaporę).`, kind: 'danger' };
      else d.testResult = { text: `Firebird 3.0.11, dialekt 3, baza osiągalna, 4 ms. Użytkownik z konfiguracji ma dostęp do MON$ATTACHMENTS.`, kind: 'ok' };
      rerender();
    }, 1200);
  };

  const sections = app.config.sections.map(sec => {
    const missingHere = sec.fields.filter(f => f.required && draftError(app, d, f)).length;
    return h('details', { class: 'form-section', open: true },
      h('summary', null, sec.title, missingHere ? badge(`brakuje ${missingHere}`, 'warn') : badge('kompletna', 'ok')),
      h('div', { class: 'section-body' },
        sec.fields.map(renderField),
        sec.key === 'database' ? h('div', { class: 'row' },
          btn('Testuj połączenie z bazą', { small: true, disabled: ciError, onClick: testDb }),
          d.testResult ? badge(d.testResult.text, d.testResult.kind) : null,
          h('span', { style: 'flex:1' }),
          appsOnly().filter(a => a.name !== app.name && a.config.values['database.host']).length ? h('span', { class: 'row small muted' }, 'Użyj serwera i portu jak w:',
            select([{ value: '', label: '— wybierz aplikację —' }, ...appsOnly().filter(a => a.name !== app.name && a.config.values['database.host']).map(a => ({ value: a.name, label: a.title }))], '', v => { const o = findApp(v); if (!o) return; d.values['database.host'] = o.config.values['database.host']; d.values['database.port'] = o.config.values['database.port']; d.touched.add('database.host'); d.touched.add('database.port'); toast(`Skopiowano serwer i port z ${o.title}. Hasło wpisz osobno.`, 'ok'); rerender(); })) : null) : null));
  });

  const save = (asDraft: boolean): void => {
    const c = draftCompleteness(app, d); const changes = draftChanges(app, d);
    if (!asDraft && c.missing.length) { app.config.sections.forEach(s => s.fields.forEach(f => d.touched.add(f.key))); toast(`Uzupełnij wymagane pola: ${c.missing.map(m => m.label).join(', ')}`, 'danger'); rerender(); return; }
    const restartNeeded = !!app.installed && changes.some(k => { let r = false; app.config.sections.forEach(s => s.fields.forEach(f => { if (f.key === k && f.restart) r = true; })); return r; });
    store.update(() => {
      app.config.values = { ...d.values };
      Object.keys(d.secrets).forEach(k => { if (d.secrets[k]) app.config.secrets[k] = { isSet: true, changedAt: nowIso(), changedBy: ACCOUNT }; });
      d.fromPackage.forEach(k => { app.config.secrets[k] = { isSet: true, changedAt: nowIso(), changedBy: 'serwis InfoSystem (pakiet konfiguracji)' }; });
    });
    const secretChanged = changes.filter(k => k.endsWith('password') || k.endsWith('Secret') || k.endsWith('token'));
    recordEvent('config', app, `${asDraft ? 'Zapisano szkic konfiguracji' : 'Zmieniono konfigurację'} ${app.title}: ${changes.filter(k => !secretChanged.includes(k)).join(', ') || 'bez zmian pól jawnych'}${secretChanged.length ? `; zmieniono hasła: ${secretChanged.length} (wartości niezapisane w dzienniku)` : ''}.`, { details: changes });
    delete drafts[app.name];
    toast(asDraft ? `Zapisano szkic konfiguracji ${app.title}. Instalacja pozostaje zablokowana do uzupełnienia.` : `Zapisano konfigurację ${app.title}.`, 'ok');
    if (!asDraft && restartNeeded) {
      openModal({ title: `Zrestartować ${app.title} teraz?`, body: h('div', null, h('p', null, `Zmienione parametry wymagają restartu usługi. Przerwa ok. 30 s. Aktywne sesje na bazie: ${app.sessions.length}.`)), actions: [{ label: 'Zastosuj przy następnym restarcie', kind: 'secondary', onClick: c2 => { c2(); rerender(); } }, { label: 'Zrestartuj teraz', kind: 'primary', onClick: c2 => { c2(); const id = startServiceRestart(app.name); if (id) go(`#/operacje/${id}`); } }] });
      return;
    }
    const pend = app.pending.find(p => p.status === 'pending');
    if (!asDraft && !app.installed && pend && configComplete(app)) {
      openModal({ title: 'Konfiguracja kompletna', body: h('p', null, `${app.title} jest gotowa do instalacji w wersji ${pend.version}. Instalacja nadal wymaga Twojej zgody na ekranie decyzji.`), actions: [{ label: 'Zostań tutaj', kind: 'secondary', onClick: c2 => { c2(); rerender(); } }, { label: 'Przejdź do instalacji', kind: 'primary', onClick: c2 => { c2(); go(`#/aplikacje/${app.name}/decyzja/${pend.version}`); } }] });
      return;
    }
    rerender();
  };
  saveBtn.addEventListener('click', () => save(false));
  draftBtn.addEventListener('click', () => save(true));

  const head = h('div', { class: 'card-head' }, h('div', { style: 'flex:1' }, h('h2', null, `Konfiguracja: ${app.title}`), h('div', { class: 'small muted' }, `schemat konfiguracji ${app.config.schemaVersion} · wartości nie‑sekretne w bazie konfiguracji (CI), hasła w magazynie sekretów agenta`)), progress, standalone ? null : btn('Importuj pakiet od serwisu', { small: true, href: `#/aplikacje/${app.name}/konfiguracja/import` }));
  const body = h('div', { class: 'card-body' },
    ciError ? alertBox('danger', 'Baza konfiguracji (CI) jest nieosiągalna.', `Nie można połączyć się z localhost:3050:C:\\InfoSystem\\ci\\ci.fdb (połączenie odrzucone). Formularz jest tylko do odczytu. Sprawdź, czy usługa Firebird działa.`, undefined, h('div', { class: 'btn-row' }, btn('Spróbuj ponownie', { small: true, onClick: () => { demo.override = 'none'; rerender(); } }), btn('Diagnostyka', { small: true, kind: 'ghost', href: '#/diagnostyka?sekcja=zdrowie' }))) : null,
    forVersion ? alertBox('info', `Uzupełnij konfigurację dla wersji ${forVersion}`, 'Nowa wersja dodaje parametry oznaczone „nowe w …”. Pola wymagane blokują instalację do czasu uzupełnienia.') : null,
    d.imported ? alertBox('ok', 'Wczytano pakiet konfiguracji od serwisu', `Przygotował: ${d.imported.by}, ${fmtDateTime(d.imported.at)}. Nic nie zostało jeszcze zapisane. Uzupełnij pola oznaczone „do uzupełnienia przez Ciebie” i kliknij Zapisz.`) : null,
    firstTime && !d.imported ? alertBox('info', 'Masz pakiet konfiguracji od serwisu?', 'Zaimportuj go, zamiast przepisywać wartości. Pola haseł możesz zostawić do wpisania samodzielnie.', undefined, btn('Importuj pakiet od serwisu', { small: true, href: `#/aplikacje/${app.name}/konfiguracja/import` })) : null,
    sections,
    missingText,
    h('div', { class: 'savebar' }, changesText, h('span', { class: 'spacer' }), btn('Odrzuć zmiany', { kind: 'ghost', onClick: () => { delete drafts[app.name]; rerender(); } }), draftBtn, saveBtn));
  refreshSummary();
  return h('div', { class: 'card' }, head, body);
}

function viewConfig(name: string, query: URLSearchParams): HTMLElement {
  const app = findApp(name); if (!app) return appNotFound();
  const crumbs = h('span', null, h('a', { href: '#/aplikacje' }, 'Aplikacje'), ' / ', h('a', { href: `#/aplikacje/${app.name}` }, app.title), ' / konfiguracja');
  return h('div', { class: 'page narrow' },
    pageHeader(`Konfiguracja: ${app.title}`, 'Jedno miejsce zamiast wpisów SQL i plików XML. Pola haseł trafiają do magazynu sekretów i nie są wyświetlane po zapisie.', btn('Importuj pakiet od serwisu', { href: `#/aplikacje/${app.name}/konfiguracja/import` }), crumbs),
    configForm(app, true, query.get('dla') || undefined));
}

// ---------- E7 Import ----------
interface ImportState { fileName?: string; key: string; attempts: number; decrypting: boolean; error?: string; preview?: { by: string; at: string; site: string; apps: string[]; fields: { key: string; label: string; value: string; status: 'package' | 'fill' | 'unchanged'; secret: boolean }[] }; }
const importState: ImportState = { key: '', attempts: 0, decrypting: false };
const DEMO_KEY = 'ABCDEFGHJKLMNPQR';

function viewImport(name: string): HTMLElement {
  const app = findApp(name); if (!app) return appNotFound();
  const st = importState;
  const crumbs = h('span', null, h('a', { href: '#/aplikacje' }, 'Aplikacje'), ' / ', h('a', { href: `#/aplikacje/${app.name}` }, app.title), ' / ', h('a', { href: `#/aplikacje/${app.name}/konfiguracja` }, 'konfiguracja'), ' / import');
  const header = pageHeader('Import pakietu konfiguracji od serwisu', 'Serwis przygotował plik .iscfg zaszyfrowany jednorazowym kluczem przekazanym osobno (telefon, SMS). Nic nie zostanie zapisane, dopóki nie klikniesz Zapisz w formularzu.', undefined, crumbs);

  if (demo.override === 'loading') { st.decrypting = true; }
  if (demo.override === 'empty') { st.fileName = undefined; st.preview = undefined; st.error = undefined; }
  if (demo.override === 'error' && !st.error) { st.fileName = st.fileName || 'ug-przykladowo-cru-2026-10-18.iscfg'; st.error = 'Nie udało się odszyfrować pakietu. Sprawdź klucz (próba 1 z 5). Po 5 nieudanych próbach serwis musi wygenerować pakiet ponownie.'; }

  const normalizeKey = (k: string): string => k.toUpperCase().replace(/[^A-Z2-9]/g, '');
  const decrypt = (): void => {
    if (!st.fileName) { st.error = 'Wybierz plik pakietu (.iscfg).'; rerender(); return; }
    const k = normalizeKey(st.key);
    if (k.length !== 16) { st.error = 'Klucz ma 16 znaków w formacie XXXX-XXXX-XXXX-XXXX (bez liter O, I oraz cyfr 0, 1).'; rerender(); return; }
    st.decrypting = true; st.error = undefined; rerender();
    setTimeout(() => {
      st.decrypting = false;
      if (k !== DEMO_KEY) { st.attempts++; st.error = `Nie udało się odszyfrować pakietu. Sprawdź klucz (próba ${st.attempts} z 5). Po 5 nieudanych próbach serwis musi wygenerować pakiet ponownie.`; rerender(); return; }
      const vals = fullValues(app.name);
      const fields: ImportState['preview'] extends infer P ? P extends { fields: infer F } ? F : never : never = [] as unknown as NonNullable<ImportState['preview']>['fields'];
      app.config.sections.forEach(sec => sec.fields.forEach(f => {
        if (f.type === 'secret') fields.push({ key: f.key, label: f.label, value: '', status: f.key === 'database.password' ? 'package' : 'fill', secret: true });
        else if (f.key === 'app.unitTeryt' || f.key === 'mc.unitId' || f.key === 'ksef.nip') fields.push({ key: f.key, label: f.label, value: '', status: 'fill', secret: false });
        else fields.push({ key: f.key, label: f.label, value: String(vals[f.key] ?? ''), status: vals[f.key] === undefined || vals[f.key] === '' ? 'unchanged' : 'package', secret: false });
      }));
      st.preview = { by: 'serwis InfoSystem (Michał B.)', at: daysAgo(1, 15, 42), site: store.state.site.name, apps: [app.title], fields };
      rerender();
    }, 900);
  };
  const apply = (): void => {
    const d = getDraft(app); const p = st.preview!;
    p.fields.forEach(f => {
      if (f.status === 'package' && !f.secret) d.values[f.key] = f.value;
      if (f.status === 'package' && f.secret) d.fromPackage.add(f.key);
      if (f.status === 'fill') { d.highlight.add(f.key); if (f.secret) d.editingSecret.add(f.key); }
    });
    d.imported = { by: p.by, at: p.at };
    recordEvent('import', app, `Wczytano pakiet konfiguracji od serwisu dla ${app.title} (${p.fields.filter(f => f.status === 'package').length} pól, ${p.fields.filter(f => f.status === 'fill').length} do uzupełnienia). Niezapisany do czasu kliknięcia Zapisz.`);
    toast(`Wczytano ${p.fields.filter(f => f.status === 'package').length} pól, ${p.fields.filter(f => f.status === 'fill').length} do uzupełnienia.`, 'ok');
    st.preview = undefined; st.fileName = undefined; st.key = ''; st.error = undefined;
    go(`#/aplikacje/${app.name}/konfiguracja`);
  };

  const dropzone = h('div', { class: `dropzone ${st.fileName ? 'has-file' : ''}` },
    st.fileName ? h('div', null, h('strong', null, st.fileName), h('div', { class: 'small muted' }, '38 KB · pakiet konfiguracji InfoSystem')) : h('div', null, 'Przeciągnij tu plik .iscfg albo wskaż go na dysku'),
    h('div', { class: 'btn-row mt-8', style: 'justify-content:center' },
      h('label', { class: 'btn small' }, 'Wskaż plik…', h('input', { type: 'file', accept: '.iscfg', style: 'display:none', onChange: (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return; if (!f.name.endsWith('.iscfg')) { st.error = 'To nie jest pakiet konfiguracji (.iscfg).'; } else if (f.size > 1024 * 1024) { st.error = 'Plik jest większy niż 1 MB; to nie jest pakiet konfiguracji.'; } else { st.fileName = f.name; st.error = undefined; } rerender(); } })),
      btn('Użyj przykładowego pakietu (demo)', { small: true, kind: 'ghost', onClick: () => { st.fileName = `ug-przykladowo-${app.name}-2026-10-18.iscfg`; st.error = undefined; st.preview = undefined; rerender(); } })));

  const keyInput = h('input', { type: 'text', value: st.key, placeholder: 'XXXX-XXXX-XXXX-XXXX', maxlength: 19, style: 'font-family:var(--mono);letter-spacing:.08em', onInput: (e: Event) => { const el = e.target as HTMLInputElement; const raw = normalizeKey(el.value).slice(0, 16); el.value = raw.replace(/(.{4})(?=.)/g, '$1-'); st.key = el.value; } });

  const stepsCard = card(h('h2', null, '1. Plik i klucz'),
    h('div', null,
      dropzone,
      h('div', { class: 'mt-16' }, field('Klucz jednorazowy', keyInput, { required: true, help: 'Przekazany przez serwis innym kanałem niż plik. Ważny do pierwszego udanego odszyfrowania.' })),
      st.error ? alertBox('danger', null, st.error) : null,
      h('div', { class: 'btn-row' }, btn(st.decrypting ? 'Odszyfrowuję…' : 'Odszyfruj i pokaż', { kind: 'primary', disabled: st.decrypting, onClick: decrypt }), btn('Anuluj', { kind: 'ghost', href: `#/aplikacje/${app.name}/konfiguracja` })),
      !st.fileName && !st.preview ? h('div', { class: 'mt-16 small muted' }, h('strong', null, 'Skąd wziąć pakiet?'), ' Poproś serwis InfoSystem (', store.state.site.support.phone, '). Serwis przygotowuje pakiet dla tej placówki i tej aplikacji; pola haseł może zostawić do wpisania przez Ciebie.') : null));

  const previewCard = st.preview ? card(h('h2', null, '2. Podgląd przed zastosowaniem'),
    h('div', null,
      kv([['Przygotował', `${st.preview.by}, ${fmtDateTime(st.preview.at)} (podpis serwisu prawidłowy)`], ['Dla placówki', h('span', { class: 'row' }, st.preview.site, badge('zgodna z tą placówką', 'ok'))], ['Aplikacje', st.preview.apps.join(', ')], ['Schemat konfiguracji', `${app.config.schemaVersion} (zgodny z zainstalowaną wersją)`]]),
      h('div', { class: 'mt-16' }, table(['Pole', 'Wartość', 'Status'], st.preview.fields.map(f => ({ cells: [f.label, f.secret ? h('span', { class: 'muted' }, f.status === 'package' ? '•••••• (ustawione przez serwis)' : '—') : (f.value || h('span', { class: 'muted' }, '—')), f.status === 'package' ? badge('z pakietu', 'ok') : f.status === 'fill' ? badge('do uzupełnienia przez Ciebie', 'warn') : badge('bez zmian')] })))),
      h('p', { class: 'small muted mt-8' }, 'Nic nie zostało zapisane. Po zastosowaniu wartości trafią do formularza; zapis nastąpi po kliknięciu Zapisz.'),
      h('div', { class: 'btn-row' }, btn('Zastosuj do formularza', { kind: 'primary', onClick: apply }), btn('Anuluj', { kind: 'ghost', onClick: () => { st.preview = undefined; rerender(); } })))) : null;

  return h('div', { class: 'page narrow' }, header, stepsCard, previewCard);
}
