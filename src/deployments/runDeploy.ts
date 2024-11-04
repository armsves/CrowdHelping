import { deployDeleGatorEnvironment } from "@codefi/delegator-core-viem";
import { flowTestnet } from "viem/chains";

import { createWalletClient, createPublicClient, custom, http } from 'viem'

async function main() {
  try {
    const chain = flowTestnet;
    const nodeUrl = "https://testnet.evm.nodes.onflow.org";
    const account = "0x87f095c9313c8a884dD8f78aa7439Fc0cfd31e81";

    const gatorEnvironment = await deployDeleGatorEnvironment(
        createWalletClient({
          account,
          chain,
          transport: http(nodeUrl),
        }),
        createPublicClient({
          chain,
          transport: http(nodeUrl),
        }),
        chain,
      );
    
    console.log("Deployment successful",gatorEnvironment);
  } catch (error) {
    console.error("Deployment failed", error);
  }
}

main();
