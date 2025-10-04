// Global network error handler
let networkErrorHandler: ((error: any) => void) | null = null;

export const setNetworkErrorHandler = (handler: (error: any) => void) => {
  networkErrorHandler = handler;
};

export const handleNetworkError = (error: any) => {
  if (networkErrorHandler) {
    networkErrorHandler(error);
  }
};

// Enhanced fetch wrapper that automatically handles network errors
export const fetchWithNetworkErrorHandling = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // Handle network errors
    handleNetworkError(error);
    throw error;
  }
};

// Override the global fetch function to automatically handle network errors
const originalFetch = global.fetch;

global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    const response = await originalFetch(input, init);
    return response;
  } catch (error) {
    // Handle network errors globally
    handleNetworkError(error);
    throw error;
  }
};
