import { CommonAPI } from "../InitialApi/CommonApi";

export const conversationView = async (ConversationId, Page = 1, PageSize = 10, userId, pageName, signal) => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"wa_list_chat\",\"appuserid\":\"${userId}\"}`,
            "p": `{\"ConversationId\": ${ConversationId}, \"Page\": ${Page}, \"PageSize\": ${PageSize} }`,
            "f": "Chat ( list )"
        }

        // Fix: properly pass the signal parameter to CommonAPI
        const response = await CommonAPI(body, undefined, pageName, signal);
        if (response?.Data) {
            return {
                data: response?.Data || [],
                total: response?.Data?.total || response?.Data?.rd?.length || 0,
                currentPage: Page,
                hasMore: response?.Data?.rd?.length === PageSize
            };
        } else {
            return {
                data: [],
                total: 0,
                currentPage: Page,
                hasMore: false
            };
        }
    } catch (error) {
        // Re-throw abort errors so they can be handled properly
        if (error.message === 'AbortError') {
            throw error;
        }
        console.error('Error:', error);
        return {
            data: [],
            total: 0,
            currentPage: Page,
            hasMore: false
        };
    }
}