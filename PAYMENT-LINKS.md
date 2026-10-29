# Payment links (Everflow, www.molipy8trk.com)

This page explains how the storefront sends a buyer to the external payment page and exactly what the link carries. It describes the code at commit `feebef0` (2026-10-29). That covers the new prices and the Déstockage Europe offer links from `b8d632f`, and the English version from `feebef0`. It also covers the earlier change that puts the Snapchat click ID (ScCid) in `sub1` when there is no Meta `fbclid`. The shop displays and records prices in CHF only. What the hosted payment page charges is set by the provider (see §2). The shop is in French, German and English. On the payment link, the language changes only the product label (`adv1`).

## 1. In one minute

1. On a full page load, `captureTrafficSource()` works out where the visitor came from. It keeps a Meta or Snapchat click ID if one is present, subject to consent ([src/main.jsx:11](src/main.jsx:11), [src/lib/trafficSource.js:116](src/lib/trafficSource.js:116)).
2. The checkout page reads `GET /api/payment/config` once and picks the provider: `everflow` if `everflow.enabled === true`, otherwise `external` ([src/lib/payment.js:83](src/lib/payment.js:83)).
3. When the buyer clicks "Buy", the browser opens a blank tab inside the click. It then POSTs the order, an idempotency key, the traffic source, the consent flag and the click IDs to `/api/checkout/everflow` or `/api/checkout/redirect` ([src/pages/Checkout.jsx:449](src/pages/Checkout.jsx:449), [src/lib/payment.js:109](src/lib/payment.js:109)).
4. The server checks the order and recomputes the total from the offer. It checks stock and records a `pending` order, deduplicated ([server/index.mjs:191](server/index.mjs:191)).
5. The server builds the link with one of two builders. It adds click IDs only when `marketingConsent === true` ([server/index.mjs:221](server/index.mjs:221), [server/everflow.mjs:122](server/everflow.mjs:122)).
   - `buildEverflowUrl` uses the three fixed offer links. It always runs on the Everflow path, and on the redirect path whenever the `/admin` domain is exactly `www.molipy8trk.com`.
   - `buildRedirectUrl` uses the parameter list set in `/admin`. It runs for any other domain.
6. The browser passes the link through `cleanCheckoutUrl` and saves it for the tab. It loads the link in the blank tab (except for duplicate orders) and goes to `/commande/suivi/{orderId}` ([src/pages/Checkout.jsx:454](src/pages/Checkout.jsx:454)).
7. The customer pays on www.molipy8trk.com. The shop gets no callback. An admin confirms or cancels the order in `/admin`.

## 2. The three offer links

The links are frozen with `Object.freeze` in [server/everflow.mjs:15](server/everflow.mjs:15). Prices are in [src/config/offers.js:17](src/config/offers.js:17).

Since commit `b8d632f` (2026-10-29) the code uses the Déstockage Europe offers. They apply on the live site only after a deploy that contains this commit (see §3). The code no longer uses the former Swiss codes `WMD7FHG`, `WMJD3P9` and `WMKQZFW` (CHF 4 / 7 / 10). The struck-through prices did not change.

| Offer id | Packs / capsules | Price CHF | Link |
|---|---|---|---|
| `pack-1` | 1 sachet / 60 | 9 | https://www.molipy8trk.com/2J23GL9/WXPHT5G/ |
| `pack-2` | 2 sachets / 120 | 15 | https://www.molipy8trk.com/2J23GL9/WXS9LLN/ |
| `pack-3` | 3 sachets / 180 | 20 | https://www.molipy8trk.com/2J23GL9/WXTNHC9/ |

- Only CHF has links: `LINKS_BY_CURRENCY = { CHF: TRACKING_LINKS }` ([server/everflow.mjs:22](server/everflow.mjs:22)). `currencyForCountry()` always returns CHF ([src/config/offers.js:67](src/config/offers.js:67)). The shop therefore displays and records every order in CHF.
- **What the hosted page charges.** The provider sets the amount and the currency on the hosted payment page. These three links are the Déstockage Europe EUR offers, approved at €8.95, €14.95 and €19.99 (recorded in the separate `destockage-europe` repo: `LAUNCH-CHECKLIST.md` and `src/config/commercial.js`). This repo does not record those amounts, and no code here checks them.
  - The "amount charged = amount displayed" checks ([server/index.mjs:201](server/index.mjs:201), [server/everflow.mjs:105](server/everflow.mjs:105)) only compare the currency the browser displayed with the currency the server assigned. They never look at what the provider charges.
  - Editing `offers.js` does not change the amount on the hosted payment page, and no code ties the CHF price shown on the site to the amount behind each link.

## 3. Which path builds the link

| | `POST /api/checkout/everflow` | `POST /api/checkout/redirect` |
|---|---|---|
| Switched on by | Env: `EVERFLOW_ENABLED=true` + `EVERFLOW_IMAGES_APPROVED=true` + a valid `PUBLIC_ORIGIN` ([server/everflow.mjs:69](server/everflow.mjs:69)) | `/admin`: redirect enabled + a domain ([server/index.mjs:193](server/index.mjs:193)) |
| Browser uses it when | `everflow.enabled === true` (this path wins) | Everflow is off and `externalRedirect.enabled` is on |
| Builder | Always `buildEverflowUrl` | `buildEverflowUrl` if the domain is exactly `www.molipy8trk.com`, else `buildRedirectUrl` |
| Stock | Held with `reserve()`, 30 minutes by default | `checkAvailable` only; nothing is reserved ([server/index.mjs:212](server/index.mjs:212)) |
| Click IDs in the order record | Stored, and part of the fingerprint ([server/everflow.mjs:142](server/everflow.mjs:142)) | Not stored; read from each request body |
| Admin closes the order via | `/api/admin/stock/reservations/:key/(confirm\|cancel)` | `/api/admin/orders/:orderId/(confirm\|cancel)` |

**`usesApprovedEverflowLinks(redirect)`** ([server/everflow.mjs:41](server/everflow.mjs:41)) is true when `enabled === true` and `domain === 'www.molipy8trk.com'` exactly. The redirect route only gets this far when `enabled` is already true, so in practice the domain alone decides.

Since `b8d632f` the path and codes saved in `/admin` are no longer compared. On this domain the three frozen links always apply, so a code saved in `/admin` (such as a retired Swiss one) can never send a buyer to a retired offer ([server/everflow.test.mjs:24](server/everflow.test.mjs:24)). This does not cover a payment link that a buyer's tab saved before the deploy (see §10, "Change an offer link"). `/admin` says so under "Codes par offre".

What each result means:
- **True:** `buildEverflowUrl` runs. The admin parameter list, "Nom transmis", the path text and the code values are ignored. `adv2` is the pack image under `PUBLIC_ORIGIN`; the admin photo URL is only a fallback ([server/index.mjs:220](server/index.mjs:220)).
  - One leftover check still runs before the builder is picked. If the saved path contains `{code}` and an offer has no code, the route answers 409 `payment_unavailable` for that offer ([server/index.mjs:214](server/index.mjs:214)). So a `{code}` placeholder in the path still makes each offer need a code.
  - `/admin` refuses to save that state while the redirect is enabled ([src/lib/redirectPayment.js:92](src/lib/redirectPayment.js:92)), so it only happens with a hand-edited file or a newly added offer. A path without `{code}` (for example `/`) removes the requirement on this domain, because the approved builder ignores the path text anyway.
- **False:** `buildRedirectUrl` runs, driven by the admin config. This happens for any other host, such as another payment domain or `molipy8trk.com` without `www`. Saving through `/admin` strips the scheme and lowercases the domain, so only a different host or a hand-edited file lands here.
  - Without an admin photo URL, the `photo` value falls back to `PUBLIC_ORIGIN` or the request's Origin header. The click IDs come from the request ([server/index.mjs:223](server/index.mjs:223)).
  - `molipy8trk.com` without `www` is still treated as Everflow for click IDs ([src/lib/redirectPayment.js:64](src/lib/redirectPayment.js:64)).

**Live state on 2026-10-27**, from `GET /api/payment/config`:
`{"everflow":{"enabled":false,"preview":false,"domain":"","attributionAvailable":false},"externalRedirect":{"enabled":true,"domain":"www.molipy8trk.com"}}`

What this proves:
- The Everflow env switch is off. At least one of its three conditions fails, but the response does not say which. `/api/checkout/everflow` would therefore answer 409 `payment_unavailable`.
- Every live checkout goes through `/api/checkout/redirect`, with no stock hold.
- The stored domain is exactly `www.molipy8trk.com`. The endpoint returns the stored value as is ([server/index.mjs:169](server/index.mjs:169)), and `usesApprovedEverflowLinks` compares that same value. So, with code at `b8d632f` or later and a stored config unchanged since 2026-10-27, `buildEverflowUrl` builds every link the redirect route returns. The saved code values, parameter rows and "Nom transmis" make no difference.
  - There is one exception. While the saved path contains `{code}`, an offer without a code gets 409 and no link at all ([server/index.mjs:214](server/index.mjs:214)).
- The domain matches the Everflow pattern, so the `sub1`/`fbclid`/`ScCid` handling applies.

What it does not prove:
- Which release was running. The observation predates `b8d632f`. Under the earlier code the builder still depended on the saved path and codes, and this endpoint never shows those ([server/index.mjs:166](server/index.mjs:166)).
- Whether the new code is live. Deploys are started by hand (`workflow_dispatch`, [.github/workflows/deploy-vps.yml:4](.github/workflows/deploy-vps.yml:4)). The new links, prices, builder rule and English label reach the live site only once a release containing these commits is deployed.
- Anything about pixels: `attributionAvailable` always equals `everflow.enabled`, because the pixel IDs are fixed constants.

## 4. Parameters sent

"Approved" means `buildEverflowUrl`; "generic" means `buildRedirectUrl`. On `www.molipy8trk.com` every link is approved.

| Param | Value | Source / notes |
|---|---|---|
| `sub10` | First name (`prenom`) | Left out when empty |
| `adv3` | Last name (`nom`) | Left out when empty |
| `sub3` | Postal code (`npa`) | Left out when empty |
| `sub4` | E-mail, lowercased by `clean()` | Left out when empty |
| `sub6` | City (`ville`) | Left out when empty |
| `sub7` | `adresse, complement`, with empty parts dropped | [server/everflow.mjs:89](server/everflow.mjs:89) |
| `sub8` | Phone | Approved: `+41790000000`. Generic: the form value after `clean()`. The checkout form always formats it as `+41 NN NNN NN NN`, e.g. `+41 79 000 00 00` ([src/pages/Checkout.jsx:68](src/pages/Checkout.jsx:68)) |
| `adv1` | Product label | Approved: `productLabel(offer, lang)` in French, German or English, always starting with the product name and an en dash, then the capsule count. Examples: `Ariel All-in-1 PODS – 2 sachets (120 capsules)`, `Ariel All-in-1 PODS – 2 Beutel (120 Kapseln)`, `Ariel All-in-1 PODS – 2 pouches (120 pods)`. The singular forms are `1 sachet (60 capsules)`, `1 Beutel (60 Kapseln)` and `1 pouch (60 pods)` ([server/everflow.mjs:31](server/everflow.mjs:31)). Generic: the admin "Nom transmis", else `Ariel All-in-1 PODS – N sachet(s)` |
| `adv2` | Product image URL | Approved: `{PUBLIC_ORIGIN}/images/everflow/pack-N.{webp,png}`. On `/api/checkout/redirect` only, it falls back to the admin photo URL, then to empty (`adv2=` is still present). On `/api/checkout/everflow` the image is required, otherwise 422 `unsupported_offer` ([server/everflow.mjs:121](server/everflow.mjs:121)); local preview uses `http://localhost:5173/...`. Generic: the admin photo URL, else `{origin}/images/packshot.webp`, else left out |
| `sub1` | Meta `fbclid` if valid, else the Snapchat ScCid | Only with consent, and only on (www.)molipy8trk.com |
| `fbclid` | Meta click ID | Only with consent, when valid, and only on (www.)molipy8trk.com (always true for the approved builder) |
| `ScCid` | Snapchat click ID (the request body key is `sccid`) | Only with consent, when valid, and only on (www.)molipy8trk.com (always true for the approved builder) |
| Any other admin row | Value of the mapped field: `adresse`, `complement`, `offre` (e.g. `pack-2`), `sachets` (e.g. `2`), `prix` (e.g. `15.00`), `pays` (`CH`), or any other `FIELDS` key | Generic builder only. The URL name is the one typed in the row ([src/lib/redirectPayment.js:146](src/lib/redirectPayment.js:146); values from `fieldValue`, [src/lib/redirectPayment.js:119](src/lib/redirectPayment.js:119)) |

**Order.** Approved: `sub10`, `adv3`, `sub3`, `sub4`, `sub6`, `sub7`, `sub8`, then `adv1`, `adv2`, `sub1`, `fbclid`, `ScCid`. Generic: the admin rows in their saved order (the default rows give the same order), then `sub1`, `fbclid`, `ScCid` on (www.)molipy8trk.com. Values are form-encoded by `URLSearchParams`: a space becomes `+` and `@` becomes `%40`.

Differences between the two builders:
- **Base URL.** Approved: the frozen link. It throws `unapproved_destination` unless the origin is `https://www.molipy8trk.com` ([server/everflow.mjs:82](server/everflow.mjs:82)). Generic: `https://{domain}{pathTemplate}`, with `encodeURIComponent(code)` ([src/lib/redirectPayment.js:144](src/lib/redirectPayment.js:144)).
- **Parameter names.** Approved: the fixed `PREFILL` list ([server/everflow.mjs:51](server/everflow.mjs:51)). Generic: the admin rows. The default rows use the same names ([src/lib/redirectPayment.js:27](src/lib/redirectPayment.js:27)).
- **Phone (`sub8`).** Only the approved builder normalises it to `+41` with no spaces ([server/everflow.mjs:90](server/everflow.mjs:90)).
- **Language (`adv1`).** Only the approved builder translates it ([server/index.mjs:222](server/index.mjs:222), [src/lib/orderValidation.js:98](src/lib/orderValidation.js:98)).
  - It uses the `lang` stored with the order the server returns: `fr`, `de` or `en`. A missing or unknown value becomes `fr`.
  - Normally that is the language shown when Buy was clicked. A retry of the same offer updates the stored order, and its `lang` with it.
  - There is one exception. The same customer may pick a different offer within 48 hours while an earlier order is still pending. The server then returns the earlier order unchanged, so `adv1` names the earlier offer in the earlier language ([server/orders.mjs:159](server/orders.mjs:159); Everflow path: [server/everflow.mjs:151](server/everflow.mjs:151)).
  - The generic builder sends the "Nom transmis" text unchanged in every language; its default text is French.
- **Empty values.** The approved builder always sets `adv1` and `adv2`. The generic one drops every empty value.

**`sub5` is never sent**, at four levels:
- `/admin` refuses it on every domain, with the message that it would cause a second Purchase signal ([src/lib/redirectPayment.js:103](src/lib/redirectPayment.js:103)).
- `buildRedirectUrl` skips it if an older saved config still contains it ([src/lib/redirectPayment.js:148](src/lib/redirectPayment.js:148)).
- `buildEverflowUrl` never sets it.
- The browser strips it on any host ([src/lib/checkoutUrl.js:7](src/lib/checkoutUrl.js:7)).

**Reserved names:** `sub5` on every domain; `sub1`, `fbclid` and `sccid` (any letter case) on (www.)molipy8trk.com ([src/lib/redirectPayment.js:104](src/lib/redirectPayment.js:104)). `sub2` and `sub9` are free: not reserved and not mapped by default.

## 5. Ad click IDs (sub1, fbclid, ScCid)

**Capture.** This runs once per full page load, before React renders ([src/main.jsx:11](src/main.jsx:11)).
- Recognised URL parameters, in priority order: `fbclid`, `ScCid`, `sccid`, `gclid`, `gbraid`, `wbraid`, `gad_source` ([src/lib/trafficSource.js:37](src/lib/trafficSource.js:37)).
- Only the Meta and Snapchat values are kept. For Google IDs, only the parameter name is recorded.

**Validation.** The same two patterns appear in four places: [src/lib/trafficSource.js:18](src/lib/trafficSource.js:18), [server/everflow.mjs:53](server/everflow.mjs:53), [src/lib/redirectPayment.js:62](src/lib/redirectPayment.js:62) and [src/lib/checkoutUrl.js:16](src/lib/checkoutUrl.js:16). fbclid: `/^[A-Za-z0-9._-]{1,500}$/`. ScCid: `/^[A-Za-z0-9_-]{1,500}$/` (no dot allowed).

**Consent.** The banner writes `granted` or `denied` to localStorage `consent.marketing.v1` ([src/components/ConsentBanner.jsx:68](src/components/ConsentBanner.jsx:68)). It shows to every visitor who has not chosen yet, because the pixel IDs are hard-coded ([src/config/attribution.js:3](src/config/attribution.js:3)).

| Consent state | What happens to the click ID |
|---|---|
| No answer yet, at landing | Stored in sessionStorage `ad-click.pending.v1`, with the arrival time: this tab only, survives reloads, one slot ([src/lib/trafficSource.js:136](src/lib/trafficSource.js:136)) |
| `granted`, at landing | Stored in localStorage `traffic-source.v1` as `last.fbclid` or `last.sccid`. If no record was saved yet (first visit, or the previous one has expired), the same ID is also written to `first`. That copy stays until the whole record expires, 30 days after `last.at`. Only `last` is used for the payment link. The `source` object posted at checkout carries both copies; the server's `sanitizeSource` discards them ([src/lib/trafficSource.js:139](src/lib/trafficSource.js:139)) |
| `denied`, at landing | Not stored anywhere |
| "Accept" clicked later | The pending ID moves to `last` only if `last.channel`, `last.clickIdType` and `last.at` (the same arrival) still match. The pending slot is cleared in every case. This runs on Accept, or on the next page load if consent was given elsewhere ([src/lib/trafficSource.js:167](src/lib/trafficSource.js:167), [src/lib/trafficSource.js:143](src/lib/trafficSource.js:143)) |
| "Refuse" clicked later | The pending ID is discarded on Refuse, or on the next page load once `denied` is stored ([src/lib/trafficSource.js:182](src/lib/trafficSource.js:182), [src/lib/trafficSource.js:147](src/lib/trafficSource.js:147)) |

**Last click wins.**
- An arrival with a click-ID parameter or a `utm_source` always replaces `last`, and with it the old click ID ([src/lib/trafficSource.js:124](src/lib/trafficSource.js:124); tested in [server/traffic-source.test.mjs:27](server/traffic-source.test.mjs:27), where a `gclid` arrival clears the Meta ID, and [server/traffic-source.test.mjs:213](server/traffic-source.test.mjs:213), where an `fbclid` arrival replaces the Snapchat ID).
  - A referrer-only arrival replaces `last` only when it is a new visit. A reload, a back/forward move, or the same channel with the same referrer host as the saved `last` keeps it, click ID included ([server/traffic-source.test.mjs:92](server/traffic-source.test.mjs:92)).
  - A direct visit never overwrites it. A copy in `first`, if any, remains.
- The getters return an ID only when `last.channel` is `meta` or `snapchat` respectively ([src/lib/trafficSource.js:155](src/lib/trafficSource.js:155), [src/lib/trafficSource.js:160](src/lib/trafficSource.js:160)). One order therefore carries at most one click ID.

**Sending.** The browser sends `fbclid` and `sccid` only with consent ([src/lib/payment.js:99](src/lib/payment.js:99)). The server checks `body.marketingConsent === true` again ([server/index.mjs:221](server/index.mjs:221), [server/everflow.mjs:122](server/everflow.mjs:122)).

**How `sub1` is chosen.** It is `meta || snap`: Meta wins when both are present ([server/everflow.mjs:99](server/everflow.mjs:99)). According to the code comment, Everflow's Meta and Snapchat integrations read the click ID from `sub1`, and the named parameter travels alongside it ([server/everflow.mjs:95](server/everflow.mjs:95)).

**What the order keeps.** The order's `source` keeps only `clickIdType` ([src/lib/trafficSource.js:81](src/lib/trafficSource.js:81)). Everflow-path orders also store the consented `fbclid`/`sccid` at the top of the record, to rebuild the link on retries ([server/everflow.mjs:177](server/everflow.mjs:177)). External-path orders store no click ID.

## 6. Admin settings (/admin)

These fields are edited in the "Redirection externe" editor ([src/pages/Admin.jsx:906](src/pages/Admin.jsx:906)). The page and the server check them with the same `validateConfig` function ([src/lib/redirectPayment.js:75](src/lib/redirectPayment.js:75)).

| Field (UI label) | Key | Default | Rules |
|---|---|---|---|
| Activé / Désactivé | `enabled` | `false` | Only the boolean `true` turns it on |
| Domaine de paiement | `domain` | `''` | The scheme and anything after the first `/` are stripped, then lowercased. Must match `DOMAIN_RE` (a host with a dot, no port). Required when enabled. An invalid value blocks saving even when the redirect is off |
| Chemin | `pathTemplate` | `/{code}` | Starts with `/`; no space, `?` or `#`. Empty becomes `/{code}` |
| Code (per offer) | `packages[id].code` | `''` | Must match `/^[A-Za-z0-9._~-]{1,80}$/`. Required when enabled and the path contains `{code}`, on every domain |
| Nom transmis | `packages[id].productName` | `Ariel All-in-1 PODS – N sachet(s) (W capsules)` | Trimmed and cut to 120 characters |
| URL de la photo | `packages[id].photoUrl` | `''` (use the shop's photo) | Must start with `https://` |
| Paramètres ajoutés à l'URL | `params` | sub10, adv3, sub3, sub4, sub6, sub7, sub8, adv1, adv2 | At most 30 rows; extra rows are dropped silently. Name must match `/^[A-Za-z0-9_-]{1,40}$/`. Field must be in `FIELDS`. No duplicates (case-sensitive). Reserved names are refused |

`FIELDS` is: prenom, nom, npa, email, ville, adresse_complete, adresse, complement, tel, produit, photo, offre, sachets, prix, pays ([src/lib/redirectPayment.js:9](src/lib/redirectPayment.js:9)).

**When the domain is `www.molipy8trk.com`** (the live value on 2026-10-27):
- `enabled` and `domain` still decide which path and which builder run.
- The codes are still checked, but their values are never used. While the path contains `{code}`, each offer needs a valid code.
  - Without one, saving with the redirect enabled is refused ([src/lib/redirectPayment.js:92](src/lib/redirectPayment.js:92)), and a file lacking one makes the redirect answer 409 for that offer ([server/index.mjs:214](server/index.mjs:214)).
  - A path without `{code}` (for example `/`) removes this requirement, and the approved builder ignores the path text anyway. If the domain is later changed to another host, the generic builder uses that path as it is.
  - The path and the parameter rows are still validated on save.
- "URL de la photo" is used only as the `adv2` fallback when `PUBLIC_ORIGIN` gives no pack image.
- "Nom transmis", the parameter list, the path text and the code values are ignored, apart from the `{code}` rule above.
- Under "Codes par offre" a notice says that the three offer links frozen in the server code apply and the codes below are not used ([src/pages/Admin.jsx:994](src/pages/Admin.jsx:994)).
  - It appears only when the domain field reads exactly `www.molipy8trk.com`. It checks the raw input, before the scheme is stripped and the value lowercased on save.
  - It does not say that a code is still required while the path contains `{code}`, or that "Nom transmis" and the parameter list are ignored as well.
- Two other texts in the same editor still describe the generic builder, and on this domain they contradict the notice. Only the notice reflects the frozen-link rule.
  - The card description says "Buy" sends the customer to the URL below, with their details as parameters ([src/pages/Admin.jsx:960](src/pages/Admin.jsx:960)).
  - The preview card says it is there to check the format before activating ([src/pages/Admin.jsx:1083](src/pages/Admin.jsx:1083)).

**Where it is stored.**
- `PUT /api/admin/config` requires the admin session cookie. It saves only `externalRedirect` and `updatedAt` ([server/index.mjs:322](server/index.mjs:322)).
- The file is written atomically to `DATA_DIR/payment-config.json` ([server/index.mjs:65](server/index.mjs:65)); in production `/var/lib/ariel/payment-config.json` ([deploy/ariel.service:13](deploy/ariel.service:13)). `server/data/` is git-ignored, so this file is never in the repo.
- The file is loaded once at startup and is not checked on load. A hand edit needs a server restart. A corrupt file silently means "redirect disabled" ([server/index.mjs:51](server/index.mjs:51)).

**Preview and Everflow card.**
- The "Aperçu de l'URL" preview always uses `buildRedirectUrl` ([src/pages/Admin.jsx:922](src/pages/Admin.jsx:922)). It forces `enabled` on and uses a sample customer, no click IDs, and the admin page's own origin (`window.location.origin`, not `PUBLIC_ORIGIN`).
- On `www.molipy8trk.com` the preview therefore never matches the link customers get. It shows the saved codes (even retired ones), the admin rows, "Nom transmis", the phone without normalisation and the packshot image.
- The Everflow card is read-only ([src/pages/Admin.jsx:946](src/pages/Admin.jsx:946)).

## 7. Server environment variables

These are set in two places. `NODE_ENV`, `HOST`, `PORT` and `DATA_DIR` come from `Environment=` lines in [deploy/ariel.service:10](deploy/ariel.service:10). `PUBLIC_ORIGIN`, `ADMIN_PASSWORD` and the `EVERFLOW_*` switches come from `/etc/ariel/ariel.env`, loaded by [deploy/ariel.service:14](deploy/ariel.service:14). CI never sets them. Restart `ariel.service` after any change.

| Variable | Effect | Notes |
|---|---|---|
| `PUBLIC_ORIGIN` | Pack image URLs (`adv2`) on both paths; Everflow switch; origin of the generic `photo` value | For images it must be https, with no path, query, hash or credentials, and a host with a dot ([server/everflow.mjs:60](server/everflow.mjs:60)). `originOf` uses it unchecked ([server/index.mjs:110](server/index.mjs:110)). Production value: `https://destockage-suisse.store` ([deploy/README.md:14](deploy/README.md:14)) |
| `EVERFLOW_ENABLED` | Everflow checkout | Only the exact string `true` counts. `.env.example` default: `false` ([.env.example:109](.env.example:109)) |
| `EVERFLOW_IMAGES_APPROVED` | Everflow checkout | Only the exact string `true` counts ([.env.example:110](.env.example:110)) |
| `EVERFLOW_LOCAL_PREVIEW` | Local test of the Everflow path | Needs `NODE_ENV=development` and a loopback Host header and connection. Images point to `http://localhost:5173` ([server/everflow.mjs:65](server/everflow.mjs:65)) |
| `NODE_ENV` | Blocks the local preview in production | `production` in the systemd unit ([deploy/ariel.service:10](deploy/ariel.service:10)) |
| `DATA_DIR` | Location of the config and orders | Default `server/data`; `/var/lib/ariel` in production ([server/index.mjs:34](server/index.mjs:34)) |
| `ADMIN_PASSWORD` | `/admin` login | At least 12 characters; a shorter value stops the server at startup ([server/index.mjs:44](server/index.mjs:44)). Without it, login answers 503 `admin_disabled` ([server/index.mjs:233](server/index.mjs:233)), so no order can be closed and the redirect config cannot be changed |

- `ORDER_DEDUP_HOURS` in [.env.example:45](.env.example:45) is not read by any code. The dedup window is fixed at 48 hours ([server/orders.mjs:22](server/orders.mjs:22)).
- The deploy script refuses a `preview` release when the env file contains the line `EVERFLOW_ENABLED=true` ([deploy/deploy-vps.sh:15](deploy/deploy-vps.sh:15)).

## 8. In the browser

- **New tab.** `window.open('', '_blank')` runs during the click, with `opener = null`. The tab gets the link on success and is closed for duplicates and errors ([src/pages/Checkout.jsx:449](src/pages/Checkout.jsx:449), [src/pages/Checkout.jsx:461](src/pages/Checkout.jsx:461), [src/pages/Checkout.jsx:472](src/pages/Checkout.jsx:472)).
- **POST body.** `offerId`, `termsAccepted`, `currency`, `total`, `lang`, `customer` (cleaned), `idempotencyKey`, `source {first,last}`, `marketingConsent`, `fbclid`, `sccid` ([src/lib/payment.js:109](src/lib/payment.js:109)).
  - Both routes answer 409 `currency_mismatch` if the currency differs from the server's ([server/everflow.mjs:111](server/everflow.mjs:111), [server/index.mjs:203](server/index.mjs:203)).
  - `/api/checkout/everflow` also answers 422 `unsupported_cart` if `total` differs from the server price. `/api/checkout/redirect` ignores the sent `total` and uses the offer price.
- **Idempotency in the browser.** The fingerprint is `{provider, order, marketingConsent, fbclid, sccid}` ([src/lib/payment.js:102](src/lib/payment.js:102)). An identical retry within 48 hours of the first attempt reuses the same key; otherwise a new `crypto.randomUUID()` is made. The attempt is kept in sessionStorage `everflow-attempt-v1`, for both providers.
- **Idempotency on the server.**
  - Orders are deduplicated by key, and by e-mail + phone for 48 hours ([server/orders.mjs:64](server/orders.mjs:64)).
  - If the same customer picks a different offer while the first order is pending, the server returns the earlier order and its link.
  - If that earlier order is closed, comes from the other provider, or (Everflow) its stock hold has expired, the server answers 409 `recent_order`. The browser then closes the blank tab and opens the old order's status page, with no new link ([server/orders.mjs:158](server/orders.mjs:158), [server/everflow.mjs:147](server/everflow.mjs:147), [src/pages/Checkout.jsx:473](src/pages/Checkout.jsx:473)).
- **`cleanCheckoutUrl`** ([src/lib/checkoutUrl.js:3](src/lib/checkoutUrl.js:3)) rejects non-https links and deletes `sub5` on any host. On (www.)molipy8trk.com it deletes `sub1`, `fbclid` and `sccid` (any case) and rebuilds them from the exact-case `fbclid` and `ScCid` values.
- **Saved link.** Stored in sessionStorage under `checkout-payment-v1:{orderId}`, and passed in the route state ([src/pages/Checkout.jsx:456](src/pages/Checkout.jsx:456)).
- **Order status page** (`/commande/suivi/:orderId`):
  - It cleans the link again ([src/pages/OrderStatus.jsx:19](src/pages/OrderStatus.jsx:19)) and polls `GET /api/orders/{id}/status` every 15 seconds while the tab is visible ([src/pages/OrderStatus.jsx:63](src/pages/OrderStatus.jsx:63)).
  - The pay button shows only while the order is `processing`. It opens with `rel="noopener noreferrer"`, so that click sends no Referer ([src/pages/OrderStatus.jsx:194](src/pages/OrderStatus.jsx:194)).
  - The automatic first load from the checkout tab ([src/pages/Checkout.jsx:464](src/pages/Checkout.jsx:464)) does send the shop origin as Referer (`strict-origin-when-cross-origin`, [server/index.mjs:398](server/index.mjs:398)).
  - The status endpoint never returns contact data or the provider URL ([server/orders.mjs:242](server/orders.mjs:242)).

## 9. What the site does not do

- **No payment confirmation.** There is no webhook, postback or confirmation API ([README.md:59](README.md:59)). No redirect or return visit closes an order ([server/everflow.mjs:202](server/everflow.mjs:202)).
- **No Meta or Snapchat Purchase from the site.** Everflow sends those ([src/lib/pixel.js:3](src/lib/pixel.js:3)). All site events need marketing consent; Google events also need `VITE_GOOGLE_TAG_ID`. The site does send:
  - InitiateCheckout / START_CHECKOUT and Google `begin_checkout`, before the server call ([src/lib/pixel.js:178](src/lib/pixel.js:178));
  - on a non-duplicate redirect, Meta AddPaymentInfo (event ID `order-{orderId}`), Google `add_payment_info`, and a Google Ads `conversion` (transaction_id = orderId) when `VITE_GOOGLE_ADS_CHECKOUT_SEND_TO` is set ([src/lib/pixel.js:190](src/lib/pixel.js:190));
  - Google `purchase` (transaction_id = orderId) when the order status page sees `confirmed` after an admin confirms, once per orderId in a browser ([src/pages/OrderStatus.jsx:83](src/pages/OrderStatus.jsx:83), [src/lib/pixel.js:203](src/lib/pixel.js:203)).
- **Orders are closed only by an admin.** External orders: `POST /api/admin/orders/:orderId/(confirm|cancel)`, which does not touch stock ([server/index.mjs:292](server/index.mjs:292)). Everflow orders: the stock-reservation route ([server/index.mjs:311](server/index.mjs:311)).
- **No stock reservation on the live path.** The redirect path never reserves or deducts stock.

## 10. Changing things safely

- **Add or rename a parameter (generic builder).** Do it in `/admin`; no code change is needed. It takes effect only when the domain is not exactly `www.molipy8trk.com`. On (www.)molipy8trk.com, `sub1`, `fbclid`, `sccid` and `sub5` are refused.
- **Add or rename a parameter (approved builder).** Admin rows have no effect on this builder, so change the code.
  - Edit `PREFILL` and `values` ([server/everflow.mjs:51](server/everflow.mjs:51), [server/everflow.mjs:83](server/everflow.mjs:83)) and keep `DEFAULT_PARAMS` aligned ([src/lib/redirectPayment.js:27](src/lib/redirectPayment.js:27)).
  - Update the tests: [server/everflow.test.mjs:69](server/everflow.test.mjs:69) (prefill names), [server/everflow.test.mjs:34](server/everflow.test.mjs:34) (`sub4`) and [server/orders.test.mjs:30](server/orders.test.mjs:30) (`sub7`).
  - For `adv1` or the label text, also update [server/i18n.test.mjs:112](server/i18n.test.mjs:112)–117 (German at :113, the exact French label at :114, English at :115 and :117) and [server/everflow.test.mjs:74](server/everflow.test.mjs:74) (French `N sachet`).
- **Click-ID parameters.** The `sub1`/`fbclid`/`ScCid` rule lives in five places: [server/everflow.mjs:97](server/everflow.mjs:97), [src/lib/redirectPayment.js:152](src/lib/redirectPayment.js:152), [src/lib/checkoutUrl.js:10](src/lib/checkoutUrl.js:10), and the reserved-name lists at [src/lib/redirectPayment.js:104](src/lib/redirectPayment.js:104) and [src/lib/redirectPayment.js:148](src/lib/redirectPayment.js:148). Change them together.
  - On (www.)molipy8trk.com, `cleanCheckoutUrl` always rebuilds `sub1`/`fbclid`/`ScCid` from the exact-case `fbclid` and `ScCid`. A different `sub1` value is overwritten. A case variant such as `sccid` is deleted and not rebuilt. Any other new name passes through unchanged.
  - Tests: [server/everflow.test.mjs:128](server/everflow.test.mjs:128), [server/checkout-url.test.mjs:7](server/checkout-url.test.mjs:7) (`cleanCheckoutUrl`), [server/checkout-url.test.mjs:20](server/checkout-url.test.mjs:20) (the reserved-name refusal and skip and the generic builder's click IDs, i.e. redirectPayment.js:104, :148 and :152), [server/traffic-source.test.mjs:37](server/traffic-source.test.mjs:37).
- **Change an offer link.** Edit `TRACKING_LINKS` ([server/everflow.mjs:15](server/everflow.mjs:15)) and keep the origin `https://www.molipy8trk.com`. The `/admin` codes need no change, because they are not used on that domain.
  - Tests that assert the links: [server/everflow.test.mjs:9](server/everflow.test.mjs:9) (all three, with prices) and [server/orders.test.mjs:66](server/orders.test.mjs:66) (the `pack-1` path).
  - [server/everflow.test.mjs:18](server/everflow.test.mjs:18) checks that on `www.molipy8trk.com` the frozen links apply whatever codes are saved: the current ones, the retired Swiss ones, or none at all. It also checks that they do not apply when the redirect is disabled or points to another domain ([server/everflow.test.mjs:24](server/everflow.test.mjs:24)). Its sample codes need no change. [server/checkout-url.test.mjs:7](server/checkout-url.test.mjs:7) uses the retired `WMD7FHG` link only as sample input.
  - **Orders from before the deploy.** The link is rebuilt from the current `TRACKING_LINKS` on every request ([server/index.mjs:219](server/index.mjs:219), [server/everflow.mjs:156](server/everflow.mjs:156), [server/everflow.mjs:190](server/everflow.mjs:190)). An order still pending from before the deploy keeps its recorded offer and `total`.
    - Suppose the same customer clicks Buy again within 48 hours with a different offer. The server returns that old order with its old total, but with a link to the current offer ([server/orders.mjs:159](server/orders.mjs:159)). Check such orders against the provider before confirming them.
    - A tab that saved a payment link before the deploy keeps it in sessionStorage. The order status page still shows that link while the order is `processing` ([src/pages/OrderStatus.jsx:21](src/pages/OrderStatus.jsx:21), [src/pages/OrderStatus.jsx:194](src/pages/OrderStatus.jsx:194)). `cleanCheckoutUrl` only touches query parameters, so an old `WM…` link still opens the retired offer. This lasts until the tab's session ends or an admin closes the order.
- **Change a price.** Edit [src/config/offers.js:17](src/config/offers.js:17), but only together with the amount set behind the link at the provider. Orders still pending from before the deploy keep their old total (see "Orders from before the deploy" above). Then update all of these:
  - [server/everflow.test.mjs:9](server/everflow.test.mjs:9) asserts 9 / 15 / 20.
  - [server/i18n.test.mjs:100](server/i18n.test.mjs:100) and [server/i18n.test.mjs:118](server/i18n.test.mjs:118) post pack-2 with `total: 15`.
  - [server/i18n.test.mjs:85](server/i18n.test.mjs:85) asserts the 3-pack saving (7), and [server/orders.test.mjs:146](server/orders.test.mjs:146) the 1-pack total (9).
  - [server/i18n.test.mjs:127](server/i18n.test.mjs:127), [server/i18n.test.mjs:135](server/i18n.test.mjs:135) and [server/i18n.test.mjs:139](server/i18n.test.mjs:139) assert the entry price `CHF 9.–` in the German, English and French pages.
  - The French text hard-coded in [index.html:12](index.html:12) and [index.html:21](index.html:21), and the price table in [README.md:98](README.md:98).
- **Add an offer.** Update `OFFERS` ([src/config/offers.js:17](src/config/offers.js:17)), `TRACKING_LINKS` ([server/everflow.mjs:15](server/everflow.mjs:15)) and `IMAGE_PATHS` ([server/everflow.mjs:45](server/everflow.mjs:45)), and add an image in `public/images/everflow/`.
  - Also give it a code in `/admin`. The value is not used on `www.molipy8trk.com`. But while the path contains `{code}`, the redirect answers 409 `payment_unavailable` for the new offer until it has one ([server/index.mjs:214](server/index.mjs:214)), and saving with the redirect enabled is refused ([src/lib/redirectPayment.js:92](src/lib/redirectPayment.js:92)). The other offers keep working.
  - Update these tests:
    - [server/everflow.test.mjs:9](server/everflow.test.mjs:9).
    - The `images` fixture at [server/everflow.test.mjs:37](server/everflow.test.mjs:37). Without it, the offer loops at :58 and :132 get 422 `unsupported_offer` instead of 200.
    - The packs map at [server/everflow.test.mjs:74](server/everflow.test.mjs:74) and the order count at [server/everflow.test.mjs:82](server/everflow.test.mjs:82).
    - The EUR test fixture `TEST_EUR` at [server/i18n.test.mjs:14](server/i18n.test.mjs:14) and its assertion at [server/i18n.test.mjs:88](server/i18n.test.mjs:88), which cover exactly three offers.
- **Add a currency.** Update `PRICES` and `currencyForCountry` ([src/config/offers.js:63](src/config/offers.js:63)), `LINKS_BY_CURRENCY` ([server/everflow.mjs:22](server/everflow.mjs:22)) and the CHF-for-every-country assertions ([server/i18n.test.mjs:64](server/i18n.test.mjs:64), [server/i18n.test.mjs:72](server/i18n.test.mjs:72), [server/i18n.test.mjs:77](server/i18n.test.mjs:77)).
  - For EUR, also update the assertions that EUR is not ready: [server/i18n.test.mjs:63](server/i18n.test.mjs:63), [server/i18n.test.mjs:82](server/i18n.test.mjs:82) and [server/i18n.test.mjs:107](server/i18n.test.mjs:107). The `withTestEur` helper ([server/i18n.test.mjs:15](server/i18n.test.mjs:15)) sets `PRICES.EUR` to `null` when it finishes, so make it restore the previous value instead.
  - `formatMoney` has locales for `fr` and `de` only, so English falls back to `fr-FR` formatting. Add an `en` entry to `EUR_LOCALES` ([src/config/offers.js:90](src/config/offers.js:90)), or generalise it for the new currency.
  - On the redirect path, a non-CHF currency is refused unless the domain is exactly `www.molipy8trk.com` ([server/index.mjs:204](server/index.mjs:204)). The generic builder can only charge CHF.

Running the tests: there is no `npm test` script, so use the Node test runner.

```
node --test server/everflow.test.mjs server/checkout-url.test.mjs server/traffic-source.test.mjs
node --test server/orders.test.mjs server/stock.test.mjs server/i18n.test.mjs
node --test server/*.test.mjs
npm run build
```

CI runs the last two commands before every deploy ([.github/workflows/deploy-vps.yml:64](.github/workflows/deploy-vps.yml:64)). Deploys are started by hand, so a merged change is not live until someone runs the workflow.

No test imports the route in [server/index.mjs:191](server/index.mjs:191), so `/api/checkout/redirect` itself is untested, and that is the path live traffic uses. After a change, place one test order per offer, each with a different e-mail and phone. The same customer within 48 hours gets the first order's link back ([server/orders.mjs:159](server/orders.mjs:159)). Decline the cookie banner so no ad events fire, and cancel the test orders in `/admin` afterwards.

## 11. Example link

This link is the output of actually running this call against the current code:

`buildEverflowUrl('pack-2', customer, 'https://destockage-suisse.store/images/everflow/pack-2.png', '', '00000000-0000-4000-8000-000000000000', { currency: 'CHF', lang: 'fr' })`

- **Builder:** the approved builder, for a French visitor who came from a Snapchat ad and gave consent. The redirect route uses this builder whenever the `/admin` domain is exactly `www.molipy8trk.com`.
- **Customer (fake data):** Test Example, test@example.ch, phone `079 000 00 00` (the form sends it as `+41 79 000 00 00`), Rue Exemple 1, App. 2, 1000 Lausanne. The customer object returned by `validateOrder` gives the same link.
- `cleanCheckoutUrl` leaves this link unchanged.

```
https://www.molipy8trk.com/2J23GL9/WXS9LLN/?sub10=Test&adv3=Example&sub3=1000&sub4=test%40example.ch&sub6=Lausanne&sub7=Rue+Exemple+1%2C+App.+2&sub8=%2B41790000000&adv1=Ariel+All-in-1+PODS+%E2%80%93+2+sachets+%28120+capsules%29&adv2=https%3A%2F%2Fdestockage-suisse.store%2Fimages%2Feverflow%2Fpack-2.png&sub1=00000000-0000-4000-8000-000000000000&ScCid=00000000-0000-4000-8000-000000000000
```

- **With a Meta click instead:** `sub1` would carry the fbclid, and `fbclid=` would replace `ScCid=`.
- **In another language:** only `adv1` changes. English gives `adv1=Ariel+All-in-1+PODS+%E2%80%93+2+pouches+%28120+pods%29`. German gives `adv1=Ariel+All-in-1+PODS+%E2%80%93+2+Beutel+%28120+Kapseln%29`.
- **With `buildRedirectUrl`:** this is what the `/admin` preview runs, and what the route runs for any domain other than exactly `www.molipy8trk.com`. Settings: the default parameter list, pathTemplate `/2J23GL9/{code}/`, code `WXS9LLN`, the default "Nom transmis", origin `https://destockage-suisse.store`. The link is the same except for two values: `sub8=%2B41+79+000+00+00` and `adv2=https%3A%2F%2Fdestockage-suisse.store%2Fimages%2Fpackshot.webp`.
  - With the domain `molipy8trk.com` (no `www`), the route really does use this builder. The base becomes `https://molipy8trk.com/2J23GL9/WXS9LLN/`, and `sub1`/`ScCid` are still added.
  - With the default pathTemplate `/{code}`, the base would be `https://www.molipy8trk.com/WXS9LLN`.
  - If "Nom transmis" is empty, `adv1` becomes `Ariel+All-in-1+PODS+%E2%80%93+2+sachets`, without the capsule count. For a German or English visitor, `adv1` stays in French.
