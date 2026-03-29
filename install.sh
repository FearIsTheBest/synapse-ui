#!/bin/bash

# Synapse X V3 Installer for macOS

ARCH=$(uname -m)
VERSION="1.0.0"

if [[ "$ARCH" == "arm64" ]]; then
  FILENAME="synapse-x-v3-${VERSION}-arm64.dmg"
elif [[ "$ARCH" == "x86_64" ]]; then
  FILENAME="synapse-x-v3-${VERSION}-mac.dmg"
else
  echo "Unsupported architecture: $ARCH"
  exit 1
fi

BASE_URL="https://github.com/FearIsTheBest/synapse-ui/releases/download/v${VERSION}"
DOWNLOAD_URL="${BASE_URL}/${FILENAME}"

mkdir -p "/tmp/SynapseXV3"
if [ -d "/Applications/Synapse X V3.app" ]; then
  echo "Synapse X V3 is already installed. Deleting..."
  rm -rf "/Applications/Synapse X V3.app"
  echo "Synapse X V3 has been deleted."
else
  echo "Synapse X V3 is not installed. Proceeding with installation."
fi
clear
echo "Downloading Synapse X V3 for $ARCH..."
echo "Downloading from: $DOWNLOAD_URL"
curl -L -o "/tmp/SynapseXV3/synapse.dmg" "$DOWNLOAD_URL"

if [ $? -ne 0 ]; then
  echo "Download failed. Exiting."
  rm -rf "/tmp/SynapseXV3"
  exit 1
fi

echo "Mounting DMG..."
hdiutil attach "/tmp/SynapseXV3/synapse.dmg" -mountpoint "/tmp/SynapseXV3/mnt"

echo "Copying app to Applications..."
cp -r "/tmp/SynapseXV3/mnt/Synapse X V3.app" "/Applications/"

echo "Unmounting DMG..."
hdiutil detach "/tmp/SynapseXV3/mnt"

rm -rf "/tmp/SynapseXV3"
clear
echo "✓ Synapse X V3 has been successfully installed!"
echo "You can now launch it from Applications or Spotlight."
