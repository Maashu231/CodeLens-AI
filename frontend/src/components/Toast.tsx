import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import type { ToastType } from "../types";

interface ToastProps {
    type: ToastType;
    message: string;
    onClose: () => void;
}

function Toast({ type, message, onClose }: ToastProps) {
    const icons = {
        success: CheckCircle2,
        error: XCircle,
        info: Info,
    };

    const Icon = icons[type] || Info;

    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className={`
                fixed bottom-6 right-6 z-50 flex w-[340px] items-start gap-3 rounded-2xl border
                bg-[#0d121b]/95 px-4 py-3 shadow-2xl shadow-black/30
                backdrop-blur-xl animate-[slideUp_0.3s_ease-out]
                ${type === "success" ? "border-emerald-500/30 text-emerald-200" : type === "error" ? "border-red-500/30 text-red-200" : "border-blue-500/30 text-blue-200"}
            `}
        >
            <div className="mt-0.5 flex-shrink-0">
                <Icon size={16} />
            </div>

            <span className="flex-1 text-sm">{message}</span>

            <button
                onClick={onClose}
                className="flex-shrink-0 rounded-lg p-1 text-current/60 hover:text-current/90 hover:bg-white/[0.05] transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
}

export default Toast;