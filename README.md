# Liferary

Liferary, or 라이프러리, means Life + Library: a quiet library of destiny.

This is a static web app for creating, saving, sharing, searching, and deleting Saju / Four Pillars results. It is designed for GitHub Pages with Supabase as the persistence layer. The service is for entertainment and self-reflection only, not professional advice.

Users choose their own Life ID (`slug`) when creating a result. It must be 4-24 characters using lowercase letters, numbers, hyphen, or underscore, and it is used for later exact search and sharing.

## Tech Stack

- Static frontend: plain HTML, CSS, and JavaScript ES modules
- Deployment target: GitHub Pages
- Database/API: Supabase
- Delete verification: Supabase Edge Function
- Local development fallback: browser `localStorage` mock storage

No real Supabase keys are included. Never put a Supabase service-role key in frontend files.

## Run Locally

From this folder:

```bash
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173/
```

Without Supabase config, the app uses development-only mock storage in `localStorage`. Mock results are shareable only in the same browser.

Optional calculation sample check:

```bash
npm run test:saju
```

## GitHub Pages Deploy

1. Commit the app files at the repository root.
2. In GitHub, open repository settings.
3. Go to Pages.
4. Set `Source` to `Deploy from a branch`.
5. Set `Branch` to `main` and folder to `/root`.
6. For this repository, the app URL should be:

```text
https://mercenary-liferary.github.io/
```

7. If the GitHub Pages URL changes, update these files with the final public URL:
   - `index.html` canonical, OG, Twitter, and hreflang URLs
   - `robots.txt` sitemap URL
   - `sitemap.xml` homepage URLs
   - `js/config.js` `SITE_URL`

Result pages use the user-entered Life ID, for example `result.html?id=my-life-1991`, and include `noindex,nofollow`.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Copy your project URL and anon public key.
5. Edit `js/config.js`:

```js
window.LIFERARY_CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_ANON_PUBLIC_KEY",
  DELETE_FUNCTION_URL: "https://YOUR_PROJECT.supabase.co/functions/v1/delete-result",
  SITE_URL: "https://mercenary-liferary.github.io/"
};
```

The anon key is expected in a public static frontend. The service-role key must only be used inside Supabase Edge Functions.

## Deploy Delete Edge Function

Install and log in to the Supabase CLI. This repo keeps the draft function in `supabase/edge-functions/delete-result/`; Supabase CLI deploys from `supabase/functions/delete-result/`, so copy it once before deploying:

```bash
mkdir -p supabase/functions
cp -R supabase/edge-functions/delete-result supabase/functions/delete-result
supabase functions deploy delete-result --project-ref YOUR_PROJECT_REF
```

Do not set secrets whose names start with `SUPABASE_` through the CLI. Supabase reserves those names and provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to deployed Edge Functions automatically. If you run the function locally, provide those values in your local function environment only and never commit them.

The function accepts:

```json
{
  "slug": "my-life-1991",
  "password": "user password"
}
```

It verifies the stored password hash and sets `deleted_at`, instead of physically deleting the row.

## Environment And Config Variables

Static GitHub Pages cannot read server `.env` files at runtime, so frontend configuration is handled by `js/config.js`.

- `SUPABASE_URL`: public Supabase project URL
- `SUPABASE_ANON_KEY`: public anon key
- `DELETE_FUNCTION_URL`: deployed Edge Function URL
- `SITE_URL`: production homepage URL for metadata and structured data

Do not commit service-role keys.

## Password And Security Notes

- Plain text passwords are never stored.
- The MVP hashes deletion passwords in the browser with PBKDF2-SHA256 and stores the hash.
- The delete Edge Function recomputes the PBKDF2 hash and soft-deletes the row when it matches.
- This avoids plain-text storage, but server-side hashing is still preferred.
- Future production work should add a `create-result` Edge Function and hash passwords server-side with bcrypt or argon2.
- The SQL grants public SELECT only on non-sensitive columns and excludes `password_hash`.
- No public update or delete policy is created.
- Add abuse prevention and rate limiting before operating at public scale.

## Saju Calculation Assumptions

The engine is modular under `js/saju/`.

- `constants.js`: stems, branches, elements, countries, time branches
- `lunar.js`: exact lunar conversion placeholder
- `solarTerms.js`: approximate solar-term boundary module
- `pillars.js`: year, month, day, and hour pillar formulas
- `tenGods.js`: basic Ten Gods relation logic
- `hiddenStems.js`: hidden stem table
- `luckPillars.js`: MVP Daewoon structure
- `analysis.js`: weighted helper analysis using visible elements, hidden stems, and month-season emphasis
- `report.js`: normalized Saju, interpretation profile, and long-form report generation
- `interpreters.js`: localized reflective reading templates
- `calculate.js`: orchestration and sample validation output

Implemented formulas:

- Year pillar changes at Ipchun.
- Year stem: `mod(sajuYear - 4, 10)`.
- Year branch: `mod(sajuYear - 4, 12)`.
- Month branch follows solar-term boundaries, not Gregorian or lunar months.
- Month stem: `mod((yearStemIndex % 5) * 2 + 2 + monthOrderFromTiger, 10)`.
- Day pillar uses deterministic civil-day math with `2000-01-01 = 戊午`.
- Hour branch is selected by the user.
- Hour stem: `mod((dayStemIndex % 5) * 2 + hourBranchIndex, 10)`.
- Result reports are generated through `raw calculation -> normalizedSaju -> interpretationProfile -> finalReport`.
- The main report translates Day Master, Five Elements, Yin/Yang, Ten God groups, hidden stems, Luck Pillars, and current annual flow into practical language.

Sample year-pillar checks:

- 1984 after Ipchun = 甲子
- 2024 after Ipchun = 甲辰
- 2025 after Ipchun = 乙巳
- 2026 after Ipchun = 丙午

## Known MVP Limitations

This MVP is intentionally honest about calculation limits.

- Lunar calendar conversion is not implemented without a verified Korean lunar lookup table.
- Solar terms use fixed approximate dates at local midnight, not exact precomputed local datetimes.
- Country-level timezone is approximate and ignores city, longitude, and historical timezone complexity.
- True solar time correction is not implemented.
- Night-rat-hour handling is not implemented.
- The day-pillar base date should be verified against multiple professional Manse calendar samples.
- Five elements count visible stems and branches equally.
- Result narratives also use an MVP weighted helper analysis that adds small hidden-stem weights and month-season emphasis for more readable interpretation.
- Hidden-stem weights are simple fixed MVP weights, not a professional strength model.
- Luck pillar start age uses approximate solar terms and a representative hour for the selected time branch.
- Different schools may use different standards, so professional Manse calendar results may differ.

## SEO And Indexing

- `index.html` is indexable and includes localized SEO text, OG tags, Twitter card tags, hreflang links, and JSON-LD WebSite data.
- `result.html` includes `noindex,nofollow`.
- `robots.txt` disallows result page patterns as much as static robots rules allow.
- `sitemap.xml` includes the homepage only.

## Future Improvements

- Exact KASI-style Korean lunar conversion table for 1900-2050
- Exact solar-term table with local datetimes
- Birth city and longitude support
- True solar time correction
- Night-rat-hour options for 야자시/조자시
- `create-result` Edge Function for server-side password hashing
- bcrypt or argon2 password hashing server-side
- Abuse prevention and rate limiting
- Custom OG image
- Custom domain and production sitemap URLs
