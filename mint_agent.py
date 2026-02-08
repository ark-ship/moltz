from web3 import Web3
from eth_account.messages import encode_defunct
from hexbytes import HexBytes

# 1. KONFIGURASI JARINGAN & KONTRAK
RPC_URL = "https://sepolia.base.org"
CONTRACT_ADDRESS = "0x738020293244D5b195DEb83dA1de6F2dC2050584"
CHAIN_ID = 84532

# 2. DATA SIGNER (Kunci dari .env.local kamu)
# Ini adalah kunci yang memberikan 'ijin' minting
SIGNER_PRIV_KEY = "c5c0324c4cc10b030be777d7c03a07568b8d8a4e2c7206627aa504bebfd0569a"

# 3. INPUT USER
user_wallet = input("// ENTER_YOUR_WALLET_ADDRESS: ")
user_priv_key = input("// ENTER_YOUR_PRIVATE_KEY: ")

w3 = Web3(Web3.HTTPProvider(RPC_URL))

# 4. PROSES GENERATE SIGNATURE
print("// GENERATING_SECURE_SIGNATURE...")
amount = 1
# Membuat hash yang sama dengan logika Smart Contract MOLTZ
message_hash = Web3.solidity_keccak(['address', 'uint256'], [Web3.to_checksum_address(user_wallet), amount])
encoded_message = encode_defunct(primitive=message_hash)
signed_message = w3.eth.account.sign_message(encoded_message, private_key=SIGNER_PRIV_KEY)

# Ini variabel signature yang tadi error karena belum didefinisikan
signature = signed_message.signature.hex()

print(f"// SIGNATURE_ACQUIRED: {signature[:10]}...")

# 5. EKSEKUSI MINTING ON-CHAIN
print("// EXECUTING_ON_CHAIN_MINT...")

abi = [{"inputs":[{"internalType":"uint256","name":"_mintAmount","type":"uint256"},{"internalType":"bytes","name":"_signature","type":"bytes"}],"name":"mint","outputs":[],"stateMutability":"payable","type":"function"}]
contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=abi)

try:
    nonce = w3.eth.get_transaction_count(Web3.to_checksum_address(user_wallet))
    
    # Perbaikan Utama: Menggunakan HexBytes agar terbaca sebagai 'bytes' di Smart Contract
    tx = contract.functions.mint(amount, HexBytes(signature)).build_transaction({
        'from': Web3.to_checksum_address(user_wallet),
        'value': w3.to_wei(0.0001, 'ether'),
        'nonce': nonce,
        'gas': 300000,
        'maxFeePerGas': w3.to_wei('1.5', 'gwei'),
        'maxPriorityFeePerGas': w3.to_wei('1', 'gwei'),
        'chainId': CHAIN_ID
    })
    
    signed_tx = w3.eth.account.sign_transaction(tx, user_priv_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"// SUCCESS! CHECK_BASESCAN: https://sepolia.basescan.org/tx/{w3.to_hex(tx_hash)}")
    
except Exception as e:
    print(f"// ERROR_EXECUTING_MINT: {str(e)}")