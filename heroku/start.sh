#!/bin/sh

/usr/bin/redis-server &
npm run start &

# Wait for any process to exit
wait -n
# Exit with status of process that exited first
exit $?
