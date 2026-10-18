# Podsumowanie spotkania: dystrybucja, instalacja i aktualizacja aplikacji (1.10.2026)

| | |
|---|---|
| **Spotkanie** | „Kontynuacja tematu z poprzedniego tygodnia” (nagranie 20261001_142340) |
| **Data i czas** | 1 października 2026, 12:23, czas trwania 1 godz. 22 min |
| **Źródło** | `2026-10-01-transkrypcja-spotkanie-dystrybucja.docx` (automatyczna transkrypcja Teams) |
| **Kontekst** | Pierwsze spotkanie w ramach projektu rozwiązania do dystrybucji, instalacji, aktualizacji i monitoringu aplikacji u dziesiątek tysięcy klientów. Tydzień wcześniej odbyło się spotkanie w innym gronie o VM-ce i sposobie jej aktualizacji (wg Marka Królikowskiego). |

## Uczestnicy

| Osoba | Rola wynikająca z rozmowy |
|---|---|
| **Jan Grabowski** („Janek”) | Programista. Od ~2 lat rozwija menedżer aplikacji (Docker w VM), poprawił admin tool Marcina. Prezentował menedżer. |
| **Artur** (w transkrypcji podpisany jako **Cezary Koper**) | Serwis / wdrożenia. Odpowiada za wdrażanie ePłatności i aplikacji do opłat skarbowych. Główne źródło wiedzy o realiach klientów. |
| **Marek Królikowski** | Infrastruktura / sieci. Autor VM-ki, na której działa Docker. Doświadczenie z sieciami urzędów. |
| **Adam Koper** | Architektura / bezpieczeństwo. Pytania o uwierzytelnianie, uprawnienia, odpowiedzialność za dane, propozycja agenta. |
| **Rafał Wilgos** | Serwis. Zna zamożność i infrastrukturę klientów (Legionowo, Wołomin, dzielnice Warszawy). |
| **Wojciech Grabowski** | Programista. Pytania o placówki bez API, propozycja API w procesie z exe. |
| **Zbigniew Dzido** | Pytanie o liczby: ilu klientów stać na serwer. |
| **Bolesław Groszek** | Organizator nagrania, propozycja spotkania na miejscu w przyszłym tygodniu. |
| **Jarek** | Obecny przy Arturze, nie zabierał głosu. Wspominany jako autor logowania / części auth. |
| Nieobecni, a wskazani jako potrzebni | **Paweł** (autor API mObywatel działającego w dwóch trybach), **Marcin** (autor admin toola; rozmowy o kierunku z Arturem), **szef** (decyzje o SaaS i danych osobowych). |

> **Uwaga o atrybucji.** Konto „Cezary Koper” było w praktyce wspólnym kontem sali, w której siedzieli Artur, Jarek i prawdopodobnie Cezary Koper. Dominującym głosem z tego konta jest Artur: uczestnicy zwracają się do niego „Artur” (Zbigniew 13:32, Jan 41:18, Wojciech 1:08:53), a pod koniec (1:21:22) Jan mówi „myślałem, że to Cezary Koper jesteś podpisany”, po czym odzywa się sam Cezary Koper. Pojedyncze krótkie wtrącenia z tego konta (7:16, 18:07, fragment 28:40) to ktoś inny z sali zwracający się do Artura. W dokumencie wypowiedzi merytoryczne z tego konta oznaczam jako **Artur**. Transkrypcja jest automatyczna i zniekształca nazwy techniczne, słowniczek na końcu dokumentu.

---

## 1. Podsumowanie spotkania

**Jednym zdaniem:** planowana prezentacja menedżera aplikacji (Docker w VM) zamieniła się w konfrontację koncepcji technicznej z realiami klientów, które pokazały, że obecny kierunek (VM + Docker) nie jest wdrażalny u ok. 90% klientów, i zakończyła się decyzją o przemyśleniu kierunku przed kolejnym krokiem.

**Przebieg:**

1. **Prezentacja stanu obecnego (Jan, 0:03–7:00).** Jan opisał trzy istniejące elementy: licensing serwer z ftp (sprawdza licencje i udostępnia paczki), paczkomat oraz menedżer aplikacji sterujący Dockerem w VM przez SSH. Zaczął demo menedżera (hasło, konfiguracja IP VM-ki, pomocnik wyliczający parametry sieci). Marek zakwestionował sztywne DNS-y. Demo przerwała awaria („Ubuntu serwer nie działa”), Jan restartował komputer.

2. **Realia klientów (Artur, 7:45–21:30).** Artur przedstawił sytuację: klienci to głównie małe, biedne jednostki (gminy, biblioteki, szkoły, żłobki, przedszkola). Jedyna aplikacja wymagająca VM-ki (opłaty skarbowe) ma 2 wdrożenia produkcyjne na 60 klientów ePłatności (plus 20 w kolejce), bo urzędy nie mają zasobów serwerowych. Rafał oszacował, że ~10% klientów stać na dostosowanie serwerowe. Jan podsumował: „decyzja o pójściu w Dockera nie była najlepsza”. Marek przypomniał, że VM Workstation wybrano właśnie po to, by działało na słabym sprzęcie bez ESX-a i Hyper-V.

3. **Odrzucone alternatywy (21:30–25:00).** Marek zaproponował dzierżawę serwerów w chmurze (OVH) dla gmin. Artur i Rafał odrzucili: to model SaaS, przez serwery firmy latałyby dane osobowe, szef jasno powiedział, że firma nie chce być administratorem danych.

4. **Spór o zakres (25:00–31:00).** Marek: tydzień temu rozmawiano ogólnie o VM-ce i aktualizacjach, nie o konkretnej aplikacji. Artur: opłaty skarbowe to pierwsza aplikacja dystrybuowana w ten sposób i pokazuje przeszkody, które powtórzą się przy kolejnych. Marek uznał to za istotne nowe informacje, których tydzień temu nie było.

5. **Rozwiązanie dwutorowe (31:00–52:00).** Jan zaproponował drugi tor: aplikacje WebView działające „po staremu” (bezpośrednio na bazach, bez baz CI i gatewayów), ten sam kod w dwóch trybach. Marek poparł dwutorowość (exe dla biednych, Docker/VM w portfolio dla bogatszych, z czasem migracja). Adam zaproponował agenta (usługę Windows) na słabych maszynach i rozdzielenie: dwutorowa instalacja, ale aplikacje jednolicie przepinane na API. Artur: rewolucja w instalacji jest dla użytkownika nieistotna, liczy się jakość aplikacji, nie zaczynać od małej aplikacji.

6. **Bezpieczeństwo i tożsamość (39:00–59:30).** Wątek baz CI, synchronizacji operatorów, Active Directory (10% klientów), haseł w tabelach operatorów. Artur ujawnił, że obecne exe mają poważną lukę: hasło do Firebirda w XML-u z łatwym do zdjęcia szyfrowaniem. Adam pytał o gotowość na audyt i odpowiedzialność za dane.

7. **Propozycja pierwszego kroku (Artur, 52:20–1:02:00).** Dostarczyć aplikację do opłat skarbowych jako sam front (exe/WebView) z plikiem konfiguracyjnym wskazującym na 2 API, które już działają w IIS u 60 klientów. Instalacja obok istniejących aplikacji, na serwerze lub stacji roboczej. Baza CI przy Firebirdzie plus małe API do logowania jako następny krok.

8. **Pato-stan u 2 klientów i zobowiązania (1:10:49–1:13:30).** U 2 klientów mObywatel działa podwójnie (Docker i IIS), z różnym logowaniem. Rozwiązania sprzedane w projektach muszą działać 5 lat w warunkach, jakie gmina jest w stanie zapewnić.

9. **Zakończenie (1:18:58–1:22:00).** Decyzja: zrobić transkrypcję, przemyśleć, wrócić w przyszłym tygodniu (możliwe spotkanie na miejscu). Adam zaproponował drugi, równoległy tor techniczny: uwierzytelnianie, baza CI. Jan: potrzebni Paweł i Jarek.

---

## 2. Wymagania stawiane przed systemem

### 2.1 Wymagania biznesowe i produktowe

| # | Wymaganie | Autor | Źródło |
|---|---|---|---|
| W1 | Rozwiązanie musi działać u **małych i biednych jednostek** (gminy, biblioteki, szkoły, żłobki, przedszkola), bo z nich firma się utrzymuje. „Nasze aplikacje nie mają działać u 10%”. | Artur | 15:08, 28:40, 1:04:11 |
| W2 | Nowa aplikacja musi dać się **doinstalować obok obecnych aplikacji**, na serwerze „na którym jest groszek”, bez wymagania nowego serwera. Klienci zawsze pytają „czy można to dołożyć do tego serwera?”. | Artur | 12:28, 1:00:32 |
| W3 | Aplikacja powinna dać się uruchomić zarówno **ze stacji roboczej, jak i z serwera**. | Artur | 1:00:32 |
| W4 | Zmiana metody instalacji nie może być celem samym w sobie. „Dla użytkownika końcowego rewolucja związana z metodą instalacji jest totalnie nieistotna”, rewolucją musi być jakość aplikacji. | Artur | 51:38 |
| W5 | Nie zaczynać migracji od małej, opcjonalnej aplikacji. Argumentem do pozyskania serwera może być dopiero **pakiet kluczowych aplikacji** (budżet, podatki, rejestr VAT) w nowej wersji. | Artur | 19:00, 49:07 |
| W6 | Jeśli kierunek VM/Docker zostanie utrzymany, trzeba zaakceptować **utrzymanie dwutorowe** przez lata: obecne exe/IIS równolegle z nowym torem. | Artur, Marek, Jan | 38:25, 50:36 |
| W7 | Firma **nie może być pośrednikiem/administratorem danych osobowych** ani dostawcą serwerów (brak modelu SaaS). Rozwiązania mają być własnością gminy, hostowane w urzędzie. | Artur (decyzja szefa) | 22:35, 24:10, 1:13:37 |
| W8 | Rozwiązania sprzedane w projektach muszą **działać przez 5 lat** w warunkach infrastrukturalnych, jakie zapewnia gmina. Nie można wymusić dokupienia serwera. | Artur | 1:12:00 |
| W9 | Opłaty skarbowe powinny być **natychmiast wdrażalne u 60 klientów (plus 20 w drodze)** jako pierwszy krok. | Artur | 59:23 |

### 2.2 Wymagania techniczne

| # | Wymaganie | Autor | Źródło |
|---|---|---|---|
| T1 | **Wykrywanie konfiguracji sieci** (IP, brama, CIDR, DNS) ma pobierać wartości z systemu operacyjnego komputera, a nie proponować sztywnych DNS-ów (8.8.8.8). | Marek | 3:29–4:37 |
| T2 | Rozwiązanie powinno **działać na bardzo słabym sprzęcie** bez ESX-a, Hyper-V i dedykowanych serwerów. To było pierwotne założenie VM Workstation. | Marek | 15:35, 16:59 |
| T3 | Rozwiązanie musi działać w środowisku, w którym **ruch DNS i dostęp do internetu mogą być wycinane** (polityki bezpieczeństwa urzędów zaostrzają się). Obecnie dostęp do internetu jest wymogiem (Jan). Rozbieżność do rozstrzygnięcia. | Marek vs Jan | 3:41, 4:52 |
| T4 | Aplikacje (np. ePłatności) powinny działać **tym samym kodem w dwóch trybach**: w kontenerze Docker i jako WebView/exe, co wymaga przeróbki API na oba tryby. | Jan | 30:30, 38:15, 1:06:12 |
| T5 | W torze WebView/exe aplikacje mają łączyć się **bezpośrednio z właściwą bazą**, bez centralnego gatewaya i bez bazy CI. | Jan | 43:20, 1:05:36 |
| T6 | Mikroserwisy używane dziś w Dockerze powinny być dostępne jako **NuGety lub osobne API** bez ekosystemu dockerowego. | Jan, Wojciech | 1:06:06 |
| T7 | **Uwierzytelnianie i zarządzanie uprawnieniami to dwie różne rzeczy** i powinny dać się rozdzielić. | Adam | 44:30 |
| T8 | Rozwiązanie musi być **gotowe na audyt bezpieczeństwa** (np. 30 dni na aktualizację pod rygorem wyłączenia). | Adam | 41:37 |
| T9 | Zabezpieczenie „nie ma dostępu z internetu” **nie jest wystarczające**, większość wycieków idzie od wewnątrz organizacji (phishing, przejęcie komputera). | Adam, Marek | 1:17:18, 1:18:20 |
| T10 | Menedżer aplikacji i exe powinny **przepiąć się na API logowania** z bezpieczniejszym, wspólnym sposobem uwierzytelniania zamiast jawnych XML-i z hasłami do bazy. | Artur | 55:30, 1:20:07 |
| T11 | Obok bazy Firebird (podatkowej) ma stanąć **baza CI plus małe API**, które obsłuży logowanie i zwróci połączenia do baz. | Artur | 55:30 |
| T12 | Aplikacja opłat skarbowych jako sam **front plus plik konfiguracyjny z linkami do API** działających już w IIS. | Artur | 59:23 |
| T13 | API synchronizujące z mObywatel musi **działać 24/7** (księgowanie wpłat, wysyłka co 30–60 min), nie może żyć tylko w procesie aplikacji użytkownika. | Artur | 1:09:24 |
| T14 | Jeśli front ma własne API, powinno być **okrojone do niezbędnych endpointów**, by nie gryzło się z API działającym 24/7. | Artur | 1:10:40 |
| T15 | Usunąć **podwójne instancje tych samych API** z różnym uwierzytelnianiem (stan u 2 klientów). | Artur | 1:10:49 |
| T16 | Na słabych maszynach ewentualny **agent (usługa Windows)** instaluje, aktualizuje i monitoruje usługi API / aplikacje IIS. | Adam | 47:57 |
| T17 | Zminimalizować zasoby: obecny dysk VM 8,5 GB (w tym 4 GB swap), RAM 1 GB zajęty. Rozmiar dysku może być istotny. | Jan, Artur | 1:03:27 |

### 2.3 Pytania, na które system/zespół musi odpowiedzieć

- Ilu klientów faktycznie stać na serwer pod kontenery? (Zbigniew, 13:32) Odpowiedź Rafała: ok. 10%. Artur proponuje analizę bazy klientów na podstawie sprawozdań finansowych (1:08:12).
- Czy problem jest finansowy, logistyczny, czy sieciowy? (Marek, 21:35) Artur: przede wszystkim finansowy (brak środków na serwery), ale także brak czasu IT (serwer leżący w paczce).
- Czy 90% małych klientów jest finansowo ważniejsze niż 10% dużych? „Trzeba policzyć finansowo”. (Marek, 29:02)
- Czy planem jest, by wszystkie aplikacje działały na kontenerach? (Artur, 30:19) Nie rozstrzygnięto.

---

## 3. Co mamy: istniejące rozwiązania

### 3.1 Licensing serwer i paczkomat

| | |
|---|---|
| **Opis** | Serwer licencji na ftp (ki.groszek.pl). Oprócz sprawdzania licencji pozwala pobierać paczki w urzędach. Paczkomat to narzędzie do paczek. | Jan (0:03) |
| **Autor rozwiązania** | Antek, 19 lat, już nie pracuje w firmie. | Jan (0:18) |
| **Ocena** | „Nie jest to perfekcyjne rozwiązanie, ale działa.” Szczegóły miały być omówione później, nie wrócono do tematu. | Jan |

### 3.2 Menedżer aplikacji (Jan) + VM-ka (Marek)

| | | Autor |
|---|---|---|
| **Opis** | Aplikacja desktopowa (wersja debug prezentowana), nad którą Jan pracuje od ~2 lat, zmieniana kilka razy. Steruje Dockerem w VM zdalnie, wykonując polecenia przez SSH. VM (wersja 10, najnowsza) przygotowana przez Marka ze środowiskiem Dockera. Na VM: główne API, gateway/proxy, kontenery mObywatel itd. | Jan (0:18, 31:00) |
| **Co działa dobrze** | Jednakowa wersja VM wszędzie, więc instalacja samych aplikacji nie jest problemem (brak heterogeniczności środowisk). Kontenery „dość dopieszczone”. Wymagane hasło przy wejściu. Pomocnik do konfiguracji sieci (proponowane IP, CIDR, brama, DNS, link do narzędzia IP conflict), z algorytmem liczącym score przy wielu sieciach. Zużycie RAM ok. 1 GB. | Adam (47:57), Jan (30:30, 1:03:27) |
| **Co nie działa / problemy** | (a) **Wymaga VM-ki i zasobów**, których 58 z 60 klientów nie znalazło. (b) **Konfiguracja stałego IP** przerasta informatyków w urzędach. (c) **DNS-y sztywne** (8.8.8.8), a w urzędach ruch DNS zewnętrzny bywa wycinany. (d) **Wymaga dostępu do internetu**. (e) Dysk VM 8,5 GB. (f) Demo przerwała awaria VM (Ubuntu serwer nie działał). (g) Decyzje o kierunku podejmowano bez serwisu („w firmie są 3 firmy: programiści starych aplikacji, programiści nowych, serwis”). | Artur (12:28, 17:44), Jan (2:30), Marek (3:29) |
| **Pomysły** | DNS z konfiguracji OS (Marek). Nie zamykać projektu, trzymać w portfolio dla bogatszych klientów z własnym ESX/serwerami (Marek, 37:43). Docelowo zamiana 1:1 serwera Windows z Firebirdem na VM z kontenerami, gdy będzie komplet aplikacji (Artur, 49:07). Przerobić menedżer na wspólny, bezpieczniejszy sposób logowania (Artur, 1:20:07). |

### 3.3 Aplikacje desktopowe (exe) + Firebird

| | | Autor |
|---|---|---|
| **Opis** | Dziedzinowe aplikacje desktopowe (budżet, podatki, płace, rejestr VAT, kadry) pracujące na 3 bazach Firebird: podatkowej (korzysta z niej 99% aplikacji), budżetowej, płacowej. Każda baza ma własne tabele operatorów (login, hasło, imię, nazwisko), osobny słownik uprawnień i tabelę przypisań. Opcjonalne logowanie domenowe. Firebird w ponad 90% stoi na Windowsie. | Artur (43:36–44:56, 46:13) |
| **Co działa dobrze** | Działa wszędzie, także na laptopie „pani w bibliotece”. Łatwa instalacja („dołożenie exe nie jest problemem”). Najwięcej licencji sprzedanych na budżet. Nie łączy się z internetem. | Artur (12:28, 29:17), Jan (1:17:11) |
| **Co nie działa / problemy** | (a) **Gigantyczna luka bezpieczeństwa**: login i hasło do Firebirda w XML-u, szyfrowanie trywialne do zdjęcia przez każdego informatyka. (b) Brak synchronizacji operatorów między bazami i z bazą CI. (c) Budżet bywa zainstalowany na laptopie, nie na serwerze, więc kontener tam nie ma sensu. | Artur (52:20, 39:08, 29:17) |
| **Pomysły** | Przepiąć exe z XML-i na API logowania (Artur). Aplikacje exe i webowe jednolicie przepinać na API (Adam, 51:02). |

### 3.4 ePłatności / API mObywatel (IIS)

| | | Autor |
|---|---|---|
| **Opis** | Dwa API działające na IIS na Windowsie u 60 klientów (20 w drodze), najczęściej na tym samym serwerze co Firebird. Wysyłają zobowiązania obywateli (wszystkie PESEL-e z urzędu) do API Ministerstwa Cyfryzacji co 30–60 min, działają 24/7. Cena ok. 20 tys. zł, jedna z najdroższych pozycji w cenniku. Firma jako pierwsza i od 1,5 roku jedyna w Polsce obsłużyła w ten sposób opłaty skarbowe. | Artur (12:00, 31:38, 46:13, 1:09:24) |
| **Co działa dobrze** | Klienci zadowoleni, „urząd dzwoni do urzędu”. Uptime 99,9%. Bezpieczeństwo: API tylko w sieci lokalnej, identyfikator i secret jednostki, certyfikat SSL, whitelist IP, certyfikacja i testy bezpieczeństwa Ministerstwa Cyfryzacji. Paweł zrobił API mObywatel działające w 2 trybach (IIS i Docker). | Artur (31:38, 58:10–59:14), Jan (1:06:12) |
| **Co nie działa / problemy** | (a) Rozwijane **dwutorowo**: 2 API na IIS u większości klientów, wersja docelowa (Docker) u 2 klientów. (b) U tych 2 klientów **mObywatel działa podwójnie** (Docker i IIS), inne wersje, inne biblioteki logowania (IIS loguje bezpośrednio do bazy podatkowej, Docker przez bazę CI), synchronizacja wyłączona w Dockerze. (c) Secret jednostki trzymany w bazie. (d) Dofinansowania napędzały połowę sprzedaży, bez nich urzędy nie kupują. | Artur (38:25, 1:10:49–1:12:00, 20:30) |
| **Pomysły** | Wykorzystać te API jako backend dla frontu opłat skarbowych (Artur). Okroić API do potrzebnych endpointów dla frontu (Artur, Wojciech). |

### 3.5 Aplikacja do opłat skarbowych (Docker/VM)

| | | Autor |
|---|---|---|
| **Opis** | „Malutki kawałek frontu”, który głównie wyświetla dane i komunikuje się z API. Pierwsza aplikacja dystrybuowana w nowym modelu (VM + Docker). | Artur (21:00, 26:33) |
| **Co działa dobrze** | Ładnie wygląda, „na filmie do pokazania”. 2 wdrożenia produkcyjne działają. | Artur |
| **Co nie działa / problemy** | **2 wdrożenia na 60 klientów**, bo wymaga VM-ki i zasobów, których urzędy nie mają. Jeden z 20 w kolejce prawdopodobnie znajdzie zasoby. „Zrobiliśmy aplikację dla siebie, a nie dla klienta.” Szef pyta, dlaczego taki stosunek. | Artur (12:00, 20:00, 31:38) |
| **Pomysły** | Dostarczyć jako exe/WebView (sam front + config) instalowany obok istniejących aplikacji, jak asystent / inne drobne aplikacje (Artur, 55:30, 59:23). Jan: przerobić na WebView „po staremu”, bez gatewayów i baz CI (1:05:36). |

### 3.6 Baza CI (centralna baza operatorów i połączeń)

| | | Autor |
|---|---|---|
| **Opis** | Baza zbierająca wszystkich operatorów w jednym miejscu wraz z informacjami o połączeniach do baz. Używana przez wersję dockerową przez centralny gateway API, który rozdziela ruch na poszczególne bazy. Istniał pomysł przepięcia exe z XML-i na tę bazę. | Artur (39:08), Jan (43:20) |
| **Co działa dobrze** | Łatwa do dorzucenia do 60 klientów (plik bazy Firebird). | Artur (39:08, 41:22) |
| **Co nie działa / problemy** | **Brak synchronizacji** z tabelami operatorów w bazach głównych: operatorzy są kopiowani przy instalacji, ale zmiana hasła czy uprawnień nie jest synchronizowana. Wymagałaby kolejnej aplikacji synchronizującej, co „jest bez sensu” (Jan). Serwis niechętnie przyjmował dodatkowe bazy (rejestr, asystent). Trzecia odrębna metoda uwierzytelniania („trzecia lepianka autentykacji”). | Artur (39:08, 41:22, 55:30), Jan (41:18) |
| **Pomysły** | Jan: baza CI i gateway są niepotrzebne w torze WebView, API łączy się bezpośrednio z właściwą bazą. Artur: przeciwnie, baza CI przy Firebirdzie plus małe API logowania jest kluczem do odejścia od XML-i we wszystkich aplikacjach, ale pod warunkiem rozwiązania synchronizacji operatorów. Logowanie domenowe (gdzie wdrożone) omija problem. Nierozstrzygnięte. |

### 3.7 Admin tool (Marcin, poprawiony przez Jana)

| | | Autor |
|---|---|---|
| **Opis** | Program otrzymany od Marcina, Jan go poprawił. Ma synchronizację operatorów między bazami. | Jan (40:55) |
| **Ocena** | Jan sam przyznaje, że to „kolejny problem”: kolejna aplikacja, którą informatyk musi uruchamiać, by zsynchronizować zmianę hasła. | Jan, Artur (41:00) |

### 3.8 ePodatnik (przeszłość)

Rozwiązanie na serwerze jednostki łączące się do API Ministerstwa Cyfryzacji. Temat, od którego firma odchodzi: zobowiązania są widoczne w mObywatel, jednostki rezygnują z ePodatnika. Traktować jako przeszłość. (Artur, 24:21)

---

## 4. Ograniczenia

### 4.1 Ograniczenia infrastrukturalne (po stronie klientów)

| # | Ograniczenie | Autor | Źródło |
|---|---|---|---|
| I1 | **Brak serwerów i środków na nie.** Tylko ok. 10% klientów stać na dostosowanie serwerowe. Legionowo (miasto) nie ma środków, 2 lata temu problemem był zakup serwera. Województwa podlaskie, lubelskie, podkarpackie jeszcze gorzej. | Rafał, Artur | 14:41, 15:08 |
| I2 | **Słaby sprzęt.** Serwer z Firebirdem i aplikacjami z 4 GB RAM, bez możliwości rozbudowy, od 2 lat bez upgrade’u, otwarcie menu Start wymaga „dużo cierpliwości”. W Nieporęcie rozwiązanie webowe stoi na komputerze po pracowniku „pod nogami”, bo Windows Server 2016 nie obsługiwał certyfikatu. Instalacje na stacjach roboczych, bo „serwer będzie za miesiąc” (a to trwa latami). | Artur | 47:20, 1:02:13, 1:04:11, 18:07 |
| I3 | **Windows wszędzie.** Ponad 90% instalacji Firebirda na Windowsie, różne wersje, niektóre bez Hyper-V. Stąd wybór starej wersji VM Workstation (wg Marka działa „chyba” nawet na Windows 2003). | Artur, Marek | 46:13, 16:59 |
| I4 | **Heterogeniczność środowisk.** Każda maszyna w placówce ma inne środowisko i wersje oprogramowania. Agent na gołej maszynie przyniósłby wszystkie problemy instalacyjne, których VM nie ma. | Adam | 47:57 |
| I5 | **Brak Active Directory / domeny u ok. 90% klientów.** Nawet starostwo w Wołominie (600 osób) i 2–3 dzielnice Warszawy nie mają domeny, użytkownicy „latają po komputerach”. Całe uwierzytelnianie opiera się na kontach w aplikacjach exe. | Rafał, Adam | 45:22 |
| I6 | **Sieć.** Zewnętrzny ruch DNS bywa całkowicie wycinany (zakaz DNS Google/Cloudflare). Polityki bezpieczeństwa zaostrzają się, to „kwestia czasu”, aż ruch DNS będzie wycinany powszechnie. | Marek | 3:46, 4:52 |
| I7 | **Instalacja na laptopach.** Część klientów (biblioteki, szkoły) ma budżet zainstalowany na laptopie, nie na serwerze. | Artur | 29:17 |
| I8 | **Sprzęt z dofinansowań nie dla nas.** Sprzęt kupiony z programu Cyberbezpieczny Samorząd może służyć wyłącznie rozwiązaniom bezpieczeństwa, umowy nie pozwalają instalować tam oprogramowania firmy. Wiele urzędów odmówiło instalacji z tego powodu. Marek wątpił, ale Artur powołał się na informacje od klientów. | Artur | 11:00, 35:49–37:13 |
| I9 | **Zasoby VM.** Dysk wirtualny 8,5 GB (4 GB swap), ok. 1 GB RAM zajęty. Marek: celem było działanie na bardzo słabym sprzęcie. | Jan, Marek | 1:03:27, 15:35 |

### 4.2 Ograniczenia wynikające z użytkowników i doświadczeń z istniejącymi rozwiązaniami

| # | Ograniczenie | Autor | Źródło |
|---|---|---|---|
| U1 | **Niski poziom wiedzy informatyków w urzędach.** Nie radzą sobie z własną siecią, wyborem stałego IP; „osoba odpowiedzialna za sieć placówki nie wie, jak działa sieć placówki”. Nie każdy urząd ma dział IT. | Jan, Artur | 1:30, 5:18, 7:16 |
| U2 | **Brak czasu IT.** Są urzędy, które mają serwer „w paczce” i nie mają czasu go rozpakować i zainstalować. | Artur | 28:40 |
| U3 | **Rewolucja się nie sprzedaje.** Wymaganie VM i obrazu dla małej aplikacji „nie przechodzi”. Decyzja o zakupie często zależy od odpowiedzi na pytanie „czy można to dołożyć do obecnego serwera?”. | Artur | 10:00, 1:00:32 |
| U4 | **Opór serwisu na dodatkowe bazy.** Serwis źle przyjmował dodatkowe bazy w rejestrze i asystencie. | Artur | 41:22 |
| U5 | **Synchronizacja musi być automatyczna.** Użytkownik nie uruchomi ręcznie synchronizacji (urlop 2 tygodnie = nieaktualne dane). | Artur | 1:09:24 |
| U6 | **Użytkownik końcowy nie widzi metody instalacji.** Wartość musi być w jakości aplikacji. | Artur | 51:38 |
| U7 | **Zła prasa przy nieudanym wdrożeniu.** Doświadczenie z rejestrem (KSeF?) nadszarpnęło wizerunek; ePłatności są przeciwieństwem i nie wolno tego zepsuć. | Artur | 31:38 |
| U8 | **Dla programistów utrzymanie dwóch wersji** (IIS i Docker) tego samego API z różnym logowaniem jest patologią i obciążeniem; Jarek „dostanie szału” od kolejnej metody auth. | Artur | 55:30, 1:10:49 |

### 4.3 Ograniczenia prawne, organizacyjne i biznesowe

| # | Ograniczenie | Autor | Źródło |
|---|---|---|---|
| P1 | **Dane osobowe nie mogą przechodzić przez serwery firmy.** Do mObywatel wysyłane są wszystkie PESEL-e z urzędu. Administratorów danych jest dwóch (Ministerstwo Cyfryzacji i urząd), firma nie chce być trzecim. Decyzja szefa: odciąć się od danych osobowych i odpowiedzialności. Wyklucza hosting poza urzędem i model SaaS. | Artur | 24:10, 1:13:37 |
| P2 | **Firma nie stawia tuneli ani nie konfiguruje dostępów**, to odpowiedzialność informatyków urzędu; firma nie chce być pośrednikiem w sprzedaży serwerów. | Artur | 23:28 |
| P3 | **Odpowiedzialność za bezpieczeństwo nie znika z faktu, że dane leżą u klienta.** Należyta staranność (przechowywanie haseł) obciąża firmę; w razie wycieku kwestia audytu rozstrzygnie winnego. Artur: baza jest własnością urzędu, Firebirda stawia informatyk urzędu; dotychczasowe wycieki (ransomware) nie dotyczyły oprogramowania firmy. | Adam vs Artur | 1:14:22–1:17:11 |
| P4 | **Zobowiązania 5-letnie.** Projekty sprzedane z 5-letnim serwisem muszą działać przez ten czas w warunkach, jakie gmina zapewnia. | Artur | 1:12:00 |
| P5 | **Certyfikacja Ministerstwa Cyfryzacji.** Rozwiązanie ePłatności przeszło certyfikację i testy bezpieczeństwa; ministerstwo odeszło od osobnego łącza/tunelu na rzecz danych dostępowych plus certyfikatu SSL. Zmiany architektury muszą to uszanować. | Artur | 58:10, 1:14:41 |
| P6 | **Cykl budżetowy JST.** Budżety planowane są na rok do przodu (wrzesień/październik to końcówka planowania), zakupy „z miesiąca na miesiąc” są trudne. Wydatki na serwer to „kolejny wydatek” po 20 tys. zł za aplikację. | Artur | 13:46, 1:00:32 |
| P7 | **Dofinansowania wymuszają zakupy, ale ograniczają sprzęt** (patrz I8). Połowa klientów ePłatności kupiła dzięki dofinansowaniom. | Artur | 20:30 |
| P8 | **Firma wewnętrznie podzielona** na „3 firmy” (programiści starych aplikacji, nowych, serwis), decyzje techniczne zapadały bez serwisu, który jest najbliżej klienta. | Artur | 17:44 |
| P9 | **Brak kompletu nowych aplikacji** w najbliższym czasie, więc nie ma argumentu do pozyskania serwera od klienta. | Artur | 49:07 |

---

## 5. Propozycje rozwiązań zgłoszone na spotkaniu

| # | Propozycja | Autor | Reakcja / status |
|---|---|---|---|
| R1 | DNS-y i parametry sieci z konfiguracji OS zamiast na sztywno. | Marek | Jan „zanotował w głowie”. Do zrobienia. |
| R2 | Dzierżawa serwerów w chmurze (OVH) dla gmin, ~500 zł/mies. zamiast kilkudziesięciu tysięcy na serwer. | Marek, Adam | **Odrzucona** (Artur, Rafał): model SaaS, dane osobowe przez serwery firmy, odpowiedzialność za tunele. |
| R3 | Rozwój dwutorowy: exe dla biednych klientów, Docker/VM w portfolio dla bogatszych (własny ESX), z czasem migracja. Nie zamykać projektu Docker. | Marek | Poparte przez Jana i Adama. Artur: ok, ale nie zaczynać od małej aplikacji i pamiętać o koszcie utrzymania dwóch torów. |
| R4 | Aplikacje WebView działające „po staremu”: bezpośrednio na bazach, bez gatewaya i bazy CI, ten sam kod w dwóch trybach; mikroserwisy jako NuGety lub osobne API. | Jan | Artur: „Amen” (1:05:59). Wojciech dopytał o NuGety. Wymaga przeróbki API (osoby od API, nie frontu). |
| R5 | Agent / usługa Windows na słabych maszynach, która instaluje, aktualizuje i monitoruje API i aplikacje IIS. | Adam | Zgłoszona z zastrzeżeniem o heterogeniczności środowisk. Nie rozstrzygnięta. |
| R6 | Dwutorowość tylko w instalacji; aplikacje (exe i webowe) jednolicie przepinać na API hostowane albo z exe (jak dziś), albo w Dockerze. | Adam | Nie rozstrzygnięta. |
| R7 | **Krok 1:** opłaty skarbowe jako sam front + plik config z linkami do 2 API już działających w IIS; instalacja obok istniejących aplikacji, na serwerze lub stacji. Natychmiast wdrażalne u 60 + 20 klientów. | Artur | Główna rekomendacja Artura. Jan zgodny. |
| R8 | **Krok 2:** baza CI przy Firebirdzie + małe API do logowania zwracające połączenia; przepięcie menedżera i exe na to API; usunięcie jawnych XML-i. | Artur | Artur sam wskazuje blokadę: brak synchronizacji operatorów. Jan: w torze WebView baza CI zbędna. **Do rozstrzygnięcia w torze technicznym.** |
| R9 | API uruchamiane w procesie razem z exe i frontendem, bez hostingu. | Wojciech | **Odrzucona** w pełnej formie (API musi działać 24/7). Wariant: okrojone API tylko z endpointami frontu. |
| R10 | Przeanalizować bazę klientów (sprawozdania finansowe) i policzyć, kogo stać na serwer; porównać wartość 90% małych vs 10% dużych. | Artur, Marek | Do zrobienia. |
| R11 | Zamiana 1:1 serwera Windows z Firebirdem na VM z kontenerami, gdy będzie gotowy pakiet 6 kluczowych aplikacji. | Artur | Wizja długoterminowa. |
| R12 | Osobny, równoległy tor dyskusji technicznej: uwierzytelnianie, baza CI, bezpieczeństwo. | Adam | Przyjęte przez Artura („bardzo istotne”). |

---

## 6. Kwestie otwarte i decyzje do podjęcia

1. **Kierunek docelowy:** czy wszystkie aplikacje mają docelowo działać w kontenerach, czy trwale dwutorowo? (Artur 30:19, nierozstrzygnięte)
2. **Baza CI: trzymać czy usunąć?** Jan: zbędna w torze WebView. Artur: klucz do bezpiecznego logowania, ale bez synchronizacji operatorów to kolejny problem.
3. **Model uwierzytelniania:** jak ujednolicić logowanie (IIS bezpośrednio do bazy, Docker przez bazę CI, exe przez XML) i rozdzielić uwierzytelnianie od uprawnień przy 90% klientów bez domeny?
4. **Luka XML/Firebird:** kto i kiedy usuwa jawne hasła do bazy z XML-i?
5. **Dostęp do internetu i DNS:** czy rozwiązanie może wymagać internetu (Jan), czy musi działać w sieci z wyciętym DNS (Marek)?
6. **Wymagania sprzętowe minimalne:** co jest realnym minimum, skoro są serwery z 4 GB RAM?
7. **Kto decyduje o przepisaniu dużej aplikacji** (budżet/podatki), która uzasadni prośbę o serwer? (Adam 50:26)
8. **Gotowość na audyt** i odpowiedzialność przy wycieku: stanowiska Adama i Artura rozbieżne.
9. **Czy sprzęt z Cyberbezpiecznego Samorządu** rzeczywiście nie może gościć oprogramowania firmy (Artur: tak wg klientów, Marek: wątpi)? Warto zweryfikować zapisy umów.

---

## 7. Następne kroki ustalone na spotkaniu

| Krok | Odpowiedzialny | Źródło |
|---|---|---|
| Transkrypcja nagrania i przemyślenie tematu przed kolejnym krokiem. | Artur, wszyscy | 1:18:58, 1:19:34 |
| Kolejne spotkanie w przyszłym tygodniu, możliwie na miejscu, w tym samym lub mniejszym gronie. | Bolesław, Artur, Adam | 1:19:42, 1:20:58 |
| Zaprosić Pawła i Jarka na kolejne spotkanie. | Jan | 1:20:58 |
| Uruchomić drugi tor dyskusji: uwierzytelnianie, baza CI, bezpieczeństwo. | Adam | 1:19:54 |
| Przerobić menedżer na wspólny, bezpieczniejszy sposób logowania („w międzyczasie”). | Artur (propozycja) | 1:20:07 |
| Materiały o projektach płatności wrzucić do Second Brain. | Artur | 1:08:12 |
| Analiza finansowa bazy klientów (kogo stać na serwer). | Artur (propozycja) | 1:08:12 |
| Pobieranie DNS z konfiguracji OS w pomocniku sieciowym. | Jan | 4:26 |

---

## 8. Słowniczek (zniekształcenia automatycznej transkrypcji)

| W transkrypcji | Znaczenie |
|---|---|
| egzek, egzeki, egzekucje | aplikacje desktopowe `.exe` |
| fajerwerd, fajerwerk, fairbert, fireberg | baza danych **Firebird** |
| wiem ka, VM Ki, wiemka, wiem c | **VM-ka**, maszyna wirtualna (VMware Workstation) |
| doker, dokker, doktor, toker, pokerze | **Docker** |
| a ja jest, jajes, a ja SA, jasie | **IIS** (Internet Information Services) |
| web vu, web wiu, łeb wiu, web v | **WebView** (aplikacja desktopowa z frontem webowym) |
| baza CI, CII, celi, sejm, cech | **baza CI**, centralna baza operatorów i połączeń do baz |
| m obywatel | **mObywatel** |
| e płatności, epłatności | **ePłatności** |
| paczkomat | narzędzie do paczek instalacyjnych |
| cyberbezpieczny samorząd | program dofinansowań **Cyberbezpieczny Samorząd** |
| rejestr ksywę celu / asystent celu | rejestr i asystent (prawdopodobnie KSeF / CEL), aplikacje z dodatkowymi bazami |
| second break | **Second Brain** (baza wiedzy) |
| Józef | prawdopodobnie serwis auth / gateway w ekosystemie dockerowym (niepewne) |
| Jarek / Jadzia / pani Krysia / Grażyna | Jarek: programista (auth); pozostałe to umowne określenia pracowników urzędów |
| groszek | potocznie serwer, na którym są aplikacje firmy („tam gdzie jest groszek”) |
