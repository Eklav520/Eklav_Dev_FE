export function setupFetchInterceptor(removeSession: () => void) {
  const originalFetch = window.fetch;

  window.fetch = async (input, init = {}) => {
    const token = localStorage.getItem('token');
    console.log('Fetch interceptor - Token:', token);
    console.log('Fetch interceptor - URL:', typeof input === 'string' ? input : input.url);

    const newHeaders = new Headers(init.headers || {});
    if (token) newHeaders.set('Authorization', `Bearer ${token}`);

    console.log('Fetch interceptor - Headers set:', Array.from(newHeaders.entries()));

    const modifiedInit: RequestInit = {
      ...init,
      headers: newHeaders,
    };

    const response = await originalFetch(input, modifiedInit);

    if (response.status === 401) {
      const clonedResponse = response.clone();
      try {
        const data = await clonedResponse.json();
        const msg = data?.message || 'Session expired or logged in elsewhere';
        alert(`🚫 ${msg}`);
      } catch (_) {
        alert('🚫 You have been logged out.');
      }

      removeSession();
      return Promise.reject(new Error('Unauthorized'));
    }

    return response;
  };
}
