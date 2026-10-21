# Ariel VPS deployment

The `Deploy Ariel to VPS` GitHub Action runs manually from `main`. It builds and tests the app, sends a release to the dedicated `ariel` account, installs production dependencies, switches `/opt/ariel/current`, restarts `ariel.service`, checks the homepage and `/api/stock`, and restores the prior release if the check fails. Persistent orders, stock, reviews, and admin settings live in `/var/lib/ariel` and are not included in releases. The `preview` choice builds without merchant disclosures; the `configured` choice requires them. Everflow activation is controlled separately in the VPS environment file.

## VPS setup

The `ariel` account and key access have been configured on `85.11.182.76`. The checked-in systemd unit is installed. The existing `wallet-payment` Nginx site and service have not been changed. If the unit changes, update it as root:

```sh
install -m 644 deploy/ariel.service /etc/systemd/system/ariel.service
systemctl daemon-reload
```

`/etc/ariel/ariel.env` is configured with `root:ariel` ownership and mode `640`. It contains the admin password and `PUBLIC_ORIGIN=https://destockage-suisse.store`. Keep `EVERFLOW_ENABLED=false` until the three public image URLs are approved; then set `EVERFLOW_IMAGES_APPROVED=true` and `EVERFLOW_ENABLED=true`. Both `destockage-suisse.store` and `www.destockage-suisse.store` resolve to this VPS. Their Let's Encrypt certificate and the dedicated [Nginx site](ariel.nginx.conf) are installed; renewal passed a dry run. The site proxies only to `127.0.0.1:8787`. Do not reuse or alter the existing `twpayment.space` site.

## GitHub environment

The `production` environment contains `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, and the pinned `VPS_KNOWN_HOSTS`. For a configured build, add the secret `VITE_ENV_FILE` with a production dotenv file containing only public `VITE_` variables. The workflow requires the merchant identity, support email, and return terms listed in `scripts/check-deploy-env.mjs`. The file is used only to compile the storefront and is not sent to the VPS. Any `VITE_` value is public in the browser bundle; never put credentials there.

Run the `preview` workflow to inspect the public site with payment disabled. Switch to `configured` after the merchant information is complete, then approve the product images before enabling Everflow. Verify the public homepage, `/api/stock`, and all three checkout offer URLs using synthetic customer data. External provider prefill needs separate browser inspection; an outgoing redirect does not prove payment.
