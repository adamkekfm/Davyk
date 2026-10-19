"use strict";
// E3 Aplikacja: szczegóły, E4 Decyzja o aktualizacji, E5 Przebieg operacji, okna dialogowe.
function appNotFound() {
    return h('div', { class: 'page' }, pageHeader('Nie ma takiej aplikacji'), card(null, errorState('Aplikacja o tej nazwie nie istnieje w tej placówce.', () => go('#/aplikacje'))));
}
function viewApp(name, tab) {
    const app = findApp(name);
    if (!app)
        return appNotFound();
    const s = store.state;
    const pend = app.pending.find(p => p.status === 'pending');
    const tabItems = app.isPlatform
        ? [{ key: 'przeglad', label: 'Przegląd' }, { key: 'wersje', label: 'Wersje' }, { key: 'historia', label: 'Historia' }]
        : [{ key: 'przeglad', label: 'Przegląd' }, { key: 'wersje', label: 'Wersje' }, { key: 'konfiguracja', label: 'Konfiguracja' }, { key: 'zdrowie', label: 'Zdrowie i logi' }, { key: 'historia', label: 'Historia' }];
    if (!tabItems.some(t => t.key === tab))
        tab = 'przeglad';
    const header = pageHeader(app.title, h('div', { class: 'row' }, serviceBadge(app.service), app.installed ? `wersja ${app.installed}` : 'nie zainstalowana', !app.isPlatform && app.installed ? healthBadge(app.health) : null, app.isPlatform ? badge('składnik platformy', 'accent') : null), pend ? btn(pend.isFirstInstall ? `Zainstaluj ${pend.version}` : `Zdecyduj: ${pend.version}`, { kind: 'primary', href: `#/aplikacje/${app.name}/decyzja/${pend.version}` }) : null, h('span', null, h('a', { href: '#/aplikacje' }, 'Aplikacje'), ' / ', app.title));
    const nav = tabs(tabItems.map(t => ({ ...t, href: `#/aplikacje/${app.name}?karta=${t.key}` })), tab);
    let body;
    const ov = stateOverride({ emptyText: tab === 'wersje' ? 'Brak udostępnionych wersji. Zainstalowana jest najnowsza wersja w kanale stabilnym.' : tab === 'historia' ? 'Brak operacji dla tej aplikacji.' : 'Brak danych.' });
    if (ov)
        body = ov;
    else if (tab === 'wersje')
        body = appVersionsTab(app);
    else if (tab === 'konfiguracja')
        body = configForm(app, false);
    else if (tab === 'zdrowie')
        body = appHealthTab(app);
    else if (tab === 'historia')
        body = opsTable(s.operations.filter(o => o.app === app.name), 'Brak operacji dla tej aplikacji.');
    else
        body = appOverviewTab(app);
    return h('div', { class: 'page' }, header, nav, body);
}
function appOverviewTab(app) {
    const s = store.state;
    const hr = app.health;
    const healthSummary = hr ? `${HEALTH_LABEL[hr.status]} · wersja ${hr.appVersion} · schemat ${hr.schemaCurrent}/${hr.schemaExpected} · baza ${hr.dbReachable ? `osiągalna (${hr.latencyMs} ms)` : 'nieosiągalna'} · zadania w tle ${hr.jobs.filter(j => j.alive).length}/${hr.jobs.length} · sprawdzono ${fmtRelative(hr.checkedAt)}` : 'nie sprawdzono';
    const rows = app.isPlatform ? [
        ['Stan usługi', serviceBadge(app.service)],
        ['Wersja agenta', `${s.site.agent.version}${s.site.agent.available ? ` (dostępna ${s.site.agent.available})` : ' (aktualna)'}`],
        ['Konto usługi', s.site.agent.account],
        ['Katalog instalacji', h('code', null, s.site.agent.installDir)],
        ['Dane i aplikacje', h('code', null, s.site.agent.dataDir)],
        ['Zużycie RAM', `${s.site.agent.ramMb} MB (limit 100 MB)`],
        ['nginx', `${SERVICE_LABEL[s.site.nginx.state]}, port ${s.site.nginx.port}, ${s.site.nginx.version}`],
    ] : [
        ['Stan usługi', h('span', { class: 'row' }, serviceBadge(app.service), app.installedAt && app.service === 'running' ? h('span', { class: 'muted' }, `· działa od ${fmtDateTime((hr === null || hr === void 0 ? void 0 : hr.startedAt) || app.installedAt)}`) : null)],
        ['Wersja', app.installed ? `${app.installed} (zainstalowano ${fmtDateTime(app.installedAt)})` : 'nie zainstalowana'],
        ['Adres dla operatorów', app.installed ? h('a', { href: operatorsAddress() + app.prefix.slice(1), target: '_blank' }, operatorsAddress() + app.prefix.slice(1)) : h('span', { class: 'muted' }, `${operatorsAddress()}${app.prefix.slice(1)} (po instalacji)`)],
        ['Adres wewnętrzny (tylko ten serwer)', app.port ? h('code', null, `127.0.0.1:${app.port}`) : h('span', { class: 'muted' }, 'przydzieli agent')],
        ['Zdrowie', healthSummary],
        ['Baza danych', `${app.config.values['database.host'] || '—'}:${app.config.values['database.port'] || '—'} · ${app.dbFile || ''}`],
        ['Konfiguracja', configComplete(app) ? badge('kompletna', 'ok') : badge(`brakuje ${missingRequired(app).length} pól`, 'warn')],
    ];
    const actions = app.isPlatform ? h('div', { class: 'btn-row' }, btn('Zobacz ustawienia agenta', { href: '#/ustawienia?sekcja=agent' }), btn('Co robi agent na tym serwerze?', { kind: 'ghost', href: '#/pomoc' }))
        : h('div', { class: 'btn-row' }, btn('Uruchom ponownie usługę', { disabled: !app.installed, onClick: () => confirmModal(`Uruchomić ponownie ${app.title}?`, h('div', null, h('p', null, `Przerwa ok. 30 s dla operatorów tej aplikacji. Aktywne sesje na bazie: ${app.sessions.length}.`), app.sessions.length ? h('ul', { class: 'help-list small muted' }, app.sessions.map(x => h('li', null, `${x.user} · ${x.host} · ${x.app}`))) : null), 'Uruchom ponownie', () => { const id = startServiceRestart(app.name); if (id)
                go(`#/operacje/${id}`); }) }), btn('Zatrzymaj usługę', { disabled: !app.installed || app.service !== 'running', onClick: () => confirmModal(`Zatrzymać ${app.title}?`, 'Aplikacja przestanie odpowiadać operatorom do czasu ręcznego uruchomienia. Agent nie uruchomi jej automatycznie, dopóki jej nie włączysz.', 'Zatrzymaj', () => { store.update(() => { app.service = 'stopped'; }); recordEvent('service-restart', app, `Zatrzymano usługę ${app.title} ręcznie.`); toast(`${app.title}: usługa zatrzymana.`, 'warn'); }, true) }), app.service === 'stopped' ? btn('Uruchom usługę', { kind: 'primary', onClick: () => { store.update(() => { app.service = 'running'; }); recordEvent('service-restart', app, `Uruchomiono usługę ${app.title} ręcznie.`); toast(`${app.title}: usługa działa.`, 'ok'); } }) : null, btn('Otwórz w przeglądarce', { disabled: !app.installed, href: operatorsAddress() + app.prefix.slice(1) }));
    const policyCard = card(h('h2', null, 'Automatyczna instalacja w oknie'), h('div', null, h('p', null, app.policy.enabled
        ? h('span', null, badge('włączona', 'info'), ` ${app.policy.days.map(d => DAY_NAMES[d]).join(', ')} ${app.policy.from}–${app.policy.to}${app.policy.skipOnSessions ? ', pomijanie przy aktywnych sesjach' : ''}. Nie dotyczy wersji z migracją bazy. Serwis widzi, że ta placówka włączyła automatyczne instalacje dla ${app.title}.`)
        : h('span', null, badge('wyłączona (domyślnie)'), ' Każda nowa wersja czeka na Twoją decyzję w panelu.')), h('div', { class: 'btn-row' }, btn(app.policy.enabled ? 'Zmień okno' : 'Włącz automatyczną instalację', { onClick: () => policyDialog(app) }), app.policy.enabled ? btn('Wyłącz', { kind: 'ghost', onClick: () => { setPolicy(app.name, { ...app.policy, enabled: false }); toast('Automatyczna instalacja wyłączona.', 'ok'); } }) : null)));
    let noteVal = app.note || '';
    const noteCard = card(h('h2', null, 'Notatka informatyka (lokalna)'), h('div', null, h('textarea', { rows: 3, style: 'width:100%;max-width:720px;padding:8px;border:1px solid var(--border);border-radius:6px;font:inherit', placeholder: 'np. „Po aktualizacji sprawdzić wydruk decyzji w pokoju 12”. Notatka zostaje na tym serwerze, nie trafia do serwisu.', onInput: (e) => { noteVal = e.target.value; } }, app.note || ''), h('div', { class: 'btn-row mt-8' }, btn('Zapisz notatkę', { small: true, onClick: () => { if (noteVal.length > 2000) {
            toast('Notatka może mieć do 2000 znaków.', 'warn');
            return;
        } store.update(() => { app.note = noteVal; }); toast('Zapisano notatkę.', 'ok'); } }))));
    return h('div', null, card(h('h2', null, 'Przegląd'), kv(rows), actions), app.isPlatform ? null : policyCard, app.isPlatform ? null : noteCard);
}
function appVersionsTab(app) {
    const offered = app.pending;
    const offeredCard = card(h('h2', null, 'Udostępnione przez serwis'), offered.length === 0 ? emptyState('Brak udostępnionych wersji. Zainstalowana jest najnowsza wersja w kanale stabilnym.', undefined, '✓') :
        h('ul', { class: 'timeline' }, offered.map(pv => h('li', null, h('div', { class: 'tl-main' }, h('div', { class: 'tl-title row' }, `${app.title} ${pv.version}`, pv.status === 'pending' ? badge('czeka na decyzję', 'accent') : pv.status === 'scheduled' ? badge(`zaplanowano ${fmtDayDateTime(pv.scheduledAt)}`, 'info') : badge('odrzucona', 'neutral')), h('div', { class: 'tl-sub' }, `${CHANNEL_LABEL[pv.channel]} · wydana ${fmtDate(pv.releaseDate)} · udostępniona ${fmtDateTime(pv.offeredAt)} · ${fmtMb(pv.sizeMb)}`), h('div', { class: 'mt-8' }, impactBadges(pv.impact, pv.isFirstInstall)), pv.rejected ? h('div', { class: 'tl-sub mt-8' }, `Odrzucona ${fmtDateTime(pv.rejected.at)} przez ${pv.rejected.by}: „${pv.rejected.reason}”. Powód przekazany serwisowi.`) : null, pv.annotation ? h('div', { class: 'mt-8' }, alertBox('danger', null, pv.annotation)) : null), h('div', { class: 'btn-row' }, pv.status === 'pending' ? btn('Zdecyduj', { kind: 'primary', small: true, href: `#/aplikacje/${app.name}/decyzja/${pv.version}` }) : null, pv.status === 'scheduled' ? btn('Zmień termin', { small: true, onClick: () => scheduleDialog(app, pv) }) : null, pv.status === 'scheduled' ? btn('Anuluj plan', { small: true, kind: 'ghost', onClick: () => { unscheduleVersion(app.name, pv.version); toast('Plan anulowany.', 'ok'); } }) : null, pv.status === 'rejected' ? btn('Rozważ ponownie', { small: true, onClick: () => { reconsiderVersion(app.name, pv.version); toast(`${pv.version} wróciła do oczekujących.`, 'ok'); } }) : null)))));
    const diskCard = card(h('h2', null, 'Wersje na dysku'), app.disk.length === 0 ? emptyState('Brak wersji na dysku. Aplikacja nie była jeszcze instalowana.') :
        h('div', null, table(['Wersja', 'Zainstalowano', 'Rozmiar', ''], app.disk.map(d => ({ cells: [
                h('span', { class: 'row' }, h('strong', null, d.version), d.version === app.installed ? badge('bieżąca', 'ok') : badge('poprzednia')),
                fmtDateTime(d.installedAt), fmtMb(d.sizeMb),
                d.version === app.installed ? h('span', { class: 'muted small' }, '—') : btn('Cofnij do tej wersji', { small: true, onClick: () => rollbackDialog(app, d.version) }),
            ] }))), h('p', { class: 'muted small mt-8' }, `Agent przechowuje ${store.state.site.agent.keepVersions} poprzednie wersje. Cofnięcie dotyczy tylko plików aplikacji; zmiany w bazie nie są cofane.`), app.isPlatform ? null : h('div', { class: 'btn-row mt-8' }, btn('Uruchom wersję testową obok produkcji', { disabled: true, title: 'Dostępne w przyszłej wersji: druga instancja pod innym prefiksem na kopii bazy.' }))));
    return h('div', null, offeredCard, diskCard);
}
function appHealthTab(app) {
    const hr = app.health;
    const refresh = () => { var _a; store.update(() => { if (app.health)
        app.health.checkedAt = nowIso(); }); toast('Sprawdzono zdrowie: ' + (app.health ? HEALTH_LABEL[app.health.status].toLowerCase() : 'brak odpowiedzi'), ((_a = app.health) === null || _a === void 0 ? void 0 : _a.status) === 'healthy' ? 'ok' : 'warn'); };
    const healthCard = card(h('h2', null, 'Wynik sprawdzenia zdrowia (GET /health)'), !hr ? emptyState(app.installed ? 'Aplikacja nie odpowiada na sprawdzenie zdrowia.' : 'Aplikacja nie jest zainstalowana.', app.installed ? btn('Uruchom ponownie usługę', { onClick: () => { const id = startServiceRestart(app.name); if (id)
            go(`#/operacje/${id}`); } }) : undefined) :
        h('div', null, kv([
            ['Stan', healthBadge(hr)],
            ['Wersja aplikacji', hr.appVersion],
            ['Schemat bazy', `${hr.schemaCurrent} (oczekiwany ${hr.schemaExpected})${hr.schemaCurrent !== hr.schemaExpected ? ' — niezgodny' : ''}`],
            ['Baza danych', `${hr.dbInstance}: ${hr.dbReachable ? `osiągalna, ${hr.latencyMs} ms` : 'nieosiągalna'}`],
            ['Zadania w tle', h('ul', { class: 'help-list', style: 'margin:0' }, hr.jobs.map(j => h('li', null, `${j.name}: ${j.alive ? 'żyje' : 'nie żyje'}, ostatnie uruchomienie ${fmtDateTime(j.lastRun)}`)))],
            ['Usługa działa od', fmtDateTime(hr.startedAt)],
            ['Sprawdzono', `${fmtDateTime(hr.checkedAt)} (${fmtRelative(hr.checkedAt)})`],
        ])), btn('Sprawdź teraz', { small: true, onClick: refresh }));
    const logs = fakeLogs(app.name, 15);
    const logCard = card(h('h2', null, `Logi aplikacji (ostatnie 15 minut)`), h('div', null, h('div', { class: 'log-toolbar' }, h('span', { class: 'muted small' }, `C:\\InfoSystem\\logs\\${app.name}\\ · logi nie zawierają haseł ani danych osobowych`), h('span', { style: 'flex:1' }), btn('Kopiuj', { small: true, onClick: () => copyText(logs.join('\n')) }), btn('Pobierz', { small: true, onClick: () => toast(`Pobrano ${app.name}-${fmtDate(nowIso())}.log (mockup)`, 'ok') }), btn('Pełna diagnostyka', { small: true, kind: 'ghost', href: `#/diagnostyka?sekcja=logi&log=${app.name}` })), logView(logs)));
    return h('div', null, healthCard, logCard);
}
// ---------- E4 Decyzja ----------
function viewDecision(name, version) {
    const app = findApp(name);
    if (!app)
        return appNotFound();
    const s = store.state;
    const pv = app.pending.find(p => p.version === version);
    const crumbs = h('span', null, h('a', { href: '#/aplikacje' }, 'Aplikacje'), ' / ', h('a', { href: `#/aplikacje/${app.name}` }, app.title), ' / decyzja');
    if (!pv || pv.status !== 'pending' || demo.override === 'empty') {
        const info = (pv === null || pv === void 0 ? void 0 : pv.status) === 'rejected' ? `Wersja ${version} została odrzucona ${fmtDateTime(pv.rejected.at)} przez ${pv.rejected.by}: „${pv.rejected.reason}”.`
            : (pv === null || pv === void 0 ? void 0 : pv.status) === 'scheduled' ? `Wersja ${version} jest zaplanowana na ${fmtDayDateTime(pv.scheduledAt)}.`
                : app.installed === version ? `Wersja ${version} jest już zainstalowana.` : `Wersja ${version} nie czeka już na decyzję (zainstalowana, odrzucona albo wycofana przez serwis).`;
        return h('div', { class: 'page narrow' }, pageHeader(`${app.title}: decyzja o wersji ${version}`, undefined, undefined, crumbs), card(null, emptyState(`Ta decyzja została już podjęta. ${info}`, h('div', { class: 'btn-row' }, btn('Wersje aplikacji', { href: `#/aplikacje/${app.name}?karta=wersje` }), btn('Historia', { kind: 'ghost', href: `#/aplikacje/${app.name}?karta=historia` })), '✓')));
    }
    const loading = demo.override === 'loading';
    const checks = computePreflight(app, pv);
    if (loading)
        checks.forEach(c => { c.status = 'running'; c.detail = 'sprawdzam…'; });
    if (demo.override === 'error') {
        const sess = checks.find(c => c.key === 'sessions');
        if (sess) {
            sess.status = 'unknown';
            sess.detail = 'Nie udało się sprawdzić sesji: brak uprawnień do MON$ATTACHMENTS dla użytkownika bazy z konfiguracji. Możesz kontynuować na własną odpowiedzialność.';
            sess.items = undefined;
        }
    }
    const blocking = checks.some(c => c.blocking && c.status === 'fail');
    const busy = isOperationRunning();
    const sessions = checks.find(c => c.key === 'sessions');
    const from = app.installed;
    const title = app.isPlatform ? `Site Agent: aktualizacja ${from} → ${pv.version}` : pv.isFirstInstall ? `${app.title}: instalacja ${pv.version}` : `${app.title}: aktualizacja ${from} → ${pv.version}`;
    const whatChanges = card(h('h2', null, 'Co się zmieni'), h('div', null, h('div', { class: 'row mb-8' }, badge(CHANNEL_LABEL[pv.channel], pv.channel === 'pilot' ? 'warn' : 'neutral'), h('span', { class: 'muted' }, `wydana ${fmtDate(pv.releaseDate)} · udostępniona przez serwis ${fmtDateTime(pv.offeredAt)} · ${fmtMb(pv.sizeMb)} · podpis zweryfikowany`)), pv.annotation ? alertBox('danger', 'Poprzednia próba została wycofana', pv.annotation + ' Jeśli przyczyna leży po stronie wersji, serwis przygotuje poprawkę; możesz odrzucić tę wersję z powodem.') : null, h('h3', { class: 'mb-8' }, 'Notatki wydania'), notesList(pv.notes), h('h3', { class: 'mt-16 mb-8' }, 'Wpływ na pracę urzędu'), h('ul', { class: 'help-list' }, app.isPlatform ? h('li', null, 'Panel lokalny będzie niedostępny ok. 30 s. Aplikacje działają bez przerwy.') : null, !app.isPlatform && pv.impact.requiresRestart ? h('li', null, h('strong', null, 'Wymaga restartu usługi:'), ` przerwa ok. 1 min dla operatorów ${app.title}. Pozostałe aplikacje działają.`) : null, !app.isPlatform && !pv.impact.requiresRestart && !pv.isFirstInstall ? h('li', null, 'Bez przerwy w pracy operatorów.') : null, pv.impact.schemaMigration ? h('li', null, h('strong', null, 'Migracja bazy:'), ' tę wersję poprzedza migracja schematu, którą serwis wykonuje ręcznie. Nie instaluj, dopóki serwis nie potwierdzi wykonania migracji.') : (!app.isPlatform ? h('li', null, 'Bez zmian w bazie danych.') : null), pv.impact.urgent ? h('li', null, h('strong', null, 'Pilne:'), ' serwis oznaczył wersję jako pilną (zmiana prawa). Decyzja nadal należy do Ciebie.') : null, pv.isFirstInstall ? h('li', null, `Po instalacji aplikacja będzie dostępna pod ${operatorsAddress()}${app.prefix.slice(1)}.`) : null)));
    const checksCard = card(h('h2', null, 'Sprawdzenia przed instalacją'), h('div', null, h('ul', { class: 'steps preflight' }, checks.map(c => h('li', null, stepIcon(c.status === 'ok' ? 'ok' : c.status === 'fail' ? 'failed' : c.status === 'warn' ? 'warn' : c.status === 'running' ? 'running' : 'pending'), h('div', null, h('div', { class: 'step-title' }, c.title), h('div', { class: 'step-detail' }, c.status === 'unknown' ? '? ' : '', c.detail), c.items ? h('ul', { class: 'pf-items' }, c.items.map(i => h('li', null, i))) : null, c.link ? h('div', { class: 'mt-8' }, btn(c.link.label, { small: true, href: c.link.href })) : null), h('div', { class: 'step-time' }, c.blocking ? 'blokujące' : '')))), h('div', { class: 'row mt-8' }, h('span', { class: 'muted small' }, `Sprawdzono ${fmtTime(nowIso())} (czas serwera)`), btn('Sprawdź ponownie', { small: true, kind: 'ghost', onClick: () => { toast('Sprawdzenia wykonane ponownie.', 'ok'); rerender(); } }))));
    const planSteps = app.isPlatform
        ? ['Weryfikacja pakietu agenta (podpis)', 'Zatrzymanie panelu i usługi agenta', `Podmiana katalogu agenta (${from} → ${pv.version})`, `Uruchomienie agenta ${pv.version}`, 'Sprawdzenie zdrowia agenta', 'Raport do InfoSystem']
        : ['Sprawdzenia wstępne (dysk, port, sesje, uprawnienia)', from ? `Zatrzymanie usługi (${from})` : 'Utworzenie usługi Windows', `Przełączenie na wersję ${pv.version} (katalog obok poprzedniej wersji)`, 'Uruchomienie usługi', pv.isFirstInstall ? `Dodanie prefiksu ${app.prefix} w nginx i przeładowanie bez przerwy dla pozostałych` : 'Aktualizacja nginx tylko jeśli zmienił się port lub prefiks', 'Sprawdzenie zdrowia (GET /health, limit 60 s)', 'Raport do InfoSystem'];
    const planCard = card(h('h2', null, 'Co zrobi agent'), h('div', null, h('ol', { class: 'help-list' }, planSteps.map(x => h('li', null, x))), h('p', { class: 'mt-8' }, h('strong', null, 'Jeśli sprawdzenie zdrowia nie powiedzie się,'), from ? ` agent sam przywróci wersję ${from} i poprzednią konfigurację nginx, a serwis dostanie raport z przyczyną.` : ' agent zatrzyma usługę, usunie wpis z nginx i zgłosi przyczynę serwisowi.'), h('p', { class: 'muted small' }, `Szacowany czas: ${app.isPlatform ? 'ok. 1 min' : 'ok. 2 min'}. ${app.isPlatform ? '' : 'Pozostałe aplikacje działają bez przerwy.'}`)));
    const doInstall = () => {
        const start = () => { const id = startInstall(app.name, pv.version); if (id)
            go(`#/operacje/${id}`);
        else if (busy)
            go('#/operacje'); };
        if (sessions && (sessions.status === 'warn' || sessions.status === 'unknown')) {
            openModal({ title: sessions.status === 'unknown' ? 'Nie udało się sprawdzić aktywnych sesji' : `Na bazie pracuje ${app.sessions.length} ${plural(app.sessions.length, 'użytkownik', 'użytkowników', 'użytkowników')}`,
                body: h('div', null, sessions.status === 'unknown' ? h('p', null, 'Agent nie mógł odczytać listy sesji. Instalacja może przerwać pracę operatorów, o których nie wiesz.') : h('ul', { class: 'help-list' }, (sessions.items || []).map(i => h('li', null, i))), h('p', { class: 'mt-8' }, `Restart usługi przerwie ich pracę na ok. 1 min. Zainstalować mimo to?`)),
                actions: [{ label: 'Anuluj', kind: 'secondary', onClick: c => c() }, { label: 'Zaplanuj na później', kind: 'secondary', onClick: c => { c(); scheduleDialog(app, pv); } }, { label: 'Instaluj', kind: 'primary', onClick: c => { c(); start(); } }] });
        }
        else
            start();
    };
    const actions = h('div', { class: 'sticky-actions' }, btn(busy ? 'Dodaj do kolejki' : 'Zainstaluj teraz', { kind: 'primary', disabled: blocking || loading, title: blocking ? 'Usuń przyczyny zaznaczone jako blokujące' : busy ? 'Trwa inna operacja; ta rozpocznie się po niej' : undefined, onClick: doInstall }), btn('Zaplanuj', { disabled: blocking || loading, onClick: () => scheduleDialog(app, pv) }), btn('Odrzuć', { disabled: loading, onClick: () => rejectDialog(app, pv) }), h('span', { class: 'spacer' }), blocking ? h('span', { class: 'muted small' }, 'Instalacja zablokowana przez sprawdzenia oznaczone jako blokujące.') : null, btn('Anuluj', { kind: 'ghost', href: `#/aplikacje/${app.name}` }));
    return h('div', { class: 'page narrow' }, pageHeader(title, undefined, undefined, crumbs), whatChanges, checksCard, planCard, h('div', { class: 'card' }, h('div', { class: 'card-body' }, h('p', { class: 'muted small' }, `Decyzja zostanie zapisana w dzienniku z kontem ${s.site.windowsAccount} i przekazana serwisowi.`), actions)));
}
// ---------- Okna dialogowe ----------
function scheduleDialog(app, pv) {
    let dateVal = (pv.scheduledAt || nextSaturdayIso()).slice(0, 10);
    const d0 = new Date(pv.scheduledAt || nextSaturdayIso());
    let timeVal = `${pad2(d0.getHours())}:${pad2(d0.getMinutes())}`;
    let defer = pv.deferOnSessions !== false;
    const errBox = h('div', { class: 'error', style: 'color:var(--danger);font-size:12.5px' });
    const dateInput = h('input', { type: 'date', value: dateVal, onInput: (e) => { dateVal = e.target.value; } });
    const timeInput = h('input', { type: 'time', value: timeVal, step: 900, onInput: (e) => { timeVal = e.target.value; } });
    const setShortcut = (iso) => { const d = new Date(iso); dateVal = iso.slice(0, 10); timeVal = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; dateInput.value = dateVal; timeInput.value = timeVal; };
    const toLocalIso = () => { const [y, m, d] = dateVal.split('-').map(Number); const [hh, mm] = timeVal.split(':').map(Number); return new Date(y, m - 1, d, hh, mm, 0).toISOString(); };
    openModal({
        title: `Zaplanuj instalację ${app.title} ${pv.version}`,
        body: h('div', null, h('p', { class: 'muted small' }, `Czas serwera: ${fmtDateTime(nowIso())} (${DAY_NAMES[nowDate().getDay()]}). Agent wykona instalację bez Twojej obecności i zapisze wynik w dzienniku.`), h('div', { class: 'row mb-8' }, btn('Jutro 06:00', { small: true, onClick: () => setShortcut(tomorrowIso(6)) }), btn('Sobota 06:00', { small: true, onClick: () => setShortcut(nextSaturdayIso(6)) }), btn('Dziś 18:00', { small: true, onClick: () => { const x = new Date(NOW); x.setHours(18, 0, 0, 0); setShortcut(x.toISOString()); } })), h('div', { class: 'grid cols-2' }, field('Data', dateInput, { required: true }), field('Godzina', timeInput, { required: true, help: 'krok 15 minut' })), checkbox('Jeśli o tej porze na bazie będą aktywne sesje, odłóż o 30 minut (maksymalnie 3 razy)', defer, v => { defer = v; }, 'Po trzecim odłożeniu wersja wraca do oczekujących na decyzję.'), checkbox('Przy niezdrowym stanie po instalacji przywróć poprzednią wersję', true, () => undefined, 'Zawsze włączone. Pokazane dla jasności.', true), errBox),
        actions: [{ label: 'Anuluj', kind: 'secondary', onClick: c => c() }, { label: 'Zaplanuj', kind: 'primary', onClick: c => {
                    if (!dateVal || !timeVal) {
                        errBox.textContent = 'Podaj datę i godzinę.';
                        return;
                    }
                    const iso = toLocalIso();
                    const diffDays = (new Date(iso).getTime() - nowDate().getTime()) / 86400000;
                    if (diffDays <= 0) {
                        errBox.textContent = 'Termin musi być w przyszłości.';
                        return;
                    }
                    if (diffDays > 30) {
                        errBox.textContent = 'Termin nie może być dalszy niż 30 dni.';
                        return;
                    }
                    c();
                    scheduleVersion(app.name, pv.version, iso, defer);
                    toast(`Zaplanowano ${app.title} ${pv.version} na ${fmtDayDateTime(iso)}.`, 'ok');
                    go('#/pulpit');
                } }],
    });
}
const REJECT_REASONS = [
    { value: 'later', label: 'Nie teraz, wrócę do tego później' },
    { value: 'service', label: 'Czekam na potwierdzenie z serwisu' },
    { value: 'problems', label: 'Wersja powoduje problemy w innej placówce' },
    { value: 'noneed', label: 'Nie potrzebujemy tej zmiany' },
    { value: 'other', label: 'Inny powód' },
];
function rejectDialog(app, pv) {
    let reason = 'later';
    let text = '';
    let remind = true;
    const errBox = h('div', { class: 'error', style: 'color:var(--danger);font-size:12.5px' });
    const remindBox = checkbox('Przypomnij mi za 7 dni', remind, v => { remind = v; });
    openModal({
        title: `Odrzuć ${app.title} ${pv.version}`,
        body: h('div', null, pv.impact.urgent ? alertBox('warn', 'Serwis oznaczył tę wersję jako pilną (zmiana prawa).', 'Odrzucenie jest możliwe i zostanie przekazane serwisowi razem z powodem.') : null, field('Powód', select(REJECT_REASONS, reason, v => { reason = v; remindBox.querySelector('input').checked = (v === 'later'); remind = v === 'later'; }), { required: true, help: 'Powód trafia do serwisu InfoSystem. Serwis nie wymusi instalacji.' }), field('Uwagi', h('textarea', { rows: 3, maxlength: 500, style: 'width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font:inherit', placeholder: 'Wymagane przy „Inny powód” (5–500 znaków)', onInput: (e) => { text = e.target.value; } })), remindBox, errBox),
        actions: [{ label: 'Anuluj', kind: 'secondary', onClick: c => c() }, { label: 'Odrzuć', kind: 'danger', onClick: c => {
                    if (reason === 'other' && text.trim().length < 5) {
                        errBox.textContent = 'Przy „Inny powód” wpisz uwagi (co najmniej 5 znaków).';
                        return;
                    }
                    c();
                    const label = REJECT_REASONS.find(r => r.value === reason).label + (text.trim() ? `: ${text.trim()}` : '');
                    rejectVersion(app.name, pv.version, label, remind);
                    toast(`Odrzucono ${pv.version}. Powód przekazany serwisowi.`, 'ok');
                    go(`#/aplikacje/${app.name}?karta=wersje`);
                } }],
    });
}
function rollbackDialog(app, toVersion) {
    let reason = '';
    const migrationWarning = app.pending.length === 0 && false;
    openModal({
        title: `Cofnąć ${app.title} z ${app.installed} do ${toVersion}?`,
        body: h('div', null, h('ul', { class: 'help-list' }, h('li', null, `Przerwa ok. 1 min dla operatorów ${app.title}. Aktywne sesje na bazie: ${app.sessions.length}.`), h('li', null, `Zmiany w bazie wykonane przez wersję ${app.installed} nie zostaną cofnięte. Jeśli ${app.installed} zmieniła schemat bazy, ${toVersion} może nie działać; wtedy skontaktuj się z serwisem.`), h('li', null, `Wersja ${app.installed} zostanie na dysku i wróci do „udostępnionych”, żebyś mógł zainstalować ją ponownie.`)), migrationWarning ? alertBox('warn', 'Bieżąca wersja zmieniła schemat bazy.', 'Zalecany kontakt z serwisem przed cofnięciem.') : null, field('Powód (opcjonalnie, trafia do serwisu)', h('input', { type: 'text', placeholder: 'np. operatorzy zgłaszają błąd wydruku decyzji', onInput: (e) => { reason = e.target.value; } }))),
        actions: [{ label: 'Anuluj', kind: 'secondary', onClick: c => c() }, { label: 'Cofnij', kind: 'danger', onClick: c => { c(); const id = startRollback(app.name, toVersion, reason.trim()); if (id)
                    go(`#/operacje/${id}`); } }],
    });
}
function policyDialog(app) {
    const p = { ...app.policy, days: [...app.policy.days], enabled: true };
    const errBox = h('div', { class: 'error', style: 'color:var(--danger);font-size:12.5px' });
    openModal({
        title: `Automatyczna instalacja: ${app.title}`,
        body: h('div', null, h('p', null, 'Agent zainstaluje udostępnione wersje w wybranym oknie bez pytania. Wersje z migracją bazy zawsze czekają na Twoją decyzję.'), field('Dni tygodnia', h('div', { class: 'row' }, [1, 2, 3, 4, 5, 6, 0].map(d => checkbox(DAY_SHORT[d], p.days.includes(d), v => { if (v) {
            if (!p.days.includes(d))
                p.days.push(d);
        }
        else
            p.days = p.days.filter(x => x !== d); }))), { required: true }), h('div', { class: 'grid cols-2' }, field('Od', h('input', { type: 'time', value: p.from, onInput: (e) => { p.from = e.target.value; } }), { required: true }), field('Do', h('input', { type: 'time', value: p.to, onInput: (e) => { p.to = e.target.value; } }), { required: true })), checkbox('Pomiń, gdy na bazie są aktywne sesje (spróbuj w następnym oknie)', p.skipOnSessions, v => { p.skipOnSessions = v; }), checkbox('Nie dotyczy wersji z migracją bazy', true, () => undefined, 'Zawsze włączone w tej wersji platformy.', true), alertBox('info', null, `Serwis zobaczy, że ta placówka włączyła automatyczne instalacje dla ${app.title}. Możesz to wyłączyć w każdej chwili.`), errBox),
        actions: [{ label: 'Anuluj', kind: 'secondary', onClick: c => c() }, { label: 'Włącz', kind: 'primary', onClick: c => {
                    if (p.days.length === 0) {
                        errBox.textContent = 'Wybierz co najmniej jeden dzień.';
                        return;
                    }
                    if (p.from >= p.to) {
                        errBox.textContent = 'Godzina „od” musi być wcześniejsza niż „do”.';
                        return;
                    }
                    const [h1, m1] = p.from.split(':').map(Number);
                    const [h2, m2] = p.to.split(':').map(Number);
                    if ((h2 * 60 + m2) - (h1 * 60 + m1) < 60) {
                        errBox.textContent = 'Okno musi trwać co najmniej godzinę.';
                        return;
                    }
                    c();
                    setPolicy(app.name, p);
                    toast('Włączono automatyczną instalację. Serwis został poinformowany.', 'ok');
                } }],
    });
}
// ---------- E5 Przebieg operacji ----------
let logOnlyProblems = false;
function viewOperation(id) {
    const op = store.state.operations.find(o => o.id === id);
    const crumbs = h('span', null, h('a', { href: '#/operacje' }, 'Operacje'), ' / ', id);
    if (!op || demo.override === 'empty')
        return h('div', { class: 'page narrow' }, pageHeader('Operacja', undefined, undefined, crumbs), card(null, emptyState('Nie ma takiej operacji.', btn('Wszystkie operacje', { href: '#/operacje' }))));
    if (demo.override === 'loading')
        return h('div', { class: 'page narrow' }, pageHeader(`${OP_TYPE_LABEL[op.type]}: ${op.appTitle}`, undefined, undefined, crumbs), card(null, h('div', null, skeleton(5), h('div', { class: 'log' }, 'łączenie ze strumieniem zdarzeń…'))));
    if (demo.override === 'error')
        return h('div', { class: 'page narrow' }, pageHeader(`${OP_TYPE_LABEL[op.type]}: ${op.appTitle}`, undefined, undefined, crumbs), card(null, h('div', null, alertBox('warn', 'Utracono połączenie z agentem; ponawiam co 3 s…', 'Jeśli to samoaktualizacja agenta, to zachowanie oczekiwane: agent uruchamia się ponownie.'), stepList(op.steps))));
    const app = findApp(op.app);
    const title = `${OP_TYPE_LABEL[op.type]}: ${op.appTitle}${op.toVersion ? ` ${op.fromVersion && op.fromVersion !== op.toVersion ? op.fromVersion + ' → ' : ''}${op.toVersion}` : ''}`;
    const duration = op.finishedAt ? fmtDuration(new Date(op.finishedAt).getTime() - new Date(op.startedAt).getTime()) : fmtDuration(nowDate().getTime() - new Date(op.startedAt).getTime());
    const meta = kv([['Uruchomił', op.actor], ['Start', `${fmtDateTime(op.startedAt)} (czas serwera)`], ['Czas trwania', duration], ['Stan', h('span', { class: 'row' }, resultBadge(op.result), op.result !== 'running' ? reportedBadge(op.reported) : null)]]);
    let bar = null;
    if (op.result === 'running')
        bar = h('div', { class: 'result-bar running' }, dot('info'), 'Operacja w toku…', h('span', { class: 'sub' }, 'Możesz zamknąć panel; agent dokończy pracę i zapisze wynik.'));
    else if (op.result === 'success')
        bar = h('div', { class: 'result-bar ok' }, '✓ Zakończono. ', h('span', { class: 'sub' }, op.summary));
    else if (op.result === 'rolled-back')
        bar = h('div', { class: 'result-bar danger' }, '✕ Wycofano. ', h('span', { class: 'sub' }, op.failReason));
    else if (op.result === 'failed')
        bar = h('div', { class: 'result-bar danger' }, '✕ Nieudana. ', h('span', { class: 'sub' }, op.failReason || op.summary));
    else
        bar = h('div', { class: 'result-bar ok' }, '✓ ', h('span', { class: 'sub' }, op.summary));
    const logLines = logOnlyProblems ? op.log.filter(l => l.includes('[WARN]') || l.includes('[ERROR]')) : op.log;
    const logEl = logView(logLines, 'op-log');
    setTimeout(() => { if (op.result === 'running')
        logEl.scrollTop = logEl.scrollHeight; }, 0);
    let next = null;
    if (op.result !== 'running') {
        const items = [];
        if (op.result === 'success' && (op.type === 'update' || op.type === 'install') && app && app.disk.length > 1)
            items.push(btn(`Cofnij do ${app.disk[1].version}`, { onClick: () => rollbackDialog(app, app.disk[1].version) }));
        if (op.result === 'rolled-back' && app) {
            items.push(btn('Zobacz logi aplikacji', { href: `#/aplikacje/${app.name}?karta=zdrowie` }));
            const pv = app.pending.find(p => p.version === op.toVersion);
            if (pv)
                items.push(btn('Spróbuj ponownie', { kind: 'ghost', href: `#/aplikacje/${app.name}/decyzja/${pv.version}` }));
        }
        if (op.result === 'failed' && op.type === 'service-restart' && app)
            items.push(btn('Uruchom ponownie usługę', { kind: 'primary', onClick: () => { const nid = startServiceRestart(app.name); if (nid)
                    go(`#/operacje/${nid}`); } }));
        items.push(btn('Wróć do pulpitu', { kind: op.result === 'success' ? 'primary' : 'secondary', href: '#/pulpit' }));
        next = card(h('h2', null, 'Co możesz zrobić'), h('div', null, op.result === 'rolled-back' ? h('p', null, `Aplikacja działa w poprzedniej wersji. Serwis otrzymał raport z logami. Kontakt: ${store.state.site.support.phone}, ${store.state.site.support.email}.`) : null, op.result === 'failed' && op.type === 'package-rejected' ? h('p', null, 'Pakiet został odrzucony przed pokazaniem Ci decyzji. Nic nie zostało zainstalowane; serwis przygotuje poprawnie podpisany pakiet.') : null, h('div', { class: 'btn-row' }, items)));
    }
    return h('div', { class: 'page narrow' }, pageHeader(title, undefined, undefined, crumbs), bar, card(null, meta), op.steps.length ? card(h('h2', null, 'Kroki'), stepList(op.steps)) : null, op.log.length ? card(h('h2', null, 'Log operacji'), h('div', null, h('div', { class: 'log-toolbar' }, checkbox('tylko ostrzeżenia i błędy', logOnlyProblems, v => { logOnlyProblems = v; rerender(); }), h('span', { style: 'flex:1' }), btn('Kopiuj log', { small: true, onClick: () => copyText(op.log.join('\n')) }), btn('Pobierz log', { small: true, onClick: () => toast(`Pobrano ${op.id}.log (mockup)`, 'ok') })), logEl)) : (op.details ? card(h('h2', null, 'Szczegóły'), h('ul', { class: 'help-list' }, op.details.map(d => h('li', null, h('code', null, d))))) : null), next);
}
function opsTable(ops, emptyText) {
    if (ops.length === 0)
        return card(null, emptyState(emptyText));
    return card(null, table(['Czas (serwera)', 'Zdarzenie', 'Aplikacja', 'Wersja', 'Kto', 'Wynik', 'Raport'], ops.map(o => ({
        cells: [h('span', null, fmtDateTime(o.startedAt), h('span', { class: 'sub' }, fmtRelative(o.startedAt))), h('span', null, OP_TYPE_LABEL[o.type], o.summary ? h('span', { class: 'sub' }, o.summary) : null), o.appTitle, o.toVersion ? `${o.fromVersion && o.fromVersion !== o.toVersion ? o.fromVersion + ' → ' : ''}${o.toVersion}` : h('span', { class: 'muted' }, '—'), o.actor, resultBadge(o.result), reportedBadge(o.reported)],
        onClick: () => go(`#/operacje/${o.id}`),
    }))));
}
