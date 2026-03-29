const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://api.usekredibly.com/api" : "http://localhost:7050/api");

export default API_BASE_URL;
