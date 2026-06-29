import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchCustomerLists = async (page = 1, pageSize = 20, searchTerm = "", userId) => {
    try {
        const body = {
            "con": `{\"id\":\"\",\"mode\":\"wa_customer_list_chat\",\"appuserid\":\"${userId}\"}`,
            "p": `{\"Page\":${page},\"PageSize\":${pageSize},\"SearchTerm\": \"${searchTerm}\"}`,
            "f": "WhatsApp Chat ( Customer List )",
        };

        const response = await CommonAPI(body);
        if (response?.Data) {
            return {
                data: response?.Data?.rd || [],
                total: response?.Data?.total || response?.Data?.rd?.length || 0,
                currentPage: page,
                hasMore: response?.Data?.rd?.length === pageSize
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