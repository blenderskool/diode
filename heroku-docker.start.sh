#!/bin/sh

/usr/bin/redis-server &
npm run start &

wait -n
exit $?
