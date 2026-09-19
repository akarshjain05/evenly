export const getAuthStatus = () => localStorage.getItem('is_logged_in') === 'true';

export const setAuthStatus = (status: boolean) => {
  if (status) {
    localStorage.setItem('is_logged_in', 'true');
  } else {
    localStorage.removeItem('is_logged_in');
  }
};
