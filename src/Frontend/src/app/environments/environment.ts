// Entorno de desarrollo. En producción se sustituye por environment.production.ts (angular.json).
const apiBaseUrl = 'https://localhost:7267';

export const environment = {
    apiBaseUrl,
    apiUrl: `${apiBaseUrl}/api`
};
