# Galerie foto — Mihai & Ioana 💐

Site simplu și elegant pentru albumul foto/video de la nuntă, gata de urcat pe GitHub Pages.

## Structură

```
├── index.html                    — pagina site-ului
├── css/style.css                 — tot stilul vizual
├── js/app.js                     — toată logica (galerie, lightbox, animație intro)
├── data/manifest.json            — lista generată automat cu albumele și fișierele
├── photos/                       — AICI pui folderele cu poze
├── scripts/generate_manifest.py  — scriptul care actualizează manifest.json
└── .github/workflows/            — (opțional) actualizare automată la fiecare push
```

## Cum adaugi poze

1. În folderul `photos/`, creează câte un folder pentru fiecare parte a evenimentului, numerotate la început:

   ```
   photos/1. Cununie/
   photos/2. Petrecere/
   photos/3. Dans/
   ```

   Numărul de la început hotărăște ordinea albumelor pe site. Restul numelui poate fi orice.

2. Pune pozele/video-urile în interior, denumite `DSC_0001.jpg`, `DSC_0002.jpg` etc. (merge orice nume care conține un număr — `IMG_`, `MOV_`, etc.). Vor apărea automat în ordine crescătoare.

   Formate acceptate: `jpg jpeg png webp gif heic` pentru poze, `mp4 mov webm avi m4v` pentru video.

3. Din rădăcina proiectului, rulează (ai nevoie de Python 3 — vine preinstalat pe Mac/Linux; pe Windows descarcă de pe python.org):

   ```
   python3 scripts/generate_manifest.py
   ```

   Scriptul citește tot ce e în `photos/` și rescrie `data/manifest.json`. Rulează-l de fiecare dată când adaugi, ștergi sau redenumești fișiere.

4. Adaugă, comite și trimite modificările pe GitHub:

   ```
   git add .
   git commit -m "Adaug poze"
   git push
   ```

> 💡 Dacă vrei ca `manifest.json` să se actualizeze singur la fiecare push (fără să mai rulezi scriptul manual), vezi secțiunea **Actualizare automată** mai jos.

## Testare locală (înainte de a urca pe GitHub)

Fiindcă site-ul încarcă `manifest.json` printr-o cerere de rețea, deschiderea directă a `index.html` (dublu-click) nu va funcționa din cauza restricțiilor browserului pentru fișiere locale. Rulează un mic server local:

```
python3 -m http.server 8000
```

apoi deschide `http://localhost:8000` în browser.

## Publicare pe GitHub Pages

1. Creează un repository nou pe GitHub (public — Pages gratuit necesită repo public, exceptând conturile GitHub Pro/Team/Enterprise).
2. Urcă tot conținutul acestui folder în repo (`git init`, `git add .`, `git commit`, `git remote add origin ...`, `git push`).
3. În repo, mergi la **Settings → Pages**.
4. La **Source**, alege **Deploy from a branch**, branch **main**, folder **/ (root)**, apoi **Save**.
5. După 1-2 minute, site-ul va fi live la `https://numele-tau.github.io/numele-repo-ului/`.

## Poze/videoclipuri mari — atenție

GitHub refuză fișierele de peste 100MB și avertizează peste 50MB. Pentru clipuri video mari:
- comprimă-le înainte de a le urca (ex. HandBrake), sau
- folosește [Git LFS](https://git-lfs.com) pentru fișierele mari.

Un repo cu multe poze de rezoluție mare poate deveni greu de clonat/încărcat — dacă ai sute de poze de la un fotograf profesionist, ia în calcul să exporți variante comprimate (ex. 2000px pe latura lungă) special pentru site.

## Ce poți modifica ușor

Toate textele (numele voastre, mesajul de bun venit, durata animației de intro, intervalul prezentării) sunt într-un singur loc, la începutul fișierului `js/app.js`, în obiectul `CONFIG` — și direct în textul din `index.html` (caută "Mihai" și "Bine ați venit").

Culorile (roz, verde, crem, auriu) sunt definite ca variabile la începutul fișierului `css/style.css`, în secțiunea `:root` — schimbă valorile de acolo pentru o altă paletă.

## Actualizare automată (opțional, avansat)

Fișierul `.github/workflows/update-manifest.yml` rulează automat scriptul de mai sus de fiecare dată când urci poze noi în `photos/`, și comite singur `manifest.json` actualizat. Pentru ca acesta să poată face commit înapoi în repo, trebuie activat o singură dată:

**Settings → Actions → General → Workflow permissions → "Read and write permissions" → Save.**

Dacă nu vrei să te complici cu asta, ignoră fișierul — totul funcționează perfect și rulând scriptul manual.

---

Distracție plăcută la organizat amintirile! 🤍
