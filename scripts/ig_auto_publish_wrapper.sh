#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")/.."

export IG_BUSINESS_ID="17841414456289907"
export IG_TOKEN_PATH="/Users/macthive/.openclaw/secrets/ig_access_token.txt"

node scripts/ig_auto_publish_from_blog.mjs
