#!/usr/bin/env bash

set -euo pipefail

DEPLOY_PATH="/var/www/odysseus/jumpui/"
SOURCE_PATH="dist/odysseus-jump-ui/"

npm run apigen:live && npm run build:live

rsync -avzr --delete "$SOURCE_PATH" "$DEPLOY_PATH"
echo "Deployed to $DEPLOY_PATH"
