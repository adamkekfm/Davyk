"use strict";
// Dane przykładowe, scenariusze demo, magazyn stanu i symulacja działań agenta.
// ---------- Czas ----------
const NOW = new Date(2026, 9, 19, 10, 30, 0); // poniedziałek 19.10.2026 10:30, czas serwera
const BOOT_REAL = Date.now();
const ACCOUNT = 'SRV-URZAD\\akowalski';
function nowIso() { return new Date(NOW.getTime() + (Date.now() - BOOT_REAL)).toISOString(); }
function nowDate() { return new Date(nowIso()); }
function minutesAgo(m) { return new Date(NOW.getTime() - m * 60000).toISOString(); }
function hoursAgo(hs) { return minutesAgo(hs * 60); }
function daysAgo(d, hour, minute = 0) {
    const x = new Date(NOW.getTime() - d * 86400000);
    if (hour !== undefined)
        x.setHours(hour, minute, 0, 0);
    return x.toISOString();
}
function nextSaturdayIso(hour = 6) {
    const x = new Date(NOW);
    const diff = ((6 - x.getDay()) + 7) % 7 || 7;
    x.setDate(x.getDate() + diff);
    x.setHours(hour, 0, 0, 0);
    return x.toISOString();
}
function tomorrowIso(hour = 6) { const x = new Date(NOW); x.setDate(x.getDate() + 1); x.setHours(hour, 0, 0, 0); return x.toISOString(); }
const pad2 = (n) => String(n).padStart(2, '0');
function fmtDate(iso) { const d = new Date(iso); return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`; }
function fmtTime(iso) { const d = new Date(iso); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function fmtDateTime(iso) { return `${fmtDate(iso)} ${fmtTime(iso)}`; }
const DAY_NAMES = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
const DAY_SHORT = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
function fmtDayDateTime(iso) { const d = new Date(iso); return `${DAY_NAMES[d.getDay()]} ${fmtDate(iso)}, ${fmtTime(iso)}`; }
function plural(n, one, few, many) {
    if (n === 1)
        return one;
    const m10 = n % 10, m100 = n % 100;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14))
        return few;
    return many;
}
function fmtRelative(iso) {
    const diff = (nowDate().getTime() - new Date(iso).getTime()) / 60000;
    const abs = Math.abs(diff);
    const future = diff < 0;
    if (abs < 1)
        return 'przed chwilą';
    let txt;
    if (abs < 60)
        txt = `${Math.round(abs)} min`;
    else if (abs < 48 * 60)
        txt = `${Math.round(abs / 60)} godz.`;
    else {
        const n = Math.round(abs / 1440);
        txt = `${n} ${plural(n, 'dzień', 'dni', 'dni')}`;
    }
    return future ? `za ${txt}` : `${txt} temu`;
}
function fmtMb(mb) { return mb >= 1024 ? `${(mb / 1024).toFixed(1).replace('.', ',')} GB` : `${Math.round(mb)} MB`; }
function fmtGb(gb) { return `${gb.toFixed(1).replace('.', ',')} GB`; }
function compareVersions(a, b) {
    const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        const d = (pa[i] || 0) - (pb[i] || 0);
        if (d)
            return d;
    }
    return 0;
}
function fmtDuration(ms) { if (ms < 1000)
    return `${ms} ms`; const s = Math.round(ms / 1000); if (s < 60)
    return `${s} s`; return `${Math.floor(s / 60)} min ${pad2(s % 60)} s`; }
// ---------- Etykiety ----------
const OP_TYPE_LABEL = {
    'install': 'Instalacja', 'update': 'Aktualizacja', 'rollback-auto': 'Wycofanie automatyczne', 'rollback': 'Cofnięcie ręczne',
    'reject': 'Odrzucenie wersji', 'reconsider': 'Ponowne rozważenie', 'schedule': 'Zaplanowanie', 'unschedule': 'Anulowanie planu',
    'config': 'Zmiana konfiguracji', 'policy': 'Zmiana polityki', 'settings': 'Zmiana ustawień', 'import': 'Import pakietu konfiguracji',
    'package-rejected': 'Pakiet odrzucony przez agenta', 'service-restart': 'Restart usługi', 'agent-update': 'Aktualizacja agenta', 'port-change': 'Zmiana portu nginx',
};
const OP_RESULT_LABEL = {
    'running': 'W toku', 'success': 'Zakończona', 'rolled-back': 'Wycofana', 'failed': 'Nieudana', 'done': 'Zapisano', 'cancelled': 'Anulowana',
};
const SERVICE_LABEL = {
    'running': 'Działa', 'stopped': 'Zatrzymana', 'starting': 'Uruchamianie', 'restarting': 'Aktualizacja w toku', 'failed': 'Błąd uruchomienia', 'not-installed': 'Nie zainstalowana',
};
const HEALTH_LABEL = { 'healthy': 'Zdrowa', 'degraded': 'Obniżona', 'unhealthy': 'Niezdrowa', 'unknown': 'Nie sprawdzono' };
const CHANNEL_LABEL = { 'stable': 'kanał stabilny', 'pilot': 'kanał pilotażowy' };
// ---------- Schematy konfiguracji ----------
function dbSection(filePlaceholder, userPlaceholder) {
    return {
        key: 'database', title: 'Baza danych', fields: [
            { key: 'database.host', label: 'Serwer Firebirda', type: 'fqdn', required: true, restart: true, placeholder: 'srv-baza.urzad.local', help: 'Nazwa serwera (FQDN), nie adres IP. Dla bazy na tym serwerze wpisz localhost.' },
            { key: 'database.port', label: 'Port instancji', type: 'port', required: true, restart: true, placeholder: '3050', help: 'Na tym serwerze wykryto instancje: 3050 (Firebird 3.0), 3051 (Firebird 2.5, aplikacja firmy zewnętrznej).' },
            { key: 'database.file', label: 'Ścieżka bazy', type: 'path', required: true, restart: true, placeholder: filePlaceholder, help: 'Pełna ścieżka na serwerze bazy albo alias Firebirda.' },
            { key: 'database.user', label: 'Użytkownik bazy', type: 'text', required: true, restart: true, placeholder: userPlaceholder },
            { key: 'database.password', label: 'Hasło użytkownika bazy', type: 'secret', required: true, restart: true, help: 'Trafia do magazynu sekretów agenta. Nie jest zapisywane w bazie konfiguracji ani w logach i nie będzie wyświetlane.' },
        ],
    };
}
function schemaFor(name) {
    switch (name) {
        case 'skarbowy': return {
            version: '4.1', sections: [
                dbSection('D:\\Bazy\\podatki.fdb', 'SKARBOWY_APP'),
                { key: 'external', title: 'Usługi zewnętrzne', fields: [
                        { key: 'mc.apiHost', label: 'Adres API Ministerstwa Cyfryzacji', type: 'fqdn', required: true, restart: false, placeholder: 'api-eplatnosci.przyklad.gov.pl' },
                        { key: 'mc.unitId', label: 'Identyfikator jednostki', type: 'id', required: true, restart: false, pattern: '^[A-Z0-9]{8,12}$', patternMessage: 'Identyfikator ma 8 do 12 znaków: wielkie litery i cyfry', placeholder: 'UG12345678' },
                        { key: 'mc.unitSecret', label: 'Secret jednostki', type: 'secret', required: true, restart: true, help: 'Nadany przy certyfikacji w Ministerstwie Cyfryzacji. Trafia do magazynu sekretów.' },
                    ] },
                { key: 'jobs', title: 'Praca w tle', fields: [
                        { key: 'jobs.mcSyncEnabled', label: 'Wysyłka zobowiązań do Ministerstwa Cyfryzacji', type: 'bool', required: false, restart: true, help: 'Włącz dopiero po wyłączeniu wysyłki w starej instalacji IIS. Włączenie obu spowoduje podwójne wysyłki.' },
                        { key: 'jobs.mcSyncInterval', label: 'Częstotliwość wysyłki', type: 'select', required: true, restart: true, options: [{ value: '30', label: 'co 30 minut' }, { value: '60', label: 'co 60 minut' }] },
                    ] },
                { key: 'app', title: 'Parametry aplikacji', fields: [
                        { key: 'app.paymentTitleTemplate', label: 'Szablon tytułu wpłaty', type: 'text', required: false, restart: false, placeholder: 'Opłata skarbowa {numer}' },
                        { key: 'app.exportDir', label: 'Katalog eksportu raportów', type: 'path', required: false, restart: false, placeholder: 'D:\\Eksport\\skarbowy' },
                    ] },
            ],
        };
        case 'cru': return {
            version: '2.3', sections: [
                dbSection('D:\\Bazy\\cru.fdb', 'CRU_APP'),
                { key: 'external', title: 'Usługi zewnętrzne', fields: [
                        { key: 'cru.registryHost', label: 'Adres rejestru CRU', type: 'fqdn', required: true, restart: false, placeholder: 'api-cru.przyklad.gov.pl' },
                    ] },
                { key: 'app', title: 'Parametry aplikacji', fields: [
                        { key: 'app.unitTeryt', label: 'Kod TERYT jednostki', type: 'id', required: true, restart: false, pattern: '^\\d{7}$', patternMessage: 'Kod TERYT ma 7 cyfr', placeholder: '1412052' },
                        { key: 'app.retentionDays', label: 'Przechowywanie zdarzeń (dni)', type: 'number', required: true, restart: false, placeholder: '365' },
                        { key: 'app.notifyEmail', label: 'E‑mail do powiadomień', type: 'text', required: false, restart: false, newInVersion: '2.4.0', help: 'Nowe w wersji 2.4.0. Opcjonalne.' },
                    ] },
                { key: 'jobs', title: 'Praca w tle', fields: [
                        { key: 'jobs.queueWorkers', label: 'Równoległe wysyłki', type: 'select', required: true, restart: true, options: [{ value: '1', label: '1 (słaby serwer)' }, { value: '2', label: '2' }, { value: '4', label: '4' }] },
                    ] },
            ],
        };
        case 'ksef': return {
            version: '3.1', sections: [
                dbSection('D:\\Bazy\\budzet.fdb', 'KSEF_APP'),
                { key: 'external', title: 'Usługi zewnętrzne', fields: [
                        { key: 'ksef.apiHost', label: 'Adres API KSeF', type: 'fqdn', required: true, restart: false, placeholder: 'api-ksef.przyklad.gov.pl' },
                        { key: 'ksef.nip', label: 'NIP jednostki', type: 'id', required: true, restart: false, pattern: '^\\d{10}$', patternMessage: 'NIP ma 10 cyfr', placeholder: '1234567890' },
                        { key: 'ksef.token', label: 'Token uwierzytelniający KSeF', type: 'secret', required: true, restart: true },
                    ] },
                { key: 'jobs', title: 'Praca w tle', fields: [
                        { key: 'jobs.outboxEnabled', label: 'Automatyczna wysyłka faktur', type: 'bool', required: false, restart: true },
                    ] },
                { key: 'app', title: 'Parametry aplikacji', fields: [
                        { key: 'app.numbering', label: 'Schemat numeracji faktur', type: 'select', required: true, restart: false, options: [{ value: 'rok', label: 'FV/{nr}/{rok}' }, { value: 'miesiac', label: 'FV/{nr}/{miesiąc}/{rok}' }] },
                    ] },
            ],
        };
        default: return {
            version: '1.8', sections: [
                dbSection('D:\\Bazy\\podatki.fdb', 'EAUTA_APP'),
                { key: 'external', title: 'Usługi zewnętrzne', fields: [
                        { key: 'eauta.cepikHost', label: 'Adres usługi CEPiK', type: 'fqdn', required: false, restart: false, help: 'Zostaw puste, jeśli placówka nie udostępnia eAutom wyjścia na zewnątrz.' },
                    ] },
                { key: 'app', title: 'Parametry aplikacji', fields: [
                        { key: 'app.registryMode', label: 'Tryb rejestru pojazdów', type: 'select', required: true, restart: false, options: [{ value: 'pelny', label: 'Pełny' }, { value: 'odczyt', label: 'Tylko odczyt' }] },
                    ] },
            ],
        };
    }
}
function fullValues(name) {
    const common = { 'database.host': 'localhost', 'database.port': '3050' };
    switch (name) {
        case 'skarbowy': return { ...common, 'database.file': 'D:\\Bazy\\podatki.fdb', 'database.user': 'SKARBOWY_APP', 'mc.apiHost': 'api-eplatnosci.przyklad.gov.pl', 'mc.unitId': 'UG14120520', 'jobs.mcSyncEnabled': true, 'jobs.mcSyncInterval': '60', 'app.paymentTitleTemplate': 'Opłata skarbowa {numer}', 'app.exportDir': '' };
        case 'cru': return { ...common, 'database.file': 'D:\\Bazy\\cru.fdb', 'database.user': 'CRU_APP', 'cru.registryHost': 'api-cru.przyklad.gov.pl', 'app.unitTeryt': '1412052', 'app.retentionDays': '365', 'app.notifyEmail': '', 'jobs.queueWorkers': '1' };
        case 'ksef': return { ...common, 'database.file': 'D:\\Bazy\\budzet.fdb', 'database.user': 'KSEF_APP', 'ksef.apiHost': 'api-ksef.przyklad.gov.pl', 'ksef.nip': '5361234567', 'jobs.outboxEnabled': true, 'app.numbering': 'rok' };
        default: return { ...common, 'database.file': 'D:\\Bazy\\podatki.fdb', 'database.user': 'EAUTA_APP', 'eauta.cepikHost': '', 'app.registryMode': 'pelny' };
    }
}
function secretKeys(sections) {
    const out = [];
    sections.forEach(s => s.fields.forEach(f => { if (f.type === 'secret')
        out.push(f.key); }));
    return out;
}
function buildConfig(name, filled) {
    const schema = schemaFor(name);
    const values = {};
    schema.sections.forEach(s => s.fields.forEach(f => { if (f.type !== 'secret')
        values[f.key] = f.type === 'bool' ? false : ''; }));
    const secrets = {};
    secretKeys(schema.sections).forEach(k => { secrets[k] = filled ? { isSet: true, changedAt: daysAgo(60, 11), changedBy: ACCOUNT } : { isSet: false }; });
    return { schemaVersion: schema.version, sections: schema.sections, values: filled ? { ...values, ...fullValues(name) } : values, secrets };
}
// ---------- Aplikacje ----------
function healthyResult(version, instance, jobs, startedAt, schema = 41) {
    return { status: 'healthy', appVersion: version, schemaCurrent: schema, schemaExpected: schema, dbReachable: true, dbInstance: instance, latencyMs: 4, jobs, startedAt, checkedAt: minutesAgo(3) };
}
const NOTES = {
    'skarbowy-4.2.0': [
        'Nowy format komunikatów do Ministerstwa Cyfryzacji obowiązujący od 1.12.2026.',
        'Raport wpłat: poprawka sumowania przy wpłatach częściowych.',
        'Lista zobowiązań ładuje się szybciej przy ponad 10 tys. pozycji.',
    ],
    'cru-2.4.0': [
        'Nowe pola w rejestrze zgodne z rozporządzeniem z 30.09.2026.',
        'Migracja schematu bazy CruDb (41 → 42). W tej wersji platformy migrację wykonuje serwis ręcznie przed instalacją.',
        'Kolejka wysyłki: ponawianie z rosnącym odstępem.',
        'Nowy, opcjonalny parametr konfiguracji: e‑mail do powiadomień.',
    ],
    'ksef-3.2.0': [
        'Struktura faktur zgodna z KSeF 2.0 (obowiązuje od 1.11.2026).',
        'Nowy mechanizm uwierzytelnienia tokenem jednostki.',
        'Poprawki stabilności usługi przy starcie na słabym sprzęcie.',
    ],
    'agent-1.0.4': [
        'Wznawianie pobierania pakietów po zerwaniu łącza.',
        'Limit pasma pobierania konfigurowalny w Ustawieniach.',
        'Panel: poprawki widoku przebiegu operacji.',
    ],
    'first': ['Pierwsza instalacja aplikacji w tej placówce.', 'Wersja odpowiada kanałowi stabilnemu przypisanemu placówce przez serwis.'],
};
function pending(app, version, channel, releaseDate, offeredAt, impact, sizeMb, extra = {}) {
    return { version, channel, releaseDate, offeredAt, notes: NOTES[`${app}-${version}`] || NOTES['first'], impact, minAgentVersion: '1.0.0', sizeMb, status: 'pending', ...extra };
}
const SESSIONS_PODATKI = [
    { user: 'AKOWALSKA', host: 'PC-KSIEG-01', app: 'Podatki.exe', since: hoursAgo(2.3) },
    { user: 'MNOWAK', host: 'PC-KASA-02', app: 'Kasa.exe', since: hoursAgo(1.8) },
    { user: 'SKARBOWY_APP', host: 'SRV-URZAD', app: 'mObywatel / e‑Opłaty (usługa)', since: daysAgo(37, 6) },
];
function buildApps(scn) {
    const fresh = scn === 'fresh';
    const base = (name, title, prefix, port, installed, installedAt, dbFile, jobs, sessions, filled, schema = 41) => ({
        name, title, prefix, port: fresh ? null : port,
        service: fresh ? 'not-installed' : 'running',
        installed: fresh ? null : installed, installedAt: fresh ? undefined : installedAt,
        health: fresh ? null : healthyResult(installed, `localhost:3050`, jobs, installedAt, schema),
        pending: [], disk: fresh ? [] : [{ version: installed, installedAt, sizeMb: 180 }],
        policy: { enabled: false, days: [6], from: '06:00', to: '08:00', skipOnSessions: true },
        config: buildConfig(name, filled), dbInstance: 'localhost:3050', dbFile, sessions,
    });
    const skarbowy = base('skarbowy', 'mObywatel / e‑Opłaty', '/skarbowy/', 5101, '4.1.2', daysAgo(37, 6, 15), 'D:\\Bazy\\podatki.fdb', [{ name: 'mc-sync', alive: true, lastRun: minutesAgo(12) }, { name: 'cleanup', lastRun: hoursAgo(8), alive: true }], SESSIONS_PODATKI, !fresh);
    const cru = base('cru', 'CRU', '/cru/', 5102, '2.3.1', daysAgo(60, 6), 'D:\\Bazy\\cru.fdb', [{ name: 'cru-outbox', alive: true, lastRun: minutesAgo(4) }, { name: 'cleanup', alive: true, lastRun: hoursAgo(8) }], [{ user: 'CRU_APP', host: 'SRV-URZAD', app: 'CRU (usługa)', since: daysAgo(60, 6) }], true);
    const ksef = base('ksef', 'KSeF', '/ksef/', 5103, '3.1.0', daysAgo(45, 6), 'D:\\Bazy\\budzet.fdb', [{ name: 'ksef-outbox', alive: true, lastRun: minutesAgo(9) }], [], !fresh);
    const eauta = base('eauta', 'eAuta', '/eauta/', 5104, '1.8.0', daysAgo(9, 6, 4), 'D:\\Bazy\\podatki.fdb', [{ name: 'cleanup', alive: true, lastRun: hoursAgo(8) }], [{ user: 'JWISNIEWSKA', host: 'PC-KOM-04', app: 'eAuta', since: hoursAgo(0.7) }, { user: 'PWOJCIK', host: 'PC-KOM-05', app: 'eAuta', since: hoursAgo(1.2) }], true);
    eauta.policy = { enabled: !fresh, days: [6], from: '06:00', to: '08:00', skipOnSessions: true };
    eauta.disk = fresh ? [] : [{ version: '1.8.0', installedAt: daysAgo(9, 6, 4), sizeMb: 140 }, { version: '1.7.3', installedAt: daysAgo(70, 6), sizeMb: 138 }];
    cru.disk = fresh ? [] : [{ version: '2.3.1', installedAt: daysAgo(60, 6), sizeMb: 175 }, { version: '2.3.0', installedAt: daysAgo(95, 6), sizeMb: 174 }];
    skarbowy.disk = fresh ? [] : [{ version: '4.1.2', installedAt: daysAgo(37, 6, 15), sizeMb: 180 }, { version: '4.1.1', installedAt: daysAgo(80, 6), sizeMb: 179 }];
    const agent = {
        name: 'agent', title: 'Site Agent', prefix: '', port: null, service: 'running', installed: '1.0.3', installedAt: daysAgo(20, 6),
        health: null, pending: [], disk: [{ version: '1.0.3', installedAt: daysAgo(20, 6), sizeMb: 45 }, { version: '1.0.2', installedAt: daysAgo(50, 6), sizeMb: 44 }],
        policy: { enabled: false, days: [6], from: '06:00', to: '08:00', skipOnSessions: true },
        config: { schemaVersion: '-', sections: [], values: {}, secrets: {} }, isPlatform: true, sessions: [],
    };
    if (fresh) {
        skarbowy.pending = [pending('skarbowy', '4.1.2', 'stable', daysAgo(40), minutesAgo(6), { requiresRestart: false, schemaMigration: false, urgent: false }, 180, { isFirstInstall: true })];
        cru.pending = [pending('cru', '2.3.1', 'stable', daysAgo(62), minutesAgo(6), { requiresRestart: false, schemaMigration: false, urgent: false }, 175, { isFirstInstall: true })];
        ksef.pending = [pending('ksef', '3.1.0', 'stable', daysAgo(50), minutesAgo(5), { requiresRestart: false, schemaMigration: false, urgent: false }, 160, { isFirstInstall: true })];
        eauta.pending = [pending('eauta', '1.8.0', 'stable', daysAgo(12), minutesAgo(5), { requiresRestart: false, schemaMigration: false, urgent: false }, 140, { isFirstInstall: true })];
    }
    else {
        skarbowy.pending = [pending('skarbowy', '4.2.0', 'stable', daysAgo(4), daysAgo(2, 14, 5), { requiresRestart: true, schemaMigration: false, urgent: false }, 182)];
        cru.pending = [pending('cru', '2.4.0', 'pilot', daysAgo(6), daysAgo(2, 14, 5), { requiresRestart: true, schemaMigration: true, urgent: false }, 178)];
        ksef.pending = [pending('ksef', '3.2.0', 'stable', daysAgo(3), daysAgo(1, 9, 40), { requiresRestart: true, schemaMigration: false, urgent: true }, 165, { faulty: true, faultReason: 'zadanie w tle ksef-outbox nie wystartowało w ciągu 60 s' })];
        ksef.pending.push(pending('ksef', '3.1.1', 'stable', daysAgo(14), daysAgo(11, 10), { requiresRestart: true, schemaMigration: false, urgent: false }, 161, { status: 'rejected', rejected: { at: daysAgo(11, 10, 20), by: ACCOUNT, reason: 'Czekam na potwierdzenie z serwisu' }, notes: ['Poprawka eksportu faktur korygujących.'] }));
        agent.pending = [pending('agent', '1.0.4', 'stable', daysAgo(2), daysAgo(1, 9, 40), { requiresRestart: true, schemaMigration: false, urgent: false }, 46)];
        if (scn === 'rolledback') {
            ksef.pending[0].annotation = `Próba instalacji ${fmtDateTime(daysAgo(0, 6))} (harmonogram) została wycofana automatycznie: ${ksef.pending[0].faultReason}.`;
        }
    }
    return [skarbowy, cru, ksef, eauta, agent];
}
// ---------- Operacje historyczne ----------
function doneOp(id, type, app, actor, at, result, extra = {}) {
    return { id, type, app: app.name, appTitle: app.title, actor, startedAt: at, finishedAt: at, result, steps: [], log: [], reported: 'sent', ...extra };
}
function finishedSteps(from, to, nginx) {
    return [
        { key: 'preflight', title: 'Sprawdzenia wstępne', status: 'ok', detail: 'dysk, port, sesje, uprawnienia', durationMs: 900 },
        { key: 'verify', title: 'Pobranie i weryfikacja pakietu', status: 'skipped', detail: 'pakiet zweryfikowany wcześniej', durationMs: 0 },
        { key: 'prestart', title: 'Krok przed startem (Migrator)', status: 'skipped', detail: 'pominięto: brak Migratora w tej wersji agenta', durationMs: 0 },
        { key: 'stop', title: 'Zatrzymanie usługi', status: from ? 'ok' : 'skipped', detail: from ? `wersja ${from}` : 'pierwsza instalacja', durationMs: 2100 },
        { key: 'switch', title: `Przełączenie na wersję ${to}`, status: 'ok', detail: 'katalog current → ' + to, durationMs: 300 },
        { key: 'start', title: 'Uruchomienie usługi', status: 'ok', detail: 'usługa działa', durationMs: 7800 },
        { key: 'nginx', title: 'Aktualizacja konfiguracji nginx', status: nginx ? 'ok' : 'skipped', detail: nginx ? 'nginx -t OK, przeładowano' : 'bez zmian portu i prefiksu', durationMs: 400 },
        { key: 'health', title: 'Sprawdzenie zdrowia', status: 'ok', detail: 'zdrowa, baza osiągalna', durationMs: 1200 },
        { key: 'report', title: 'Raport do InfoSystem', status: 'ok', detail: 'wysłano', durationMs: 350 },
    ];
}
function buildOperations(scn, apps) {
    if (scn === 'fresh')
        return [];
    const a = (n) => apps.find(x => x.name === n);
    const ops = [
        doneOp('op-99', 'service-restart', a('cru'), 'agent (nadzór usług)', daysAgo(4, 3, 12), 'success', { summary: 'Usługa CRU zatrzymała się nieoczekiwanie i została uruchomiona ponownie.', steps: [
                { key: 'stop', title: 'Zatrzymanie usługi', status: 'skipped', detail: 'usługa już zatrzymana (kod wyjścia 1)' },
                { key: 'start', title: 'Uruchomienie usługi', status: 'ok', detail: 'usługa działa', durationMs: 6200 },
                { key: 'health', title: 'Sprawdzenie zdrowia', status: 'ok', detail: 'zdrowa', durationMs: 900 },
            ] }),
        doneOp('op-98', 'package-rejected', a('eauta'), 'agent', daysAgo(5, 14, 2), 'failed', { toVersion: '1.8.1', failReason: 'Podpis manifestu nieprawidłowy. Pakiet odrzucony, serwis powiadomiony.', summary: 'Pakiet eAuta 1.8.1 nie przeszedł weryfikacji podpisu.' }),
        doneOp('op-97', 'update', a('eauta'), 'polityka auto (sobota 06:00–08:00)', daysAgo(9, 6, 4), 'success', { fromVersion: '1.7.3', toVersion: '1.8.0', steps: finishedSteps('1.7.3', '1.8.0', false), summary: 'eAuta 1.8.0 działa.' }),
        doneOp('op-96', 'reject', a('ksef'), ACCOUNT, daysAgo(11, 10, 20), 'done', { toVersion: '3.1.1', summary: 'Odrzucono KSeF 3.1.1: „Czekam na potwierdzenie z serwisu”. Powód przekazany serwisowi.' }),
        doneOp('op-95', 'config', a('cru'), ACCOUNT, daysAgo(17, 9, 48), 'done', { summary: 'Zmieniono pola: jobs.queueWorkers (2 → 1). Usługa zrestartowana.', details: ['jobs.queueWorkers'] }),
        doneOp('op-94', 'update', a('skarbowy'), ACCOUNT, daysAgo(37, 6, 15), 'success', { fromVersion: '4.1.1', toVersion: '4.1.2', steps: finishedSteps('4.1.1', '4.1.2', false), summary: 'mObywatel / e‑Opłaty 4.1.2 działa.' }),
        doneOp('op-93', 'policy', a('eauta'), ACCOUNT, daysAgo(40, 11, 2), 'done', { summary: 'Włączono automatyczną instalację dla eAuta: sobota 06:00–08:00, pomijanie przy aktywnych sesjach.' }),
        doneOp('op-92', 'install', a('ksef'), ACCOUNT, daysAgo(45, 6), 'success', { toVersion: '3.1.0', steps: finishedSteps(undefined, '3.1.0', true), summary: 'KSeF 3.1.0 zainstalowana.' }),
        doneOp('op-91', 'install', a('cru'), ACCOUNT, daysAgo(60, 6), 'success', { toVersion: '2.3.1', steps: finishedSteps(undefined, '2.3.1', true), summary: 'CRU 2.3.1 zainstalowana.' }),
        doneOp('op-90', 'install', a('eauta'), ACCOUNT, daysAgo(70, 6), 'success', { toVersion: '1.7.3', steps: finishedSteps(undefined, '1.7.3', true), summary: 'eAuta 1.7.3 zainstalowana.' }),
        doneOp('op-89', 'install', a('skarbowy'), ACCOUNT, daysAgo(80, 6), 'success', { toVersion: '4.1.1', steps: finishedSteps(undefined, '4.1.1', true), summary: 'mObywatel / e‑Opłaty 4.1.1 zainstalowana. Wysyłka do MC wyłączona do czasu przełączenia z IIS.' }),
    ];
    if (scn === 'rolledback') {
        const ksef = a('ksef');
        const at = daysAgo(0, 6);
        ops.unshift({
            id: 'op-100', type: 'rollback-auto', app: 'ksef', appTitle: ksef.title, fromVersion: '3.1.0', toVersion: '3.2.0', actor: 'harmonogram (zaplanowano 17.10 przez ' + ACCOUNT + ')',
            startedAt: at, finishedAt: new Date(new Date(at).getTime() + 95000).toISOString(), result: 'rolled-back', reported: 'sent',
            failReason: 'Nowa wersja nie przeszła sprawdzenia zdrowia: ' + ksef.pending[0].faultReason + '. Przywrócono 3.1.0.',
            summary: 'Aktualizacja KSeF 3.2.0 wycofana automatycznie. KSeF 3.1.0 działa.',
            steps: [
                ...finishedSteps('3.1.0', '3.2.0', false).slice(0, 7),
                { key: 'health', title: 'Sprawdzenie zdrowia', status: 'failed', detail: 'niezdrowa: zadanie ksef-outbox nie żyje (brak odpowiedzi w 60 s)', durationMs: 60000 },
                { key: 'rb-stop', title: 'Zatrzymanie nowej wersji', status: 'ok', durationMs: 1800 },
                { key: 'rb-switch', title: 'Przywrócenie wersji 3.1.0', status: 'ok', detail: 'katalog current → 3.1.0', durationMs: 300 },
                { key: 'rb-start', title: 'Uruchomienie usługi', status: 'ok', durationMs: 7100 },
                { key: 'rb-health', title: 'Sprawdzenie zdrowia (3.1.0)', status: 'ok', detail: 'zdrowa', durationMs: 1100 },
                { key: 'rb-report', title: 'Raport do InfoSystem (wycofanie)', status: 'ok', detail: 'wysłano, zgłoszenie serwisowe SR-20261019-07', durationMs: 400 },
            ],
            log: [
                `${fmtTime(at)} [INFO] Start aktualizacji KSeF 3.1.0 → 3.2.0 (harmonogram)`,
                `${fmtTime(at)} [INFO] Sprawdzenia: dysk 14,2 GB wolne, port 5103 wolny, sesje na budzet.fdb: 0`,
                `${fmtTime(at)} [INFO] Zatrzymano usługę InfoSystem.KSeF (3.1.0)`,
                `${fmtTime(at)} [INFO] current → C:\\InfoSystem\\apps\\ksef\\3.2.0`,
                `${fmtTime(at)} [INFO] Uruchomiono usługę InfoSystem.KSeF (PID 4812)`,
                `${fmtTime(at)} [WARN] /health: status=unhealthy, backgroundJobs[ksef-outbox].alive=false`,
                `${fmtTime(at)} [WARN] /health: status=unhealthy (ponowienie 6/6)`,
                `${fmtTime(at)} [ERROR] Sprawdzenie zdrowia nie powiodło się po 60 s. Rozpoczynam wycofanie.`,
                `${fmtTime(at)} [INFO] Zatrzymano usługę InfoSystem.KSeF (3.2.0)`,
                `${fmtTime(at)} [INFO] current → C:\\InfoSystem\\apps\\ksef\\3.1.0`,
                `${fmtTime(at)} [INFO] Uruchomiono usługę InfoSystem.KSeF (PID 5020)`,
                `${fmtTime(at)} [OK] /health: status=healthy, appVersion=3.1.0`,
                `${fmtTime(at)} [INFO] Raport wysłany do InfoSystem (zgłoszenie SR-20261019-07)`,
            ],
        });
    }
    return ops;
}
// ---------- Placówka ----------
function buildSite(scn) {
    const fresh = scn === 'fresh';
    const offline = scn === 'offline';
    const bootstrap = [
        { key: 'register', title: 'Rejestracja placówki w InfoSystem', status: fresh ? 'pending' : 'ok', detail: 'Placówka: Urząd Gminy Przykładowo, identyfikator PL-1412052-01' },
        { key: 'desired', title: 'Pobranie listy udostępnionych aplikacji', status: fresh ? 'pending' : 'ok', detail: '4 aplikacje w kanale stabilnym' },
        { key: 'platform', title: 'Pobranie i weryfikacja pakietu platformy', status: fresh ? 'pending' : 'ok', detail: 'nginx 1.26.2, podpis prawidłowy' },
        { key: 'nginx', title: 'Instalacja nginx jako usługi Windows', status: fresh ? 'pending' : 'ok', detail: 'Port 443 zajęty (IIS). Wybrano port 8443.' },
        { key: 'tls', title: 'Certyfikat TLS placówki', status: fresh ? 'pending' : 'ok', detail: 'Wygenerowano certyfikat dla srv-urzad.urzad.local i localhost, ważny do 18.10.2029' },
        { key: 'ci', title: 'Baza konfiguracji (CI)', status: fresh ? 'pending' : 'ok', detail: 'Utworzono C:\\InfoSystem\\ci\\ci.fdb (Firebird 3.0, port 3050)' },
        { key: 'apps', title: 'Pobranie i weryfikacja pakietów 4 aplikacji', status: fresh ? 'pending' : 'ok', detail: 'mObywatel / e‑Opłaty 4.1.2, CRU 2.3.1, KSeF 3.1.0, eAuta 1.8.0: podpisy prawidłowe' },
    ];
    return {
        name: 'Urząd Gminy Przykładowo', siteId: 'PL-1412052-01', server: 'SRV-URZAD', fqdn: 'srv-urzad.urzad.local', windowsAccount: ACCOUNT,
        infoSystem: { host: 'agent.infosystem.pl', port: 443, connected: !offline, lastContact: offline ? hoursAgo(3.3) : minutesAgo(2), lastReport: offline ? hoursAgo(3.3) : minutesAgo(2), buffered: offline ? 4 : 0 },
        nginx: { state: fresh ? 'not-installed' : 'running', port: 8443, version: '1.26.2', port443Free: false },
        disk: { freeGb: 14.2, totalGb: 120, usedByPlatformGb: fresh ? 0.3 : 1.4 },
        agent: { version: '1.0.3', available: fresh ? undefined : '1.0.4', account: 'SRV-URZAD\\svc-infosystem', pollMinutes: 15, bandwidth: 'bez limitu', keepVersions: 2, ramMb: 68, installDir: 'C:\\Program Files\\InfoSystem\\SiteAgent', dataDir: 'C:\\InfoSystem' },
        bootstrap, wizardDismissed: !fresh,
        support: { phone: '22 000 00 00', email: 'serwis@infosystem.przyklad.pl' },
        cert: { subject: 'CN=srv-urzad.urzad.local', issuer: 'CN=InfoSystem Site CA (Urząd Gminy Przykładowo)', validTo: new Date(2029, 9, 18).toISOString(), thumbprint: '3F 1A 9C 02 B7 ... C9', trusted: true, selfIssued: true },
        firewallManaged: true,
    };
}
function buildNotifications(scn, site) {
    const n = [];
    if (scn === 'offline')
        n.push({ id: 'n-offline', kind: 'warning', text: `Brak połączenia z InfoSystem od ${fmtTime(site.infoSystem.lastContact)}. Aplikacje działają normalnie. ${site.infoSystem.buffered} raporty czekają w buforze i zostaną wysłane po przywróceniu łączności.`, link: '#/diagnostyka?sekcja=polaczenie', linkLabel: 'Testuj połączenie' });
    if (scn === 'rolledback')
        n.push({ id: 'n-rb', kind: 'error', text: 'Aktualizacja KSeF 3.2.0 (zaplanowana na dziś 06:00) została wycofana automatycznie: nowa wersja nie przeszła sprawdzenia zdrowia. KSeF 3.1.0 działa. Serwis został powiadomiony (zgłoszenie SR-20261019-07).', link: '#/operacje/op-100', linkLabel: 'Zobacz przebieg' });
    if (scn === 'normal')
        n.push({ id: 'n-agent', kind: 'info', text: 'Dostępna aktualizacja składnika platformy: Site Agent 1.0.4. Panel będzie niedostępny ok. 30 s podczas instalacji; aplikacje działają bez przerwy.', link: '#/aplikacje/agent/decyzja/1.0.4', linkLabel: 'Zdecyduj' });
    return n;
}
function buildScenario(scn) {
    const site = buildSite(scn);
    const apps = buildApps(scn);
    return { site, apps, operations: buildOperations(scn, apps), notifications: buildNotifications(scn, site) };
}
const store = {
    state: buildScenario('normal'),
    listeners: [],
    update(fn) { fn(this.state); this.emit(); },
    emit() { this.listeners.forEach(l => l()); },
    subscribe(l) { this.listeners.push(l); },
};
const demo = { scenario: 'normal', override: 'none', open: true, agentRestarting: false };
function findApp(name) { return store.state.apps.find(a => a.name === name); }
function appsOnly() { return store.state.apps.filter(a => !a.isPlatform); }
function pendingDecisions() {
    const out = [];
    store.state.apps.forEach(app => app.pending.filter(p => p.status === 'pending').forEach(pv => out.push({ app, pv })));
    return out;
}
function scheduledDecisions() {
    const out = [];
    store.state.apps.forEach(app => app.pending.filter(p => p.status === 'scheduled').forEach(pv => out.push({ app, pv })));
    return out;
}
function isOperationRunning() { return store.state.operations.some(o => o.result === 'running'); }
function runningOperation() { return store.state.operations.find(o => o.result === 'running'); }
function operatorsAddress() { const s = store.state.site; return `https://${s.fqdn}${s.nginx.port === 443 ? '' : ':' + s.nginx.port}/`; }
// ---------- Walidacja konfiguracji ----------
const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const HOST_RE = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const WIN_PATH_RE = /^([a-zA-Z]:\\|\\\\)[^<>"|?*]+$|^[A-Za-z0-9_-]+$/;
function validateField(f, v, secretSet) {
    if (f.type === 'secret')
        return f.required && !secretSet ? 'Wpisz wartość. To pole jest wymagane.' : null;
    if (f.type === 'bool')
        return null;
    const s = v === null || v === undefined ? '' : String(v).trim();
    if (!s)
        return f.required ? 'To pole jest wymagane' : null;
    switch (f.type) {
        case 'fqdn':
            if (IPV4_RE.test(s) || s.includes(':'))
                return 'Podaj nazwę serwera (np. srv-baza.urzad.local), nie adres IP';
            if (!HOST_RE.test(s))
                return 'Nieprawidłowa nazwa serwera';
            return null;
        case 'port': {
            const n = Number(s);
            if (!/^\d+$/.test(s) || n < 1 || n > 65535)
                return 'Port musi być liczbą od 1 do 65535';
            return null;
        }
        case 'path':
            if (!WIN_PATH_RE.test(s))
                return 'Podaj pełną ścieżkę na serwerze bazy (np. D:\\Bazy\\podatki.fdb) lub alias';
            return null;
        case 'number':
            if (!/^\d+$/.test(s))
                return 'Podaj liczbę całkowitą';
            return null;
        case 'id':
        case 'text':
            if (f.pattern && !new RegExp(f.pattern).test(s))
                return f.patternMessage || 'Nieprawidłowy format';
            return null;
        default: return null;
    }
}
function missingRequired(app) {
    const out = [];
    app.config.sections.forEach(sec => sec.fields.forEach(f => {
        var _a;
        if (!f.required)
            return;
        const err = validateField(f, app.config.values[f.key], !!((_a = app.config.secrets[f.key]) === null || _a === void 0 ? void 0 : _a.isSet));
        if (err)
            out.push(f);
    }));
    return out;
}
function requiredCount(app) { let n = 0; app.config.sections.forEach(s => s.fields.forEach(f => { if (f.required)
    n++; })); return n; }
function configComplete(app) { return app.isPlatform ? true : missingRequired(app).length === 0; }
// ---------- Sprawdzenia wstępne ----------
function computePreflight(app, pv) {
    var _a, _b;
    const s = store.state;
    const out = [];
    const freeMb = s.site.disk.freeGb * 1024;
    out.push({ key: 'disk', title: 'Miejsce na dysku', status: freeMb > pv.sizeMb * 3 ? 'ok' : 'fail', detail: `potrzebne ${fmtMb(pv.sizeMb)}, wolne ${fmtGb(s.site.disk.freeGb)}`, blocking: true });
    if (!app.isPlatform) {
        const n = app.sessions.length;
        out.push({ key: 'sessions', title: `Aktywne sesje na bazie ${(_a = app.dbFile) === null || _a === void 0 ? void 0 : _a.split('\\').pop()}`, status: n === 0 ? 'ok' : 'warn', detail: n === 0 ? 'brak aktywnych sesji' : `${n} ${plural(n, 'aktywna sesja', 'aktywne sesje', 'aktywnych sesji')}; instalacja przerwie pracę tych użytkowników na ok. 1 min`, blocking: false, items: app.sessions.map(x => `${x.user} · ${x.host} · ${x.app} · od ${fmtTime(x.since)}`) });
        out.push({ key: 'port', title: 'Port wewnętrzny usługi', status: 'ok', detail: `${(_b = app.port) !== null && _b !== void 0 ? _b : 5101 + appsOnly().indexOf(app)} wolny (loopback)`, blocking: true });
    }
    out.push({ key: 'perm', title: 'Uprawnienia konta usługi', status: 'ok', detail: `${s.site.agent.account} jest w grupie Administratorzy`, blocking: true });
    const agentOk = compareVersions(s.site.agent.version, pv.minAgentVersion) >= 0;
    out.push({ key: 'agent', title: 'Wersja agenta', status: agentOk ? 'ok' : 'fail', detail: agentOk ? `${s.site.agent.version}, wymagana co najmniej ${pv.minAgentVersion}` : `${s.site.agent.version}; pakiet wymaga co najmniej ${pv.minAgentVersion}`, blocking: true, link: agentOk ? undefined : { label: 'Zaktualizuj agenta', href: '#/aplikacje/agent' } });
    if (!app.isPlatform) {
        const missing = missingRequired(app);
        out.push({ key: 'config', title: 'Konfiguracja aplikacji', status: missing.length === 0 ? 'ok' : 'fail', detail: missing.length === 0 ? 'kompletna' : `brakuje ${missing.length} ${plural(missing.length, 'wymaganego pola', 'wymaganych pól', 'wymaganych pól')}: ${missing.map(m => m.label).join(', ')}`, blocking: true, link: missing.length ? { label: 'Uzupełnij konfigurację', href: `#/aplikacje/${app.name}/konfiguracja` } : undefined });
        if (pv.impact.schemaMigration)
            out.push({ key: 'migration', title: 'Migracja schematu bazy', status: 'warn', detail: 'ta wersja wymaga migracji bazy, którą serwis wykonuje ręcznie przed instalacją. Nie instaluj, dopóki serwis nie potwierdzi.', blocking: false });
    }
    if (isOperationRunning()) {
        const r = runningOperation();
        out.push({ key: 'busy', title: 'Inna operacja w toku', status: 'warn', detail: `${OP_TYPE_LABEL[r.type].toLowerCase()} ${r.appTitle}; ta instalacja trafi do kolejki`, blocking: false });
    }
    return out;
}
// ---------- Symulacja operacji ----------
let opCounter = 100;
function nextOpId() { return 'op-' + (++opCounter); }
const opQueue = [];
let toastHook = () => undefined;
function logLine(op, level, text) { op.log.push(`${fmtTime(nowIso())} [${level}] ${text}`); }
function runPlan(op, plan, onFinish) {
    let i = 0;
    const next = () => {
        if (i >= plan.length) {
            onFinish(null);
            return;
        }
        const p = plan[i++];
        store.update(() => { p.step.status = 'running'; });
        const started = Date.now();
        setTimeout(() => {
            const outcome = p.outcome ? p.outcome() : 'ok';
            store.update(() => {
                p.step.status = outcome;
                p.step.durationMs = Date.now() - started;
                (p.logs || []).forEach(l => logLine(op, outcome === 'failed' ? 'WARN' : 'INFO', l));
                if (outcome === 'failed')
                    logLine(op, 'ERROR', `${p.step.title}: ${p.step.detail || 'niepowodzenie'}`);
                if (p.onDone)
                    p.onDone();
            });
            if (outcome === 'failed')
                onFinish(p);
            else
                next();
        }, p.ms);
    };
    next();
}
function finishOp(op, result, summary, failReason) {
    store.update(() => { op.result = result; op.finishedAt = nowIso(); op.summary = summary; op.failReason = failReason; op.reported = store.state.site.infoSystem.connected ? 'sent' : 'buffered'; if (!store.state.site.infoSystem.connected)
        store.state.site.infoSystem.buffered++; });
    const q = opQueue.shift();
    if (q)
        setTimeout(q, 600);
}
function newOp(type, app, actor, from, to) {
    const op = { id: nextOpId(), type, app: app.name, appTitle: app.title, fromVersion: from, toVersion: to, actor, startedAt: nowIso(), result: 'running', steps: [], log: [], reported: 'sent' };
    store.update(s => { s.operations.unshift(op); });
    return op;
}
function step(key, title, detail) { return { key, title, status: 'pending', detail }; }
function startInstall(appName, version, actor = ACCOUNT) {
    var _a;
    const app = findApp(appName);
    if (!app)
        return null;
    const pv = app.pending.find(p => p.version === version);
    if (!pv)
        return null;
    if (app.isPlatform)
        return startAgentUpdate(actor);
    if (isOperationRunning()) {
        opQueue.push(() => { startInstall(appName, version, actor + ' (z kolejki)'); });
        toastHook(`Dodano do kolejki: ${app.title} ${version} rozpocznie się po zakończeniu bieżącej operacji.`, 'info');
        return null;
    }
    const isFirst = !app.installed;
    const from = app.installed || undefined;
    const op = newOp(isFirst ? 'install' : 'update', app, actor, from, version);
    const s = store.state;
    const port = (_a = app.port) !== null && _a !== void 0 ? _a : (5101 + appsOnly().indexOf(app));
    logLine(op, 'INFO', `Start ${isFirst ? 'instalacji' : 'aktualizacji'} ${app.title} ${from ? from + ' → ' : ''}${version} (${actor})`);
    const stSteps = {
        preflight: step('preflight', 'Sprawdzenia wstępne'),
        verify: step('verify', 'Pobranie i weryfikacja pakietu', 'pakiet zweryfikowany wcześniej (podpis prawidłowy)'),
        prestart: step('prestart', 'Krok przed startem (Migrator)', 'pominięto: brak Migratora w tej wersji agenta'),
        stop: step('stop', 'Zatrzymanie usługi', from ? `wersja ${from}` : 'pierwsza instalacja: brak usługi do zatrzymania'),
        sw: step('switch', `Przełączenie na wersję ${version}`, `katalog current → C:\\InfoSystem\\apps\\${app.name}\\${version}`),
        start: step('start', 'Uruchomienie usługi', `InfoSystem.${app.title.split(' ')[0]} na 127.0.0.1:${port}`),
        nginx: step('nginx', 'Aktualizacja konfiguracji nginx', isFirst ? `nowy prefiks ${app.prefix} → 127.0.0.1:${port}; nginx -t; przeładowanie` : 'bez zmian portu i prefiksu'),
        health: step('health', 'Sprawdzenie zdrowia'),
        report: step('report', 'Raport do InfoSystem'),
    };
    op.steps = Object.values(stSteps);
    store.update(() => { app.service = 'restarting'; });
    const plan = [
        { step: stSteps.preflight, ms: 900, logs: [`Dysk: ${fmtGb(s.site.disk.freeGb)} wolne; port ${port} wolny; sesje na bazie: ${app.sessions.length}; konto usługi: administrator`], onDone: () => { stSteps.preflight.detail = `dysk ${fmtGb(s.site.disk.freeGb)} wolne, port ${port} wolny, sesje: ${app.sessions.length}`; } },
        { step: stSteps.verify, ms: 300, outcome: () => 'skipped' },
        { step: stSteps.prestart, ms: 200, outcome: () => 'skipped' },
        { step: stSteps.stop, ms: from ? 1400 : 200, outcome: () => from ? 'ok' : 'skipped', logs: from ? [`Zatrzymano usługę InfoSystem.${app.title.split(' ')[0]} (${from})`] : [] },
        { step: stSteps.sw, ms: 400, logs: [`current → C:\\InfoSystem\\apps\\${app.name}\\${version}`] },
        { step: stSteps.start, ms: 1800, logs: [`Uruchomiono usługę (PID ${4000 + Math.floor(Math.random() * 900)}); parametry: ASPNETCORE_URLS=http://127.0.0.1:${port}, INFOSYSTEM_PATH_BASE=${app.prefix}`], onDone: () => { app.service = 'starting'; } },
        { step: stSteps.nginx, ms: isFirst ? 700 : 200, outcome: () => isFirst ? 'ok' : 'skipped', logs: isFirst ? ['nginx -t: syntax ok, test successful', 'nginx: przeładowano konfigurację bez przerwy dla pozostałych aplikacji'] : [] },
        { step: stSteps.health, ms: pv.faulty ? 2600 : 1300, outcome: () => pv.faulty ? 'failed' : 'ok', logs: pv.faulty ? ['/health: status=unhealthy (ponowienie 1/6)', '/health: status=unhealthy (ponowienie 6/6)'] : [`/health: status=healthy, appVersion=${version}, schema 41/41, database reachable (4 ms)`], onDone: () => { stSteps.health.detail = pv.faulty ? `niezdrowa: ${pv.faultReason}` : `zdrowa, wersja ${version}, schemat 41/41, baza osiągalna (4 ms)`; } },
        { step: stSteps.report, ms: 400, logs: [store.state.site.infoSystem.connected ? 'Raport wysłany do InfoSystem' : 'Brak połączenia z InfoSystem: raport zapisany w buforze'], onDone: () => { stSteps.report.detail = store.state.site.infoSystem.connected ? 'wysłano' : 'w buforze (brak połączenia)'; } },
    ];
    runPlan(op, plan, failed => {
        if (!failed) {
            store.update(() => {
                var _a;
                app.installed = version;
                app.installedAt = nowIso();
                app.service = 'running';
                app.port = port;
                app.disk.unshift({ version, installedAt: nowIso(), sizeMb: pv.sizeMb });
                app.disk = app.disk.slice(0, store.state.site.agent.keepVersions + 1);
                app.pending = app.pending.filter(p => p !== pv);
                app.health = healthyResult(version, app.dbInstance || 'localhost:3050', ((_a = app.health) === null || _a === void 0 ? void 0 : _a.jobs) || [{ name: 'cleanup', alive: true, lastRun: nowIso() }], nowIso());
                if (app.config.values['jobs.mcSyncEnabled'] === false && app.name === 'skarbowy') { /* wysyłka wyłączona do przełączenia z IIS */ }
            });
            finishOp(op, 'success', `${app.title} ${version} działa (zdrowa, schemat 41/41, baza osiągalna).`);
            toastHook(`${app.title} ${version} działa.`, 'ok');
            return;
        }
        // Automatyczne wycofanie
        const rb = [
            step('rb-stop', 'Zatrzymanie nowej wersji', `wersja ${version}`),
            step('rb-switch', `Przywrócenie wersji ${from}`, `katalog current → ${from}`),
            step('rb-start', 'Uruchomienie usługi'),
            step('rb-health', `Sprawdzenie zdrowia (${from})`),
            step('rb-report', 'Raport do InfoSystem (wycofanie)'),
        ];
        store.update(() => { stSteps.report.status = 'skipped'; stSteps.report.detail = 'zastąpiony raportem o wycofaniu'; op.steps.push(...rb); logLine(op, 'ERROR', `Sprawdzenie zdrowia nie powiodło się. Rozpoczynam wycofanie do ${from}.`); });
        const rbPlan = [
            { step: rb[0], ms: 900, logs: [`Zatrzymano usługę (${version})`] },
            { step: rb[1], ms: 400, logs: [`current → C:\\InfoSystem\\apps\\${app.name}\\${from}`] },
            { step: rb[2], ms: 1500, logs: ['Uruchomiono usługę'] },
            { step: rb[3], ms: 1000, logs: [`/health: status=healthy, appVersion=${from}`], onDone: () => { rb[3].detail = 'zdrowa'; } },
            { step: rb[4], ms: 400, logs: ['Raport o wycofaniu wysłany; utworzono zgłoszenie serwisowe SR-' + fmtDate(nowIso()).split('.').reverse().join('') + '-11'], onDone: () => { rb[4].detail = 'wysłano, zgłoszenie serwisowe utworzone'; } },
        ];
        runPlan(op, rbPlan, () => {
            const reason = `Nowa wersja nie przeszła sprawdzenia zdrowia: ${pv.faultReason}. Przywrócono ${from}, aplikacja działa.`;
            store.update(s2 => {
                var _a;
                app.service = 'running';
                app.health = healthyResult(from, app.dbInstance || 'localhost:3050', ((_a = app.health) === null || _a === void 0 ? void 0 : _a.jobs) || [], nowIso());
                pv.annotation = `Próba instalacji ${fmtDateTime(op.startedAt)} została wycofana automatycznie: ${pv.faultReason}.`;
                op.type = 'rollback-auto';
                s2.notifications.unshift({ id: 'n-' + op.id, kind: 'error', text: `Aktualizacja ${app.title} ${version} została wycofana automatycznie: ${pv.faultReason}. ${app.title} ${from} działa. Serwis został powiadomiony.`, link: `#/operacje/${op.id}`, linkLabel: 'Zobacz przebieg' });
            });
            finishOp(op, 'rolled-back', `Aktualizacja ${app.title} ${version} wycofana automatycznie. ${app.title} ${from} działa.`, reason);
            toastHook(`Aktualizacja ${app.title} ${version} wycofana. Serwis powiadomiony.`, 'danger');
        });
    });
    return op.id;
}
function startRollback(appName, toVersion, reason, actor = ACCOUNT) {
    const app = findApp(appName);
    if (!app || !app.installed)
        return null;
    if (isOperationRunning()) {
        toastHook('Trwa inna operacja. Spróbuj po jej zakończeniu.', 'warn');
        return null;
    }
    const from = app.installed;
    const op = newOp('rollback', app, actor, from, toVersion);
    logLine(op, 'INFO', `Cofnięcie ${app.title} ${from} → ${toVersion} (${actor})${reason ? '; powód: ' + reason : ''}`);
    const steps = [step('preflight', 'Sprawdzenia wstępne'), step('stop', 'Zatrzymanie usługi', `wersja ${from}`), step('switch', `Przełączenie na wersję ${toVersion}`), step('start', 'Uruchomienie usługi'), step('health', 'Sprawdzenie zdrowia'), step('report', 'Raport do InfoSystem')];
    op.steps = steps;
    store.update(() => { app.service = 'restarting'; });
    runPlan(op, [
        { step: steps[0], ms: 700, logs: [`Sesje na bazie: ${app.sessions.length}`], onDone: () => { steps[0].detail = `sesje: ${app.sessions.length}, wersja ${toVersion} obecna na dysku`; } },
        { step: steps[1], ms: 1200 }, { step: steps[2], ms: 300 }, { step: steps[3], ms: 1600 },
        { step: steps[4], ms: 1000, onDone: () => { steps[4].detail = `zdrowa, wersja ${toVersion}`; } },
        { step: steps[5], ms: 400, onDone: () => { steps[5].detail = 'wysłano (z powodem cofnięcia)'; } },
    ], () => {
        store.update(() => {
            var _a;
            app.installed = toVersion;
            app.installedAt = nowIso();
            app.service = 'running';
            app.health = healthyResult(toVersion, app.dbInstance || 'localhost:3050', ((_a = app.health) === null || _a === void 0 ? void 0 : _a.jobs) || [], nowIso());
            const d = app.disk.find(x => x.version === from);
            app.pending.unshift({ version: from, channel: 'stable', releaseDate: (d === null || d === void 0 ? void 0 : d.installedAt) || nowIso(), offeredAt: nowIso(), notes: ['Wersja była już zainstalowana w tej placówce i została cofnięta ręcznie.'], impact: { requiresRestart: true, schemaMigration: false, urgent: false }, minAgentVersion: '1.0.0', sizeMb: (d === null || d === void 0 ? void 0 : d.sizeMb) || 180, status: 'pending', annotation: `Wcześniej cofnięta przez Ciebie ${fmtDateTime(nowIso())}${reason ? ': ' + reason : ''}.` });
        });
        finishOp(op, 'success', `${app.title} ${toVersion} działa. Wersja ${from} pozostaje na dysku.`);
        toastHook(`Cofnięto ${app.title} do ${toVersion}.`, 'ok');
    });
    return op.id;
}
function startServiceRestart(appName, actor = ACCOUNT) {
    const app = findApp(appName);
    if (!app || !app.installed)
        return null;
    if (isOperationRunning()) {
        toastHook('Trwa inna operacja. Spróbuj po jej zakończeniu.', 'warn');
        return null;
    }
    const op = newOp('service-restart', app, actor, app.installed, app.installed);
    const steps = [step('stop', 'Zatrzymanie usługi'), step('start', 'Uruchomienie usługi'), step('health', 'Sprawdzenie zdrowia')];
    op.steps = steps;
    store.update(() => { app.service = 'restarting'; });
    runPlan(op, [{ step: steps[0], ms: 900 }, { step: steps[1], ms: 1500 }, { step: steps[2], ms: 900, onDone: () => { steps[2].detail = 'zdrowa'; } }], () => {
        store.update(() => { app.service = 'running'; if (app.health) {
            app.health.startedAt = nowIso();
            app.health.checkedAt = nowIso();
        } });
        finishOp(op, 'success', `${app.title} uruchomiono ponownie, zdrowa.`);
        toastHook(`${app.title}: usługa uruchomiona ponownie.`, 'ok');
    });
    return op.id;
}
function startAgentUpdate(actor = ACCOUNT) {
    const agent = findApp('agent');
    if (!agent || !agent.pending.length)
        return null;
    if (isOperationRunning()) {
        toastHook('Trwa inna operacja. Spróbuj po jej zakończeniu.', 'warn');
        return null;
    }
    const pv = agent.pending[0];
    const from = store.state.site.agent.version;
    const op = newOp('agent-update', agent, actor, from, pv.version);
    const steps = [step('verify', 'Weryfikacja pakietu agenta', 'podpis prawidłowy'), step('stop', 'Zatrzymanie panelu i usługi agenta'), step('swap', `Podmiana katalogu agenta (${from} → ${pv.version})`), step('start', `Uruchomienie agenta ${pv.version}`), step('health', 'Sprawdzenie zdrowia agenta'), step('report', 'Raport do InfoSystem')];
    op.steps = steps;
    runPlan(op, [
        { step: steps[0], ms: 500, outcome: () => 'skipped' },
        { step: steps[1], ms: 800, onDone: () => { demo.agentRestarting = true; } },
        { step: steps[2], ms: 1200 },
        { step: steps[3], ms: 1800, onDone: () => { demo.agentRestarting = false; } },
        { step: steps[4], ms: 800, onDone: () => { steps[4].detail = `agent ${pv.version} działa, panel dostępny`; } },
        { step: steps[5], ms: 400 },
    ], () => {
        store.update(s => { s.site.agent.version = pv.version; s.site.agent.available = undefined; agent.installed = pv.version; agent.installedAt = nowIso(); agent.disk.unshift({ version: pv.version, installedAt: nowIso(), sizeMb: pv.sizeMb }); agent.disk = agent.disk.slice(0, 3); agent.pending = []; s.notifications = s.notifications.filter(n => n.id !== 'n-agent'); });
        finishOp(op, 'success', `Site Agent ${pv.version} działa. Aplikacje pracowały bez przerwy.`);
        toastHook(`Site Agent zaktualizowany do ${pv.version}.`, 'ok');
    });
    return op.id;
}
function startPortChange(port, actor = ACCOUNT) {
    if (isOperationRunning()) {
        toastHook('Trwa inna operacja. Spróbuj po jej zakończeniu.', 'warn');
        return null;
    }
    const s = store.state;
    const op = newOp('port-change', { name: 'nginx', title: 'nginx' }, actor, String(s.site.nginx.port), String(port));
    const steps = [step('check', `Sprawdzenie portu ${port}`), step('conf', 'Nowa konfiguracja nginx (nginx -t)'), step('reload', 'Przeładowanie nginx'), step('report', 'Raport do InfoSystem')];
    op.steps = steps;
    runPlan(op, [{ step: steps[0], ms: 700, onDone: () => { steps[0].detail = `port ${port} wolny`; } }, { step: steps[1], ms: 600, onDone: () => { steps[1].detail = 'syntax ok, test successful'; } }, { step: steps[2], ms: 500 }, { step: steps[3], ms: 400 }], () => {
        store.update(st => { st.site.nginx.port = port; });
        finishOp(op, 'success', `nginx nasłuchuje na porcie ${port}. Nowy adres dla operatorów: ${operatorsAddress()}`);
        toastHook('Zmieniono port nginx. Poinformuj operatorów o nowym adresie.', 'ok');
    });
    return op.id;
}
function recordEvent(type, app, summary, extra = {}, actor = ACCOUNT) {
    const op = { id: nextOpId(), type, app: app ? app.name : 'site', appTitle: app ? app.title : 'Placówka', actor, startedAt: nowIso(), finishedAt: nowIso(), result: 'done', steps: [], log: [], reported: store.state.site.infoSystem.connected ? 'sent' : 'buffered', summary, ...extra };
    store.update(s => { s.operations.unshift(op); if (!s.site.infoSystem.connected)
        s.site.infoSystem.buffered++; });
    return op;
}
function rejectVersion(appName, version, reason, remind) {
    const app = findApp(appName);
    const pv = app.pending.find(p => p.version === version);
    store.update(() => { pv.status = 'rejected'; pv.rejected = { at: nowIso(), by: ACCOUNT, reason }; });
    recordEvent('reject', app, `Odrzucono ${app.title} ${version}: „${reason}”. Powód przekazany serwisowi.${remind ? ' Przypomnienie za 7 dni.' : ''}`, { toVersion: version });
}
function reconsiderVersion(appName, version) {
    const app = findApp(appName);
    const pv = app.pending.find(p => p.version === version);
    store.update(() => { pv.status = 'pending'; pv.rejected = undefined; pv.scheduledAt = undefined; });
    recordEvent('reconsider', app, `Wersja ${app.title} ${version} wróciła do oczekujących na decyzję.`, { toVersion: version });
}
function scheduleVersion(appName, version, at, defer) {
    const app = findApp(appName);
    const pv = app.pending.find(p => p.version === version);
    store.update(() => { pv.status = 'scheduled'; pv.scheduledAt = at; pv.deferOnSessions = defer; });
    recordEvent('schedule', app, `Zaplanowano ${app.title} ${version} na ${fmtDayDateTime(at)}${defer ? ' (odłożenie przy aktywnych sesjach: do 3 razy po 30 min)' : ''}.`, { toVersion: version });
}
function unscheduleVersion(appName, version) {
    const app = findApp(appName);
    const pv = app.pending.find(p => p.version === version);
    store.update(() => { pv.status = 'pending'; pv.scheduledAt = undefined; });
    recordEvent('unschedule', app, `Anulowano plan instalacji ${app.title} ${version}. Wersja czeka na decyzję.`, { toVersion: version });
}
function setPolicy(appName, policy) {
    const app = findApp(appName);
    store.update(() => { app.policy = policy; });
    const days = policy.days.map(d => DAY_SHORT[d]).join(', ');
    recordEvent('policy', app, policy.enabled ? `Włączono automatyczną instalację dla ${app.title}: ${days} ${policy.from}–${policy.to}${policy.skipOnSessions ? ', pomijanie przy aktywnych sesjach' : ''}. Widoczne dla serwisu.` : `Wyłączono automatyczną instalację dla ${app.title}.`);
}
// ---------- Scenariusze ----------
let bootstrapStarted = false;
function loadScenario(key) {
    demo.scenario = key;
    demo.override = 'none';
    demo.agentRestarting = false;
    opQueue.length = 0;
    bootstrapStarted = false;
    store.state = buildScenario(key);
    store.emit();
}
function startBootstrap() {
    if (bootstrapStarted)
        return;
    bootstrapStarted = true;
    const steps = store.state.site.bootstrap;
    if (steps.every(s => s.status === 'ok'))
        return;
    let i = 0;
    const next = () => {
        if (i >= steps.length) {
            store.update(s => { s.site.nginx.state = 'running'; });
            return;
        }
        const st = steps[i++];
        store.update(() => { st.status = 'running'; });
        setTimeout(() => { store.update(() => { st.status = 'ok'; if (st.key === 'nginx')
            store.state.site.nginx.state = 'running'; }); next(); }, 650 + Math.random() * 500);
    };
    setTimeout(next, 400);
}
// ---------- Logi przykładowe ----------
function fakeLogs(source, minutes) {
    const out = [];
    const n = Math.min(40, Math.max(6, Math.round(minutes / 1.5)));
    for (let i = n; i >= 0; i--) {
        const t = fmtTime(new Date(nowDate().getTime() - i * (minutes * 60000 / n)).toISOString());
        if (source === 'agent') {
            const pool = [`[INFO] Odpytanie desired state: bez zmian (${pendingDecisions().length} oczekujące)`, '[INFO] Nadzór usług: wszystkie usługi działają', '[INFO] Health: skarbowy healthy (4 ms), cru healthy (3 ms), ksef healthy (5 ms), eauta healthy (4 ms)', '[INFO] Raport stanu wysłany do InfoSystem (HTTP 202)', '[WARN] Pobieranie pakietu wznowione po przerwie łącza (fragment 12/40)', '[INFO] Panel lokalny: żądanie GET /api/apps (127.0.0.1)'];
            out.push(`${t} ${pool[(i * 7) % pool.length]}`);
        }
        else if (source === 'nginx') {
            const pool = ['127.0.0.1 "GET /cru/api/registry?page=1" 200 12 ms', '10.0.0.41 "GET /skarbowy/" 200 3 ms', '10.0.0.52 "POST /eauta/api/vehicles/search" 200 48 ms', '10.0.0.41 "GET /ksef/api/invoices/outbox" 200 9 ms', '[notice] signal process started (reload)', '10.0.0.77 "GET /skarbowy/api/liabilities/export" 200 211 ms'];
            out.push(`${t} ${pool[(i * 5) % pool.length]}`);
        }
        else {
            const pool = ['[INF] Request finished GET /api/health in 3 ms', '[INF] Zadanie w tle wykonane: cleanup (usunięto 0 wpisów)', '[INF] Połączenie z bazą: pula 2/10', '[WRN] Zapytanie trwało 1,9 s: lista zobowiązań (12 304 pozycji)', '[INF] Zadanie w tle wykonane: outbox (wysłano 3, w kolejce 0)', '[INF] Request finished GET /api/me in 6 ms'];
            out.push(`${t} ${pool[(i * 3) % pool.length]}`);
        }
    }
    return out;
}
