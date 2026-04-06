import { redirect } from "next/navigation"
import { getMe } from "@/actions/auth-actions"

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getMe()
    if (user) redirect(user.is_admin ? "/dashboard" : "/")

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    )
}
