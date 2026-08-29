# Upstream-Abgleich mit ExLibrisGroup/customModule

## Worum es geht

Dieses Repo basiert auf dem Vorlage-Repo `ExLibrisGroup/customModule` von Ex Libris. Dort ändern
sich von Zeit zu Zeit Build-Kette, Proxy-Setup, Abhängigkeiten und die Grundstruktur des
Customization Package. Diese Änderungen fliessen **nicht automatisch** zu uns.

Wichtig zu wissen: Wir sind **kein GitHub-Fork** von `ExLibrisGroup/customModule`, sondern ein
eigenständiges Repo mit unverwandter Historie. Deshalb gibt es weder den «Sync fork»-Knopf noch
einen sinnvollen `git merge upstream/main` — ein solcher Merge würde die gesamte fremde Historie
hereinziehen und praktisch nur Konflikte produzieren.

Der Abgleich ist folglich ein **Lese- und Übertragungsvorgang**, kein Merge: Wir schauen an, was
upstream passiert ist, entscheiden pro Änderung, ob sie uns betrifft, und übertragen sie von Hand.

## Was automatisiert ist und was nicht

**Automatisiert ist das Erkennen.** Das Skript `scripts/upstream-check.mjs` sagt, was sich seit dem
letzten geprüften Stand geändert hat, und markiert die Dateien, die es auch bei uns gibt.

**Nicht automatisiert ist das Übernehmen.** Ob eine Upstream-Änderung für uns passt, ob sie mit
unseren Anpassungen kollidiert und wie sie einzubauen ist, lässt sich nicht mechanisch entscheiden.

Das ist Absicht. Der Teil, der beim Personalwechsel tatsächlich verloren geht, ist nicht das
Auflösen von Konflikten — es ist das **Daran-Denken**. Genau den deckt die Automatisierung ab.

## Der Referenzstand

In `.upstream-sync.json` steht der zuletzt geprüfte Upstream-Commit:

```json
{
  "lastReviewedSha": "e5133f5f...",
  "reviewedOn": "2026-08-29",
  "note": "kurze Notiz, was geprüft und was übernommen wurde"
}
```

Die Datei gehört ins Repo und wird committet — sonst kennt nur eine Person den Stand, und genau das
wollen wir vermeiden.

«Geprüft» heisst: angesehen und entschieden. Es heisst **nicht** «übernommen». Wenn eine Änderung
bewusst nicht übernommen wurde, gehört das in die `note` — sonst prüft die nächste Person dieselbe
Sache noch einmal und kommt womöglich zu einem anderen Schluss, ohne zu wissen, dass die Frage
schon beantwortet war.

## Ablauf

### 1. Prüfen

```
npm run upstream:check
```

Ausgabe: neue Commits, geänderte Dateien und — hervorgehoben — jene Dateien, die es auch bei uns
unter demselben Pfad gibt. Diese zuerst ansehen. Exit-Code 0 heisst «nichts Neues», 10 heisst
«Änderungen gefunden».

### 2. Durchsehen

Den ausgegebenen Compare-Link auf GitHub öffnen und die markierten Dateien anschauen. Leitfragen:

- Betrifft die Änderung eine Datei, die wir angepasst haben? Dann nicht einfach übernehmen, sondern
  den Zweck der Upstream-Änderung verstehen und in unsere Fassung übersetzen.
- Ist eine Datei upstream **entfernt** worden, die es bei uns noch gibt? Das ist der unangenehmste
  Fall: Bei uns läuft dann Code weiter, den Ex Libris nicht mehr vorsieht.
- Betrifft es die Build-Kette (`prebuild.js`, `webpack.config.js`, `package.json`)? Dann nach der
  Übernahme zwingend einen vollständigen Build und einen Lauf gegen die Sandbox testen.
- Sind Abhängigkeiten angehoben worden, insbesondere die Angular-Version? Siehe `CLAUDE.md`,
  Abschnitt zur Angular-Version — das ist mit SLSP abzustimmen und nicht im Alleingang zu machen.

### 3. Übernehmen

Von Hand, in einem eigenen Branch, mit einem Commit pro logischer Änderung. Im Commit den
Upstream-SHA nennen, damit später nachvollziehbar ist, woher etwas kam:

```
git checkout -b upstream/2026-08
# ... Änderungen einbauen ...
git commit -m "Proxy-Asset-Manifest von upstream uebernommen (ExLibris d6e6598a)"
```

### 4. Stand fortschreiben

```
node scripts/upstream-check.mjs --set <SHA> --note "was geprüft, was übernommen, was bewusst nicht"
```

Den SHA nennt das Skript am Ende seiner Ausgabe. Die geänderte `.upstream-sync.json` mitcommitten.

> **Hinweis zu Windows/PowerShell:** `npm run upstream:check -- --set ...` reicht die Flags nicht
> zuverlässig durch. Für alles mit Flags das Skript direkt über `node` aufrufen. Ohne Flags
> funktioniert `npm run upstream:check` einwandfrei.

## Weitere Aufrufe

| Befehl | Zweck |
|---|---|
| `npm run upstream:check` | Bericht ausgeben |
| `node scripts/upstream-check.mjs --json` | dasselbe maschinenlesbar |
| `node scripts/upstream-check.mjs --init` | Marker auf den aktuellen Upstream-Stand setzen |
| `node scripts/upstream-check.mjs --set <SHA> [--note "..."]` | Marker auf einen bestimmten Commit setzen |

Das Skript hat keine Abhängigkeiten und liest ausschliesslich die öffentliche GitHub-API. Ohne
Token gilt ein Limit von 60 Anfragen pro Stunde und IP, was für den gelegentlichen Gebrauch reicht.
Ist `GITHUB_TOKEN` gesetzt, wird es verwendet und das Limit steigt.

## Wie oft

Es gibt keinen festen Rhythmus von Ex Libris. Sinnvolle Anlässe:

- **Monatlich** als Routine.
- **Vor jedem Feature Release** von Primo (Februar, Mai, August, November) — dann ist die
  Wahrscheinlichkeit am höchsten, dass upstream etwas Relevantes passiert ist.
- **Vor einem Framework-Upgrade**, insbesondere vor dem Angular-Wechsel im November 2026. Ex Libris
  zieht die Angular-Version im Vorlage-Repo vermutlich zuerst nach; dort steht dann, was das für
  Custom Modules bedeutet.

## Automatischer Lauf über GitHub Actions

Unter `.github/workflows/upstream-check.yml` liegt ein Workflow, der den Bericht in GitHub Actions
ausführt. Er ist **bewusst nicht scharf geschaltet**: Er läuft ausschliesslich manuell über
«Run workflow» im Actions-Tab. Der Zeitplan ist im Workflow auskommentiert und kann durch Entfernen
der Kommentarzeichen aktiviert werden.

Grund für die Zurückhaltung: Solange der Abgleich noch von Hand und in bewährter Weise läuft, soll
keine Automatik parallel Meldungen erzeugen. Sobald die Zuständigkeit übergeht, kann der Zeitplan
aktiviert werden.

## Stand und offene Punkte

Der Referenzstand in `.upstream-sync.json` ist derzeit **vorläufig** auf `e5133f5f` (13.05.2026)
gesetzt und muss noch bestätigt werden. Wer den Abgleich bisher gemacht hat, weiss, welcher
Upstream-Commit tatsächlich zuletzt eingeflossen ist — diesen eintragen und die Notiz anpassen.

**Beim Setzen dieses Startpunkts ist bereits aufgefallen:** Upstream hat zwischen dem 09. und
18.08.2026 das Proxy-Setup umgebaut. Betroffen sind `proxy/proxy-utils.mjs` (+375 Zeilen),
`proxy/proxy.conf.mjs` und `proxy/proxy.const.mjs`; ausserdem wurde `proxy/customization_config_override.mjs`
upstream **entfernt**, existiert bei uns aber noch. Das ist der erste Fall, der eine Durchsicht
verdient.
