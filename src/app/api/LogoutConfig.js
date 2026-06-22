import { getHeaders, LOGOUTAPI } from "./Config";

export const logoutApi = async (body, whatsappNumber) => {
    try {
        const headers = getHeaders(whatsappNumber);

        const response = await fetch(LOGOUTAPI(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
};

