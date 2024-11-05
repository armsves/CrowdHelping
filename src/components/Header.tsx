"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

const Header = () => {
	const router = useRouter();

	const handleExampleChange = useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>) => {
			const url = event.target.value;
			router.push(url);
		},
		[router],
	);

	return (
		<header className="bg-white shadow-sm">
			<nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					<div className="flex">
						<div className="flex-shrink-0 flex items-center">
							<span className="text-2xl font-bold text-blue-600">
								CrowdHelping DAO
							</span>
						</div>
					</div>
					<div className="flex items-center">
						<a
							href="/pages/verify"
							className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
						>
							Verify
						</a>
						<a
							href="/dao"
							className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
						>
							Vote
						</a>
						{/* <a
							href="#"
							className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
						>
							Contact
						</a> */}
					</div>
				</div>
			</nav>
		</header>
		// <header className="w-full border-b border-gray-200 bg-white shadow-sm">
		// 	<nav className="mx-auto w-full max-w-4xl px-4 py-6">
		// 		<div className="flex flex-col md:flex-row justify-between items-center gap-4">
		// 			{/* <Link
		// 				href="/pages/verify"
		// 				className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
		// 			>
		// 				Verify
		// 			</Link> */}

		// 			<Link
		// 				href="/"
		// 				className="text-3xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
		// 			>
		// 				CrowdHelping
		// 			</Link>

		// 			<select
		// 				aria-label="Navigation examples"
		// 				defaultValue="Select example"
		// 				onChange={handleExampleChange}
		// 				className="p-2 text-base rounded-lg border border-gray-200 bg-white text-gray-800
		//           hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
		//           cursor-pointer min-w-[12rem] transition-colors"
		// 			>
		// 				<option disabled>Select example</option>
		// 				<option value="/">Home</option>
		// 				{examples.map((example) => (
		// 					<option key={example.path} value={`/examples/${example.path}`}>
		// 						{example.name}
		// 					</option>
		// 				))}
		// 			</select>
		// 		</div>
		// 	</nav>
		// </header>
	);
};

export default Header;
