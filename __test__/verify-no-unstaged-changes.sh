#!/bin/bash
# from https://github.com/actions/checkout/blob/25a956c84d5dd820d28caab9f86b8d183aeeff3d/__test__/verify-no-unstaged-changes.sh

if [[ "$(git status --porcelain)" != "" ]]; then
    echo ----------------------------------------
    echo git status
    echo ----------------------------------------
    git status
    echo ----------------------------------------
    echo git diff
    echo ----------------------------------------
    git diff
    echo ----------------------------------------
    echo Troubleshooting
    echo ----------------------------------------
    echo "::error::Unstaged changes detected. Locally try running: git clean -ffdx && npm ci && npm run format && npm run build"
    exit 1
fi