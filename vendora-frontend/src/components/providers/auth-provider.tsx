"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { User, LoginRequest, RegisterRequest } from "@/types"
import { getMe, login as loginAction, logout as logoutAction, register as registerAction } from "@/actions/auth-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (data: LoginRequest, redirectTo?: string) => Promise<void>
    logout: () => Promise<void>
    register: (data: RegisterRequest) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function loadUser() {
            try {
                const userData = await getMe()
                setUser(userData)
            } catch (error) {
                console.error("Failed to load user", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadUser()
    }, [])

    const login = async (data: LoginRequest, redirectTo?: string) => {
        setIsLoading(true)
        try {
            const result = await loginAction(data)
            if (result.success) {
                const userData = await getMe()
                setUser(userData)
                toast.success("Welcome back!")
                router.push(userData?.is_admin ? "/dashboard" : (redirectTo || "/"))
            } else {
                toast.error(result.error || "Login failed")
                throw new Error(result.error)
            }
        } catch (error: any) {
            if (!error.message) toast.error("An unexpected error occurred")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        await logoutAction()
        setUser(null)
        toast.success("Logged out successfully")
        window.location.href = "/"
    }

    const register = async (data: RegisterRequest) => {
        setIsLoading(true)
        try {
            const result = await registerAction(data)
            if (result.success) {
                const userData = await getMe()
                setUser(userData)
                toast.success("Account created successfully!")
                router.push("/")
            } else {
                toast.error(result.error || "Registration failed")
                throw new Error(result.error)
            }
        } catch (error: any) {
            if (!error.message) toast.error("An unexpected error occurred")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
