# Site Agent: wymagania (Tier S, zakres MVP)

| | |
|---|---|
| **Data** | 19 października 2026 |
| **Status** | Szkic v0.1 do przeglądu |
| **Źródło** | `2026-10-19-stan-projektu-i-architektura-mvp.md` (sekcje 4.4, 7.4, 7.9, 8.2); identyfikatory w kolumnie „Ślad” odsyłają do tego dokumentu |
| **Zakres** | Komponent Tier S instalowany na serwerze placówki: dystrybucja, instalacja, aktualizacja i monitoring oprogramowania InfoSystem. Wymagania oznaczone **(MVP)** wchodzą do pierwszej wersji; **(później)** są zdolnościami, których MVP nie może zablokować |

## 1. Rola i granice

Site Agent to jedyny komponent, który instaluje oprogramowanie w placówce. Działa jako usługa Windows na koncie z uprawnieniami administratora, komunikuje się wyłącznie ruchem wychodzącym ze źródłem artefaktów i odbiornikiem raportów po stronie InfoSystem, i nigdy nie instaluje niczego bez zgody informatyka urzędu. Nie zawiera logiki biznesowej.

**Poza zakresem agenta:** instalacja, aktualizacja i konfiguracja Firebirda; migracje schematu baz (do czasu Migratora); telemetria aplikacyjna (OTel); tożsamość operatorów (STS); dostęp zdalny wsparcia; aktualizacja exe Delphi (zostaje updater Rafała).

## 2. Wymagania funkcjonalne

### 2.1 Dystrybucja

| # | Wymaganie | Zakres | Ślad |
|---|---|---|---|
| D1 | Agent rejestruje placówkę przy pierwszym uruchomieniu na podstawie istniejącego klucza licencyjnego i jednorazowego tokenu instalacyjnego; otrzymuje identyfikator placówki i sekret agenta. | MVP | 7.4 |
| D2 | Agent cyklicznie (domyślnie co 15 min, konfigurowalnie) pobiera desired state: listę aplikacji i wersji udostępnionych tej placówce (bramka 1 po stronie serwisu). | MVP | T‑Z9 |
| D3 | Pakiety pobierane są wznawialnie (słabe łącza) do katalogu staging, osobno per aplikacja. | MVP | 7.4 |
| D4 | Każdy pakiet jest weryfikowany przed użyciem: podpis Authenticode binariów i podpis manifestu przypiętym kluczem wydań. Pakiet niepodpisany lub zmieniony jest odrzucany i raportowany. | MVP | T‑A10 |
| D5 | Agent obsługuje import pakietu z pliku lokalnego (ta sama weryfikacja) dla placówek bez internetu na serwerze. | później | T‑A12 |
| D6 | Jedna placówka może mieć wiele maszyn z agentem (różne zestawy aplikacji); desired state jest per maszyna. | MVP (model danych), później (UI) | 7.10 T3 |

### 2.2 Instalacja

| # | Wymaganie | Zakres | Ślad |
|---|---|---|---|
| I1 | Instalacja agenta to jedyny krok ręczny: podpisany MSI, instalacja bez interakcji z dwoma parametrami (klucz placówki, token). Czas poniżej 10 minut. | MVP | T‑A8, T‑A9 |
| I2 | Agent instaluje pozostałe komponenty bez interakcji: nginx (jako usługę Windows), aplikacje .NET jako usługi Windows na portach loopback, pliki statyczne SPA. | MVP | T‑A3 |
| I3 | Kontrakt instalacji per komponent: `install`, `upgrade`, `rollback`, `health`, realizowany przez providery (`KestrelService`, `Nginx`, `StaticSpa`); interfejs providera przygotowany pod `WindowsService`, `Exe`, `DbMigration`, `Container`. | MVP | 8.4 |
| I4 | Wersje instalowane są obok siebie (katalog per wersja, wskaźnik `current`); agent zachowuje N poprzednich wersji (domyślnie 2). | MVP | T‑A15 |
| I5 | Agent generuje konfigurację nginx z szablonu wersjonowanego razem z agentem (routing po prefiksach, TLS, port), testuje ją i przeładowuje bez przerwy dla pozostałych aplikacji. Nikt nie edytuje jej ręcznie. | MVP | 7.4 |
| I6 | Port nginx jest konfigurowalny; przy zajętym 443 (IIS w okresie przejściowym) agent wybiera port alternatywny i raportuje. Porty loopback przydziela agent z pominięciem zajętych. | MVP | T‑H4, 7.11 |
| I7 | Agent generuje klucz i certyfikat TLS placówki (CA placówki, certyfikat dla FQDN serwera i localhost) lub importuje certyfikat dostarczony przez IT gminy. | MVP | D‑5 |
| I8 | Agent tworzy bazę CI (plik Firebird) jeśli nie istnieje, z użytkownikiem Firebird, którego hasło trafia do magazynu sekretów. To jedyne „dotknięcie” Firebirda. | MVP | 7.7 |
| I9 | Sprawdzenia wstępne przed każdą instalacją: uprawnienia konta, miejsce na dysku, wolne porty, aktywne sesje na bazie. Brak uprawnień kończy operację raportem, bez prób obejścia. | MVP | T‑A14 |
| I10 | Aplikacje otrzymują przy starcie od agenta: adres nasłuchu, katalog logów, ścieżkę do sekretów; konfigurację nie‑sekretną czytają z bazy CI. | MVP | 7.7 |

### 2.3 Aktualizacja i bramkowanie

| # | Wymaganie | Zakres | Ślad |
|---|---|---|---|
| A1 | **Agent nigdy nie instaluje aktualizacji jednostronnie.** Pakiet pobrany i zweryfikowany czeka na akceptację informatyka (bramka 2) w panelu lokalnym. | MVP | T‑Z1, Z‑8 |
| A2 | Informatyk może: zainstalować teraz, zaplanować okno (data, godzina), odrzucić z powodem, cofnąć do poprzedniej wersji. Odrzucenie z powodem trafia do serwisu. | MVP | T‑Z3 |
| A3 | Polityka „instaluj automatycznie w oknie” jest opt‑in per aplikacja, włączana wyłącznie przez informatyka i widoczna dla serwisu. | MVP | 7.9 |
| A4 | Aktualizowana jest jedna aplikacja naraz; pozostałe działają bez przerwy. | MVP | T‑Z11 |
| A5 | Przebieg: stop usługi, przełączenie `current`, start, aktualizacja nginx jeśli zmienił się port lub prefiks, health z limitem czasu. | MVP | 7.9 |
| A6 | Przy niezdrowym health lub braku odpowiedzi agent automatycznie cofa do poprzedniej wersji i poprzedniej konfiguracji nginx, raportuje przyczynę i powiadamia panel lokalny. | MVP | T‑A15 |
| A7 | Manifest pakietu deklaruje wpływ (restart, migracja schematu, pilne) i minimalną wersję agenta; agent odmawia instalacji pakietu wymagającego nowszego agenta. | MVP | 8.4 |
| A8 | Krok `pre-start` w przebiegu aktualizacji zarezerwowany dla Migratora (backup, migracje); do tego czasu niezgodność wersji schematu wykrywa health i powoduje rollback. | MVP (hak), później (Migrator) | T‑D3 |
| A9 | Samoaktualizacja agenta: pobranie, weryfikacja, podmiana katalogu i restart usługi; podlega bramce 2 lub polityce auto. Osobny Updater później. | MVP | T‑A7, D‑11 |
| A10 | Druga instancja aplikacji pod innym prefiksem na bazie testowej (środowisko testowe obok produkcji). | później | T‑Z7 |

### 2.4 Monitoring i raportowanie

| # | Wymaganie | Zakres | Ślad |
|---|---|---|---|
| M1 | Agent raportuje do odbiornika raportów po każdej operacji i cyklicznie: wersje zainstalowane, stan usług, wynik ostatniej operacji, wersję agenta i nginx, wersję i port Firebirda z konfiguracji, wolne miejsce, RAM, ostatni kontakt. Zbiorczo per maszyna, nie per końcówka. | MVP | T‑A6, T‑Z6 |
| M2 | Agent wywołuje `GET /health` każdej aplikacji po instalacji i cyklicznie; wynik (stan, wersja aplikacji, wersja schematu, zadania w tle, baza osiągalna) wchodzi do raportu. | MVP | 7.6 C4 |
| M3 | Agent nadzoruje usługi: restart po awarii z backoff, raport powtarzających się awarii. | MVP | T‑A6 |
| M4 | Raporty zawierają wyłącznie dane techniczne; żadne dane osobowe ani sekrety nie opuszczają placówki. | MVP | 8.2 |
| M5 | Każda akcja w panelu lokalnym (akceptacja, odrzucenie, rollback, zmiana konfiguracji, zmiana polityki) jest audytowana lokalnie z nazwą konta Windows i raportowana. | MVP | 8.2 |
| M6 | Agent zbiera logi aplikacji z katalogów, które im wskazał, i udostępnia ostatnie N minut w panelu lokalnym; wysyłka do centrali (OTel Collector) później. | MVP (lokalnie), później (centralnie) | 7.14 |

### 2.5 Panel lokalny

| # | Wymaganie | Zakres | Ślad |
|---|---|---|---|
| P1 | Aplikacja webowa hostowana przez agenta wyłącznie na `127.0.0.1`; dostęp równa się sesji na serwerze (RDP); bez nowej tożsamości. | MVP | D‑4, T‑H5 |
| P2 | Pokazuje per aplikacja: wersję zainstalowaną, stan, wersję udostępnioną, release notes, wpływ, aktywne sesje na bazie, miejsce na dysku. | MVP | T‑Z3 |
| P3 | Formularz konfiguracji nie‑sekretnej nad bazą CI z walidacją kompletności; pola haseł trafiają do magazynu sekretów i nie są wyświetlane. | MVP | T‑K4, T‑K5 |
| P4 | Obsługuje dwa warianty: informatyk wpisuje wszystko sam, albo importuje pakiet konfiguracji przygotowany przez serwis (zaszyfrowany jednorazowym kluczem). | MVP | T‑K5 |
| P5 | Diagnostyka: logi agenta, wynik health, test połączenia z InfoSystem, adres dla operatorów. | MVP | 7.4 |
| P6 | Język polski, bez żargonu technicznego platformy; obsługa „ptaszkami”. | MVP | N1, N13 |

### 2.6 Sekrety

| # | Wymaganie | Zakres | Ślad |
|---|---|---|---|
| S1 | Magazyn sekretów jest własnością agenta: DPAPI na koncie usługi agenta z dodatkową entropią w pliku chronionym ACL. | MVP | 7.4 |
| S2 | Zawartość: sekret agenta, klucz TLS, hasła Firebird per aplikacja, secret jednostki MC (do decyzji z Pawłem). Sekrety generowane przez agenta lub wpisane w panelu; nigdy w plikach konfiguracyjnych aplikacji ani w logach. | MVP | T‑K1 |
| S3 | Przekazanie sekretów aplikacji: plik per aplikacja zaszyfrowany DPAPI (zakres maszyny) z ACL dla konta usługi aplikacji; rotacja przez nadpisanie i restart. Mechanizm do potwierdzenia (D‑8). | MVP | D‑8 |
| S4 | Agent nie zmienia hasła SYSDBA ani użytkowników Firebirda bez jawnego polecenia informatyka w panelu. | MVP | Z‑9 |
| S5 | Backend magazynu za interfejsem umożliwiającym implementację dla Linuksa. | później | D‑2 |

## 3. Wymagania niefunkcjonalne

| # | Wymaganie | Ślad |
|---|---|---|
| N1 | **Sieć:** wyłącznie wychodzący HTTPS do jednego FQDN InfoSystem (port do ustalenia: 443 na subdomenie lub 65000); przypięty certyfikat InfoSystem; żaden port przychodzący; FQDN, nigdy IP; brak zależności od publicznych DNS. | T‑A5, T‑A13, T‑S3 |
| N2 | **Zasoby:** agent z panelem poniżej 100 MB RAM; start poniżej 30 s; brak wpływu na pracę operatorów podczas pobierania (limit pasma konfigurowalny). | 7.12 |
| N3 | **Platforma:** Windows Server i Windows Pro wspierane dziś w terenie; self‑contained .NET bez instalacji runtime; Linux po MVP za abstrakcjami (menedżer usług, sekrety, pakowanie). | D‑2 |
| N4 | **Bezpieczeństwo:** wszystkie binarki agenta podpisane Authenticode; konto usługi: dedykowany lokalny administrator (LocalSystem jako zapas); agent nie zmienia Windows Update ani zapory poza regułami dla własnych portów (z opcją wyłączenia). | 8.2, D‑13 |
| N5 | **Niezawodność:** każda operacja jest idempotentna i wznawialna po restarcie maszyny w trakcie (stan operacji na dysku); przerwana aktualizacja nigdy nie zostawia stanu pośredniego (albo `current` wskazuje starą, albo nową wersję). | 7.9 |
| N6 | **Offline:** brak kontaktu z InfoSystem nie wpływa na działanie zainstalowanych aplikacji ani panelu lokalnego; agent buforuje raporty i wysyła po odzyskaniu łączności. | Z‑1 |
| N7 | **Wyłączalność:** informatyk może zatrzymać lub odinstalować agenta bez utraty działających aplikacji; dokument dla IT opisuje, co agent robi i jak go wyłączyć. | O‑U5, P6 |
| N8 | **Obserwowalność agenta:** logi strukturalne bez sekretów i danych osobowych, rotowane; wersja agenta w każdym raporcie. | C8 |
| N9 | **Kompatybilność:** współistnienie z IIS, innymi usługami na portach 80/443 i wieloma instancjami Firebirda na tej samej maszynie. | 7.11, O‑I9 |
| N10 | **Zegar:** agent nie używa zegara PC do decyzji o wersjach; znaczniki czasu w raportach pochodzą z serwera InfoSystem lub są oznaczone jako lokalne. | T‑H11 |

## 4. Interfejsy

| Interfejs | Treść | Ślad |
|---|---|---|
| Agent → InfoSystem | `POST /v1/sites/register`, `GET /v1/sites/{id}/desired`, `GET /v1/packages/{app}/{wersja}`, `POST /v1/sites/{id}/state`; OpenAPI; błędy RFC 9457; uwierzytelnienie sekretem agenta. | 8.4 |
| Agent → aplikacja | Kontrakt C1–C13 (`2026-10-19-kontrakt-aplikacji-wobec-platformy.md`): nasłuch loopback, base path, `GET /health`, manifest, konfiguracja z bazy CI, sekrety z pliku. | 7.6 |
| Agent → nginx | Szablon konfiguracji, `nginx -t`, reload przez sygnał; nginx jako usługa przez wrapper (D‑7). | 7.4 |
| Agent → Firebird | Tylko odczyt `MON$ATTACHMENTS` (aktywne sesje) i utworzenie bazy CI; nic więcej. | Z‑9 |
| Informatyk → agent | Panel lokalny na localhost; MSI z parametrami. | 2.5 |

## 5. Założenia i warunki wstępne

| # | Założenie |
|---|---|
| Z1 | Serwer z agentem ma wychodzący HTTPS i rozwiązuje FQDN InfoSystem przez DNS urzędu. |
| Z2 | IT urzędu przygotuje konto administratora dla usługi lub zgodzi się na LocalSystem; klient wyraził zgodę na agenta i nginx. |
| Z3 | Istnieje podpisywanie w CI (Authenticode i klucz manifestów), źródło artefaktów z desired state i odbiornik raportów w wersji minimalnej. |
| Z4 | Cztery aplikacje spełniają kontrakt C1–C13 przed pierwszą instalacją. |
| Z5 | Firebird 3 dialekt 3 już działa; agent go nie dotyka. |

## 6. Kryteria akceptacji (MVP)

| # | Kryterium |
|---|---|
| K1 | Instalacja agenta przez informatyka bez pomocy serwisu w czasie poniżej 10 minut; po niej nginx i 4 aplikacje działają pod jednym adresem HTTPS. |
| K2 | Pakiet z zepsutym podpisem jest odrzucony; pakiet z celowo niezdrowym health jest automatycznie wycofany; w obu przypadkach serwis widzi przyczynę. |
| K3 | Żadna aktualizacja nie wykonuje się bez kliknięcia informatyka lub włączonej przez niego polityki; odrzucenie z powodem jest widoczne w widoku serwisu. |
| K4 | Po instalacji żaden sekret nie znajduje się w plikach konfiguracyjnych ani logach (przegląd katalogów). |
| K5 | Restart maszyny w trakcie aktualizacji kończy się stanem spójnym (stara lub nowa wersja), bez interwencji. |
| K6 | Zużycie RAM agenta z panelem poniżej 100 MB na maszynie referencyjnej 4 GB. |
| K7 | Agent aktualizuje sam siebie przez tę samą bramkę i wraca do poprzedniej wersji przy nieudanym starcie. |
| K8 | 30 dni pracy w 3 placówkach pilotażowych bez zgłoszenia „usługa nie startuje”. |
