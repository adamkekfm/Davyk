# 1. Użytkownicy systemu i ich potrzeby

Zakres koncepcji to panel lokalny, więc pełną analizę mają użytkownicy panelu. Pozostali użytkownicy platformy są wymienieni, bo ich potrzeby wpływają na to, co panel musi pokazać lub wysłać (np. powód odrzucenia trafia do serwisu).

## 1.1 Lista użytkowników

| # | Użytkownik | Korzysta z panelu | Rola wobec panelu | Źródło |
|---|---|---|---|---|
| U1 | **Informatyk urzędu, wariant „samodzielny”** | Tak, główny | Jedyna osoba z dostępem do serwera; robi wszystko sam i nie podaje haseł serwisowi; podejmuje decyzję o każdej instalacji (bramka 2) | O‑U3, T‑K5 |
| U2 | **Informatyk urzędu, wariant „wspierany”** (albo osoba pełniąca obowiązki: sekretarz, księgowa, pracownik firmy zewnętrznej) | Tak, główny | Nie zna się na administracji; serwis przygotowuje konfigurację, a on ją importuje i klika zgodę; często pracuje razem z serwisantem przez zdalny pulpit pod swoim nadzorem | O‑U3, O‑U1, K6 |
| U3 | **Serwisant InfoSystem przy serwerze** (pod nadzorem informatyka) | Tak, wtórny | Używa tego samego panelu do diagnostyki, konfiguracji i instalacji podczas wizyty lub sesji zdalnej udostępnionej przez informatyka; nie ma własnej tożsamości w MVP | O‑I1, 7.4 |
| U4 | **Serwisant InfoSystem w widoku serwisu** | Nie (poza zakresem) | Odbiorca skutków działań w panelu: odrzucenia z powodem, polityki auto, raporty stanu, wyniki wycofań | T‑Z5, K3 |
| U5 | **Operator (pracownik urzędu)** | Nie | Korzysta z aplikacji pod adresem, który panel pokazuje informatykowi; nie widzi panelu | T‑H5 |
| U6 | **Site Agent** | Aktor systemowy | Wykonuje operacje, odmawia działań bez zgody, raportuje, wycofuje przy niezdrowym stanie | A1, A6 |
| U7 | **Audytor / kierownictwo urzędu** | Pośrednio (po MVP) | Potrzebuje odpowiedzi „kto, kiedy i co zainstalował”; w MVP obsłużone lokalnym dziennikiem z nazwą konta Windows i możliwością eksportu | M5, F6 |

## 1.2 Potrzeby informatyka (U1, U2) i konsekwencje dla UI

| # | Potrzeba | Skąd wiemy | Konsekwencja dla panelu |
|---|---|---|---|
| N1 | **Ostatnie słowo należy do mnie.** Nic nie instaluje się samo; jednostronne aktualizacje „absolutnie nie wchodzą” | T‑Z1, A1 | Każda instalacja wymaga kliknięcia na ekranie decyzji; polityka auto jest wyłączona domyślnie, włączana per aplikacja, z jawnym opisem skutków |
| N2 | **Chcę wiedzieć, co się zmieni, zanim się zgodzę** | T‑Z3, P2 | Ekran decyzji pokazuje: wersję z → do, notatki wydania, wpływ (restart, migracja bazy, pilne), czas trwania, co zrobi agent krok po kroku, co się stanie przy błędzie (automatyczne wycofanie) |
| N3 | **Nie mogę zatrzymać pracy urzędu w godzinach pracy** | O‑U2, T‑Z11 | Podgląd aktywnych sesji na bazie przed instalacją; „Zaplanuj” na datę i godzinę; jedna aplikacja naraz; pozostałe działają |
| N4 | **Mam mało czasu i rzadko** (np. poniedziałek 8–10) | O‑U1 | Pulpit od razu pokazuje „co wymaga mojej decyzji”; decyzja w trzech kliknięciach; brak kreatorów wieloetapowych tam, gdzie nie są potrzebne |
| N5 | **Jeśli coś pójdzie źle, chcę wrócić do stanu sprzed** | T‑A15, A2 | Przycisk „Cofnij do poprzedniej wersji” na karcie aplikacji i w wyniku operacji; agent pokazuje, do której wersji wróci i że wycofanie bazy nie jest objęte |
| N6 | **Nie znam się na sieciach i nie chcę konfigurować nginx ręcznie** | O‑U4, I5 | Zero pól sieciowych poza portem nginx i FQDN serwera; agent wykrywa z OS; konfiguracja nginx niewidoczna i nieedytowalna; wyraźny „adres dla operatorów” do skopiowania |
| N7 | **Nie podam haseł serwisowi** (U1) | T‑K5, S2 | Pola haseł wpisuje informatyk; wartości nie są wyświetlane po zapisie; pakiet konfiguracji od serwisu może pozostawić pola haseł puste i wymagane |
| N8 | **Niech serwis przygotuje wszystko, ja tylko kliknę** (U2) | T‑K5, P4 | Import pakietu konfiguracji zaszyfrowanego jednorazowym kluczem; podgląd pól przed zapisem; pola „do uzupełnienia” podświetlone |
| N9 | **Klikam ptaszki, nie piszę SQL** | N1 (14.10), T‑K4 | Formularz konfiguracji generowany ze schematu aplikacji, z walidacją kompletności, listami wyboru i testem połączenia |
| N10 | **Chcę zrozumieć, co ta usługa robi na moim serwerze i jak ją wyłączyć** | O‑U5, N7 (agent) | Ekran „Pomoc: co robi agent” z listą uprawnień, ruchu wychodzącego (jeden FQDN), katalogów, i instrukcją zatrzymania lub odinstalowania bez utraty aplikacji |
| N11 | **Gdy coś nie działa, chcę sam zobaczyć, czemu** (zanim dzwonię do serwisu) | P5, M6 | Diagnostyka: wynik `health` każdej aplikacji po polsku, ostatnie logi, test połączenia z InfoSystem, miejsce na dysku, sesje na bazie |
| N12 | **Pracuję przez RDP na słabym serwerze** | O‑I8, O‑I5 | Lekki panel bez ciężkich bibliotek; układ działa w oknie 1024×768; brak animacji zużywających CPU; brak zależności od internetu w przeglądarce |
| N13 | **Nie chcę nowego hasła do kolejnego panelu** | P1 | Dostęp równa się sesji na serwerze; pasek górny pokazuje konto Windows, którym jestem, i że ono trafi do dziennika |
| N14 | **Chcę, żeby po odrzuceniu aktualizacji nikt mnie nie męczył, ale żeby serwis wiedział dlaczego** | K3, R5 | Odrzucenie z powodem (lista + pole tekstowe); odrzucona wersja znika z „do decyzji” i trafia do historii; można wrócić do niej ręcznie |

## 1.3 Potrzeby serwisanta przy serwerze (U3)

| # | Potrzeba | Konsekwencja dla panelu |
|---|---|---|
| S1 | Szybko sprawdzić stan bez szukania w logach | Diagnostyka jako osobny ekran; `health` z wersją aplikacji i schematu, baza osiągalna, zadania w tle; logi ostatnich N minut per aplikacja i agenta |
| S2 | Wgrać konfigurację bez przepisywania wartości | Import pakietu konfiguracji; kopiowanie wartości między aplikacjami tam, gdzie placówka ma jedną instancję Firebirda (**propozycja**: „użyj tych samych danych bazy co w …”) |
| S3 | Wiedzieć, czy migracja schematu jest potrzebna przed instalacją | Flaga „migracja bazy” z manifestu na ekranie decyzji z komunikatem „serwis wykonuje migrację ręcznie przed instalacją” (A8, MVP bez Migratora) |
| S4 | Zostawić ślad, kto co zrobił podczas wizyty | Dziennik z nazwą konta Windows; pole „notatka” przy operacji (**propozycja**) |

## 1.4 Potrzeby, które panel obsługuje pośrednio (U4, U7)

| # | Potrzeba | Jak panel to zasila |
|---|---|---|
| W1 | Serwis widzi, kto i dlaczego nie aktualizuje, bez wymuszania | Powód odrzucenia i stan „zaplanowano na …” są raportowane (`POST /v1/sites/{id}/state`) |
| W2 | Serwis widzi, które placówki włączyły auto‑instalację | Zmiana polityki w panelu jest zdarzeniem audytu i trafia do raportu |
| W3 | Audytor potrzebuje historii | Ekran „Operacje i historia” z filtrem i eksportem CSV (**propozycja**) |

## 1.5 Czego panel celowo nie robi

- Nie zarządza operatorami ani uprawnieniami w aplikacjach (poza MVP, STS).
- Nie konfiguruje ani nie aktualizuje Firebirda; nie zmienia hasła SYSDBA bez jawnego polecenia (S4).
- Nie pokazuje danych osobowych ani wartości sekretów; raporty zawierają tylko dane techniczne (M4).
- Nie wymaga internetu w przeglądarce informatyka; działa, gdy InfoSystem jest nieosiągalny (N6 agenta).
