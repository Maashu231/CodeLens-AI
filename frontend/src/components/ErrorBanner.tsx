import { XCircle } from "lucide-react";

interface ErrorBannerProps {
    message: string;
}

function ErrorBanner({ message }: ErrorBannerProps) {
    if (!message) {
        return null;
    }

    return (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-200 shadow-lg shadow-black/20 animate-[fadeIn_0.3s_ease-out]">
            <XCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />

            <span className="flex-1">{message}</span>

            <button
                onClick={() => {}}
                className="ml-2 rounded-lg p-1 text-rose-400/50 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
                aria-label="Dismiss error"
            />
        </div>
    );
}

export default ErrorBanner;