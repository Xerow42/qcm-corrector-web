import { useEffect, useState } from "react";

export type ApiState<T> = {
  data: T | null;
  error: string;
  loading: boolean;
};

export function toErrorMessage(error: unknown, fallback = "Erreur API"): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Loads data once, and again whenever `load` changes.
 * `load` must be stable: pass a module-level function or wrap it in useCallback.
 */
export function useApi<T>(load: () => Promise<T>): ApiState<T> {
  const [state, setState] = useState<{ data: T | null; error: string }>({ data: null, error: "" });

  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setState({ data, error: "" });
      })
      .catch((error: unknown) => {
        if (active) setState({ data: null, error: toErrorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [load]);

  return { ...state, loading: state.data === null && !state.error };
}
