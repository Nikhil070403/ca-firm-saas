import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Lets the topbar Quick Create menu deep-link into any page's "new record"
 * modal: navigating to <page>?create=1 opens the modal once and strips the
 * param so refresh/back don't reopen it.
 */
export default function useCreateParam(openModal) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      openModal();
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
}
