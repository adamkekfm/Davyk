"use strict";
// E8 Operacje i historia, E9 Diagnostyka, E10 Ustawienia, E11 Pomoc.
function viewOperations(query) {
    const s = store.state;
    const fApp = query.get('app') || '';
    const fType = query.get('typ') || '';
    const fResult = query.get('wynik') || '';
    const header = pageHeader('Operacje i historia', 'Każda instalacja, decyzja i zmiana konfiguracji z nazwą konta Windows. Czas serwera.', btn('Eksportuj CSV', { onClick: () => toast('Pobrano operacje.csv (mockup)', 'ok') }));
    const ov = stateOverride({ emptyText: 'Brak operacji. Pojawią się tu instalacje, aktualizacje, decyzje i zmiany konfiguracji.' });
    if (ov)
        return h('div', { class: 'page' }, header, ov);
    let ops = s.operations;
    if (fApp)
        ops = ops.filter(o => o.app === fApp);
    if (fType)
        ops = ops.filter(o => o.type === fType);
    if (fResult)
        ops = ops.filter(o => o.result === fResult);
    const mk = (k, v) => { const q = new URLSearchParams(query.toString()); if (v)
        q.set(k, v);
    else
        q.delete(k); const str = q.toString(); return '#/operacje' + (str ? '?' + str : ''); };
    const filters = h('div', { class: 'filters' }, h('span', { class: 'small muted' }, 'Aplikacja'), select([{ value: '', label: 'wszystkie' }, ...s.apps.map(a => ({ value: a.name, label: a.title })), { value: 'nginx', label: 'nginx' }, { value: 'site', label: 'Placówka' }], fApp, v => go(mk('app', v))), h('span', { class: 'small muted' }, 'Typ'), select([{ value: '', label: 'wszystkie' }, ...Object.keys(OP_TYPE_LABEL).map(t => ({ value: t, label: OP_TYPE_LABEL[t] }))], fType, v => go(mk('typ', v))), h('span', { class: 'small muted' }, 'Wynik'), select([{ value: '', label: 'wszystkie' }, ...Object.keys(OP_RESULT_LABEL).map(r => ({ value: r, label: OP_RESULT_LABEL[r] }))], fResult, v => go(mk('wynik', v))), (fApp || fType || fResult) ? btn('Wyczyść filtry', { small: true, kind: 'ghost', href: '#/operacje' }) : null, h('span', { style: 'flex:1' }), h('span', { class: 'small muted' }, `${ops.length} ${plural(ops.length, 'pozycja', 'pozycje', 'pozycji')}`));
    return h('div', { class: 'page' }, header, filters, opsTable(ops, (fApp || fType || fResult) ? 'Brak wyników dla filtra.' : 'Brak operacji.'));
}
// ---------- E9 Diagnostyka ----------
let connTest = null;
function runConnTest() {
    const s = store.state;
    connTest = [
        { key: 'dns', title: `DNS: ${s.site.infoSystem.host}`, status: 'pending' },
        { key: 'tcp', title: `Połączenie TCP na port ${s.site.infoSystem.port}`, status: 'pending' },
        { key: 'tls', title: 'TLS i certyfikat przypięty InfoSystem', status: 'pending' },
        { key: 'auth', title: 'Uwierzytelnienie agenta (sekret placówki)', status: 'pending' },
    ];
    let i = 0;
    const next = () => {
        if (!connTest || i >= connTest.length)
            return;
        const st = connTest[i++];
        st.status = 'running';
        rerender();
        setTimeout(() => {
            if (!s.site.infoSystem.connected && st.key === 'dns') {
                st.status = 'failed';
                st.detail = `nazwa ${s.site.infoSystem.host} nie rozwiązuje się przez DNS urzędu (10.0.0.1). Poproś IT o wpis lub sprawdź serwer DNS.`;
                rerender();
                return;
            }
            st.status = 'ok';
            st.detail = st.key === 'dns' ? 'rozwiązano przez DNS urzędu' : st.key === 'tcp' ? 'połączono, 38 ms' : st.key === 'tls' ? 'TLS 1.3, odcisk certyfikatu zgodny z przypiętym' : 'HTTP 200, placówka rozpoznana';
            st.durationMs = 120 + i * 90;
            rerender();
            next();
        }, 500 + Math.random() * 400);
    };
    next();
}
function viewDiagnostics(query) {
    const s = store.state;
    const section = query.get('sekcja') || 'polaczenie';
    const header = pageHeader('Diagnostyka', 'Odpowiedź na „czemu nie działa” bez konsoli serwera. Dane techniczne; bez haseł i danych osobowych.');
    const nav = h('div', { class: 'section-nav' }, [
        { key: 'polaczenie', label: 'Połączenie z InfoSystem' }, { key: 'zdrowie', label: 'Zdrowie aplikacji' }, { key: 'sesje', label: 'Sesje na bazach' }, { key: 'logi', label: 'Logi' }, { key: 'zasoby', label: 'Zasoby, adres, certyfikat' },
    ].map(x => h('a', { href: `#/diagnostyka?sekcja=${x.key}`, class: section === x.key ? 'active' : '' }, x.label)));
    const ov = stateOverride({ emptyText: section === 'sesje' ? 'Brak aktywnych sesji na bazach.' : section === 'logi' ? 'Brak wpisów w ostatnich 15 minutach.' : 'Brak danych.', emptyAction: section === 'logi' ? btn('Pokaż 60 minut', { onClick: () => { demo.override = 'none'; go('#/diagnostyka?sekcja=logi&zakres=60'); } }) : undefined });
    let body;
    if (ov)
        body = ov;
    else if (section === 'zdrowie')
        body = diagHealth();
    else if (section === 'sesje')
        body = diagSessions();
    else if (section === 'logi')
        body = diagLogs(query);
    else if (section === 'zasoby')
        body = diagResources();
    else
        body = diagConnectivity();
    return h('div', { class: 'page' }, header, h('div', { class: 'two-col' }, nav, body));
}
function diagConnectivity() {
    const s = store.state.site;
    const is = s.infoSystem;
    return h('div', null, card(h('h2', null, 'Połączenie z InfoSystem'), h('div', null, kv([
        ['Adres', `${is.host}:${is.port} (tylko ruch wychodzący HTTPS)`],
        ['Stan', h('span', { class: 'row' }, dot(is.connected ? 'ok' : 'warn'), is.connected ? 'połączono' : `brak połączenia od ${fmtDateTime(is.lastContact)}`)],
        ['Ostatni kontakt', `${fmtDateTime(is.lastContact)} (${fmtRelative(is.lastContact)})`],
        ['Ostatni wysłany raport', fmtDateTime(is.lastReport)],
        ['Raporty w buforze', is.buffered ? h('span', null, badge(`${is.buffered}`, 'warn'), ' zostaną wysłane po przywróceniu łączności') : h('span', null, badge('0', 'ok'), ' wszystkie raporty wysłane')],
        ['Sprawdzanie nowych wersji', `co ${s.agent.pollMinutes} min`],
    ]), h('div', { class: 'mt-16' }, btn('Testuj teraz', { kind: 'primary', onClick: runConnTest }), connTest ? h('div', { class: 'mt-16' }, stepList(connTest), connTest.every(x => x.status === 'ok') ? alertBox('ok', 'Połączenie działa', `Pełna ścieżka sprawdzona w ${fmtDuration(connTest.reduce((a, x) => a + (x.durationMs || 0), 0))}.`) : null) : null))), card(h('h2', null, 'Hosty do allow‑listy dla IT urzędu'), h('div', null, h('p', { class: 'small muted' }, 'Agent łączy się wyłącznie z poniższymi hostami, wyłącznie ruchem wychodzącym. Żaden port przychodzący nie jest otwierany.'), ALLOW_LIST.map(x => h('div', { class: 'copy-box mb-8' }, h('span', null, x), btn('Kopiuj', { small: true, onClick: () => copyText(x) }))))));
}
function diagHealth() {
    const apps = appsOnly();
    return card(h('h2', null, 'Zdrowie aplikacji (GET /health)'), table(['Aplikacja', 'Usługa', 'Zdrowie', 'Wersja', 'Schemat', 'Baza', 'Zadania w tle', 'Start usługi', ''], apps.map(a => {
        const hr = a.health;
        return { cells: [
                h('a', { href: `#/aplikacje/${a.name}?karta=zdrowie` }, a.title), serviceBadge(a.service), healthBadge(hr),
                hr ? hr.appVersion : h('span', { class: 'muted' }, '—'), hr ? `${hr.schemaCurrent}/${hr.schemaExpected}` : '—',
                hr ? (hr.dbReachable ? `osiągalna, ${hr.latencyMs} ms` : 'nieosiągalna') : '—',
                hr ? h('span', null, `${hr.jobs.filter(j => j.alive).length}/${hr.jobs.length} żyją`, h('span', { class: 'sub' }, hr.jobs.map(j => `${j.name} ${fmtTime(j.lastRun)}`).join(', '))) : '—',
                hr ? fmtDateTime(hr.startedAt) : '—',
                h('div', { class: 'btn-row' }, a.installed ? btn('Sprawdź teraz', { small: true, onClick: () => { store.update(() => { if (a.health)
                        a.health.checkedAt = nowIso(); }); toast(`${a.title}: ${a.health ? HEALTH_LABEL[a.health.status].toLowerCase() : 'brak odpowiedzi'}`, 'ok'); } }) : null, a.service === 'stopped' || a.service === 'failed' ? btn('Uruchom usługę', { small: true, kind: 'primary', onClick: () => { store.update(() => { a.service = 'running'; }); recordEvent('service-restart', a, `Uruchomiono usługę ${a.title} z diagnostyki.`); toast(`${a.title}: usługa działa.`, 'ok'); } }) : null),
            ] };
    })));
}
function diagSessions() {
    const groups = new Map();
    appsOnly().forEach(a => { const k = `${a.dbInstance} · ${a.dbFile}`; if (!groups.has(k))
        groups.set(k, []); groups.get(k).push(a); });
    return h('div', null, h('p', { class: 'small muted' }, 'Tylko odczyt MON$ATTACHMENTS. Agent nie zamyka sesji i nie zmienia nic w Firebirdzie. Firebird 3.0.11 na porcie 3050; druga instancja (2.5, port 3051) należy do aplikacji firmy zewnętrznej i nie jest używana.'), [...groups.entries()].map(([k, apps]) => {
        const sessions = apps[0].sessions;
        return card(h('h2', null, k), sessions.length === 0 ? emptyState(`Brak aktywnych sesji na ${apps[0].dbFile.split('\\').pop()}.`, undefined, '✓') :
            table(['Użytkownik', 'Komputer', 'Aplikacja', 'Od kiedy'], sessions.map(x => ({ cells: [x.user, x.host, x.app, `${fmtTime(x.since)} (${fmtRelative(x.since)})`] }))), h('span', { class: 'small muted' }, `używana przez: ${apps.map(a => a.title).join(', ')}`));
    }), btn('Odśwież', { onClick: () => { toast('Odświeżono listę sesji.', 'ok'); rerender(); } }));
}
let logFilter = '';
function diagLogs(query) {
    const source = query.get('log') || 'agent';
    const range = Number(query.get('zakres') || 15);
    const sources = [{ key: 'agent', label: 'Agent' }, { key: 'nginx', label: 'nginx' }, ...appsOnly().map(a => ({ key: a.name, label: a.title }))];
    let lines = fakeLogs(source, range);
    if (logFilter)
        lines = lines.filter(l => l.toLowerCase().includes(logFilter.toLowerCase()));
    return card(h('h2', null, 'Logi'), h('div', null, tabs(sources.map(x => ({ ...x, href: `#/diagnostyka?sekcja=logi&log=${x.key}&zakres=${range}` })), source), h('div', { class: 'log-toolbar' }, h('span', { class: 'small muted' }, 'Zakres'), segment([5, 15, 60].map(m => ({ key: String(m), label: `${m} min`, href: `#/diagnostyka?sekcja=logi&log=${source}&zakres=${m}` })), String(range)), h('input', { type: 'text', placeholder: 'szukaj w logu…', value: logFilter, maxlength: 200, style: 'padding:5px 8px;border:1px solid var(--border);border-radius:6px;font:inherit', onInput: (e) => { logFilter = e.target.value; rerender(); } }), h('span', { style: 'flex:1' }), btn('Kopiuj', { small: true, onClick: () => copyText(lines.join('\n')) }), btn('Pobierz', { small: true, onClick: () => toast(`Pobrano ${source}-${fmtDate(nowIso())}.log (mockup)`, 'ok') }), btn('Pobierz paczkę diagnostyczną', { small: true, kind: 'ghost', title: 'zip: logi, stan, konfiguracja bez sekretów; do wysłania serwisowi', onClick: () => toast('Pobrano diagnostyka-SRV-URZAD.zip (mockup, bez sekretów)', 'ok') })), lines.length === 0 ? emptyState(`Brak wpisów ${logFilter ? 'pasujących do filtra' : `w ostatnich ${range} minutach`}.`, range < 60 ? btn('Pokaż 60 minut', { href: `#/diagnostyka?sekcja=logi&log=${source}&zakres=60` }) : undefined) : logView(lines), h('p', { class: 'small muted mt-8' }, `Źródło: ${source === 'agent' ? 'C:\\InfoSystem\\logs\\agent\\' : source === 'nginx' ? 'C:\\InfoSystem\\nginx\\logs\\' : `C:\\InfoSystem\\logs\\${source}\\`} · logi nie zawierają haseł ani danych osobowych.`)));
}
function diagResources() {
    const s = store.state;
    const apps = appsOnly().filter(a => a.installed);
    return h('div', null, card(h('h2', null, 'Zasoby'), h('div', null, kv([['Dysk C:', `${fmtGb(s.site.disk.freeGb)} wolne z ${fmtGb(s.site.disk.totalGb)}; platforma zajmuje ${fmtGb(s.site.disk.usedByPlatformGb)} (C:\\InfoSystem)`], ['RAM agenta z panelem', `${s.site.agent.ramMb} MB (cel: poniżej 100 MB)`], ['RAM nginx', '31 MB']]), h('div', { class: 'mt-16' }, table(['Proces', 'RAM', 'Port', 'Nasłuch'], [
        { cells: ['nginx', '31 MB', String(s.site.nginx.port), 'wszystkie interfejsy (wejście dla operatorów)'] },
        { cells: ['Site Agent (panel)', `${s.site.agent.ramMb} MB`, '7700', '127.0.0.1 (tylko ten serwer)'] },
        ...apps.map(a => ({ cells: [a.title, `${120 + (a.name.length * 13) % 70} MB`, String(a.port), '127.0.0.1 (za nginx)'] })),
    ])))), card(h('h2', null, 'Adres dla operatorów'), h('div', null, h('div', { class: 'copy-box mb-8' }, h('span', null, operatorsAddress()), btn('Kopiuj', { small: true, onClick: () => copyText(operatorsAddress()) }), btn('Otwórz', { small: true, href: operatorsAddress() })), h('p', { class: 'small muted' }, `Aplikacje: ${appsOnly().map(a => `${a.title} → ${operatorsAddress()}${a.prefix.slice(1)}`).join(' · ')}`))), card(h('h2', null, 'Certyfikat TLS'), kv([['Podmiot', s.site.cert.subject], ['Wystawca', s.site.cert.issuer], ['Ważny do', fmtDate(s.site.cert.validTo)], ['Odcisk', h('code', null, s.site.cert.thumbprint)], ['Zaufany na tym serwerze', s.site.cert.trusted ? badge('tak', 'ok') : badge('nie', 'warn')], ['Źródło', s.site.cert.selfIssued ? 'wygenerowany przez agenta (CA placówki); certyfikat CA można pobrać w Ustawieniach i rozdać na PC operatorów' : 'importowany przez IT urzędu']])));
}
// ---------- E10 Ustawienia ----------
function viewSettings(query) {
    const s = store.state;
    const section = query.get('sekcja') || 'port';
    const header = pageHeader('Ustawienia placówki', 'Nieliczne parametry, które możesz zmienić bez serwisu. Resztę agent ustala sam.');
    const nav = h('div', { class: 'section-nav' }, [
        { key: 'port', label: 'Port i adres' }, { key: 'cert', label: 'Certyfikat TLS' }, { key: 'polityki', label: 'Automatyczna instalacja' }, { key: 'agent', label: 'Agent' }, { key: 'zaawansowane', label: 'Zaawansowane' },
    ].map(x => h('a', { href: `#/ustawienia?sekcja=${x.key}`, class: section === x.key ? 'active' : '' }, x.label)));
    const ov = stateOverride({ emptyText: 'Brak ustawień w tej sekcji.' });
    let body;
    if (ov)
        body = ov;
    else if (section === 'cert')
        body = settingsCert();
    else if (section === 'polityki')
        body = settingsPolicies();
    else if (section === 'agent')
        body = settingsAgent();
    else if (section === 'zaawansowane')
        body = settingsAdvanced();
    else
        body = settingsPort();
    return h('div', { class: 'page' }, header, h('div', { class: 'two-col' }, nav, body));
}
function settingsPort() {
    const s = store.state;
    let port = String(s.site.nginx.port);
    let fqdn = s.site.fqdn;
    const errBox = h('div', { class: 'error', style: 'color:var(--danger);font-size:12.5px' });
    return card(h('h2', null, 'Port i adres'), h('div', null, kv([['Bieżący port nginx', String(s.site.nginx.port)], ['Port 443', s.site.nginx.port443Free ? badge('wolny', 'ok') : badge('zajęty przez IIS (stare API)', 'warn')], ['Adres dla operatorów', h('code', null, operatorsAddress())]]), h('div', { class: 'mt-16' }, field('Nazwa serwera w adresie (FQDN)', h('input', { type: 'text', value: fqdn, onInput: (e) => { fqdn = e.target.value; } }), { help: 'Wykryta z systemu. Zmień tylko, jeśli operatorzy używają innej nazwy. Nie wpisuj adresu IP.' }), field('Port nginx', h('input', { type: 'text', value: port, style: 'max-width:140px', onInput: (e) => { port = e.target.value; } }), { help: 'Zmiana portu zmienia adres dla operatorów. Agent sprawdzi, czy port jest wolny.' }), errBox, h('div', { class: 'btn-row' }, btn('Zapisz i przeładuj nginx', { kind: 'primary', onClick: () => {
            const n = Number(port);
            if (!/^\d+$/.test(port) || n < 1 || n > 65535) {
                errBox.textContent = 'Port musi być liczbą od 1 do 65535.';
                return;
            }
            if ([5101, 5102, 5103, 5104, 7700].includes(n)) {
                errBox.textContent = `Port ${n} jest używany wewnętrznie przez platformę.`;
                return;
            }
            if (n === 443 && !s.site.nginx.port443Free) {
                errBox.textContent = 'Port 443 jest zajęty przez IIS (PID 2140). Wyłącz witryny w IIS albo zostaw 8443.';
                return;
            }
            if (IPV4_RE.test(fqdn)) {
                errBox.textContent = 'Nazwa serwera nie może być adresem IP.';
                return;
            }
            confirmModal('Zmienić port nginx?', h('div', null, h('p', null, `Adres dla operatorów zmieni się na https://${fqdn}${n === 443 ? '' : ':' + n}/. Przeładowanie nginx trwa kilka sekund; aplikacje działają.`), h('p', { class: 'muted small' }, 'Poinformuj operatorów o nowym adresie.')), 'Zmień port', () => { store.update(st => { st.site.fqdn = fqdn; }); const id = startPortChange(n); if (id)
                go(`#/operacje/${id}`); });
        } }), !s.site.nginx.port443Free ? btn('Symuluj: IIS wyłączony, 443 wolny (demo)', { kind: 'ghost', onClick: () => { store.update(st => { st.site.nginx.port443Free = true; }); toast('Port 443 jest teraz wolny. Agent proponuje przełączenie.', 'info'); } }) : null)), s.site.nginx.port443Free && s.site.nginx.port !== 443 ? alertBox('info', 'Port 443 jest wolny.', `Przełączyć nginx na 443? Adres dla operatorów zmieni się z ${operatorsAddress()} na https://${s.site.fqdn}/. Możesz też zostawić obecny port.`, undefined, h('div', { class: 'btn-row' }, btn('Przełącz na 443', { kind: 'primary', small: true, onClick: () => { const id = startPortChange(443); if (id)
            go(`#/operacje/${id}`); } }), btn(`Zostaw ${s.site.nginx.port}`, { small: true, onClick: () => { store.update(st => { st.site.nginx.port443Free = false; }); toast('Zostawiono obecny port.', 'ok'); } }))) : null));
}
function settingsCert() {
    const s = store.state;
    return card(h('h2', null, 'Certyfikat TLS'), h('div', null, kv([['Podmiot', s.site.cert.subject], ['Wystawca', s.site.cert.issuer], ['Ważny do', fmtDate(s.site.cert.validTo)], ['Odcisk', h('code', null, s.site.cert.thumbprint)], ['Zaufany na tym serwerze', s.site.cert.trusted ? badge('tak', 'ok') : badge('nie', 'warn')]]), h('p', { class: 'mt-16 small muted' }, 'Certyfikat wygenerował agent (CA placówki). Żeby przeglądarki na PC operatorów nie ostrzegały, zainstaluj na nich certyfikat CA placówki (jednorazowo) albo zaimportuj własny certyfikat wystawiony przez CA urzędu.'), h('div', { class: 'btn-row' }, btn('Pobierz certyfikat CA placówki (.crt)', { onClick: () => toast('Pobrano InfoSystem-Site-CA.crt (mockup)', 'ok') }), btn('Importuj własny certyfikat (PFX)', { onClick: () => {
            let pwd = '';
            let file = '';
            openModal({ title: 'Import certyfikatu PFX', body: h('div', null, field('Plik PFX', h('label', { class: 'btn small' }, 'Wskaż plik…', h('input', { type: 'file', accept: '.pfx,.p12', style: 'display:none', onChange: (e) => { var _a, _b; file = ((_b = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.name) || ''; } })), { help: 'Maks. 100 KB, musi zawierać klucz prywatny. Podmiot powinien odpowiadać nazwie serwera (ostrzeżenie, nie blokada).' }), field('Hasło do PFX', h('input', { type: 'password', onInput: (e) => { pwd = e.target.value; } }), { help: 'Trafia do magazynu sekretów, nie jest wyświetlane.' })), actions: [{ label: 'Anuluj', kind: 'secondary', onClick: c => c() }, { label: 'Importuj i przeładuj nginx', kind: 'primary', onClick: c => { if (!file) {
                            toast('Wskaż plik PFX.', 'warn');
                            return;
                        } if (!pwd) {
                            toast('Podaj hasło do PFX.', 'warn');
                            return;
                        } c(); store.update(st => { st.site.cert = { ...st.site.cert, subject: 'CN=srv-urzad.urzad.local', issuer: 'CN=CA Urzędu Gminy Przykładowo', selfIssued: false, trusted: true }; }); recordEvent('settings', null, `Zaimportowano certyfikat TLS (${file}). nginx przeładowany.`); toast('Certyfikat zaimportowany, nginx przeładowany.', 'ok'); } }] });
        } }), btn('Wygeneruj ponownie', { kind: 'ghost', onClick: () => confirmModal('Wygenerować nowy certyfikat?', 'Nowy certyfikat CA placówki unieważni zaufanie zainstalowane na PC operatorów. Będzie trzeba rozdać go ponownie.', 'Wygeneruj', () => { recordEvent('settings', null, 'Wygenerowano ponownie certyfikat TLS placówki.'); toast('Wygenerowano nowy certyfikat (mockup).', 'ok'); }, true) }))));
}
function settingsPolicies() {
    const apps = store.state.apps;
    return card(h('h2', null, 'Automatyczna instalacja w oknie'), h('div', null, h('p', { class: 'small muted' }, 'Domyślnie wyłączona. Włączasz ją osobno dla każdej aplikacji i dla agenta. Wersje z migracją bazy zawsze czekają na decyzję. Włączenie jest widoczne dla serwisu.'), table(['Aplikacja', 'Polityka', 'Okno', 'Przy aktywnych sesjach', ''], apps.map(a => ({ cells: [
            a.title + (a.isPlatform ? ' (składnik platformy)' : ''),
            a.policy.enabled ? badge('automatycznie w oknie', 'info') : badge('tylko ręcznie'),
            a.policy.enabled ? `${a.policy.days.map(d => DAY_SHORT[d]).join(', ')} ${a.policy.from}–${a.policy.to}` : h('span', { class: 'muted' }, '—'),
            a.policy.enabled ? (a.policy.skipOnSessions ? 'pomiń, spróbuj w następnym oknie' : 'instaluj mimo sesji') : h('span', { class: 'muted' }, '—'),
            h('div', { class: 'btn-row' }, btn(a.policy.enabled ? 'Zmień' : 'Włącz', { small: true, onClick: () => policyDialog(a) }), a.policy.enabled ? btn('Wyłącz', { small: true, kind: 'ghost', onClick: () => { setPolicy(a.name, { ...a.policy, enabled: false }); toast(`Wyłączono automatyczną instalację dla ${a.title}.`, 'ok'); } }) : null),
        ] })))));
}
function settingsAgent() {
    const s = store.state;
    const a = s.site.agent;
    const upd = (patch, label) => { store.update(st => { Object.assign(st.site.agent, patch); }); recordEvent('settings', null, label); toast('Zapisano ustawienie.', 'ok'); };
    return h('div', null, card(h('h2', null, 'Site Agent'), h('div', null, kv([['Wersja', h('span', { class: 'row' }, a.version, a.available ? btn(`Dostępna ${a.available}: zdecyduj`, { small: true, kind: 'primary', href: `#/aplikacje/agent/decyzja/${a.available}` }) : badge('aktualna', 'ok'))], ['Konto usługi', a.account], ['Katalog programu', h('code', null, a.installDir)], ['Dane, aplikacje, logi', h('code', null, a.dataDir)], ['Usługi Windows', 'InfoSystem.SiteAgent, InfoSystem.Nginx, InfoSystem.Skarbowy, InfoSystem.CRU, InfoSystem.KSeF, InfoSystem.eAuta']]), h('div', { class: 'mt-16 grid cols-3' }, field('Sprawdzanie nowych wersji', select([{ value: '15', label: 'co 15 minut' }, { value: '30', label: 'co 30 minut' }, { value: '60', label: 'co 60 minut' }], String(a.pollMinutes), v => upd({ pollMinutes: Number(v) }, `Zmieniono częstotliwość sprawdzania nowych wersji na ${v} min.`))), field('Limit pasma pobierania', select([{ value: 'bez limitu', label: 'bez limitu' }, { value: '1 Mbit/s', label: '1 Mbit/s' }, { value: '5 Mbit/s', label: '5 Mbit/s' }, { value: '20 Mbit/s', label: '20 Mbit/s' }], a.bandwidth, v => upd({ bandwidth: v }, `Zmieniono limit pasma pobierania na ${v}.`)), { help: 'Żeby pobieranie nie spowalniało pracy operatorów.' }), field('Przechowywane poprzednie wersje', select([{ value: '1', label: '1' }, { value: '2', label: '2 (domyślnie)' }, { value: '3', label: '3' }], String(a.keepVersions), v => upd({ keepVersions: Number(v) }, `Zmieniono liczbę przechowywanych wersji na ${v}.`)), { help: 'Więcej wersji = więcej miejsca na dysku, dłuższa możliwość cofnięcia.' })))), card(h('h2', null, 'Kontakt z serwisem InfoSystem'), h('div', null, kv([['Telefon', s.site.support.phone], ['E‑mail', s.site.support.email], ['Identyfikator placówki', s.site.siteId]]), h('p', { class: 'small muted mt-8' }, 'Przy zgłoszeniu podaj identyfikator placówki; serwis widzi raporty agenta z tej placówki.'))), card(h('h2', null, 'Zatrzymanie i odinstalowanie'), h('div', null, h('p', null, 'Możesz zatrzymać agenta w każdej chwili. Aplikacje i nginx działają dalej, ale nie dostaną aktualizacji i serwis nie zobaczy stanu placówki.'), h('div', { class: 'btn-row' }, btn('Zatrzymaj agenta', { kind: 'danger', onClick: () => confirmModal('Zatrzymać usługę agenta?', 'Panel przestanie odpowiadać. Aplikacje działają dalej. Agent uruchomisz ponownie w services.msc (InfoSystem.SiteAgent).', 'Zatrzymaj', () => toast('Agent zatrzymany (mockup). Panel przestałby odpowiadać.', 'warn'), true) }), btn('Jak odinstalować bez utraty aplikacji', { kind: 'ghost', href: '#/pomoc' })))));
}
function settingsAdvanced() {
    const s = store.state;
    return h('div', null, card(h('h2', null, 'Zapora Windows'), h('div', null, checkbox('Agent zarządza regułami zapory dla własnych portów', s.site.firewallManaged, v => { store.update(st => { st.site.firewallManaged = v; }); recordEvent('settings', null, v ? 'Włączono zarządzanie regułami zapory przez agenta.' : 'Wyłączono zarządzanie regułami zapory przez agenta.'); toast('Zapisano.', 'ok'); }, 'Wyłącz, jeśli IT urzędu zarządza zaporą samodzielnie. Agent nie zmienia innych reguł ani ustawień Windows Update.'), table(['Reguła', 'Kierunek', 'Port', 'Zakres'], [
        { cells: ['InfoSystem nginx (wejście dla operatorów)', 'przychodzący', String(s.site.nginx.port), 'sieć lokalna'] },
        { cells: ['InfoSystem Site Agent (InfoSystem)', 'wychodzący', `${s.site.infoSystem.port} → ${s.site.infoSystem.host}`, 'tylko ten host'] },
    ]))), card(h('h2', null, 'Inne'), h('div', { class: 'btn-row' }, btn('Pokaż kreator startowy (stan platformy)', { href: '#/start' }), btn('Maszyny w tej placówce', { disabled: true, title: 'Dostępne w przyszłej wersji: kilka serwerów z agentem w jednej placówce.' }))));
}
// ---------- E11 Pomoc ----------
function viewHelp() {
    const s = store.state;
    const dyn = (v) => demo.override === 'error' || demo.override === 'empty' ? h('span', { class: 'muted', title: 'nie udało się pobrać' }, '— (nie udało się pobrać)') : demo.override === 'loading' ? h('span', { class: 'skeleton', style: 'display:inline-block;width:160px;margin:0' }) : v;
    return h('div', { class: 'page narrow' }, pageHeader('Co robi agent na tym serwerze', 'Dokument dla IT urzędu. Treść statyczna jest dostępna zawsze; dane tej placówki pobierane są z agenta.', btn('Pobierz dokument dla IT (PDF)', { onClick: () => toast('Pobrano InfoSystem-Site-Agent-dla-IT.pdf (mockup)', 'ok') })), card(h('h2', null, 'Co agent robi i czego nie robi'), h('div', { class: 'grid cols-2' }, h('div', null, h('h3', { class: 'mb-8' }, 'Robi'), h('ul', { class: 'help-list' }, h('li', null, 'Pobiera podpisane pakiety aplikacji InfoSystem i sprawdza podpis przed pokazaniem Ci ich w panelu.'), h('li', null, h('strong', null, 'Instaluje i aktualizuje wyłącznie po Twoim kliknięciu'), ' albo w oknie, które sam włączysz dla wybranej aplikacji.'), h('li', null, 'Uruchamia aplikacje jako usługi Windows za nginx; sprawdza ich zdrowie i restartuje po awarii.'), h('li', null, 'Przy nieudanej aktualizacji sam przywraca poprzednią wersję.'), h('li', null, 'Raportuje do InfoSystem wersje, stan usług i wynik operacji (tylko dane techniczne).'), h('li', null, 'Przechowuje hasła aplikacji w zaszyfrowanym magazynie na tym serwerze.'))), h('div', null, h('h3', { class: 'mb-8' }, 'Nie robi'), h('ul', { class: 'help-list' }, h('li', null, 'Nie instaluje, nie aktualizuje i nie konfiguruje Firebirda. Nie zmienia hasła SYSDBA bez Twojego polecenia.'), h('li', null, 'Nie otwiera żadnego portu z internetu. Komunikuje się wyłącznie ruchem wychodzącym.'), h('li', null, 'Nie zmienia ustawień Windows Update ani zapory poza regułami dla własnych portów (możesz to wyłączyć).'), h('li', null, 'Nie wysyła danych osobowych ani haseł. Raporty zawierają tylko wersje, stan i logi techniczne.'), h('li', null, 'Nie daje serwisowi zdalnego dostępu do serwera.'))))), card(h('h2', null, 'Uprawnienia i konto usługi'), kv([['Konto usługi', dyn(s.site.agent.account)], ['Dlaczego administrator', 'rejestracja usług Windows, zapis w katalogu platformy, konfiguracja nginx'], ['Usługi Windows', dyn('InfoSystem.SiteAgent, InfoSystem.Nginx, InfoSystem.Skarbowy, InfoSystem.CRU, InfoSystem.KSeF, InfoSystem.eAuta')], ['Katalogi', dyn(`${s.site.agent.installDir} (program), ${s.site.agent.dataDir} (aplikacje, logi, baza konfiguracji, sekrety)`)]])), card(h('h2', null, 'Ruch sieciowy'), h('div', null, kv([['Wychodzący (jedyny)', dyn(`${s.site.infoSystem.host}:${s.site.infoSystem.port}, HTTPS, certyfikat przypięty`)], ['Przychodzący z internetu', 'brak'], ['Przychodzący z sieci lokalnej', dyn(`port ${s.site.nginx.port} (nginx, dla PC operatorów)`)], ['Panel lokalny', 'tylko 127.0.0.1; dostęp = zalogowanie na ten serwer']]), h('p', { class: 'small muted mt-8' }, 'Lista hostów do allow‑listy do skopiowania jest w Diagnostyce → Połączenie z InfoSystem.'))), card(h('h2', null, 'Jak zatrzymać lub odinstalować agenta bez utraty aplikacji'), h('ol', { class: 'help-list' }, h('li', null, 'Zatrzymaj usługę InfoSystem.SiteAgent (Ustawienia → Agent → Zatrzymaj, albo services.msc). Aplikacje i nginx działają dalej; nie dostaną aktualizacji.'), h('li', null, 'Odinstaluj „InfoSystem Site Agent” z Aplikacji i funkcji. Aplikacje, nginx, baza konfiguracji i magazyn sekretów pozostają w C:\\InfoSystem.'), h('li', null, 'Żeby usunąć także aplikacje: zatrzymaj usługi InfoSystem.* i usuń katalog C:\\InfoSystem. Bazy Firebirda nie są dotykane.'), h('li', null, 'Serwis zobaczy placówkę jako „brak kontaktu” i skontaktuje się z Tobą.'))), card(h('h2', null, 'Kontakt i wersje składników'), kv([['Serwis InfoSystem', dyn(`${s.site.support.phone}, ${s.site.support.email}`)], ['Identyfikator placówki', dyn(s.site.siteId)], ['Site Agent', dyn(s.site.agent.version)], ['nginx', dyn(`${s.site.nginx.version} (licencja BSD‑2)`)], ['Firebird (klient)', '3.0 (IDPL); serwer Firebird nie jest składnikiem platformy']])));
}
