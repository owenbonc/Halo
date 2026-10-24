#!/bin/sh
# Prepares a clean checkout without discarding work or changing its author.
set -eu
if [ -n "$(git status --porcelain)" ]; then
  echo 'Commit or stash existing work before setup.' >&2
  exit 1
fi
main="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"

git -c credential.helper= -c credential.helper='!gh auth git-credential' fetch -q origin
pnpm install --frozen-lockfile --prefer-offline
# Secrets stay in the main checkout; link, never copy, and never print them.
if [ ! -e .env ] && [ -e "$main/.env" ]; then ln -s "$main/.env" .env; fi
