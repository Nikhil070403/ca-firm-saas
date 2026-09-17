import { useCallback, useEffect, useRef, useState } from 'react';
import { extractErrorMessage } from '../services/apiClient';

/**
 * Hand-rolled stand-in for the data-fetching half of TanStack Query (see
 * PROJECT_STATE.md stack pivot — no external cache library). `fetcher` must
 * be stable across renders that shouldn't refetch; pass primitives in `deps`
 * (page, filters, search) so it only re-runs when they actually change.
 */
export function useApiData(fetcher, deps = [], { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (requestId.current === currentRequest) setData(result);
      })
      .catch((err) => {
        if (requestId.current === currentRequest) setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (requestId.current === currentRequest) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // `skip` is checked here (not inside `load`) so it's read fresh from the
  // latest render on every dependency change — folding it into `load`'s own
  // useCallback would freeze it at whatever value was true when `load` was
  // last recreated, and a later true->false flip would never trigger a fetch.
  useEffect(() => {
    if (skip) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, skip]);

  return { data, loading, error, refetch: load, setData };
}

export default useApiData;
