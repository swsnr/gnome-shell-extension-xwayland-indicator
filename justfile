default:
    just --list

test-all:
    npm ci
    npx tsc --project .
    npx eslint .
    npx prettier --check .
