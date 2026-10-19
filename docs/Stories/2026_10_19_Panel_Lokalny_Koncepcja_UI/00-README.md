# Panel lokalny Site Agenta: wstępna koncepcja UI dla informatyka urzędu

| | |
|---|---|
| **Data** | 19 października 2026 |
| **Status** | Szkic v0.1 do przeglądu |
| **Zakres** | Wyłącznie interfejs informatyka urzędu (panel lokalny agenta, bramka 2). Widok serwisu, źródło artefaktów, pipeline i back office są poza zakresem tej koncepcji |
| **Źródła** | `../2026_10_18_Product_Shaping/2026-10-19-wymagania-site-agent.md` (P1–P6, A1–A9, I9, M5, M6, S2–S4), `2026-10-19-stan-projektu-i-architektura-mvp.md` (7.4 „Panel lokalny”, 7.9 przepływy, 7.11 współistnienie z IIS), `2026-10-19-kontrakt-aplikacji-wobec-platformy.md` (manifest, `GET /health`) |
| **Benchmark** | Octopus Deploy jako wzorzec funkcji i przepływów: tablica stanu wdrożeń, strona wydania z notatkami i podglądem skutków, log zadania krok po kroku, ręczna interwencja (zatwierdź lub odrzuć z powodem), wdrożenie zaplanowane, ponowne wdrożenie poprzedniej wersji, dziennik audytu. Bez identyfikacji wizualnej, treści i kodu Octopusa |

## Zawartość

| Plik | Treść |
|---|---|
| `01-uzytkownicy-i-potrzeby.md` | Użytkownicy systemu, którzy z nich korzystają z panelu, ich potrzeby i konsekwencje dla UI |
| `02-use-casey-i-przeplywy.md` | 14 przypadków użycia z kompletnymi przepływami (przebieg główny, wyjątki, rezultat, ślad do wymagań) |
| `03-mapa-ekranow-i-nawigacja.md` | Drzewo ekranów, model nawigacji, trasy, diagram przejść |
| `04-specyfikacja-ekranow.md` | Dla każdego ekranu: cel, funkcje, komponenty, stany (ładowanie, pusty, błąd, sukces), walidacje, endpointy lokalnego API agenta; na końcu zbiorcza tabela API |
| `mockups/` | Klikalne mockupy HTML/CSS/TypeScript obejmujące wszystkie kluczowe ścieżki |

## Jak otworzyć mockupy

1. Otwórz `mockups/index.html` w przeglądarce (działa z dysku, bez serwera).
2. Prawy dolny róg: panel **Demo**. Wybór scenariusza zmienia dane startowe:
   - **Pierwsze uruchomienie**: tuż po instalacji MSI, nic nie zainstalowane, brak konfiguracji (kreator startowy).
   - **Praca bieżąca**: 4 aplikacje działają, 3 aktualizacje czekają na decyzję, samoaktualizacja agenta.
   - **Brak połączenia z InfoSystem**: agent offline, panel działa, raporty buforowane.
   - **Po automatycznym wycofaniu**: ostatnia aktualizacja KSeF wycofana po niezdrowym `health`.
3. Panel Demo pozwala też wymusić stan bieżącego ekranu: **ładowanie**, **pusty**, **błąd**, co pokazuje stany z punktu 4 specyfikacji.
4. Instalacja aktualizacji KSeF 3.2.0 w scenariuszu „Praca bieżąca” kończy się celowo automatycznym wycofaniem (demonstracja A6).

Źródła TypeScript są w `mockups/src/`, skompilowany skrypt w `mockups/dist/app.js`. Kompilacja: `npx -p typescript tsc -p mockups/tsconfig.json`.

## Założenia tej koncepcji

- Panel jest hostowany przez agenta na `127.0.0.1`; dostęp równa się sesji na serwerze (RDP). W MVP bez logowania i bez ról; nazwa konta Windows trafia do audytu (P1, M5).
- Język polski, bez żargonu platformy (Tier, desired state, provider). W UI mówimy: „aplikacja”, „wersja udostępniona”, „zainstaluj”, „zaplanuj”, „odrzuć”, „cofnij”, „serwis InfoSystem” (P6).
- Agent nigdy nie instaluje bez kliknięcia informatyka albo bez włączonej przez niego polityki „instaluj automatycznie w oknie” (A1, A3). Każdy ekran, który kończy się instalacją, ma jawny krok potwierdzenia.
- Nazwy endpointów lokalnego API agenta są **propozycją** do uzgodnienia z projektem agenta; API wobec InfoSystem (`/v1/sites/...`) jest poza zakresem i pojawia się tylko tam, gdzie panel pokazuje jego skutki (test połączenia, stan raportów).
- Zdania oznaczone **propozycja** wychodzą poza ustalenia w dokumentach źródłowych.
