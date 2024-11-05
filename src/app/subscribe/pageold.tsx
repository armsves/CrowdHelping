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
import { verify } from "../actions/verify";

export default function VerificationPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const handleProof = async (result: ISuccessResult): Promise<void> => {
		try {
			setIsLoading(true);
			const data = await verify(result);
			console.log("data", data.success);

			if (data.success === true) {
				toast({
					title: "Success",
					description: "Verification successful!",
					variant: "default",
				});
			} else {
				/*
				toast({
					title: "Error",
					description: "Verification failed. Please try again.",
					variant: "destructive",
				});*/
				throw new Error(`${data.detail}`);
			}
		} catch (error) {
			console.error(error);
			/*
			toast({
				title: "Error",
				description: "Something went wrong. Please try again.",
				variant: "destructive",
			});*/
			throw new Error(`${error}`);
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
					<CardTitle>Subscribe to CrowdHelping DAO</CardTitle>
					<CardDescription>
					Subscribe to CrowdHelping DAO to create and participate in activities
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="bg-muted p-4 rounded-lg space-y-2">
						<h3 className="font-medium">Benefits of Subscription:</h3>
						<ul className="list-disc pl-4 space-y-1 text-sm">
							<li>Ability to create posts</li>
							<li>Access to voting rights</li>
							<li>Participate in community activities</li>
						</ul>
					</div>

				</CardContent>
			</Card>
		</div>
	);
}