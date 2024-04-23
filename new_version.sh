#!/bin/bash

if [ ! -f ./be/package.json ]
then
    echo "missing version file"
    exit 1
fi
VERSION=$(grep '"version"' be/package.json | grep -Eo "[0-9\.]*")
if [ $(git ls-remote --tags origin | grep "refs/tags/v${VERSION}$" | wc -l) -gt 0 ]
then
    echo "TAG v${VERSION} ALREADY EXIST, PLEASE CREATE A NEW VERSION AND RETRY"
    exit 1
fi

git tag -a "v${VERSION}" -m "version ${VERSION}"
git push origin v${VERSION}
