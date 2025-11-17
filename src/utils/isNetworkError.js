export const isNetworkError = (error) => {
    if (!error) return false;

    const name = (error.name || "").toLowerCase();
    const message =
        (error.message || error.error_description || "").toLowerCase();

    if (
        name.includes("fetch") ||
        name.includes("network") ||
        message.includes("failed to fetch") ||
        message.includes("network error") ||
        message.includes("offline")
    ) {
        return true;
    }

    if (typeof error.status === "number" && error.status === 0) {
        return true;
    }

    return false;
};

