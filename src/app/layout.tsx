import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Header from '../components/Header';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'CrowdHelping',
  description: 'Minimum Viable CrowdHelping',
}

export default function RootLayout(props: { children: ReactNode }) {
  return (
			<html lang="en">
				<body className="flex flex-col h-full bg-white">
					<Header />
					<div className="mx-auto pt-2 min-h-[calc(100vh-64px)] bg-white">
						{/* <Link href="/pages/verify">Verify Yourself</Link> */}
						{props.children}
					</div>
					<Toaster />
					<Footer />
				</body>
			</html>
		);
}