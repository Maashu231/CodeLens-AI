import { useCallback, useEffect, useState } from "react";
import { getBackendHealth } from "../services/api";

export function useBackendHealth() {
    const [status, setStatus] = useState("checking");
    const [version, setVersion] = useState(null);
    const [error, setError] = useState(null);

    const refreshHealth = useCallback(async () => {
        setStatus("checking");
        setError(null);

        try {
            const data = await getBackendHealth();
            if (data?.status === "healthy") {
                setStatus("connected");
                setVersion(data?.version || null);
            } else {
                setStatus("disconnected");
                setError("Backend responded with unhealthy status.");
            }
        } catch (err) {
            setStatus("disconnected");
            setError(err.message || "Failed to connect to backend");
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;

        async function verifyConnection() {
            try {
                const data = await getBackendHealth();
                if (isCancelled) {
                    return;
                }

                if (data?.status === "healthy") {
                    setStatus("connected");
                    setVersion(data?.version || null);
                } else {
                    setStatus("disconnected");
                    setError("Backend responded with unhealthy status.");
                }
            } catch (err) {
                if (isCancelled) {
                    return;
                }

                setStatus("disconnected");
                setError(err.message || "Failed to connect to backend");
            }
        }

        verifyConnection();

        return () => {
            isCancelled = true;
        };
    }, []);

    return {
        status,
        version,
        error,
        checkHealth: refreshHealth,
        isConnected: status === "connected",
        isChecking: status === "checking",
    };
}
