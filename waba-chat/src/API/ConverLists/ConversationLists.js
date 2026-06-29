import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchConversationLists = async (page = 1, pageSize = 20, userId, search = "") => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"wa_list_conv\",\"appuserid\":\"${userId}\"}`,
            "p": `{\"Page\":${page},\"PageSize\":${pageSize},\"SearchTerm\": \"${search}\"}`,
            "f": "Chat ( List Conversation )",
        };
        const response = await CommonAPI(body);
        if (response?.Data) {
            const resultsArray = Array.isArray(response.Data)
                ? response.Data
                : (response.Data?.rd || []);
            return {
                data: response?.Data || [],
                total: response?.Data?.total || resultsArray.length || 0,
                currentPage: page,
                hasMore: resultsArray.length === pageSize
            };
        } else {
            return {
                data: [],
                total: 0,
                currentPage: page,
                hasMore: false
            };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            data: [],
            total: 0,
            currentPage: page,
            hasMore: false
        };
    }
};