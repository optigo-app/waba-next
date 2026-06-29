import { CommonAPI } from "../InitialApi/CommonApi";

export const addCustomer = async (userPhone, userId = 1, firstName = "", lastName = "", conversationId = "") => {
    try {
        const body = {
            "con": "{\"id\":\"\",\"mode\":\"wa_add_customer\",\"appuserid\":\"admin@hs.com\"}",
            "p": `{"UserPhone": "${userPhone}","FirstName": "${firstName}","LastName": "${lastName}","ConversationId": "${conversationId}"}`,
            "f": "Chat ( Add Customer )"
        };

        const response = await CommonAPI(body);
        if (response?.Data) {
            return response?.Data;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}