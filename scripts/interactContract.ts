import { daoAbi } from "@/app/dao/abi";
import dotenv from "dotenv";
import { createPublicClient, http } from "viem";
import {
	createBundlerClient,
	toCoinbaseSmartAccount,
} from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

// Contract address
const CONTRACT_ADDRESS =
	"0xFED5dC3244F67ACc3F55Fa6d76A4a06ED242b45E" as `0x${string}`;

const main = async () => {
	dotenv.config();

	if (!process.env.PIMLICO_PRIVATE_KEY || !process.env.PIMLICO_API_KEY)
		throw new Error("PIMLICO_PRIVATE_KEY or PIMLICO_API_KEY not found");
	const PIMLICO_PRIVATE_KEY = process.env.PIMLICO_PRIVATE_KEY;
	const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY;

	const client = createPublicClient({
		chain: sepolia,
		transport: http("https://sepolia.gateway.tenderly.co"),
	});

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
			`https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`,
		),
	});

	const hash = await bundlerClient.sendUserOperation({
		calls: [
			{
				abi: daoAbi,
				to: CONTRACT_ADDRESS,
				functionName: "increment",
				// args: ["hello", parseEther("1")],
			},
		],
	});

	const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
	console.log("🚀 ~ receipt:", receipt);
};

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
