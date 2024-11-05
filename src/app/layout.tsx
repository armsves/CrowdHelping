import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Hello Gator 🐊',
  description: 'Minimum Viable Gator',
}

export default function RootLayout(props: { children: ReactNode }) {
  return (
			<html lang="en">
				<body>
					<Header />
					<div className="mx-auto w-10/12 sm:w-3/5 md:w-1/2">
						<Link href="/pages/verify">Verify Yourself</Link>
						{props.children}
					</div>
					<Toaster />
					<Footer />
				</body>
			</html>
		);
}