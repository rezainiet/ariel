# Ariel VPS deployment

The `Deploy Ariel to VPS` GitHub Action runs manually from `main`. It builds and tests the app, sends a release to the dedicated `ariel` account, installs production dependencies, switches `/opt/ariel/current`, restarts `ariel.service`, checks `/api/stock`, and restores the prior release if the check fails. Persistent orders, stock, reviews, and admin settings live in `/var/lib/ariel` and are not included in releases.

## VPS setup

The `ariel` account and key access have been configured on `85.11.182.76`. The checked-in systemd unit is installed but not enabled or started. The existing `wallet-payment` Nginx site and service have not been changed. If the unit changes, update it as root:

```sh
install -m 644 deploy/ariel.service /etc/systemd/system/ariel.service
systemctl daemon-reload
```

Create `/etc/ariel/ariel.env` with `root:ariel` ownership and mode `640`. It must contain a unique `ADMIN_PASSWORD` of at least 12 characters. Keep `EVERFLOW_ENABLED=false` until the HTTPS domain and the three public image URLs are approved. When ready, add `PUBLIC_ORIGIN=https://your-shop-domain`, `EVERFLOW_IMAGES_APPROVED=true`, and `EVERFLOW_ENABLED=true`. The domain's Nginx site should proxy only to `127.0.0.1:8787`, and its TLS certificate should cover that domain. Do not reuse or alter the existing `twpayment.space` site.

## GitHub environment

The `production` environment contains `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, and the pinned `VPS_KNOWN_HOSTS`. Add the secret `VITE_ENV_FILE` with a production dotenv file containing only public `VITE_` variables. The workflow requires the merchant identity, support email, and return terms listed in `scripts/check-deploy-env.mjs`. The file is used only to compile the storefront and is not sent to the VPS. Any `VITE_` value is public in the browser bundle; never put credentials there.

Run the workflow from GitHub Actions after the domain, merchant information, product approval, and image approval are complete. Then verify the public homepage, `/api/stock`, and all three checkout offer URLs using synthetic customer data. External provider prefill needs separate browser inspection; an outgoing redirect does not prove payment.
