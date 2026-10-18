# Ocena dopasowania wyciągu Tier S do wymagań ze spotkań 1.10, 9.10 i 14.10.2026

| | |
|---|---|
| **Data oceny** | 18 października 2026 |
| **Oceniany dokument** | `2026-10-16_TierS_architecture_extract.md` (wyciąg z wytycznych architektury na spotkanie z serwisem) |
| **Punkty odniesienia** | `2026-10-01-podsumowanie-spotkanie-dystrybucja.md` (realia klientów, VM/Docker), `2026-10-13_Omówienie pre-architektury - podsumowanie.md` (spotkanie 9.10, odchudzenie do MVP), `2026-10-14_Spotkanie Fundamenty - podsumowanie.md` (szerokie spotkanie z serwisem), `2026-10-16_TierS_agenda.md` |
| **Cel** | Sprawdzić, czy wyciąg Tier S odpowiada na wymagania, decyzje i ograniczenia zebrane na trzech spotkaniach, i wskazać, co wymaga korekty przed kolejną iteracją. |

Identyfikatory W, T, I, U, P, R, A, H, K, Z, D odnoszą się do tabel w podsumowaniach spotkań (prefiks daty mówi, którego). Numery sekcji w nawiasach odnoszą się do wyciągu Tier S.

---

## 1. Werdykt

Wyciąg Tier S trafia w główny problem ze spotkania 1.10 i w decyzje z 9.10 i 14.10. Usługi Windows na istniejącej maszynie, bez VM i kontenerów, to wprost odpowiedź na „58 z 60 klientów nie znalazło zasobów na VM”. Zakres MVP (4 aplikacje, agent, nginx, Kestrel, sekrety) zgadza się z tym, co Marcin nazwał MVP. Dokument jest uczciwy w słabych punktach: sam wskazuje budżet RAM „na styku”, macierz wersji i odstępstwo od zasady jednego hosta.

Są jednak cztery rozjazdy względem wymagań zebranych 14.10, z których dwa dotyczą rzeczy nazwanych przez serwis warunkami koniecznymi.

**Ocena: kierunek właściwy, zakres MVP do korekty w dwóch miejscach (bramkowanie aktualizacji, STS), cztery założenia do zderzenia z realiami terenu (Firebird, konfiguracja, internet, warunki wstępne).**

---

## 2. Co wyciąg rozwiązuje zgodnie z oczekiwaniami

| Oczekiwanie (źródło) | Odpowiedź w wyciągu | Ocena |
|---|---|---|
| Działanie obok obecnych aplikacji, bez nowego serwera, także na PC operatora (1.10 W1–W3, 14.10 W3) | Sekcje 1 i 4: wszystko na istniejącej maszynie Windows, PC operatorów bez nowego oprogramowania | Pełne |
| MVP = Site Agent + Site Host, bez Migratora, telemetrii, Tier M (9.10 D4, D5) | Sekcje 1 i 5: te komponenty jawnie odłożone | Pełne |
| nginx + Kestrel + Windows Service, bez IIS (9.10 D7, 14.10 H1, H2) | Sekcja 4.2 | Pełne |
| Scheduler jako usługa, koniec usypiania (14.10 H5, 1.10 T13) | Sekcja 4.2: Quartz w usłudze | Pełne |
| Sekrety poza XML (1.10 luka 52:20, 14.10 K1) | Sekcje 4.5 i 6, DPAPI | Pełne dla 4 aplikacji webowych |
| Tylko ruch wychodzący, brak VPN dla danych (9.10 D1, 14.10 A5, 1.10 P1, P2) | Sekcja 2 | Pełne |
| Informatyk instaluje tylko agenta, reszta bez interakcji (14.10 A8, A9) | Sekcje 4.1 i 7 | Pełne |
| Podpisane pakiety (14.10 A10) | Sekcje 4.1 i 7 | Pełne jako wymaganie, patrz warunek wstępny w 3.6 |
| Brak AD u 90% klientów (1.10 I5) | Sekcja 4.3: konta lokalne, LDAP opcjonalnie, bez dołączania do domeny | Pełne |
| Rozdzielenie tożsamości od uprawnień (1.10 T7, 14.10 U2) | Sekcja 4.3: STS mówi kto, uprawnienia zostają w aplikacjach | Pełne |
| Jeden kod, bez utrzymania dwóch wersji API (1.10 T4, T15) | Osobne usługi Kestrel zamiast IIS i Dockera równolegle | Pełne, likwiduje podwójne instancje u 2 klientów |
| Minimalne zasoby (1.10 T17, 14.10 I6) | Sekcja 4.6: jawny budżet z zastrzeżeniem pomiaru przed pilotem | Dobre |
| Istniejący serwer licencji jako źródło artefaktów (9.10 D6, 14.10 mapowanie Marcina) | Sekcja 8 pkt 1 | Dobre, do decyzji |
| Odstępstwo od zasady „jeden host, wiele modułów” zapisane jawnie z powodem (różne wersje .NET, osobny rozwój) | Sekcja 1 | Dobre, wymaga ADR |

---

## 3. Rozjazdy i luki

### 3.1 Brak bramkowania aktualizacji przez administratora urzędu

To najpoważniejsza luka. Sekcja 7 opisuje agenta, który sam pobiera, instaluje i wycofuje. Na 14.10 Rafał powiedział „absolutnie nie” jednostronnym aktualizacjom, a Adam to przyjął (14.10 Z1, Z2, Z3, Z4, D5). Ludzie pracują po godzinach i w weekendy; umowy przenoszą odpowiedzialność za instalację na klienta (14.10 P1, P2); rozwiązania sprzedane w projektach mają działać 5 lat w warunkach gminy (1.10 P4).

Wymagane są dwie bramki: serwis udostępnia wersję dla konkretnej placówki, informatyk akceptuje instalację. Do tego panel administratora (co się aktualizuje, kto siedzi na bazie, rollback), przycisk „aktualizuj” dla użytkownika i stara wersja równolegle. W wyciągu nie ma żadnej z tych rzeczy, a to warunek wejścia na serwery, nie funkcja na później.

**Do uzupełnienia:** tryb agenta „pobierz, zweryfikuj, czekaj na zgodę” w kontrakcie z sekcji 4.1; minimalny interfejs zgody (choćby lokalna strona pod `/agent/` za nginx); zapis w sekcji 7, że krok 4 wykonuje się dopiero po akceptacji.

### 3.2 STS w MVP stoi w sprzeczności z decyzją „najpierw instalacja”

Marcin 9.10: MVP to „jesteśmy w stanie zainstalować i serwis działa”, przepinanie logowania dopiero po stabilnym działaniu agenta (9.10 D8). Na 14.10 jako krok pośredni padło API uwierzytelniające nad bazą CI, STS docelowo, poza MVP (14.10 U1, U2). Wyciąg wkłada STS do grubej ramki MVP, z własną bazą, importem haszy i wymuszoną zmianą hasła przy pierwszym logowaniu.

Zdanie „nigdy nie ma dwóch magazynów haseł” (sekcja 4.3) jest nierealne, dopóki exe Delphi pozostają „bez zmian” (diagram) z tabelami OPER. Przez okres pomostowy magazyny będą dwa. Rafał ostrzegał też o porzuconych aplikacjach, które nie przejdą 1:1 (14.10 U3), i o tabelach OPER, których nie wolno ruszać (14.10 U4).

**Do rozstrzygnięcia:** albo STS wypada z MVP na rzecz prostszego wspólnego logowania 4 aplikacji (np. API nad bazą CI z 14.10 U1), albo zostaje z jawnym zapisem, że to uzgodniona zmiana wobec decyzji z 9.10 i z realistycznym opisem okresu dwóch magazynów haseł.

### 3.3 Zmiany poświadczeń Firebirda zderzają się z terenem

Sekcja 6 zakłada losowe hasło SYSDBA per lokalizacja, użytkownika Firebird per aplikacja i „koniec ze wspólnym masterkey”. Na 14.10 padło: hasło Firebirda jest serwerowe, zmiana zepsuje aplikacje firm trzecich (Arisco), 90% klientów ma masterkey, kilka instancji Firebirda na różnych portach to norma, bloki Czarka wymagają tego samego portu, a agent nie dotyka Firebirda (14.10 D4, I5, I11). Zmiana SYSDBA to dotknięcie Firebirda.

Diagram pokazuje jedną instancję „Firebird 3”, a aplikacje muszą wiedzieć, do której instancji i portu się łączyć.

**Do uzupełnienia:** sekcja 6 jako opcja „tam, gdzie brak zależności zewnętrznych i jedna instancja”, nie reguła MVP; w konfiguracji aplikacji jawny wybór instancji i portu; minimalny wymóg FB3 dialekt 3 zapisany wprost (14.10 D3).

### 3.4 Brak jednego źródła konfiguracji

Serwis od lat chce bazy CI lub jednego pliku jako jedynego źródła konfiguracji, na Firebirdzie, z UI zamiast SQL, w jednym narzędziu (14.10 K2–K5, R10, D6). Wyciąg ma magazyn sekretów (4.5) i rejestr użytkowników STS (4.3), ale nie mówi, gdzie żyje konfiguracja niebędąca sekretem (ścieżki do baz, adresy, parametry aplikacji) ani jak serwis ją edytuje. Baza CI w ogóle nie pojawia się w dokumencie, choć na 1.10 i 14.10 była głównym tematem. Model musi też obsłużyć oba warianty: informatyk robi wszystko sam i nie podaje haseł, albo serwis robi wszystko (14.10 K6).

**Do uzupełnienia:** sekcja o konfiguracji nie-sekretnej (jedno źródło, kto edytuje, czym), relacja do bazy CI (wchłonięta, zastąpiona czy równoległa), oraz synchronizacja operatorów (14.10 K7), jeśli baza CI zostaje.

### 3.5 Założenie o internecie na serwerze jest niewypowiedziane

Dla 60 placówek z mObywatel internet na serwerze jest, więc MVP się broni. Ale wyciąg nie zapisuje tego założenia ani topologii wieloserwerowej (14.10 A11, A12, I2, I3), gdzie agent stoi na serwerze aplikacyjnym z wyjściem na świat, a Firebird na innym. Diagram ma wszystko na jednej maszynie. Do tego Marek na 1.10 ostrzegał, że ruch DNS i wychodzący bywa wycinany (1.10 T3), a adresy mają być domenowe, nie IP (14.10 A13).

**Do uzupełnienia:** jedno zdanie o założeniu „serwer z agentem ma wychodzący HTTPS”, wariant diagramu z bazą zdalną, lista hostów do allow-listy dla IT urzędu.

### 3.6 Warunki wstępne poza architekturą

Podpisywanie Authenticode wymaga procesu, którego nie ma: jeden token sprzętowy u Czarka, brak podpisywania w CI (14.10 P5, S6). Self-contained dla mObywatel i eAuta jest do sprawdzenia (14.10 pytanie otwarte 8). Base path w czterech SPA i wspólny kontrakt health/konfiguracja/wersja to realna praca unifikacyjna (14.10 W4), nieoszacowana. Rafał: bez „posprzątania domu” nic z tego nie będzie (14.10 R16).

**Do uzupełnienia:** lista „co musi istnieć przed pierwszą instalacją” z właścicielami: podpisywanie w CI, self-contained 4 aplikacji, base path, kontrakt wobec agenta.

### 3.7 Mniejsze nieścisłości wewnętrzne

- Diagram: „Windows Service/Linux”, a sekrety przez DPAPI, które jest tylko windowsowe. Decyzja o Linuksie (14.10 pytanie 3) rozstrzyga oba punkty.
- Sekcja 4.2: aplikacja „tabele Delphi tylko czyta”. Artur na 1.10 mówił, że API ePłatności księguje wpłaty. Do weryfikacji z Pawłem.
- Sekcja 4: „PC operatorów nie dostają nowego oprogramowania”, a decyzja 6 rozważa root CA na PC operatorów. Przy pracy przez RDP na serwerze (14.10 H8) certyfikat dla localhost upraszcza sprawę i warto to zapisać jako wariant główny.
- Sekcja 3 ma dwa diagramy bez podpisów. Pierwszy to pełny Tier S z komponentami odłożonymi, drugi MVP. Wystarczy je nazwać.
- Sekcja 4.6: budżet 600–1050 MB liczony bez okresu przejściowego, w którym stare API na IIS działają równolegle z nowymi usługami. Na maszynie z 4 GB RAM (1.10 I2) to podwójne obciążenie.
- Sekcja 9: większość pytań do serwisu została już odpowiedziana 14.10 (uprawnienia: lokalny admin do przygotowania; internet: jest na 60 serwerach z mObywatel, brak u klientów tylko z podatkami; Firebird: 2.5/3/5 równolegle, minimum FB3 dialekt 3; AD: ok. 10%; RDP: 90% informatyków). Odpowiedzi warto wpisać do dokumentu zamiast pytań.

---

## 4. Czego brakuje na liście „później”

Poniższe rzeczy nie muszą wejść do MVP, ale powinny być zapisane jako zdolności, żeby decyzje MVP ich nie zablokowały:

- **Środowisko testowe obok produkcji** na kopii bazy i **kanary per placówka** (14.10 Z2, Z8, R15). Model katalogów wersji agenta to wspiera: druga instancja pod innym prefiksem (np. `/cru-test/`) na bazie testowej.
- **Back office serwisu** z listą lokalizacji, grupowaniem i tagowaniem maszyn, wypychaniem instalacji na grupy (14.10 Z6, R9) i model **desired state** zasilany z bazy licencji (14.10 Z10, R3).
- **Panel samoobsługowy** dla informatyka (14.10 Z5) i **panel dystrybutorów** Artura Kwiatkowskiego (14.10 R18).
- **Minimalny odbiornik raportów** po stronie firmy. Bez niego punkt „raportuje zainstalowane wersje” z sekcji 4.1 nie ma adresata, a serwis zbiera wersje per jednostka już dziś (14.10 Z7).
- **Jednostki podległe JST** (9.10 A3, agenda pkt 5): temat nie został poruszony na 14.10 i nie ma go w wyciągu.
- **Kolejność wdrożeń i pilot** (agenda, decyzje pkt 4): nie ustalono. Z perspektywy 1.10 naturalnym pierwszym krokiem jest mObywatel/e-Opłaty, bo rozwiązuje blokadę 60 + 20 klientów (1.10 W9, R7).

---

## 5. Podsumowanie dopasowania

| Obszar | Dopasowanie | Uwagi |
|---|---|---|
| Mechanizm instalacji (agent, nginx, Kestrel, usługi) | Wysokie | Odpowiada na główną blokadę z 1.10 i decyzje z 9.10 i 14.10. |
| Zakres MVP względem decyzji 9.10 | Wysokie, z wyjątkiem STS | Luka 3.2. |
| Sekrety i luka XML | Wysokie dla 4 aplikacji | Exe Delphi bez zmian w MVP, luka XML zostaje dla 99% aplikacji do czasu przepięcia Menadżera. |
| Bramkowanie aktualizacji przez urząd | Brak | Luka 3.1, warunek konieczny serwisu. |
| Konfiguracja jako jedno źródło (baza CI) | Brak | Luka 3.4. |
| Poświadczenia Firebirda | Konflikt z realiami | Luka 3.3, do złagodzenia do opcji. |
| Internet i topologia wieloserwerowa | Założenie niewypowiedziane | Luka 3.5. |
| Warunki wstępne (podpisywanie, self-contained, base path) | Poza dokumentem | Luka 3.6. |
| Tożsamość bez AD, rozdzielenie tożsamości od uprawnień | Wysokie | Zgodne z 1.10 i 14.10, ale moment wdrożenia do decyzji (3.2). |
| Zasoby na słabym sprzęcie | Dobre | Pomiar na maszynie 4 GB z IIS równolegle jako kryterium wyjścia. |

**Rekomendacja na kolejną iterację:** dopisać bramkowanie aktualizacji (3.1) i źródło konfiguracji (3.4), rozstrzygnąć STS w MVP (3.2), złagodzić sekcję 6 do opcji (3.3), zapisać założenie o internecie i topologię (3.5), wymienić warunki wstępne z właścicielami (3.6), wpisać odpowiedzi z 14.10 w miejsce pytań z sekcji 9.
