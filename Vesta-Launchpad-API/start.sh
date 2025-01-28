#!/bin/sh
#npx prisma db push --accept-data-loss
#node ./dist/server.js

npx prisma generate
node ./dist/server.js
