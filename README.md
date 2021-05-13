# Notify-bot for Teams

This is a bot for Microsoft Teams that allows you receive alerts via webhooks. You can add it to a conversation or a team and it will generate a new webhook endpoint that forwards messages to that.

This bot is meant to be deployed on Cloudflare Workers, and it stores data on Workers KV.

## Try it live

TODO

## Development guide

### Environments

There are 3 environments for this bot:

- local: designed for running locally via `wrangler dev`  
  (worker name: `notify-cfbot-local`)
- dev: deployed to `https://notify-cfbot.italypaleale.workers.dev`  
  (worker name: `notify-cfbot`)
- production: deployed to `https://notifier.italypaleale.me`
  (worker name: `notify-cfbot-production`)

### Run locally

```sh
# Set CF_ACCOUNT_ID to your Cloudflare Account ID
export CF_ACCOUNT_ID=..
wrangler dev --env local
```

Note: to be able to communicate with the [Bot Framework Emulator](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-debug-emulator), you may need to create a tunnel with ngrok on the port the Bot Emulator is listening to first:

```sh
# Set the port to the one Bot Framework Emulator is listening to
ngrok http :49482
```

Then start wrangler with:

```sh
# Set the URL of the ngrok endpoint
export SERVICE_URL_OVERRIDE=https://****.ngrok.io
# Set CF_ACCOUNT_ID to your Cloudflare Account ID
export CF_ACCOUNT_ID=..
wrangler dev --env local
```

This is because the Bot Framework Emulator is running on localhost, whereas the dev environment for Workers runs on the Cloudflare infrastructure, so localhost is not available there.

### Create KV namespaces

Create for the 3 environments and the preview space:

```sh
# Set CF_ACCOUNT_ID to your Cloudflare Account ID
export CF_ACCOUNT_ID=..
KV_NAME="notifycfbot_webhooks"
wrangler kv:namespace create "${KV_NAME}_preview"
wrangler kv:namespace create "${KV_NAME}_dev"
wrangler kv:namespace create "${KV_NAME}_production"
```

### Set secrets

```sh
# Set CF_ACCOUNT_ID to your Cloudflare Account ID
export CF_ACCOUNT_ID=..
# For dev
wrangler secret put TEAMS_APP_PASSWORD
wrangler secret put TEAMS_APP_PASSWORD --env local
wrangler secret put TEAMS_APP_PASSWORD --env production
```
