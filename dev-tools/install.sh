#!/bin/bash

# display ascii art
cat $(dirname "$BASH_SOURCE")/asciiArt.txt

if [ ! -x "$(command -v node)" ]; then
    echo "NodeJS is not installed. Please install it manually and run this script again." >&2
    exit 1
fi

cd $(dirname "$BASH_SOURCE")/..
npm install