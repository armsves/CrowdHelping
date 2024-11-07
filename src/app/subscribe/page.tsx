"use client";
import { ToastContainer, toast } from 'react-toastify';
import { useEffect, useState } from "react";
import {
	Client,
	createPublicClient,
	Hex,
	http,
	toHex,
	zeroAddress,
	parseEther,
	encodeAbiParameters,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { sepolia as chain } from "viem/chains";
import {
	Implementation,
	toMetaMaskSmartAccount,
	type MetaMaskSmartAccount,
	type DelegationStruct,
	createRootDelegation,
	DelegationFramework,
	SINGLE_DEFAULT_MODE,
	getExplorerTransactionLink,
	getExplorerAddressLink,
	createExecution,
	createCaveatBuilder,
	ExecutionStruct,
	DeleGatorEnvironment,
	CaveatBuilder,
	CaveatStruct,
} from "@codefi/delegator-core-viem";
import {
	createBundlerClient,
	createPaymasterClient,
	UserOperationReceipt,
} from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { randomBytes } from "crypto";
import {
	type SignatoryFactoryName,
	useSelectedSignatory,
} from "../examples/signers/useSelectedSignatory";
import { WEB3AUTH_NETWORK_TYPE } from "@web3auth/base";
import { formatJSON } from "@/app/utils";

const WEB3_AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_WEB3_CLIENT_ID!;
const WEB3_AUTH_NETWORK = process.env
	.NEXT_PUBLIC_WEB3_AUTH_NETWORK! as WEB3AUTH_NETWORK_TYPE;
const BUNDLER_URL = process.env.NEXT_PUBLIC_BUNDLER_URL!;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
// if this is undefined, the API_KEY must be configured to Enable verifying paymaster
const PAYMASTER_POLICY_ID = process.env.NEXT_PUBLIC_PAYMASTER_POLICY_ID;

const createSalt = () => toHex(randomBytes(8).toString());

console.log('createSalt', createSalt());

const createSmartAccount = (client: Client) => {
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

type DeploymentStatus =
	| "deployed"
	| "counterfactual"
	| "deployment in progress";

function DeleGatorAccount({
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
			<a href={explorerUrl} target="_blank">
				{account.address} - {deploymentStatus}
			</a>
		</>
	);
}

function App() {
	const [delegateAccount, setDelegateSmartAccount] = useState<MetaMaskSmartAccount<Implementation>>();
	const [delegatorAccount, setDelegatorAccount] = useState<MetaMaskSmartAccount<Implementation>>();
	const [delegation, setDelegation] = useState<DelegationStruct>();
	const [userOpReceipt, setUserOpReceipt] = useState<UserOperationReceipt>();
	const [delegateDeploymentStatus, setDelegateDeploymentStatus] = useState<DeploymentStatus>("counterfactual");
	const [delegatorDeploymentStatus, setDelegatorDeploymentStatus] = useState<DeploymentStatus>("counterfactual");
	const [isRedeemingDelegation, setIsRedeemingDelegation] = useState<boolean>(false);

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
	const canRedeemDelegation = !!(delegatorDeploymentStatus === "deployed" &&
		!isRedeemingDelegation &&
		delegateAccount &&
		delegation?.signature !== undefined &&
		delegation?.signature !== "0x");
	const canLogout = isValidSignatorySelected && selectedSignatory.canLogout();

	// create the delegate account immediately on page load
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

		bundlerClient.waitForUserOperationReceipt({
			hash: userOpHash,
		});

		setDelegatorDeploymentStatus("deployed");
	};

	const handleCreateDelegation = () => {
		if (!canCreateDelegation) {
			return;
		}

		////////////
		const builder = (
			_: DeleGatorEnvironment,
			startTime: bigint,
			interval: bigint,
		): CaveatStruct => {
			const terms = encodeAbiParameters(
				[{ type: 'uint256' }, { type: 'uint256' }],
				[startTime, interval],
			);
			return {
				enforcer: '0xB54671e11F018261104a227222C67170a17AD56d',
				terms,
				args: '0x',
			};
		};

		/*
		const caveatBuilder = new CaveatBuilder(delegatorAccount.environment).extend(
			'interval',
			builder,
		);
		*/
		const caveatBuilder = createCaveatBuilder(delegatorAccount.environment).extend(
			'interval',
			builder,
		);
		const startTimeSeconds = BigInt(Math.floor(Date.now() / 1000));
		const intervalSeconds = BigInt(120);
		caveatBuilder.addCaveat("interval", startTimeSeconds, intervalSeconds)
		caveatBuilder.addCaveat("valueLte", 1n)
		caveatBuilder.addCaveat("allowedTargets", ["0xE54c290BB38435cD442E94FCaC21c9faf42238f2" as Hex])

		/////////////
/*
		const caveats = createCaveatBuilder(delegatorAccount.environment)
			.addCaveat("allowedTargets", ["0xE54c290BB38435cD442E94FCaC21c9faf42238f2" as Hex])
			.addCaveat("valueLte", 1n)
			.build()
*/
		const newDelegation = createRootDelegation(
			delegateAccount.address,
			delegatorAccount.address,
			caveatBuilder,
			BigInt(createSalt())
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

	//const handleRedeemDelegation = async () => {
	const handleRedeemDelegation = async (target: Hex, value: bigint) => {

		if (!canRedeemDelegation) {
			return;
		}

		setIsRedeemingDelegation(true);

		const executions: ExecutionStruct[] = [
			{
				//target: "0xE54c290BB38435cD442E94FCaC21c9faf42238f2",
				//value: 1n,
				target,
				value,
				callData: "0x",
			},
		];

		const delegationChain = [delegation];
		const redeemDelegationCalldata = DelegationFramework.encode.redeemDelegations(
			[delegationChain],
			[SINGLE_DEFAULT_MODE],
			[executions]
		);


		if (delegateDeploymentStatus === "counterfactual") { setDelegateDeploymentStatus("deployment in progress"); }
		const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();
		let userOpHash: Hex;

		try {

			userOpHash = await bundlerClient.sendUserOperation({
				account: delegateAccount,
				calls: [
					{
						to: delegateAccount.address,
						data: redeemDelegationCalldata,
					},
				],
				...fee,
			});
			
		} catch (error) {
			setIsRedeemingDelegation(false);
			console.log("error", error);
			if (error instanceof Error && error.message.includes("IntervalEnforcer:interval-not-elapsed")) {
				console.log("Time to claim has not passed yet, try again later")
				toast.error("Time to claim has not passed yet, try again later");
			}
			if (error instanceof Error && error.message.includes("target-address-not-allowed")) {
				console.log("Unauthorized target wallet address")
				toast.error("Unauthorized target wallet address");
			}
			if (error instanceof Error && error.message.includes("returned no data")) {
				console.log("Insufficient balance")
				toast.error("Insufficient balance");
			}
			if (error instanceof Error && error.message.includes("value-too-high")) {
				console.log("You can't redeem more than the allocated amount")
				toast.error("You can't redeem more than the allocated amount");
			}
			if (error instanceof Error && error.message.includes("Invalid Smart Account nonce used for User Operation")) {
				console.log("Error in the submitted nonce")
				toast.error("Error in the submitted nonce");
			}

			if (delegateDeploymentStatus === "deployment in progress") {
				setDelegateDeploymentStatus("counterfactual");
			}
			return;
			//throw error;
		}

		const userOperationReceipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });

		setUserOpReceipt(userOperationReceipt);

		setDelegateDeploymentStatus("deployed");

		setIsRedeemingDelegation(false);

		toast.success("Subscription claimed successfully!");
	};

	const userOpExplorerUrl = userOpReceipt && getExplorerTransactionLink(chain.id, userOpReceipt.receipt.transactionHash);

	return (
		<div>
			<h2>Create subscription</h2>
			<p>

			</p>

			<br />
			{canLogout && (
				<button
					onClick={handleLogout}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={!canLogout}
				>
					Logout
				</button>
			)}
			<br />
			<button
				onClick={handleCreateDelegator}
				disabled={!isValidSignatorySelected}
				className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
				Create "delegator" Account
			</button>{" "}
			<button
				onClick={handleDeployDelegator}
				disabled={!canDeployDelegatorAccount}
				className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
				Deploy "delegator" Account
			</button>
			<h3>Accounts:</h3>
			<pre style={{ overflow: "auto" }}>
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
			<br />
			<button
				onClick={handleCreateDelegation}
				disabled={!canCreateDelegation}
				className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
				Create Delegation
			</button>{" "}
			<button
				onClick={handleSignDelegation}
				disabled={!canSignDelegation}
				className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
				Sign Delegation
			</button>
			<h3>Delegation:</h3>
			<pre style={{ overflow: "auto" }}>{formatJSON(delegation)}</pre>
			<button
				onClick={() => handleRedeemDelegation("0xE54c290BB38435cD442E94FCaC21c9faf42238f2" as Hex, 1n)}				
				disabled={!canRedeemDelegation}
				className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
				Redeem Delegation Correctly
			</button>
			<br/>
			<button
				onClick={() => handleRedeemDelegation("0xE54c290BB38435cD442E94FCaC21c9faf42238f2" as Hex, 2n)}				
				disabled={!canRedeemDelegation}
				className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
				Redeem Delegation Incorrect Amount
			</button>
			<br/>
			<button
				onClick={() => handleRedeemDelegation(zeroAddress, 1n)}				
				disabled={!canRedeemDelegation}
				className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
				Redeem Delegation Incorrect Destination Wallet
			</button>
			{isRedeemingDelegation && (
				<span className="ml-2 inline-block animate-spin">🐊</span>
			)}
			<h3>UserOp receipt:</h3>
			{userOpExplorerUrl && (
				<a href={userOpExplorerUrl} target="_blank">
					View transaction
				</a>
			)}
			{userOpReceipt && (
				<pre style={{ overflow: "auto", maxHeight: "200px" }}>
					{formatJSON(userOpReceipt)}
				</pre>
			)}
		</div>
	);
}

export default App;
