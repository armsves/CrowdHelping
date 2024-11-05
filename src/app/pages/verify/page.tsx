"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { ISuccessResult } from "@worldcoin/idkit";
import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { verify } from "../../actions/verify";

export default function VerificationPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const handleProof = async (result: ISuccessResult) => {
		try {
			setIsLoading(true);
			const data = await verify(result);

			if (data.success) {
				toast({
					title: "Success",
					description: "Verification successful!",
					variant: "default",
				});
				return data;
			}

			toast({
				title: "Error",
				description: "Verification failed. Please try again.",
				variant: "destructive",
			});
			throw new Error(`Verification failed: ${data.detail}`);
		} catch (error) {
			console.error(error);
			toast({
				title: "Error",
				description: "Something went wrong. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const onSuccess = () => {
		router.push("/list"); // Replace with your next page route
	};

	return (
		<div className="container max-w-md mx-auto py-10">
			<Card>
				<CardHeader>
					<CardTitle>Verify Your Identity</CardTitle>
					<CardDescription>
						Complete the verification to access the voting feature
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="bg-muted p-4 rounded-lg space-y-2">
						<h3 className="font-medium">Benefits of verification:</h3>
						<ul className="list-disc pl-4 space-y-1 text-sm">
							<li>Access to voting rights</li>
							<li>Ability to create posts</li>
							<li>Participate in community decisions</li>
						</ul>
					</div>

					<IDKitWidget
						app_id={process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`}
						action={process.env.NEXT_PUBLIC_WLD_ACTION as string}
						verification_level={VerificationLevel.Device}
						handleVerify={handleProof}
						onSuccess={onSuccess}
					>
						{({ open }) => (
							<Button onClick={open} className="w-full" disabled={isLoading}>
								{isLoading ? "Verifying..." : "Verify with World ID"}
							</Button>
						)}
					</IDKitWidget>
				</CardContent>
			</Card>
		</div>
	);
}