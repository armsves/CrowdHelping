import {
    AllowedCalldataEnforcer,
    AllowedMethodsEnforcer,
    AllowedTargetsEnforcer,
    ArgsEqualityCheckEnforcer,
    BlockNumberEnforcer,
    DelegationManager,
    DeployedEnforcer,
    ERC20BalanceGteEnforcer,
    ERC20TransferAmountEnforcer,
    EntryPoint,
    HybridDeleGator,
    IdEnforcer,
    LimitedCallsEnforcer,
    MultiSigDeleGator,
    NativeBalanceGteEnforcer,
    NativeTokenPaymentEnforcer,
    NativeTokenTransferAmountEnforcer,
    NonceEnforcer,
    RedeemerEnforcer,
    SimpleFactory,
    TimestampEnforcer,
    ValueLteEnforcer,
} from "@codefi/delegation-abis";
import {
    type ContractMetaData,
    getDeleGatorEnvironment_v1,
} from "@codefi/delegation-utils";
import type { Chain, Hex, PublicClient, WalletClient } from "viem";

/**
 *
 * @param walletClient The wallet to deploy with
 * @param publicClient Access to the public chain
 * @param chain The chain to deploy on
 * @param contractMetadata The metadata of the contract to deploy
 * @param args
 * @returns
 */
export async function deployContract(
	walletClient: WalletClient,
	publicClient: PublicClient,
	chain: Chain,
	{ bytecode, abi }: ContractMetaData,
	args: any[] = [],
	maxFeePerGas?: bigint,
	maxPriorityFeePerGas?: bigint,
) {
	const hash = await walletClient.deployContract({
		abi,
		bytecode,
		args,
		account: walletClient.account!,
		chain,
		maxFeePerGas,
		maxPriorityFeePerGas,
	});
	const receipt = await publicClient.waitForTransactionReceipt({
		hash,
	});
	const address = (await receipt).contractAddress!;

	return { address, hash, receipt };
}

/**
 * Deploys the contracts needed for the Delegation Framework and DeleGator SCA to be functional as well as all Caveat Enforcers.
 * @param walletClient
 * @param publicClient
 * @param chain
 */
export async function deployDeleGatorEnvironment(
	walletClient: WalletClient,
	publicClient: PublicClient,
	chain: Chain,
	deployedContracts: { [contract: string]: Hex } = {},
	maxFeePerGas?: bigint,
	maxPriorityFePerGas?: bigint,
) {
	const deployContractCurried = async (
		name: string,
		contract: ContractMetaData,
		params: any[] = [],
	) => {
		if (deployedContracts[name]) {
			return {
				address: deployedContracts[name],
				name,
			};
		}

		const deployedContract = await deployContract(
			walletClient,
			publicClient,
			chain,
			contract,
			params,
			maxFeePerGas,
			maxPriorityFePerGas,
		);

		deployedContracts[name] = deployedContract.address as Hex;

		return { ...deployedContract, name };
	};

	// Deploy v0.0.3 DeleGator contracts
	// - deploy standalone contracts
	const standaloneContracts = {
		SimpleFactory,
		AllowedCalldataEnforcer,
		AllowedTargetsEnforcer,
		AllowedMethodsEnforcer,
		ArgsEqualityCheckEnforcer,
		DeployedEnforcer,
		TimestampEnforcer,
		BlockNumberEnforcer,
		LimitedCallsEnforcer,
		ERC20BalanceGteEnforcer,
		IdEnforcer,
		ERC20TransferAmountEnforcer,
		NonceEnforcer,
		ValueLteEnforcer,
		NativeTokenTransferAmountEnforcer,
		NativeBalanceGteEnforcer,
		RedeemerEnforcer,
	};
	for (const [name, contract] of Object.entries(standaloneContracts)) {
		await deployContractCurried(name, contract);
	}

	// - deploy dependencies
	const delegationManager = await deployContractCurried(
		"DelegationManager",
		DelegationManager,
		[walletClient.account?.address],
	);

	// - NativeTokenPaymentEnforcer DelegationManager and ArgsEqualityCheckEnforcer as constructor args
	await deployContractCurried(
		"NativeTokenPaymentEnforcer",
		NativeTokenPaymentEnforcer,
		[delegationManager.address, deployedContracts["ArgsEqualityCheckEnforcer"]],
	);

	const entryPoint = await deployContractCurried("EntryPoint", EntryPoint);

	// - deploy DeleGator implementations
	await deployContractCurried("HybridDeleGatorImpl", HybridDeleGator, [
		delegationManager.address,
		entryPoint.address,
	]);
	await deployContractCurried("MultiSigDeleGatorImpl", MultiSigDeleGator, [
		delegationManager.address,
		entryPoint.address,
	]);

	// Format deployments
	return getDeleGatorEnvironment_v1(deployedContracts);
}
