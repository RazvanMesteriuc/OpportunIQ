# OpportunIQ - Plan De Testare Manuala

## 1. Scop
Acest document defineste planul de testare manuala pentru build-ul curent din `D:\OpportunIQ`.

Scopul lui nu este sa pretinda ca produsul este deja complet.
Scopul lui este sa ofere un cadru clar, repetabil si auditabil pentru:

- verificarea fluxurilor principale deja implementate;
- separarea intre ce functioneaza real, ce este demo si ce lipseste;
- reducerea riscului de regresie la fiecare iteratie;
- pregatirea pentru preview deploy si, mai tarziu, pentru backend real.

## 2. Adevarul Curent
Planul de mai jos este construit pe baza implementarii actuale, nu pe baza produsului final dorit.

Ce exista acum:

- rute reale pentru `Acasa`, `Semnale`, `Detaliu semnal`, `Oportunitate`, `Potriviri`, `Mesaje`, `Profil`, `Onboarding`, `Explorare rapida`;
- owner-scoped local persistence pentru drafturi de oportunitate, cereri de introducere si mesaje demo;
- local API shim pentru `/api/*`;
- policy layer pentru acces, vizibilitate si mesagerie controlata;
- snapshot de workspace si consum incremental in UI.

Ce NU exista inca:

- autentificare completa end-to-end cu UI real de login;
- counterpart real care accepta sau respinge introduceri;
- backend real cu DB si ownership server-side autentic;
- motor real de generare/scorare Deloitte-level;
- matching complet server-side;
- test automation utila pentru fluxurile de produs.

## 3. Pregatire Mediu

### 3.1 Cerinte
- Node/npm instalat
- build local functional
- browser desktop modern

### 3.2 Pornire aplicatie
1. Deschide proiectul `D:\OpportunIQ`.
2. Ruleaza `npm install` daca este necesar.
3. Ruleaza `npm run dev` pentru dezvoltare sau `npm run preview` dupa build.
4. Deschide URL-ul local furnizat de Vite.

### 3.3 Reset stare locala
Inainte de un ciclu serios de testare:

1. Deschide DevTools.
2. Mergi in `Application -> Local Storage`.
3. Sterge cheile relevante pentru oportunitate/mesaje/profil daca vrei un test curat.
4. Reincarca pagina.

Observatie:
- produsul actual foloseste local persistence si visitor/auth-scoped keys;
- fara reset, unele rezultate pot reflecta actiuni anterioare si pot induce concluzii false.

## 4. Criterii Minime De Trecere
Un build este considerat minim testabil daca:

- toate rutele principale se deschid fara crash;
- `Semnal -> Oportunitate -> Introducere controlata -> Mesaje` functioneaza coerent in demo;
- datele locale se persista la refresh;
- mesajele nu se deschid liber inainte de acceptarea unei introduceri;
- informatia sensibila nu este afisata public in mod implicit;
- `npm run build` trece.

## 5. Matrice De Acoperire

| Zona | Ruta | Status asteptat |
| --- | --- | --- |
| Acasa | `/` | Se incarca fara erori |
| Semnale | `/semnale` | Lista de semnale este vizibila |
| Detaliu semnal | `/semnale/:id` | Diferenta semnal vs oportunitate este inteligibila |
| Oportunitate | `/semnale/:id/oportunitate` | Workspace-ul este editabil si persista local |
| Potriviri | `/potriviri` | Pagina se deschide si afiseaza grupuri relevante |
| Mesaje | `/mesaje` | Thread-urile depind de introduceri acceptate |
| Profil | `/profil` | Pagina se incarca coerent vizual |
| Onboarding | `/onboarding` | Pasii se afiseaza corect |
| Explorare rapida | `/explorare-rapida` | Pagina se deschide fara crash |

## 6. Scenarii Detaliate

### 6.1 Smoke Test General
1. Deschide `/`.
2. Verifica topbar-ul cu cele 5 rute principale.
3. Navigheaza in ordine la `Semnale`, `Potriviri`, `Mesaje`, `Profil`.
4. Revino pe `Acasa`.
5. Verifica absenta erorilor evidente de randare, layout rupt sau ecran gol.

Rezultat asteptat:
- toate paginile se incarca;
- nu exista crash sau redirect necontrolat;
- layout-ul public ramane consistent.

### 6.2 Home / Acasa
1. Deschide `/`.
2. Verifica hero-ul principal.
3. Verifica zona `Cel mai puternic semnal acum`.
4. Verifica lista `Cele mai interacționate semnale`.
5. Verifica widget-ul `Explorare rapidă`.
6. Apasa pe CTA-ul spre detaliu semnal.
7. Revino si apasa pe CTA-ul spre oportunitate.

Rezultat asteptat:
- home comunica clar promisiunea produsului;
- CTA-urile duc in rutele corecte;
- nu exista suprapuneri sau blocuri rupte.

### 6.3 Feed / Semnale
1. Deschide `/semnale`.
2. Verifica lista de carduri.
3. Verifica un card cu:
   - imagine;
   - titlu;
   - scor;
   - interes;
   - CTA spre detaliu;
   - CTA spre oportunitate.
4. Deschide doua semnale diferite.

Rezultat asteptat:
- cardurile sunt uniforme;
- navigatia functioneaza pentru detaliu si oportunitate;
- pagina nu pare doar mock vizual fara directie.

### 6.4 Detaliu Semnal
1. Deschide `/semnale/pet-care-home`.
2. Verifica cele 3 idei principale din pagina:
   - ce observam;
   - ce oportunitate se contureaza;
   - ce vede un tert.
3. Verifica blocul `Dovezi rapide`.
4. Verifica sidebar-ul:
   - `Ce faci mai departe`;
   - `Unde este acum`;
   - `Introducere controlată`;
   - `Ce rămâne protejat`.
5. Apasa `Construiește oportunitatea`.

Rezultat asteptat:
- pagina explica semnalul fara sa para dashboard greu;
- exista o diferenta clara intre semnal si oportunitate;
- confidentialitatea este explicata, nu doar presupusa.

### 6.5 Workspace / Oportunitate
1. Deschide `/semnale/pet-care-home/oportunitate`.
2. Verifica hero-ul si blocul de readiness.
3. Verifica stepper-ul `Idee -> Validare -> Plan -> Pitch`.
4. Verifica sectiunile:
   - brief public;
   - problema / solutie / model de business;
   - ce cauti acum;
   - ask actual;
   - cu cine merita discutat;
   - ce mai trebuie clarificat.
5. Apasa `Salvează spațiul`.
6. Apasa `Completează pitch`.
7. Reincarca pagina.

Rezultat asteptat:
- state-ul workspace-ului se pastreaza dupa reload;
- procentul de pitch / readiness se actualizeaza coerent;
- pagina ramane un brief clar, nu un dashboard confuz.

### 6.6 Persistenta Locala
1. In workspace, executa cel putin:
   - un `Salvează spațiul`;
   - un `Completează pitch`.
2. Reincarca pagina.
3. Inchide tab-ul si redeschide ruta.

Rezultat asteptat:
- draft-ul ramane disponibil;
- stadiul si procentul nu revin arbitrar la valorile initiale;
- nu se pierde continutul doar pentru ca ai facut refresh.

### 6.7 Introducere Controlata Din Oportunitate
1. In pagina de oportunitate, verifica sectiunea `Introducere controlată`.
2. Daca policy-ul permite, apasa `Solicită introducere`.
3. Verifica starea afisata dupa cerere.
4. Reincarca pagina.

Rezultat asteptat:
- introducerea se creeaza o singura data pentru acel semnal si owner curent;
- statusul devine vizibil in UI;
- datele raman persistate dupa refresh.

### 6.8 Mesaje Blocate Inainte De Acceptare
1. Mergi in `/mesaje` dupa ce ai o cerere pending.
2. Verifica lista `Cereri în așteptare`.
3. Verifica daca exista thread-uri active.
4. Verifica inputul de mesaj.

Rezultat asteptat:
- cererea apare la pending;
- thread-ul nu este liber daca introducerea nu este acceptata;
- produsul nu permite chat deschis prematur.

### 6.9 Demo Accept / Reject Pentru Introduceri
1. In `/mesaje`, gaseste o cerere pending.
2. Apasa `Demo: Acceptă`.
3. Verifica aparitia thread-ului activ.
4. Revino cu reset local state si repeta cu `Demo: Respinge`.

Rezultat asteptat:
- `Acceptă` deschide thread-ul;
- `Respinge` nu deschide thread-ul;
- comportamentul este coerent cu regulile de produs.

### 6.10 Trimitere Mesaj In Thread Eligibil
1. Dupa `Demo: Acceptă`, selecteaza thread-ul activ.
2. Scrie un mesaj in compozitor.
3. Trimite mesajul.
4. Reincarca pagina.

Rezultat asteptat:
- mesajul apare in thread;
- mesajul persista local dupa reload;
- scrierea este permisa doar in thread eligibil.

### 6.11 Politici De Confidentialitate
1. Deschide detaliu semnal si oportunitate.
2. Verifica textele despre `ce vede un tert`, `ce rămâne protejat`, `acces și confidențialitate`.
3. Verifica daca pitch-ul complet nu este expus public by default.

Rezultat asteptat:
- publicul vede rezumat si tablou public;
- counterpart-ul/pitch-ul complet nu este afisat implicit tuturor;
- UI-ul nu contrazice politicile de acces.

### 6.12 Potriviri
1. Deschide `/potriviri`.
2. Verifica grupurile:
   - `În localitatea ta`
   - `Județe apropiate`
3. Verifica cardurile de compatibilitate.
4. Apasa pe `Vezi profil` si `Inițiază contact` daca exista actiune navigabila.

Rezultat asteptat:
- pagina se incarca stabil;
- compatibilitatea este lizibila;
- lipsa backend-ului real nu produce crash.

Observatie:
- o parte din pagina este inca mai aproape de demo de prezentare decat de flux functional complet.

### 6.13 Profil
1. Deschide `/profil`.
2. Verifica sectiunile:
   - informatii de profil;
   - puncte IQ;
   - progres badge;
   - colectie badge-uri;
   - activitate recenta.
3. Verifica lipsa overlap-urilor si a defectelor vizuale evidente.

Rezultat asteptat:
- pagina este coerenta si lizibila;
- badge-urile nu sunt incalecate;
- nu exista blocuri sparte la dimensiuni desktop normale.

### 6.14 Onboarding
1. Deschide `/onboarding`.
2. Verifica stepper-ul.
3. Verifica cardurile de selectie pentru locatie, industrii, rol.
4. Apasa `Continuă`.

Rezultat asteptat:
- pagina se afiseaza fara erori;
- pasii sunt inteligibili;
- butonul nu produce crash.

Observatie:
- in build-ul curent, onboarding-ul este in principal prezentational.

### 6.15 Explorare Rapida
1. Deschide `/explorare-rapida` sau acceseaza widget-ul din home.
2. Verifica afisarea hartii.
3. Verifica daca marker-ele sunt incadrate rezonabil.

Rezultat asteptat:
- pagina nu crapa;
- harta este recognoscibila;
- nu exista regressii vizuale majore.

Observatie:
- aceasta zona are istoric de sensibilitate vizuala si trebuie verificata la fiecare iteratie.

### 6.16 Ownership Local / Izolare Minima
1. Creeaza draft sau introducere pe un semnal.
2. Reseteaza storage-ul relevant sau schimba contextul de owner daca ai metoda disponibila in mediu.
3. Reviziteaza aceeasi ruta.

Rezultat asteptat:
- datele owner-scoped nu trebuie sa para globale pentru toti;
- daca resetul sterge owner-ul, datele nu trebuie sa reapara magic.

Observatie:
- aceasta este doar simulare de ownership; nu trebuie confundata cu securitate server-side reala.

## 7. Teste Negative Obligatorii

### 7.1 Fara introducere acceptata
- Nu trebuie sa existe thread liber de mesaje.

### 7.2 Fara draft suficient de matur
- Introducerea nu trebuie prezentata ca actiune complet libera daca policy-ul o blocheaza.

### 7.3 Refresh dupa mutatii
- Nu trebuie sa se piarda draftul sau mesajele demo imediat dupa refresh.

### 7.4 Navigare directa pe rute
- Daca deschizi direct o ruta ca `/semnale/pet-care-home/oportunitate`, pagina nu trebuie sa crape.

### 7.5 Fara backend real
- Lipsa backend-ului final nu trebuie sa produca erori vizibile utilizatorului in fluxurile deja simulate local.

## 8. Zone Cu Risc Mare
- `localStorage` si owner-scoping local;
- sincronizarea intre local repository si workspace snapshot;
- `accepted introduction -> active thread`;
- politica de acces la pitch / partner summary / public board;
- harta si componentele vizuale sensibile;
- butoane prezentationale care pot crea falsa impresie de functionalitate completa.

## 9. Ce Este Demo Si Trebuie Comunicat Onest
- acceptarea/respingerea introducerii din `Mesaje` este simulare locala;
- multe filtre din `Acasa`, `Semnale`, `Potriviri` sunt in principal UI scaffolding;
- `Profil` si `Onboarding` sunt inca preponderent prezentationale;
- nu exista inca matching real sau counterpart real;
- securitatea actuala este buna ca model de produs local, nu ca garantie de productie.

## 10. Release Gate Pentru Preview
Nu pregatim preview serios daca unul din urmatoarele pica:

- `npm run build` esueaza;
- exista crash pe o ruta principala;
- `Mesaje` permite chat fara introducere acceptata;
- `Oportunitate` nu persista minim local;
- confidentialitatea este contrazisa de UI;
- layout-ul este rupt pe paginile principale.

## 11. Propunere De Executie QA Pe Runda

### Runda 1 - Smoke
- Home
- Semnale
- Detaliu semnal
- Oportunitate
- Mesaje

### Runda 2 - Flux complet
- semnal selectat
- deschidere oportunitate
- progres pitch
- solicitare introducere
- demo accept
- mesaj trimis

### Runda 3 - Persistenta si regressii
- reload pe fiecare pas
- verificare owner-scope
- verificare blocari policy

## 12. Urmatorul Nivel
Cand exista backend real, acest plan trebuie extins cu:

- teste pe autentificare reala;
- teste pe mai multi actori;
- teste pe ownership server-side;
- teste pe acces admin vs non-admin;
- teste pe rate limits;
- teste pe date lipsa / stale / inconsistente;
- teste pe scoring si explainability.

Pana atunci, acest document este baza corecta pentru verificarea produsului actual, fara autoamagire si fara a confunda demo-ul local cu produsul final.
