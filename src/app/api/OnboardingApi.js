import { callCommonApi } from "./CommonApi";

export const exchangeToken = async (code, phoneId, wabaId, userId = '', redirectUri = '') => {
    try {
        const response = await callCommonApi({
            mode: "waba_exchange_token",
            f: "WABA ( exchange_token )",
            p: JSON.stringify({ code, phoneId, wabaId, redirectUri }),
            userId,
        });
        return {
            success: !!response?.Data?.rd?.[0]?.stat || response?.success,
            data: response?.Data?.rd?.[0] || response,
        };
    } catch (error) {
        console.error("Error exchanging token:", error);
        return {
            success: false,
            data: null,
        };
    }
};
