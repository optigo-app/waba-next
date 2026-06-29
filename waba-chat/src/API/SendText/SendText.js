import { MessagesSend } from "../InitialApi/MessagesSend";

export const sendText = async (phoneNo, message, userId, customerId) => {
    try {
        const body = {
            "userId": `${userId}`,
            "customerId": `${customerId}`,
            "phoneNo": `${phoneNo}`,
            "type": "text",
            "text": {
                "body": message
            }
        }

        const response = await MessagesSend(body);
        if (response) {
            return response;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
