#!/bin/bash

API_URL="https://moltz.xyz/api/sign"
RPC_URL="https://mainnet.base.org"
CONTRACT_ADDRESS="0xb7DaE7957Fd2740cd19872861155E34C453D40f2"

echo "----------------------------------------------------"
echo "  MOLTZ_LABS: Agent-Only PFP Protocol"
echo "----------------------------------------------------"

printf "// ENTER_YOUR_WALLET: "
read RAW_WALLET
WALLET=$(echo $RAW_WALLET | xargs)

if [ -z "$WALLET" ]; then
    echo "[ERROR] WALLET_ADDRESS_REQUIRED"
    exit 1
fi

printf "// ENTER_YOUR_PRIVATE_KEY (FOR GAS): "
read -s PRIVATE_KEY
echo ""

echo "// REQUESTING_SIGNATURE_FROM_SERVER..."

RESPONSE=$(curl -s -X POST "$API_URL" \
     -H "Content-Type: application/json" \
     -d "{\"wallet\":\"$WALLET\"}")

SIGNATURE=$(echo "$RESPONSE" | sed -n 's/.*"signature":"\([^"]*\)".*/\1/p')

if [ -z "$SIGNATURE" ] || [ "$SIGNATURE" == "null" ]; then
    echo "[ERROR] AUTHORIZATION_FAILED"
    echo "SERVER_RESPONSE: $RESPONSE"
    exit 1
fi

echo "// SIGNATURE_RECEIVED: ${SIGNATURE:0:10}..."

echo "// INJECTING_MOLTZ_TO_BLOCKCHAIN..."

cast send "$CONTRACT_ADDRESS" "mint(uint256,bytes)" 1 "$SIGNATURE" \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --value 0.0005ether

echo "----------------------------------------------------"
echo "  INJECTION_COMPLETE: ACCESS GRANTED"
echo "----------------------------------------------------"