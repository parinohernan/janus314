// Definir el modo de autenticación por defecto
const DEFAULT_AUTH_MODE = 'online';

export const authConfig = {
  mode: DEFAULT_AUTH_MODE as 'local' | 'online',
  endpoints: {
    local: {
      login: '/auth/local/login',
      logout: '/auth/local/logout',
      verify: '/auth/local/verify'
    },
    online: {
      login: '/auth/login',
      loginLegacy: '/auth/online/login',
      asociar: '/auth/asociar',
      logout: '/auth/online/logout',
      verify: '/auth/online/verify'
    }
  }
}; 