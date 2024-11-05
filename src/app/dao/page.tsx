"use client";

import { formatJSON } from "@/app/utils";
import {
	type DelegationStruct,
	Implementation,
	type MetaMaskSmartAccount,
	createRootDelegation,
	toMetaMaskSmartAccount,
} from "@codefi/delegator-core-viem";
import type { WEB3AUTH_NETWORK_TYPE } from "@web3auth/base";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { useEffect, useState } from "react";
import { createPublicClient, http, zeroAddress } from "viem";
import {
	type UserOperationReceipt,
	createBundlerClient,
	createPaymasterClient,
} from "viem/account-abstraction";
import { sepolia as chain } from "viem/chains";
import {
	type SignatoryFactoryName,
	useSelectedSignatory,
} from "../examples/signers/useSelectedSignatory";
import { daoAbi } from "./abi";
import {
	DeleGatorAccount,
	type DeploymentStatus,
	createSalt,
	createSmartAccount,
} from "./daoHelpers";

const WEB3_AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_WEB3_CLIENT_ID!;
const WEB3_AUTH_NETWORK = process.env
	.NEXT_PUBLIC_WEB3_AUTH_NETWORK! as WEB3AUTH_NETWORK_TYPE;
const BUNDLER_URL = process.env.NEXT_PUBLIC_BUNDLER_URL!;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const PAYMASTER_POLICY_ID = process.env.NEXT_PUBLIC_PAYMASTER_POLICY_ID;

function App() {
	const [delegateAccount, setDelegateSmartAccount] =
		useState<MetaMaskSmartAccount<Implementation>>();
	const [delegatorAccount, setDelegatorAccount] =
		useState<MetaMaskSmartAccount<Implementation>>();
	const [delegation, setDelegation] = useState<DelegationStruct>();
	const [userOpReceipt, setUserOpReceipt] = useState<UserOperationReceipt>();
	const [delegateDeploymentStatus, setDelegateDeploymentStatus] =
		useState<DeploymentStatus>("counterfactual");
	const [delegatorDeploymentStatus, setDelegatorDeploymentStatus] =
		useState<DeploymentStatus>("counterfactual");

	const { selectedSignatory, setSelectedSignatoryName, selectedSignatoryName } =
		useSelectedSignatory({
			chain,
			web3AuthClientId: WEB3_AUTH_CLIENT_ID,
			web3AuthNetwork: WEB3_AUTH_NETWORK,
			rpcUrl: RPC_URL,
		});

	const client = createPublicClient({
		chain,
		transport: http(RPC_URL),
	});
	const paymasterContext = PAYMASTER_POLICY_ID
		? {
				sponsorshipPolicyId: PAYMASTER_POLICY_ID,
			}
		: undefined;

	const pimlicoClient = createPimlicoClient({
		transport: http(BUNDLER_URL),
	});

	const bundlerClient = createBundlerClient({
		transport: http(BUNDLER_URL),
		paymaster: createPaymasterClient({
			transport: http(BUNDLER_URL),
		}),
		chain,
		paymasterContext,
	});

	const isValidSignatorySelected =
		selectedSignatory && !selectedSignatory.isDisabled;

	const canDeployDelegatorAccount =
		delegatorAccount && delegatorDeploymentStatus === "counterfactual";
	const canCreateDelegation = !!(delegateAccount && delegatorAccount);
	const canSignDelegation = !!(delegatorAccount && delegation);
	const canLogout = isValidSignatorySelected && selectedSignatory.canLogout();

	useEffect(() => {
		createSmartAccount(client).then(setDelegateSmartAccount);
	}, []);

	const handleSignatoryChange = (ev: any) => {
		const signatoryName = ev.target.value as SignatoryFactoryName;
		setSelectedSignatoryName(signatoryName);

		setDelegatorAccount(undefined);
		setUserOpReceipt(undefined);
		setDelegation(undefined);
	};

	const handleLogout = async () => {
		if (!canLogout) {
			return;
		}
		await selectedSignatory!.logout!();

		setDelegatorAccount(undefined);
		setUserOpReceipt(undefined);
		setDelegation(undefined);
	};

	const handleCreateDelegator = async () => {
		if (selectedSignatory === undefined) {
			throw new Error("Delegator factory not set");
		}

		const { owner, signatory } = await selectedSignatory.login();
		const smartAccount = await toMetaMaskSmartAccount({
			client,
			implementation: Implementation.Hybrid,
			deployParams: [owner, [], [], []],
			deploySalt: createSalt(),
			signatory,
		});

		setDelegatorAccount(smartAccount);
		setDelegatorDeploymentStatus("counterfactual");
		setDelegation(undefined);
	};

	const handleDeployDelegator = async () => {
		if (!canDeployDelegatorAccount) {
			return;
		}

		setDelegatorDeploymentStatus("deployment in progress");

		const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();

		const userOpHash = await bundlerClient.sendUserOperation({
			account: delegatorAccount,
			calls: [
				{
					to: zeroAddress,
				},
			],
			...fee,
		});

		console.log("waiting...");

		const userOperationReceipt =
			await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
		setUserOpReceipt(userOperationReceipt);

		setDelegateDeploymentStatus("deployed");

		console.log("🚀 ~ handleDeployDelegator ~ userOpHash:", userOpHash);
		console.log(
			"🚀 ~ handleDeployDelegator ~ userOperationReceipt:",
			userOperationReceipt,
		);

		setDelegatorDeploymentStatus("deployed");
	};

	const handleCreateDelegation = () => {
		if (!canCreateDelegation) {
			return;
		}

		const newDelegation = createRootDelegation(
			delegateAccount.address,
			delegatorAccount.address,
			[],
		);

		setDelegation(newDelegation);
	};

	const handleSignDelegation = async () => {
		if (!canSignDelegation) {
			return;
		}

		const signature = await delegatorAccount.signDelegation({
			delegation,
		});

		setDelegation({
			...delegation,
			signature,
		});
	};

	const handleCallContract = async () => {
		if (!canSignDelegation) {
			return;
		}
		/*

		const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();

		const userOpHash = await bundlerClient.sendUserOperation({
			account: delegatorAccount,
			calls: [
				{
					abi: daoAbi,
					to: "0xB02ABD1d44DA0A9250f203C14bd17DFd019aa93D",
					functionName: "createActivity",
					args: ["work it baby 2", parseEther("1")],
				},
			],
			...fee,
		});
		*/

		const publicClient = createPublicClient({
			chain,
			transport: http(RPC_URL),
		});

		const result = await publicClient.readContract({
			//client,
			abi: daoAbi,
			address: "0xB02ABD1d44DA0A9250f203C14bd17DFd019aa93D",
			functionName: "getActivity",
			args: [BigInt(2)],
		});

		console.log("Contract read result:", result);

		/*console.log('userOpHash',userOpHash)

		const userOperationReceipt =
			await bundlerClient.waitForUserOperationReceipt({
				hash: userOpHash,
			});
		
		console.log(
			"🚀 ~ handleCallContract ~ userOperationReceipt:",
			userOperationReceipt,
		);*/
	};

	return (
		<div className="p-6 bg-gray-50 rounded-lg space-y-6">
			{/* Signatory Selection */}
			<div className="flex items-center gap-2">
				<label className="font-medium text-gray-700">Signatory:</label>
				<select
					onChange={handleSignatoryChange}
					value={selectedSignatoryName}
					className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="burnerSignatoryFactory">Burner private key</option>
					<option value="injectedProviderSignatoryFactory">
						Injected provider
					</option>
					<option value="web3AuthSignatoryFactory">Web3Auth</option>
				</select>
			</div>

			{/* Logout Button */}
			{canLogout && (
				<button
					onClick={handleLogout}
					className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={!canLogout}
				>
					Logout
				</button>
			)}

			{/* Account Creation Buttons */}
			<div className="flex gap-3">
				<button
					onClick={handleCreateDelegator}
					disabled={!isValidSignatorySelected}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Create "delegator" Account
				</button>
				<button
					onClick={handleDeployDelegator}
					disabled={!canDeployDelegatorAccount}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Deploy "delegator" Account
				</button>
			</div>

			{/* Accounts Section */}
			<div className="space-y-2">
				<h3 className="text-lg font-semibold text-gray-900">Accounts:</h3>
				<pre className="p-4 bg-white border border-gray-200 rounded-md overflow-auto text-sm text-gray-800">
					Delegate:{" "}
					<DeleGatorAccount
						account={delegateAccount}
						deploymentStatus={delegateDeploymentStatus}
					/>
					<br />
					Delegator:{" "}
					<DeleGatorAccount
						account={delegatorAccount}
						deploymentStatus={delegatorDeploymentStatus}
					/>
				</pre>
			</div>

			{/* Delegation Buttons */}
			<div className="flex gap-3">
				<button
					onClick={handleCreateDelegation}
					disabled={!canCreateDelegation}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Create Delegation
				</button>
				<button
					onClick={handleSignDelegation}
					disabled={!canSignDelegation}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Sign Delegation
				</button>
				<button
					onClick={handleCallContract}
					disabled={!canSignDelegation}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Call Contract
				</button>
			</div>

			{/* Delegation Section */}
			<div className="space-y-2">
				<h3 className="text-lg font-semibold text-gray-900">Delegation:</h3>
				<pre className="p-4 bg-white border border-gray-200 rounded-md overflow-auto text-sm text-gray-800">
					{formatJSON(delegation)}
				</pre>
			</div>
		</div>
	);
}

export default App;
