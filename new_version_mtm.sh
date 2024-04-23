#!/bin/bash

if [ ! -f ./be/package.json ]
then
    echo "missing version file"
    exit 1
fi
VERSION=$(grep '"version_mtm"' be/package.json | grep -Eo "[0-9\.]*")
if [ $(git ls-remote --tags origin | grep "refs/tags/v${VERSION}_mtm$" | wc -l) -gt 0 ]
then
    echo "TAG v${VERSION}_mtm ALREADY EXIST, PLEASE CREATE A NEW VERSION AND RETRY"
    exit 1
fi

git tag -a "v${VERSION}_mtm" -m "version ${VERSION}_mtm"
git push origin v${VERSION}_mtm
