# OpportunIQ — Specificația Algoritmului de Semnale (Signal Engine Spec)

> **Statut:** Specificație de implementare. Extinde `OPPORTUNIQ_V2_SSOT.md` (secțiunile A, B, B.1, B.2) fără să contrazică nicio regulă existentă.
> **Relația cu SSOT:** SSOT definește CE este permis (surse, restricții, praguri, etape de publicare). Acest document definește CUM se calculează, CUM se compară intern semnalele și CUM se auto-îmbunătățește sistemul.
> **Contracte de cod referențiate:** `signal-algorithm-contract.ts`, `signal-score-contract.ts`, `signal-scoring.ts`, `signal-source-contract.ts`, `signal-source-registry.ts`, `signal-evidence-contract.ts`, `signal-generation-pipeline.ts`.

---

## 0. Principiul de proiectare

Sistemul nu caută „semnalul perfect". Sistemul construiește **bucla care învață ce este un semnal bun**:

```
Evidențe → Scor determinist → Publicare pe niveluri → Expunere controlată
→ Validare umană ponderată → Outcome-uri reale → Recalibrarea ponderilor
```

Analogia de arhitectură este motorul de căutare modern:
- **Relevanță** = potrivirea cerere/ofertă (Gap real, nu impresie);
- **Autoritate** = triangulare între surse independente + credibilitatea validatorilor umani;
- **Prospețime** = decay pe profil de sursă (există deja în `SignalSourceFreshnessProfile`);
- **Feedback comportamental** = engagement calificat, normalizat pe expunere, ponderat pe credibilitatea actorului;
- **Explorare/exploatare** = cotă de feed rezervată semnalelor emergente pentru a genera date de învățare.

Regulile absolute moștenite din SSOT rămân neatinse:
1. AI-ul interpretează, nu generează matematică.
2. Lipsa datelor scade încrederea, nu umple golurile cu optimism.
3. Scor_Semnal și ConfidenceScore sunt entități separate.
4. Generarea ≠ ranking-ul din feed ≠ promovarea.

---

## 1. Universul de calcul: Celula

### 1.1 Definiție

```
Celulă = (vertical, localitate)
```

- **Vertical** = nișă de business cu nume uman, mapată pe 1..n coduri CAEN (taxonomia există în `industry-taxonomy.ts` / `ro-taxonomies.ts`).
- **Localitate** = UAT (există în `romania-localities.json`), cu ierarhie localitate → județ → regiune.

### 1.2 Praguri de viabilitate (filtre hard, pre-scoring)

Fiecare vertical declară praguri minime. Celulele care nu trec NU intră în pipeline (economisește compute și previne semnale absurde):

```ts
type VerticalViabilityFloor = {
  verticalKey: string;
  minCatchmentPopulation: number;     // ex: fitness ≥ 8.000; clinică dentară ≥ 5.000
  minIncomeBand?: "low" | "mid" | "high"; // pentru verticale premium
  demographicRequirement?: {          // ex: creșă → pop 0-6 ani ≥ 300
    ageBand: string;
    minCount: number;
  };
  seasonalOnly?: boolean;             // ex: turism litoral → tratat separat
};
```

### 1.3 Aria de captare (catchment)

Populația relevantă a unei celule NU este doar populația localității:

```
catchment_population(celulă) = Σ populație(loc_i) × decay(dist_i)
  unde decay(d) = 1 pentru d ≤ 5km, 0.5 pentru 5–15km, 0.2 pentru 15–30km, 0 peste
  (praguri per vertical: un hipermarket atrage de la 30km, o covrigărie de la 2km)
```

Fiecare vertical are `catchmentRadiusKm` propriu în taxonomie.

---

## 2. Registrul surselor și orchestrarea dinamică (aliniat la `SignalSourceRegistryEntry` + `NormalizedSourceObservation`)

### 2.1 REGULA DIVERSITĂȚII DE TIPURI (gating fundamental, nou)

Triangularea se măsoară pe **ROLURI de sursă**, nu pe număr de surse. Trei surse de review-uri care spun același lucru = o singură poveste repetată de trei ori. Cerere + ofertă + problemă care converg independent = triangulare reală.

```
feed_visible:            ≥ 2 surse din ≥ 2 ROLURI diferite
featured_signal:         ≥ 4 surse din ≥ 3 ROLURI diferite,
                         obligatoriu: demand + supply + (structural SAU problem)
buildable_opportunity:   toate cele 4 roluri externe acoperite + validare internal
```

Consecință în `SourceReliability` (§4.1): acoperirea se calculează întâi per rol, apoi se combină între roluri. Lipsa totală a unui rol NU poate fi compensată de excesul altuia.

### 2.2 Registrul complet al surselor de top

Fiecare intrare se mapează 1:1 pe câmpurile `SignalSourceRegistryEntry` (accessMode, trustWeightClass, geoResolution, legalUsageClass, freshnessProfile, status). Cost: T0 = gratuit bulk, T1 = ieftin/quota, T2 = plătit per apel.

#### Rol `structural` — baza de cerere și context economic

| Sursă | Ce demonstrează | Acces | Trust | Geo | Fereastră | Cost |
|---|---|---|---|---|---|---|
| INS Tempo | populație, venituri, structură vârste | `official_dataset` | high | județ (unele: localitate) | 18 luni | T0 |
| Recensământ 2021 | demografie fină per UAT | `official_dataset` | high | localitate | static (bază) | T0 |
| Eurostat regional | comparație NUTS3, PIB regional | `official_dataset` | high | regiune | 24 luni | T0 |
| BNR + macro | context: dobânzi, inflație, credit | `official_dataset` | high | național | 6 luni | T0 |
| Presă locală (RSS) + Google News | evenimente structurale: fabrici deschise/închise, investiții anunțate | `official_api`/RSS | medium | localitate | 3 luni | T1 |
| Storia / Imobiliare.ro (comercial) | disponibilitate spații, direcție chirii | conditional | conditional | localitate | 3 luni | T1 |

#### Rol `demand` — interes activ și direcție

| Sursă | Ce demonstrează | Acces | Trust | Geo | Fereastră | Cost |
|---|---|---|---|---|---|---|
| Google Trends | direcția interesului, sezonalitate | `official_query_interface` | medium-high | județ | 3 luni | T0 |
| **Google Ads Keyword Planner** | **volume ABSOLUTE de căutare per regiune** — superior Trends pentru mărime, nu doar direcție | `official_api` (cont Ads) | high | județ/oraș mare | 3 luni | T1 |
| YouTube search + autocomplete | cerere emergentă, întrebări frecvente | conditional | conditional | național | 3 luni | T1 |
| Căutări interne pe platformă | ce caută utilizatorii OpportunIQ | `internal_event_stream` | high | localitate | live | T0 |

#### Rol `problem` — nemulțumire recurentă, gap de calitate (motorul review intelligence)

| Sursă | Verticale acoperite | Acces | Trust | Geo | Fereastră | Cost |
|---|---|---|---|---|---|---|
| **Google Reviews (Places Details API)** | toate serviciile locale — sursa problem #1 | `official_api` | high | localitate | 6 luni | T2 |
| **TripAdvisor Content API** | HoReCa, turism, experiențe (DOAR aici — CategoryFit) | `official_api` | high | localitate | 6 luni | T2 |
| Trustpilot API | servicii online, ecommerce, B2B | `official_api` | medium | național | 6 luni | T1 |
| Booking.com Partner API | cazare (CategoryFit strict) | `official_api` | high | localitate | 6 luni | T2 |
| Facebook Pages (Graph API) | ratings + recomandări locale | `official_api` (limitat) | medium | localitate | 6 luni | T1 |
| Glovo / Tazz ratings | HoReCa livrare | conditional (fără API oficial) | conditional | localitate | 3 luni | — |
| eMAG Marketplace reviews | produse retail (verticale de produs) | conditional | conditional | național | 6 luni | — |

#### Rol `supply` — densitate, capacitate, sănătatea ofertei

| Sursă | Ce demonstrează | Acces | Trust | Geo | Fereastră | Cost |
|---|---|---|---|---|---|---|
| ONRC via data.gov.ro | firme active/înmatriculări/radieri per CAEN × localitate | `official_dataset` | high | localitate | 6 luni | T0 |
| **MF/ANAF bilanțuri** | CA, profit, angajați per concurent — SĂNĂTATEA ofertei, nu doar numărul | `official_dataset` | high | entitate | 12 luni | T0 |
| Google Places (count + detalii) | ofertă reală vizibilă clienților | `official_api` | high | localitate | 6 luni | T2 |
| OpenStreetMap POI | verificare încrucișată a densității Places (gratis) | `official_dataset` | medium | localitate | 12 luni | T0 |
| eJobs / BestJobs / OLX Joburi | viteza angajărilor = proxy de expansiune a concurenței | conditional/RSS | medium | localitate | 3 luni | T1 |

#### Rol `internal` — validarea comportamentală

Evenimentele calificate din `QualifiedEngagementEventType`, ponderate cu UserRank (§6). Trust: high (auditabil complet), geo: localitate, fereastră: live.

### 2.3 Pâlnia de colectare pe cost — algoritmul dinamic economic

**Problema:** Places + TripAdvisor costă per apel. Nu poți chema T2 pe 300.000 de celule.
**Soluția:** sursele ieftine FILTREAZĂ, sursele scumpe CONFIRMĂ.

```
PASUL 1 — Screening T0 (toate celulele viabile, nightly, cost 0):
    INS + ONRC + MF + OSM + Trends → D, S, G preliminar
    → shortlist: celule cu G × D peste percentila 80 a verticalului

PASUL 2 — Rafinare T1 (top ~20% din shortlist):
    Keyword Planner (volume reale) + joburi + RSS + imobiliar
    → M, CrossSourceConsistency preliminar
    → candidați: celulele care se apropie de pragurile de publicare

PASUL 3 — Confirmare T2 (doar candidații, sute nu mii):
    Places Details + Reviews (+ TripAdvisor unde CategoryFit)
    → Q, review intelligence, materia primă pentru dosarul calitativ

GUARD DE BUGET:
    cap lunar per sursă T2 (configurabil, ex: 500 celule × ~15 apeluri)
    coada de prioritate = information gain așteptat
    (celula cea mai APROAPE de pragul de publicare se îmbogățește prima —
     acolo un apel T2 schimbă cel mai probabil decizia publish/suppress)
```

### 2.4 Orchestrarea dinamică: health, fallback, reponderare

1. **Health per adaptor** (`SignalSourceStatus`): `ready` / `degraded` / `blocked`, verificat la fiecare rulare; sursă `degraded` 3 rulări consecutive → alertă operator.
2. **Lanțuri de fallback declarate per rol** (niciodată improvizate la runtime):
   - Places blocat → OSM density + review-uri din cache cu penalizare de Freshness explicită;
   - Trends indisponibil → Keyword Planner volume lunare;
   - TripAdvisor fără acoperire → Google Reviews singur, cu `CoverageCompleteness` redus.
3. **Reponderare DOAR în interiorul rolului:** dacă o sursă de `problem` lipsește, celelalte surse de `problem` se renormalizează. Lipsa TOTALĂ a unui rol nu se maschează niciodată — se vede în gating (§2.1) și în `ConfidenceScore`. Regula SSOT rămâne suverană: lipsa datelor nu crește optimismul.
4. **Snapshot brut per observație:** fiecare `NormalizedSourceObservation` păstrează payload-ul sursă (sau hash + referință) pentru re-verificare — susține `MethodStability` din ConfidenceScore.
5. **Profil de surse per vertical** (`SourceProfileKey` există deja în cod): fiecare vertical declară sursele core vs auxiliare. TripAdvisor e core pentru pensiuni și zero pentru service-uri auto; Booking e core doar pentru cazare; eMAG doar pentru verticale de produs. `CategoryFit` din SSOT se calculează direct din acest profil.

### 2.5 Regula de admisibilitate (moștenită din SSOT, formalizată)

O observație intră în scoring doar dacă:
1. sursa e `enabledForTruth` în registry — sursele `conditional` fără API oficial (Glovo, eMAG, OLX) pot fi `enabledForDistribution` sau context, dar NU adevăr de scoring;
2. trece de fereastra de prospețime a profilului ei (altfel intră cu penalizare, conform SSOT §A.1.2);
3. are `evidenceRefs` non-goale (auditabilitate — `signal-source-audit.ts`);
4. `legalUsageClass` permite utilizarea pentru scopul cerut — API oficial înaintea oricărei alternative; unde ToS interzice, sursa nu intră, indiferent cât de utilă ar fi.

---

## 3. Metricile cantitative de celulă

Acestea alimentează componentele `Scor_Semnal` din SSOT §B (ponderile 25/20/15/15/10/10/5 rămân baseline-ul).

### 3.1 D — Cerere Locală (alimentează `Cerere_Locala`, 25%)

```
D = w_pop × PopFit + w_income × IncomeFit + w_search × SearchInterest + w_growth × DemandGrowth

PopFit        = catchment_population ajustat demografic per vertical (0–100, percentilă națională)
IncomeFit     = venit median județ / venit median național, plafonat [0.5 .. 1.5], scalat 0–100
SearchInterest= volum Trends per capita, medie mobilă 6 luni, percentilă în verticalul respectiv
DemandGrowth  = panta regresiei liniare pe 24 luni a SearchInterest (normalizată z-score)

Ponderi inițiale: w_pop=0.35, w_income=0.15, w_search=0.30, w_growth=0.20
```

### 3.2 S — Ofertă și sănătatea ei (alimentează `Gap_Oferta` și `SignalMarketSaturation`)

```
S_count   = firme active CAEN în catchment (ONRC) ∪ locații Google Places (dedup pe nume+adresă)
S_capacity= Σ angajați (MF) — proxy de capacitate, nu doar număr de entități
S_health  = medie ponderată: trend CA concurenți (MF, 3 ani) + rating mediu (Wilson lower bound)
```

**Regulă anti-eroare:** `S_count` folosește maximul dintre ONRC și Places, nu suma (multe firme au CAEN generic; multe locații n-au firmă locală).

### 3.3 G — Gap prin peer-benchmarking (INIMA ALGORITMULUI — completează SSOT §B unde `Gap_Oferta` nu are formulă)

```
1. Grupează localitățile în cohorte-pereche:
   cohortă = (tier populație) × (bandă venit județ)
   tiers: <5k, 5–20k, 20–50k, 50–100k, 100k+, București

2. Pentru fiecare (vertical, cohortă):
   expected_density = MEDIANA( S_count / catchment_population × 10.000 )
   calculată DOAR pe localitățile cu date complete (nu se umplu goluri)

3. Pentru celula țintă:
   actual_density = S_count / catchment_population × 10.000
   raw_gap = (expected_density − actual_density) / expected_density   // ∈ (−∞, 1]

4. Gap_Oferta (0–100) = clamp(raw_gap, 0, 1) × 100 × DemandStrengthMultiplier
   unde DemandStrengthMultiplier = 0.5 + 0.5 × (D / 100)              // gap fără cerere nu e gap
```

**De ce e câștigătoare formula:** produce afirmații verificabile și oneste — *„localitățile comparabile au în medie 4,2 unități la 10.000 de locuitori; aici sunt 1,1"*. Zero presupuneri inventate. Se auto-calibrează pe măsură ce acoperirea de date crește. Respectă interdicția SSOT de estimări financiare fabricate.

**Gap de calitate (al doilea tip de gap, alimentează `Intensitate_Problema`):**

```
QualityGap există când: S_count ≥ expected_density × 0.8   // ofertă suficientă cantitativ
                     ȘI WilsonLowerBound(rating agregat) < 3.8
                     ȘI review_volume ≥ 30                  // robustețe statistică
```

Semnalul rezultat e de tip diferit (`problem_recurrence` în `SignalGenerationPattern`), cu narativ diferit: „oferta există dar dezamăgește".

### 3.4 M — Momentum și starea ferestrei (alimentează `Trend`, 15%)

```
M = 0.4 × panta(SearchInterest, 24 luni)
  + 0.3 × panta(înmatriculări CAEN în județ, 24 luni) × (−1 dacă gap se închide)
  + 0.2 × panta(demografie/venit, 3 ani)
  + 0.1 × activitate imobiliar comercial (listări spații, direcție chirii)

WindowState (etichetă publică pe semnal):
  "opening"  : gap mare + înmatriculări concurente ≈ 0 + cerere ↑
  "active"   : gap prezent + primele înmatriculări apar
  "closing"  : înmatriculări accelerate în ultimele 2 trimestre → penalizare în ranking, banner explicit
```

### 3.5 Robustețe statistică (gating peste tot unde intră rating-uri/review-uri)

```
Rating agregat folosit = Wilson score lower bound (95%) — niciodată media brută
  4 recenzii de 5★  → lower bound ≈ 2.9 (corect: încredere mică)
  400 recenzii de 4.6★ → lower bound ≈ 4.5 (corect: încredere mare)

Praguri minime de volum:
  claim de calitate slabă a ofertei: ≥ 30 review-uri agregate pe celulă
  temă de plângere publicabilă:      ≥ 5 mențiuni independente (SignalReviewTheme.mentions ≥ 5)
```

---

## 4. ConfidenceScore — completări la formula SSOT §B.1.1

Formula și ponderile din SSOT rămân neschimbate:

```
ConfidenceScore = SourceReliability×0.25 + Freshness×0.20 + CrossSourceConsistency×0.20
                + GeoGranularity×0.10 + CategoryFit×0.10 + CoverageCompleteness×0.10
                + MethodStability×0.05
```

Sub-specificații de implementare:

### 4.1 SourceReliability — acoperire prin triangulare PE ROLURI

```
Per rol:   RoleCoverage(r) = 1 − Π(1 − w_i)  peste sursele rolului r care confirmă aceeași direcție
           w_i = trustWeightClass: high=0.5, medium=0.3, conditional=0.15

Combinare: SourceReliability = media RoleCoverage pe rolurile CERUTE de stage-ul țintă (§2.1),
           cu 0 pentru rolurile complet lipsă
           → lipsa unui rol întreg trage scorul jos; excesul altui rol NU compensează

Minim 2 surse din 2 roluri diferite (regula SSOT, întărită prin §2.1).
A 3-a și a 4-a sursă din ACELAȘI rol adaugă cu randament descrescător — corect matematic prin formulă.
```

### 4.2 CrossSourceConsistency — detectarea poveștilor contradictorii

```
Verificări pe perechi (demand vs supply vs problem):
  Trends ↑  dar radieri ↑ și review-uri în stagnare  → inconsistență majoră: cap la 0.4
  Trends ↑  și înmatriculări ↑ și review-uri active  → poveste consistentă „piață în formare"
  Trends ↓  dar gap cantitativ mare                  → verifică migrarea cererii online / substituție
Scor = 1 − (nr_contradicții_majore × 0.3 + nr_contradicții_minore × 0.1), clamp [0,1]
```

### 4.3 Praguri de publicare (mapate 1:1 pe `SignalPublicationStage`)

| ConfidenceScore | Stage | Reguli |
|---|---|---|
| < 40 | `internal_candidate` sau `suppressed` | invizibil public; motiv în `SignalSuppressionReason` |
| 40–59 | `feed_visible` (etichetă „Semnal emergent") | fără CTA de introducere; doar follow/feedback |
| 60–79 | `feed_visible` („Semnal validat") | toate CTA-urile active |
| ≥ 80 | eligibil `featured_signal` / `buildable_opportunity` | DOAR dacă dosarul calitativ (§5) e complet, inclusiv secțiunea de contra-evidențe |

### 4.4 Detecție de anomalii (alimentează `manipulationRiskScore` existent)

```
Spike fără persistență: SearchInterest > μ + 3σ într-o singură lună, revenit sub μ + 1σ în luna următoare
  → exclus din DemandGrowth (eveniment viral ≠ cerere structurală)
Review-bombing: > 40% din review-urile unei celule în < 30 zile, distribuție bimodală 1★/5★
  → review-urile din fereastra respectivă intră cu pondere 0.2
```

---

## 5. Stratul calitativ (LLM cu lesă scurtă)

Se aplică DOAR celulelor care au trecut pragul cantitativ (`ConfidenceScore ≥ 40` și `Scor_Semnal ≥ prag configurabil`). Structura de ieșire este cea din `signal-evidence-contract.ts` (`SignalLiveSentiment`, `SignalReviewTheme`, `SignalReviewQualitative`) — deja corect proiectată cu `cites` obligatorii.

### 5.1 Reguli de generare (gating dur)

1. **Fiecare propoziție cu conținut factual citează ≥ 1 `evidenceRef`.** Propozițiile fără citare se elimină automat înainte de publicare (validator programatic, nu prompt).
2. **Zero cifre generate de AI.** Cifrele vin exclusiv din câmpurile calculate; LLM-ul le poate REFERENȚIA, nu produce.
3. **Temperatura joasă, output structurat (JSON schema), retry cu validare.**
4. **Secțiunea „Riscuri și contra-evidențe" este OBLIGATORIE pentru stage ≥ `featured_signal`.** Un semnal fără contra-argumente documentate nu poate fi featured. Aceasta este diferența dintre o platformă de încredere și un generator de hype.

### 5.2 Conținutul dosarului (per semnal publicat)

```
1. De ce acum           — sinteza Momentum + WindowState (citează evidențe)
2. Temele plângerilor   — clustere din review-uri concurenți, cu businessLens și mentions ≥ 5
3. Peisajul competitiv  — incumbenți: scară (MF: angajați, CA), slăbiciuni (review themes)
4. Riscuri & contra-evidențe — ce ar invalida semnalul: demografie ↓? sezonalitate?
                                concurent nou înmatriculat? (ONRC check la zi)
5. Checklist de verificare în teren — 3–5 pași concreți, generați pe template per vertical
                                       (drive engagement + validare crowdsourced §6)
```

---

## 6. Validarea comunitară ponderată (UserRank) — extinde `Validare_Comunitara` și `QualifiedEngagementAggregate`

SSOT dă validării comunitare 5% din Scor_Semnal. Corect pentru scorul intrinsec. Dar pentru RANKING-ul din feed și pentru maturizarea spre `buildable_opportunity`, validarea umană ponderată devine centrală. Aici este „PageRank-ul oamenilor".

### 6.1 UserRank (0–1) — credibilitatea validatorului

```
UserRank = BaseVerification × (1 + DomainProximity + GeoProximity + TrackRecord), clamp [0, 1]

BaseVerification: cont nou neverificat = 0.05
                  email+telefon verificate = 0.2
                  profil cu firmă atașată (CUI validat) = 0.4

DomainProximity:  +0.3 dacă utilizatorul operează în verticalul semnalului (CAEN match pe firma atașată)
                  +0.15 pentru vertical adiacent (distanță 1 în taxonomie)

GeoProximity:     +0.2 dacă utilizatorul e din localitatea semnalului
                  +0.1 dacă e din județ

TrackRecord:      +0.05 × (validări trecute confirmate de outcome-uri), max +0.3
                  −0.1 × (validări infirmate ulterior), poate scădea sub bază
```

**Efect:** un patron de service auto din Rădăuți care confirmă un semnal auto din Rădăuți contează de ~10× mai mult decât un cont anonim din alt județ. Sistemul își descoperă singur experții prin TrackRecord.

### 6.2 Ierarhia acțiunilor (mapată pe `QualifiedEngagementEventType` existent)

| Eveniment | Pondere brută | Notă |
|---|---|---|
| `view` | 0.1 | semnal slab, volum mare |
| `open_detail` | 0.3 | |
| `follow` / `save` | 1 | |
| **feedback structurat: „Confirm din teren" / „Infirm"** | **3 / 4** | text obligatoriu ≥ 100 caractere; devine `Evidence` cu rol `internal`; **infirmarea valorează mai mult** — prinde fals-pozitive; recompensată vizibil cu puncte IQ |
| `express_interest` | 5 | |
| `build_opportunity` | 6 | |
| `request_introduction` | 8 | |
| `introduction_accepted` | 12 | |
| `useful_conversation` | 15 | |
| `offer_tested` | 20 | |
| `collaboration_started` | 30 | ground truth |
| `project_launched` | 40 | ground truth suprem |

### 6.3 CommunityScore — normalizat pe expunere (regula anti-popularitate)

```
CommunityScore(semnal) = Σ [ pondere(eveniment) × UserRank(actor) × decay(recență, half-life 60 zile) ]
                         ─────────────────────────────────────────────────────────────
                                        max(impresii, 50)^0.7

Normalizarea sub-liniară pe impresii: un semnal din Rădăuți văzut de 40 de oameni cu 10 cereri
de introducere BATE un semnal din București văzut de 4.000 cu 20 de save-uri.
Fără asta, feed-ul degenerează în concurs de popularitate al orașelor mari.
```

Reguli:
- un singur eveniment ponderat per (user, semnal, tip) — repetițiile nu adună;
- `repeatedActorRatio` (există în contract) > 0.5 → penalizare (aceiași 5 oameni nu fac o validare de piață);
- promotorul/autorul unui semnal are pondere 0 pe propriul semnal.

### 6.4 Bucla înapoi în ConfidenceScore

Feedback-urile structurate „Confirm/Infirm din teren" devin observații cu rol `internal` și intră în `CrossSourceConsistency`:
- 3+ confirmări de la UserRank ≥ 0.5 → consistency boost;
- 2+ infirmări documentate de la UserRank ≥ 0.5 → semnalul intră automat în re-verificare; dacă sursele externe nu pot contrazice infirmarea, stage retrogradat + notă publică de transparență („Semnal retrogradat pe baza verificării în teren — mulțumim comunității").

**Transparența retrogradărilor este o funcție de încredere, nu o rușine. Platformele care nu-și recunosc fals-pozitivele mor.**

---

## 7. FeedRank — ranking-ul din feed (separat de Scor_Semnal, conform SSOT §B.2 „nu trebuie confundat")

### 7.1 Formula compozită

```
FeedRank = (ConfidenceScore/100)^0.35 × (Scor_Semnal/100)^0.30 × (Momentum_norm)^0.15
         × (1 + CommunityScore_norm)^0.20 × FreshnessDecay(ultima re-verificare, half-life 45 zile)
```

**Multiplicativ intenționat:** un semnal cu evidențe slabe NU poate fi salvat de hype comunitar (Confidence^0.35 îl trage jos), și invers — evidențe perfecte fără niciun interes uman se sting prin factorul comunitar. Exponenții sunt configurația inițială; devin ponderi învățate în Faza 3 (§9).

### 7.2 Re-ranking de diversitate (MMR)

```
La construcția feed-ului (top N):
  penalizare 0.85^k pentru al k-lea semnal consecutiv din același vertical
  penalizare 0.90^k pentru al k-lea din același județ
Niciodată > 3 semnale consecutive din aceeași industrie sau geografie.
```

### 7.3 Cota de explorare (explore/exploit)

```
10–15% din sloturile de feed → semnale „emergente" (Confidence 40–59) cu incertitudine mare,
selectate prin uncertainty sampling (cele pe care sistemul știe cel mai puțin).
Etichetate vizibil „Semnal emergent — ajută la verificare".
Scop: generarea datelor de engagement fără de care semnalele noi nu pot fi niciodată evaluate.
```

### 7.4 Personalizare (UserAffinity) — stratul final

```
FeedScore(user, semnal) = FeedRank × UserAffinity

UserAffinity = 0.35 × IndustryMatch   (profil/interese vs vertical; distanță în taxonomie)
             + 0.25 × GeoMatch        (județe țintă declarate + domiciliu, decay pe distanță)
             + 0.25 × BehaviorMatch   (content-based la început: similaritate cu semnalele
                                       salvate/urmărite; collaborative filtering după ≥ 10k interacțiuni)
             + 0.15 × RoleMatch       (investitor → semnale care cer capital;
                                       operator → semnale care cer execuție;
                                       furnizor → semnale din lanțul lui de aprovizionare)

Cold start: onboarding-ul existent (industrii + județe + rol) → pur content-based.
```

---

## 8. Anti-gaming (obligatoriu din ziua 1)

1. Voturi ponderate DOAR de la conturi verificate (UserRank ≥ 0.2 pentru a conta deloc).
2. Velocity caps: max 20 acțiuni ponderate/zi/user; peste → coadă de review.
3. Detecție de inele: grupuri mici care se validează reciproc pe aceleași semnale → ponderare colectivă în jos (Jaccard pe seturile de semnale votate).
4. Autorul nu-și votează semnalul; conturile create în aceeași săptămână cu semnalul au pondere 0 pe el.
5. Orice cifră afișată public are `evidenceRef` auditabil (`signal-source-audit.ts`).
6. Rate-limit pe feedback text + detecție de duplicate near-identical (embedding cosine > 0.95 → un singur vot).

---

## 9. Bucla de învățare — cum devine algoritmul imbatabil

### 9.1 Metrica-nord și guardrails

```
NORD:      rata de colaborări validate = collaborations_started / introduceri_acceptate (pe cohortă lunară)
GUARDRAIL: precizia semnalelor featured = % semnale featured NEinfirmate în 90 zile (țintă ≥ 85%)
GUARDRAIL: acoperire = % județe cu ≥ 1 semnal validat activ
GUARDRAIL: prospețime = % semnale publicate cu toate sursele core în fereastra de freshness
```

### 9.2 Fazele de maturitate ale ponderilor

```
Faza A (0–6 luni):   ponderile din acest document, setate manual. Logging COMPLET al
                     tuturor feature-urilor per semnal per zi (snapshot-uri pentru training viitor).
Faza B (6–12 luni):  regresie logistică — target: „semnalul a produs ≥ 1 introducere acceptată
                     în 60 zile". Features: toate componentele din §3, §4, §6.
                     Ponderile învățate ÎNLOCUIESC exponenții din FeedRank doar dacă
                     AUC > 0.70 pe validare temporală (train pe lunile 1–8, test pe 9–12).
Faza C (12+ luni):   learning-to-rank (LambdaMART sau echivalent) pe perechi de semnale,
                     cu outcome-uri reale ca etichete. Re-antrenare lunară, cu holdout permanent.
```

**Moat-ul:** sursele publice pot fi copiate de oricine. Istoricul de „ce semnale au produs afaceri reale" nu poate fi copiat — și exact pe el se antrenează Faza B/C. Fiecare introducere acceptată face algoritmul mai bun într-un mod pe care concurența nu-l poate replica.

### 9.3 Snapshot-uri obligatorii (fără ele Faza B e imposibilă)

```
La fiecare publicare/actualizare de semnal: rând imutabil cu TOATE feature-urile + scorurile + stage.
La fiecare eveniment calificat: rând cu (user_id, semnal_id, tip, UserRank la momentul acțiunii, timestamp).
Retenție: permanentă. Acesta este activul companiei.
```

---

## 10. Pipeline-ul complet (pseudocod)

```
JOB nightly_signal_engine():
  # 1. INGESTIE (adaptori per sursă, conform signal-source-adapters.ts)
  for source in registry.where(enabledForTruth, status=ready):
      observations += source.adapter.collect()        # NormalizedSourceObservation[]
      audit.log(source, observations)

  # 2. AGREGARE PE CELULE
  for cell in viable_cells():                          # trecute de VerticalViabilityFloor
      cell.evidence = observations.filter(cell)
      if cell.evidence.sourceCount < 2: continue       # regula triangulării

  # 3. METRICI CANTITATIVE
      cell.D  = demand_index(cell)                     # §3.1
      cell.S  = supply_index(cell)                     # §3.2
      cell.G  = peer_benchmark_gap(cell)               # §3.3 — cohorte pereche
      cell.M  = momentum(cell)                         # §3.4
      cell.Q  = quality_gap(cell)                      # §3.3 QualityGap

  # 4. SCORURI (formulele SSOT, neatinse)
      cell.signalScore     = weighted_signal_score(cell)      # SSOT §B
      cell.confidenceScore = confidence_score(cell)           # SSOT §B.1.1 + §4 din acest doc

  # 5. GATING DE PUBLICARE
      cell.stage = publication_stage(confidence, signalScore, qualitative_complete)
      if cell.stage == suppressed: record_suppression_reason(cell)

  # 6. STRAT CALITATIV (doar celule publicabile)
      if cell.stage >= feed_visible:
          dossier = llm_generate(cell.evidence, schema=SignalLiveSentiment)
          dossier = strip_uncited_sentences(dossier)           # validator programatic
          require(dossier.risks_and_counter_evidence) if stage >= featured

  # 7. SNAPSHOT pentru învățare
      snapshot.write(cell.all_features)

JOB realtime_feed(user):
  candidates = signals.where(stage >= feed_visible)
  for s in candidates:
      s.feedRank  = feed_rank(s)                       # §7.1 (CommunityScore la zi)
      s.feedScore = s.feedRank × user_affinity(user, s) # §7.4
  ranked = mmr_diversify(sort(candidates, feedScore))   # §7.2
  return inject_exploration_quota(ranked, 0.12)         # §7.3

ON qualified_event(user, signal, type):
  record_event(user, signal, type, user_rank_at_event_time)
  update_community_score(signal)
  if type in {confirm_field, infirm_field}:
      evidence.add(internal_observation(user, signal))
      recompute_confidence(signal)                      # §6.4 — poate retrograda stage
```

---

## 11. Plan de implementare pe faze

### Faza 1 — „Un semnal real, vândut" (săptămânile 1–6)
**Scop: validarea comercială înaintea automatizării complete.**
- 2 verticale alese pragmatic (recomandare: una cu date bogate de review-uri — HoReCa/servicii auto; una cu gap structural clar — servicii pentru seniori/creșe);
- 3 județe (recomandare: Suceava + 2 comparabile pentru cohorte);
- adaptori REALI T0: ONRC data.gov.ro + INS Tempo + Trends + OSM; T1: Keyword Planner; T2 bugetat: Google Places Details + Reviews (+ TripAdvisor dacă verticalul ales e HoReCa/turism);
- MF bilanțuri: import manual CSV pentru concurenții din celulele candidate (automatizare ulterior);
- pipeline rulat semi-manual, dosare generate cu LLM + validare umană înainte de publicare;
- **livrabil: 10–15 semnale cu Confidence ≥ 60, arătate la 20–30 antreprenori reali. Criteriu de succes: ≥ 5 exprimă interes concret / cer introduceri.**

### Faza 2 — Automatizare și buclă comunitară (lunile 2–4)
- toate adaptoarele pe cron, `nightly_signal_engine` complet;
- UserRank + evenimente calificate + CommunityScore live;
- feed cu MMR + cotă de explorare;
- snapshot-uri de features pornite (NEGOCIABIL ZERO — fără ele nu există Faza C);
- retrogradări transparente funcționale.

### Faza 3 — Învățare și scalare (lunile 5+)
- regresie logistică pe outcome-uri (§9.2 Faza B);
- extindere verticale + județe pe măsură ce cohortele au date;
- collaborative filtering în UserAffinity după ≥ 10k interacțiuni.

---

## 12. Schema de date minimă (aditivă la contractele existente)

```sql
-- celule și snapshot-uri
CREATE TABLE cells (
  id TEXT PRIMARY KEY,               -- vertical_key || ':' || siruta
  vertical_key TEXT NOT NULL,
  siruta TEXT NOT NULL,              -- cod localitate
  county_code TEXT NOT NULL,
  cohort_key TEXT NOT NULL,          -- tier_populatie:banda_venit
  catchment_population INTEGER
);

CREATE TABLE cell_feature_snapshots (
  cell_id TEXT REFERENCES cells(id),
  as_of DATE NOT NULL,
  features JSONB NOT NULL,           -- D, S, G, M, Q + toate sub-componentele
  signal_score NUMERIC, confidence_score NUMERIC, stage TEXT,
  PRIMARY KEY (cell_id, as_of)
);

-- evenimente calificate cu UserRank înghețat la momentul acțiunii
CREATE TABLE qualified_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL, signal_id TEXT NOT NULL,
  event_type TEXT NOT NULL,          -- QualifiedEngagementEventType
  user_rank_at_event NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, signal_id, event_type)
);

-- reputația validatorilor
CREATE TABLE user_rank_ledger (
  user_id TEXT NOT NULL, as_of DATE NOT NULL,
  base_verification NUMERIC, domain_proximity NUMERIC,
  geo_proximity NUMERIC, track_record NUMERIC,
  user_rank NUMERIC NOT NULL,
  PRIMARY KEY (user_id, as_of)
);
```

---

## 13. Ce NU face acest algoritm (limite declarate, aliniate SSOT)

1. Nu produce estimări financiare (bugete, investiții, profituri) — interzis prin SSOT.
2. Nu promite reușită — semnalele sunt ipoteze cu evidențe, nu garanții; UI-ul păstrează formulările interpretative.
3. Nu umple golurile de date cu AI — lipsa se afișează și penalizează încrederea.
4. Nu tratează popularitatea drept adevăr — normalizarea pe expunere și UserRank există exact pentru asta.
5. Nu îngroapă fals-pozitivele — retrogradările sunt publice și recompensate.
