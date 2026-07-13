export function setupFetchInterceptor(removeSession: () => void) {
  const originalFetch = window.fetch;

  window.fetch = async (input, init = {}) => {
    const token = localStorage.getItem('token');

    const newHeaders = new Headers(init.headers || {});
    if (token) newHeaders.set('Authorization', `Bearer ${token}`);

    const modifiedInit: RequestInit = {
      ...init,
      headers: newHeaders,
    };

    const response = await originalFetch(input, modifiedInit);

    if (response.status === 401) {
      const clonedResponse = response.clone();
      let msg = 'Your session has expired. Please log in again.';
      try {
        const data = await clonedResponse.json();
        if (data?.message) msg = data.message;
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('session-expired', { detail: { message: msg } }));
      return Promise.reject(new Error('Unauthorized'));
    }

    return response;
  };
}
