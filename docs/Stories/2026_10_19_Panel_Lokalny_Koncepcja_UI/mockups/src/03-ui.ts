// Budowanie DOM i wspólne komponenty UI.

type Child = Node | string | number | boolean | null | undefined | Child[];

function h(tag: string, attrs: Record<string, unknown> | null = null, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  if (attrs) {
    for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      else if (k === 'style') el.setAttribute('style', String(v));
      else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'open') { if (v) el.setAttribute(k, ''); (el as unknown as Record<string, unknown>)[k] = v; }
      else if (k === 'value') (el as HTMLInputElement).value = String(v);
      else el.setAttribute(k, String(v));
    }
  }
  appendChildren(el, children);
  return el;
}
function appendChildren(el: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false || c === true) continue;
    if (Array.isArray(c)) appendChildren(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}
function go(hash: string): void { location.hash = hash; }
function copyText(text: string): void {
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('Skopiowano do schowka', 'ok'), () => toast('Skopiowano (mockup)', 'ok'));
  else toast('Skopiowano (mockup)', 'ok');
}

// ---------- Komponenty ----------
function badge(text: string, kind: BadgeKind = 'neutral', title?: string): HTMLElement { return h('span', { class: `badge ${kind === 'neutral' ? '' : kind}`, title }, text); }
function dot(kind: 'ok' | 'warn' | 'danger' | 'info' | 'neutral'): HTMLElement { return h('span', { class: `dot ${kind === 'neutral' ? '' : kind}` }); }

interface BtnOpts { kind?: BtnKind; onClick?: (e: Event) => void; disabled?: boolean; title?: string; small?: boolean; href?: string; }
function btn(label: Child, opts: BtnOpts = {}): HTMLElement {
  const cls = `btn ${opts.kind && opts.kind !== 'secondary' ? opts.kind : ''} ${opts.small ? 'small' : ''} ${opts.disabled ? 'disabled' : ''}`;
  if (opts.href && !opts.disabled) return h('a', { class: cls, href: opts.href, title: opts.title }, label);
  return h('button', { class: cls, type: 'button', disabled: !!opts.disabled, title: opts.title, onClick: opts.onClick }, label);
}

function card(title: Child | null, body: Child, actions?: Child, cls = ''): HTMLElement {
  return h('div', { class: `card ${cls}` },
    title !== null ? h('div', { class: 'card-head' }, typeof title === 'string' ? h('h2', null, title) : title, actions ? h('div', { class: 'btn-row' }, actions) : null) : null,
    h('div', { class: 'card-body' }, body));
}

function pageHeader(title: string, subtitle?: Child, actions?: Child, crumbs?: Child): HTMLElement {
  return h('div', { class: 'page-header' },
    h('div', { class: 'titles' }, crumbs ? h('div', { class: 'crumbs' }, crumbs) : null, h('h1', null, title), subtitle ? h('div', { class: 'subtitle' }, subtitle) : null),
    actions ? h('div', { class: 'actions' }, actions) : null);
}

function kv(rows: [Child, Child][]): HTMLElement {
  const dl = h('dl', { class: 'kv' });
  rows.forEach(([k, v]) => { dl.appendChild(h('dt', null, k)); dl.appendChild(h('dd', null, v)); });
  return dl;
}

function table(headers: Child[], rows: { cells: Child[]; onClick?: () => void; cls?: string }[]): HTMLElement {
  return h('table', { class: 'table' },
    h('thead', null, h('tr', null, headers.map(x => h('th', null, x)))),
    h('tbody', null, rows.map(r => h('tr', { class: `${r.onClick ? 'clickable' : ''} ${r.cls || ''}`, onClick: r.onClick }, r.cells.map(c => h('td', null, c))))));
}

function skeleton(lines = 3, block = false): HTMLElement {
  const wrap = h('div', { 'aria-busy': 'true' });
  for (let i = 0; i < lines; i++) wrap.appendChild(h('div', { class: `skeleton ${block ? 'block' : ''}`, style: block ? '' : `width: ${60 + ((i * 17) % 35)}%` }));
  wrap.appendChild(h('div', { class: 'loading-note' }, 'Ładowanie… (po 5 s: „Trwa dłużej niż zwykle”)'));
  return wrap;
}
function emptyState(text: string, action?: Child, icon = '○'): HTMLElement {
  return h('div', { class: 'state empty' }, h('div', { class: 'state-icon' }, icon), h('div', { class: 'state-text' }, text), action ? h('div', { class: 'row', style: 'justify-content:center' }, action) : null);
}
function errorState(text: string, retry?: () => void, logsHref = '#/diagnostyka?sekcja=logi&log=agent'): HTMLElement {
  return h('div', { class: 'state error' }, h('div', { class: 'state-icon' }, '⚠'), h('div', { class: 'state-text' }, text),
    h('div', { class: 'row', style: 'justify-content:center' }, btn('Spróbuj ponownie', { onClick: retry || (() => { demo.override = 'none'; rerender(); }) }), btn('Zobacz logi agenta', { kind: 'ghost', href: logsHref })));
}
function alertBox(kind: 'info' | 'warn' | 'danger' | 'ok', title: Child, body?: Child, onClose?: () => void, action?: Child): HTMLElement {
  return h('div', { class: `alert ${kind}` },
    h('div', { class: 'alert-body' }, title ? h('div', { class: 'alert-title' }, title) : null, body ? h('div', null, body) : null, action ? h('div', { class: 'row mt-8' }, action) : null),
    onClose ? h('button', { class: 'close', title: 'Zamknij', onClick: onClose }, '×') : null);
}

interface OverrideOpts { emptyText: string; emptyAction?: Child; errorText?: string; }
// Wymuszony stan ekranu z panelu Demo: ładowanie / pusty / błąd.
function stateOverride(o: OverrideOpts): HTMLElement | null {
  if (demo.override === 'loading') return h('div', { class: 'card' }, h('div', { class: 'card-body' }, skeleton(4), skeleton(2, true)));
  if (demo.override === 'empty') return h('div', { class: 'card' }, h('div', { class: 'card-body' }, emptyState(o.emptyText, o.emptyAction)));
  if (demo.override === 'error') return h('div', { class: 'card' }, h('div', { class: 'card-body' }, errorState(o.errorText || 'Nie udało się pobrać danych z usługi agenta (HTTP 503: agent zajęty). Pozostałe części panelu działają.')));
  return null;
}

function stepIcon(status: StepStatus | 'warn'): HTMLElement {
  const glyph: Record<string, string> = { pending: '', running: '◠', ok: '✓', failed: '✕', skipped: '–', warn: '!' };
  return h('span', { class: `step-icon ${status}` }, glyph[status]);
}
function stepList(steps: OpStep[]): HTMLElement {
  return h('ul', { class: 'steps' }, steps.map(s => h('li', null,
    stepIcon(s.status),
    h('div', null, h('div', { class: 'step-title' }, s.title), s.detail ? h('div', { class: 'step-detail' }, s.detail) : null),
    h('div', { class: 'step-time' }, s.status === 'running' ? 'w toku…' : s.status === 'pending' ? 'oczekuje' : s.durationMs ? fmtDuration(s.durationMs) : ''))));
}

function impactBadges(impact: Impact, isFirst = false): HTMLElement {
  const row = h('div', { class: 'pill-row' });
  if (isFirst) row.appendChild(badge('pierwsza instalacja', 'accent'));
  if (impact.urgent) row.appendChild(badge('pilne', 'danger', 'Serwis oznaczył wersję jako pilną (np. zmiana prawa)'));
  if (impact.requiresRestart) row.appendChild(badge('restart usługi', 'warn', 'Przerwa ok. 1 min dla operatorów tej aplikacji'));
  if (impact.schemaMigration) row.appendChild(badge('migracja bazy', 'warn', 'Serwis wykonuje migrację ręcznie przed instalacją'));
  if (!impact.schemaMigration && !isFirst) row.appendChild(badge('bez zmian w bazie', 'ok'));
  return row;
}
function serviceBadge(state: ServiceState): HTMLElement {
  const kind: Record<ServiceState, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = { running: 'ok', stopped: 'warn', starting: 'info', restarting: 'info', failed: 'danger', 'not-installed': 'neutral' };
  return h('span', { class: 'row', style: 'gap:6px' }, dot(kind[state]), SERVICE_LABEL[state]);
}
function healthBadge(hr: HealthResult | null): HTMLElement {
  if (!hr) return badge('nie sprawdzono');
  const kind: Record<HealthStatus, BadgeKind> = { healthy: 'ok', degraded: 'warn', unhealthy: 'danger', unknown: 'neutral' };
  return badge(HEALTH_LABEL[hr.status], kind[hr.status], `sprawdzono ${fmtRelative(hr.checkedAt)}`);
}
function resultBadge(r: OpResult): HTMLElement {
  const kind: Record<OpResult, BadgeKind> = { running: 'info', success: 'ok', 'rolled-back': 'danger', failed: 'danger', done: 'neutral', cancelled: 'neutral' };
  return badge(OP_RESULT_LABEL[r], kind[r]);
}
function reportedBadge(r: Reported): HTMLElement {
  return r === 'sent' ? badge('raport wysłany', 'ok') : r === 'buffered' ? badge('raport w buforze', 'warn', 'zostanie wysłany po przywróceniu łączności') : badge('raport nie dotarł', 'danger');
}

// ---------- Modal ----------
interface ModalAction { label: string; kind?: BtnKind; onClick: (close: () => void) => void; disabled?: boolean; id?: string; }
function openModal(opts: { title: string; body: Child; actions: ModalAction[]; wide?: boolean }): () => void {
  const root = document.getElementById('overlays')!;
  const close = (): void => { backdrop.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') close(); };
  const backdrop = h('div', { class: 'modal-backdrop', onClick: (e: Event) => { if (e.target === backdrop) close(); } },
    h('div', { class: `modal ${opts.wide ? 'wide' : ''}`, role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'modal-head' }, h('h2', null, opts.title), h('button', { class: 'close', title: 'Zamknij', onClick: close, style: 'border:none;background:none;font-size:18px;cursor:pointer' }, '×')),
      h('div', { class: 'modal-body' }, opts.body),
      h('div', { class: 'modal-foot' }, opts.actions.map(a => btn(a.label, { kind: a.kind, disabled: a.disabled, onClick: () => a.onClick(close) })))));
  const idBtns = backdrop.querySelectorAll('.modal-foot .btn');
  opts.actions.forEach((a, i) => { if (a.id) (idBtns[i] as HTMLElement).id = a.id; });
  root.appendChild(backdrop);
  document.addEventListener('keydown', onKey);
  return close;
}
function confirmModal(title: string, body: Child, okLabel: string, onOk: () => void, danger = false): void {
  openModal({ title, body, actions: [{ label: 'Anuluj', kind: 'secondary', onClick: c => c() }, { label: okLabel, kind: danger ? 'danger' : 'primary', onClick: c => { c(); onOk(); } }] });
}

// ---------- Toast ----------
function toast(text: string, kind: BadgeKind = 'info'): void {
  const root = document.getElementById('toasts')!;
  const t = h('div', { class: `toast ${kind}` }, text);
  root.appendChild(t);
  setTimeout(() => { t.remove(); }, 3500);
}
toastHook = toast;

// ---------- Pola formularzy ----------
function field(label: Child, input: Child, opts: { help?: Child; error?: string; required?: boolean; cls?: string; id?: string } = {}): HTMLElement {
  return h('div', { class: `field ${opts.error ? 'invalid' : ''} ${opts.cls || ''}`, id: opts.id },
    h('label', null, label, opts.required ? h('span', { class: 'req', title: 'wymagane' }, '*') : null),
    input,
    opts.help ? h('div', { class: 'help' }, opts.help) : null,
    h('div', { class: 'error' }, opts.error || ''));
}
function checkbox(label: Child, checked: boolean, onChange: (v: boolean) => void, help?: Child, disabled = false): HTMLElement {
  const input = h('input', { type: 'checkbox', checked, disabled, onChange: (e: Event) => onChange((e.target as HTMLInputElement).checked) });
  return h('label', { class: 'check' }, input, h('div', null, h('div', null, label), help ? h('div', { class: 'check-help' }, help) : null));
}
function select(options: SelectOption[], value: string, onChange: (v: string) => void, attrs: Record<string, unknown> = {}): HTMLElement {
  const sel = h('select', { ...attrs, onChange: (e: Event) => onChange((e.target as HTMLSelectElement).value) }, options.map(o => h('option', { value: o.value, selected: o.value === value }, o.label)));
  (sel as HTMLSelectElement).value = value;
  return sel;
}

function tabs(items: { key: string; label: string; href: string }[], active: string): HTMLElement {
  return h('nav', { class: 'tabs' }, items.map(t => h('a', { href: t.href, class: t.key === active ? 'active' : '' }, t.label)));
}
function segment(items: { key: string; label: string; href: string }[], active: string): HTMLElement {
  return h('div', { class: 'segment' }, items.map(t => h('a', { href: t.href, class: t.key === active ? 'active' : '' }, t.label)));
}
function notesList(notes: string[]): HTMLElement { return h('ul', { class: 'notes' }, notes.map(n => h('li', null, n))); }
function logView(lines: string[], id = 'log'): HTMLElement {
  const el = h('div', { class: 'log', id }, lines.map(l => h('div', { class: l.includes('[ERROR]') || l.includes('[ERR]') ? 'lvl-err' : l.includes('[WARN]') || l.includes('[WRN]') ? 'lvl-warn' : l.includes('[OK]') ? 'lvl-ok' : '' }, l)));
  return el;
}

// Wywoływane przez router (zdefiniowane w 09-app.ts); deklaracja, żeby komponenty mogły wymusić odświeżenie.
let rerender: () => void = () => undefined;
