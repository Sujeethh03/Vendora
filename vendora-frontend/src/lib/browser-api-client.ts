import { config } from "./config"

export class BrowserApiError extends Error {
    constructor(public status: number, message: string) {
        super(message)
        this.name = "BrowserApiError"
    }
}

async function fetchWrapper<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${config.api.publicBaseUrl}${endpoint}`

    const isFormData = options.body instanceof FormData
    const response = await fetch(url, {
        ...options,
        credentials: "include", // browser sends httpOnly cookies automatically
        headers: {
            ...(!isFormData ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
    })

    if (!response.ok) {
        let message = response.statusText
        try {
            const body = await response.json()
            if (body.detail) message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail)
        } catch {}
        throw new BrowserApiError(response.status, message)
    }

    if (response.status === 204) return null as T
    return response.json()
}

export const browserApiClient = {
    get:    <T>(endpoint: string) =>
        fetchWrapper<T>(endpoint, { method: "GET" }),
    post:   <T>(endpoint: string, body: unknown) =>
        fetchWrapper<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
    delete: <T>(endpoint: string) =>
        fetchWrapper<T>(endpoint, { method: "DELETE" }),
}
