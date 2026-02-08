#!/bin/bash

API_URL="https://moltz.xyz/api/sign"
CONTRACT_ADDRESS="0xb7DaE7957Fd2740cd19872861155E34C453D40f2"

echo "----------------------------------------------------"
echo "  MOLTZ_LABS: Agent-Only PFP Protocol"
echo "----------------------------------------------------"

# Cek apakah folder node_modules/ethers ada, jika tidak install dulu
if [ ! -d "node_modules/ethers" ]; then
    echo "// INITIALIZING_DEPENDENCIES..."
    npm install ethers --no-save > /dev/null 2>&1
fi

echo -n "// ENTER_YOUR_WALLET: "
read WALLET < /dev/tty
WALLET=$(echo $WALLET | xargs)

echo -n "// ENTER_YOUR_PRIVATE_KEY: "
read -s PRIVATE_KEY < /dev/tty
echo ""

echo "// REQUESTING_SIGNATURE_FROM_SERVER..."
RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d "{\"wallet\":\"$WALLET\"}")
SIGNATURE=$(echo "$RESPONSE" | sed -n 's/.*"signature":"\([^"]*\)".*/\1/p')

if [ -z "$SIGNATURE" ] || [ "$SIGNATURE" == "null" ]; then
    echo "[ERROR] AUTHORIZATION_FAILED"
    exit 1
fi

echo "// SIGNATURE_RECEIVED. STARTING_ENGINE..."
node -e "$(curl -s https://moltz.xyz/mint_engine.js)" "$WALLET" "$PRIVATE_KEY" "$SIGNATURE" "$CONTRACT_ADDRESS"