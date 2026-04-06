export const config = {
    api: {
        baseUrl: process.env.API_URL || "http://localhost:8000",
        publicBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    },
    isDevelopment: process.env.NODE_ENV === "development",
} as const
