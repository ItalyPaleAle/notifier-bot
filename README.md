# Notify-bot

## Run in dev mode

```sh
# Set CF_ACCOUNT_ID to your Cloudflare Account ID
CF_ACCOUNT_ID=... wrangler dev
```

## Create KV namespaces

Create for the 3 environments and the preview space:

```sh
KV_NAME="notifycfbot_webhooks"
wrangler kv:namespace create "${KV_NAME}_preview"
wrangler kv:namespace create "${KV_NAME}_dev"
wrangler kv:namespace create "${KV_NAME}_staging"
wrangler kv:namespace create "${KV_NAME}_production"
```
