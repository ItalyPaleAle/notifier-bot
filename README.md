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

### Test with the Bot Framework Emulator

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

The IDs are used in the `wrangler.toml` file:

- The ID of the `preview` KV is used in all environments for the `preview_id` key
- The ID of the `dev` KV is used in the main environment (the unnamed one)
- The ID of the `production` KV is used in the production environment
- The ID of the `preview` KV is also used in the local environment

### Set secrets

```sh
# Set CF_ACCOUNT_ID to your Cloudflare Account ID
export CF_ACCOUNT_ID=..
# For dev
wrangler secret put TEAMS_APP_PASSWORD
wrangler secret put TEAMS_APP_PASSWORD --env local
wrangler secret put TEAMS_APP_PASSWORD --env production
```

### Bot setup

If you need to set up the bot in Teams App Studio, make sure to:

- Create a new application for this bot with all scopes enabled (personal, team, group chat); leave all other options disabled (bot doesn't support audio/video calls, doesn't support uploading or downloading files, and is not a one-way notification bot)
- The bot application id is the value for the `TEAMS_APP_ID` variable in `wrangler.toml`
- Set the messaging endpoint to `https://<host>/bot/v0/message` (replace `<host>` with the host where your bot is deployed to)
- Generate a new password for the bot, which will be used for the `TEAMS_APP_PASSWORD` secret stored alongside the Worker

### Base URL

In the `wrangler.toml` file, make sure to set the value of `BASE_URL` for all environments. This is only used to show the user the full endpoint of their webhooks.
