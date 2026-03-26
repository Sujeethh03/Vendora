"use server"

import { cookies, headers } from "next/headers"
import { apiClient } from "@/lib/api-client"
import { LoginRequest, LoginResponse, RegisterRequest, User, ActionResult } from "@/types"

const COOKIE_ACCESS_TOKEN = "access_token"
const COOKIE_REFRESH_TOKEN = "refresh_token"

export async function login(data: LoginRequest): Promise<ActionResult> {
    try {
        const res = await apiClient.post<LoginResponse>("/auth/login", {
            email: data.email,
            password: data.password,
        })

        const cookieStore = await cookies()
        const headerList = await headers()
        const proto = headerList.get("x-forwarded-proto")
        const isExplicitHttp = proto === "http"
        const useSecureCookie = process.env.NODE_ENV === "production" && !isExplicitHttp

        cookieStore.set(COOKIE_ACCESS_TOKEN, res.access_token, {
            httpOnly: true,
            secure: useSecureCookie,
            sameSite: "lax",
            maxAge: res.expires_in,
            path: "/",
        })
        cookieStore.set(COOKIE_REFRESH_TOKEN, res.refresh_token, {
            httpOnly: true,
            secure: useSecureCookie,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60,
            path: "/",
        })

        return { success: true }
    } catch (error: any) {
        console.error("Login failed:", error)
        return { success: false, error: error.message || "Login failed" }
    }
}

export async function register(data: RegisterRequest): Promise<ActionResult> {
    try {
        await apiClient.post("/auth/register", {
            email: data.email,
            password: data.password,
        })

        // Auto-login after registration
        return await login({ email: data.email, password: data.password })
    } catch (error: any) {
        console.error("Registration failed:", error)
        return { success: false, error: error.message || "Registration failed" }
    }
}

export async function logout() {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value

    if (refreshToken) {
        try {
            await apiClient.post("/auth/logout", {
                refresh_token: refreshToken,
            })
        } catch (error) {
            console.error("Logout API call failed:", error)
        }
    }

    cookieStore.delete(COOKIE_ACCESS_TOKEN)
    cookieStore.delete(COOKIE_REFRESH_TOKEN)
}

export async function getMe(): Promise<User | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value

    if (!token) return null

    try {
        return await apiClient.get<User>("/auth/me", { skipErrorLog: true })
    } catch (error) {
        return null
    }
}
