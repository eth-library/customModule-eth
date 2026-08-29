#!/usr/bin/env node
/**
 * Prüft, ob sich im Vorlage-Repo von Ex Libris (ExLibrisGroup/customModule) seit dem
 * zuletzt geprüften Commit etwas geändert hat.
 *
 * Das Skript ändert NICHTS am Code. Es meldet nur, was upstream passiert ist, und markiert
 * jene Dateien, die es auch in diesem Repo gibt — das sind die, die uns betreffen können.
 *
 *   node scripts/upstream-check.mjs            Bericht ausgeben
 *   node scripts/upstream-check.mjs --json     dasselbe als JSON
 *   node scripts/upstream-check.mjs --init     Marker auf den aktuellen Upstream-Stand setzen
 *   node scripts/upstream-check.mjs --set SHA  Marker auf einen bestimmten Commit setzen
 *
 * Exit-Codes: 0 = nichts Neues · 10 = Änderungen gefunden · 1 = Fehler
 *
 * Dokumentation: docs/upstream-abgleich.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'ExLibrisGroup/customModule';
const BRANCH = 'main';
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKER = path.join(WURZEL, '.upstream-sync.json');

const args = process.argv.slice(2);
const hatFlag = (name) => args.includes(name);
const flagWert = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const api = async (pfad) => {
  const headers = { 'User-Agent': 'customModule-eth-upstream-check', Accept: 'application/vnd.github+json' };
  // In GitHub Actions steht GITHUB_TOKEN bereit und hebt das Limit von 60 auf 1000 Anfragen/Stunde.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(`https://api.github.com${pfad}`, { headers });
  if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
    throw new Error('GitHub-API-Limit erreicht. Später erneut versuchen oder GITHUB_TOKEN setzen.');
  }
  if (!res.ok) throw new Error(`GitHub-API ${res.status} für ${pfad}: ${await res.text()}`);
  return res.json();
};

const markerLesen = () => {
  if (!fs.existsSync(MARKER)) return { lastReviewedSha: null, reviewedOn: null, note: null };
  return JSON.parse(fs.readFileSync(MARKER, 'utf8'));
};

const markerSchreiben = (sha, note) => {
  const inhalt = {
    _hinweis: 'Zuletzt geprüfter Commit in ExLibrisGroup/customModule. Siehe docs/upstream-abgleich.md',
    lastReviewedSha: sha,
    reviewedOn: new Date().toISOString().slice(0, 10),
    note: note ?? null
  };
  fs.writeFileSync(MARKER, JSON.stringify(inhalt, null, 2) + '\n');
  return inhalt;
};

/** Existiert der upstream geänderte Pfad auch bei uns? Dann kann er uns betreffen. */
const gibtEsBeiUns = (relPfad) => fs.existsSync(path.join(WURZEL, relPfad));

const main = async () => {
  if (hatFlag('--init') || hatFlag('--set')) {
    const sha = hatFlag('--set') ? flagWert('--set') : (await api(`/repos/${REPO}/commits/${BRANCH}`)).sha;
    if (!sha) throw new Error('--set benötigt einen Commit-SHA als Argument.');
    const m = markerSchreiben(sha, flagWert('--note'));
    console.log(`Marker gesetzt auf ${m.lastReviewedSha} (${m.reviewedOn}).`);
    console.log('Bitte .upstream-sync.json committen, damit der Stand im Team geteilt ist.');
    return 0;
  }

  const marker = markerLesen();

  if (!marker.lastReviewedSha) {
    const letzte = await api(`/repos/${REPO}/commits?sha=${BRANCH}&per_page=15`);
    console.log('Noch kein Referenzstand gesetzt.\n');
    console.log('Wähle den letzten Upstream-Commit, der nachweislich in dieses Repo eingeflossen ist,');
    console.log('und setze ihn mit:  node scripts/upstream-check.mjs --set <SHA>\n');
    console.log('Die letzten Commits upstream:\n');
    for (const c of letzte) {
      console.log(`  ${c.sha.slice(0, 8)}  ${c.commit.author.date.slice(0, 10)}  ${c.commit.message.split('\n')[0]}`);
    }
    console.log('\nIm Zweifel den ältesten davon nehmen — lieber einmal zu viel prüfen als eine Änderung verpassen.');
    return 1;
  }

  const vergleich = await api(`/repos/${REPO}/compare/${marker.lastReviewedSha}...${BRANCH}`);
  const commits = vergleich.commits ?? [];
  const dateien = (vergleich.files ?? []).map(f => ({
    pfad: f.filename,
    status: f.status,
    plus: f.additions,
    minus: f.deletions,
    auchBeiUns: gibtEsBeiUns(f.filename)
  }));
  const betroffen = dateien.filter(d => d.auchBeiUns);

  const ergebnis = {
    repo: REPO,
    seit: marker.lastReviewedSha,
    zuletztGeprueft: marker.reviewedOn,
    neueCommits: commits.length,
    geaenderteDateien: dateien.length,
    davonAuchBeiUns: betroffen.length,
    vergleichUrl: vergleich.html_url,
    commits: commits.map(c => ({
      sha: c.sha.slice(0, 8),
      datum: c.commit.author.date.slice(0, 10),
      titel: c.commit.message.split('\n')[0]
    })),
    dateien
  };

  if (hatFlag('--json')) {
    console.log(JSON.stringify(ergebnis, null, 2));
    return commits.length > 0 ? 10 : 0;
  }

  if (commits.length === 0) {
    console.log(`Nichts Neues. ${REPO} ist unverändert seit ${marker.lastReviewedSha.slice(0, 8)}`
      + `${marker.reviewedOn ? ` (geprüft am ${marker.reviewedOn})` : ''}.`);
    return 0;
  }

  console.log(`${commits.length} neue Commit(s) in ${REPO} seit ${marker.lastReviewedSha.slice(0, 8)}`
    + `${marker.reviewedOn ? ` (zuletzt geprüft am ${marker.reviewedOn})` : ''}\n`);

  for (const c of ergebnis.commits) {
    console.log(`  ${c.sha}  ${c.datum}  ${c.titel}`);
  }

  if (betroffen.length > 0) {
    console.log(`\nGeänderte Dateien, die es auch bei uns gibt — diese zuerst ansehen (${betroffen.length}):\n`);
    for (const d of betroffen) {
      console.log(`  [${d.status.padEnd(8)}] +${d.plus}/-${d.minus}  ${d.pfad}`);
    }
  } else {
    console.log('\nKeine der geänderten Dateien existiert bei uns unter demselben Pfad.');
    console.log('Das heisst nicht automatisch "irrelevant" — Umbenennungen und neue Dateien trotzdem prüfen.');
  }

  const uebrige = dateien.filter(d => !d.auchBeiUns);
  if (uebrige.length > 0) {
    console.log(`\nÜbrige geänderte Dateien upstream (${uebrige.length}):\n`);
    for (const d of uebrige) {
      console.log(`  [${d.status.padEnd(8)}] +${d.plus}/-${d.minus}  ${d.pfad}`);
    }
  }

  console.log(`\nVollständiger Vergleich: ${vergleich.html_url}`);
  console.log('\nNach der Durchsicht den Stand fortschreiben:');
  console.log(`  node scripts/upstream-check.mjs --set ${commits[commits.length - 1].sha.slice(0, 8)} --note "kurze Notiz"`);
  return 10;
};

main()
  .then(code => process.exit(code))
  .catch(err => {
    console.error('Fehler:', err.message);
    process.exit(1);
  });
