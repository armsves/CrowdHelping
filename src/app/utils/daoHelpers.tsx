import { Implementation, type MetaMaskSmartAccount, getExplorerAddressLink, toMetaMaskSmartAccount } from "@codefi/delegator-core-viem";
import { randomBytes } from "crypto";
import { type Client, toHex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { chain } from "../examples/shared";

export const createSalt = () => toHex(randomBytes(8).toString());

export const createSmartAccount = (client: Client) => {
	const privateKey = generatePrivateKey();
	const owner = privateKeyToAccount(privateKey);

	const account = toMetaMaskSmartAccount({
		client,
		implementation: Implementation.Hybrid,
		deployParams: [owner.address, [], [], []],
		signatory: { account: owner },
		deploySalt: createSalt(),
	});

	return account;
};

export type DeploymentStatus =
	| "deployed"
	| "counterfactual"
	| "deployment in progress";

export function DeleGatorAccount({
	account,
	deploymentStatus,
}: {
	account: MetaMaskSmartAccount<Implementation> | undefined;
	deploymentStatus: DeploymentStatus;
}) {
	if (!account) {
		return "NA";
	}

	const explorerUrl = getExplorerAddressLink(chain.id, account.address);

	return (
		<>
			<a href={explorerUrl} target="_blank" rel="noreferrer">
				{account.address} - {deploymentStatus}
			</a>
		</>
	);
}
