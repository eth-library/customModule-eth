# Upstream-Abgleich mit ExLibrisGroup/customModule

Kurzreferenz. Die vollständige Anleitung mit Erklärung jedes Befehls, dem Vorgehen bei
zusammenzuführenden Dateien und dem Weg zurück nach `main` steht in Confluence:

**<https://unlimited.ethz.ch/spaces/SLSP/pages/514559036/Upstream-Abgleich+mit+ExLibrisGroup+customModule>**

## Ausgangslage in zwei Sätzen

Dieses Repo basiert auf `ExLibrisGroup/customModule`, ist aber **kein GitHub-Fork** — die Historien
sind unverwandt. Der Abgleich ist deshalb ein Lese- und Übertragungsvorgang, kein Merge.

Von den rund 41 Dateien, die es in beiden Repos gibt, sind etwa 21 bei uns angepasst. Diese dürfen
**nicht** durch die Upstream-Fassung ersetzt werden, sonst gehen unsere Änderungen verloren — ohne
jede Warnung.

## Dateien

| Datei | Zweck |
|---|---|
| `scripts/upstream-check.mjs` | Prüfskript, Aufruf über `npm run upstream:check` |
| `.upstream-sync.json` | Referenzstand: zuletzt geprüfter Upstream-Commit, Datum, Notiz |
| `.github/workflows/upstream-check.yml` | CI-Lauf, bewusst nur manuell auslösbar |

## Einmalige Einrichtung je Arbeitsplatz

```
git remote add upstream https://github.com/ExLibrisGroup/customModule.git
git remote set-url --push upstream DISABLED_no_push_to_upstream
```

## Befehle

```
git fetch upstream                                  # Stand von Ex Libris holen
npm run upstream:check                              # Was hat sich seit dem Referenzstand geändert
git diff HEAD upstream/main -- <pfad>               # Unterschied zu deren Fassung ansehen
git restore --source=upstream/main -- <pfad>        # Deren Fassung holen (nur unangepasste Dateien!)
git restore --source=HEAD -- <pfad>                 # Rückgängig machen
node scripts/upstream-check.mjs --set <SHA> --note "..."   # Referenzstand fortschreiben
```

Angepasste Dateien werden per Drei-Wege-Merge zusammengeführt (`git merge-file`), nicht ersetzt.
Das Vorgehen dazu steht in Confluence.

## Referenzstand

`.upstream-sync.json` hält fest, bis zu welchem Upstream-Commit jemand hingeschaut hat. Alles, was
das Prüfskript meldet, ist «alles seit diesem Commit».

«Geprüft» heisst **angesehen und entschieden**, nicht «übernommen». Bewusste Nicht-Übernahmen
gehören in die `note`. Das Skript schreibt die Datei nie von selbst — nur auf `--set` oder `--init`.

Die Datei wird committet, damit der Stand im Team gilt.

## Verbote

- Kein `git merge upstream/main` und kein `git pull upstream`.
- Kein Ersetzen einer angepassten Datei.
- Kein Fortschreiben des Referenzstands ohne Durchsicht.

## Hinweise

- Unter PowerShell reicht `npm run upstream:check -- --set ...` die Optionen nicht durch. Für alles
  mit Optionen das Skript direkt mit `node` aufrufen.
- Die beiden `git show ... > datei`-Befehle des Drei-Wege-Merges gehören in Git Bash, nicht in
  PowerShell.
- `prebuild.js` verändert beim Bauen selbst versionierte Dateien. Nach `npm run build` also
  `git status` prüfen, bevor committet wird.
