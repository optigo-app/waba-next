// Version configuration
export const APP_VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

// You can add more build-time constants here
export const BUILD_INFO = {
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    environment: process.env.NODE_ENV || 'development',
};
