import dotenv from "dotenv";
import { createPublicClient, http, parseEther } from "viem";
import {
	createBundlerClient,
	toCoinbaseSmartAccount,
} from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const main = async () => {
	// Load environment variables
	dotenv.config();

	// Validate environment variables
	if (!process.env.PIMLICO_PRIVATE_KEY || !process.env.PIMLICO_API_KEY)
		throw new Error("PIMLICO_PRIVATE_KEY or PIMLICO_API_KEY not found");
	const PIMLICO_PRIVATE_KEY = process.env.PIMLICO_PRIVATE_KEY;
	const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY;

	// Initialize clients
	const client = createPublicClient({
		chain: sepolia,
		transport: http(),
	});

	// Setup account
	const owner = privateKeyToAccount(PIMLICO_PRIVATE_KEY as `0x${string}`);

	const account = await toCoinbaseSmartAccount({
		client,
		owners: [owner],
	});

	const bundlerClient = createBundlerClient({
		client,
		account,
		paymaster: true,
		transport: http(
			`https://api.pimlico.io/v2/1/rpc?apikey=${PIMLICO_API_KEY}`,
		),
	});

	// Send transaction
	const hash = await bundlerClient.sendUserOperation({
		calls: [
			{
				to: "0xD04D21acfd53AacedF705f92C31161b276cdA123",
				value: parseEther("0.001"),
			},
		],
	});

	// Wait for receipt
	const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
	console.log("🚀 ~ receipt:", receipt);
};

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
