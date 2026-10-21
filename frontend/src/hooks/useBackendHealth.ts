import { useState, useEffect, useCallback } from "react";
import { getBackendHealth } from "../services/api";
import type { BackendHealth } from "../types";

/**
 * Manages the backend health status.
 * Returns a `status` string ("checking" | "connected" | "disconnected"),
 * a `version` string when available, and a callback to manually refresh.
 */
export function useBackendHealth(): {
    status: string;
    version: string | null;
    checkHealth: () => Promise<void>;
} {
    const [backendStatus, setBackendStatus] = useState<string>("checking");
    const [backendVersion, setBackendVersion] = useState<string | null>(null);

    const checkHealth = useCallback(async () => {
        setBackendStatus("checking");

        try {
            const data = await getBackendHealth() as BackendHealth;
            setBackendStatus("connected");
            setBackendVersion(data?.version ?? null);
        } catch {
            setBackendStatus("disconnected");
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;

        async function verifyInitialConnection() {
            try {
                const data = await getBackendHealth() as BackendHealth;
                if (!isCancelled) {
                    setBackendStatus("connected");
                    setBackendVersion(data?.version ?? null);
                }
            } catch {
                if (!isCancelled) {
                    setBackendStatus("disconnected");
                }
            }
        }

        verifyInitialConnection();

        return () => {
            isCancelled = true;
        };
    }, []);

    return { status: backendStatus, version: backendVersion, checkHealth };
}
