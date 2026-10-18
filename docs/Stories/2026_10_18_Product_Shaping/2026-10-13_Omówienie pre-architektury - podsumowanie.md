# Omówienie pre-architektury — podsumowanie spotkania

| | |
|---|---|
| **Źródło** | `Omówienie pre-architektury .vtt` (transkrypt, ok. 61 min) |
| **Uczestnicy** | Adam Koper (prowadzący, autor dokumentu architektury), Marcin Grzybowski, Bolesław Groszek |
| **Kontekst** | Drugie spotkanie w sprawie platformy do dystrybucji, instalacji, aktualizacji i monitoringu aplikacji dla dziesiątek tysięcy klientów (gmin / JST). Omówienie pełnej wizji architektury i próba ustalenia zmniejszonego zakresu na kolejne, szersze spotkanie. |
| **Osoby wspomniane** | Marek (sceptyczny wobec dużych zmian), Paweł „Wilgos” Wiśniewski, Józek Bedra, Janek (autor aplikacji exe do instalacji), Ola, Paweł, Dominik (aplikacje firm trzecich), „chłopaki z serwisu” |

> Transkrypt jest automatyczny i miejscami zniekształcony. Nazwy komponentów zrekonstruowano z kontekstu — zob. [Słownik pojęć](#słownik-pojęć-i-uwagi-do-transkrypcji) na końcu. Przy każdej informacji podano autora i orientacyjny znacznik czasu z nagrania.

---

## TL;DR

1. **Pełna wizja architektury (Tier S + Tier M) została zaakceptowana koncepcyjnie** — Marcin Grzybowski potwierdził, że InfoSystem myśli podobnie i część komponentów już istnieje (serwer licencyjny, artifact store, observability), ale brakuje telemetrii, a istniejące elementy wymagają przeróbki.
2. **Zakres najbliższego spotkania to wyłącznie Tier S odchudzony do MVP.** Centralna platforma, kontenery, aplikacje dla mieszkańców i migrator są odłożone.
3. **Rdzeń MVP wg Marcina: Site Agent + Site Host** — możliwość zainstalowania (deploy) czterech aplikacji webowych na serwerze gminy (Windows, bez VM) oraz ich aktualizacji. Jesteśmy dziś „zablokowani totalnie” brakiem możliwości instalacji w wielu jednostkach.
4. **Decyzja technologiczna: nginx (reverse proxy, SSL termination) przed Kestrel, Windows Service. IIS odpada** (Marcin: nierozwijany od lat, instalacja problematyczna).
5. **Nowy temat do wyjaśnienia: podjednostki JST** (szkoły, przedszkola, straż miejska) — urząd chce „zaglądać” do ich baz; dziś robione „na żywca” różnymi sposobami; wymaga rozmowy z Pawłem Wiśniewskim.
6. **Akcje:** Adam przygotuje odchudzony dokument tylko o Tier S; Marcin ustala listę uczestników i termin szerszego spotkania (kanał „Fundamenty”); Bolek chce, żeby Adam opowiedział serwisowi historię redukcji ticketów z projektu duńskiego.

---

## 1. Prezentacja pełnej architektury (Adam Koper)

### 1.1 Site Agent i komunikacja z platformą centralną — *Adam Koper, 00:00–00:03*

- Site Agent instalowany na serwerze gminy odpowiada za **zbieranie telemetrii** i wysyłanie jej do centralnej platformy. Telemetria = health check modułów (podatki, płatności itp. — „zielone/czerwone” na dashboardzie per gmina), intensywność użycia, liczba zalogowanych użytkowników, liczba eventów czekających na wypchnięcie.
- **Odrzucone rozwiązanie: tunele VPN.** Adam ocenił, że utrzymywanie dziesiątek tysięcy tuneli VPN między platformą a gminami jest niemożliwe.
- **Przyjęty kierunek: komunikacja wyłącznie od agenta do platformy (pull/push ze strony gminy).** Agent wysyła telemetrię, a aktualizacje pobiera sam z serwera artefaktów.
- **Artifact Store** — repozytorium nowych wersji modułów (SPA, API, STS itd.).
- **Serwer licencji** (w transkrypcji „flip/flirt serwer”, prawdopodobnie *Fleet Server*) — po stronie dostawcy; przechowuje, kto ma jaką licencję; na tej podstawie agent uzyskuje dostęp do artefaktów. Można zastosować już w Tier S.

### 1.2 Stan obecny w InfoSystem — *Marcin Grzybowski, 00:03–00:06*

- „Część z tych rzeczy mamy”: **serwer licencyjny jest, pobieranie artefaktów jest, observability jest** (w rozwiązaniu opartym o Embarcadero/Delphi).
- Site Agent dziś to w praktyce **biblioteka** w rozwiązaniu; dodatkowo istnieje **aplikacja exe Janka** do instalacji. Marcin prosił Janka o zrobienie API, ale powstało exe — „niestety”.
- **Brakuje telemetrii — „przede wszystkim”.**
- Artifact Store jest powiązany z serwerem licencji (nowy sposób sprawdzania i wystawiania licencji). Będzie wymagał zmian „na 100%”, bo **na tym etapie nie będziemy dystrybuować kontenerów** — „raczej niemożliwe”.
- Marcin: „cieszę się, że podobnie myślimy” — koncepcja architektury zbieżna z kierunkiem InfoSystem; problemem jest Docker/kontenery i ich instalacja.

**Wniosek Adama (00:05):** skoro to już działa w podobnej formie, architektura jest wdrażalna i akceptowalna; Site Agent można później rozbudować o instalację kontenerów (niekoniecznie VM).

### 1.3 Tier M — centralna platforma i aplikacje dla mieszkańców — *Adam Koper, 00:06–00:12*

Część, której **nie ma w InfoSystem**, a która byłaby potrzebna do wystawienia aplikacji dla mieszkańców:

- **Infrastruktura po naszej stronie** (hosting lub własny serwer — do ustalenia), pod pełną kontrolą, skalowalna, bez dostępu firm trzecich do serwera.
- **Dedykowana baza tylko do odczytu**, osobna od baz operatorskich, o **innej, zdenormalizowanej strukturze** zoptymalizowanej pod duże odczyty — żeby system „nie stał się ofiarą własnego sukcesu”.
- Baza centralna agreguje dane ze wszystkich gmin → obywatel z interesami w kilku gminach widzi swoje dane w jednym miejscu.
- **Opt-in po stronie gminy:** gmina, która chce aplikacje dla mieszkańców, dostaje dodatkowy komponent — **broker** (np. kolejka) wysyłający eventy z danymi do brokera centralnego, który zapisuje je w bazie read-only.
- **API przed bazą read-only** — dla własnych aplikacji, ale też dla podmiotów trzecich (np. aplikacje Dominika). Nie obciąża systemu operatorskiego.
- **Uwierzytelnianie:** dwa poziomy STS.
  - Po stronie gminy — lekki STS, może być darmowy, hostowany jako aplikacja .NET, bez Keycloak.
  - Centralnie — „większy” STS (np. Keycloak), zdolny obsłużyć duży ruch, z integracją z mObywatel / ePUAP; dostęp do danych na podstawie PESEL / NIP / REGON, tylko do danych przygotowanych do wyświetlenia.

**Argument sprzedażowy — *Adam, 00:44*:** Tier M to „selling point” — wójt/burmistrz chwali się aplikacją typu mObywatel z podatkami i rachunkami w telefonie mieszkańca. **Marcin (00:44):** „my to wiemy i chcemy tego”, ale realnie ważniejsze jest, żeby zacząć instalować, niż budować „wielką kobyłę, którą nie wiadomo kiedy skończymy”.

---

## 2. Brakujący element: podjednostki JST — *Marcin Grzybowski, 00:11–00:15*

- Gmina (np. Legionowo) ma **podległe jednostki**: szkoły, przedszkola, straż miejska. Urząd chce **widzieć/zaglądać do ich baz**. Marcin: „w tej architekturze tego brakuje” i centralna platforma tego raczej nie załatwi.
- **Adam** zrozumiał z wcześniejszych rozmów, że to już jest obsługiwane (wspólny serwer gminy, z którego korzysta szkoła). **Marcin:** „raczej różnie i to jest raczej problemem” — temat nierozwiązany; webowo tego nie ogarniają, robione „na żywca”, „różne sposoby, które niekoniecznie są okej”.
- To **case urzędu, nie obywatela**: urząd zagląda do podjednostek.
- **Marcin:** trzeba przegadać koniecznie z **Pawłem „Wilgosem” Wiśniewskim** i być może **Józkiem Bedrą** — oni znają potrzeby JST.
- **Adam (00:14):** InfoSystem prawdopodobnie będzie chciał, żeby dane zostawały w lokalizacji (szkole), żeby nie brać odpowiedzialności za dane. Jeśli to tylko odczyty, być może dałoby się to zrobić przez platformę centralną — ale decyzja dopiero po poznaniu wymagań.
- **Marcin (00:43):** potrzebna **lista JST / jednostek urzędu**; wygodne zaglądanie do podjednostek to „kluczowa sprawa” i mocny feature dla urzędu.

➡️ **Otwarty temat do następnego spotkania.**

---

## 3. Jak ustalić zakres? — *00:15–00:23*

- **Adam:** pełny dokument to „za dużo, żeby na dzień dobry o tym rozmawiać”. Pytanie do Marcina i Bolka: o jakim zakresie w ogóle teraz myślimy?
- **Bolesław Groszek (00:16):** z rozmowy z Markiem — Marek **sceptyczny wobec dużych zmian**; raczej „załatwiać sprawy doraźnie” niż myśleć całościowo. Trudno więc odpowiedzieć na pytanie o zakres.
- **Bolesław (00:17):** prośba, żeby na spotkaniu z serwisem Adam opowiedział szerzej **historię redukcji ticketów z Danii** — może przyspieszyć pracę serwisu; dużo ticketów się powtarza, dałoby się je „obciąć o połowę”. **Marcin:** „to nie rozwiąże tego tematu”. **Bolek:** zgoda, to uwaga na marginesie.

### Anegdota: jak zredukowano liczbę ticketów — *Adam Koper, 00:18–00:22*

Kod podobny do dzisiejszego w InfoSystem (exe pisane „od góry do dołu”, bez obsługi przypadków brzegowych, bez dokumentacji). Co zrobiono:

1. Rozpisano problematyczne procesy, spisano dokumentację, narysowano **maszyny stanów**, omówiono wszystkie przejścia i przypadki brzegowe.
2. Przepisano kod na podejście z **maszyną stanów i zdarzeniami domenowymi**.
3. Zidentyfikowano miejsca działające synchronicznie, które wywalały się przez długie obliczenia; zoptymalizowano kod.
4. To, co nadal trwało długo (ok. 10 s — „bardzo długo” w skali aplikacji dla obywateli), wyniesiono do **asynchronicznego przetwarzania na kolejkach**.
5. Dodano **telemetrię i dashboard** (zalogowani użytkownicy, typy przetwarzanych eventów/operacji).
6. Zdefiniowano „złe” przypadki i dodano **alerty mailowe** do osób nadzorujących.

Efekt: zespół dowiadywał się o problemach **zanim zgłosili je użytkownicy**, a problemów było coraz mniej.

**Koszt (na pytanie Marcina):** ok. **rok pracy, głównie 2 osoby, 100% fokusu** na tej aplikacji; okresowo ktoś dołączał. Adam zastrzega: „to były czasy sprzed AI”. Marcin: „to też jest ważne”.

---

## 4. Tier S i MVP — *00:22–00:44*

### 4.1 Czym jest Tier S — *Adam Koper, 00:23*

Instalacja aplikacji webowych **bez centralnej platformy**, bez WebView jako nowego kanału, na istniejącej infrastrukturze gminy (Windows, bez VM). Szczegółowy rysunek Tier S rozpisuje komponenty Site Agenta (narzędzia, sekrety itp.), m.in. dlatego, że dziś **hasła są dystrybuowane niewłaściwie** — leżą „na komputerze każdej pani Kasi”, plain-text lub słabo zaszyfrowane w plikach XML.

### 4.2 Co Marcin uważa za MVP — *Marcin Grzybowski, 00:22–00:27*

- „Poszedłbym w stronę tego, co powinniśmy zrobić **minimalnie — MVP**.”
- **Najważniejsze dwa „kwadraciki”: Site Agent i Site Host.**
- **Migrator — jak najdalej** („miałbym go w \*\*\*\*\*”). Migracje nie są teraz potrzebne; serwis potrafi instalować ręcznie. Zrobimy migracje, gdy „faktycznie ruszy z kopyta”.
- Cel: **4 aplikacje webowe** mają być instalowalne (deploy) — w transkrypcji: e-Płatności, „CRU/CF” i „Auta” (nazwy zniekształcone).
- Powód pilności: **„jesteśmy zablokowani totalnie”** — nie możemy instalować w wielu jednostkach, bo nie możemy stawiać VM; musimy instalować na serwerze, który jest (Windows).
- **Serwer licencji i Artifact Store — „lekkie przerobienie”, kolejna opcja, nie ultra wymagana teraz**; dorobimy, gdy będzie zapotrzebowanie.

### 4.3 Omówienie rysunku Tier S — *Adam Koper, 00:27–00:34*

Elementy **wycinane z MVP** (zgodnie z sugestiami Marcina):

| Komponent | Status | Kto |
|---|---|---|
| Kolektory telemetrii (Windows Service) | na razie nie robimy | Adam |
| Broker eventów do centralnej bazy read-only | wypada (Tier M) | Adam |
| Migrator | wypada | Marcin → Adam |

Elementy **zostające w MVP**:

- **Updater** (usługa w ramach Site Agenta) — instaluje pobrane artefakty (API, SPA, STS…) na hoście. Musi działać z **uprawnieniami admina** (instalacja usług Windows itp.) — to **nowy komponent do zainstalowania na serwerze gminy**, „bardzo istotny”.
- **Site Host** — to, co wystawia aplikacje (Windows Service / nginx — ustalono poniżej).
- **API sekretów** — moduł przechowujący konfiguracje i hasła (connection stringi itd.) zamiast XML/exe. Proponowane uwierzytelnianie **certyfikatem**: Updater pobiera certyfikat z serwera artefaktów, instaluje w Certificate Store z uprawnieniami dla konta usługi (np. e-Płatności); aplikacja uwierzytelnia się nim do usługi sekretów. Sposób uwierzytelniania — **do ustalenia** (jest kilka opcji).
- **Aplikacje exe (Delphi)** — mają już swój mechanizm aktualizacji, „pewnie zostawimy jak jest”; być może wystarczy też do dystrybucji aplikacji WebView osadzonych w exe.
- Dostęp do bazy Firebird mają migrator, moduły i exe (na rysunku strzałka do poprawy — Adam).

### 4.4 Uwierzytelnianie exe przez nowy STS — *Marcin Grzybowski, 00:33–00:36*

- **Propozycja Marcina:** exe Delphi też powinny uwierzytelniać się „po nowemu” przez STS i stamtąd dostawać ścieżki do baz. Jest wspólna **biblioteka „Menadżer”** z własnym logowaniem — podmiana logowania w niej zmieni od razu wszystkie exe.
- **Warunek (Marcin, stanowczo):** to **nie jest MVP**. MVP = „jesteśmy w stanie zainstalować to rozwiązanie i serwis działa”. Przepinanie exe na nowe logowanie ma sens dopiero, gdy agent/rozwiązanie **działa stabilnie** — „to musi działać \*\*\*\*\*\*\*\*\*\*, nie ma bata, żebyśmy zmienili sposób logowania” wcześniej.
- **Adam:** tego typu tematy — na spotkanie z Wilgosem i resztą.

### 4.5 IIS vs nginx — *00:36–00:39*

- **Marcin:** obawa, że Adam nie ma doświadczenia z IIS. **Adam:** używał IIS 10–15 lat temu (LuxMed), ostatnio do mniejszych rzeczy nginx.
- **Marcin:** IIS „został \*\*\*\*\*\*” od dawna, nie wiadomo czy ma jeszcze aktualizacje; **nginx instalowalny, IIS nie** (jego instalator to coś „pisane podół” — skreślone kilka lat temu). **„Tylko i wyłącznie nginx.”**
- **Adam:** nie upiera się — zostawił to na poziomie abstrakcji celowo, żeby nie rozstrzygać szczegółów w dokumencie.
- **Ustalenie:** aplikacje .NET stoją na **Kestrel**, przed nimi **nginx jako reverse proxy** (SSL termination itd.), bo Kestrel nie obsługuje wszystkiego, co potrzebne.
- **Dodatkowy plus (Marcin, 00:38):** Site Host jako **Windows Service** sprawi, że kolejki (CRU itp.) działają w tle i **rozwiązuje problem Pawła z usypianiem schedulera**.

### 4.6 Rola Site Agenta i narzędzi — *Adam Koper, 00:39–00:43*

- Site Agent / Updater to **„narzędziownik”**: umie zainstalować web API (.NET), SPA (np. Next.js / statyczne — konfiguruje się inaczej w nginx), STS, aktualizować je; **w przyszłości kontenery Docker**.
- Nie zastępuje aplikacji Janka — zmienia architekturę: wizualizacja/front Janka zostaje, a agent jest narzędziem, które na żądanie instaluje obraz/kontener.
- **Marcin:** narzędzie Janka było rozmawiane z Markiem tak, żeby „siedziało coś w tle jako serwis” i **miało API**; dlatego Marcin „cisnął Janka”, żeby wewnętrznie szedł po REST API. Janek uważał to za niewygodne — „będą zmiany”.
- Agent docelowo komunikuje się z platformą centralną: pobiera artefakty, raportuje stan usług. Klocki dodawane stopniowo. Potrzebna też **samoaktualizacja agenta**.

---

## 5. Wątek poboczny: standaryzacja pracy z AI — *Adam Koper, 00:45–00:49*

- Każdy w firmie (Adam, Ola, Paweł, Marcin) „dłubie” coś z AI osobno; **brak dzielenia się i standaryzacji na skalę firmy**.
- Propozycja: zamiast tylko realizować zadania, **automatyzować klasy zadań przez skille**, przetestować, podzielić się z zespołem. Dwie ortogonalne rzeczy:
  1. **Toolbox building bloków** — jak robić endpointy REST, klientów, uwierzytelnianie itd.
  2. **Standaryzacja procesu tworzenia feature'ów** — do każdego feature'a automatycznie: dokumentacja działania, zapis decyzji architektonicznych, release notes dla użytkownika, instrukcja instalacji dla serwisu.
- Teza: dzięki temu „bardzo odległe cele” mogą być osiągalne szybciej; „to, co dziś wydaje się niemożliwe, być może stanie się możliwe”. **Marcin:** „zgadza się” / „no powiedzmy”.
- Propozycja osobnego spotkania o tym, jak zacząć używać AI w firmie.

---

## 6. „Dwutorowość” — trzy różne rozumienia — *00:56–01:00*

Temat wyszedł przy omawianiu sceptycyzmu Marka.

| Kto | Jak rozumie „dwutorowo” |
|---|---|
| **Marek** (wg Marcina) | Pisać w Embarcadero **i** webowe „po staremu” — stąd Marek powiedział, żeby „olać” Embarcadero. |
| **Marcin** | Piszemy **webowo**, tak żeby zadziałały e-Płatności i „rienki”. |
| **Adam** | **Tier S i Tier M rozwijane równolegle „po wsze czasy”.** Tier S jest blisko obecnej architektury i w zasięgu dziś. Tier M (kontenery, centralna platforma) to oferta rozbudowana; być może podzielić na M1/M2/L (np. kontenery przed centralną platformą). Serwis powiedział na poprzednim spotkaniu, że **na ~10% gmin lub więcej kontenerów nie wdroży** — brak infrastruktury („komputer pani Kasi”), więc Tier S zostaje na długo. **Kluczowe: te same aplikacje na Site Hoście w obu tierach**, bez duplikacji pracy — różnią się tylko narzędzia instalacji. Sprzedaż Tier M dużej gminie (Legionowo) może pociągnąć mniejsze. |

Marcin: „Spoko.” — rozbieżność nie została rozstrzygnięta, ale wyjaśniona.

---

## 7. Napięcia i ryzyka organizacyjne

- **Sceptycyzm Marka** — *Bolek, 00:16 i 00:55*: Marek wolałby działać doraźnie. *Adam, 00:55*: Marek może nie wiedzieć, że dokument to kilka miesięcy pracy, a nie „AI slop z piątkowego wieczoru”; Adam usłyszał od Marcina, że Marek nazwał dokument AI slopem i nie będzie go czytał. *Bolek*: Marek zastanawiał się też, czemu dokument jest **po angielsku**. *Marcin*: rozmawiał z Markiem, „trochę się nie dogadaliśmy” — nieporozumienie wokół „dwutorowości” (sekcja 6).
- **Za mało feedbacku** — *Adam, 00:54*: pracując 2 h rano i wieczorem, ma za mało feedbacku od Marcina i Bolka — zarówno co trzeba zrobić, jak i czy to, co zrobił, jest tym, co trzeba; przez to czasem „mocno przeszacuje” (jak tutaj).
- **Dokument za obszerny** — *Adam, 00:48, 00:51*: „za dużo, nikomu nie będzie się chciało czytać”.
- **Nazewnictwo tierów** — *Marcin, 00:52*: pytanie, czemu „Tier S”; „tier” kojarzy się z poziomem subskrypcji/topem. *Adam*: to **T-shirt sizes** (S, M, dalej L, XL). Marcin: „spróbuję się przeprogramować, ale ciężko”.

---

## 8. Decyzje

| # | Decyzja | Kto | Czas |
|---|---|---|---|
| D1 | Brak tuneli VPN; komunikacja inicjowana wyłącznie przez Site Agenta ze strony gminy | Adam (bez sprzeciwu) | 00:01 |
| D2 | Koncepcja architektury (Site Agent, Artifact Store, serwer licencji, observability) zaakceptowana jako zbieżna z InfoSystem | Marcin | 00:06 |
| D3 | Następne spotkanie dotyczy **tylko Tier S**, z celem **odchudzenia go do MVP** | Adam, potwierdza Marcin | 00:50 |
| D4 | **MVP = Site Agent + Site Host** (deploy i update 4 aplikacji webowych na Windows bez VM) | Marcin | 00:24 |
| D5 | Migrator, telemetria, broker, centralna platforma, kontenery — **poza MVP** | Marcin / Adam | 00:25–00:28, 00:43 |
| D6 | Serwer licencji i Artifact Store — lekka przeróbka, ale nie teraz | Marcin | 00:26 |
| D7 | **nginx (reverse proxy, SSL) + Kestrel + Windows Service; IIS odpada** | Marcin, Adam zgadza się | 00:37–00:38 |
| D8 | Przepięcie exe Delphi na nowy STS — dopiero po stabilnym działaniu agenta, nie w MVP | Marcin | 00:35 |
| D9 | Na szerokie spotkanie zapraszamy też „sabotażystów” — zbieramy wiedzę, w tym pesymistyczne scenariusze i zagrożenia | Adam (zasada), Marcin, Bolek | 00:50–00:51 |
| D10 | Kto na spotkaniu — decyduje Marcin; zakres — ustala Adam | Adam | 00:50 |

## 9. Zadania (action items)

| # | Zadanie | Właściciel | Źródło |
|---|---|---|---|
| A1 | Przygotować **odchudzony dokument tylko o Tier S** („wyplotkować”), do rozdania przed spotkaniem | Adam Koper | 00:51 |
| A2 | Zdecydować, kogo zaprosić na szersze spotkanie (lista z ostatniego spotkania + Wilgos i in.) i zaproponować termin na kanale „Fundamenty” | Marcin Grzybowski | 00:50, 00:54 |
| A3 | Przegadać temat **podjednostek JST** z Pawłem Wiśniewskim (Wilgos) i Józkiem Bedrą; przygotować listę JST / jednostek | Marcin Grzybowski (inicjator), Adam (do uwzględnienia w architekturze) | 00:13, 00:43 |
| A4 | Opowiedzieć serwisowi historię redukcji ticketów (Dania) na spotkaniu z „chłopakami z serwisu” | Adam Koper (prośba Bolka) | 00:17 |
| A5 | Ustalić sposób uwierzytelniania do usługi sekretów (certyfikat vs inne) | zespół, na spotkaniu Tier S | 00:32 |
| A6 | Omówić propozycję uwierzytelniania exe przez STS (biblioteka Menadżer) na spotkaniu z Wilgosem | Marcin / Adam | 00:34 |
| A7 | Poprawić strzałkę dostępu do bazy Firebird na rysunku Tier S (tylko „Delphi exe” w komentarzu) | Adam Koper | 00:33 |
| A8 | Rozważyć osobne spotkanie o standaryzacji pracy z AI w firmie | Adam Koper | 00:45 |
| A9 | Bolek przestudiuje dokument i nagranie na spokojnie | Bolesław Groszek | 00:49 |

## 10. Pytania otwarte

1. Jak obsłużyć **podjednostki JST** (odczyt przez urząd, dane zostają lokalnie czy centralnie)? — wymaga wymagań od Wilgosa.
2. Jakie dokładnie **4 aplikacje** wchodzą do MVP (nazwy zniekształcone w transkrypcji: e-Płatności, „CRU/CF”, „Auta”)?
3. **Sposób uwierzytelniania** aplikacji do usługi sekretów.
4. Czy istniejący mechanizm aktualizacji exe wystarczy do dystrybucji **WebView osadzonych w exe**?
5. Jak zmienić **aplikację Janka** (exe → serwis z API) i kiedy?
6. Hosting Tier M: zewnętrzny hosting czy własny serwer? (odłożone)
7. Podział Tier M na podetapy (kontenery przed centralną platformą?) — odłożone.
8. Czy i jak uruchomić standaryzację pracy z AI.

---

## Słownik pojęć i uwagi do transkrypcji

| W transkrypcji | Prawdopodobne znaczenie |
|---|---|
| „side/sight/sady/Fight agent” | **Site Agent** — agent na serwerze gminy |
| „side host / sidehop / Fight host” | **Site Host** — host wystawiający aplikacje (nginx + Kestrel / Windows Service) |
| „flip / flirt / flix serwer” | **serwer licencji** (prawdopodobnie *Fleet Server*) po stronie dostawcy |
| „Architect Store / archiwax story / pul artefaktów” | **Artifact Store** — repozytorium wersji modułów |
| „Observa elity / obserwability” | **Observability** |
| „STS / estes”, „Ki krok / kick lok” | **STS** (Security Token Service), **Keycloak** |
| „a i s / a ja jest”, „enginex / NG nex”, „kester” | **IIS**, **nginx**, **Kestrel** |
| „tir / tier S, tier M” | **Tier S / Tier M** — rozmiary T-shirt (S, M, L, XL), nie poziomy subskrypcji |
| „TRM”, „TRS” | Tier M, Tier S |
| „embarka dero / Embarcadero” | **Embarcadero Delphi** — technologia obecnych aplikacji exe |
| „fajerwerd” | **Firebird** — baza danych |
| „wiemka” | **VM** (maszyna wirtualna) |
| „JST / i o TS” | **Jednostki Samorządu Terytorialnego** (podjednostki urzędu) |
| „Wilgos” | Paweł Wiśniewski |
| „rienki” | niejasne — prawdopodobnie nazwa modułu/aplikacji |
| „Menadżer” | wspólna biblioteka logowania w aplikacjach Delphi |
| „Fundamenty” | kanał/grupa, na której ma zostać umówione kolejne spotkanie |

Fragmenty oznaczone `*****` w transkrypcie to wycenzurowane wulgaryzmy — zachowano jako w źródle.
