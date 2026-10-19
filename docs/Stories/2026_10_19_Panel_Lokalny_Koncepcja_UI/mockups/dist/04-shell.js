"use strict";
// Szkielet aplikacji: pasek górny, nawigacja boczna, banery, panel demo, nakładka restartu agenta.
function renderShell(content, routeName) {
    const s = store.state;
    const pendingCount = pendingDecisions().length;
    const running = isOperationRunning();
    const is = s.site.infoSystem;
    const nav = [
        { key: 'pulpit', label: 'Pulpit', href: '#/pulpit', icon: '▦' },
        { key: 'aplikacje', label: 'Aplikacje', href: '#/aplikacje', icon: '▣', badge: pendingCount },
        { key: 'operacje', label: 'Operacje', href: '#/operacje', icon: '≡', pulse: running },
        { key: 'diagnostyka', label: 'Diagnostyka', href: '#/diagnostyka', icon: '✚' },
        { key: 'ustawienia', label: 'Ustawienia', href: '#/ustawienia', icon: '⚙' },
        { key: 'pomoc', label: 'Pomoc', href: '#/pomoc', icon: '?' },
    ];
    const topbar = h('header', { class: 'topbar' }, h('div', { class: 'brand' }, h('span', { class: 'logo' }, 'SA'), 'Panel lokalny'), h('div', { class: 'site' }, `${s.site.name} · ${s.site.server}`), h('div', { class: 'spacer' }), h('div', { class: 'meta' }, h('span', { class: 'row', style: 'gap:6px', title: is.connected ? `Ostatni kontakt: ${fmtDateTime(is.lastContact)}` : `Brak połączenia od ${fmtDateTime(is.lastContact)}` }, dot(is.connected ? 'ok' : 'warn'), is.connected ? `InfoSystem: połączono, ostatni kontakt ${fmtRelative(is.lastContact)}` : `InfoSystem: brak połączenia od ${fmtTime(is.lastContact)}`), h('span', { title: 'Nazwa konta Windows bieżącej sesji trafia do dziennika operacji' }, `${s.site.windowsAccount} · zapisywane w dzienniku`), h('span', null, `agent ${s.site.agent.version}`)));
    const sidebar = h('nav', { class: 'sidebar' }, nav.map(n => h('a', { href: n.href, class: routeName === n.key ? 'active' : '' }, h('span', { class: 'nav-icon' }, n.icon), h('span', { class: 'nav-label' }, n.label), n.badge ? h('span', { class: 'nav-badge', title: 'oczekujące decyzje' }, String(n.badge)) : null, n.pulse ? h('span', { class: 'nav-pulse', title: 'operacja w toku' }) : null)), h('div', { class: 'nav-foot' }, `Panel działa tylko na 127.0.0.1. Dostęp = sesja na serwerze.`));
    const banners = s.notifications.map(n => alertBox(n.kind === 'error' ? 'danger' : n.kind === 'warning' ? 'warn' : 'info', null, n.text, () => store.update(st => { st.notifications = st.notifications.filter(x => x.id !== n.id); }), n.link ? btn(n.linkLabel || 'Zobacz', { kind: 'ghost', small: true, href: n.link }) : null));
    const runningOp = runningOperation();
    const runningBanner = runningOp && routeName !== 'operacja'
        ? alertBox('info', null, h('span', null, `Trwa operacja: ${OP_TYPE_LABEL[runningOp.type].toLowerCase()} ${runningOp.appTitle}${runningOp.toVersion ? ' ' + runningOp.toVersion : ''}. Pozostałe aplikacje działają.`), undefined, btn('Zobacz przebieg', { kind: 'ghost', small: true, href: `#/operacje/${runningOp.id}` }))
        : null;
    return h('div', { class: 'shell' }, topbar, sidebar, h('main', { class: 'content', id: 'main' }, h('div', { class: 'page' }, banners, runningBanner), content), demoPanel(), demo.agentRestarting ? h('div', { class: 'overlay-restart' }, h('div', { class: 'big' }), h('div', null, h('strong', null, 'Agent uruchamia się ponownie…')), h('div', { class: 'muted' }, 'Panel będzie dostępny za ok. 30 s. Aplikacje działają bez przerwy. Łączenie ponownie co 3 s.')) : null);
}
function demoPanel() {
    const scenarios = [
        { value: 'fresh', label: 'Pierwsze uruchomienie (po MSI)' },
        { value: 'normal', label: 'Praca bieżąca (3 aktualizacje czekają)' },
        { value: 'offline', label: 'Brak połączenia z InfoSystem' },
        { value: 'rolledback', label: 'Po automatycznym wycofaniu KSeF' },
    ];
    const overrides = [{ key: 'none', label: 'normalny' }, { key: 'loading', label: 'ładowanie' }, { key: 'empty', label: 'pusty' }, { key: 'error', label: 'błąd' }];
    return h('aside', { class: `demo-panel ${demo.open ? '' : 'collapsed'}` }, h('div', { class: 'demo-head', onClick: () => { demo.open = !demo.open; rerender(); } }, h('span', null, 'Demo: scenariusz i stany ekranu'), demo.open ? '▾' : '▴'), h('div', { class: 'demo-body' }, h('label', null, 'Scenariusz danych', select(scenarios, demo.scenario, v => { loadScenario(v); go(defaultRoute()); rerender(); })), h('div', null, 'Wymuś stan bieżącego ekranu'), h('div', { class: 'radio-row' }, overrides.map(o => h('label', null, h('input', { type: 'radio', name: 'demo-ovr', checked: demo.override === o.key, onChange: () => { demo.override = o.key; rerender(); } }), o.label))), h('div', { class: 'demo-note' }, 'Instalacja KSeF 3.2.0 kończy się celowo automatycznym wycofaniem (A6). Klucz do przykładowego pakietu konfiguracji: ABCD-EFGH-JKLM-NPQR.')));
}
