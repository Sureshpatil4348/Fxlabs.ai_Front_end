// Utility to resolve Supabase Edge Function name from env
// Supports both a plain function name and a full URL.

export function resolveEdgeFunctionName(
    defaultName = "get-subscription-status"
) {
    let fn =
        process.env.SUPABASE_SUBSCRIPTION_CHECK_FUNCTION ||
        process.env.REACT_APP_SUPABASE_SUBSCRIPTION_CHECK_FUNCTION ||
        defaultName;

    if (!fn) return defaultName;

    if (typeof fn === "string" && fn.startsWith("http")) {
        try {
            const u = new URL(fn);
            const parts = u.pathname.split("/");
            const last = parts.filter(Boolean).pop();
            return last || defaultName;
        } catch (_e) {
            const parts = fn.split("/");
            const last = parts.filter(Boolean).pop();
            return last || defaultName;
        }
    }

    return fn;
}
