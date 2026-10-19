// Router i start aplikacji.

interface Route { name: string; params: Record<string, string>; query: URLSearchParams; }

function parseRoute(): Route {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  const seg = path.split('/').filter(Boolean);
  const query = new URLSearchParams(qs || '');
  const p: Record<string, string> = {};
  if (seg.length === 0) return { name: 'default', params: p, query };
  switch (seg[0]) {
    case 'start': return { name: 'start', params: p, query };
    case 'pulpit': return { name: 'pulpit', params: p, query };
    case 'aplikacje':
      if (seg.length === 1) return { name: 'aplikacje', params: p, query };
      p.app = decodeURIComponent(seg[1]);
      if (seg.length === 2) return { name: 'aplikacja', params: p, query };
      if (seg[2] === 'decyzja' && seg[3]) { p.version = decodeURIComponent(seg[3]); return { name: 'decyzja', params: p, query }; }
      if (seg[2] === 'konfiguracja') return { name: seg[3] === 'import' ? 'import' : 'konfiguracja', params: p, query };
      return { name: 'aplikacja', params: p, query };
    case 'operacje':
      if (seg.length === 1) return { name: 'operacje', params: p, query };
      p.id = decodeURIComponent(seg[1]); return { name: 'operacja', params: p, query };
    case 'diagnostyka': return { name: 'diagnostyka', params: p, query };
    case 'ustawienia': return { name: 'ustawienia', params: p, query };
    case 'pomoc': return { name: 'pomoc', params: p, query };
    default: return { name: 'notfound', params: p, query };
  }
}

function defaultRoute(): string {
  const s = store.state;
  return demo.scenario === 'fresh' && !s.site.wizardDismissed ? '#/start' : '#/pulpit';
}

// Który element nawigacji podświetlić dla trasy.
function navKey(route: Route): string {
  switch (route.name) {
    case 'start': return 'pulpit';
    case 'aplikacja': case 'decyzja': case 'konfiguracja': case 'import': return 'aplikacje';
    case 'operacja': return 'operacje';
    default: return route.name;
  }
}

let lastRouteKey = '';
function render(): void {
  const route = parseRoute();
  if (route.name === 'default') { location.replace(defaultRoute()); return; }
  const root = document.getElementById('app')!;
  const prevMain = document.getElementById('main');
  const scrollTop = prevMain ? prevMain.scrollTop : 0;
  const routeKey = location.hash;

  let content: HTMLElement;
  try {
    switch (route.name) {
      case 'start': content = viewStart(); break;
      case 'pulpit': content = viewDashboard(); break;
      case 'aplikacje': content = viewApps(route.query); break;
      case 'aplikacja': content = viewApp(route.params.app, route.query.get('karta') || 'przeglad'); break;
      case 'decyzja': content = viewDecision(route.params.app, route.params.version); break;
      case 'konfiguracja': content = viewConfig(route.params.app, route.query); break;
      case 'import': content = viewImport(route.params.app); break;
      case 'operacje': content = viewOperations(route.query); break;
      case 'operacja': content = viewOperation(route.params.id); break;
      case 'diagnostyka': content = viewDiagnostics(route.query); break;
      case 'ustawienia': content = viewSettings(route.query); break;
      case 'pomoc': content = viewHelp(); break;
      default: content = h('div', { class: 'page' }, pageHeader('Nie znaleziono strony'), card(null, emptyState('Nie ma takiego ekranu.', btn('Pulpit', { href: '#/pulpit' }))));
    }
  } catch (e) {
    content = h('div', { class: 'page' }, pageHeader('Błąd mockupu'), card(null, errorState(`Wystąpił błąd w kodzie mockupu: ${(e as Error).message}`, () => { demo.override = 'none'; go('#/pulpit'); })));
    console.error(e);
  }
  root.replaceChildren(renderShell(content, route.name === 'operacja' ? 'operacja' : navKey(route)));
  // Zaznaczenie w nawigacji bocznej: „operacja” to podstrona Operacji.
  if (route.name === 'operacja') { const a = root.querySelector('.sidebar a[href="#/operacje"]'); if (a) a.classList.add('active'); }
  const main = document.getElementById('main');
  if (main) main.scrollTop = routeKey === lastRouteKey ? scrollTop : 0;
  lastRouteKey = routeKey;
}

rerender = render;
store.subscribe(render);
window.addEventListener('hashchange', () => { if (demo.override !== 'none') demo.override = 'none'; render(); });
window.addEventListener('DOMContentLoaded', () => { if (!location.hash) location.replace(defaultRoute()); render(); });
