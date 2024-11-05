// components/ui/flickering-background.tsx
import { cn } from "@/lib/utils";
import FlickeringGrid from "./ui/flickering-grid";

interface FlickeringBackgroundProps {
	children?: React.ReactNode;
	className?: string;
	containerClassName?: string;
	squareSize?: number;
	gridGap?: number;
	color?: string;
	maxOpacity?: number;
	flickerChance?: number;
	height?: number;
	width?: number;
	patternClassName?: string;
}

export function FlickeringBackground({
	children,
	className,
	containerClassName,
	squareSize = 4,
	gridGap = 6,
	color = "#6B7280",
	maxOpacity = 0.5,
	flickerChance = 0.1,
	height = 800,
	width = 1600,
	patternClassName,
}: FlickeringBackgroundProps) {
	return (
		<div
			className={cn(
				"relative h-[500px] w-full overflow-hidden rounded-lg border",
				containerClassName,
			)}
		>
			{children && (
				<div className={cn("relative z-10", className)}>{children}</div>
			)}
			<FlickeringGrid
				className={cn("absolute inset-0 size-full z-0", patternClassName)}
				squareSize={squareSize}
				gridGap={gridGap}
				color={color}
				maxOpacity={maxOpacity}
				flickerChance={flickerChance}
				height={height}
				width={width}
			/>
		</div>
	);
}