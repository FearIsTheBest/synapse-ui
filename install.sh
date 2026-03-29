#!/bin/bash

# Synapse X V3 Installer for macOS

architecture=$(uname -m)
version="1.0.0"  # Version Number Here Fr

if [[ "$architecture" == "arm64" ]]; then
  url="https://github.com/FearIsTheBest/synapse-ui/releases/download/v${version}/Synapse%20X%20V3-${version}-arm64.dmg"
elif [[ "$architecture" == "x86_64" ]]; then
  url="https://github.com/FearIsTheBest/synapse-ui/releases/download/v${version}/Synapse%20X%20V3-${version}-mac.dmg"
else
  echo "Unsupported architecture: $architecture"
  exit 1
fi

mkdir -p "/tmp/SynapseXV3"
if [ -d "/Applications/Synapse X V3.app" ]; then
  echo "Synapse X V3 is already installed. Deleting..."
  rm -rf "/Applications/Synapse X V3.app"
  echo "Synapse X V3 has been deleted."
else
  echo "Synapse X V3 is not installed. Proceeding with installation."
fi
clear
echo "Downloading Synapse X V3 for $architecture..."
curl -L -o "/tmp/SynapseXV3/Synapse-X-V3.dmg" "$url"

if [ $? -ne 0 ]; then
  echo "Download failed. Exiting."
  rm -rf "/tmp/SynapseXV3"
  exit 1
fi

echo "Mounting DMG..."
hdiutil attach "/tmp/SynapseXV3/Synapse-X-V3.dmg" -mountpoint "/tmp/SynapseXV3/mnt"

echo "Copying app to Applications..."
cp -r "/tmp/SynapseXV3/mnt/Synapse X V3.app" "/Applications/"

echo "Unmounting DMG..."
hdiutil detach "/tmp/SynapseXV3/mnt"

rm -rf "/tmp/SynapseXV3"
clear
echo "✓ Synapse X V3 has been successfully installed!"
echo "You can now launch it from Applications or Spotlight."
