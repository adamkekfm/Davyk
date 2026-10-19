# 4. Specyfikacja ekranów

Dla każdego ekranu: cel, dostępne funkcje, komponenty UI, stany (ładowanie, pusty, błąd, sukces), walidacje, powiązane endpointy lokalnego API agenta. Endpointy są **propozycją**; wszystkie są na `http://127.0.0.1:<port>/api/`, bez uwierzytelnienia (dostęp = sesja na serwerze), z nagłówkiem `X-Windows-Account` ustawianym przez agenta z tożsamości procesu przeglądarki (**propozycja**; alternatywa: agent czyta właściciela sesji przez Negotiate na loopback). Błędy w formacie RFC 9457 (`application/problem+json`) z polem `title` po polsku do pokazania w UI.

Wspólne konwencje stanów:

| Stan | Wzorzec |
|---|---|
| **Ładowanie** | Szkielety (szare prostokąty) w miejscu danych, nagłówek i nawigacja widoczne od razu; po 5 s dopisek „Trwa dłużej niż zwykle…”; nigdy pełnoekranowy spinner poza E0 |
| **Pusty** | Ikona, jedno zdanie, co to znaczy, i jedna akcja, jeśli istnieje („Brak oczekujących decyzji. Agent sprawdza nowe wersje co 15 minut.”) |
| **Błąd** | Pasek z `title` z API, przycisk **Spróbuj ponownie**, link „Zobacz logi agenta” (→ E9.4); błąd części ekranu nie ukrywa reszty |
| **Sukces** | Powiadomienie w rogu (3 s) dla zapisów; dla operacji trwałych (instalacja) pełny ekran wyniku na E5 |

---

## E0. Pierwsze uruchomienie (kreator startowy)

**Cel.** Pokazać informatykowi, że instalacja MSI zadziałała, co agent robi w pierwszych minutach, i doprowadzić do pierwszej konfiguracji. Spełnia K1 (poniżej 10 minut, bez pomocy serwisu).

**Funkcje.** Podgląd kroków startowych na żywo; ponowienie kroku po błędzie; wpisanie nowego tokenu; przejście do konfiguracji lub pulpitu; link do E11.

**Komponenty.** Nagłówek z nazwą placówki (po rejestracji) i serwera; lista kroków (ikona stanu, nazwa, szczegół, czas); karta „Co dalej” z adresem dla operatorów i dwoma przyciskami; stopka „Ten kreator nie wykona żadnej instalacji aplikacji bez Twojej zgody”.

| Krok | Szczegół pokazywany | Źródło |
|---|---|---|
| Rejestracja placówki w InfoSystem | „Placówka: Urząd Gminy …, identyfikator …” | D1 |
| Pobranie listy udostępnionych aplikacji | „4 aplikacje w kanale stabilnym” | D2 |
| Pobranie i weryfikacja pakietu platformy | „nginx 1.26.2, podpis prawidłowy” | D4 |
| Instalacja nginx | „Port 443 zajęty (IIS). Wybrano 8443.” | I2, I6 |
| Certyfikat TLS | „Wygenerowano certyfikat dla srv-urzad i localhost, ważny do …” | I7 |
| Baza konfiguracji (CI) | „Utworzono C:\InfoSystem\ci\ci.fdb” lub „Istniejąca baza CI wykryta” | I8 |
| Pobranie 4 aplikacji | per aplikacja: wersja, podpis prawidłowy | D3, D4 |

**Stany.**

| Stan | Zachowanie |
|---|---|
| Ładowanie | Pierwsze żądanie: pełnoekranowe „Łączenie z usługą agenta…” (jedyny ekran z takim stanem); potem kroki pojawiają się jako „oczekuje” |
| Pusty | Nie dotyczy (kreator zawsze ma kroki); gdy wszystko wykonane wcześniej, przekierowanie do E1 |
| Błąd | Krok w stanie ✗ z komunikatem i akcją (**Sprawdź ponownie**, **Wpisz nowy token**, lista hostów do allow‑listy); pozostałe kroki „oczekuje”; brak połączenia z agentem: stan globalny (3.5) |
| Sukces | Wszystkie kroki ✓; karta „Co dalej” aktywna; po zamknięciu kreator nie wraca (flaga w `site.json`) |

**Walidacje.** Token: 32–64 znaki alfanumeryczne lub format `XXXX-XXXX-XXXX-XXXX-XXXX`; puste pole blokuje przycisk.

**Endpointy.** `GET /api/site` (stan placówki, `bootstrap.steps[]`), `POST /api/site/bootstrap/retry` (`{ step, token? }`), `GET /api/diagnostics/connectivity`, `POST /api/site/bootstrap/dismiss`.

---

## E1. Pulpit

**Cel.** Odpowiedzieć w 10 s na trzy pytania: czy wszystko działa, co wymaga mojej decyzji, co się ostatnio wydarzyło (P2, N4).

**Funkcje.** Przejście do decyzji; przejście do aplikacji; kopiowanie adresu dla operatorów; zamknięcie banera; „Zainstaluj wszystkie skonfigurowane” (tylko gdy ≥2 aplikacje czekają na pierwszą instalację i mają kompletną konfigurację, **propozycja**); zmiana terminu lub anulowanie zaplanowanych.

**Komponenty.**

| Komponent | Treść |
|---|---|
| Baner zdarzeń | Wycofanie automatyczne, brak połączenia, usługa w pętli restartów, pakiet czeka na nowszego agenta; każdy z linkiem i przyciskiem zamknięcia |
| Pasek stanu placówki | 5 kafelków: InfoSystem (ostatni kontakt), nginx (działa, port), adres dla operatorów (kopiuj), dysk (wolne / ostrzeżenie poniżej 2 GB), agent (wersja, „aktualna” / „dostępna 1.0.4”) |
| **Wymaga Twojej decyzji** | Lista: ikona aplikacji, „CRU 2.3.1 → 2.4.0”, kanał, plakietki wpływu (restart / migracja bazy / pilne), „czeka od 2 dni”, przycisk **Zdecyduj**; pozycje agenta oznaczone „składnik platformy” |
| **Zaplanowane** | „KSeF 3.2.0, sobota 24.10 06:00” z **Zmień termin** i **Anuluj** |
| **Aplikacje** | Siatka kart (4 w rzędzie przy 1280 px): nazwa, wersja, stan usługi (kropka + tekst), `health` (zdrowa / obniżona / niezdrowa / nie sprawdzono), polityka auto (jeśli włączona), ostatnia operacja (data, wynik); klik → E3 |
| **Ostatnie operacje** | Tabela 5 wierszy: kiedy, co, kto, wynik; link „Wszystkie” → E8 |

**Stany.**

| Stan | Zachowanie |
|---|---|
| Ładowanie | Szkielety kafelków i kart; nagłówek od razu |
| Pusty | Brak decyzji: „Brak oczekujących decyzji. Agent sprawdza nowe wersje co 15 minut (ostatnio 14:02).” Brak aplikacji zainstalowanych (po E0): karty w stanie „gotowa do instalacji” z plakietką „brakuje konfiguracji” lub „skonfigurowana” i przyciskiem **Skonfiguruj** / **Zainstaluj** |
| Błąd | Sekcja, której nie udało się pobrać, pokazuje własny pasek błędu; reszta działa; brak połączenia z agentem: stan globalny |
| Sukces | Powiadomienia po akcjach (zaplanowano, skopiowano, anulowano plan) |

**Walidacje.** Zmiana terminu: jak E4.a.

**Endpointy.** `GET /api/site`, `GET /api/apps` (lista z `installed`, `pending`, `scheduled`, `health`, `policy`, `lastOperation`), `GET /api/operations?limit=5`, `GET /api/notifications` i `POST /api/notifications/{id}/dismiss`, `DELETE /api/apps/{app}/schedule`, `POST /api/apps/{app}/install-all` (**propozycja**).

---

## E2. Aplikacje (lista)

**Cel.** Pełna tabela aplikacji i składników platformy z możliwością filtrowania; punkt wejścia do E3 i E4.

**Funkcje.** Filtr (wszystkie / oczekujące decyzji / z problemami / zaplanowane); sortowanie; przejście do szczegółów; **Zdecyduj**; miejsce na „Importuj pakiet z pliku” (po MVP, przycisk nieaktywny z podpowiedzią „dostępne w przyszłej wersji”).

**Komponenty.** Pasek filtrów (segmenty); tabela: aplikacja, prefiks adresu (`/cru/`), wersja zainstalowana, stan usługi, zdrowie, wersja udostępniona (z plakietkami wpływu), polityka, akcje (**Zdecyduj** / **Szczegóły**); wiersz „Site Agent i nginx” jako składnik platformy.

**Stany.** Ładowanie: szkielet tabeli. Pusty po filtrze: „Brak aplikacji spełniających filtr” + **Wyczyść filtr**. Błąd: pasek nad tabelą. Sukces: nie dotyczy.

**Walidacje.** Brak.

**Endpointy.** `GET /api/apps?filter=pending|problems|scheduled`.

---

## E3. Aplikacja: szczegóły

**Cel.** Jedno miejsce dla wszystkiego, co dotyczy jednej aplikacji: stan, wersje i decyzje, konfiguracja, zdrowie i logi, historia.

**Funkcje per karta.**

| Karta | Funkcje |
|---|---|
| **Przegląd** | Stan usługi (działa od…, PID, port loopback, prefiks, adres dla operatorów `https://srv-urzad:8443/cru/`), ostatni `health` po polsku, wersja bieżąca i data instalacji, przyciski: **Uruchom ponownie usługę** (potwierdzenie z sesjami), **Zatrzymaj**, **Otwórz w przeglądarce**; przełącznik polityki auto (→ UC10); notatka IT (wolny tekst, lokalnie, **propozycja**) |
| **Wersje** | Sekcja „Udostępnione” (oczekujące z **Zdecyduj**, zaplanowane z **Zmień termin**/**Anuluj**, odrzucone z **Rozważ ponownie**), sekcja „Na dysku” (bieżąca, poprzednie z **Cofnij do tej wersji**, rozmiar, data), miejsce na „Uruchom wersję testową obok” (po MVP, nieaktywne) |
| **Konfiguracja** | E6 osadzone |
| **Zdrowie i logi** | Wynik `health` w pełnej formie (tabela pól), zadania w tle, baza; logi aplikacji (ostatnie 15 min, filtr, kopiuj, pobierz); **Sprawdź teraz** |
| **Historia** | E8 przefiltrowane do tej aplikacji |

**Komponenty.** Nagłówek z nazwą, plakietkami stanu, przyciskiem **Zdecyduj** (jeśli coś czeka); zakładki; w karcie Wersje lista z osią czasu.

**Stany.**

| Stan | Zachowanie |
|---|---|
| Ładowanie | Nagłówek z nazwą od razu (z trasy), zakładki aktywne, treść szkieletowa |
| Pusty | Wersje: „Brak udostępnionych wersji; zainstalowana jest najnowsza w kanale stabilnym”; Na dysku: „Brak poprzedniej wersji” (ukryty przycisk cofnięcia); Historia: „Brak operacji” |
| Błąd | Nieznana aplikacja w trasie: „Nie ma takiej aplikacji” + link do E2; health niedostępny: „Aplikacja nie odpowiada na sprawdzenie zdrowia” z przyciskiem **Uruchom ponownie usługę** |
| Sukces | Po restarcie usługi: powiadomienie „CRU uruchomiono ponownie, zdrowa” |

**Walidacje.** Notatka: maks. 2000 znaków. Polityka auto: patrz E10.3.

**Endpointy.** `GET /api/apps/{app}`, `GET /api/apps/{app}/versions`, `GET /api/apps/{app}/health?refresh=true`, `POST /api/apps/{app}/service/restart`, `POST /api/apps/{app}/service/stop`, `POST /api/apps/{app}/service/start`, `PUT /api/apps/{app}/policy`, `POST /api/apps/{app}/rollback` (`{ toVersion, reason? }`), `POST /api/apps/{app}/pending/{version}/reconsider`, `GET /api/logs/{app}?minutes=15&level=`, `PUT /api/apps/{app}/note`.

---

## E4. Decyzja o aktualizacji (bramka 2)

**Cel.** Jedyny ekran, z którego może rozpocząć się instalacja. Daje informatykowi komplet informacji do świadomej zgody (A1, A2, A7, I9).

**Funkcje.** Zainstaluj teraz; Zaplanuj; Odrzuć; Dodaj do kolejki (gdy inna operacja trwa); Uzupełnij konfigurację; Ponów sprawdzenia; link do decyzji o agencie (gdy agent zbyt stary).

**Komponenty.**

| Sekcja | Treść |
|---|---|
| Nagłówek | „CRU: aktualizacja 2.3.1 → 2.4.0”, kanał (stabilny / pilotażowy), data wydania, „udostępniona przez serwis 17.10” |
| **Co się zmieni** | Notatki wydania (markdown z manifestu, ograniczony: nagłówki, listy, pogrubienie, bez obrazów i skryptów); plakietki wpływu z opisem: „Wymaga restartu usługi: przerwa ok. 1 min dla operatorów CRU”, „Bez zmian w bazie” / „Migracja bazy: serwis wykona ją ręcznie przed instalacją; nie instaluj, dopóki serwis nie potwierdzi”, „Pilne: zmiana prawa od 1.11” |
| **Sprawdzenia przed instalacją** | Lista z ikonami: miejsce na dysku (potrzebne 180 MB, wolne 14,2 GB ✓), aktywne sesje na bazie CRU (3 ⚠ z rozwijaną listą: użytkownik, komputer, od kiedy), port loopback (5102 wolny ✓), uprawnienia konta usługi ✓, wersja agenta (1.0.3, wymagane ≥1.0.0 ✓), konfiguracja kompletna ✓ / ⚠ „brakuje 2 pól”; przycisk **Sprawdź ponownie**; czas sprawdzenia |
| **Co zrobi agent** | Numerowana lista kroków; zdanie o automatycznym wycofaniu; szacowany czas; „Pozostałe aplikacje działają bez przerwy” |
| Pasek akcji (przyklejony na dole) | **Zainstaluj teraz** (główny), **Zaplanuj**, **Odrzuć**, **Anuluj** (powrót) |

**Okna dialogowe.**

| Okno | Pola | Walidacje |
|---|---|---|
| E4.a Zaplanuj | Data (kalendarz), godzina (krok 15 min), skróty („jutro 06:00”, „sobota 06:00”), ptaszek „odłóż o 30 min przy aktywnych sesjach (maks. 3 razy)”, informacja o czasie serwera | Termin w przyszłości; nie dalej niż 30 dni (**propozycja**); godzina w formacie HH:MM |
| E4.b Odrzuć | Powód (lista), pole tekstowe, ptaszek „przypomnij za 7 dni”, ostrzeżenie dla `urgent` | Tekst wymagany przy „Inny powód”, 5–500 znaków |
| E4.c Potwierdzenie przy aktywnych sesjach | Lista sesji, przerwa, przyciski **Instaluj** / **Zaplanuj na później** / **Anuluj** | – |

**Stany.**

| Stan | Zachowanie |
|---|---|
| Ładowanie | Nagłówek i notatki od razu (z cache listy), sprawdzenia jako „sprawdzam…” z pulsującymi ikonami; akcje nieaktywne do zakończenia sprawdzeń |
| Pusty | Decyzja już podjęta (zainstalowana, odrzucona, wersja wycofana przez serwis): karta „Ta decyzja została już podjęta: … przez … o …” z linkiem do E3 i E5 |
| Błąd | Sprawdzenie nie powiodło się technicznie (np. brak dostępu do `MON$ATTACHMENTS`): ikona „?” z opisem „Nie udało się sprawdzić sesji: brak uprawnień do bazy. Możesz kontynuować na własną odpowiedzialność.”; instalacja dozwolona z dodatkowym potwierdzeniem. Sprawdzenie ✗ (dysk, uprawnienia, agent, konfiguracja): **Zainstaluj teraz** i **Zaplanuj** nieaktywne z wyjaśnieniem; **Odrzuć** aktywne |
| Sukces | Przejście do E5 (instalacja), powrót do E1 z powiadomieniem (zaplanowano), powrót do E3 (odrzucono) |

**Endpointy.** `GET /api/apps/{app}/pending/{version}` (manifest, notatki, flagi, `offeredAt`), `GET /api/apps/{app}/preflight?version=` (lista sprawdzeń z `status`, `detail`, `blocking`), `POST /api/apps/{app}/install` (`{ version, acknowledgedSessions: true }` → `{ operationId }` lub `409` z `queued: true`), `POST /api/apps/{app}/schedule` (`{ version, at, deferOnSessions }`), `POST /api/apps/{app}/pending/{version}/reject` (`{ reasonCode, reasonText, remindInDays }`), `GET /api/operations?status=running`.

---

## E5. Przebieg operacji

**Cel.** Pokazać krok po kroku, co agent robi lub zrobił, z wynikiem i następnym krokiem dla informatyka (A5, A6, M6). Wspólny dla instalacji, aktualizacji, wycofania, cofnięcia, samoaktualizacji, przełączenia portu.

**Funkcje.** Obserwacja na żywo; filtr logu; kopiuj / pobierz log; po sukcesie: wróć do pulpitu, cofnij do poprzedniej wersji; po wycofaniu: zobacz logi aplikacji, spróbuj ponownie, dane kontaktowe serwisu; po nieudanym wycofaniu: uruchom ponownie usługę.

**Komponenty.** Nagłówek (operacja, aplikacja, wersje, kto, start, czas trwania, stan: w toku / zakończona / wycofana / nieudana); pasek wyniku (zielony / czerwony / szary dla w toku); lista kroków z ikonami i czasem; log (monospace, autoprzewijanie z przełącznikiem „przewijaj automatycznie”, ostatnie 500 linii, link „pełny log” → pobierz); sekcja **Co możesz zrobić** po zakończeniu.

Kroki standardowe: sprawdzenia wstępne → pobranie i weryfikacja (pominięty, jeśli pakiet był już zweryfikowany) → *pre‑start* (zarezerwowany: „pominięto: brak Migratora w tej wersji”, A8) → zatrzymanie usługi → przełączenie wersji → start usługi → aktualizacja nginx (pominięty, jeśli bez zmian) → sprawdzenie zdrowia → raport do InfoSystem. Przy wycofaniu dochodzą: przywrócenie wersji → start → sprawdzenie zdrowia → przywrócenie nginx → raport.

**Stany.**

| Stan | Zachowanie |
|---|---|
| Ładowanie | Nagłówek od razu z listy operacji; kroki jako „oczekuje”; log „łączenie ze strumieniem…” |
| Pusty | Operacja nieznana (`404`): „Nie ma takiej operacji” + link do E8 |
| Błąd | Strumień przerwany: „Utracono połączenie z agentem; ponawiam…” (ponawianie co 3 s; po restarcie agenta w samoaktualizacji to zachowanie oczekiwane, komunikat „Agent uruchamia się ponownie…”); operacja nieudana: pasek czerwony z przyczyną i akcjami |
| Sukces | Pasek zielony z wynikiem `health`: „zdrowa, wersja 2.4.0, schemat 41/41, baza osiągalna (4 ms), zadania w tle: 2/2 żyją” |

**Walidacje.** Brak (ekran tylko do odczytu plus akcje z potwierdzeniem jak E3).

**Endpointy.** `GET /api/operations/{id}`, `GET /api/operations/{id}/events` (SSE: `step`, `log`, `result`), `GET /api/operations/{id}/log?download=true`, `POST /api/apps/{app}/rollback`, `POST /api/apps/{app}/service/restart`, `GET /api/site` (`support.phone`, **propozycja**).

---

## E6. Konfiguracja aplikacji

**Cel.** Zastąpić edycję SQL‑em i XML‑ami jednym formularzem „z ptaszkami” nad bazą CI i magazynem sekretów (P3, T‑K4, C5, C6).

**Funkcje.** Edycja pól ze schematu; test połączenia z bazą; zapis; zapis szkicu (**propozycja**); import pakietu od serwisu (→ E7); kopiowanie danych bazy z innej aplikacji (**propozycja**); zmiana hasła; podgląd „które pola wymaga nowa wersja”; restart po zapisie.

**Komponenty.**

| Element | Opis |
|---|---|
| Nagłówek | „Konfiguracja: CRU”, wersja schematu konfiguracji (2.3), pasek kompletności „8 z 10 wymaganych”, przyciski **Importuj pakiet od serwisu**, **Zapisz** |
| Sekcje składane | Baza danych · Usługi zewnętrzne · Parametry aplikacji · Praca w tle; każda z licznikiem brakujących pól |
| Typy pól (ze schematu) | tekst, FQDN, port, ścieżka pliku, liczba, lista wyboru, ptaszek, hasło (sekret), identyfikator; każde z etykietą po polsku, opisem, przykładem, znacznikiem „wymagane”, znacznikiem „wymaga restartu” |
| Pole sekretne | Maskowane wejście; po zapisie: „ustawione · zmieniono 19.10 przez SRV\adam” + **Zmień**; nigdy nie pokazuje wartości; ptaszek „pokaż podczas wpisywania” tylko przed zapisem |
| Test połączenia | Przycisk w sekcji Baza danych; wynik w linii: „Firebird 3.0.11, dialekt 3, baza osiągalna, 4 ms” lub błąd po polsku („Nie można połączyć się z srv-baza:3050: połączenie odrzucone”) |
| Pasek zapisu | Przyklejony na dole: liczba zmian, **Zapisz**, **Odrzuć zmiany**; po zapisie okno „Zrestartować teraz?” jeśli którekolwiek zmienione pole ma znacznik „wymaga restartu” |

**Stany.**

| Stan | Zachowanie |
|---|---|
| Ładowanie | Szkielet sekcji; schemat i wartości ładowane razem |
| Pusty | Pierwsza konfiguracja: wszystkie pola puste, pasek „0 z 10”, karta na górze „Masz pakiet konfiguracji od serwisu? Importuj go, zamiast przepisywać wartości.” |
| Błąd | Baza CI nieosiągalna: pasek błędu nad formularzem, pola tylko do odczytu, **Spróbuj ponownie**; zapis nieudany: pasek z `title`, wartości w formularzu zachowane; test połączenia nieudany: wynik w linii, nie blokuje zapisu |
| Sukces | „Zapisano konfigurację CRU” + ewentualnie wynik restartu; pasek kompletności 10 z 10; jeśli aplikacja czekała na instalację, przycisk **Przejdź do instalacji** (→ E4) |

**Walidacje (na żywo, przy opuszczeniu pola, i przy zapisie).**

| Pole | Reguła | Komunikat |
|---|---|---|
| FQDN (host bazy, adresy usług) | Nazwa hosta RFC 1123, nie adres IPv4/IPv6 (T‑A13); `localhost` dozwolone dla bazy na tej samej maszynie | „Podaj nazwę serwera (np. srv-baza.urzad.local), nie adres IP” |
| Port | Liczba całkowita 1–65535; ostrzeżenie, gdy równy portowi nginx lub portom loopback aplikacji | „Port musi być liczbą od 1 do 65535” |
| Ścieżka bazy | Ścieżka Windows absolutna lub alias Firebirda; brak znaków niedozwolonych | „Podaj pełną ścieżkę na serwerze bazy (np. D:\Bazy\podatki.fdb) lub alias” |
| Użytkownik bazy | 1–31 znaków, bez spacji | |
| Hasło | Niepuste przy pierwszym ustawieniu; brak reguł złożoności (hasło istniejące w Firebirdzie) | „Wpisz hasło użytkownika bazy” |
| Identyfikator jednostki (MC) | Format ze schematu (regex dostarcza aplikacja) | Komunikat ze schematu |
| Pole wymagane | Niepuste | „To pole jest wymagane” |
| Kompletność | Zapis możliwy tylko, gdy wszystkie wymagane poprawne; „Zapisz szkic” zapisuje niekompletne bez restartu i bez odblokowania instalacji | Pasek „Brakuje: hasło bazy, identyfikator jednostki” |
| Wysyłka do MC (ptaszek) | Przy włączaniu: okno „Czy wysyłka w starej instalacji IIS jest już wyłączona? Włączenie obu spowoduje podwójne wysyłki.” | |

**Endpointy.** `GET /api/apps/{app}/config/schema?version=` (sekcje, pola, typy, walidacje, znaczniki), `GET /api/apps/{app}/config` (wartości nie‑sekretne + metadane sekretów: `isSet`, `changedAt`, `changedBy`), `PUT /api/apps/{app}/config` (`{ values, draft: false }` → `{ requiresRestart: [...] }`), `PUT /api/apps/{app}/secrets` (`{ key: value }`, tylko zapis, odpowiedź bez wartości), `POST /api/apps/{app}/config/test-database` (`{ host, port, database, user, password? }` → `{ serverVersion, dialect, latencyMs }`), `POST /api/apps/{app}/service/restart`, `GET /api/apps/{other}/config?fields=database.host,database.port,database.user` (kopiowanie).

---

## E7. Import pakietu konfiguracji

**Cel.** Pozwolić informatykowi „wspieranemu” wczytać konfigurację przygotowaną przez serwis bez przepisywania, zachowując kontrolę nad tym, co trafi do bazy i magazynu (P4, T‑K5).

**Funkcje.** Wybór pliku; wpisanie klucza; odszyfrowanie i podgląd; zastosowanie do formularza; anulowanie.

**Komponenty.** Strefa upuszczania pliku (`.iscfg`, maks. 1 MB); pole klucza z maską `XXXX-XXXX-XXXX-XXXX`; przycisk **Odszyfruj i pokaż**; karta podglądu: „Przygotowany przez: serwis InfoSystem (Michał B.) 18.10 dla placówki Urząd Gminy …, aplikacje: CRU, KSeF”; tabela pól: nazwa, wartość (sekrety jako „ustawione przez serwis”), status (z pakietu / do uzupełnienia przez Ciebie / bez zmian); przyciski **Zastosuj do formularza** / **Anuluj**; tekst „Nic nie zostanie zapisane, dopóki nie klikniesz Zapisz w formularzu”.

**Stany.**

| Stan | Zachowanie |
|---|---|
| Ładowanie | Po kliknięciu **Odszyfruj**: przycisk w stanie „odszyfrowuję…”, pola zablokowane |
| Pusty | Przed wyborem pliku: instrukcja w 3 krokach i link „Skąd wziąć pakiet? Poproś serwis InfoSystem” |
| Błąd | Zły klucz (z licznikiem prób 1/5); plik uszkodzony lub nie jest pakietem; pakiet dla innej placówki (blokuje); pakiet dla innej wersji schematu (ostrzeżenie, lista pól pominiętych); podpis serwisu nieprawidłowy (blokuje: „Pakiet nie został podpisany przez InfoSystem”) |
| Sukces | Przejście do E6 z wczytanymi wartościami i podświetlonymi polami do uzupełnienia; powiadomienie „Wczytano 9 pól, 2 do uzupełnienia” |

**Walidacje.** Rozszerzenie i rozmiar pliku; klucz: 16 znaków z zestawu `A–Z2–9` po usunięciu łączników (**propozycja**: alfabet bez 0/O/1/I); placówka w pakiecie = bieżąca; podpis serwisu prawidłowy.

**Endpointy.** `POST /api/config-packages/decrypt` (multipart: `file`, `key` → podgląd `{ preparedBy, preparedAt, site, apps[], fields[] }` i `packageToken` ważny 10 min), `POST /api/config-packages/{packageToken}/apply` (→ wartości do formularza, sekrety trafiają do tymczasowego bufora agenta i są zapisywane dopiero przy `PUT /api/apps/{app}/config`, **propozycja**).

---

## E8. Operacje i historia

**Cel.** Jeden dziennik: co agent zrobił, kto o tym zdecydował, czy serwis o tym wie (M5, UC14).

**Funkcje.** Filtrowanie (aplikacja, typ, wynik, zakres dat, kto); sortowanie; otwarcie szczegółów (E5); eksport CSV (**propozycja**); wskaźnik „raport wysłany do InfoSystem” / „w buforze”.

**Komponenty.** Pasek filtrów; tabela: czas (lokalny serwera, z dopiskiem „czas serwera”), typ (ikona + nazwa), aplikacja, wersja (z → do), kto (konto Windows / harmonogram / polityka auto / agent / serwis), wynik (zakończona / wycofana / nieudana / odrzucona / zaplanowana / anulowana), raport (✓ / „w buforze” / ✗ z przyczyną); stronicowanie po 50.

Typy zdarzeń: instalacja, aktualizacja, wycofanie automatyczne, cofnięcie ręczne, odrzucenie, zaplanowanie, zmiana terminu, anulowanie planu, zmiana konfiguracji (lista zmienionych pól, bez wartości sekretów), zmiana hasła (tylko fakt), zmiana polityki, zmiana ustawień, import pakietu konfiguracji, pakiet odrzucony przez agenta (podpis), restart usługi, usługa w pętli restartów, samoaktualizacja agenta, przełączenie portu nginx.

**Stany.** Ładowanie: szkielet tabeli. Pusty: „Brak operacji” (nowa placówka) lub „Brak wyników dla filtra” + **Wyczyść**. Błąd: pasek nad tabelą. Sukces: nie dotyczy (eksport: powiadomienie „Pobrano operacje.csv”).

**Walidacje.** Zakres dat: „od” ≤ „do”; maks. 365 dni (**propozycja**).

**Endpointy.** `GET /api/operations?app=&type=&result=&from=&to=&actor=&page=&pageSize=50`, `GET /api/operations/export?…` (CSV), `GET /api/operations/{id}`.

---

## E9. Diagnostyka

**Cel.** Dać informatykowi i serwisantowi odpowiedź „czemu nie działa” bez logowania do serwera przez konsolę (P5, M2, M6).

**Funkcje per sekcja.**

| Sekcja | Funkcje |
|---|---|
| E9.1 Połączenie z InfoSystem | Pokaż FQDN, port, ostatni kontakt, ostatni raport, bufor; **Testuj teraz** (kroki: DNS → TCP → TLS i certyfikat przypięty → uwierzytelnienie); lista hostów do allow‑listy do skopiowania |
| E9.2 Zdrowie aplikacji | Tabela per aplikacja z pełnym `health`; **Sprawdź teraz**; **Uruchom usługę** dla zatrzymanych |
| E9.3 Sesje na bazach | Per instancja Firebirda z konfiguracji: wersja serwera, liczba sesji, lista (użytkownik, komputer, aplikacja, od kiedy); **Odśwież**; informacja „tylko odczyt, agent nie zamyka sesji” |
| E9.4 Logi | Zakładki: agent, nginx, każda aplikacja; zakres 5/15/60 min; poziom; szukaj; **Kopiuj**, **Pobierz**; **Pobierz paczkę diagnostyczną** (zip: logi + stan + konfiguracja bez sekretów, **propozycja**, do wysłania serwisowi) |
| E9.5 Zasoby i adres | Dysk (katalog `C:\InfoSystem`, wolne), RAM per proces, porty platformy (nginx 8443, loopback 5101–5104, panel), adres dla operatorów (**Kopiuj**, **Otwórz**), certyfikat TLS (wystawca, ważny do, odcisk, „zaufany na tym serwerze: tak/nie”) |

**Komponenty.** Nawigacja sekcji po lewej (lub zakładki); karty wyników; tabela sesji; przeglądarka logów (monospace, kolor poziomu, zawijanie wierszy opcjonalne).

**Stany.**

| Stan | Zachowanie |
|---|---|
| Ładowanie | Każda sekcja osobno; test połączenia: kroki pojawiają się kolejno |
| Pusty | Sesje: „Brak aktywnych sesji na bazie podatki.fdb”; logi: „Brak wpisów w ostatnich 15 minutach” z przełącznikiem na 60 min; bufor raportów: „Wszystkie raporty wysłane” |
| Błąd | Test połączenia: krok ✗ z opisem („DNS: nazwa agent.infosystem.pl nie rozwiązuje się. Sprawdź serwer DNS urzędu lub poproś IT o wpis.”); health: „brak odpowiedzi w 10 s”; sesje: „Brak dostępu do MON$ATTACHMENTS: sprawdź użytkownika bazy w konfiguracji” |
| Sukces | Test: wszystkie kroki ✓ „Połączenie działa (320 ms)”; po **Uruchom usługę**: wiersz zmienia stan na „uruchamianie…” → „działa” |

**Walidacje.** Zakres logów ∈ {5, 15, 60}; szukaj: maks. 200 znaków.

**Endpointy.** `GET /api/diagnostics/connectivity` i `POST /api/diagnostics/connectivity/test` (→ kroki), `GET /api/apps/{app}/health?refresh=true`, `GET /api/diagnostics/db-sessions?instance=`, `GET /api/logs/{source}?minutes=&level=&q=` (`source` ∈ `agent|nginx|<app>`), `GET /api/logs/{source}/download`, `GET /api/diagnostics/bundle` (zip), `GET /api/diagnostics/resources`, `GET /api/site/certificate`, `POST /api/apps/{app}/service/start`.

---

## E10. Ustawienia placówki

**Cel.** Nieliczne parametry instalacyjne, które informatyk może zmienić bez serwisu; wszystko inne agent ustala sam (O‑U4, 7.7 warstwa instalacyjna).

**Funkcje per sekcja.**

| Sekcja | Pola i akcje | Walidacje |
|---|---|---|
| E10.1 Port i adres | Port nginx (bieżący 8443), nazwa serwera dla adresu (FQDN wykryty z OS, edytowalny), podgląd adresu dla operatorów; **Przełącz na 443** (aktywny, gdy 443 wolny, z oknem: „adres zmieni się na …; poinformuj operatorów”); **Zmień port** | Port 1–65535, wolny (agent sprawdza), różny od portów loopback; FQDN nie IP |
| E10.2 Certyfikat TLS | Bieżący (wystawca, podmiot, ważny do, odcisk); **Pobierz certyfikat CA placówki** (do rozdania na PC, R9); **Importuj własny certyfikat** (PFX + hasło; hasło do magazynu, nie wyświetlane); **Wygeneruj ponownie** | PFX maks. 100 KB, zawiera klucz prywatny, podmiot pasuje do FQDN serwera (ostrzeżenie, nie blokada) |
| E10.3 Polityki automatycznej instalacji | Tabela aplikacji + agent: przełącznik, okno (dni, godziny od–do), „pomiń przy aktywnych sesjach” (domyślnie tak), „nie dotyczy wersji z migracją bazy” (stałe); tekst o widoczności dla serwisu | Co najmniej jeden dzień; „od” < „do”; okno min. 1 h |
| E10.4 Agent | Wersja, konto usługi, katalogi, częstotliwość sprawdzania nowych wersji (15/30/60 min), limit pasma pobierania (bez limitu / 1 / 5 / 20 Mbit/s), liczba przechowywanych poprzednich wersji (1–3), dane kontaktowe serwisu (telefon, e‑mail, **propozycja**); **Zatrzymaj agenta** i **Jak odinstalować** (→ E11) | Wartości z list |
| E10.5 Zaawansowane | Reguły zapory utworzone przez agenta (lista, przełącznik „zarządzaj regułami zapory” N4), „Pokaż kreator startowy” (→ E0), „Maszyny w tej placówce” (po MVP, nieaktywne) | – |

**Komponenty.** Nawigacja sekcji; formularze z paskiem zapisu per sekcja; okna potwierdzeń dla zmiany portu i certyfikatu (obie uruchamiają operację na E5: przeładowanie nginx).

**Stany.** Ładowanie: szkielet. Pusty: nie dotyczy. Błąd: port zajęty („Port 8443 jest zajęty przez proces … (PID)”); PFX bez klucza prywatnego; zapis nieudany. Sukces: powiadomienie; dla portu i certyfikatu przejście do E5.

**Endpointy.** `GET /api/settings`, `PUT /api/settings` (częściowe), `POST /api/site/nginx/port` (`{ port }` → `{ operationId }`), `GET /api/site/certificate`, `GET /api/site/certificate/ca.crt`, `POST /api/site/certificate/import` (multipart PFX + hasło), `POST /api/site/certificate/regenerate` (→ `operationId`), `GET /api/policies`, `PUT /api/apps/{app}/policy`, `GET /api/site/firewall-rules`, `POST /api/agent/stop` (z potwierdzeniem; panel przestaje odpowiadać, komunikat wcześniej).

---

## E11. Pomoc: co robi agent na tym serwerze

**Cel.** Zbudować zaufanie informatyka i spełnić wymaganie dokumentu dla IT (O‑U5, N7 agenta): co agent robi, z jakimi uprawnieniami, jaki ruch, jak go wyłączyć.

**Funkcje.** Czytanie; kopiowanie listy hostów; pobranie dokumentu PDF/MD dla IT (**propozycja**); link do kreatora startowego; link do dziennika.

**Komponenty.** Sekcje: „Co agent robi i czego nie robi” (lista: instaluje tylko po Twojej zgodzie; nie dotyka Firebirda; nie otwiera portów z internetu; nie zmienia Windows Update; nie wysyła danych osobowych), „Uprawnienia i konto usługi”, „Ruch sieciowy” (jeden FQDN wychodzący, port, allow‑lista do skopiowania; ruch od operatorów tylko w sieci lokalnej), „Katalogi i usługi Windows” (lista z nazwami usług), „Jak zatrzymać lub odinstalować agenta bez utraty aplikacji” (kroki; informacja, że aplikacje i nginx działają dalej, ale nie dostaną aktualizacji), „Kontakt z serwisem”, „Wersja i licencje składników” (nginx, agent).

**Stany.** Ładowanie: treść statyczna natychmiast, dane dynamiczne (FQDN, konto, katalogi) z szkieletem. Pusty/błąd: dane dynamiczne zastąpione „—” z dopiskiem „nie udało się pobrać”. Sukces: nie dotyczy.

**Walidacje.** Brak.

**Endpointy.** `GET /api/site` (`infoSystem.host`, `port`, `serviceAccount`, `paths`, `services[]`), `GET /api/about` (wersje i licencje), `GET /api/help/it-document` (plik).

---

## 4.1 Zbiorcza tabela lokalnego API agenta (propozycja)

| Metoda i ścieżka | Cel | Ekrany |
|---|---|---|
| `GET /api/site` | Stan placówki: nazwa, serwer, InfoSystem (host, port, ostatni kontakt, bufor), nginx (stan, port), adres dla operatorów, dysk, agent (wersja, dostępna), kroki startowe, konto usługi, katalogi, kontakt serwisu | E0, E1, E3, E5, E9, E10, E11 |
| `POST /api/site/bootstrap/retry` · `POST /api/site/bootstrap/dismiss` | Ponowienie kroku startowego (z opcjonalnym nowym tokenem); zamknięcie kreatora | E0 |
| `GET /api/apps` · `GET /api/apps/{app}` | Lista i szczegóły aplikacji: zainstalowana wersja, stan usługi, health, oczekujące, zaplanowane, odrzucone, polityka, ostatnia operacja, kompletność konfiguracji | E1, E2, E3 |
| `GET /api/apps/{app}/versions` | Wersje na dysku i udostępnione | E3 |
| `GET /api/apps/{app}/pending/{version}` | Manifest, notatki wydania, wpływ, data udostępnienia | E4 |
| `GET /api/apps/{app}/preflight?version=` | Sprawdzenia wstępne (dysk, sesje, port, uprawnienia, wersja agenta, konfiguracja) | E4 |
| `POST /api/apps/{app}/install` | Start instalacji lub aktualizacji → `operationId` (`409 queued` gdy inna trwa) | E4, E1 |
| `POST /api/apps/{app}/schedule` · `PUT` · `DELETE /api/apps/{app}/schedule` | Zaplanowanie, zmiana terminu, anulowanie | E4, E1, E3 |
| `POST /api/apps/{app}/pending/{version}/reject` · `.../reconsider` | Odrzucenie z powodem; powrót do oczekujących | E4, E3 |
| `POST /api/apps/{app}/rollback` | Cofnięcie do wersji na dysku → `operationId` | E3, E5 |
| `GET /api/apps/{app}/health?refresh=` | Wynik `GET /health` aplikacji w ujednoliconej formie | E3, E9 |
| `POST /api/apps/{app}/service/start|stop|restart` | Sterowanie usługą (z audytem) | E3, E9 |
| `PUT /api/apps/{app}/policy` · `GET /api/policies` | Polityka automatycznej instalacji | E3, E10 |
| `PUT /api/apps/{app}/note` | Notatka informatyka | E3 |
| `GET /api/apps/{app}/config/schema` · `GET|PUT /api/apps/{app}/config` | Schemat formularza; wartości nie‑sekretne (z metadanymi sekretów) | E6 |
| `PUT /api/apps/{app}/secrets` | Zapis sekretów (tylko zapis) | E6 |
| `POST /api/apps/{app}/config/test-database` | Test połączenia z Firebirdem | E6 |
| `POST /api/config-packages/decrypt` · `POST /api/config-packages/{token}/apply` | Import pakietu konfiguracji | E7 |
| `GET /api/operations` · `GET /api/operations/{id}` · `GET /api/operations/{id}/events` (SSE) · `GET /api/operations/{id}/log` · `GET /api/operations/export` | Historia, szczegóły, strumień, log, CSV | E1, E5, E8 |
| `GET /api/notifications` · `POST /api/notifications/{id}/dismiss` | Banery globalne | wszystkie |
| `GET /api/diagnostics/connectivity` · `POST /api/diagnostics/connectivity/test` | Stan i test połączenia z InfoSystem | E0, E9 |
| `GET /api/diagnostics/db-sessions` | Sesje Firebird (`MON$ATTACHMENTS`) | E9, E4 |
| `GET /api/diagnostics/resources` · `GET /api/diagnostics/bundle` | Dysk, RAM, porty; paczka diagnostyczna | E9 |
| `GET /api/logs/{source}` · `GET /api/logs/{source}/download` | Logi agenta, nginx, aplikacji | E3, E9 |
| `GET|PUT /api/settings` | Częstotliwość, pasmo, liczba wersji, kontakt, zapora | E10 |
| `POST /api/site/nginx/port` | Zmiana portu nginx → `operationId` | E10 |
| `GET /api/site/certificate` · `GET .../ca.crt` · `POST .../import` · `POST .../regenerate` | Certyfikat TLS | E9, E10 |
| `GET /api/site/firewall-rules` | Reguły zapory agenta | E10 |
| `POST /api/agent/stop` | Zatrzymanie agenta | E10 |
| `GET /api/about` · `GET /api/help/it-document` | Wersje, licencje, dokument dla IT | E11 |

Co to API **nie** udostępnia: wartości sekretów (nigdy w odpowiedzi), edycji konfiguracji nginx, operacji na Firebirdzie poza odczytem sesji i testem połączenia, żadnego endpointu instalacji bez jawnej wersji i jawnej akcji informatyka.
