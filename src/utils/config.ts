export const API_CONFIG = {
  // Base URL del backend - cambiar cuando esté corriendo
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:8081',
  
  // Timeouts
  timeout: 30000,
  
  // Endpoints
  endpoints: {
    snippets: '/snippet',
    users: '/users',
    format: '/format',
    linting: '/linting',
    testing: '/testing',
    fileTypes: '/file-types',
    rules: '/rules'
  }
};

// Helper para construir URLs
export const buildURL = (endpoint: string): string => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};


