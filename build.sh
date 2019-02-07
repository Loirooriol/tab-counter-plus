#!/bin/bash

set -e

mkdir -p artifacts

declare -a IGNORE_FILES
IGNORE_FILES[${#IGNORE_FILES[@]}]='**/.*.sw*'
IGNORE_FILES[${#IGNORE_FILES[@]}]='**/*.vim'
IGNORE_FILES[${#IGNORE_FILES[@]}]='artifacts'
IGNORE_FILES[${#IGNORE_FILES[@]}]='docs'
IGNORE_FILES[${#IGNORE_FILES[@]}]='build.sh'
IGNORE_FILES[${#IGNORE_FILES[@]}]='*.txt'
IGNORE_FILES[${#IGNORE_FILES[@]}]='*.md'


manifest="./manifest.json"

function getExtensionName() {
    extensionName=`jq .name "$manifest"`
    echo ${extensionName//\"}
}

function getVersion() {
    version=`jq .version "$manifest"`
    echo ${version//\"}
}

function echoExtensionVersion() {
    extensionName=`getExtensionName`
    version=`getVersion`
    echo "Building '$extensionName' version: $version"
}

# Build for Firefox:
echo "----- Building for Firefox -----"
artifactsDir="artifacts/firefox"
echoExtensionVersion
web-ext build --source-dir . --artifacts-dir "${artifactsDir}" --overwrite-dest --ignore-files "${IGNORE_FILES[@]}"
echo "----- Built for Firefox -----"
echo

