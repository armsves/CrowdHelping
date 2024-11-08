"use client";
import { encodeFunctionData } from 'viem'
import { formatJSON } from "@/app/utils";
//import { toast } from "@/hooks/use-toast";
import { ToastContainer, toast } from 'react-toastify';
import {
	type DelegationStruct,
	Implementation,
	type MetaMaskSmartAccount,
	createRootDelegation,
	toMetaMaskSmartAccount,
	createCaveatBuilder,
	createExecution,
	DelegationFramework,
	SINGLE_DEFAULT_MODE
} from "@codefi/delegator-core-viem";
import { useQueries } from "@tanstack/react-query";
import type { WEB3AUTH_NETWORK_TYPE } from "@web3auth/base";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { useEffect, useState } from "react";
import { createPublicClient, http, parseEther, zeroAddress } from "viem";
import {
	type UserOperationReceipt,
	createBundlerClient,
	createPaymasterClient,
} from "viem/account-abstraction";
import { sepolia as chain } from "viem/chains";
import { type SignatoryFactoryName, useSelectedSignatory, } from "../examples/signers/useSelectedSignatory";
import { daoAbi } from "../utils/abi";
import {
	DeleGatorAccount,
	type DeploymentStatus,
	createSalt,
	createSmartAccount,
} from "../utils/daoHelpers";
import { createWalletClient, custom, Hex, toHex, type Address } from "viem";

interface Activity {
	creator: string;
	description: string;
	amount: bigint;
	votes: bigint;
}

const WEB3_AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_WEB3_CLIENT_ID!;
const WEB3_AUTH_NETWORK = process.env.NEXT_PUBLIC_WEB3_AUTH_NETWORK! as WEB3AUTH_NETWORK_TYPE;
const BUNDLER_URL = process.env.NEXT_PUBLIC_BUNDLER_URL!;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const PAYMASTER_POLICY_ID = process.env.NEXT_PUBLIC_PAYMASTER_POLICY_ID;

const DAO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS! as `0x${string}`; //"0xFED5dC3244F67ACc3F55Fa6d76A4a06ED242b45E" as const;

console.log("🚀 ~ file: page.tsx ~ line 108 ~ DAO_CONTRACT_ADDRESS", DAO_CONTRACT_ADDRESS);
const fetchActivity = async (id: number) => {
	const publicClient = createPublicClient({
		chain,
		transport: http(RPC_URL),
	});

	const result = (await publicClient.readContract({
		abi: daoAbi,
		address: DAO_CONTRACT_ADDRESS,
		functionName: "getActivity",
		args: [BigInt(id)],
	})) as [string, string, bigint, bigint, boolean, boolean, bigint];
	console.log("🚀 ~ fetchActivity ~ result:", id, result);

	return {
		creator: result[0],
		description: result[1],
		amount: result[2],
		votes: result[6],
	};
};

function App() {
	const [delegateAccount, setDelegateSmartAccount] = useState<MetaMaskSmartAccount<Implementation>>();
	const [delegatorAccount, setDelegatorAccount] = useState<MetaMaskSmartAccount<Implementation>>();
	const [delegation, setDelegation] = useState<DelegationStruct>();
	const [userOpReceipt, setUserOpReceipt] = useState<UserOperationReceipt>();
	const [delegateDeploymentStatus, setDelegateDeploymentStatus] = useState<DeploymentStatus>("counterfactual");
	const [delegatorDeploymentStatus, setDelegatorDeploymentStatus] = useState<DeploymentStatus>("counterfactual");
	const [owner, setOwner] = useState<Address>();

	const { selectedSignatory, setSelectedSignatoryName, selectedSignatoryName } =
		useSelectedSignatory({
			chain,
			web3AuthClientId: WEB3_AUTH_CLIENT_ID,
			web3AuthNetwork: WEB3_AUTH_NETWORK,
			rpcUrl: RPC_URL,
		});

	useEffect(() => {
		setSelectedSignatoryName("injectedProviderSignatoryFactory");
	}, [setSelectedSignatoryName]);

	const activityQueries = useQueries({
		queries: [1, 2, 3].map((id) => ({
			queryKey: ["activity", id],
			queryFn: () => fetchActivity(id),
		})),
	});

	useEffect(() => {
		const fetchOwner = async () => {
			try {
				const provider = (window as any).ethereum;
				if (provider) {
					const accounts = await provider.request({
						method: "eth_requestAccounts",
					});
					const [owner] = accounts as string[];
					setOwner(accounts.address);
					console.log("owner", owner);
				} else {
					console.error("Ethereum provider not found");
				}
			} catch (error) {
				console.error("Error fetching owner account:", error);
			}
		};

		fetchOwner();
	}, []);

	const isLoading = activityQueries.some((query) => query.isLoading);
	const isError = activityQueries.some((query) => query.isError);
	const activities = activityQueries
		.map((query) => query.data)
		.filter(Boolean) as Activity[];

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

	const isValidSignatorySelected = selectedSignatory && !selectedSignatory.isDisabled;
	const canDeployDelegatorAccount = delegatorAccount && delegatorDeploymentStatus === "counterfactual";
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

		await new Promise((resolve) => setTimeout(resolve, 0));
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

		await new Promise((resolve) => setTimeout(resolve, 0));
	};

	const handleCreateDelegation = async () => {
		if (!canCreateDelegation) {
			return;
		}

		/*
	const environment = delegatorAccount.environment;
	const caveatBuilder = createCaveatBuilder(environment);

	const caveats = caveatBuilder
	  // allowedTargets accepts an array of addresses.
	  // This caveat restricts the caller to only use the delegation to interact with the specified address.
	  .addCaveat("allowedTargets", ["0xc11F3a8E5C7D16b75c9E2F60d26f5321C6Af5E92"])
	  // allowedMethods accepts an array of methods.
	  // This caveat restricts the caller to only use the delegation to invoke the specified methods.
	  .addCaveat("allowedMethods", [
		"approve(address,uint256)",
		"transfer(address,uint256)"
	  ])
	  // limitedCalls accepts a number.
	  // This caveat restricts the caller to only use the delegation one time.
	  .addCaveat("limitedCalls", 1)
	  .build();

	console.log('caveats', caveats);

	const newDelegation = createRootDelegation(
	  delegateAccount.address,
	  delegatorAccount.address,
	  caveats //aquí van los caveats, es decir restricciones
	);
		*/

		const environment = delegatorAccount.environment;
		const caveatBuilder = createCaveatBuilder(environment);
		const caveats = caveatBuilder
			.addCaveat("allowedMethods", [
				"voteForActivity(uint256)",
			])
			.build();

		const newDelegation = createRootDelegation(
			delegateAccount.address,
			delegatorAccount.address,
			caveats
			//[],
		);

		setDelegation(newDelegation);

		await new Promise((resolve) => setTimeout(resolve, 0));
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

		await new Promise((resolve) => setTimeout(resolve, 0));
	};

	const handleVoteTest = async (activityId: number) => {
		console.log("activityId", activityId);

		/////////////
		if (!delegation) {
			console.log("No delegation");
			return;
		}

		if (!delegateAccount) {
			console.log("No delegate account");
			return;
		}


		//const execution = createExecution();


		const performVoteData = encodeFunctionData({
			abi: daoAbi,
			//functionName: 'verifyActivity',
			functionName: 'voteForActivity',
			args: [BigInt(activityId)]
		})
		
		const execution = createExecution(DAO_CONTRACT_ADDRESS, 0n, performVoteData);

		const data = DelegationFramework.encode.redeemDelegations(
			[[delegation]],
			[SINGLE_DEFAULT_MODE],
			[[execution]]
		);

		if (delegateDeploymentStatus === "counterfactual") {
			setDelegateDeploymentStatus("deployment in progress");
		}

		const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();

		let userOpHash: Hex;

		try {
			userOpHash = await bundlerClient.sendUserOperation({
				account: delegateAccount,
				calls: [
					{
						to: delegateAccount.address,
						data,
					},
				],
				...fee,
			});

					const userOperationReceipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });

		setUserOpReceipt(userOperationReceipt);

		setDelegateDeploymentStatus("deployed");

		} catch (error)  {
			//setIsRedeemingDelegation(false);
			/*
			if (delegateDeploymentStatus === "deployment in progress") {
				setDelegateDeploymentStatus("counterfactual");
			}
			console.log("error", error);
			throw error;*/
			if (error instanceof Error) {
				console.log("error", error.message);
				if (error.message.includes("User denied transaction signature")) {
					toast.error("User denied transaction signature");
				} else if (error.message.includes("NotVerifiedUser")) {
					console.log("NotVerifiedUser");
					toast.error("User is not Verified");
				} else if (error.message.includes("0x7c9a1cf9")) {
					console.log("User has already voted");
					toast.error("User has already voted");
					//toast({ title: "User has already voted", });
				} else {
					toast.error("Error!!!");
				}
			}
		}


		//setIsRedeemingDelegation(false);

		///////////////////
	}

	const handleVote = async (activityId: number) => {
		try {
			console.log("activityId", activityId);

			if (!canSignDelegation) {
				return;
			}

			const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();

			const userOpHash = await bundlerClient.sendUserOperation({
				account: delegatorAccount,
				//account: delegateAccount.address,
				calls: [
					{
						abi: daoAbi,
						to: DAO_CONTRACT_ADDRESS,
						functionName: "voteForActivity",
						args: [1n],
					},
				],
				...fee,
			});

			console.log("userOpHash", userOpHash);

			const userOperationReceipt =
				await bundlerClient.waitForUserOperationReceipt({
					hash: userOpHash,
				});

			console.log("🚀 ~ handleCallContract ~ userOperationReceipt:", userOperationReceipt,);
			toast.success("Success!!!");

		} catch (error) {
			console.log("error", error);
			if (error instanceof Error) {
				if (error.message.includes("User denied transaction signature")) {
					toast.error("User denied transaction signature");
				} else if (error.message.includes("NotVerifiedUser")) {
					console.log("NotVerifiedUser");
					toast.error("User is not Verified");
				} else if (error.message.includes("AlreadyVoted")) {
					console.log("User has already voted");
					toast.error("User has already voted");
					//toast({ title: "User has already voted", });
				} else {
					toast.error("Error!!!");
				}
			}
		}
	}

	const handleCallContract = async (activityId: number) => {
		if (!canSignDelegation) {
			return;
		}

		const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();

		const userOpHash = await bundlerClient.sendUserOperation({
			account: delegatorAccount,
			calls: [
				{
					abi: daoAbi,
					to: DAO_CONTRACT_ADDRESS,
					functionName: "createActivity",
					// value: parseEther("0.00001"),
					args: ["work it baby 2", parseEther("1")],
				},
			],
			...fee,
		});

		console.log("userOpHash", userOpHash);

		const userOperationReceipt =
			await bundlerClient.waitForUserOperationReceipt({
				hash: userOpHash,
			});

		console.log(
			"🚀 ~ handleCallContract ~ userOperationReceipt:",
			userOperationReceipt,
		);
		toast.success("Success!!!")

	};

	return (
		<div className="p-6 bg-gray-50 rounded-lg space-y-6">
			{/* Signatory Selection */}
			{/* <div className="flex items-center gap-2">
				<label className="font-medium text-gray-700">Signatory:</label>
				<select
					onChange={handleSignatoryChange}
					value={selectedSignatoryName}
					className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="injectedProviderSignatoryFactory">
						Injected provider
					</option>
					<option value="burnerSignatoryFactory">Burner private key</option>
					<option value="web3AuthSignatoryFactory">Web3Auth</option>
				</select>
			</div> */}
			{/* Logout Button */}
			{canLogout && (
				<button
					type="button"
					onClick={handleLogout}
					className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={!canLogout}
				>
					Logout
				</button>
			)}

			<h3 className="">
				Create and deploy "delegator" accounts. Create and sign delegation.
			</h3>
			{/* <Button
				type="button"
				onClick={async () => {
					await handleCreateDelegator();
					await handleDeployDelegator();

					await handleCreateDelegation();

					await handleSignDelegation();
				}}
			>
				🐊 DeleGator 🐊
			</Button> */}

			{/* Account Creation Buttons */}
			<div className="flex gap-3">
				<button
					type="button"
					onClick={handleCreateDelegator}
					disabled={!isValidSignatorySelected}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Create "delegator" Account
				</button>
				<button
					type="button"
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
					type="button"
					onClick={handleCreateDelegation}
					disabled={!canCreateDelegation}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Create Delegation
				</button>
				<button
					type="button"
					onClick={handleSignDelegation}
					disabled={!canSignDelegation}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Sign Delegation
				</button>
				{/* <button
					type="button"
					onClick={handleCallContract}
					disabled={!canSignDelegation}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Call Contract
				</button> */}
			</div>
			{/* Delegation Section */}
			<div className="space-y-2">
				<h3 className="text-lg font-semibold text-gray-900">Delegation:</h3>
				<pre className="p-4 bg-white border border-gray-200 rounded-md overflow-auto text-sm text-gray-800">
					{formatJSON(delegation)}
				</pre>
			</div>
			{/* Add Activities Section */}
			<div className="mt-8">
				<h2 className="text-2xl font-bold mb-4">Activities</h2>

				{isLoading && <div>Loading activities...</div>}

				{isError && <div>Error loading activities</div>}

				{!isLoading && !isError && (
					<div className="space-y-4">
						{activities.map((activity, index) => (
							<div key={index} className="p-4 border rounded-lg">
								<p>
									<span className="font-semibold">Creator:</span>{" "}
									{activity.creator}
								</p>
								<p>
									<span className="font-semibold">Description:</span>{" "}
									{activity.description}
								</p>
								<p>
									<span className="font-semibold">Amount:</span>{" "}
									{activity.amount.toString()} wei
								</p>
								<p>
									<span className="font-semibold">Vote Count:</span>{" "}
									{activity.votes.toString()}
								</p>

								<button
									type="button"
									onClick={() => handleVote(index)}
									//disabled={!canSignDelegation}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Vote
								</button>

								<button
									type="button"
									onClick={() => handleVoteTest(index)}
									//disabled={!canSignDelegation}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Vote Test
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
