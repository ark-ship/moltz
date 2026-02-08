from web3 import Web3

# CONFIG
RPC = "https://sepolia.base.org"
CONTRACT_ADDR = "0x738020293244D5b195DEb83dA1de6F2dC2050584"
PRIVATE_KEY = "MASUKKAN_PRIVATE_KEY_MU" # Hati-hati jangan di-share!

w3 = Web3(Web3.HTTPProvider(RPC))
account = w3.eth.account.from_key(PRIVATE_KEY)

# ABI MINT
ABI = [{"inputs":[{"internalType":"uint256","name":"_mintAmount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"payable","type":"function"}]
contract = w3.eth.contract(address=CONTRACT_ADDR, abi=ABI)

def execute_mint():
    try:
        print(f"// INITIATING MINT FOR {account.address}")
        
        # Ambil nonce terbaru
        nonce = w3.eth.get_transaction_count(account.address)
        
        # Bangun Transaksi
        tx = contract.functions.mint(1).build_transaction({
            'from': account.address,
            'value': w3.to_wei(0.0001, 'ether'),
            'nonce': nonce,
            'gas': 200000,
            'maxFeePerGas': w3.to_wei('1.5', 'gwei'),
            'maxPriorityFeePerGas': w3.to_wei('1', 'gwei'),
            'chainId': 84532 # Base Sepolia
        })
        
        # Tanda tangan transaksi
        signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        
        # Kirim transaksi (Gunakan raw_transaction dengan garis bawah untuk versi v6+)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        
        print(f"// MINT SUCCESS: https://sepolia.basescan.org/tx/{w3.to_hex(tx_hash)}")
    except Exception as e:
        print(f"// ERROR: {e}")

if __name__ == "__main__":
    execute_mint()