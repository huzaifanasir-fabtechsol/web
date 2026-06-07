const devApiUrl = "http://localhost:8000";
const prodApiUrl = "https://api.hours-riding-school.me";
export const API_URL = import.meta.env.DEV ? devApiUrl : prodApiUrl;