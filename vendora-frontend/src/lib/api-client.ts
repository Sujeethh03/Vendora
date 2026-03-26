import "server-only"
import { cookies } from "next/headers"
import { config } from "./config"

type FetchOptions = RequestInit & {
    params?: Record<string, string>
    skipErrorLog?: boolean
}

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message)
        this.name = "ApiError"
    }
}

async function fetchWrapper<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, headers, skipErrorLog, ...rest } = options

    const url = new URL(endpoint.startsWith("http") ? endpoint : `${config.api.baseUrl}${endpoint}`)

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value)
        })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    const isFormData = rest.body instanceof FormData
    const defaultHeaders: HeadersInit = {
        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
        // Backend reads access_token from Cookie header, not Authorization
        ...(token ? { "Cookie": `access_token=${token}` } : {}),
    }

    let response: Response
    try {
        response = await fetch(url.toString(), {
            headers: { ...defaultHeaders, ...headers },
            ...rest,
            cache: options.cache || "no-store",
        })
    } catch (error: any) {
        const code = error.cause?.code
        let message = "Network request failed. Please check your connection."

        if (code === "UND_ERR_CONNECT_TIMEOUT") {
            message = "Connection timed out. The server took too long to respond."
        } else if (code === "ECONNREFUSED") {
            message = "Unable to connect to the server. Service may be unavailable."
        }

        if (!skipErrorLog) {
            if (code === "UND_ERR_CONNECT_TIMEOUT" || code === "ECONNREFUSED") {
                console.warn(`[API Client] Network error: ${message}`)
            } else {
                console.error(`[API Client] Network error:`, error)
            }
        }

        throw new ApiError(503, message)
    }

    if (!response.ok) {
        let errorMessage = `API Error: ${response.statusText}`
        try {
            const errorBody = await response.json()
            if (!skipErrorLog) {
                console.error(`[API Client] Error Response Body (${response.status}):`, JSON.stringify(errorBody, null, 2))
            }

            if (errorBody.detail) {
                errorMessage = typeof errorBody.detail === 'string'
                    ? errorBody.detail
                    : JSON.stringify(errorBody.detail)
            } else if (errorBody.message) {
                errorMessage = errorBody.message
            } else if (errorBody.error) {
                errorMessage = errorBody.error
            }
        } catch (e) {
            if (!skipErrorLog) {
                console.error("[API Client] Failed to parse error body:", e)
            }
        }
        throw new ApiError(response.status, errorMessage)
    }

    if (response.status === 204) {
        return null as unknown as T
    }

    return response.json()
}

export const apiClient = {
    get: <T>(endpoint: string, options?: FetchOptions) =>
        fetchWrapper<T>(endpoint, { ...options, method: "GET" }),

    post: <T>(endpoint: string, body: any, options?: FetchOptions) =>
        fetchWrapper<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),

    put: <T>(endpoint: string, body: any, options?: FetchOptions) =>
        fetchWrapper<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),

    delete: <T>(endpoint: string, options?: FetchOptions) =>
        fetchWrapper<T>(endpoint, { ...options, method: "DELETE" }),

    postForm: <T>(endpoint: string, body: FormData, options?: FetchOptions) =>
        fetchWrapper<T>(endpoint, { ...options, method: "POST", body }),

    patch: <T>(endpoint: string, options?: FetchOptions) =>
        fetchWrapper<T>(endpoint, { ...options, method: "PATCH" }),
}
