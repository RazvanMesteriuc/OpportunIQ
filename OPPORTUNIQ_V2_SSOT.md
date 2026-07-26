# OpportunIQ V2 - Single Source of Truth (SSOT)

## 1. Viziunea de Produs & Poziționare
OpportunIQ este o platformă de *live economic discovery* de nivel expert.
**Mesaj principal:** „Oportunități de afaceri identificate din semnale reale de pe piață.”
**Promisiune:** Utilizatorii descoperă idei de business fundamentate pe date, înțeleg clar "de ce" există o oportunitate și se pot conecta rapid cu actori relevanți.
**Restricții stricte:** Fără promisiuni de tip "profit garantat". Fără estimări financiare (bugete/investiții) inventate sau calculate rudimentar. Datele AI oferă *insight-uri interpretative*, nu scoruri inventate.

## 2. Arhitectura UI / Navigația
Conform celor 6 imagini de design furnizate, interfața este "premium SaaS", aerisită, axată pe fundaluri albe/gri deschis, cu accente teal (principal) și verde (validare/creștere). Lățimea maximă a layout-ului a fost extinsă (max-w-[1600px]) pentru o vizualizare optimă a tuturor elementelor pe ecrane mari.

**Meniul principal (Topbar compact):**
1. `Acasă`
2. `Semnale`
3. `Potriviri`
4. `Mesaje`
5. `Profil`
*(Harta devine widget secundar, nu meniu principal).*

### 2.1 Stadiul Curent al Implementării (Front-end vs Back-end)
*   **Front-end UI (în tranziție controlată):** Există deja un set coerent de ecrane și componente pentru `PublicLayout`, `SignalCard`, `Acasă`, `Semnale`, `Detaliu semnal`, `Spațiu de oportunitate`, `Mesaje`, `Profil`, `Potriviri`, `Onboarding`. Suprafața principală a fost simplificată astfel încât `Semnal` și `Oportunitate` să pară brief-uri clare, nu dashboard-uri greoaie.
*   **Logică de produs (fundație locală, nu server final):** Există deja contracte, repository-uri și policies reale pentru `OpportunityDraft`, `IntroductionRequest`, `ControlledMessageThread`, `visibility tiers`, `workspace snapshot` și `owner-scoped local persistence`, plus un `local API shim` pentru `/api/*`. Aceasta este **o fundație de produs serioasă**, dar încă **nu** este backend final cu DB reală, auth real end-to-end și counterpart multi-actor autentic.
*   **Back-end final (încă lipsă):** lipsesc încă persistența server-side reală, ownership server-side autentic, actorul counterpart real, matching-ul real și motorul complet de generare a semnalelor.

### 2.2 Decizie De Produs: Ce Păstrăm, Ce Eliminăm, Ce Redesenăm

#### A. Ce păstrăm 100%
1. **Topbar compact cu 5 rute:** `Acasă`, `Semnale`, `Potriviri`, `Mesaje`, `Profil`.
2. **Structura produsului orientată pe semnale:** Home -> listă semnale -> detaliu semnal -> potriviri -> mesaje.
3. **Harta ca widget secundar:** rămâne o unealtă de explorare rapidă, nu devine centrul produsului.
4. **Cardul principal de semnal:** rămâne conceptul de "Cel mai puternic semnal acum", cu scor, interes agregat și CTA-uri clare.
5. **Sidebar contextual:** în `Mesaje`, `Detaliu semnal` și `Profil` rămân blocuri laterale scurte și utile.
6. **Gamification discretă:** `Puncte IQ`, progres badge și promovare cu puncte rămân în produs, dar nu domină experiența.

#### B. Ce NU păstrăm
1. **Badge-uri decorative sau copilărești:** orice element care pare "gamified for fun" și nu inspiră încredere premium.
2. **Ilustrații abstracte fără relevanță:** forme, pseudo-3D, artificii vizuale fără legătură directă cu semnalul sau contextul economic.
3. **Carduri aglomerate:** prea multe tag-uri, micro-metrici sau accente coloristice în același loc.
4. **Harta încărcată sau ambiguă:** marker-ele nu trebuie să iasă din conturul țării, iar harta nu trebuie să concureze cu feed-ul principal.
5. **Colecții de badge-uri fără design clar:** dacă un badge nu arată ca un asset premium sau o insignă credibilă, nu intră în UI-ul final.
6. **Zone pur decorative:** orice bloc care nu susține una din cele 3 decizii-cheie ale utilizatorului: descoperă, evaluează, acționează.

#### C. Ce redesenăm de la zero sau aproape de la zero
1. **Home / Acasă**
   - Hero mai curat și mai credibil.
   - Cardul principal de semnal cu ierarhie mai bună.
   - Lista de semnale secundare cu thumbnails foto relevante.
   - Widgetul `Explorare rapidă` pe bază de hartă clară, recognoscibilă, simplă.
2. **Semnale**
   - Carduri uniforme, mai apropiate de referințe.
   - Mai puține artificii grafice și mai mult focus pe imagine, titlu, scor, interes, CTA.
3. **Detaliu semnal**
   - Ierarhie clară între: fapt, interpretare, recomandare.
   - Sidebar util, dar mai compact și mai premium.
4. **Profil**
   - Badge-uri redesenate ca insigne premium.
   - Carduri mai curate, mai puține elemente decorative.
5. **Mesaje**
   - Se păstrează structura, dar zona contextuală din dreapta folosește imagini reale și badge-uri mai mature.
6. **Potriviri**
   - Se păstrează direcția actuală, fiind cea mai apropiată de ce trebuie, dar se rafinează vizual pentru consistență.

### 2.3 Principii Vizuale Finale
1. **Premium, calm, explicabil:** interfața trebuie să inspire încredere și claritate, nu entertainment.
2. **Poze reale unde au sens:** semnalele folosesc imagini foto relevante pentru subiectul oportunității.
3. **Badge-uri puține și curate:** doar cele care clarifică statut, sursă, validare sau progres.
4. **Accent controlat al culorii:** teal pentru acțiune și identitate, verde pentru validare/creștere, portocaliu doar pentru avertizare sau risc.
5. **Fără overload vizual:** mai puține straturi grafice, mai puține umbre inutile, mai puține decorațiuni.
6. **Fiecare bloc trebuie să servească o decizie:** dacă nu ajută utilizatorul să înțeleagă sau să acționeze, blocul este simplificat sau eliminat.

### 2.4 Ordinea De Execuție Pentru Redesign
1. **Stabilizare SSOT și decizie de produs**
   - Se validează structura finală și regulile de simplificare.
2. **Redesign Home**
   - Este pagina cea mai importantă și setează limbajul vizual pentru restul aplicației.
3. **Redesign carduri de semnal**
   - `SignalCard` devine componenta standard pentru `Acasă`, `Semnale` și secțiuni conexe.
4. **Redesign Explorare rapidă**
   - Harta compactă și, ulterior, pagina dedicată de explorare.
5. **Redesign Profil și badge-uri**
   - Clarifică reputația și gamification-ul fără să încarce produsul.
6. **Redesign Mesaje și Detaliu semnal**
   - Se aliniază la componentizarea nouă și la noua ierarhie vizuală.
7. **Rafinare Potriviri**
   - Ajustări de consistență, nu reinventare completă.
8. **Abia după închiderea designului: implementarea logicii reale**
   - modele de date
   - query ownership/auth
   - scoring BI
   - ranking
   - matching
   - puncte IQ
   - promovare

## 3. Logica de Nivel Expert (BA, BI & SaaS Logic)

Sistemul de semnale nu este doar un "feed de idei", ci un motor de **Intelligence de Business (BI)**. Identificarea și scorarea se bazează pe surse reale, iar AI-ul este folosit doar pentru sumarizare și interpretare semantică, **nu** pentru a genera matematică.

### 3.0 Modelul Central De Produs
Fluxul unic și coerent al produsului este:

`Semnal -> Oportunitate -> Pitch -> Potriviri -> Introducere controlată`

#### Definiții:
1. **Semnal**
   - observație reală din piață;
   - derivată din date, comportament, gap de ofertă, review-uri, demografie, trenduri sau interacțiuni reale.
2. **Oportunitate**
   - idee de business construită pe unul sau mai multe semnale;
   - poate proveni din platformă, din contribuția unui utilizator sau din combinarea mai multor semnale.
3. **Pitch**
   - versiunea structurată a oportunității, pregătită pentru discuție cu investitori, furnizori, parteneri sau finanțatori;
   - nu este pagină principală separată în meniu, ci etapă contextuală din spațiul de oportunitate.
4. **Potrivire**
   - conectare contextuală între o oportunitate și persoane/organizații care pot accelera evoluția ei.
5. **Introducere controlată**
   - contactul nu este complet deschis;
   - fluxul standard este: `Urmărește -> Exprimă interes -> Solicită introducere -> Acceptare -> Mesaj`.

#### Reguli:
* O idee propusă de utilizator nu devine oportunitate puternică fără semnale suport, date atașate sau validare comunitară.
* Pitch-ul este o etapă de maturitate, nu un produs separat.
* Mesajele apar doar după acceptarea unei introduceri sau după o potrivire autorizată.

### A. Sursele de Date (Fundamentul BI)
Un semnal este considerat *valid* doar dacă este susținut de minim 2 surse independente:
1. **Date Publice/Guvernamentale:** INS (demografie, venituri), ONRC (densitate firme/cod CAEN, radieri/înființări).
2. **Date de Sentiment/Cerere:** Google Trends (volum căutări locale), Google Reviews / TripAdvisor (sentiment negativ/pozitiv pe nișe specifice).
3. **Date Interne (SaaS Logic):** Interacțiunile agregate ale utilizatorilor (salvări, potriviri, "Mă interesează").

#### Surse permise, dar condiționate:
* Google Business Profile / Reviews doar dacă accesul este legal și tehnic permis;
* TripAdvisor doar pentru verticalele unde e relevant și legal;
* alte surse publice doar dacă pot fi citate, mapate și versionate;
* dacă o sursă nu este disponibilă, lipsa este marcată explicit în sistem și în scorul de încredere.

#### A.1 Reguli stricte pentru admisibilitatea surselor
O sursă intră în algoritm doar dacă trece simultan prin 5 filtre:
1. **Credibilitate**
   - sursă instituțională, platformă dominantă de cerere, platformă dominantă de reviews sau sursă internă auditabilă;
   - nu se folosesc bloguri obscure, postări izolate, forumuri nerelevante sau agregatoare neclare ca surse primare de adevăr.
2. **Actualitate**
   - fiecare sursă are o fereastră maximă de vechime admisă;
   - dacă datele sunt prea vechi, sursa nu dispare, dar intră cu penalizare serioasă în `ConfidenceScore`;
   - dacă sursa este critică și stale, candidatul nu poate deveni `featured_signal` sau `buildable_opportunity`.
3. **Granularitate**
   - ideal: localitate;
   - acceptabil: județ;
   - slab: regiune sau național;
   - semnalele fără geografie utilă nu pot fi considerate oportunități locale puternice.
4. **Mapabilitate**
   - sursa trebuie mapată în mod determinist la:
     - industrie / niche;
     - localitate / județ;
     - fereastră temporală;
     - tip de semnal observat.
5. **Reproductibilitate**
   - aceeași interogare trebuie să poată fi refăcută;
   - dacă o sursă nu poate fi interogată sau explicată din nou, ea nu trebuie să contribuie puternic la scor.

#### A.2 Profile de surse și rolul lor în adevărul de piață
Sursele nu au greutate egală și nu trebuie amestecate naiv:
1. **Surse structurale**
   - INS, ONRC, date demografice, densitate firme, înființări/radieri;
   - spun dacă piața are mărime, structură și densitate compatibile cu oportunitatea.
2. **Surse de cerere**
   - Google Trends, volume de căutare, pattern-uri de interes;
   - spun dacă există tensiune reală sau interes crescător, nu dacă oportunitatea este deja bună.
3. **Surse de problemă**
   - reviews, reclamații recurente, feedback repetitiv, lacune de calitate;
   - spun dacă există durere sau fricțiune reală, nu doar atenție.
4. **Surse de ofertă**
   - densitate de business-uri active, rating-uri, număr de review-uri, acoperire geografică, diversitate de ofertă;
   - spun dacă piața este liberă, fragmentată, saturată sau deja bine servită.
5. **Surse interne din produs**
   - salvări, follow, build opportunity, request introduction, useful conversation;
   - influențează mai ales distribuția și doar marginal adevărul de piață.

#### A.3 Ferestre de prospețime recomandate
Prospețimea nu trebuie tratată generic:
* Google Trends / interes de căutare:
  - bun: 7-30 zile;
  - acceptabil: 31-90 zile;
  - slab: peste 90 zile.
* Reviews / feedback calitativ:
  - bun: ultimele 90 zile;
  - acceptabil: 91-180 zile;
  - slab: peste 180 zile, cu excepția pattern-urilor istorice consistente.
* ONRC / densitate de firme:
  - bun: ultimul trimestru;
  - acceptabil: ultimul an;
  - slab: mai vechi dacă piața se mișcă rapid.
* INS / structură economică și demografică:
  - poate fi folosită pe ferestre mai mari, dar cu penalizare de actualitate dacă este prea veche.

Regulă:
* un semnal nu trebuie eliminat doar pentru că o singură sursă este mai lentă structural;
* însă sursele rapide și sursele lente nu trebuie confundate în aceeași noțiune de prospețime.

#### A.4 Arhitectura operațională a surselor
Implementarea reală nu trebuie să înceapă de la API-uri amestecate haotic, ci de la un registru clar de surse.

Fiecare sursă trebuie definită prin:
* `source_id`
* `source_name`
* `source_role`
  - `structural`
  - `demand`
  - `problem`
  - `supply`
  - `internal`
* `access_mode`
  - `official_api`
  - `official_dataset`
  - `official_query_interface`
  - `approved_third_party_provider`
  - `internal_event_stream`
* `auth_mode`
  - `none`
  - `api_key`
  - `oauth`
  - `account_based`
  - `paid_document_or_manual_flow`
* `freshness_profile`
* `geo_resolution`
* `industry_coverage`
* `entity_granularity`
* `legal_constraints`
* `storage_constraints`
* `normalization_rules`
* `trust_weight_class`
  - `high`
  - `medium`
  - `conditional`
* `enabled_for_truth`
* `enabled_for_distribution`
* `enabled_for_review_intelligence`
* `enabled_for_supply_saturation`

Regulă:
* nicio integrare nouă nu intră direct în pipeline fără să fie descrisă în acest registru operațional.

#### A.4.1 Stack-ul recomandat pentru faza 1
Faza 1 trebuie să folosească doar surse suficient de credibile și implementabile pentru România.

1. **INS / TEMPO**
   - rol principal: `structural`
   - utilitate:
     - demografie;
     - urban/rural;
     - profil teritorial;
     - structură economică și socială agregată;
   - folosire în algoritm:
     - `local_fit`
     - calibrare de mărime a pieței
     - validare de context pentru județ / regiune
   - limitări:
     - granularitatea este adesea până la județ sau nivel agregat;
     - nu este sursă de cerere directă.

2. **ONRC Open Data / seturi oficiale publicate periodic**
   - rol principal: `structural` + `supply`
   - utilitate:
     - densitate firme;
     - activitate CAEN;
     - stare firmă;
     - distribuție geografică a jucătorilor existenți;
   - folosire în algoritm:
     - `supply_density`
     - `effective_supply_coverage`
     - verificare de saturație
   - limitări:
     - update-urile pot veni la intervale de săptămâni sau luni;
     - nu trebuie tratată ca sursă de prospețime rapidă.

3. **Google Places / Places Details**
   - rol principal: `problem` + `supply`
   - utilitate:
     - rating agregat;
     - existența competitorilor;
     - eșantion limitat de review-uri;
     - indicii despre densitate și calitate a ofertei;
   - folosire în algoritm:
     - `supply_quality`
     - `market_saturation`
     - `review_intelligence` doar ca layer limitat și controlat
   - limitări:
     - nu trebuie tratată ca sursă completă de istoric review;
     - este suficientă pentru discovery și sampling, nu pentru a pretinde exhaustivitate.

4. **Google Trends**
   - rol principal: `demand`
   - utilitate:
     - interes de căutare;
     - trend în timp;
     - interes geografic;
     - query-uri conexe sau în creștere;
   - folosire în algoritm:
     - `demand_local`
     - `trend_strength`
     - confirmarea unui `emerging behavior shift`
   - limitări:
     - dacă accesul oficial nu este stabil și disponibil, integrarea trebuie trecută printr-un adaptor de provider aprobat;
     - datele Trends nu trebuie folosite singure pentru a justifica oportunitatea.

5. **Interacțiuni interne OpportunIQ**
   - rol principal: `internal`
   - utilitate:
     - follow;
     - save;
     - express_interest;
     - build_opportunity;
     - request_introduction;
     - useful_conversation;
   - folosire în algoritm:
     - influență minoră asupra `Truth`
     - influență relevantă asupra `Distribution`
   - limitări:
     - nu pot crea singure semnal de piață;
     - nu pot înlocui sursele externe.

#### A.4.2 Stack-ul recomandat pentru faza 2
Faza 2 poate adăuga surse dacă trec filtrele de admisibilitate și dacă faza 1 este deja stabilă:
* surse oficiale financiare și fiscale relevante pentru sănătatea companiilor;
* surse oficiale de achiziții sau licitații unde pot apărea goluri de ofertă;
* agregatori comerciali de date doar dacă:
  - explică proveniența;
  - oferă date versionabile;
  - nu devin black-box de scoring.

Regulă:
* sursele din faza 2 nu intră pentru că „sună bine”, ci doar dacă adaugă semnal nou, nu duplică zgomotul.

#### A.4.3 Surse interzise sau degradate sever
Nu sunt acceptate ca surse primare de adevăr:
* bloguri SEO;
* articole de opinie fără dataset clar;
* forumuri obscure;
* postări sociale izolate;
* directoare comerciale fără trasabilitate;
* agregatoare care nu explică proveniența datelor;
* scraping fragil care nu poate fi reprodus sau auditat.

Ele pot fi folosite cel mult ca:
* idee de explorare;
* semnal slab pentru investigație internă;
* sursă auxiliară fără pondere mare în scor.

#### A.4.4 Politica de API keys și acces
Produsul trebuie să distingă clar între:
1. **chei de acces la surse**
   - pentru extragerea datelor de piață;
2. **chei de procesare AI**
   - pentru clasificare, extragere de teme, sumarizare și normalizare;
3. **chei interne de infrastructură**
   - pentru scheduling, storage, observability, queues.

Regulă:
* nici o cheie AI nu trebuie confundată cu o sursă de adevăr;
* cheia AI procesează datele, nu produce adevărul de piață din nimic.

#### A.4.5 Lista prioritizată de API keys pentru implementare
Ordinea corectă a implementării este:

**Prioritate 1**
* `Google Maps / Places API key`
  - necesară pentru:
    - competitor discovery;
    - place details;
    - rating agregat;
    - sampling controlat de reviews;
  - valoare:
    - foarte mare pentru `supply` și `problem`.

* `OpenAI API key`
  - necesară pentru:
    - `aspect extraction`
    - `topic clustering`
    - `complaint normalization`
    - `unmet-need summarization`
  - valoare:
    - mare pentru `review intelligence`
  - limitare:
    - nu decide scorul final.

**Prioritate 2**
* `Google Trends official access`, dacă este aprobat și stabil
  - rol:
    - sursă principală de cerere
  - dacă nu este disponibil:
    - trebuie înlocuit temporar printr-un provider terț aprobat și etichetat clar ca atare.

* `Provider key pentru Trends`, doar ca fallback controlat
  - condiții:
    - providerul trebuie să ofere output stabil;
    - proveniența și limitările trebuie documentate;
    - greutatea lui în `ConfidenceScore` trebuie să fie sub sursa oficială.

**Prioritate 3**
* chei sau conturi pentru surse oficiale financiare / fiscale / registru avansat, dacă sunt necesare pentru extindere;
* acestea nu trebuie cerute înainte să fie clar ce scor nou susțin.

#### A.4.6 Surse fără API key, dar obligatorii în stack
Nu toate sursele valoroase au nevoie de API key:
* seturi oficiale ONRC publicate pe portaluri guvernamentale;
* interfețe publice oficiale INS / TEMPO;
* date interne OpportunIQ.

Regulă:
* lipsa unui API key nu înseamnă lipsă de valoare;
* în multe cazuri, sursele oficiale batch sunt mai credibile decât un API comod, dar opac.

#### A.4.7 Ordinea de implementare a adaptorilor
Ordinea recomandată:
1. adaptor `INS structural`
2. adaptor `ONRC structural_supply`
3. adaptor `Places supply_problem`
4. adaptor `Trends demand`
5. adaptor `OpportunIQ internal events`
6. normalizare comună
7. fusion layer
8. scoring + gating

Regulă:
* adaptorii trebuie construiți separat de scoring;
* scoring-ul consumă un contract normalizat, nu răspunsuri brute de la furnizori.

#### A.4.8 Contractul minim de ieșire pentru fiecare adaptor
Fiecare adaptor trebuie să poată produce, unde este cazul:
* `entity_id`
* `source_id`
* `observed_at`
* `geo_scope`
* `industry_scope`
* `source_role`
* `raw_confidence`
* `freshness_hours`
* `coverage_completeness`
* `evidence_refs`
* `normalizable_metrics`
* `legal_usage_class`

Pentru reviews:
* `review_count`
* `rating_average`
* `review_sample`
* `problem_topics`
* `problem_frequency_signals`
* `manipulation_flags`

Pentru competitori:
* `competitor_count`
* `category_match_confidence`
* `location_match_confidence`
* `supply_quality_proxy`

Pentru cerere:
* `search_interest_index`
* `interest_change_window`
* `geo_interest_distribution`
* `related_queries`

#### A.4.9 Criteriul de oprire
Nu începem integrarea live până când:
* știm exact ce adaptor produce ce metrică;
* știm ce chei sunt necesare;
* știm ce surse sunt oficiale, limitate sau fallback;
* știm cum marcăm în produs lipsa unei surse fără să mințim utilizatorul.

### B. Algoritmul Determinist de Scoriere (Signal Score)
Scorul de semnal (0-100) este matematic și determinist. Nu se bazează pe ghicitul AI-ului.

`Scor_Semnal = (Cerere_Locala * 0.25) + (Gap_Oferta * 0.20) + (Intensitate_Problema * 0.15) + (Trend * 0.15) + (Potrivire_Locala * 0.10) + (Testabilitate * 0.10) + (Validare_Comunitara * 0.05)`

*   **Cerere Locală (25%):** interes online, cerere latentă, comportament de consum, volum căutări.
*   **Gap Ofertă (20%):** cererea estimată versus densitatea de ofertă activă în zonă.
*   **Intensitate Problemă (15%):** frecvență și severitate a problemelor recurente din piață.
*   **Trend (15%):** direcție pe intervale de timp, nu doar volum punctual.
*   **Potrivire Locală (10%):** compatibilitatea cu specificul local și contextul economic.
*   **Testabilitate (10%):** cât de ușor poate fi testată ideea în piață.
*   **Validare Comunitară (5%):** interes exprimat și feedback util din platformă.

### B.1 Scorul De Încredere Al Datelor
Scorul de semnal și scorul de încredere sunt entități separate.

`Scor_Incredere_Date = f(numar_surse, actualitate, consistenta, completitudine, calitate)`

Componente recomandate:
* număr surse disponibile;
* actualitatea datelor;
* consistență între surse;
* calitatea și granularitatea;
* lipsuri importante.

Regulă:
* un semnal poate avea scor bun, dar încredere medie sau scăzută;
* în acest caz, stadiul lui nu poate urca artificial la `Validat public` sau `Pitch pregătit`.

#### B.1.1 Formula recomandată pentru `ConfidenceScore`
`ConfidenceScore = (SourceReliability * 0.25) + (Freshness * 0.20) + (CrossSourceConsistency * 0.20) + (GeoGranularity * 0.10) + (CategoryFit * 0.10) + (CoverageCompleteness * 0.10) + (MethodStability * 0.05)`

Unde:
* `SourceReliability`
  - cât de credibile și auditabile sunt sursele folosite;
  - sursele instituționale și platformele dominante de piață au scor mai mare decât sursele slabe sau indirecte.
* `Freshness`
  - se calculează pe profil de sursă, nu generic.
* `CrossSourceConsistency`
  - dacă cererea, problema și oferta spun povești compatibile, scorul crește;
  - dacă sursele se contrazic, scorul scade.
* `GeoGranularity`
  - localitate > județ > regiune > național.
* `CategoryFit`
  - sursele chiar sunt relevante pentru categoria analizată;
  - de exemplu, TripAdvisor poate fi relevant pentru HoReCa, dar mult mai slab pentru alte industrii.
* `CoverageCompleteness`
  - există destule câmpuri și semnale pentru a forma o concluzie robustă.
* `MethodStability`
  - aceeași metodă produce rezultate consistente între rulări și nu depinde de prompturi fragile sau scraping instabil.

#### B.1.2 Separarea între lipsă de date și semnal negativ
Regulă absolută:
* lipsa datelor nu trebuie interpretată automat ca lipsă de oportunitate;
* însă lipsa datelor reduce `ConfidenceScore`, nu crește optimismul;
* algoritmul nu are voie să umple golurile cu presupuneri AI sau cu medii fabricate.

### B.2 Algoritmul De Generare A Semnalelor
Algoritmul de generare răspunde la întrebarea:

`Există aici o oportunitate reală sau doar zgomot?`

El nu trebuie confundat cu ranking-ul din feed și nici cu promovarea.

#### Pipeline obligatoriu:
1. **Ingestie**
   - INS
   - ONRC
   - Google Trends
   - reviews/sentiment, unde este legal și tehnic permis
   - interacțiuni interne agregate din produs
2. **Normalizare**
   - localitate / județ / regiune
   - industrie / niche
   - fereastră temporală
   - tip sursă
   - prospețime
   - granularitate
3. **Detectare de pattern**
   - creștere de cerere
   - gap de ofertă
   - problemă recurentă
   - schimbare locală
   - comportament repetat
4. **Formare de candidat**
   - `demand-led`
   - `location-led`
   - `execution-led`
   - `balanced`
5. **Triangulare**
   - minim 2 surse independente;
   - ideal 3 tipuri de dovadă diferite;
   - fără triangulare suficientă, semnalul nu intră în promoted discovery.
6. **Scorare deterministă**
   - `SignalScore`
   - `ConfidenceScore`
   - `RiskScore`
   - `BiasScore`
   - `ActionabilityScore`
7. **Gating de publicare**
   - `internal_candidate`
   - `feed_visible`
   - `featured_signal`
   - `buildable_opportunity`

#### B.2.1 Logică expertă pentru reviews ca sursă calitativă și cantitativă
Review-urile nu trebuie tratate ca simplu sentiment pozitiv/negativ.

Ele trebuie transformate în 5 tipuri de semnal:
1. **Problem Frequency**
   - cât de des apar aceleași probleme.
2. **Problem Severity**
   - dacă problema este minoră sau rupe experiența clientului.
3. **Problem Recency**
   - dacă problema este actuală sau istorică.
4. **Category Relevance**
   - dacă problema este relevantă pentru oferta potențială sau doar zgomot periferic.
5. **Unmet Demand Signal**
   - dacă review-ul indică explicit sau implicit că piața cere ceva ce nu primește suficient.

Exemple de patterns valoroase:
* „nu găsesc”, „nu există în zonă”, „lista de așteptare”, „program imposibil”, „livrare lentă”, „nu răspunde nimeni”, „calitate inconsistentă”, „serviciu limitat”, „prea puține opțiuni”.

Exemple de patterns slabe sau înșelătoare:
* review-uri foarte scurte fără context;
* opinii izolate fără recurență;
* plângeri care țin doar de preț subiectiv, nu de gap real de piață;
* polarizare artificială sau spam.

Reguli:
* AI-ul poate face `aspect extraction`, `topic clustering`, `complaint normalization` și `unmet-need summarization`;
* AI-ul nu decide singur dacă există oportunitate;
* textul extras trebuie convertit în metrici deterministe:
  - `review_problem_frequency_score`
  - `review_problem_severity_score`
  - `review_unmet_need_score`
  - `review_quality_score`
  - `review_manipulation_risk`

#### B.2.2 Guard de saturație și anti-semnal penibil
Aceasta este o regulă critică de produs:

`Nu generăm semnale care par atractive la suprafață, dar sunt ușor demontabile de un utilizator pentru că piața este deja plină și bine servită.`

Algoritmul trebuie să calculeze separat:
1. **Supply Density**
   - câte business-uri relevante există deja în localitate / județ.
2. **Supply Quality**
   - rating agregat, volum de review-uri, consistență operațională, acoperire reală.
3. **Demand Pressure**
   - creștere de căutare, intensitate de problemă, dovezi de neacoperire.
4. **Market Saturation Index**
   - raport între densitatea ofertei și presiunea reală a cererii.
5. **Whitespace Credibility**
   - cât de credibil este că există loc pentru un nou jucător sau un format nou de ofertă.

Regulă dură:
* dacă există deja mulți jucători activi, rating-ul pieței este bun, volumele de reviews arată acoperire suficientă și nu există problemă recurentă clară, candidatul trebuie:
  - fie suprimat;
  - fie reclasificat ca `nu este semnal puternic de intrare`.

Cu alte cuvinte:
* `multe firme` nu înseamnă automat `piață bună`;
* dar nici `cerere mare` nu înseamnă automat `oportunitate bună`;
* oportunitatea apare doar când `cererea relevantă neacoperită` este mai puternică decât `oferta funcțională existentă`.

#### B.2.3 Formula conceptuală pentru gap real de piață
`Real_Opportunity_Gap = DemandPressure - EffectiveSupplyCoverage - SaturationPenalty + ExecutionFeasibilityAdjustment`

Unde:
* `DemandPressure`
  - vine din cerere, trend, problemă și review-uri.
* `EffectiveSupplyCoverage`
  - nu numără doar firmele, ci cât de bine acoperă ele piața.
* `SaturationPenalty`
  - penalizează piețele cu mulți jucători similari și diferențiere slabă.
* `ExecutionFeasibilityAdjustment`
  - crește sau scade în funcție de cât de realist este ca noul format de ofertă să intre și să testeze piața.

#### B.2.4 Ce tipuri de semnale merită promovate
Sunt eligibile doar semnalele care intră într-una dintre formele puternice de piață:
1. **Unmet local demand**
   - cerere clară, ofertă insuficientă sau prost executată.
2. **Broken incumbent market**
   - există jucători, dar experiența este slabă, inconsistentă sau neadaptată.
3. **Under-served niche**
   - piața generală există, dar un subsegment clar rămâne neacoperit.
4. **Emerging behavior shift**
   - schimbare de comportament sau preferință, încă insuficient servită local.
5. **Execution advantage window**
   - piața nu este goală, dar există o fereastră clară pentru un model de operare superior.

Nu sunt eligibile ca semnale puternice:
* piețe generic populare fără gap real;
* idei care sună bine, dar nu au fricțiune observabilă;
* nișe cu hype și dovezi slabe;
* categorii saturate unde diferențierea ar fi doar „și eu aș putea face asta”.

#### B.2.5 Hard Gates înainte de publicare
Un candidat trebuie suprimat sau plafonat dacă apare oricare dintre situațiile de mai jos:
1. `weak_triangulation`
   - mai puțin de 2 surse independente reale.
2. `stale_core_sources`
   - sursele cheie sunt prea vechi pentru categoria analizată.
3. `saturated_market_without_breakpoint`
   - piața este plină și nu există semn clar de neacoperire.
4. `review_noise_without_pattern`
   - există multe reviews, dar fără problemă recurentă coerentă.
5. `high_manipulation_risk`
   - pattern-uri suspecte în reviews, voturi sau engagement.
6. `weak_geo_precision`
   - semnalul nu poate fi legat suficient de precis de o piață locală.
7. `low_actionability`
   - chiar dacă există o observație interesantă, ea nu poate fi testată realist.

#### B.2.6 Praguri de interpretare pentru publicare
Pragurile din cod pot fi calibrate, dar principiul din SSOT trebuie să rămână:
* `internal_candidate`
  - există ipoteză de piață, dar nu merită încă expusă.
* `feed_visible`
  - există minimul de adevăr și încredere pentru a fi arătată utilizatorilor.
* `featured_signal`
  - semnalul este suficient de robust, explicabil și relevant pentru a primi distribuție mai mare.
* `buildable_opportunity`
  - semnalul are dovadă suficientă, saturație controlată și acționabilitate clară pentru a justifica `Construiește oportunitatea`.

#### Regula supremă a motorului de generare
Motorul nu trebuie să caute doar:

`Unde există interes?`

ci mai ales:

`Unde există interes real, problemă reală, acoperire insuficientă și o fereastră realistă de execuție?`

#### Reguli absolute:
* AI-ul poate sumariza și explica, dar nu decide scorul final de piață.
* Interacțiunea comunității nu poate crea singură un semnal puternic.
* Un scor bun cu încredere slabă produce un semnal promițător, nu un semnal promovat agresiv.
* Bias-ul și riscul pot plafona sau bloca publicarea chiar dacă scorul brut este bun.

### B.3 Truth Score vs Distribution Score
Produsul trebuie să separe explicit:

1. **Truth Score**
   - adevărul de piață estimat din surse și logică deterministă;
   - include `SignalScore`, `ConfidenceScore`, `RiskScore`, `BiasScore`, `ActionabilityScore`.
2. **Distribution Score**
   - decide cui, când și cât de sus este arătat un semnal;
   - poate folosi interacțiunea, prospețimea și personalizarea;
   - nu are voie să rescrie `Truth Score`.

Regulă absolută:

`Interacțiunea influențează distribuția, nu adevărul fundamental al semnalului.`

### C. Algoritmul De Promovare / Distribuție A Semnalelor
Acest algoritm răspunde la întrebarea:

`Cui, când și cât de sus arătăm un semnal deja generat și validat minim?`

Nu este un algoritm de popularitate brută.
Nu este permis ca feed-ul să devină un top de clickuri sau hype.

#### Formula recomandată:
`Distribution_Score = (Merit_Baza * 0.45) + (Interacțiune_Calificată * 0.20) + (Dovezi_De_Outcome * 0.15) + (Prospetime * 0.10) + (Potrivire_Personalizare * 0.10) - Penalizare_Spam - Penalizare_Bias_Popularitate - Penalizare_Repetiție`

#### Componente:
*   **Merit Bază (45%)**
    - derivat din `SignalScore`, `ConfidenceScore`, `ActionabilityScore`;
    - fără merit de bază suficient, semnalul nu primește boost de distribuție.
*   **Interacțiune Calificată (20%)**
    - nu toate interacțiunile au greutate egală;
    - `view` și `open` au greutate mică;
    - `follow`, `save`, `build opportunity`, `request introduction` au greutate medie;
    - doar interacțiunile care arată intenție reală influențează serios distribuția.
*   **Dovezi De Outcome (15%)**
    - `introduction accepted`
    - `useful conversation`
    - `offer tested`
    - `collaboration started`
    - `project launched`
    - acestea valorează mai mult decât simpla atenție.
*   **Prospetime (10%)**
    - semnalele noi sau actualizate recent primesc un avantaj limitat, nu nelimitat.
*   **Potrivire Personalizare (10%)**
    - localitate
    - industrie
    - rol / obiectiv
    - intenții și comportamente relevante

#### Interacțiuni admise în scoring-ul de distribuție:
* slab: `view`, `open detail`
* mediu: `follow`, `save`, `express interest`
* puternic: `build opportunity`, `request introduction`
* foarte puternic: `introduction accepted`, `useful conversation`, `offer tested`, `project launched`

#### Reguli absolute:
* un semnal cu interacțiune mare, dar `ConfidenceScore` mic, nu devine featured doar pentru că este popular;
* un semnal plătit/promovat poate cumpăra doar vizibilitate marcată, nu scor organic;
* aceeași cohortă de utilizatori nu poate umfla la infinit același semnal;
* distribuția repetitivă trebuie penalizată pentru a evita feed-ul stagnant;
* toate boost-urile de promovare trebuie să fie auditabile și reversibile.

### D. Algoritmul de Personalizare (Ranking Score)
Cum se ordonează semnalele eligibile pentru fiecare utilizator:
`Ranking_Score = (Potrivire_Zona * 0.25) + (Potrivire_Industrie * 0.25) + (Scor_Distribuție * 0.20) + (Interacțiuni_Calificate * 0.15) + (Prospetime * 0.10) + (Rol_Utilizator * 0.05)`

Regulă:
* ranking-ul personalizat ordonează doar semnalele care au trecut deja pragurile minime de adevăr și încredere;
* personalizarea nu trebuie să împingă sus semnale slabe doar pentru că utilizatorul a dat click pe subiecte similare.

### E. Algoritmul de Matching (Potriviri)
Cum conectăm utilizatorii/firmele:
`Scor_Matching = (Intenție * 0.30) + (Industrie * 0.25) + (Geografie * 0.20) + (Rol * 0.15) + (Activitate_Recentă * 0.10)`

### F. Clasificarea Oportunităților
Nu toate oportunitățile sunt pentru același tip de sprijin.

1. **Business local finanțabil**
   - potrivit pentru: credit, grant, leasing, finanțare IMM, partener local.
2. **Business scalabil**
   - potrivit pentru: angel, VC, corporate venture, partener strategic.
3. **Business de parteneriat / operațional**
   - potrivit pentru: furnizori, operatori, distribuție, franciză, colaborări B2B.

În UI nu se expun scoruri grele simultan.
Se expune sumar:
* `Potrivit pentru investitor`
* `Potrivit pentru credit`
* `Potrivit pentru furnizor`
* `Parțial potrivit`
* `Nepotrivit momentan`

## 4. Structura Paginilor (conform Design-urilor)

### 4.1. Pagina Acasă (Imaginea 1)
*   **Hero:** „Oportunități de business validate de semnale reale.”
*   **Subtitlu:** „Descoperă, construiește și conectează-te cu investitori și furnizori în jurul oportunităților cu potențial.”
*   **Filtre:** Locație, Industrie, Căutare, Filtrează.
*   **Carduri scurte:** Semnale puternice, Oportunități în validare, Pregătite pentru discuție, Potriviri noi.
*   **Secțiune principală:** `Cel mai puternic semnal acum`
*   **Secțiune secundară:** `Oportunități urmărite acum` sau `Oportunități în validare`, maximum 3 rânduri.
*   **Sidebar dreapta:** `Cum funcționează OpportunIQ`, `Platformă pentru fondatori, investitori și furnizori`, `Puncte IQ`.
*   **Regulă:** Fără hartă mare și fără feed lung pe Home.

### 4.2. Pagina Detaliu Semnal (Imaginea 6 - NOU)
*   **Header:** Titlu semnal, scor semnal, interes agregat.
*   **Acțiuni:** `Urmărește`, `Construiește oportunitatea`, `Solicită introducere` doar dacă oportunitatea/pitch-ul este suficient de matur.
*   **Taburi:** `Prezentare`, `Dovezi & date`, `Potriviri`, `Dezvoltă ideea`.
*   **Prezentare:** de ce contează, rezumat executiv, ce se poate construi, pentru cine este relevant, surse de date.
*   **Card "Ce se poate construi din acest semnal":** maximum 3 variante.
*   **Sidebar:** evoluția semnalului, AI Insight, stadiu semnal (`Idee`, `Validare date`, `Semnal activ`, `Validat public`, `Pitch pregătit`).
*   **Regulă AI:** formulare obligatorie de tip `Recomandare bazată pe date agregate și semnale disponibile.`

### 4.3. Pagina Mesaje (Imaginea 2)
*   Layout tipic chat (stânga conversații, centru chat).
*   **Sidebar Dreapta (Contextual):** Afișează *Despre oportunitate*, *Despre companie* și *Conversație privată și securizată*.
*   **Regulă:** chat-ul se deschide doar după introducere acceptată sau potrivire validă.

### 4.4. Pagina Profil & Gamification (Imaginea 3)
*   Profil multi-obiectiv, dar simplu.
*   Roluri/obiective: `Construiesc primul business`, `Caut investitor`, `Caut furnizor`, `Vreau să investesc`, `Ofer servicii / sunt furnizor`, `Partener operațional`.
*   Include: industrii de interes, zone, ce caută acum, oportunități urmărite, activitate recentă, profil investitor activ, profil fondator activ.
*   **Puncte IQ:** recompensează acțiuni cu valoare, nu clickuri triviale.
*   **Sistem de Promovare:** modifică doar vizibilitatea temporară, niciodată scorul organic.

### 4.5. Onboarding (Imaginea 5)
*   Flux scurt: `Locație -> Industrii -> Obiectiv`.
*   Obiective: `Construiesc primul business`, `Vreau să investesc`, `Ofer servicii / furnizor`.
*   Opțional: interese pe semnale, oportunități, parteneriate.

### 4.6 Spațiu De Oportunitate (fără meniu nou)
Se deschide contextual din `Construiește ideea`, `Dezvoltă această idee`, `Vezi oportunitatea`, `Completează pitch`.

*   Titlu: `Spațiu de oportunitate`
*   Stepper: `Idee -> Validare -> Plan -> Pitch`
*   Secțiuni:
    * Problema & clientul țintă
    * Soluția & modelul de business
    * Semnale suport & date
    * Ce cauți acum: investitor / finanțator / furnizor / partener / validare
*   Sidebar:
    * pregătit pentru discuție;
    * urmăritori;
    * persoane interesate;
    * ce lipsește pentru a deveni pregătit.
*   Acțiuni:
    * Salvează
    * Completează pitch
    * Trimite spre potriviri

## 5. Modele de Date (Esențiale pentru Backend/State)

### 5.1 Entități principale
*   `User`
*   `UserProfile`
*   `CompanyProfile`
*   `Signal`
*   `Opportunity`
*   `Pitch`
*   `SignalInteraction`
*   `OpportunityDraft`
*   `Match`
*   `IntroductionRequest`
*   `Conversation`
*   `Message`
*   `IQPointsLedger`
*   `Promotion`

### 5.2 Reguli de ownership
*   orice `UserProfile`, `OpportunityDraft`, `Pitch`, `Message`, `IntroductionRequest`, `SavedSignal` trebuie să aibă ownership explicit prin `userId`;
*   orice entitate de companie trebuie să aibă ownership sau membership explicit prin `companyId` + `userId`;
*   pentru date colaborative se folosește model de membership/ACL, nu acces implicit.

### 5.3 Semnal vs oportunitate vs pitch
*   `Signal` este public/semipublic și agregat;
*   `Opportunity` poate fi:
    * publică,
    * privată,
    * partajată doar cu potriviri acceptate;
*   `Pitch` este by default privat sau partajat controlat, niciodată public complet prin default.

## 6. Securitate & Data Isolation (Reguli Absolute)
*   **Identități Ascunse:** În pagina de Potriviri, identitatea (nume/firmă) este ascunsă/anonimizată până la acceptarea cererii de contact.
*   **Fără Endpoint-uri Deschise:** Orice query pentru mesaje, potriviri, pitch-uri, profiluri private sau tranzacții IQ trebuie să filtreze prin `userId` sau `companyId` al apelantului.
*   **Izolare de date / tenancy logică:** nu se creează baze de date separate fizic pentru fiecare utilizator în MVP; se folosește **o singură bază de date cu izolare strictă la nivel de rând** prin ownership, filtre și politici de acces. Dacă apare nevoie enterprise mai târziu, se poate trece la tenant-per-organization.
*   **Date publice vs private:** `Signal` și agregatele pot fi publice; `OpportunityDraft`, `Pitch`, `Message`, `IntroductionRequest`, `saved/followed/interested` rămân private sau partajate controlat.
*   **Mesagerie controlată:** mesajele se pot deschide doar după acceptare; nu există chat liber între conturi fără context și consimțământ.
*   **Anti-Spam & Calitate:** limitare solicitări introducere/zi, pitch minim complet înainte de intro, profil complet pentru fondator, profil validat pentru investitor/furnizor.
*   **Anti-Spam Gamification:** se implementează rate-limiting la acordarea de puncte; clickurile simple sunt plafonate sau nu sunt recompensate.
*   **Separare AI/Date:** AI-ul primește metricile calculate din backend și doar le sumarizează text. Backend-ul calculează scorul, nu AI-ul.
*   **Compliance de limbaj:** platforma nu promite finanțare, investiție sau succes; doar facilitează validare, structurare și introduceri relevante.

## 7. Direcția De Execuție

### 7.1 Ce există deja în proiect
*   rute și layout de bază pentru `Acasă`, `Semnale`, `Potriviri`, `Mesaje`, `Profil`, `Onboarding`, `Detaliu semnal`, `Explorare rapidă`;
*   componente reutilizabile precum `SignalCard`, `QuickExploreMap`, `PublicLayout`;
*   mock data pentru semnale;
*   hook-uri locale pentru profil, notificări și companii, cu unele puncte de integrare spre API;
*   fundație de oportunitate cu `OpportunityDraft`, `IntroductionRequest`, `workspace snapshot`, `visibility tiers` și `controlled messaging`;
*   policy layer pentru acces, ownership, introduceri și vizibilitate;
*   local API shim și repository layer care simulează contractele unui backend real.

### 7.2 Ce lipsește
*   backend final cu DB reală și ownership server-side autentic;
*   persistarea reală multi-actor pentru introduceri, thread-uri și mesaje;
*   counterpart real care poate accepta/respinge introduceri;
*   flux complet real `Construiește ideea -> Spațiu de oportunitate -> Pitch -> Potriviri -> Intro`;
*   pipeline real de generare a semnalelor din surse multiple;
*   algoritm explicit de distribuție/promovare bazat pe interacțiuni calificate și outcome;
*   separarea executabilă dintre `Truth Score` și `Distribution Score`;
*   controale anti-spam, anti-gaming și versionare de algoritm.

### 7.3 Plan incremental obligatoriu
1. **Stabilizare produs & SSOT**
   - finalizare model conceptual și reguli de securitate.
2. **Refactor UI pentru noua promisiune**
   - `Acasă`
   - `Semnale`
   - `Detaliu semnal`
   - `Spațiu de oportunitate`
   - `Profil`
3. **Introducerea modelelor de domeniu**
   - `Signal`
   - `Opportunity`
   - `Pitch`
   - `Match`
   - `IntroductionRequest`
4. **Implementare ownership/auth pe server**
   - endpoints `/me/*`
   - politici de acces
   - segregare public/privat
5. **Implementare interacțiuni reale**
   - urmărește
   - mă interesează
   - construiește ideea
   - solicită intro
6. **Implementare flux de oportunitate**
   - draft -> validare -> pitch -> matching
7. **Definire executabilă a algoritmilor**
   - `Signal generation pipeline`
   - `Truth Score`
   - `Distribution Score`
   - praguri de publicare
   - explainability
   - bias / risk ceilings
8. **Implementare scoruri BI și ranking**
   - scoring determinist
   - confidence
   - risk
   - bias
   - ranking personalizat
9. **Implementare promovare / distribuție controlată**
   - interacțiuni calificate
   - outcome evidence
   - decay
   - anti-gaming
   - promoted visibility marcată clar
10. **Implementare puncte IQ și promovare comercială**
   - punctele nu rescriu scorurile organice
   - promovarea cumpără doar expunere marcată, nu adevăr de piață

### 7.3.1 Plan De Bătaie Pentru Algoritmi
Ordinea corectă este:

1. **SSOT și contracte**
   - definim intrări, ieșiri, praguri și stări de publicare;
   - separăm `generation`, `truth`, `distribution`, `promotion`.
2. **Contracte de cod**
   - introducem tipuri explicite pentru:
     - `SignalGenerationInput`
     - `SignalCandidate`
     - `SignalPublicationStage`
     - `SignalDistributionScore`
     - `QualifiedEngagementAggregate`
3. **Pipeline determinist minim**
   - implementăm varianta fără AI creativ;
   - AI doar explică rezultatul.
4. **Auditabilitate**
   - versiune de algoritm;
   - explainability;
   - motive de promovare / plafonare / blocare.
5. **Abia apoi feed real**
   - feed-ul consumă algoritmii după ce aceștia pot fi explicați și apărați.

### 7.4 Principiu operațional
Nu construim două produse:
* unul cu semnale;
* unul cu idei/pitch-uri.

Construim un singur sistem coerent, în care:
* semnalul este baza;
* oportunitatea este evoluția;
* pitch-ul este stadiul de discuție;
* potrivirile și introducerile sunt controlate.
