# Ariel VPS deployment

The `Deploy Ariel to VPS` GitHub Action runs manually from `main`. It builds and tests the app, sends a release to the dedicated `ariel` account, installs production dependencies, switches `/opt/ariel/current`, restarts `ariel.service`, checks the homepage and `/api/stock`, and restores the prior release if the check fails. It then checks the public storefront and analytics API. Persistent orders, stock, reviews, analytics, and admin settings live in `/var/lib/ariel` and are not included in releases. The `preview` choice builds without merchant disclosures; the `configured` choice requires them. Everflow activation is controlled separately in the VPS environment file.

## VPS setup

The replacement Ariel VPS is `209.74.71.30`, SSH port `22022`. The dedicated `ariel` account uses the GitHub Actions deployment key. Node 22, Nginx, Certbot, and the checked-in systemd unit are installed. If the unit changes, update it as root:

```sh
install -m 644 deploy/ariel.service /etc/systemd/system/ariel.service
systemctl daemon-reload
```

`/etc/ariel/ariel.env` has `root:ariel` ownership and mode `640`. It contains a newly generated admin password and `PUBLIC_ORIGIN=https://destockage-suisse.store`. The matching local, gitignored backup is `.env.production.server.local`. Keep `EVERFLOW_ENABLED=false` until the three public image URLs are approved; then set `EVERFLOW_IMAGES_APPROVED=true` and `EVERFLOW_ENABLED=true`. During DNS and certificate setup, [the bootstrap Nginx site](ariel.nginx.bootstrap.conf) proxies HTTP to `127.0.0.1:8787` and serves ACME challenges. The Let's Encrypt certificate for the apex and `www` was issued on 22 October 2026 and expires on 20 January 2027. The [HTTPS site](ariel.nginx.conf) is active, and `certbot.timer` is enabled. Renewal was verified with `certbot renew --dry-run`. On a fresh VPS, `certbot certonly --webroot` does not create the Nginx TLS helper files; copy `options-ssl-nginx.conf` from the `python3-certbot-nginx` package and `ssl-dhparams.pem` from the `python3-certbot` package to `/etc/letsencrypt/` before activating the HTTPS site.

The former VPS at `85.11.182.76` is unreachable. Its `/var/lib/ariel` data has **not** been migrated. Recover and copy it before relying on historical orders, stock, reviews, admin payment settings, or traffic reports. Do not overwrite newly created data on the replacement without reconciling both copies. The replacement currently starts with a fresh data directory and payment disabled.

## GitHub environment

The `production` environment contains `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_SSH_KEY`, and the pinned `VPS_KNOWN_HOSTS`. For a configured build, add the secret `VITE_ENV_FILE` with a production dotenv file containing only public `VITE_` variables. The workflow requires the merchant identity, support email, and return terms listed in `scripts/check-deploy-env.mjs`. The file is used only to compile the storefront and is not sent to the VPS. Any `VITE_` value is public in the browser bundle; never put credentials there.

Run the `preview` workflow to inspect the public site with payment disabled. The `incomplete` mode builds with the missing merchant and returns fields visibly marked in red; it does not need `VITE_ENV_FILE`. It is a temporary state requested for this store and does not satisfy the seller disclosure requirements for launch. Once the values are supplied, add `VITE_ENV_FILE` and use `configured`. The deploy script refuses a future `preview` release while Everflow is enabled, so an empty preview build cannot silently replace the live checkout storefront. After the product images are approved, set `EVERFLOW_IMAGES_APPROVED=true` and `EVERFLOW_ENABLED=true` in the root-owned environment file and restart `ariel.service`. Verify the public homepage, `/api/stock`, and all three checkout offer URLs using synthetic customer data. External provider prefill needs separate browser inspection; an outgoing redirect does not prove payment.

## Visitor country (language and currency)

The storefront picks German for Germany and Austria, French for France, and the browser language for
Switzerland and other countries (`server/geo.mjs`). The country comes only from the `X-Geo-Country` header that
this Nginx site writes itself; until GeoIP2 is set up the header is empty and visitors fall back to their browser
language, with CHF prices. To enable it on the VPS:

1. `sudo apt install libnginx-mod-http-geoip2`
2. Put a country `.mmdb` database at `/var/lib/GeoIP/country.mmdb` and refresh it monthly, either MaxMind
   GeoLite2-Country (free account, `geoipupdate`) or DB-IP "IP to Country Lite" (CC BY 4.0). Both licenses
   require an attribution line on the site; add it to the footer before going live.
3. Copy [ariel.nginx.geoip2.conf](ariel.nginx.geoip2.conf) to `/etc/nginx/conf.d/ariel-geoip2.conf`.
4. In the HTTPS site, change `proxy_set_header X-Geo-Country "";` to `proxy_set_header X-Geo-Country $geoip2_country_code;`.
5. Add `GEO_COUNTRY_HEADER=x-geo-country` to `/etc/ariel/ariel.env`, then `sudo nginx -t && sudo systemctl reload nginx`
   and `sudo systemctl restart ariel.service`.
6. Check: `curl -s https://destockage-suisse.store/api/locale` returns the server's own country.

EUR is shown to Germany, Austria and France only once approved EUR prices (`PRICES.EUR` in
`src/config/offers.js`) and three EUR Everflow links (`EUR_TRACKING_LINKS` in `server/everflow.mjs`) exist;
until then every visitor sees and pays CHF.
