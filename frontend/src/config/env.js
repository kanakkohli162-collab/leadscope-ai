/**
 * All environment-dependent values live here.
 *
 * Vite exposes variables that start with VITE_ via import.meta.env.
 * Put VITE_API_BASE_URL in a `.env` file (see .env.example) so dev, staging
 * and production can point at different backends without code changes.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'