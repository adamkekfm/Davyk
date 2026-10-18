# Ocena dopasowania „Wytycznych architektury oprogramowania” do wymagań ze spotkania 1.10.2026

| | |
|---|---|
| **Data oceny** | 18 października 2026 |
| **Oceniany dokument** | `docs/Stories/2026_10_15_Architecture_Research/software-architecture-guidelines_pl.md` (wersja 1.0, 2026-10-02, szkic do przeglądu) |
| **Punkt odniesienia** | `2026-10-01-podsumowanie-spotkanie-dystrybucja.md` (wymagania W/T, ograniczenia I/U/P, propozycje R) |
| **Cel** | Sprawdzić, czy proponowana architektura (Site Agent, Site Host, Tier S / Tier M, lokalny STS, Fleet Server, CQRS) odpowiada na wymagania i ograniczenia zebrane na spotkaniu o dystrybucji aplikacji. |

Identyfikatory W1…, T1…, I1…, U1…, P1…, R1… odnoszą się do tabel w podsumowaniu spotkania. Numery sekcji w nawiasach odnoszą się do ocenianego dokumentu.

---

## 1. Werdykt

Dokument trafia w sedno głównego problemu ze spotkania. **Tier S** (self-contained usługi .NET na istniejącej maszynie Windows klienta) jest wprost odpowiedzią na blokadę, którą Artur opisał jako „58 z 60 klientów nie znalazło zasobów na VM”. **Model tożsamości** (lokalny STS z site user registry) rozwiązuje spór o bazę CI, a **polityka sekretów** łata lukę z hasłem Firebirda w XML.

Dokument jest jednak napisany z perspektywy docelowej platformy i pomija trzy rzeczy, które na spotkaniu były pilne:

1. istniejące API ePłatności/mObywatel działające w IIS u 60 klientów,
2. natychmiastowe wdrożenie frontu opłat skarbowych,
3. jednoznaczną decyzję zarządu o przechowywaniu danych osobowych w centrali (faza 3), wobec cytowanego stanowiska szefa.

**Rekomendacja:** przyjąć dokument jako kierunek, z uzupełnieniami A, B, C, D i F (sekcja 3) przed przeglądem architektury. Punkty E, G, H, I, J to materiał na ADR-y i uzupełnienie tabeli ograniczeń.

---

## 2. Co dokument rozwiązuje zgodnie z oczekiwaniami

| Wymaganie / ograniczenie ze spotkania | Odpowiedź w dokumencie | Ocena |
|---|---|---|
| **W1, W2, T2, I1, I2**: musi działać u małych, biednych jednostek, obok obecnych aplikacji, bez nowego serwera (Artur, Rafał) | Tier S: self-contained usługi Windows na maszynie z Firebirdem, budżet poniżej 1 GB RAM ponad Firebird (5.2); opcja 2 zachowana dla lokalizacji jednostanowiskowych (6) | **Pełne.** To sformalizowana propozycja Adama o agencie / usłudze Windows (47:57). |
| **R3** dwutorowość (Marek, Jan, Adam), **T4** „jeden kod, dwa tryby” (Jan), **W6** koszt utrzymania dwóch torów (Artur) | Dwa Tier, jeden build, jeden kontrakt instalacji (`install`, `upgrade`, `rollback`, `health`), agent jako jedyny komponent znający Tier (1.3, 7) | **Pełne.** Usuwa obawę Artura o utrzymanie dwóch wersji API z różnym logowaniem. |
| Spór o **bazę CI** (Artur vs Jan), brak synchronizacji operatorów, **T15** „trzecia lepianka autentykacji” | Lokalny STS (OpenIddict) z site user registry (`SITE_USERS`, `SITE_USER_MAP`), hasła wyłącznie w STS, tabele uprawnień aplikacji zostają (11.2, 11.4) | **Pełne.** To „baza CI zrobiona dobrze”: realizuje intencję Artura (jedno bezpieczne logowanie) i Jana (bez centralnego gatewaya). Warto zapisać wprost, że baza CI i gateway dockerowy zostają wchłonięte. |
| **T7** rozdzielenie uwierzytelniania od uprawnień (Adam) | Zasada 7 „tożsamość w tokenie, uprawnienia w aplikacji”, współdzielona biblioteka autoryzacji (11.4) | **Pełne.** |
| **I5** brak Active Directory u ok. 90% klientów (Rafał) | LDAP bind opcjonalny, konta lokalne z polityką haseł, blokadą i TOTP domyślnie, Keycloak nigdy w lokalizacji (11.6, 11.8) | **Pełne.** |
| **Luka bezpieczeństwa**: hasło Firebirda w XML (Artur 52:20), **T8** gotowość na audyt, **T9** wycieki od wewnątrz (Adam) | Losowe SYSDBA per lokalizacja, osobny użytkownik Firebird per aplikacja, launcher pobiera sekret z Site Host, sekrety w DPAPI, nigdy w plikach konfiguracyjnych (9.3, 14), model zagrożeń (15) | **Pełne.** Wspiera stanowisko Adama o należytej staranności (P3). |
| **P1, P2**: dane osobowe nie przez serwery firmy, brak SaaS, firma nie stawia tuneli dla danych (decyzja szefa) | Zasady 1, 2, 6: lokalizacja autonomiczna, wyłącznie ruch wychodzący, dane zostają w lokalizacji; VPN nigdy na ścieżce danych (8.8) | **Pełne dla operatorów.** Wyjątek: faza 3, patrz luka C. |
| **W4, W5**: nie robić rewolucji małą aplikacją, najpierw wartość dla obecnego produktu (Artur) | Deliverable 1 to zarządzanie flotą istniejących instalacji Delphi przed jakimkolwiek nowym modułem (1.3 pkt 4, 16) | **Pełne.** Zgodne z „przerobić menedżer w międzyczasie” (Artur 1:20:07). |
| **Cel projektu**: dystrybucja, instalacja, aktualizacja, monitoring dziesiątek tysięcy klientów | Site Agent, Fleet Server, enrollment z istniejącym kluczem licencyjnym, inwentaryzacja, heartbeat, ringi, rollback, telemetria, GlitchTip (8, 13) | **Pełne i szersze niż spotkanie.** Zastępuje menedżer aplikacji Jana, licensing serwer i paczkomat Antka. W Tier S nie ma konfiguracji stałego IP. |
| **U1** informatycy nie radzą sobie z siecią (Jan, Artur) | Enrollment jako pięciominutowy krok dystrybutora, agent konfiguruje sam, Tier S bez adresacji VM (8.2, 17) | **Dobre.** W Tier M nadal potrzebne „przypisanie IP” (7). |
| **T1, T3** DNS i polityki sieciowe (Marek) | Założenie „wychodzący HTTPS prawie zawsze dostępny”, obsługa proxy z uwierzytelnianiem (3) | **Częściowe**, patrz luka F. |
| **T13** API musi działać 24/7 | Site Host jako stała usługa z zadaniami w tle (Quartz), nadzór agenta z restartem (5.1, 8.1) | **Pełne**, o ile API trafią do Site Host (luka A). |
| **T17** minimalne zasoby | Jawny budżet RAM dla najmniejszej lokalizacji, reguła „jeśli moduł się nie mieści, to on jest niewłaściwy dla Tier S” (5.2) | **Dobre**, patrz luka D. |

---

## 3. Luki i napięcia względem spotkania

### A. Istniejące API w IIS nie istnieją w dokumencie

Spotkanie kręciło się wokół dwóch API ePłatności/mObywatel działających na IIS u 60 klientów: praca 24/7 i synchronizacja co 30–60 min (T13), certyfikacja i testy bezpieczeństwa Ministerstwa Cyfryzacji (P5), podwójne instancje z różnym logowaniem u 2 klientów (T15). Dokument zna tylko ACRU jako zalążek Site Host (2). Zasada 5 „jeden host, wiele modułów” oznacza wyprowadzenie tych API z IIS do Site Host, a tej migracji nie ma w żadnej fazie (16).

**Do uzupełnienia:** ścieżka IIS → Site Host (albo jawna decyzja, że API zostają w IIS pod nadzorem agenta), likwidacja podwójnych instancji, wpływ zmiany hostingu i uwierzytelniania na certyfikację ministerstwa.

### B. Brak pomostu dla opłat skarbowych (W9, R7)

Artur prosił o front wdrażalny „momentalnie” u 60 + 20 klientów jako krok pierwszy (59:23). W dokumencie Site Host pojawia się dopiero w fazie 2 (rozmiar L), po fazie 1 (L). Sekcja 12 dopuszcza powłokę WebView2 wyłącznie, gdy wymaga tego sprzęt, co kłóci się z propozycją Jana i Artura (R4, R7).

**Do uzupełnienia:** jawny zapis, czy opłaty skarbowe dostają rozwiązanie taktyczne poza architekturą (statyczne SPA serwowane przez istniejący IIS obok dwóch API, plik konfiguracyjny z adresami), czy przyspieszoną fazę pomostową. Bez tego biznes będzie naciskał na pominięcie fazy 1, co dokument sam wymienia jako ryzyko (17).

### C. Faza 3 (centralny read store, Data API) stoi w sprzeczności z decyzją szefa

Artur dwukrotnie cytował szefa: firma nie chce być trzecim administratorem danych i nie chce, by PESEL-e szły przez jej serwery (24:10, 1:13:37). Dokument wprowadza centralną kopię danych mieszkańców w PostgreSQL, opt-in per gmina, z umową powierzenia i DPIA (10). Ryzyko jest uczciwie opisane w 10.6, ale wymaganie „portale dla mieszkańców” nie padło na spotkaniu, a odwrotne padło.

**Do uzupełnienia:** wyraźna decyzja zarządu przed fazą 3; do tego czasu faza 3 oznaczona jako warunkowa. Zapasowy tunel per tenant (10.6) jest wtedy wariantem głównym, nie zapasowym.

### D. Dolny próg zasobów Tier S jest optymistyczny

Budżet w 5.2: Site Host 300–500 MB, agent z updaterem poniżej 100 MB, broker leaf poniżej 50 MB, collector poniżej 100 MB. Na serwerze z 4 GB RAM, Firebirdem i dwoma API w IIS, gdzie „otwarcie menu Start wymaga dużo cierpliwości” (Artur 47:20), to walka o każdy megabajt. Dokument ma zapasowy transport (a) bez węzła leaf (10.3), ale tylko jako zapas.

**Do uzupełnienia:** nazwany profil minimalny Tier S (agent + host, bez brokera i collectora, telemetria wsadowo przez agenta) jako wspierany wariant, nie wyjątek. Pomiar zużycia na maszynie referencyjnej 4 GB jako kryterium wyjścia fazy 1.

### E. Hyper-V jako warunek Tier M przeczy racji wyboru VM Workstation

Marek tłumaczył, że VM Workstation wybrano, bo wiele wersji Windows w urzędach nie ma Hyper-V (16:59). Dokument wymaga Hyper-V dla Host Agenta i dopuszcza inny hypervisor tylko z ręcznym importem przez IT gminy, bez automatycznego provisioningu (5.3).

**Do uzupełnienia:** ADR z uzasadnieniem (Hyper-V vs VMware Workstation), plan migracji z obecnej VM-ki (wersja 10, Docker, menedżer Jana) do obrazu firmowego z Guest Agentem.

### F. Sieć: dokument zakłada internet, spotkanie tego nie rozstrzygnęło

Jan: dostęp do internetu jest wymogiem (3:41). Marek: DNS i ruch zewnętrzny bywają wycinane, polityki się zaostrzają (4:52). Dokument gwarantuje pracę offline (zasada 1), ale aktualizacje, enrollment i telemetria wymagają wychodzącego HTTPS (3, 8).

**Do uzupełnienia:** lista hostów i portów do allow-listy dla IT urzędu, zachowanie przy zablokowanym DNS, ścieżka aktualizacji bez internetu (pakiet dostarczony przez dystrybutora lub nośnik, weryfikowany tym samym podpisem).

### G. Dostęp wsparcia przez WireGuard wymaga akceptacji serwisu

Artur: „nie chcemy, żeby stawianie tuneli było w naszej odpowiedzialności” (23:28). Dokument proponuje firmowy control plane VPN (Headscale lub NetBird) z sesjami na żądanie, audytowanymi i widocznymi dla gminy (8.8, 11.7). To inna sytuacja niż tunele dla danych, ale kulturowo to zmiana. Sam dokument oznacza obecne procedury wsparcia jako pytanie otwarte (17).

**Do uzupełnienia:** uzgodnienie z serwisem (Artur, Rafał), zanim model trafi do fazy 2.

### H. Wymuszone aktualizacje a zobowiązania 5-letnie (P4, P8)

Polityka „lokalizacja nie może zostać w tyle o więcej niż 3 wydania, powyżej tego agent aktualizuje w najbliższym oknie” (8.4) może kolidować z realiami maszyn bez upgrade’u od 2 lat (1:02:23) i z umowami, w których rozwiązanie „ma działać w warunkach, które gmina jest w stanie zapewnić” (1:12:00).

**Do uzupełnienia:** wyjątek lub tryb „tylko bezpieczeństwo” dla lokalizacji na granicy zasobów; weryfikacja prawna z umowami projektowymi.

### I. Sprzęt z programu Cyberbezpieczny Samorząd (I8)

Dokument nie wspomina, że sprzęt kupiony z tego programu nie może gościć oprogramowania firmy według informacji od klientów (35:49–37:13). To ograniczenie wdrożeniowe, nie architektoniczne, ale określa, gdzie Tier M jest w ogóle możliwy. Marek wątpił w tę interpretację; warto zweryfikować zapisy umów.

**Do uzupełnienia:** wiersz w tabeli ograniczeń (3) i pytanie otwarte dla działu prawnego (17).

### J. Założenia w sekcji 3 rozmijają się z liczbami ze spotkania

Dokument: „tysiące lokalizacji wielostanowiskowych z dedykowanym serwerem, kilka dużych, wiele małych”. Spotkanie: ok. 10% klientów stać na dostosowanie serwerowe (Rafał 14:41), duże jednostki bez domeny, budżet instalowany na laptopach (I7), serwer stojący „pod nogami” (I2).

**Do uzupełnienia:** zasilenie tabeli ograniczeń analizą finansową bazy klientów, którą Artur proponował (1:08:12), oraz rozkładem Tier S / Tier M przewidywanym na jej podstawie. Dokument sam zakłada ponowną ocenę Tier M, jeśli jego udział spadnie poniżej 10% (17).

---

## 4. Podsumowanie dopasowania

| Obszar | Dopasowanie | Uwagi |
|---|---|---|
| Model wdrożenia (Tier S / Tier M, jeden build) | Wysokie | Odpowiada na główną blokadę. Do dopracowania profil minimalny (D) i Hyper-V (E). |
| Tożsamość i uprawnienia | Wysokie | Zamyka spór o bazę CI i ujednolica logowanie. |
| Bezpieczeństwo sekretów i audyt | Wysokie | Usuwa lukę XML/Firebird. |
| Zarządzanie flotą, aktualizacje, monitoring | Wysokie | Cel projektu pokryty szerzej niż na spotkaniu. Wymuszone aktualizacje do weryfikacji (H). |
| Rezydencja danych operatorów | Wysokie | Zgodne z decyzją szefa. |
| Istniejące API w IIS, ePłatności, certyfikacja | Brak | Luka A, najpilniejsza do uzupełnienia. |
| Krótkoterminowe wdrożenie opłat skarbowych | Brak | Luka B. |
| Centralny read store / Data API | Konflikt | Luka C, wymaga decyzji zarządu. |
| Sieć bez internetu / z wyciętym DNS | Częściowe | Luka F. |
| Dostęp wsparcia | Do uzgodnienia | Luka G. |
