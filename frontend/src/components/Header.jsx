import { ChevronRight } from "lucide-react";

function Header({ isReady }) {
    return (
        <header className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="font-semibold text-slate-200 lg:hidden">
                    CodeLens AI
                </span>

                <ChevronRight
                    size={15}
                    className="text-slate-700 lg:hidden"
                />

                <span className="hidden sm:inline">
                    Workspace
                </span>
            </div>

            <div
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${isReady
                        ? "border-emerald-400/15 bg-emerald-400/6 text-emerald-300"
                        : "border-white/8 bg-white/[0.03] text-slate-500"
                    }`}
            >
                <span
                    className={`h-1.5 w-1.5 rounded-full ${isReady
                            ? "bg-emerald-400"
                            : "bg-slate-600"
                        }`}
                />

                {isReady ? "Repository ready" : "No repository"}
            </div>
        </header>
    );
}

export default Header;