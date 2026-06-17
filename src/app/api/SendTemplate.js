import { TEMPLATE_TESTSEND, getHeaders } from "./Config";

const postJson = async (url, payload) => {
    const headers = getHeaders();
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
    }

    return response.json();
};

export const sendTemplate = async (payload) => {
    try {
        const data = await postJson(TEMPLATE_TESTSEND(), payload);
        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("sendTemplate Error:", error);
        return {
            success: false,
            data: null,
            error: error.message,
        };
    }
};
