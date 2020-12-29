#!/bin/bash

cat $(dirname "$BASH_SOURCE")/asciiArt.txt

if [ ! -x "$(command -v node)" ]; then
    echo "NodeJS is not installed. Please install it manually and run this script again." >&2
    exit 1
fi

cd $(dirname "$BASH_SOURCE")/..

echo "Gandalf the White will transpile all the typescript into pure javascript magic."
npm run transpile

echo "Now he will register your app as a system service."
pm2 start dist/app.js

echo "Start service on startup"
pm2 startup systemd