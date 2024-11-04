import { deployDeleGatorEnvironment } from "@codefi/delegator-core-viem";
import dotenv from "dotenv";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { flowTestnet } from "viem/chains";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.SEPOLIA_RPC_URL as string;

if (!PRIVATE_KEY || !RPC_URL) {
	throw new Error("Missing environment variables");
}

async function main() {
	try {
        const chain = flowTestnet
		console.log("🚀 Starting deployment process...");

		console.log("📦 Initializing account from private key...");
		const account = privateKeyToAccount(PRIVATE_KEY);
		console.log(`✅ Account created: ${account.address}`);

		console.log("🔗 Setting up wallet client...");
		const walletClient = createWalletClient({
			account,
			chain,
			transport: http(RPC_URL),
		});
		console.log("✅ Wallet client initialized");

		console.log("🌐 Setting up public client...");
		const publicClient = createPublicClient({
			chain: flowTestnet,
			transport: http(RPC_URL),
		});
		console.log("✅ Public client initialized");

		const deployedContracts = {
			// 'ContractName': '0x...' as `0x${string}`,
		};

		console.log("📝 Starting DeleGator environment deployment...");
		console.log("⏳ This may take several minutes. Please wait...");

		const startTime = Date.now();
		const environment = await deployDeleGatorEnvironment(
			walletClient,
			publicClient,
			flowTestnet,
			// deployedContracts,
		);
		const endTime = Date.now();
		const deploymentTime = (endTime - startTime) / 1000; // Convert to seconds

		console.log("🎉 Deployment successful!");
		console.log(
			`⏱️ Total deployment time: ${deploymentTime.toFixed(2)} seconds`,
		);
		console.log("\n📄 Deployed contracts:");
		console.table(environment);
	} catch (error) {
		console.error("\n❌ Deployment failed:");
		if (error instanceof Error) {
			console.error(`Error message: ${error.message}`);
			console.error(`Stack trace: ${error.stack}`);
		} else {
			console.error(error);
		}
		process.exit(1);
	}
}

console.log("🏁 Starting deployment script...");
main()
	.then(() => {
		console.log("✨ Script execution completed");
	})
	.catch((error) => {
		console.error("💥 Script execution failed:", error);
	});
