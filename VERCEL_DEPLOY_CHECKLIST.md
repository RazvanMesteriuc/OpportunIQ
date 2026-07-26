# Checklist Deploy Vercel

## Status curent
- Frontend-ul se build-uiește corect prin `npm run build`.
- API-ul din `server/api.mjs` este expus și prin adaptorul serverless `api/[...route].mjs`.
- Store-ul de rapoarte are fallback read-only dacă runtime-ul remote nu permite scriere pe disc.
- Deploy-ul remote este blocat momentan de lipsa tokenului de autentificare Vercel în integrarea de tooling.

## Variabile necesare
- `GOOGLE_MAPS_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Pași înainte de deploy
1. Conectează integrarea/tooling-ul la contul Vercel astfel încât deploy-ul să primească token valid.
2. Configurează variabilele de mediu în proiectul Vercel:
   - `GOOGLE_MAPS_API_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL=gpt-4.1-mini`
3. Rulează local verificările:
   - `npm run build`
   - `node --check server/api.mjs`
   - `node --check server/reports-store.mjs`
   - `node --check api/[...route].mjs`

## Verificări după deploy
1. Verifică health:
   - `/api/health`
2. Confirmă răspunsul health:
   - `runtime` trebuie să arate `vercel`
   - `externalProviders.googlePlaces` trebuie să fie `configured`
   - `externalProviders.openai` trebuie să fie `configured`
3. Verifică endpoint-urile esențiale:
   - `/api/reports`
   - `/api/external/places/text-search`
   - `/api/external/places/details`
   - `/api/external/ai/review-intelligence`
4. Verifică refresh direct pe rute UI:
   - `/`
   - `/semnale`
   - `/laborator-rapoarte`

## Adevăr important
- Chiar dacă deploy-ul reușește, laboratorul de rapoarte în remote nu trebuie tratat ca backoffice de producție.
- Fallback-ul read-only evită crash-uri de runtime, dar nu transformă persistența locală pe disc într-o soluție SaaS reală.
