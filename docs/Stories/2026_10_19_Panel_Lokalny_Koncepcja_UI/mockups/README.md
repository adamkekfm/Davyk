# Mockupy panelu lokalnego (HTML/CSS/TypeScript)

Klikalne mockupy wszystkich ekranów z `../03-mapa-ekranow-i-nawigacja.md` i `../04-specyfikacja-ekranow.md`, z symulacją działań agenta (instalacja krok po kroku, automatyczne wycofanie, samoaktualizacja, zmiana portu).

## Uruchomienie

Otwórz `index.html` w przeglądarce. Działa z dysku, bez serwera i bez internetu (żadnych bibliotek zewnętrznych). Jeśli przeglądarka blokuje skrypty z `file://`, uruchom dowolny serwer statyczny w tym katalogu, np.:

```bash
npx -y http-server . -p 8765 -c-1
```

## Panel Demo (prawy dolny róg)

| Element | Działanie |
|---|---|
| Scenariusz danych | **Pierwsze uruchomienie**: kreator startowy, 4 aplikacje do konfiguracji i instalacji. **Praca bieżąca**: 4 aplikacje działają, 3 aktualizacje i samoaktualizacja agenta czekają. **Brak połączenia z InfoSystem**: agent offline, raporty w buforze. **Po automatycznym wycofaniu**: KSeF 3.2.0 wycofana po niezdrowym `health` |
| Wymuś stan ekranu | ładowanie / pusty / błąd dla bieżącego ekranu (stany z punktu 4 specyfikacji); ekrany E0, E4, E6, E7 mają stany własne (np. błąd rejestracji, nieznane sesje, baza CI nieosiągalna, zły klucz) |

Celowe zachowania demonstracyjne: instalacja KSeF 3.2.0 kończy się automatycznym wycofaniem (A6); klucz do przykładowego pakietu konfiguracji to `ABCD-EFGH-JKLM-NPQR`; w formularzu konfiguracji serwer bazy zawierający `zly` lub port `3051` daje nieudany test połączenia; w Ustawieniach → Port i adres jest przycisk symulujący zwolnienie portu 443.

## Ścieżki do przeklikania

1. **Pierwsza instalacja**: scenariusz „Pierwsze uruchomienie” → kreator → Przejdź do konfiguracji → Importuj pakiet od serwisu (klucz wyżej) → Zastosuj → uzupełnij pola oznaczone → Zapisz → Przejdź do instalacji → Zainstaluj teraz → przebieg operacji.
2. **Bramka 2**: Pulpit → Zdecyduj (mObywatel 4.2.0) → sprawdzenia (3 aktywne sesje) → Zainstaluj teraz → okno z sesjami → Instaluj / Zaplanuj na później.
3. **Zaplanowanie i anulowanie**: Zaplanuj → sobota 06:00 → Pulpit sekcja „Zaplanowane” → Zmień termin / Anuluj plan.
4. **Odrzucenie z powodem**: Zdecyduj (CRU 2.4.0, kanał pilotażowy, migracja bazy) → Odrzuć → powód → Aplikacje / CRU / Wersje → Rozważ ponownie.
5. **Automatyczne wycofanie**: Zdecyduj (KSeF 3.2.0) → Zainstaluj teraz → kroki, log, wynik „Wycofano”, baner na pulpicie, zgłoszenie serwisowe.
6. **Cofnięcie ręczne**: Aplikacje / eAuta / Wersje → Cofnij do 1.7.3 → przebieg → wersja 1.8.0 wraca do udostępnionych.
7. **Samoaktualizacja agenta**: baner „Site Agent 1.0.4” → Zdecyduj → Zainstaluj teraz → nakładka „Agent uruchamia się ponownie”.
8. **Konfiguracja**: Aplikacje / mObywatel / Konfiguracja → zmień port na 3051 → Testuj połączenie (ostrzeżenie o dialekcie) → włącz „Wysyłka do MC” (pytanie o IIS) → Zapisz → pytanie o restart.
9. **Diagnostyka**: Połączenie → Testuj teraz (w scenariuszu offline krok DNS kończy się błędem); Sesje na bazach; Logi; Zasoby i certyfikat.
10. **Ustawienia**: Port i adres → symuluj wolny 443 → Przełącz na 443 → przebieg; Automatyczna instalacja → Włącz dla CRU; Agent → Zatrzymaj.
11. **Pomoc**: co robi agent, jak go wyłączyć.

## Struktura

```
index.html            szkielet strony, ładuje dist/*.js w kolejności
styles.css            arkusz stylów (neutralna identyfikacja)
tsconfig.json         kompilacja: skrypty globalne (bez modułów), ES2019, strict
src/01-types.ts       model danych
src/02-data.ts        dane przykładowe, scenariusze, magazyn stanu, symulacja agenta, walidacje
src/03-ui.ts          budowanie DOM, komponenty (karty, tabele, plakietki, modale, toasty, stany)
src/04-shell.ts       pasek górny, nawigacja, banery, panel demo
src/05-views-dashboard.ts   E0 kreator, E1 pulpit, E2 lista aplikacji
src/06-views-app.ts   E3 szczegóły aplikacji, E4 decyzja + okna, E5 przebieg operacji
src/07-views-config.ts      E6 konfiguracja, E7 import pakietu
src/08-views-ops.ts   E8 operacje, E9 diagnostyka, E10 ustawienia, E11 pomoc
src/09-app.ts         router (hash), start
dist/                 skompilowany JavaScript (załączony, żeby mockup działał bez kompilacji)
```

Kompilacja po zmianach (TypeScript 5; wersja 7 nie obsługuje skryptów globalnych bez modułów):

```bash
npx -y -p typescript@5 tsc -p tsconfig.json
```

Mockup nie zawiera backendu: „endpointy” ze specyfikacji są symulowane w `02-data.ts` (funkcje `startInstall`, `startRollback`, `startAgentUpdate`, `startPortChange`, `recordEvent`).
