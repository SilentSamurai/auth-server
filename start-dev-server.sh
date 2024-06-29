


#!/bin/bash

cd ui
npm run UI:BUILD:WATCH &

cd ../srv
npm run start:debug

kill $(jobs -p)