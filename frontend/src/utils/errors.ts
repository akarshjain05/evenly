export const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object') {
    if ('response' in err) {
      const response = (err as any).response;
      if (response?.data?.userMessage) return response.data.userMessage;
      if (response?.data?.detail) {
          if (typeof response.data.detail === 'string') return response.data.detail;
          if (Array.isArray(response.data.detail) && response.data.detail.length > 0) {
              return response.data.detail[0].msg || 'Validation error';
          }
      }
    }
    if ('message' in err) return (err as any).message;
  }
  return typeof err === 'string' ? err : 'An unexpected error occurred';
};
