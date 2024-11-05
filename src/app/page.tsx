"use client";

import { FlickeringBackground } from "@/components/flickering-background";
import {
	ArrowRight,
	BarChart,
	CheckCircle,
	Shield,
	Users,
	Zap
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
	const [activeTab, setActiveTab] = useState("organizers");

	const userFlows = {
		organizers: [
			"Create activity proposals",
			"Define funding goals",
			"Set verification requirements",
			"Manage delegated funds",
			"Submit impact proof and reports",
		],
		users: [
			"Explore verified activities",
			"Subscribe",
			"Sign up for participation",
			"Participate in governance voting",
		],
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100">
			<main>
				{/* Hero Section */}
				<FlickeringBackground>
					<div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
						<div className="text-center">
							<h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
								<span className="block">Empower Communities</span>
								<span className="block text-blue-600">
									Through Decentralized Impact
								</span>
							</h1>
							<p className="mt-3 max-w-md mx-auto text-base text-gray-800 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
								Connect donors with verified social impact activities through
								transparent delegation and verification mechanisms.
							</p>
							<div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
								<div className="rounded-md shadow">
									<a
										href="/verify"
										className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
									>
										Get Started
									</a>
								</div>
								<div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
									<a
										href="#"
										className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
									>
										Learn More
									</a>
								</div>
							</div>
						</div>
					</div>
				</FlickeringBackground>

				{/* Key Features Section */}
				<div className="bg-white">
					<div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
						<div className="max-w-3xl mx-auto text-center">
							<h2 className="text-3xl font-extrabold text-gray-900">
								Key Features
							</h2>
							<p className="mt-4 text-lg text-gray-500">
								Leveraging Web3 technology to revolutionize social impact
								initiatives.
							</p>
						</div>
						<dl className="mt-12 space-y-10 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 lg:gap-x-8">
							{[
								{
									name: "Smart Contract Delegation",
									description: "Automated and transparent fund distribution",
									icon: Zap,
								},
								{
									name: "Sybil-Resistant Verification",
									description: "Powered by WorldID integration",
									icon: Shield,
								},
								{
									name: "Activity Verification",
									description: "On-chain proof of social impact",
									icon: CheckCircle,
								},
								{
									name: "Real-Time Impact Tracking",
									description: "Monitor social impact metrics live",
									icon: BarChart,
								},
								{
									name: "Community Governance",
									description: "Democratic fund allocation system",
									icon: Users,
								},
							].map((feature) => (
								<div key={feature.name} className="relative">
									<dt>
										<div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
											<feature.icon className="h-6 w-6" aria-hidden="true" />
										</div>
										<p className="ml-16 text-lg leading-6 font-medium text-gray-900">
											{feature.name}
										</p>
									</dt>
									<dd className="mt-2 ml-16 text-base text-gray-500">
										{feature.description}
									</dd>
								</div>
							))}
						</dl>
					</div>
				</div>

				{/* User Flows Section */}
				<div className="bg-gray-50">
					<div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
						<div className="max-w-3xl mx-auto text-center">
							<h2 className="text-3xl font-extrabold text-gray-900">
								User Flows
							</h2>
							<p className="mt-4 text-lg text-gray-500">
								Tailored experiences for organizers, donors, and volunteers.
							</p>
						</div>
						<div className="mt-12">
							<div className="flex justify-center space-x-4 mb-8">
								{Object.keys(userFlows).map((flow) => (
									<button
										type="button"
										key={flow}
										onClick={() => setActiveTab(flow)}
										className={`px-4 py-2 rounded-md ${
											activeTab === flow
												? "bg-blue-600 text-white"
												: "bg-white text-gray-700 hover:bg-gray-100"
										}`}
									>
										{flow.charAt(0).toUpperCase() + flow.slice(1)}
									</button>
								))}
							</div>
							<div className="bg-white shadow overflow-hidden sm:rounded-md">
								<ul className="divide-y divide-gray-200">
									{userFlows[activeTab].map((step, index) => (
										<li key={index}>
											<div className="px-4 py-4 sm:px-6">
												<div className="flex items-center">
													<div className="min-w-0 flex-1 flex items-center">
														<div className="flex-shrink-0">
															<ArrowRight
																className="h-5 w-5 text-gray-400"
																aria-hidden="true"
															/>
														</div>
														<div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
															<div>
																<p className="text-sm font-medium text-blue-600 truncate">
																	{step}
																</p>
															</div>
														</div>
													</div>
												</div>
											</div>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</div>

				{/* Tech Stack Section */}
				<div className="bg-white">
					<div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
						<div className="max-w-3xl mx-auto text-center">
							<h2 className="text-3xl font-extrabold text-gray-900">
								Tech Stack
							</h2>
							<p className="mt-4 text-lg text-gray-500">
								Built with cutting-edge Web3 technologies.
							</p>
						</div>
						<div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
							{[
								{ name: "Smart Contracts", tech: "Solidity" },
								{ name: "Identity", tech: "WorldID" },
								{ name: "Frontend", tech: "Next.js, TypeScript" },
								{ name: "Authentication", tech: "WorldID + Wallet connection" },
								{
									name: "Web3 Integration",
									tech: "Metamask Delegation Toolkit",
								},
								{ name: "Data Persistence", tech: "Smart contract" },
							].map((item) => (
								<div
									key={item.name}
									className="bg-gray-50 rounded-lg px-6 py-8 text-center"
								>
									<h3 className="text-lg font-medium text-gray-900">
										{item.name}
									</h3>
									<p className="mt-2 text-sm text-gray-500">{item.tech}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</main>

			<footer className="bg-gray-800">
				<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
						<div>
							<h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
								About
							</h3>
							<ul className="mt-4 space-y-4">
								<li>
									<a
										href="#"
										className="text-base text-gray-300 hover:text-white"
									>
										Team
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-base text-gray-300 hover:text-white"
									>
										Careers
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
								Resources
							</h3>
							<ul className="mt-4 space-y-4">
								<li>
									<a
										href="#"
										className="text-base text-gray-300 hover:text-white"
									>
										Documentation
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-base text-gray-300 hover:text-white"
									>
										Whitepaper
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
								Legal
							</h3>
							<ul className="mt-4 space-y-4">
								<li>
									<a
										href="#"
										className="text-base text-gray-300 hover:text-white"
									>
										Privacy
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-base text-gray-300 hover:text-white"
									>
										Terms
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
								Connect
							</h3>
							<ul className="mt-4 space-y-4">
								<li>
									<a
										href="#"
										className="text-base text-gray-300 hover:text-white"
									>
										Twitter
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-base text-gray-300 hover:text-white"
									>
										Discord
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div className="mt-8 border-t border-gray-700 pt-8 md:flex md:items-center md:justify-between">
						<div className="flex space-x-6 md:order-2">
							<a href="https://x.com/armsves" className="text-gray-400 hover:text-gray-300">
								<span className="sr-only">Twitter</span>
								<svg
									className="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
								</svg>
							</a>
							<a href="https://x.com/giovannifulin" className="text-gray-400 hover:text-gray-300">
								<span className="sr-only">Twitter</span>
								<svg
									className="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
								</svg>
							</a>
							<a href="https://github.com/armsves/CrowdHelping" className="text-gray-400 hover:text-gray-300">
								<span className="sr-only">GitHub</span>
								<svg
									className="h-6 w-6"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										fillRule="evenodd"
										d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
										clipRule="evenodd"
									/>
								</svg>
							</a>
						</div>
						<p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
							&copy; 2024 CrowdHelping DAO. All rights reserved.
						</p>
					</div>
					<div className="mt-8 text-center">
						<p className="text-base text-gray-400">
							Deployed Contract Address:
							0xE2B2919105BF77a64B9cf87342dA523A6ca76b22
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
