import { XCircle } from "lucide-react";

function ErrorBanner({ message }) {
    if (!message) {
        return null;
    }

    return (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/15 bg-red-400/5 p-4 text-sm text-red-300">
            <XCircle
                size={18}
                className="mt-0.5 shrink-0"
            />

            <span>{message}</span>
        </div>
    );
}

export default ErrorBanner;