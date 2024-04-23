#!/bin/bash

ENVIRONMENT=${1}
if [ -z "${ENVIRONMENT}" ]
then
	echo "MISSING ENVIRONMENT VARIABLE"
	exit 0
fi
if [ ! "${ENVIRONMENT}" = "development" -a ! "${ENVIRONMENT}" = "development_mtm" ]
then
	echo "ONLY development AND development_mtm ARE ENVIRONMENT ALLOWED VALUES"
	exit 0
fi

NODE_ENV=development TARGET_ENV=${ENVIRONMENT} npx webpack-dev-server --progress --colors --watch --config ./config/webpack.config.dev.js
