# CrowdHelping DAO

A decentralized platform connecting donors with verified social impact activities through transparent delegation and verification mechanisms. Built on Web3 technology, CrowdHelping DAO empowers communities to organize, fund, and verify social initiatives like beach cleanups, tree planting, and disaster relief efforts.

## 🌟 Key Features

- **Smart Contract Delegation**: Automated and transparent fund distribution
- **Sybil-Resistant Verification**: Powered by WorldID integration
- **Cross-Chain Support**: Donate across multiple blockchain networks
- **Real-Time Impact Tracking**: Monitor social impact metrics live
- **Community Governance**: Democratic fund allocation system
- **Activity Verification**: On-chain proof of social impact

## 🔄 User Flows

### 🎯 For Organizers
1. Create activity proposals
2. Define funding goals and timelines
3. Set verification requirements
4. Manage delegated funds
5. Submit impact proof and reports

### 💰 For Donors
1. Explore verified activities
2. Make cross-chain donations
3. Set delegation preferences
4. Monitor impact metrics
5. Participate in governance voting

### 🤝 For Volunteers
1. Discover local activities
2. Sign up for participation
3. Verify location check-in
4. Submit activity verification
5. Earn participation credentials

## 🛠 Tech Stack

- Smart Contracts: Solidity
- Identity: WorldID
- Frontend: Vite.js, TypeScript

Key Features Implemented:
Authentication: WorldID + Wallet connection
Role-based Access: Different views per user type
Real-time Updates: Using TanStack Query
Responsive Design: Tailwind + shadcn
Web3 Integration: wagmi v2 + viem
Data Persistence: Smart contract + IPFS
Location Services: Maps integration
Image Handling: IPFS storage
Verification System: WorldID + GPS

# Hello Gator 🐊

Easily get up-to-speed with (and integrate) the MetaMask Delegation Toolkit with this demonstration. It includes examples for all the core elements including Delegator Account (ERC-4337) creation, sending User Operations, and the Delegation lifecycle. Example code is provided utilising the Delegator Smart Account.

Note: this template is also designed to complement the [documentation](https://docs.gator.metamask.io).

## Dependency Setup

> Note that the package `@codefi/delegator-core-viem` is currently hosted on a private registry. Please get in touch with the team for access at hellogators@consensys.io.

Once configured, you'll be able to install the dependencies (both private and public) via the following:

```sh
yarn install
```

## Configuration

Configuration is provided via environment variables, you may create a `.env` file in the root of Hello Gator, including the configuration parameters defined in `.env.example`.

Refer to the [documentation](https://docs.gator.metamask.io) for further information on configuration.

## Running

Start development environment:

```sh
yarn dev
```

## Support

Feel free to open an issue or contact the team directly at [hellogators@consensys.io](mailto:hellogators@consensys.io).


## Explorer on Flow

https://evm-testnet.flowscan.io


| Contract Type                     | Address                                    |
| --------------------------------- | ------------------------------------------ |
| DelegationManager                 | 0x6c5dDe839E03187aADb2a2EdD87ebE0b64Ac4Eaf |
| EntryPoint                        | 0x9FE03C771fab8A0f5574AdB946642A52b533c824 |
| SimpleFactory                     | 0xA6bF4Ac0fe7d17B21beDa3BB4aE38CB83Cb31d6E |
| MultiSigDeleGatorImpl             | 0x63Ff8D01fb0c7C6c8B586C4C24f04306f4415366 |
| HybridDeleGatorImpl               | 0x886AC8dD724abd77c8CD6A9e91108196C788dd9d |
| AllowedCalldataEnforcer           | 0x081931e65d00F7307159389C3678AbC65cE1270C |
| AllowedMethodsEnforcer            | 0x4ebB21F5970a41bE449FC0BF28a9fD99aA9D312A |
| AllowedTargetsEnforcer            | 0xEd224818f085bA4d3217eB366729ec9d2be229C9 |
| ArgsEqualityCheckEnforcer         | 0x44a84800775649a82C169cb1e19475D434f1827f |
| BlockNumberEnforcer               | 0x5f7159eA4706D31D9d4551E3E1e3bC3C96Ceb1C3 |
| DeployedEnforcer                  | 0xE5BE5f0A53ef8589c91246595894F82f1a2Fb9E5 |
| ERC20BalanceGteEnforcer           | 0xEbc175B58E1c2c80d280879C368DD4ce6AFf87D0 |
| ERC20TransferAmountEnforcer       | 0xe5a436EaF1Ab7EdA01cb4533d97F951EAc9E5A42 |
| IdEnforcer                        | 0x7cc8901Ce37999d80B0BB409b454B5Cf4bbDf2b2 |
| LimitedCallsEnforcer              | 0x6986a9cED8859B2A207BD6d3465e100897A1ebD7 |
| NonceEnforcer                     | 0x3Ea12B25DBf600e9F49188955143e0628b68a82C |
| TimestampEnforcer                 | 0x8cb71F23c50017e652bAB445113E36271B958e15 |
| ValueLteEnforcer                  | 0x5d270Bc4D4C45b04E8074f70cdC95689Dc7798C2 |
| NativeTokenTransferAmountEnforcer | 0x314A9BCF68B9E4583270273c07Fd241580df4fe5 |
| NativeBalanceGteEnforcer          | 0x5D0DE71168D980A18C07ec7B657Cdab3510C2559 |
| NativeTokenPaymentEnforcer        | 0x39c8B33204d47aD1A3b6aCC013c8Ac11aEce746e |
| RedeemerEnforcer                  | 0xdAc9c82b91B2F8FC852f597C874EC86cb2E8BB61 |