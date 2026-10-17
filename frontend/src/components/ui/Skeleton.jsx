export function SkeletonLine({ width = "full", height = "16px" }) {
    const widthClass = width === "full" ? "w-full" : `w-${width}`;
    return (
        <div
            className={`rounded-full bg-white/10 animate-[shimmer_1.5s_ease-in_out_infinite] ${widthClass}`}
            style={{ height }}
        />
    );
}

export function SkeletonBlock({ height = "100px", rounded = "rounded-xl" }) {
    return (
        <div
            className={`bg-white/10 ${rounded} animate-[shimmer_1.5s_ease-in_out_infinite]`}
            style={{ height }}
        />
    );
}

export function SkeletonText({ lines = 3, width = "full" }) {
    return (
        <div className="flex flex-col gap-2">
            {[...Array(lines)].map((_, i) => (
                <div
                    key={i}
                    className={`bg-white/10 rounded-[3px] h-4 animate-[shimmer_1.5s_ease-in_out_infinite] ${i === lines - 1 ? "w-1/2" : "w-full"} ${width === "full" ? "w-full" : width}`}
                />
            ))}
        </div>
    );
}
