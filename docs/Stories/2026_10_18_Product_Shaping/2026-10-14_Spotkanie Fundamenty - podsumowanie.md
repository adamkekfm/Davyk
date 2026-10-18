# Spotkanie „Fundamenty”: kontynuacja tematu architektury — podsumowanie (14.10.2026)

| | |
|---|---|
| **Spotkanie** | „Spotkanie Fundamenty: kontynuacja tematu architektury” (nagranie 20261014_143009) |
| **Data i czas** | 14 października 2026, 12:30, czas trwania 1 godz. 57 min |
| **Źródło** | `2026-10-14_Spotkanie Fundamenty_ kontynuacja tematu architektury.txt` (automatyczna transkrypcja Teams) |
| **Kontekst** | Trzecie spotkanie w ramach projektu rozwiązania do dystrybucji, instalacji, aktualizacji i monitoringu aplikacji u dziesiątek tysięcy klientów (JST). Po pierwszym spotkaniu (1.10, realia klientów vs VM/Docker) i drugim, w wąskim gronie (9.10, odchudzenie architektury do Tier S), to pierwsze szerokie spotkanie z serwisem nad rysunkiem Tier S. Agenda: `2026-10-16_TierS_agenda.md`. |
| **Charakter** | Spotkanie **zbierające informacje, nie decyzyjne**. Adam Koper kilkukrotnie podkreślał: „nie podejmujemy decyzji, zbieramy informacje i wszystkie hardcorowe edge case’y” (1:53:15). |

## Uczestnicy

| Osoba | Rola wynikająca z rozmowy | Sposób udziału |
|---|---|---|
| **Marcin Grzybowski** | Organizator i prowadzący. Otworzył spotkanie, określił zakres MVP, mapował rysunek na istniejące rozwiązania. Uruchomił transkrypcję. | sala (Legionowo) |
| **Adam Koper** | Autor architektury (Tier S / Tier M). Prezentował rysunek Tier S, moderował pytania do serwisu. | sala |
| **Bolesław Groszek** („Bolek”) | Obecny na sali, nie zabierał wyraźnie głosu. | sala |
| **Artur Kwiatkowski** | Autor panelu dla dystrybutorów. Miał pokazać panel, ale prezentacja nie odbyła się (brak w nagraniu). Dołączył z opóźnieniem. | sala |
| **Marek Królikowski** | Infrastruktura / sieci. Pytania o utrzymanie nginx, porty, NAT, Linux, pakiety instalacyjne; nacisk na ujednolicenie wersji Firebirda. | zdalnie |
| **Rafał Wilgos** | Serwis. Autor obecnego mechanizmu aktualizacji exe („updater”). Główne źródło wiedzy o realiach klientów, migracjach Firebirda, dostępie do serwerów. | zdalnie |
| **Michał Baum** | Serwis / wdrożenia aplikacji webowych (mObywatel, KSeF). Doświadczenia z bazą CI i aplikacją Janka. | zdalnie |
| **Jan Grabowski** („Janek”) | Programista. Autor menedżera aplikacji, gatewaya API i prototypów uwierzytelniania. | zdalnie |
| **Zbigniew Dzido** | Pytania o interaktywne instalatory i Linux. | zdalnie |
| **Wojciech Grabowski**, **Paweł Derlacz** | Obecni, bez wypowiedzi merytorycznych w transkrypcji. | zdalnie |
| Wspominani | **Józek** (Bedra; podobne potrzeby, m.in. szyfrowanie sekretów), **Czarek** (podpisywanie binarek, bloki Firebird, sprzątanie tabel OPER), **Dominik** (pokazał stronę do wyboru programów do instalacji), **Ola** (automatyzacja testów), **Paweł** (autor API mObywatel), „Amerykanie” (żart Marka o wysłaniu nagrania). |

> **Uwaga o atrybucji.** Konto „Adam Koper” było **wspólnym kontem sali** (Marcin: „na sali jestem ja, Adam i Bolek, jest Artur Kwiatkowski”, 0:32). Pod tym kontem mówi zarówno Adam, jak i Marcin, a miejscami inni z sali. Rozróżniam po kontekście: wstęp 1:23–10:48 to Marcin („mój pomysł architektury Adama”, „dałbym głos Adamowi”), prezentacja od 10:51 to Adam, mapowanie rysunku na istniejące rozwiązania (ok. 27:00–30:00) to Marcin, a fragment o wielu instancjach Firebirda i DBX (39:33–47:08) oznaczam jako **„sala (prawd. Marcin)”**, bo mówca zna wewnętrzne szczegóły aplikacji, ale nie jest to jednoznaczne. Transkrypcja jest automatyczna i mocno zniekształca nazwy techniczne; słowniczek na końcu dokumentu.
>
> **Rozbieżność z poprzednim podsumowaniem.** W podsumowaniu spotkania z 9.10 „Wilgos” został zidentyfikowany jako Paweł Wiśniewski. W tym nagraniu konto nosi nazwę **Rafał Wilgos**, a uczestnicy zwracają się do niego „Rafał”. Paweł Derlacz występuje jako osobna osoba. Tożsamość w tamtym dokumencie warto poprawić.

---

## 1. Podsumowanie spotkania

**Jednym zdaniem:** Adam przedstawił serwisowi odchudzoną architekturę Tier S (Site Agent jako usługa z uprawnieniami administratora, nginx jako reverse proxy przed aplikacjami .NET na Kestrelu, źródło artefaktów po stronie InfoSystem, usługa sekretów zamiast XML‑i), serwis uznał kierunek za dobry („cudowne, jeżeli się uda”), ale wskazał długą listę realiów, które architektura musi uwzględnić: brak dostępu do serwerów klientów, brak internetu na serwerach, chaos wersji Firebirda, zakaz jednostronnych aktualizacji, konieczność podpisywania binarek i „posprzątania domu” przed jakąkolwiek rewolucją.

**Przebieg:**

1. **Wstęp i zakres (Marcin, 1:23–10:48).** Po poprzednim spotkaniu mniejsze grono odchudziło architekturę Adama. Rozmiary T‑shirt: Tier S najmniejszy, Tier M odłożony „aż będziemy mieli działające środowisko”. Cel: zacząć wdrażać coś, co faktycznie działa w urzędzie, bez dodatkowych blokad; edge case’y są „mega istotne”. Wyjaśnienie „dwutorowości”: Embarcadero zostaje tak długo, aż aplikacje zostaną przepisane; w kontekście nowego rozwiązania dwutorowość to architektura najłatwiejsza do instalacji u najsłabszych klientów **plus** pełne rozwiązanie serwerowe (jak VM). Teraz skupiamy się na słabych zasobach. MVP: mObywatel z ePłatnościami, KSeF, CRU, eAuta zainstalowane jednolicie plus pilotaż. Prośba o feedback serwisowy: „jeżeli coś totalnie nie przejdzie, to musi zostać wypowiedziane”. Rozmowa z Józkiem pokazała podobne potrzeby (szyfrowanie sekretów), warto iść jednym torem.

2. **Prezentacja Tier S (Adam, 10:51–16:00).** Cztery aplikacje pisane różnie, więc konieczny etap unifikacji. Maszyny u klientów różne (Windows Server, czasem Linux, PC operatora). Wspólny element: nginx da się zainstalować wszędzie. Nowe aplikacje działają na Kestrelu, kompilowane self‑contained na Windows i Linux. Problemy do rozwiązania: różne uwierzytelnianie w każdej aplikacji, sekrety w plikach konfiguracyjnych, usypianie schedulera mObywatela na IIS (rozwiązanie: scheduler jako Windows Service). Sekrety: baza lub Windows Data Protection (DPAPI), jeśli nie musimy wspierać Linuxa.

3. **Pytania Marka o utrzymanie i komunikację (16:02–27:00).** Kto aktualizuje nginx, skoro IIS aktualizował się przez Windows Update? Adam: Site Agent, usługa z uprawnieniami admina, aktualizuje nginx i aplikacje; komunikuje się wyłącznie wychodząco ze źródłem artefaktów i raportuje stan. Marek: czy ktoś pytał klientów o zgodę na instalację takich rzeczy? Czy agent potrzebuje tylko HTTPS? Brak wolnych IP w Legionowie, NAT, nietypowy port. Adam: szczegół do rozwiązania później.

4. **Mapowanie rysunku na istniejące rozwiązania (Marcin, ok. 27:00–30:00).** Agent ≈ aplikacja aktualizująca Rafała; Artifact Store ≈ pobieranie exe ze strony; telemetria ≈ raporty wysyłane przez aplikację Rafała; zarządzanie licencjami ≈ stara strona groszek.pl z generowaniem kluczy; Fleet Server ≈ rozwiązanie Marka i Janka; heartbeat Kwiatka czeka na API w nowym panelu groszek.pl. To rozwiązanie dla .NET, nie dla exe; zamiana tego, co było z VM.

5. **Strona serwerowa i model „desired state” (Adam, 30:00–34:59).** Agent jako narzędziownik rozszerzalny o nowe sposoby instalacji (w przyszłości kontenery). Po stronie InfoSystem: API i narzędzie dla serwisu (lista lokalizacji, zainstalowane usługi, statusy) oraz druga domena: licencje i wersje zakupione per placówka, zasilające źródło artefaktów informacją, co ma być gdzie zainstalowane. Analogia do Kubernetesa (centralny API z pożądanym stanem, agent na nodach), bez kontenerów w MVP.

6. **nginx vs IIS (Jan, Marek, 34:59–38:25).** Wszystko przez nginx (TLS), aplikacje na Kestrelu za nim. Usługi jako Windows Service lub exe podnoszone przez agenta. Wymaganie: rezygnacja z IIS. Marek: co z usługami firm trzecich na IIS i konfliktami portów? Adam: zmienimy port. Marek: trzeba już teraz myśleć o wyjątkach od reguły.

7. **Firebird: wersje, migracje, dostęp (38:25–59:56).** Najdłuższy wątek. Hasło Firebirda jest serwerowe, zmiana zepsuje aplikacje firm trzecich. Normą staje się kilka instancji Firebirda na różnych portach (2.5 i 5). Marek: dążyć do jednej wersji (5) wszędzie. Blokada: podatki na DBX, przez co nie da się przejść na FB5 ani zmienić dialektu. Rafał: 5000 klientów z bazami 7–40 GB, migracja wymaga weekendu, duzi klienci nie staną; serwis nie ma dostępu do serwerów, VPN‑y blokowane, dostęp „po znajomości i pod nadzorem”; biblioteki Firebirda nie zwracają błędów; miejsce na dysku; max 2–3 migracje dziennie. Konkluzja Adama: MVP celuje w placówki, gdzie KSeF/CRU już wymusiły FB3 dialekt 3; jeśli rozwiązanie musiałoby działać na FB2.5, „tego nie zrobimy”.

8. **Instalacja agenta i pakietów (1:00:49–1:07:41).** Rafał: nginx wszędzie to nie problem, sam używa w PKP. Adam: nginx instaluje agent, nie informatyk; informatyk instaluje tylko agenta. Zbigniew: interaktywne instalatory? Adam: paczki bez interakcji (skrypty, zipy); Marek: podpisane MSI jak w PKP; Linux prostszy. Adam: robił to w retailu (Leroy, OBI) dla kas POS.

9. **Internet na serwerze i topologia (1:07:41–1:16:29).** Krytyczne: agent na serwerze może nie mieć internetu (końcówki mają). Na 60 serwerach z mObywatel/ePłatności internet jest, ale klienci tylko z podatkami i budżetem go nie mają. Opcje: instalacja na PC operatora, agenty pomocnicze na końcówkach jako wyjście na świat, agent na komputerze administratora. Rafał: najbezpieczniej 3 serwery (baza / aplikacje desktop / aplikacje z wyjściem na zewnątrz). Adam: architektura to wspiera; back office dla serwisu z grupowaniem i tagowaniem maszyn, wypychanie instalacji na grupy. Rafał: „cudowne”.

10. **Konfiguracja, sekrety, baza CI (1:16:29–1:30:14).** Dziś: konfiguracje aplikacji webowych w bazie, programy exe mają ścieżki, login i hasło w XML. Rafał od lat chce jednego pliku konfiguracyjnego lub bazy CI jako jedynego źródła. Michał: UI lepsze niż SQL (bloby), ale wszystko w jednym narzędziu; baza CI tylko na Firebirdzie. Adam: API uwierzytelniające przez agenta, exe przepięte z XML na REST. Jan: problem synchronizacji operatorów do bazy CI pozostaje. Adam: w przyszłości STS, rozdzielenie uwierzytelniania od autoryzacji; uprawnienia zostają w bazach aplikacji. Rafał: porzucone aplikacje (Woda, dodatki mieszkaniowe) nie dostosują się.

11. **Wyjątki, podpisywanie, aktualizacje, testowanie (1:31:54–1:51:39).** Marek: największy problem to wyjątki. Rafał: antywirusy zjadają niepodpisane programy, usługi .NET startują 3 minuty na słabych maszynach; priorytety: git i podpisywanie. **Jednostronne aktualizacje: absolutnie nie**, ludzie pracują po godzinach; potrzebny panel dla administratora i przycisk „aktualizuj” dla użytkownika. Rollback binarki, rzadko bazy. Testowanie na produkcji u 3 klientów. Serwis zbiera wersję aplikacji, Firebirda i bazy per jednostka. Kanary: wersja udostępniona tylko wybranej placówce, instalacja za zgodą informatyka, stara wersja równolegle. Środowisko testowe = kopia bazy i druga instancja obok na tym samym serwerze. 90% informatyków używa VPN/RDP, wszyscy pracują na serwerze.

12. **Zakończenie (1:51:42–1:57:28).** Rafał: pomysły super, ale bez posprzątania (git, podpisy, DBX, wycofanie starych aplikacji) nic z tego nie będzie. Adam: nie możemy czekać, musimy zrobić prototyp/MVP; kontrprzykład: VM wymagająca Server 2016 wdrożona u 2 z 60. Kolejna iteracja za tydzień, zaproszenie do „sabotowania”, potem test run. Rafał: pomysł z nginx się podoba; zapytać klientów (Warszawa, Otwock, Złotoryja), czy pozwolą zainstalować. Uwagi w międzyczasie na kanale „Fundamenty”.

---

## 2. Wymagania stawiane przed systemem

### 2.1 Zakres i wymagania produktowe (MVP)

| # | Wymaganie | Autor | Źródło |
|---|---|---|---|
| W1 | **Zakres MVP: 4 aplikacje** (mObywatel z ePłatnościami, KSeF, CRU, eAuta) zainstalowane w jednolitej architekturze i jednolicie, plus pilotaż. Skład MVP będzie jeszcze „dopieszczany”. | Marcin | 7:30–10:48 |
| W2 | Najważniejsze: **zacząć wdrażać coś, co faktycznie działa w urzędzie**, bez dodatkowych blokad. Edge case’y mają priorytet. | Marcin | 1:23 |
| W3 | Skupić się na **słabych zasobach** (najmniejsi klienci, najsłabszy sprzęt); pełne rozwiązanie serwerowe (Tier M) później. | Marcin | 1:23 |
| W4 | Aplikacje muszą zostać **zunifikowane** do wspólnej postaci (sposób hostowania, pakowania, być może uwierzytelniania), bo są napisane różnie. Unifikacja uwierzytelniania: opcjonalnie, do decyzji w analizie. | Adam | 10:51 |
| W5 | Skala MVP to **ok. 60 instalacji** (placówki, gdzie mObywatel/eAuta działają na IIS), nie 20 000. Rafał: do 300 serwis ogarnie w tydzień. | Adam, Rafał | 1:02:33–1:03:01 |
| W6 | Rozwiązanie musi jednak **skalować się na przyszłość**: klienci kupują „z dnia na dzień”, może zajść potrzeba masowej instalacji u ~2000 klientów. | Rafał | 1:02:14, 1:03:01 |
| W7 | Rozwiązanie musi dać radę **przynajmniej połowie wyjątków**; „teraz jest fatalnie, jeśli będzie trochę lepiej, sobie poradzimy”. Ale nie może być tak, że „jeden wyjątek nas pogrąża”. | Rafał, Adam | 1:32:20, 1:32:14 |
| W8 | **Nie robić rozwiązania „cokolwiek”**: VM wymagająca Windows Server 2016 wdrożona u 2 z 60 klientów to przykład, czego unikać. Kolejne iteracje, zaproszenie do sabotowania, test run przed decyzją. | Adam | 1:53:42, 1:54:25 |
| W9 | Iść **jednym torem razem z Józkiem** (podobne potrzeby: szyfrowanie sekretów), bez bocznych torów. | Marcin | 8:40 |

### 2.2 Site Agent (usługa na maszynie klienta)

| # | Wymaganie | Autor | Źródło |
|---|---|---|---|
| A1 | Agent działa jako **usługa** (Windows Service lub usługa Linux), spełnia tę samą funkcję niezależnie od OS. | Adam, Marek | 16:56–17:41 |
| A2 | Agent działa na **dedykowanym koncie z wysokimi uprawnieniami** (administrator), by instalować usługi, edytować konfigurację nginx, instalować aplikacje. Trzeba przygotować takie konto. | Adam, Marek | 20:53–21:08 |
| A3 | Agent **instaluje i aktualizuje**: aplikacje hostowane na Kestrelu, Windows Services, nginx i jego konfigurację (routing reverse proxy per aplikacja), zwykłe exe; w przyszłości kontenery. Architektura rozszerzalna o nowe sposoby instalacji („wtyczki”). | Adam | 19:24–21:08, 30:00 |
| A4 | Agent odpowiada za **aktualizację wszystkich komponentów na rysunku poza Firebirdem** (w tym nginx, bo „to spadnie na nas”). | Adam, Marek | 44:49–45:10 |
| A5 | Komunikacja **wyłącznie wychodząca** z agenta do źródła artefaktów; brak dostępu z internetu do agenta. | Adam, Marek | 21:25–22:06 |
| A6 | Agent **raportuje stan każdej aplikacji** (czy podniesiona, czy działa) do części serwerowej hostowanej na infrastrukturze InfoSystem. | Adam | 23:31 |
| A7 | Agent musi mieć **samoaktualizację** (pośrednio: agent aktualizuje wszystko, w tym siebie; z agendy). | Adam | agenda, 19:24 |
| A8 | Instalacja agenta to **jedyny krok ręczny** (wykonuje informatyk urzędu lub serwis); musi być **maksymalnie łatwa dla serwisantów**. Pozostałe usługi instaluje agent. | Adam | 1:01:03, 1:03:43 |
| A9 | Paczki instalacyjne **bez jakiejkolwiek interakcji** (skrypty, zipy, MSI silent, pakiety deb/rpm). | Adam, Marek, Zbigniew | 1:04:37–1:05:50 |
| A10 | Agent i wszystkie binarki muszą być **podpisane cyfrowo** (antywirusy i Windows blokują niepodpisane programy). | Adam, Rafał | 1:34:12–1:34:28 |
| A11 | Agent musi działać także w topologii **kilku serwerów** (baza na jednym, aplikacje z wyjściem na zewnątrz na innym): instalowany na maszynach z internetem, Firebird zostaje sam na serwerze bazodanowym. | Rafał, Adam | 1:13:45–1:14:30 |
| A12 | Jeśli serwer nie ma internetu: rozważyć **agenty pomocnicze na końcówkach** jako wyjście na świat (proxy), agenta na komputerze administratora lub instalację usług na PC operatora. Wymaga sprawdzenia zgodności z polityką bezpieczeństwa urzędu. | Adam | 1:08:24–1:13:45 |
| A13 | Nie używać adresów IP, **zawsze domeny / FQDN** w konfiguracji agenta i aplikacji. | Marek | 1:23:04 |

### 2.3 Site Host (hosting aplikacji u klienta)

| # | Wymaganie | Autor | Źródło |
|---|---|---|---|
| H1 | **Rezygnacja z IIS** w całości; nginx jako alternatywa. IIS jest problematyczny w instalacji (pluginy pod Node itp.). | Adam (wymaganie „usłyszane w rozmowach”) | 35:47–37:25 |
| H2 | **nginx jako reverse proxy** z terminacją TLS; wszystkie aplikacje .NET (web API, fronty) na **Kestrelu** lub Node za nginx. | Adam | 35:13 |
| H3 | Aplikacje kompilowane **self‑contained**, na Windows i Linux. Do sprawdzenia dla mObywatel i eAuta. | Adam | 13:30 |
| H4 | Aplikacje jako **Windows Service** lub exe podnoszone przez agenta; sposób nierozstrzygnięty. | Adam | 35:47 |
| H5 | **Scheduler mObywatela / CRU jako usługa na serwerze**, nie w procesie IIS ani na PC operatora (usypianie na IIS; na końcówce użytkownik wyłącza komputer lub przestawia datę). Rafał: „usługi powinny chodzić jako usługi, aplikacja jako aplikacja”. | Adam, sala, Rafał | 15:00, 1:12:00, 1:33:30 |
| H6 | Jeśli aplikacje muszą działać na końcówkach (brak internetu na serwerze), eAuta, ePłatności itd. muszą być **napisane tak, by działały na końcówce**. | Adam | 1:12:30 |
| H7 | Uwzględnić **konflikty portów** z usługami firm trzecich (IIS na 80/443, Firebird na 3050) i możliwość zmiany portu. | Marek, Adam | 36:32–37:46 |
| H8 | Usługa musi być **dostępna dla każdego operatora zalogowanego na serwerze** przez RDP/terminal (90% informatyków używa VPN lub RDP). | Rafał | 1:50:32 |
| H9 | **Minimalna wersja Firebirda: 3, dialekt 3** (wymóg KSeF/CRU). Marek: docelowo FB5, bez wersji przejściowych. | Adam, Marek | 45:10–46:10, 1:03:43 |
| H10 | Usługi .NET muszą startować sprawnie na słabym sprzęcie (dziś usługa startuje 3 minuty, „Windows ubija”). | Rafał | 1:32:54 |

### 2.4 Konfiguracja i sekrety

| # | Wymaganie | Autor | Źródło |
|---|---|---|---|
| K1 | **Sekrety poza plikami XML** (dziś login i hasło do bazy w XML na dysku). Propozycja: baza lub Windows DPAPI; Linux wymaga przemyślenia. | Adam | 14:00–15:30, 1:16:29 |
| K2 | **Jedno źródło konfiguracji dla wszystkich aplikacji**: jeden plik lub **baza CI**, do której odwołują się wszystkie aplikacje. Postulat serwisu „od lat”. | Rafał, Michał | 1:17:55, 1:21:04 |
| K3 | Baza CI ma być **na Firebirdzie**, nie na innym silniku SQL. | Michał | 1:21:04 |
| K4 | **Interfejs (UI) do konfiguracji** zamiast ręcznego SQL: UI pilnuje kompletu konfiguracji, SQL zawodzi przy blobach; łatwiej zatrudniać młodszych. | Adam, Rafał, Michał | 1:18:13–1:19:15 |
| K5 | **Jedno zintegrowane narzędzie** zamiast kilku (narzędzie do bazy, narzędzie do konfiguracji, konfiguracja w programie). | Michał | 1:20:32 |
| K6 | Model konfiguracji musi obsłużyć **oba warianty**: informatyk urzędu robi wszystko i nie podaje haseł serwisowi, albo serwis robi wszystko. „Nie możemy przyjąć jednej nomenklatury.” | Rafał, Adam | 1:17:08–1:17:55 |
| K7 | Import operatorów do bazy CI z możliwością **odświeżenia**, gdy informatyk „zapomni dać” jakąś bazę. Samo kopiowanie nie wystarcza, potrzebne scalanie. | Michał, Jan, Adam | 1:23:24–1:24:03 |

### 2.5 Uwierzytelnianie

| # | Wymaganie | Autor | Źródło |
|---|---|---|---|
| U1 | Krok pośredni: **API uwierzytelniające wystawione przez agenta nad bazą CI**; exe Embarcadero przepięte z czytania XML na REST (w XML zostaje tylko adres serwera; login i hasło → ścieżki do baz). Michał: łatwiejsze niż pisanie nowej autoryzacji, pozwala pozbyć się tabel OPER. | Adam, Michał | 1:21:18–1:22:49 |
| U2 | Docelowo (poza MVP): **STS, rozdzielenie uwierzytelniania od autoryzacji**. Uprawnienia zostają w bazach aplikacji; z tokena tylko tożsamość; algorytm kojarzenia użytkownika STS z operatorem (login, mail). Standardowe rozwiązanie z rynku, integracja z kontami domenowymi przez konfigurację. | Adam | 1:24:03–1:29:58 |
| U3 | Uwzględnić **porzucone aplikacje** (Woda, dodatki mieszkaniowe i ok. 5 innych), które mają Menadżera, ale nikt ich nie dostosuje; nie zakładać migracji 1:1. | Rafał | 1:26:33–1:28:11 |
| U4 | Zmiana logowania musi zostawić w spokoju tabele OPER: są „śmietnikiem” (varchar → integer, ADM), sprzątanie trwa drugi rok. | Rafał | 1:27:33 |

### 2.6 Aktualizacje, wersje, back office serwisu

| # | Wymaganie | Autor | Źródło |
|---|---|---|---|
| Z1 | **Zakaz jednostronnych aktualizacji** z decyzji InfoSystem. Ludzie pracują po godzinach i w weekendy (dzielnica Warszawy: 120 osób na fakturach). Aktualizacja musi być **bramkowana** z ostatecznym akcentem administratora urzędu. | Rafał, Adam | 1:36:06–1:37:29, 1:40:15 |
| Z2 | **Dwa gate’y**: (1) serwis udostępnia wersję dla konkretnej placówki (kanary, beta); (2) informatyk w porozumieniu z serwisem akceptuje instalację. Stara wersja działa równolegle. | Adam, Rafał | 1:46:28–1:47:49 |
| Z3 | **Panel dla administratora urzędu**: zaznacza, co ma się aktualizować, sprawdza, czy ktoś siedzi na bazie, uruchamia aktualizację; możliwość **rollbacku** (binarki, rzadko bazy). | Rafał | 1:36:34, 1:38:17 |
| Z4 | Dla użytkownika końcowego („pani w ośrodku kultury”) przycisk **„aktualizuj”** w aplikacji. | Rafał | 1:36:34 |
| Z5 | **Strona/panel samoobsługowy**: informatyk klika programy, które chce; wpisanie klucza/licencji powoduje pobranie i instalację; klucze generują się automatycznie, faktura. „Zero naszej ingerencji.” Model „cała paczka + aktywuj/dezaktywuj” odrzucony (stare sprzęty). | Rafał | 1:34:38, 1:35:33 |
| Z6 | **Back office dla serwisu**: lista lokalizacji, zainstalowane usługi i statusy; **grupowanie/tagowanie maszyn** (końcówki, serwery z internetem, inne) i wypychanie instalacji na grupy. | Adam | 32:00, 1:14:30 |
| Z7 | Zbieranie wersji: dziś per jednostka wersja aplikacji, Firebirda i bazy przy starcie programu. Serwis **nie potrzebuje** wersji per końcówka. | Rafał | 1:44:37 |
| Z8 | **Środowisko testowe u klienta**: kopia bazy i druga instancja aplikacji obok, na tym samym serwerze (99% przypadków); testować osobno aplikację i bazę (testowa aplikacja na produkcyjnej bazie lub odwrotnie). Klient wybiera bazę A/B. | Rafał | 1:49:04–1:50:30 |
| Z9 | Niezgodność wersji bazy blokuje operatorów, którzy nie zaktualizowali; to **akceptowalne** i obecnie stosowane. | Rafał, Adam | 1:42:30–1:43:12 |
| Z10 | Źródło artefaktów ma znać **co i w jakiej wersji zakupiła placówka** (z istniejącej bazy licencji) i na tej podstawie wiedzieć, co ma być zainstalowane. Model „desired state” jak w Kubernetes. | Adam | 32:30–34:00 |

---

## 3. Co mamy: istniejące rozwiązania

### 3.1 Updater exe Rafała (aplikacja Wilgosa)

| | | Autor |
|---|---|---|
| **Opis** | Exe uruchamiane przez aplikację Delphi: sprawdza wersję na serwerze, pobiera, zamienia pliki w katalogu. Przy starcie programu wysyła do serwera wersję aplikacji, Firebirda i bazy per jednostka (baza wersji po stronie serwisu). Istnieje strona, z której informatycy pobierają wersje. Podpisany cyfrowo przez Rafała. | Rafał (1:34:38, 1:44:37, 1:47:49), Marcin (27:00) |
| **Co działa dobrze** | Prosty, działa „od lat”. Informatycy nauczyli się pobierać i instalować sami. Opis zmian przy aktualizacji; użytkownik może odmówić. 90% większych klientów: programy na serwerze (mapowany dysk), aktualizuje informatyk. | Rafał (1:41:48, 1:42:30) |
| **Co nie działa / problemy** | Brak semafora (kilka osób pobiera naraz); aktualizacja bazy nieprzewidywalna. Nie ma zdalnego wywołania czegokolwiek na serwerze. Nie zbiera wersji per końcówka. | Rafał (1:41:48) |
| **Odpowiednik w rysunku** | Site Agent (Marcin, 27:00). Adam proponował rozszerzenie o zdalną migrację bazy (52:13); Rafał: niemożliwe, brak dostępu do serwera. |

### 3.2 Serwer licencji, strona groszek.pl, Fleet Server (Marek, Janek), heartbeat (Kwiatek)

| | | Autor |
|---|---|---|
| **Opis** | Stara strona groszek.pl z zakładką generowania kluczy licencyjnych (rozwiązanie Embarcadero). Fleet Server to rozwiązanie Marka (z udziałem Janka) z sklonowaną aplikacją do zarządzania kluczami na tej samej bazie; „architektura serwerowa groszek.pl”. Artur Kwiatkowski chciał wdrożyć heartbeat na nowym panelu groszek.pl, ale brak API. Artur zrobił też **panel dla dystrybutorów** (nie zaprezentowany). | Marcin (27:00–30:00, 7:00) |
| **Ocena** | Elementy istnieją, „nie mieliśmy ich i mamy”. Generowanie kluczy to „robota dla roboty”, dało się zautomatyzować lata temu. | Marcin, Rafał (1:34:38) |
| **Odpowiednik w rysunku** | Zarządzanie licencjami, Fleet Server, telemetria (heartbeat). |

### 3.3 Hosting mObywatel / ePłatności / eAuta na IIS (~60 klientów)

| | | Autor |
|---|---|---|
| **Opis** | API działające na IIS u ok. 60 placówek, wysyłające dane do platformy rządowej (więc serwer ma internet). Konfiguracje aplikacji webowych siedzą w bazie i są edytowane z poziomu bazy. | Adam (1:02:33, 1:08:24), Michał (1:17:15) |
| **Co nie działa / problemy** | **Usypianie schedulera** mObywatela na IIS przy braku aktywności. IIS problematyczny w instalacji. Konflikty portów z innymi usługami na IIS. | Adam (15:00, 37:01), Marek (36:32) |
| **Pomysły** | Scheduler jako Windows Service; nginx + Kestrel zamiast IIS; aplikacje jako usługi. |

### 3.4 CRU / KSeF na końcówkach

| | | Autor |
|---|---|---|
| **Opis** | Synchronizacja CRU działa na komputerze operatora. Wymaga FB3 dialekt 3 (wymusiło migracje u klientów). | sala (1:12:00), Adam (1:03:43) |
| **Co nie działa / problemy** | Nie działa 100% niezawodnie: użytkownik wyłącza komputer, przestawia datę (na serwerze też). Usługa nie startuje, wiesza się, startuje 3 minuty na słabych maszynach; kilkanaście zgłoszeń dziennie (porty, serwis nie startuje). Antywirusy zjadają niepodpisane programy. | sala (1:12:00), Rafał (1:32:20–1:32:54) |
| **Pomysły** | KSeF jako usługa na serwerze 24h („problemy się skończą”). Podpisywanie wszystkich binarek. | Rafał (1:33:30) |

### 3.5 Firebird (krajobraz u klientów)

| | | Autor |
|---|---|---|
| **Opis** | 5000 klientów z bazami 7 GB (podatkowe do 40 GB). Wersje 2.5, 3, 5 jednocześnie; kilka instancji na różnych portach to już norma (spotkane 4 na jednym serwerze). Hasło jest serwerowe (nie per baza); 90% klientów ma masterkey. Płace, budżet, środki działają na FB5; **podatki na DBX blokują przejście na FB5 i zmianę dialektu**. Bazy zdublowane dla różnych systemów, archiwa, stare bazy. Integracje firm trzecich (Arisco: wymiar śmieci). Bloki Firebirda Czarka wymagają tego samego portu dla bazy źródłowej i docelowej. | sala (39:33–43:35), Rafał (48:39–59:28) |
| **Co nie działa / problemy** | Migracja do FB5 i dialektu 3 to kopiowanie całej bazy z konwersją danych (bigint, timestamp); wymaga weekendu; biblioteki Firebirda „nie lubią zwracać błędów”; brak miejsca na dysku (7 GB baza, 10–12 GB wolne); transfer 40 GB trwa godziny; max 2–3 migracje dziennie. Dwie wersje Firebirda na jednej bazie „wybuchną” (inny ODS). Dialekt 3 postulowany od 15 lat (serwis), od 6 lat prosi prezes. | Rafał, Michał (1:39:49), Adam, Jan (46:50–47:08) |
| **Pomysły** | Marek: ujednolicić do FB5 wszędzie, kompilować FB pod dowolny Linux, pakiety deb/rpm. Rafał: narzędzie „egzekutor blok Firebird” 70× szybsze od standardowego. Adam: nie rozwiązywać w MVP; celować w placówki już na FB3 dialekt 3. |

### 3.6 Baza CI i aplikacja Janka (menedżer / import operatorów)

| | | Autor |
|---|---|---|
| **Opis** | Baza CI jako centralne miejsce na operatorów i połączenia. Aplikacja Janka pozwala zaimportować użytkowników do bazy CI. | Michał (1:20:04), Jan (1:23:24) |
| **Co działa dobrze** | Założenie „rzutowania bazy do programu” dobre. Dodatkowa baza CI nie jest problemem, serwis chce centralizacji. | Michał (1:20:04, 1:21:04) |
| **Co nie działa / problemy** | Po imporcie trzeba i tak sprawdzać zależności w IBExpert. Problem synchronizacji operatorów ze starymi bazami pozostaje (dodanie operatora w PK nie trafia do CI). Za dużo osobnych narzędzi. | Michał, Jan, Adam (1:20:04–1:24:03) |
| **Pomysły** | Import z odświeżaniem (Michał); scalanie, nie kopiowanie (Adam); API uwierzytelniające nad bazą CI (Adam); docelowo STS z tożsamością oddzieloną od uprawnień (Adam). |

### 3.7 Gateway API i prototypy uwierzytelniania (Janek)

| | | Autor |
|---|---|---|
| **Opis** | Zrobiony gateway API i uwierzytelnianie użytkowników (nazwy zniekształcone w transkrypcji). Jan pyta, czy „odchodzi na boczne tory” i czy będzie recyklingowane. | Jan (1:30:14) |
| **Status** | Adam: żadne decyzje nie zapadły; po zebraniu wymagań decyzja, co wziąć tak jak jest, co dostosować, co „zaorać”. | Adam (1:30:44) |

### 3.8 Proces wydawania i testowania

| | | Autor |
|---|---|---|
| **Opis** | „Testowanie na produkcji”: wersja idzie do 3 klientów, oni wgrywają i testują. Duże zmiany (np. doręczenia) wdrażane ręcznie: kopia wszystkich baz, Rafał siada z klientem, 3 dni testów, dopiero potem kolejny klient. Rafał automatyzuje testy przez AI (Claude, Gemma, Ola). | Rafał (1:37:31, 1:45:03, 1:38:44) |
| **Co nie działa / problemy** | Jakość testów „żenująca”: wersje, które nie uruchamiają się (brak biblioteki), trafiały do klientów; duży urząd stoi, potrzebna szybka poprawka lub rollback. Wiecznie gubione biblioteki. Podpisywanie ręczne: tylko Czarek ma token, zapomniał już 2 razy. | Rafał (1:37:31, 1:33:30, 1:39:12) |
| **Pomysły** | Pełna migracja do gita, podpisywanie chmurowe w CI („na gicie od razu”). Nowe aplikacje: testy jednostkowe, błędy „bardziej merytoryczne”. | Rafał (1:33:30, 1:38:17, 1:51:42) |

---

## 4. Ograniczenia

### 4.1 Ograniczenia infrastrukturalne (po stronie klientów)

| # | Ograniczenie | Autor | Źródło |
|---|---|---|---|
| I1 | **Serwis nie ma dostępu do serwerów klientów.** „Nikt nas nie wpuści na serwer.” Nawet informatycy dzielnic Warszawy nie mają dostępu; udostępnienie bazy wymaga pisma do miasta; VPN‑y poblokowane. Dostęp tylko po znajomości i pod nadzorem. Deklaracje dystrybutorów o zdalnych aktualizacjach to „bajka”. | Rafał | 53:13–53:55 |
| I2 | **Brak internetu na serwerach** u części klientów (końcówki mają). Na ~60 serwerach z mObywatel/ePłatności internet jest; klienci tylko z podatkami i budżetem go nie potrzebują i nie dadzą się zmusić. | Adam, Rafał, sala | 1:07:41–1:09:30 |
| I3 | **Topologia wieloserwerowa**: niektórzy klienci nie chcą, by eAuta miały wyjście na zewnątrz, a mObywatel ma; najbezpieczniej: baza / aplikacje desktop / aplikacje z wyjściem na trzech osobnych serwerach. | Rafał | 1:13:45 |
| I4 | **Zróżnicowane maszyny**: Windows Server (różne wersje), czasem Linux (w tym „dziwne” dystrybucje bez nowych Firebirdów), PC operatora. | Adam, sala | 11:30, 43:35 |
| I5 | **Chaos wersji Firebirda** (2.5/3/5, kilka instancji, hasło serwerowe, aplikacje firm trzecich wymagające starych wersji). Migracja ograniczona czasem, miejscem na dysku, dostępem i wielkością baz. | sala, Rafał | 38:25–59:28 |
| I6 | **Słaby sprzęt**: usługa .NET startuje 3 minuty; stare sprzęty nie udźwigną „całej paczki” aplikacji; laptopy sprzed 5 lat w pracy z domu. | Rafał | 1:32:54, 1:35:33, 1:50:32 |
| I7 | **Antywirusy i polityki Windows** blokują niepodpisane programy (także dostęp do drukarek). | Rafał | 1:32:54, 1:34:20 |
| I8 | **Praca przez RDP/VPN**: 90% informatyków udostępnia pracę zdalną przez VPN lub RDP; wszyscy pracują na serwerze. Trend w stronę terminali, ale „jeszcze lata całe”. | Rafał | 1:50:32 |
| I9 | **Sieć InfoSystem**: brak wolnych adresów IP w Legionowie, groszek.pl na vhoście, więc wystawienie usługi dla agentów będzie przez NAT na nietypowym porcie (np. 65000), nie 443. | Marek | 24:31–26:00 |
| I10 | **nginx na Windows** był swego czasu w wersji eksperymentalnej (Jan); Rafał używa go w PKP bez problemów. | Jan, Rafał | 1:01:34–1:02:14 |
| I11 | **Konflikty portów**: inne usługi firm trzecich na IIS, Firebird na różnych portach, bloki Firebirda wymagające tego samego portu źródło/cel. | Marek, Rafał | 36:32, 59:02 |

### 4.2 Ograniczenia wynikające z użytkowników, serwisu i doświadczeń z istniejącymi rozwiązaniami

| # | Ograniczenie | Autor | Źródło |
|---|---|---|---|
| S1 | **Dostępność klientów**: informatyk dostępny np. w poniedziałek 8–10, inaczej kolejny poniedziałek; umawianie się tygodniami; brak informatyka u małych. | Michał, Rafał | 57:38–57:45 |
| S2 | **Klienci nie zatrzymają pracy**: duże jednostki (Marki, Warszawa) nie staną na 2 dni; migracje tylko w weekend. Sprawozdania podatkowe wstrzymują aktualizacje. | Rafał | 48:39, 1:42:30 |
| S3 | **Dwa typy informatyków**: albo robią wszystko sami i nie dopuszczają serwisu (nawet do Firebirda), albo nie znają się i serwis robi wszystko. Połowa „sobie nie poradzi”. | Rafał | 1:17:08, 1:41:04, 1:53:29 |
| S4 | **Zaufanie zamiast procedury**: wielu klientów instaluje, co im się da („ruski agent by wszedł na serwery”); ale „mądrzejszych” (Warszawa, Otwock, Złotoryja) trzeba zapytać o zgodę. | Rafał | 1:54:58–1:55:43 |
| S5 | **Przyzwyczajenia serwisu i programistów**: konfiguracja przez wpisy w bazie, logi przez edycję config/XML; „chłopaki się nie zmienią”. | Rafał | 1:45:03 |
| S6 | **Partyzantka w procesie wytwórczym**: brak pełnego gita, gubione biblioteki, ręczne podpisywanie, testy na produkcji. Rafał: dopóki tego nie posprzątamy, „nic z tego nie będzie”. | Rafał | 1:38:44, 1:51:42 |
| S7 | **Porzucone aplikacje** (Woda, dodatki mieszkaniowe, ok. 5 innych) wciąż sprzedawane („ktoś kupi za 2000 i ma działać natychmiast”), nikt ich nie dostosuje. | Rafał | 1:26:33, 1:51:42 |
| S8 | **Wyjątków będzie więcej niż reguły**; „założenie, że będzie dobrze, to nie założenie”. | Rafał, Marek | 59:28, 1:31:54 |
| S9 | **Skala serwisu**: 3000–5000 klientów; serwisant z 20 klientami może łączyć się do każdego po godzinach, serwis InfoSystem nie. Codziennie instalowane po kilkanaście programów plus szkolenia. | Rafał | 1:03:01, 1:53:29 |
| S10 | **Zmiana pokoleniowa**: młodzi serwisanci będą polegać na AI, więc narzędzia muszą być klikalne („ptaszki”), nie oparte na pamięci o skryptach SQL. | Rafał | 1:34:38, 1:18:13 |

### 4.3 Ograniczenia prawne, umowne i organizacyjne

| # | Ograniczenie | Autor | Źródło |
|---|---|---|---|
| P1 | **Umowy przenoszą odpowiedzialność na klienta**: baza i instalacja są własnością klienta; InfoSystem „ściąga z siebie umowami całą odpowiedzialność”. Automatyczne działania na serwerach klienta „absolutnie nie wchodzą”. | Rafał | 57:45 |
| P2 | **Zakaz jednostronnych aktualizacji**: decyzja o aktualizacji należy do administratora/użytkownika urzędu. | Rafał | 1:36:06 |
| P3 | **Odpowiedzialność za nginx i inne komponenty spada na InfoSystem** (dostępność, aktualizacje), inaczej niż przy IIS aktualizowanym przez Windows Update. | Marek, Adam | 16:05, 44:43–45:10 |
| P4 | **Polityki bezpieczeństwa urzędów** mogą nie dopuścić agenta na serwerze, proxy na końcówkach ani ruchu wychodzącego z serwera; kwestia zgody klientów do zweryfikowania (Warszawa, Otwock, Złotoryja). | Marek, Adam, Rafał | 18:09, 1:12:30, 1:54:58 |
| P5 | **Proces podpisywania kodu**: jeden token sprzętowy (Czarek), brak podpisywania w CI; problem organizacyjny do rozwiązania. | Rafał | 1:33:30 |
| P6 | **Blokada DBX w podatkach** od lat (prośby o dialekt 3 od 6–15 lat), problem właścicielski, nie techniczny: „trzeba usiąść i zrobić”. | Marek, Rafał, Michał | 41:29–42:50, 1:39:49 |
| P7 | **Jedna firma, wiele torów**: Marcin chce skoordynować prace z Józkiem, by nie było „bocznych torów i bocznej roboty”. | Marcin | 8:40 |

---

## 5. Propozycje rozwiązań zgłoszone na spotkaniu

| # | Propozycja | Autor | Reakcja / status |
|---|---|---|---|
| R1 | **Site Agent jako usługa (Windows/Linux) z uprawnieniami admina**, komunikacja wychodząca do źródła artefaktów, raportowanie stanu. | Adam | Jan (1:31:11): „główna mała decyzja: nginx wydaje się OK i agent jako usługa”. Rafał: „nie widzę problemu”. Marek: zgoda pod warunkiem przemyślenia wyjątków. |
| R2 | **nginx jako reverse proxy + Kestrel + Windows Service, bez IIS.** | Adam (za Marcinem z 9.10) | Rafał (1:54:58): „pomysł z nginx mi się podoba”. Jan pytał o dojrzałość nginx na Windows. |
| R3 | Model **desired state** (jak Kubernetes): źródło artefaktów zasilane z bazy licencji wie, co ma być gdzie zainstalowane; agent dba o stan na maszynie. | Adam | Bez sprzeciwu, do rozwinięcia. |
| R4 | **Sekrety przez Windows DPAPI** (jeśli bez Linuxa) lub w bazie. | Adam | Nierozstrzygnięte; Linux wymaga innego rozwiązania. |
| R5 | **Ujednolicić Firebirda do wersji 5 wszędzie**, bez wersji przejściowych; FB kompilowany pod każdy Linux, pakiety deb/rpm. | Marek | Sala: 5 jest „relatywnie dobra”, ale blokuje DBX w podatkach. Rafał: migracja 5000 klientów to lata. Adam: poza MVP, celujemy w FB3 dialekt 3. |
| R6 | **Zdalna migracja bazy** jako rozszerzenie updatera (kopia obok produkcji, konwersja, uruchomienie), żeby nie jeździć do 20 000 placówek. | Adam | **Odrzucona przez serwis w tej formie**: brak dostępu do serwera, brak miejsca na dysku, brak obsługi błędów w bibliotekach FB. Rafał: „na kopii” byłoby OK, ale i tak robią to u siebie w weekendy. |
| R7 | Paczki instalacyjne **bez interakcji**: podpisane MSI (jak w PKP), skrypty, zipy; na Linuxie pakiety. | Adam, Marek | Zbigniew pytał o interaktywne instalatory i Linux; Marek: „prościzna”. Rafał: zgoda. |
| R8 | **Agenty pomocnicze na końcówkach / agent na komputerze administratora** jako wyjście na świat dla serwera bez internetu; albo instalacja na PC operatora. | Adam | Do weryfikacji z polityką bezpieczeństwa urzędów. Rafał: wariant 3 serwerów (baza / desktop / wyjście) jest najbezpieczniejszy. |
| R9 | **Back office serwisu z tagowaniem/grupowaniem maszyn** i wypychaniem instalacji na grupy. | Adam | Rafał: „cudowne, jeżeli się uda”. |
| R10 | **Baza CI jako jedyne źródło konfiguracji**, na Firebirdzie, z UI zamiast SQL, w jednym narzędziu. | Rafał, Michał, Adam | Zgoda serwisu. Jan: problem synchronizacji operatorów pozostaje. |
| R11 | **API uwierzytelniające przez agenta nad bazą CI**; exe Embarcadero przepięte z XML na REST (w XML tylko adres serwera). | Adam | Michał: „łatwiej niż pisać programy pod nową autoryzację”, pozwala pozbyć się OPER. Marek: adresy jako domeny, nie IP. |
| R12 | **STS z rozdzieleniem uwierzytelniania od autoryzacji**; uprawnienia zostają w bazach aplikacji; kojarzenie po loginie/mailu; standardowe rozwiązanie z integracją z domeną. | Adam | Poza MVP. Rafał: poprawa bezpieczeństwa „na pewno, bo gorzej się nie da”; ale porzucone aplikacje nie pójdą 1:1. |
| R13 | **Scheduler/KSeF jako usługa na serwerze 24h**, usługi jako usługi, aplikacje jako aplikacje. | Adam, Rafał | Zgoda. |
| R14 | **Panel samoobsługowy dla informatyka** (klik programów → pobranie, instalacja, klucze, faktura) jak pokazywał Dominik; **panel administratora** do bramkowania aktualizacji, sprawdzania kto siedzi na bazie, rollbacku; **przycisk „aktualizuj”** dla użytkownika. | Rafał | Przyjęte przez Adama jako wymagania („trzeba będzie coś wymyślić, żeby bramkować”). |
| R15 | **Kanary / środowisko testowe u klienta**: wersja udostępniona jednej placówce, instalowana za zgodą informatyka obok starej, na kopii bazy. | Adam (interpretacja praktyki Rafała) | Rafał potwierdza praktykę; zastrzega, że testuje się osobno aplikację i bazę. |
| R16 | **Posprzątać dom przed rewolucją**: pełny git, podpisywanie w CI, naprawa DBX, wycofanie porzuconych aplikacji. | Rafał | Adam: nie możemy czekać, MVP/prototyp równolegle. Rafał: „żebyśmy znowu nie wylądowali z ręką w nocniku po 2 latach”. |
| R17 | **Zapytać klientów** (Warszawa, Otwock, Złotoryja), czy pozwolą zainstalować agenta i nginx. | Rafał | Do zrobienia przed decyzją. |
| R18 | Wykorzystać **panel dystrybutorów Artura Kwiatkowskiego** w propozycji Adama. | Marcin | Prezentacja nie odbyła się; temat otwarty. |

---

## 6. Decyzje i ustalenia

Spotkanie nie było decyzyjne, ale padły następujące ustalenia robocze:

| # | Ustalenie | Kto | Czas |
|---|---|---|---|
| D1 | Zakres MVP: 4 aplikacje (mObywatel/ePłatności, KSeF, CRU, eAuta), ok. 60 placówek, bez Tier M, bez kontenerów. | Marcin, Adam | 9:30, 1:02:33 |
| D2 | Kierunek **nginx + Kestrel + agent jako usługa** uznany za „OK” przez obecnych; serwis bez sprzeciwu. | Jan (podsumowanie), Rafał | 1:31:11, 1:00:56 |
| D3 | **Firebird poza zakresem MVP**: minimum FB3 dialekt 3 (już wymuszone przez KSeF/CRU); placówki na FB2.5 bez możliwości migracji nie są celem. Docelowo FB5 (Marek). | Adam, Marek | 59:56, 46:10 |
| D4 | Agent nie aktualizuje Firebirda („nie nasze”). | Adam | 45:10 |
| D5 | **Aktualizacje nigdy jednostronnie**; wymagane bramkowanie przez administratora urzędu. | Rafał, przyjęte przez Adama | 1:36:34, 1:40:15 |
| D6 | Baza CI na Firebirdzie, nie na innym silniku. | Michał | 1:21:04 |
| D7 | Szczegóły sieciowe (port, NAT, 443) odłożone do czasu klepnięcia architektury. | Adam | 26:00 |
| D8 | Żadne decyzje o losie istniejących komponentów (gateway, auth Janka) nie zapadają teraz; dopiero po zebraniu wymagań. | Adam | 1:30:44 |
| D9 | Kolejna iteracja za tydzień; uwagi w międzyczasie na kanale „Fundamenty”. | Adam | 1:54:25, 1:56:33 |

---

## 7. Pytania otwarte

1. **Zgoda klientów na agenta z uprawnieniami admina i nginx** na serwerze: nikt jeszcze nie pytał (Marek, 18:09). Rafał proponuje zapytać Warszawę, Otwock, Złotoryję.
2. **Serwer bez internetu**: który wariant (PC operatora, agent pomocniczy na końcówce, komputer administratora) jest akceptowalny prawnie i organizacyjnie? Czy MVP nie jest błędnie założony pod systemy, które „po prostu istnieją” (mają internet), a nie pod te, które będą używane?
3. **Linux**: czy MVP musi wspierać Linux? Decyduje o wyborze mechanizmu sekretów (DPAPI vs inne) i formie agenta.
4. **Uwierzytelnianie w MVP**: unifikować czy pominąć? (Adam, 12:00). Krok pośredni z API nad bazą CI czy od razu STS?
5. **Synchronizacja operatorów z bazą CI**: kopiowanie nie wystarcza, potrzebne scalanie; jak? (Jan, Adam, 1:23:24)
6. **Mapowanie tożsamości STS na operatorów** w bazach aplikacji: po loginie, mailu? Koszty serwisowe takiego rozwiązania.
7. **Porty i NAT po stronie InfoSystem**: czy agenci mogą łączyć się na nietypowy port (65000)? Czy można wystawić subdomenę na 443? (Marek, 24:31)
8. **Czy mObywatel i eAuta dadzą się skompilować self‑contained na Kestrelu** jak nowsze aplikacje? (Adam, 13:30)
9. **Kolizje portów** z IIS firm trzecich i Firebirdem: polityka wyboru portów.
10. **Panel dystrybutorów Artura Kwiatkowskiego**: co zawiera i jak wpisuje się w architekturę? Nie zaprezentowany.
11. **Co z gatewayem API i prototypami uwierzytelniania Janka**: wziąć, dostosować czy zaorać? (Jan, 1:30:14)
12. **Podpisywanie kodu w CI**: kto i kiedy wdroży podpisywanie chmurowe zamiast tokena Czarka?
13. **DBX w podatkach**: kto i kiedy odblokowuje migrację na FB5 i dialekt 3 (problem właścicielski od lat)?
14. **Jednostki podległe JST** (punkt 5 agendy): temat nie został poruszony na spotkaniu.
15. **Kolejność wdrożeń i pilot** (punkt „Decyzje” agendy: która aplikacja i która gmina pierwsza): nie ustalono.

---

## 8. Następne kroki

| Krok | Odpowiedzialny | Źródło |
|---|---|---|
| Kolejne spotkanie za tydzień: następna iteracja i „przybliżenie” propozycji; zaproszenie do sabotowania; po zgodzie test run. | Adam, Marcin | 1:54:25, 1:56:33 |
| Zgłaszać pomysły, pytania i zauważone braki na kanale „Fundamenty” do czasu spotkania. | wszyscy | 1:56:33 |
| Zapytać klientów (Warszawa, Otwock, Złotoryja), czy pozwolą zainstalować agenta i nginx. | Rafał (propozycja) | 1:54:58 |
| Uwzględnić w projekcie: bramkowanie aktualizacji przez administratora, panel samoobsługowy, przycisk „aktualizuj”, grupowanie maszyn, środowisko testowe obok produkcji. | Adam | 1:40:15, 1:14:30 |
| Zebrać od Czarka listę problemów z portami i startem usług CRU/KSeF („moglibyśmy wziąć Czarka i pogadać”). | Rafał, Adam | 1:32:43–1:32:54 |
| Pokazać panel dystrybutorów. | Artur Kwiatkowski | 7:00 (nie zrealizowane na spotkaniu) |
| Skoordynować prace z Józkiem (szyfrowanie sekretów, wspólny tor). | Marcin | 8:40 |
| Porządki w procesie wytwórczym: migracja na git, podpisywanie w CI. | Rafał (postulat), właściciel nieustalony | 1:33:30, 1:51:42 |

---

## 9. Słowniczek (zniekształcenia automatycznej transkrypcji)

| W transkrypcji | Znaczenie |
|---|---|
| TRS, TRSK, MK, wiem ka, wiemka, wiem oka | **Tier S**, **Tier M** (rozmiary T‑shirt); **VM‑ka** (maszyna wirtualna) |
| said agent, side agent, sita agent, Fight agent, sitegen | **Site Agent** — usługa agenta na maszynie klienta |
| enginex, engineers, NG next, naj x, NXA, ngin axes, n gajnik, endings, NJ | **nginx** |
| castell, kestel, testel, caestel | **Kestrel** (serwer HTTP .NET) |
| a ja się, a i SA, a ja jest, ai SA, jajes | **IIS** |
| fajerwerd, fajerwerk, fireberg, fair berta, fajtward, pani Robert, frajer | **Firebird**; „2,5 / 3 / 4 / 5” to wersje, „dialekt 3” to dialekt SQL |
| DBX, DBIX, DBXA | **DBX** (DbExpress, sterownik Delphi blokujący migrację podatków) |
| ODS, odessa | **ODS** (On‑Disk Structure Firebirda) |
| egzek, egzekucja, binarka | aplikacja desktopowa `.exe` |
| embarcadero, barkę, m barca dero, emberka, amberka | **Embarcadero Delphi** (obecne exe) |
| m obywatel, e opłaty, płatności plus, rapid plus, kseve, ksyw, celu, CRU, CRUS, e-uta, eauta, auta | **mObywatel**, **ePłatności / e‑Opłaty**, **KSeF**, **CRU**, **eAuta** (4 aplikacje MVP) |
| baza CI, cej, CIA, CIO, sejm | **baza CI** (centralna baza operatorów i konfiguracji) |
| OPER, oper | tabele operatorów w bazach aplikacji |
| STS, SS, STSA, SM | **STS** (Security Token Service) |
| Artifact Store, źródło artefaktów | **Artifact Store** — repozytorium wersji |
| free serwer, fill serwer | **Fleet Server** — serwer licencji/floty po stronie InfoSystem |
| heartbet, harbit | **heartbeat** |
| data protection | **Windows DPAPI** |
| gigsa, mieciem gigsa | menedżer pakietów, którego Rafał używa prywatnie („świat idealny”: wszystko instaluje się i aktualizuje samo); nazwa nieodczytywalna (Chocolatey? winget?) |
| PKP | inna firma/projekt Marka i Rafała, gdzie używają MSI i nginx |
| Leroy, OBI, point of sail | retail / **POS** — doświadczenie Adama z agentami na kasach |
| Menadżer, menadżera | wspólna biblioteka logowania w aplikacjach Delphi |
| Arisco, aris, parisco | firma trzecia (wymiar śmieci) integrująca się z księgowością |
| IBExpert, ekspert | narzędzie do baz Firebird |
| egzekutor blok Firebird | narzędzie Rafała do szybkiego kopiowania baz |
| doręczenia | nowa funkcjonalność (e‑Doręczenia) powiększająca bazy |
| Fundamenty | kanał/grupa, na której toczy się dyskusja o projekcie |
| second brain | baza wiedzy firmy |
| Master cay | **masterkey** (domyślne hasło SYSDBA Firebirda) |
| ***** | wycenzurowane wulgaryzmy, zachowane jak w źródle |
