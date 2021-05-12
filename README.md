# Notify-bot

## Run in dev mode

```sh
# Set CF_ACCOUNT_ID to your Cloudflare Account ID
export CF_ACCOUNT_ID=..
wrangler dev --env local
```

Note: to be able to communicate with the Bot Framework Emulator, you may need to create a tunnel with ngrok on port 49482 first:

```sh
ngrok :49482
```

Then start wrangler with:

```sh
# Set the URL of the ngrok endpoint
export SERVICE_URL_OVERRIDE=https://****.ngrok.io
# Set CF_ACCOUNT_ID to your Cloudflare Account ID
export CF_ACCOUNT_ID=..
wrangler dev --env local
```

This is because the Bot Framework Emulator is running on localhost, while a dev environment for Workers runs on the Cloudflare infrastructure, so localhost is not available there.

## Create KV namespaces

Create for the 3 environments and the preview space:

```sh
# Set CF_ACCOUNT_ID to your Cloudflare Account ID
export CF_ACCOUNT_ID=..
KV_NAME="notifycfbot_webhooks"
wrangler kv:namespace create "${KV_NAME}_preview"
wrangler kv:namespace create "${KV_NAME}_dev"
wrangler kv:namespace create "${KV_NAME}_staging"
wrangler kv:namespace create "${KV_NAME}_production"
```

## Secrets

```sh
# Set CF_ACCOUNT_ID to your Cloudflare Account ID
export CF_ACCOUNT_ID=..
# For dev
wrangler secret put TEAMS_APP_PASSWORD
wrangler secret put TEAMS_APP_PASSWORD --env local
wrangler secret put TEAMS_APP_PASSWORD --env staging
wrangler secret put TEAMS_APP_PASSWORD --env production
```
