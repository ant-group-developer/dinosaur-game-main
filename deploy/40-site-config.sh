#!/bin/sh
set -eu
: "${SITE_URL:=https://dino.antfootage.net}"
SITE_URL="${SITE_URL%/}"
case "$SITE_URL" in http://*|https://*) ;; *) echo 'SITE_URL must be an absolute http(s) origin' >&2; exit 1 ;; esac
case "$SITE_URL" in *[!a-zA-Z0-9.:/-]*|*'?'*|*'#'*) echo 'SITE_URL contains unsupported characters' >&2; exit 1 ;; esac
export SITE_URL
for file in index.template.html robots.template.txt sitemap.template.xml; do
  target=$(echo "$file" | sed 's/\.template//')
  envsubst '${SITE_URL}' < "/usr/share/nginx/html/$file" > "/usr/share/nginx/html/$target"
done
