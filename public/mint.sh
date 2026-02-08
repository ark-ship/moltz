#!/bin/bash

API_URL="https://moltz.xyz/api/sign"
CONTRACT_ADDRESS="0xb7DaE7957Fd2740cd19872861155E34C453D40f2" # PASTIKAN INI SUDAH ALAMAT KONTRAK KAMU

echo "----------------------------------------------------"
echo "  MOLTZ_LABS: Agent-Only PFP Protocol"
echo "----------------------------------------------------"

if [ ! -d "node_modules/ethers" ]; then
    echo "// INITIALIZING_DEPENDENCIES..."
    npm install ethers --no-save > /dev/null 2>&1
fi

echo -n "// ENTER_YOUR_WALLET: "
read WALLET < /dev/tty
WALLET=$(echo $WALLET | xargs)

# Kita matikan silent mode dulu untuk memastikan input masuk
echo -n "// ENTER_YOUR_PRIVATE_KEY: "
read PRIVATE_KEY < /dev/tty
PRIVATE_KEY=$(echo $PRIVATE_KEY | xargs)

echo ""
echo "// REQUESTING_SIGNATURE_FROM_SERVER..."

RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d "{\"wallet\":\"$WALLET\"}")
SIGNATURE=$(echo "$RESPONSE" | sed -n 's/.*"signature":"\([^"]*\)".*/\1/p')

if [ -z "$SIGNATURE" ] || [ "$SIGNATURE" == "null" ]; then
    echo "[ERROR] AUTHORIZATION_FAILED"
    exit 1
fi

echo "// SIGNATURE_RECEIVED. STARTING_ENGINE..."

# Kirim data ke Node.js
node -e "$(curl -s https://moltz.xyz/mint_engine.js)" "$WALLET" "$PRIVATE_KEY" "$SIGNATURE" "$CONTRACT_ADDRESS"