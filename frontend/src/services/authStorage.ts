const ACCESS_TOKEN_KEY = 'parkzee_token';
const REFRESH_TOKEN_KEY = 'parkzee_refresh_token';
const USER_KEY = 'parkzee_user';

// sessionStorage is isolated per top-level tab and survives a page refresh.
export const authStorage = {
  getAccessToken: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => sessionStorage.getItem(REFRESH_TOKEN_KEY),
  save: (token: string, refreshToken: string, user: unknown) => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  saveAccessToken: (token: string) => sessionStorage.setItem(ACCESS_TOKEN_KEY, token),
  saveTokens: (token: string, refreshToken: string) => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  saveUser: (user: unknown) => sessionStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event('parkzee:session-expired'));
  },
};
