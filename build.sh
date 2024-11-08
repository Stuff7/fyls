#!/bin/bash

npmBin="./node_modules/.bin"
flags="--sourcemap --bundle --outdir=dist --outbase=build --alias:~=./build"
if [[ "$1" = "release" ]]; then
  flags="$flags --drop-labels=DEV"
  pathChanged=""
else
  pathChanged=$(cat)
fi

jsx="$npmBin/jsx src"
sass="$npmBin/sass --style compressed src/style.scss dist/style.css"
esbuild="$npmBin/esbuild build/main.tsx $flags"

if [[ "$pathChanged" == *".scss" ]]; then
  $sass
elif [[ "$pathChanged" == *".tsx" || "$pathChanged" == *".ts" ]]; then
  $jsx
  $esbuild
else
  mkdir -p dist
  rm -rf dist/*

  $jsx
  cp -r public/* dist & $sass & $esbuild & wait
fi
