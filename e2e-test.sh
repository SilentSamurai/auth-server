

#!/bin/bash

#
npm run ui:build
#
npm run start &
#
npm run dev:external:start &
#
sleep 30
#
npm run run:e2e-tests
#
kill $(jobs -p)