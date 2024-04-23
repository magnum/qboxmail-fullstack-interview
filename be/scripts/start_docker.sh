#!/bin/bash
# run docker

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

docker-compose -f docker-compose-${ENVIRONMENT}.yml up
