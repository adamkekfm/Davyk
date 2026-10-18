# Agenda: instalacja aplikacji webowych u klientow (Tier S)

Termin: tydzien 13-17 pazdziernika 2026 (do ustalenia przez Marcina)
Czas: 60 minut
Prowadzi: Marcin Grzybowski (czas, decyzje). Prezentuje: Adam Koper (rysunek Tier S).
Uczestnicy: Adam Koper, Marcin Grzybowski, Boleslaw Groszek, Rafal Wilgos, Pawel Wisniewski, opcjonalnie Jozek Bedra.

## Cel spotkania

Ustalic, jak serwis ma instalowac i aktualizowac cztery aplikacje webowe (CRU, KSeF, eAuta, mObywatel/e-Oplaty(Skarbowy)) u klientow: ktore komponenty budujemy w pierwszej kolejnosci i jakie decyzje techniczne sa potrzebne, zeby zaczac.

## Poza zakresem

Migrator schematu bazy, telemetria, centralna platforma (Tier M), kontenery Docker, aplikacje dla obywateli. Jesli temat wyplynie, trafia na liste "pozniej".

## Przed spotkaniem

- Adam: rysunek Tier S w wersji do pokazania (jeden slajd lub strona), bez elementow Tier M.
- Marcin: lista przypadkow JST (jednostki podlegle) zebrana od serwisu.
- Wszyscy: podsumowanie spotkania z 9.10 (`2026-10-09_PreArchitecture_summary.md`).

## Agenda

1. Cel, zakres i zasady (Marcin) - 5 min
2. Jak serwis instaluje aplikacje webowe dzisiaj (Wilgos, Wisniewski) - 10 min
   - kroki instalacji, co zajmuje najwiecej czasu, co sie psuje
   - ograniczenia infrastruktury w gminach (serwer, uprawnienia, siec)
3. Rysunek Tier S (Adam) - 20 min
   - side agent: pobieranie artefaktow, raportowanie wersji, samoaktualizacja
   - side host / updater: instalacja i aktualizacja API, SPA i STS jako Windows Service
   - nginx jako reverse proxy, Kestrel za nim
   - usluga sekretow: connection stringi i hasla poza plikami XML
   - propozycja Marcina: uwierzytelnianie exe przez nowy STS (biblioteka Menadzer)
   - pytania serwisu
4. Decyzje (Marcin) - 10 min
5. Jednostki podlegle JST (Wilgos, Wisniewski, Bedra) - 7 min
   - zebranie przypadkow i potrzeb, bez decyzji
6. Podsumowanie: dzialania, wlasciciele, terminy (Marcin) - 8 min

## Decyzje do podjecia (punkt 4)

- Kolejnosc wdrozen: ktora z czterech aplikacji idzie pierwsza i na ktorej gminie (pilot).
- Hosting: nginx + Kestrel + Windows Service; potwierdzenie braku IIS.
- Konto uslugi: jakie uprawnienia na serwerze gminy sa akceptowalne dla serwisu.
- Sekrety: sposob uwierzytelniania aplikacji do uslugi sekretow (certyfikat czy inny).
- Minimalne wymagania serwera gminy dla Tier S.
- Czy exe maja przejsc na nowy STS w pierwszej iteracji, czy pozniej.

## Oczekiwane wyniki

- Zatwierdzony zakres MVP Tier S i kolejnosc budowy komponentow.
- Lista decyzji z wlascicielami.
- Lista pytan otwartych i tematow "pozniej" (w tym JST).
- Termin kolejnego spotkania lub przegladu.
