const { ethers } = require("ethers");

async function main() {
    const [walletAddress, privateKey, signature, contractAddress] = process.argv.slice(2);
    
    const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(
        contractAddress,
        ["function mint(uint256 amount, bytes signature) external payable"],
        wallet
    );

    console.log("// INJECTING_MOLTZ_TO_BLOCKCHAIN...");
    
    try {
        const tx = await contract.mint(1, signature, {
            value: ethers.parseEther("0.0005")
        });
        console.log(`// TRANSACTION_SENT: ${tx.hash}`);
        await tx.wait();
        console.log("// INJECTION_COMPLETE: ACCESS GRANTED");
    } catch (error) {
        console.error("// [ERROR] INJECTION_FAILED:", error.reason || error.message);
        process.exit(1);
    }
}

main();