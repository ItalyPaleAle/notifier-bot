#!/bin/sh

# ID of the commit
REVISION=bc4b9acd8b78c4d486d5a4664194853517859307

# Fetch the spec and update the file
npx openapi-typescript \
  https://raw.githubusercontent.com/microsoft/botframework-sdk/${REVISION}/specs/botframework-protocol/botframework-channel.json \
    > bot.d.ts

# Format with Prettier
npx prettier --write bot.d.ts
