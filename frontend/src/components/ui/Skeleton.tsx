interface SkeletonLineProps {
    width?: string;
    height?: string;
}

export function SkeletonLine({ width = "full", height = "16px" }: SkeletonLineProps) {
    const style: React.CSSProperties = { height };
    if (width !== "full") {
        style.width = width;
    }
    return (
        <div
            className={`rounded-full bg-white/10 ${width === "full" ? "w-full" : "max-w-none"} animate-[shimmer_1.5s_ease-in_out_infinite]`}
            style={style}
        />
    );
}

interface SkeletonBlockProps {
    height?: string;
    rounded?: string;
}

export function SkeletonBlock({ height = "100px", rounded = "rounded-xl" }: SkeletonBlockProps) {
    return (
        <div
            className={`bg-white/10 ${rounded} animate-[shimmer_1.5s_ease-in_out_infinite]`}
            style={{ height }}
        />
    );
}

interface SkeletonTextProps {
    lines?: number;
    width?: string;
}

export function SkeletonText({ lines = 3, width = "full" }: SkeletonTextProps) {
    return (
        <div className="flex flex-col gap-2">
            {[...Array(lines)].map((_, i) => (
                <div
                    key={i}
                    className={`bg-white/10 rounded-[3px] h-4 animate-[shimmer_1.5s_ease-in_out_infinite] ${i === lines - 1 ? "w-1/2" : ""} ${width === "full" ? "w-full" : "max-w-none"}`}
                    style={width !== "full" ? { width } : undefined}
                />
            ))}
        </div>
    );
}
