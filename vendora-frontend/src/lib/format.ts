const priceFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })
const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" })

export const formatPrice = (price: number) => priceFormatter.format(price)

export const formatDate = (iso: string) => dateFormatter.format(new Date(iso))
