"use client";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider } from "wagmi";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

const config = getDefaultConfig({
	appName: "My RainbowKit App",
	projectId: "YOUR_PROJECT_ID",
	chains: [sepolia],
	ssr: true, // If your dApp uses server side rendering (SSR)
});

export default function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 1000,
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider>{children}</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
