const devApiUrl = "http://localhost:8000";
export const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (import.meta.env.DEV ? devApiUrl : "");