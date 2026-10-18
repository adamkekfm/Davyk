# Kontrakt aplikacji wobec platformy (MVP): lista kontrolna dla zespołów

| | |
|---|---|
| **Data** | 19 października 2026 |
| **Status** | Szkic v0.1; wyciąg z dokumentu stanu projektu z 19.10.2026 (sekcje 7.4, 7.6, 7.7, 7.8, 7.11, 7.12, decyzje D-6 i D-8) |
| **Właściciel** | Adam Koper (architektura) |
| **Odbiorcy** | Zespoły aplikacji mObywatel/e-Opłaty, CRU, KSeF, eAuta; Józek Bedra (koordynacja wspólnego magazynu sekretów) |
| **Cel** | Jedna strona wymagań, które aplikacja musi spełnić, żeby Site Agent mógł ją zainstalować i aktualizować w placówce. Dokument jest samodzielny: nie trzeba czytać dokumentu stanu projektu |

Zdania oznaczone **propozycja** doprecyzowują kontrakt poza tym, co ustalono w dokumencie stanu; podlegają dyskusji. Nazwy komponentów w kodzie są po angielsku (Site Agent, provider, manifest), w panelu lokalnym i w rozmowach z serwisem po polsku.

## 1. Po co kontrakt i co się dzieje, gdy aplikacja go nie spełnia

W MVP każda z czterech aplikacji działa jako osobna usługa Windows na Kestrelu, za nginx, na istniejącym serwerze Windows klienta, bez IIS, bez VM, bez kontenerów. Jedynym komponentem, który instaluje, aktualizuje i wycofuje oprogramowanie, jest Site Agent. Agent nie zna logiki aplikacji; zna tylko kontrakt: manifest pakietu, sposób startu usługi, endpoint health, sposób przekazania konfiguracji i sekretów. Kontrakt jest wspólny dla czterech aplikacji i dla każdej następnej aplikacji webowej.

Konsekwencje niespełnienia kontraktu:

| Sytuacja | Co robi agent |
|---|---|
| Pakiet bez manifestu, z manifestem niezgodnym ze schematem lub bez poprawnego podpisu | Odrzuca pakiet przy pobraniu. Pakiet nie trafia do panelu lokalnego i informatyk urzędu go nie zobaczy |
| Manifest wymaga nowszej wersji agenta niż zainstalowana | Pakiet czeka; raport do serwisu |
| Usługa nie startuje lub `GET /health` nie odpowiada w limicie czasu po starcie | Rollback do poprzedniej wersji (przełączenie katalogu `current`, start, health), raport do serwisu z przyczyną i logami |
| Health zwraca stan niezdrowy (baza nieosiągalna, niezgodna wersja schematu, martwe zadania w tle) | Jak wyżej: rollback i raport |
| Usługa pada w trakcie pracy | Restart z backoff; stan widoczny w panelu lokalnym i w widoku serwisu |

Koszt dostosowania czterech aplikacji do kontraktu jest dziś nieoszacowany i jest największym ryzykiem harmonogramu MVP. Dlatego pierwszy tydzień to spike na każdej aplikacji (self-contained build, base path, start jako usługa), a kolejność prac to CRU (najbliżej kontraktu, wzorzec dla pozostałych) i mObywatel/e-Opłaty (pierwsza aplikacja pilotażu).

## 2. Lista kontrolna C1 do C13

Kolumna „Jak sprawdzić” opisuje test, który zespół wykonuje sam przed przekazaniem pakietu. Kolumna „Przykład w .NET” to podpowiedź, nie wymóg użycia konkretnego API.

| # | Wymaganie | Jak sprawdzić | Przykład w .NET |
|---|---|---|---|
| C1 | Build self-contained dla `win-x64` (single-file lub katalog), usługa Windows; brak zależności od zainstalowanego .NET, IIS, Node | Na czystej maszynie Windows bez .NET, IIS i Node: `sc create` i `sc start` uruchamiają usługę, health odpowiada | `dotnet publish -r win-x64 --self-contained`; `builder.Host.UseWindowsService()` z pakietu `Microsoft.Extensions.Hosting.WindowsServices` |
| C2 | Nasłuch na adresie i porcie podanym przez agenta (zmienna środowiskowa lub argument), tylko loopback, HTTP bez TLS | `netstat -ano` pokazuje tylko `127.0.0.1:<port>`; brak nasłuchu na `0.0.0.0` i brak własnego TLS | Kestrel czyta `ASPNETCORE_URLS=http://127.0.0.1:<port>`; alternatywnie `--urls` lub `builder.WebHost.UseUrls(...)` |
| C3 | Base path (prefiks ścieżki) w API i w SPA; linki, cookies i redirecty względem prefiksu | Aplikacja uruchomiona za nginx pod `/cru/` (albo `/skarbowy/`, `/ksef/`, `/eauta/`) działa w całości: logowanie, nawigacja SPA, pobieranie plików, cookies z poprawną ścieżką; żaden link nie prowadzi do `/api/...` bez prefiksu | `app.UsePathBase(prefix)` przed routingiem; `ForwardedHeadersOptions` dla `X-Forwarded-Proto` i `X-Forwarded-Host`; w Next.js `basePath` i `assetPrefix` w `next.config.js` |
| C4 | Endpoint `GET /health` bez uwierzytelnienia, dostępny tylko na loopback: baza osiągalna, wersja schematu zgodna z oczekiwaną, zadania w tle żyją; odpowiedź zawiera wersję aplikacji i schematu | `curl http://127.0.0.1:<port>/health` zwraca JSON jak w sekcji 4; po zatrzymaniu Firebirda status zmienia się na niezdrowy | `AddHealthChecks()` z własnymi `IHealthCheck` dla bazy, schematu i zadań; `MapHealthChecks("/health")` z własnym `ResponseWriter` |
| C5 | Konfiguracja przez wspólną bibliotekę: parametry nie-sekretne z bazy CI, sekrety z magazynu agenta; brak `appsettings.json` z wartościami per placówka; brak XML z hasłami | Pakiet nie zawiera żadnej wartości specyficznej dla placówki; przeszukanie pakietu i katalogu instalacji pod kątem haseł i connection stringów daje zero trafień | `builder.Configuration` z providerem bazy CI i providerem pliku sekretów z biblioteki platformy (sekcja 5); kod aplikacji używa `IOptions<T>` jak dotąd |
| C6 | Jawny wybór instancji Firebirda w konfiguracji: host, port, ścieżka bazy; brak założenia „localhost:3050” | Aplikacja działa z bazą na innym porcie niż 3050 i na innym hoście; brak wartości w konfiguracji daje czytelny błąd, nie domyślny port | `FbConnectionStringBuilder { DataSource, Port, Database, UserID, Password }` budowany z konfiguracji, nigdy z literałów |
| C7 | Zadania w tle w procesie usługi (Quartz lub hosted service), odporne na restart; brak zależności od sesji użytkownika | Zadania wykonują się, gdy nikt nie jest zalogowany na serwer (sesja RDP zamknięta); po restarcie usługi harmonogram wznawia się bez interwencji | `BackgroundService` lub Quartz z `AddQuartzHostedService()`; stan harmonogramu w bazie aplikacji, nie w pamięci |
| C8 | Logi strukturalne do pliku w katalogu wskazanym przez agenta, z rotacją, bez danych osobowych i sekretów; format zgodny z `docs/logging_guide.md`; gotowość do OpenTelemetry po MVP | Logi powstają w katalogu z parametru startowego, nie w katalogu aplikacji; próbka logu z dnia pracy nie zawiera PESEL, nazwisk, haseł ani connection stringów | Serilog `WriteTo.File(path, rollingInterval: Day)` ze ścieżką z konfiguracji platformy; destrukturyzacja bez pól wrażliwych |
| C9 | Wersja aplikacji (semver) w manifeście pakietu i zwracana przez health; manifest deklaruje prefiks, port (stały lub „dowolny”), czy wymaga restartu, czy niesie migrację schematu, minimalną wersję agenta | Wersja z manifestu, z health i z właściwości pliku exe są identyczne; manifest przechodzi walidację schematu (sekcja 3) | Wersja ustawiana w CI przez `-p:Version=`; odczyt `Assembly.GetEntryAssembly().GetName().Version` lub `AssemblyInformationalVersionAttribute` |
| C10 | `TimeProvider` z zegara serwera bazy w każdym miejscu, które zapisuje do bazy lub porównuje z nią daty | Przestawienie zegara Windows na serwerze nie zmienia dat zapisywanych do bazy; testy jednostkowe używają fałszywego `TimeProvider` | Implementacja `TimeProvider` licząca przesunięcie z `SELECT CURRENT_TIMESTAMP FROM RDB$DATABASE`; **propozycja:** reguła analizatora zakazująca `DateTime.Now` i `DateTime.UtcNow` w projekcie |
| C11 | Własna baza lub własny schemat (jak CruDb); tabele Delphi tylko czytane; zapisy tylko tam, gdzie są dziś | Lista tabel, do których aplikacja zapisuje, przekazana architekturze; żadna nowa tabela nie powstaje w schemacie Delphi | Migracje własnego schematu z tabelą historii (jak `ACRU_MIGRATIONS_HISTORY`); dostęp do tabel Delphi przez osobny kontekst tylko do odczytu |
| C12 | Uwierzytelnianie jak dziś, ale przez wspólną bibliotekę z abstrakcją, która później przyjmie tokeny STS bez zmian w kontrolerach | Kontrolery używają tylko `[Authorize]` i `ClaimsPrincipal`; żaden kontroler nie czyta tabel operatorów ani nie weryfikuje hasła sam | `AddAuthentication().AddScheme<...>` z bieżącą implementacją jako handlerem; przejście na `AddJwtBearer` ma być zmianą konfiguracji i jednej klasy |
| C13 | Start usługi poniżej 30 s na maszynie referencyjnej; ciężkie inicjalizacje leniwe lub w tle (dziś 3 minuty) | Pomiar od `sc start` do pierwszego zdrowego `GET /health` na maszynie referencyjnej 4 GB z Firebirdem i IIS | Rozgrzewanie cache w `BackgroundService`, `Lazy<T>` dla ciężkich zależności; **propozycja:** `PublishReadyToRun=true` w buildzie |

## 3. Manifest pakietu

Pakiet to archiwum zip z manifestem w katalogu głównym. Manifest jest podpisywany w GitLab CI kluczem wydań, a binaria podpisywane Authenticode; zespół aplikacji nie podpisuje nic ręcznie. Agent weryfikuje oba podpisy przed pokazaniem pakietu informatykowi. Zestaw pól wynika z dokumentu stanu (sekcje 7.6 i 8.4); **propozycja:** nazwy kluczy JSON poniżej.

```json
{
  "name": "cru",
  "version": "2.4.0",
  "provider": "KestrelService",
  "minAgentVersion": "1.0.0",
  "executable": "InfoSystem.Cru.exe",
  "pathPrefix": "/cru/",
  "port": "any",
  "requiresRestart": true,
  "schemaMigration": false,
  "urgent": false,
  "releaseDate": "2026-11-03",
  "channel": "pilot",
  "checksums": {
    "algorithm": "SHA-256",
    "files": {
      "InfoSystem.Cru.exe": "3f1a...c9",
      "wwwroot/index.html": "8b02...17"
    }
  }
}
```

Znaczenie pól:

| Pole | Znaczenie |
|---|---|
| `name` | Identyfikator aplikacji, stały między wersjami: `skarbowy` (mObywatel/e-Opłaty), `cru`, `ksef`, `eauta` |
| `version` | Semver; ta sama wartość, którą zwraca health (C9) |
| `provider` | Dla czterech aplikacji zawsze `KestrelService`; inne providery (`Nginx`, `StaticSpa`) dotyczą pakietu „platforma” |
| `minAgentVersion` | Najniższa wersja agenta, która potrafi zainstalować ten pakiet |
| `executable` | **Propozycja:** plik, który agent rejestruje jako usługę Windows |
| `pathPrefix` | Prefiks, pod którym nginx kieruje ruch do aplikacji; aplikacja musi go obsłużyć (C3) |
| `port` | `"any"` oznacza, że agent przydziela wolny port loopback i przekazuje go przy starcie (C2); liczba oznacza port stały |
| `requiresRestart`, `schemaMigration`, `urgent` | Flagi pokazywane informatykowi w panelu lokalnym przed zgodą na instalację; `schemaMigration` oznacza, że serwis wykonuje migrację ręcznie przed startem (w MVP agent nie uruchamia migracji) |
| `releaseDate`, `channel` | Metadane wydania (`dev`, `pilot`, `stable`); kanał nadaje pipeline, nie zespół |
| `checksums` | Sumy kontrolne wszystkich plików pakietu; agent sprawdza je po rozpakowaniu |

## 4. Endpoint `GET /health`

Wywoływany przez agenta po każdym starcie usługi (z limitem czasu) i okresowo do raportu stanu. Bez uwierzytelnienia; nginx nie wystawia go na zewnątrz, więc odpowiada tylko na loopback. Zawartość odpowiedzi wynika z C4 i C9; **propozycja:** nazwy pól i kody HTTP: `200` dla `healthy` i `degraded`, `503` dla `unhealthy`.

```json
{
  "status": "healthy",
  "appVersion": "2.4.0",
  "schema": {
    "current": 41,
    "expected": 41
  },
  "database": {
    "reachable": true,
    "instance": "srv-urzad:3050",
    "latencyMs": 4
  },
  "backgroundJobs": [
    { "name": "ksef-outbox", "alive": true, "lastRunUtc": "2026-11-03T06:00:12Z" },
    { "name": "cleanup", "alive": true, "lastRunUtc": "2026-11-03T02:00:00Z" }
  ],
  "startedUtc": "2026-11-03T05:58:40Z"
}
```

Zasady:

- `unhealthy` zawsze, gdy baza jest nieosiągalna, `schema.current` różni się od `schema.expected` lub któreś zadanie w tle nie żyje. Po starcie nowej wersji taki wynik oznacza rollback.
- `degraded` (**propozycja**) dla stanów, które nie uzasadniają rollbacku, ale serwis powinien je widzieć, na przykład rozgrzewanie cache w toku.
- Endpoint nie zwraca sekretów, connection stringów z hasłem ani danych osobowych; trafia do raportów agenta wysyłanych do InfoSystem.
- Odpowiedź ma być szybka: health nie wykonuje ciężkich zapytań, tylko sprawdzenie połączenia i odczyt wersji schematu.

## 5. Jak aplikacja odczytuje konfigurację i sekrety

Konfiguracja ma trzy warstwy. Aplikacja widzi je przez jedną wspólną bibliotekę platformy; nie czyta plików agenta ani rejestru sama.

| Warstwa | Co zawiera | Skąd aplikacja to dostaje |
|---|---|---|
| Instalacyjna | Adres nasłuchu, prefiks ścieżki, katalog logów, położenie pliku sekretów, położenie bazy CI | Parametry startowe usługi ustawiane przez agenta przy rejestracji usługi (zmienne środowiskowe usługi lub argumenty) |
| Nie-sekretna aplikacyjna | Instancje i ścieżki baz (host, port, plik), adresy usług zewnętrznych (FQDN), parametry aplikacji (dziś w bazie i edytowane SQL-em), identyfikatory jednostki | Baza CI (Firebird) w placówce: tabela konfiguracji per aplikacja z wersją schematu konfiguracji; informatyk lub serwis edytuje przez panel lokalny agenta |
| Sekrety | Hasła Firebird per aplikacja, secret jednostki dla MC, inne hasła techniczne | Magazyn sekretów agenta (DPAPI na koncie usługi agenta); mechanizm przekazania: decyzja D-8 poniżej |

**Propozycja** zestawu parametrów startowych, które agent ustawia dla usługi:

| Parametr | Przykład | Użycie |
|---|---|---|
| `ASPNETCORE_URLS` | `http://127.0.0.1:5101` | Adres nasłuchu Kestrela (C2) |
| `INFOSYSTEM_PATH_BASE` | `/cru/` | Prefiks dla `UsePathBase` (C3) |
| `INFOSYSTEM_LOG_DIR` | `C:\InfoSystem\logs\cru\` | Katalog logów (C8) |
| `INFOSYSTEM_SECRETS_FILE` | `C:\ProgramData\InfoSystem\secrets\cru.bin` | Plik sekretów per aplikacja (D-8, wariant b) |
| `INFOSYSTEM_CI_DATABASE` | `srv-urzad/3050:C:\Firebird\ci.fdb` | Położenie bazy CI; hasło do niej jest w pliku sekretów |

Biblioteka platformy (**propozycja** nazwy wywołania: `builder.AddInfoSystemPlatform()`) rejestruje: provider konfiguracji z bazy CI, provider sekretów, logowanie do pliku z rotacją, `TimeProvider` z zegara bazy, abstrakcję uwierzytelniania (C12). Aplikacja dostaje `IConfiguration` i `IOptions<T>` jak dotąd, więc kod domenowy nie wie, skąd pochodzi wartość. Schemat własnej konfiguracji w bazie CI aplikacja wersjonuje i migruje sama (migracja w pakiecie), bo tylko ona wie, jakich parametrów potrzebuje; formularz w panelu lokalnym powstaje z tego schematu.

Czego nie wolno: `appsettings.json` z wartościami per placówka w pakiecie, pliki XML z hasłami, sekrety w logach, sekrety w rejestrze w jawnej postaci. Uczciwie o zakresie ochrony: lokalny administrator serwera może odczytać sekrety z pamięci procesu lub przez DPAPI na tym samym koncie. Celem MVP jest brak haseł w plikach kopiowanych na PC operatorów, brak haseł w logach i backupach konfiguracji oraz jedno miejsce rotacji; ochrona przed lokalnym administratorem celem nie jest.

Dwie decyzje otwarte, które dotykają kontraktu:

| Decyzja | Opcje | Rekomendacja | Co to znaczy dla zespołu |
|---|---|---|---|
| **D-8: przekazanie sekretów aplikacji** | (a) zmienne środowiskowe usługi; (b) plik per aplikacja zaszyfrowany DPAPI w zakresie maszyny, z ACL dla konta usługi aplikacji; (c) lokalny endpoint agenta z tokenem startowym | **(b)**: nic w rejestrze w jawnej postaci, brak zależności runtime od agenta, rotacja przez nadpisanie pliku i restart usługi; (c) wraca, gdy potrzebna będzie rotacja bez restartu | Aplikacja czyta plik przez bibliotekę (`ProtectedData.Unprotect` w zakresie maszyny) raz przy starcie; nie zapisuje do niego; nie loguje zawartości. Właściciele decyzji: Adam, Józek |
| **D-6: kto serwuje pliki SPA** | (a) Kestrel każdej aplikacji (pakiet samowystarczalny); (b) nginx z dysku | **(a)** w MVP: prostszy rollback, jeden pakiet na wersję; (b) jako optymalizacja później | SPA (statyczny eksport Next.js) leży w `wwwroot` pakietu; `UseStaticFiles` i fallback do `index.html` pod prefiksem (C3). Właściciele: Adam, frontend |

Dla Józka: magazyn sekretów jest własnością Site Agenta, nie aplikacji; w MVP zawiera sekret agenta, klucz prywatny TLS nginx, hasła Firebird per aplikacja oraz identyfikator i secret jednostki dla MC (dziś w bazie; do decyzji z Pawłem). Chcemy jednego magazynu i jednego kontraktu w placówce. Jeśli po stronie Józka istnieje już magazyn lub kontrakt przekazywania sekretów, kontrakt C5 i decyzja D-8 powinny się do niego dopasować, zanim zespoły zaczną implementację.

## 6. Pytania do zespołów

Odpowiedzi są wejściem do spike'ów z pierwszego tygodnia i do decyzji D-6 i D-8. Prosimy o odpowiedź na kanale „Fundamenty” lub w komentarzu do tego dokumentu.

Pytania do każdego zespołu:

1. Czy aplikacja daje się dziś zbudować jako self-contained dla `win-x64` i uruchomić jako usługa Windows na Kestrelu, bez IIS? Co blokuje (biblioteki natywne, zależności od IIS, Node w runtime)?
2. Czy API i SPA obsługują base path? Gdzie są linki absolutne, cookies bez ścieżki, redirecty do `/`?
3. Do których tabel Delphi aplikacja zapisuje dziś, a które tylko czyta?
4. Ile trwa dziś start aplikacji od uruchomienia do pierwszej obsłużonej odpowiedzi i co zabiera ten czas?
5. Jakie zadania w tle (Quartz, kolejki, harmonogramy) działają i czy ich stan przeżyje restart procesu?
6. Skąd aplikacja czyta dziś konfigurację i hasła (XML, `appsettings.json`, baza, rejestr) i które z tych wartości różnią się między placówkami?
7. Jak wygląda dziś logowanie użytkownika (własna tabela operatorów, baza CI, inne) i czy da się je zamknąć w jednym handlerze uwierzytelniania?
8. Jakiej wersji i dialektu Firebirda wymaga aplikacja (minimum w MVP: FB3, dialekt 3)?
9. Ile RAM zużywa dziś proces aplikacji w spoczynku i pod obciążeniem? Budżet w MVP to 100 do 200 MB na aplikację na maszynie 4 GB, równolegle z IIS w okresie przejściowym.

Pytania szczegółowe:

| Zespół | Pytanie |
|---|---|
| mObywatel/e-Opłaty | Czy ePłatności zapisują do tabel Delphi (księgowanie wpłat) i jaka jest konsekwencja dla C11? Czy wysyłkę do MC da się wyłączyć flagą w konfiguracji na czas współistnienia z IIS, żeby nie dublować wysyłek? Czy whitelist IP i certyfikat po stronie MC przeżyją zmianę hostingu z IIS na Kestrel na tej samej maszynie? |
| CRU | CRU jest najbliżej kontraktu (CruDb, `ACRU_MIGRATIONS_HISTORY`, kolejki w procesie); które elementy C1 do C13 już są spełnione i mogą być wzorcem dla pozostałych zespołów? Jakie problemy z portami i startem usługi zgłasza Czarek? |
| KSeF | Czy KSeF wymaga interakcji użytkownika (token, certyfikat, logowanie do KSeF) w sposób, który uniemożliwia pracę jako usługa bez sesji użytkownika (C7)? Jak kolejka wysyłki zachowuje się po restarcie usługi? |
| eAuta | Czy aplikacja daje się skompilować self-contained na Kestrelu i czy ma base path? Co z dotychczasowym sposobem hostowania? |
| Józek Bedra | Czy istnieje już magazyn sekretów lub kontrakt przekazywania sekretów, do którego platforma powinna się dopasować? Który wariant D-8 pasuje do tego, co jest? |

Terminy i właścicieli spike'ów ustala następna iteracja „Fundamentów”.
