// Entorno de producción: ruta relativa, porque la API se publica en el mismo dominio que el frontend.
const apiBaseUrl = '/apiAmmiOnline';

export const environment = {
    apiBaseUrl,
    apiUrl: `${apiBaseUrl}/api`
};
