import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/features/dashboard-sidebar"
import { MobileNav } from "@/components/features/mobile-nav"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { getMe } from "@/actions/auth-actions"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getMe()

    if (!user || !user.is_admin) {
        redirect("/login")
    }

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="dashboard-theme"
            disableTransitionOnChange
        >
            <div className="flex h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <div className="hidden md:block w-64 shrink-0">
                    <DashboardSidebar user={user} />
                </div>

                {/* Mobile Sidebar & Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <MobileNav mainContentId="dashboard-main" user={user} />

                    <main
                        id="dashboard-main"
                        className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 pt-20 md:p-8 md:pt-8 scroll-smooth"
                    >
                        {children}
                    </main>
                </div>
            </div>
        </ThemeProvider>
    )
}
