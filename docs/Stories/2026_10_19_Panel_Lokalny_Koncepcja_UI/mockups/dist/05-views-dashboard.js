"use strict";
// E0 Kreator startowy, E1 Pulpit, E2 Aplikacje.
const ALLOW_LIST = ['agent.infosystem.pl:443 (źródło pakietów i odbiornik raportów, HTTPS wychodzący)', 'api-eplatnosci.przyklad.gov.pl:443 (Ministerstwo Cyfryzacji, jak dotąd)'];
function viewStart() {
    const s = store.state;
    startBootstrap();
    const header = pageHeader('Pierwsze uruchomienie', `Agent został zainstalowany na serwerze ${s.site.server}. Poniżej kroki, które agent wykonuje samodzielnie. Żadna aplikacja nie zostanie zainstalowana bez Twojej zgody.`);
    if (demo.override === 'loading')
        return h('div', { class: 'page narrow' }, header, card(null, h('div', { class: 'state' }, h('div', { class: 'state-icon' }, '◠'), h('div', { class: 'state-text' }, 'Łączenie z usługą agenta…'), h('div', { class: 'muted small' }, 'Jedyny ekran z pełnoekranowym stanem ładowania: panel czeka na start usługi tuż po instalacji MSI.'))));
    if (demo.override === 'empty')
        return h('div', { class: 'page narrow' }, header, card(null, emptyState('Kreator został już zakończony. Platforma jest zainstalowana.', btn('Przejdź do pulpitu', { kind: 'primary', href: '#/pulpit' }))));
    const errorMode = demo.override === 'error';
    const steps = errorMode
        ? s.site.bootstrap.map((st, i) => i === 0 ? { ...st, status: 'failed', detail: 'InfoSystem nie rozpoznał klucza placówki lub token instalacyjny wygasł (token jest ważny 72 godziny).' } : { ...st, status: 'pending', detail: undefined })
        : s.site.bootstrap;
    const allDone = steps.every(st => st.status === 'ok');
    let tokenValue = '';
    return h('div', { class: 'page narrow' }, header, card(h('h2', null, 'Kroki wykonywane przez agenta'), stepList(steps)), errorMode ? card(h('h2', null, 'Rejestracja nie powiodła się'), h('div', null, h('p', null, 'Poproś serwis InfoSystem o nowy token instalacyjny i wpisz go poniżej. Nie trzeba ponownie instalować MSI.'), field('Nowy token instalacyjny', h('input', { type: 'text', placeholder: 'XXXX-XXXX-XXXX-XXXX-XXXX', onInput: (e) => { tokenValue = e.target.value; } }), { help: 'Token przekazany przez serwis (ważny 72 godziny).', required: true }), h('div', { class: 'btn-row' }, btn('Spróbuj ponownie z nowym tokenem', { kind: 'primary', onClick: () => { if (!/^[A-Za-z0-9-]{16,64}$/.test(tokenValue.trim())) {
            toast('Wpisz token (16–64 znaki).', 'warn');
            return;
        } demo.override = 'none'; toast('Rejestracja ponowiona (mockup).', 'ok'); rerender(); } }), btn('Sprawdź połączenie z InfoSystem', { href: '#/diagnostyka?sekcja=polaczenie' })), h('p', { class: 'mt-16 small muted' }, 'Jeśli problemem jest sieć, poproś IT urzędu o dopuszczenie ruchu wychodzącego do hostów:'), h('ul', { class: 'help-list small' }, ALLOW_LIST.map(x => h('li', null, x)))))
        : null, allDone ? card(h('h2', null, 'Co dalej'), h('div', null, h('p', null, h('strong', null, 'Platforma gotowa.'), ` nginx działa na porcie ${s.site.nginx.port} (port 443 zajmuje IIS). 4 aplikacje czekają na konfigurację i Twoją zgodę na instalację.`), h('p', null, 'Adres, pod którym aplikacje będą dostępne dla operatorów (zadziała po instalacji pierwszej aplikacji):'), h('div', { class: 'copy-box mb-16' }, h('span', null, operatorsAddress()), btn('Kopiuj', { small: true, onClick: () => copyText(operatorsAddress()) })), h('div', { class: 'btn-row' }, btn('Przejdź do konfiguracji pierwszej aplikacji', { kind: 'primary', onClick: () => { store.update(st => { st.site.wizardDismissed = true; }); go('#/aplikacje/skarbowy/konfiguracja'); } }), btn('Przejdź do pulpitu', { onClick: () => { store.update(st => { st.site.wizardDismissed = true; }); go('#/pulpit'); } }), btn('Co robi agent na tym serwerze?', { kind: 'ghost', href: '#/pomoc' }))))
        : h('p', { class: 'muted small' }, 'Kroki trwają zwykle 2–5 minut przy zwykłym łączu. Możesz zamknąć to okno; agent dokończy pracę sam.'));
}
function viewDashboard() {
    const s = store.state;
    const header = pageHeader('Pulpit', `Stan placówki ${s.site.name}. Dane odświeżane co 30 s.`);
    const ov = stateOverride({ emptyText: `Brak oczekujących decyzji. Agent sprawdza nowe wersje co ${s.site.agent.pollMinutes} minut (ostatnio ${fmtTime(s.site.infoSystem.lastContact)}).` });
    if (ov)
        return h('div', { class: 'page' }, header, ov);
    const decisions = pendingDecisions();
    const scheduled = scheduledDecisions();
    const apps = appsOnly();
    const notInstalled = apps.filter(a => !a.installed);
    const installable = notInstalled.filter(a => configComplete(a) && a.pending.some(p => p.status === 'pending'));
    const tiles = h('div', { class: 'grid cols-5 mb-16' }, h('div', { class: `tile ${s.site.infoSystem.connected ? '' : 'warn'}` }, h('div', { class: 'tile-label' }, 'InfoSystem'), h('div', { class: 'tile-value' }, dot(s.site.infoSystem.connected ? 'ok' : 'warn'), s.site.infoSystem.connected ? 'Połączono' : 'Brak połączenia'), h('div', { class: 'tile-sub' }, `ostatni kontakt ${fmtRelative(s.site.infoSystem.lastContact)}${s.site.infoSystem.buffered ? ` · ${s.site.infoSystem.buffered} raporty w buforze` : ''}`)), h('div', { class: `tile ${s.site.nginx.state === 'running' ? '' : 'warn'}` }, h('div', { class: 'tile-label' }, 'nginx (wejście dla operatorów)'), h('div', { class: 'tile-value' }, dot(s.site.nginx.state === 'running' ? 'ok' : 'warn'), SERVICE_LABEL[s.site.nginx.state]), h('div', { class: 'tile-sub' }, `port ${s.site.nginx.port}${s.site.nginx.port !== 443 ? ' (443 zajęty przez IIS)' : ''} · ${s.site.nginx.version}`)), h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Adres dla operatorów'), h('div', { class: 'tile-value mono', style: 'font-size:13px' }, operatorsAddress()), h('div', { class: 'tile-sub' }, btn('Kopiuj', { small: true, kind: 'ghost', onClick: () => copyText(operatorsAddress()) }))), h('div', { class: `tile ${s.site.disk.freeGb < 2 ? 'danger' : ''}` }, h('div', { class: 'tile-label' }, 'Dysk'), h('div', { class: 'tile-value' }, `${fmtGb(s.site.disk.freeGb)} wolne`), h('div', { class: 'tile-sub' }, `platforma zajmuje ${fmtGb(s.site.disk.usedByPlatformGb)} w C:\\InfoSystem`)), h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Site Agent'), h('div', { class: 'tile-value' }, `wersja ${s.site.agent.version}`), h('div', { class: 'tile-sub' }, s.site.agent.available ? h('a', { href: '#/aplikacje/agent/decyzja/' + s.site.agent.available }, `dostępna ${s.site.agent.available}`) : 'aktualny')));
    const decisionCard = card(h('h2', null, `Wymaga Twojej decyzji${decisions.length ? ` (${decisions.length})` : ''}`), decisions.length === 0
        ? emptyState(`Brak oczekujących decyzji. Agent sprawdza nowe wersje co ${s.site.agent.pollMinutes} minut (ostatnio ${fmtTime(s.site.infoSystem.lastContact)}).`, undefined, '✓')
        : h('div', { class: 'decision-list' }, decisions.map(({ app, pv }) => h('div', { class: 'decision-item' }, h('div', { class: 'd-main' }, h('div', { class: 'd-title' }, app.isPlatform ? `Site Agent ${app.installed} → ${pv.version}` : pv.isFirstInstall ? `${app.title}: instalacja ${pv.version}` : `${app.title} ${app.installed} → ${pv.version}`, app.isPlatform ? h('span', { class: 'badge accent', style: 'margin-left:8px' }, 'składnik platformy') : null), h('div', { class: 'd-sub' }, CHANNEL_LABEL[pv.channel], '·', `udostępniona ${fmtRelative(pv.offeredAt)}`, impactBadges(pv.impact, pv.isFirstInstall), pv.annotation ? badge('poprzednia próba wycofana', 'danger') : null, !app.isPlatform && !configComplete(app) ? badge('brakuje konfiguracji', 'warn') : null)), btn('Zdecyduj', { kind: 'primary', href: `#/aplikacje/${app.name}/decyzja/${pv.version}` })))), installable.length >= 2 ? btn(`Zainstaluj wszystkie skonfigurowane (${installable.length})`, { onClick: () => confirmModal('Zainstalować wszystkie skonfigurowane aplikacje?', h('div', null, h('p', null, `Agent zainstaluje jedna po drugiej: ${installable.map(a => a.title).join(', ')}. Każda instalacja ma własny przebieg i raport.`), h('p', { class: 'muted small' }, 'Aplikacje bez kompletnej konfiguracji zostaną pominięte.')), 'Instaluj wszystkie', () => { installable.forEach(a => startInstall(a.name, a.pending[0].version)); go('#/operacje'); }) }) : null);
    const scheduledCard = scheduled.length ? card(h('h2', null, `Zaplanowane (${scheduled.length})`), h('div', { class: 'decision-list' }, scheduled.map(({ app, pv }) => h('div', { class: 'decision-item' }, h('div', { class: 'd-main' }, h('div', { class: 'd-title' }, `${app.title} ${pv.version}`), h('div', { class: 'd-sub' }, `${fmtDayDateTime(pv.scheduledAt)} (czas serwera)`, pv.deferOnSessions ? badge('odłożenie przy aktywnych sesjach', 'info') : null)), btn('Zmień termin', { small: true, onClick: () => scheduleDialog(app, pv) }), btn('Anuluj plan', { small: true, kind: 'ghost', onClick: () => confirmModal('Anulować zaplanowaną instalację?', `${app.title} ${pv.version} wróci do oczekujących na decyzję. Serwis zobaczy zmianę.`, 'Anuluj plan', () => { unscheduleVersion(app.name, pv.version); toast('Plan anulowany.', 'ok'); }) }))))) : null;
    const appsGrid = card(h('h2', null, 'Aplikacje'), h('div', { class: 'grid cols-4' }, apps.map(app => {
        const pend = app.pending.find(p => p.status === 'pending');
        const sched = app.pending.find(p => p.status === 'scheduled');
        const lastOp = s.operations.find(o => o.app === app.name && o.result !== 'running');
        const problem = app.service === 'failed' || (app.health && app.health.status === 'unhealthy') || (app.restartLoop || 0) >= 3;
        return h('div', { class: `app-card ${problem ? 'problem' : ''}`, onClick: () => go(`#/aplikacje/${app.name}`) }, h('div', { class: 'app-title' }, app.title), app.installed
            ? h('div', { class: 'app-version' }, `wersja ${app.installed} · ${app.prefix}`)
            : h('div', { class: 'app-version' }, 'nie zainstalowana'), h('div', { class: 'app-row' }, serviceBadge(app.service), app.installed ? healthBadge(app.health) : (configComplete(app) ? badge('skonfigurowana', 'ok') : badge('brakuje konfiguracji', 'warn'))), h('div', { class: 'app-row' }, pend ? badge(pend.isFirstInstall ? `gotowa do instalacji ${pend.version}` : `→ ${pend.version} czeka na decyzję`, 'accent') : null, sched ? badge(`zaplanowano ${fmtDate(sched.scheduledAt)} ${fmtTime(sched.scheduledAt)}`, 'info') : null, app.policy.enabled ? badge(`auto: ${app.policy.days.map(d => DAY_SHORT[d]).join(',')} ${app.policy.from}–${app.policy.to}`, 'info', 'Automatyczna instalacja w oknie, włączona przez Ciebie') : null), lastOp ? h('div', { class: 'app-row' }, `ostatnio: ${OP_TYPE_LABEL[lastOp.type].toLowerCase()} ${fmtRelative(lastOp.startedAt)}`, resultBadge(lastOp.result)) : null, !app.installed ? h('div', { class: 'btn-row', onClick: (e) => e.stopPropagation() }, configComplete(app) ? null : btn('Skonfiguruj', { small: true, href: `#/aplikacje/${app.name}/konfiguracja` }), pend ? btn('Zainstaluj', { small: true, kind: 'primary', href: `#/aplikacje/${app.name}/decyzja/${pend.version}` }) : null) : null);
    })));
    const recent = s.operations.slice(0, 5);
    const recentCard = card(h('h2', null, 'Ostatnie operacje'), recent.length === 0 ? emptyState('Brak operacji. Pojawią się tu instalacje, aktualizacje, zmiany konfiguracji i decyzje.') :
        table(['Kiedy', 'Co', 'Kto', 'Wynik'], recent.map(o => ({
            cells: [h('span', { title: 'czas serwera' }, fmtDateTime(o.startedAt), h('span', { class: 'sub' }, fmtRelative(o.startedAt))), h('span', null, `${OP_TYPE_LABEL[o.type]}: ${o.appTitle}${o.toVersion ? ' ' + (o.fromVersion ? o.fromVersion + ' → ' : '') + o.toVersion : ''}`, o.summary ? h('span', { class: 'sub' }, o.summary) : null), o.actor, h('span', { class: 'row' }, resultBadge(o.result), reportedBadge(o.reported))],
            onClick: () => go(`#/operacje/${o.id}`),
        }))), btn('Wszystkie operacje', { kind: 'ghost', small: true, href: '#/operacje' }));
    return h('div', { class: 'page' }, header, tiles, decisionCard, scheduledCard, appsGrid, recentCard);
}
function viewApps(query) {
    const filter = query.get('filtr') || 'wszystkie';
    const header = pageHeader('Aplikacje', 'Wszystkie aplikacje i składniki platformy w tej placówce.', btn('Importuj pakiet aplikacji z pliku', { disabled: true, title: 'Dostępne w przyszłej wersji: dla serwerów bez internetu (ta sama weryfikacja podpisu).' }));
    const ov = stateOverride({ emptyText: 'Brak aplikacji spełniających filtr.', emptyAction: btn('Wyczyść filtr', { href: '#/aplikacje' }) });
    if (ov)
        return h('div', { class: 'page' }, header, ov);
    let apps = store.state.apps;
    if (filter === 'oczekujace')
        apps = apps.filter(a => a.pending.some(p => p.status === 'pending'));
    if (filter === 'problemy')
        apps = apps.filter(a => a.service === 'failed' || a.service === 'stopped' || (a.health && a.health.status !== 'healthy'));
    if (filter === 'zaplanowane')
        apps = apps.filter(a => a.pending.some(p => p.status === 'scheduled'));
    const filters = h('div', { class: 'filters' }, segment([
        { key: 'wszystkie', label: 'Wszystkie', href: '#/aplikacje' }, { key: 'oczekujace', label: `Oczekujące decyzji (${pendingDecisions().length})`, href: '#/aplikacje?filtr=oczekujace' },
        { key: 'problemy', label: 'Z problemami', href: '#/aplikacje?filtr=problemy' }, { key: 'zaplanowane', label: 'Zaplanowane', href: '#/aplikacje?filtr=zaplanowane' }
    ], filter));
    const body = apps.length === 0 ? emptyState('Brak aplikacji spełniających filtr.', btn('Wyczyść filtr', { href: '#/aplikacje' })) :
        table(['Aplikacja', 'Adres', 'Zainstalowana', 'Stan usługi', 'Zdrowie', 'Udostępniona wersja', 'Polityka', ''], apps.map(a => {
            const pend = a.pending.find(p => p.status === 'pending');
            const sched = a.pending.find(p => p.status === 'scheduled');
            return { cells: [
                    h('span', null, h('strong', null, a.title), a.isPlatform ? h('span', { class: 'sub' }, 'składnik platformy (agent + nginx)') : null),
                    a.isPlatform ? h('span', { class: 'muted' }, '—') : h('code', null, a.prefix),
                    a.installed || h('span', { class: 'muted' }, 'nie'),
                    serviceBadge(a.service),
                    a.isPlatform ? h('span', { class: 'muted' }, '—') : (a.installed ? healthBadge(a.health) : (configComplete(a) ? badge('skonfigurowana', 'ok') : badge('brakuje konfiguracji', 'warn'))),
                    pend ? h('span', null, h('strong', null, pend.version), ' ', impactBadges(pend.impact, pend.isFirstInstall)) : sched ? badge(`zaplanowano ${fmtDate(sched.scheduledAt)} ${fmtTime(sched.scheduledAt)}`, 'info') : h('span', { class: 'muted' }, 'brak (najnowsza)'),
                    a.policy.enabled ? badge(`auto ${a.policy.days.map(d => DAY_SHORT[d]).join(',')} ${a.policy.from}–${a.policy.to}`, 'info') : h('span', { class: 'muted' }, 'tylko ręcznie'),
                    h('div', { class: 'btn-row' }, pend ? btn('Zdecyduj', { small: true, kind: 'primary', href: `#/aplikacje/${a.name}/decyzja/${pend.version}` }) : null, btn('Szczegóły', { small: true, href: `#/aplikacje/${a.name}` })),
                ] };
        }));
    return h('div', { class: 'page' }, header, filters, card(null, body));
}
