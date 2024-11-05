import { writeFileSync } from "fs";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createPublicClient, http, type Hex } from "viem";
import { entryPoint07Address } from "viem/account-abstraction";
import { generatePrivateKey } from "viem/accounts";
import { sepolia } from "viem/chains";

const apiKey = process.env.PIMLICO_API_KEY;
if (!apiKey) throw new Error("Missing PIMLICO_API_KEY");

const privateKey =
	(process.env.PRIVATE_KEY as Hex) ??
	(() => {
		const pk = generatePrivateKey();
		writeFileSync(".env", `PRIVATE_KEY=${pk}`);
		return pk;
	})();

export const publicClient = createPublicClient({
	chain: sepolia,
	transport: http("https://rpc.ankr.com/eth_sepolia"),
});

const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${apiKey}`;

const pimlicoClient = createPimlicoClient({
	transport: http(pimlicoUrl),
	entryPoint: {
		address: entryPoint07Address,
		version: "0.7",
	},
});