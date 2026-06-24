import { CommonAPI } from "../InitialApi/CommonApi";

export const checkTemplateNameExists = async (userId) => {
    try {
        const body = {
            "con": `{"id":"","mode":"broadcast_template_list","appuserid":"${userId}"}`,
            "p": "",
            "f": "Broadcast ( broadcast_template_list )"
        }

        const response = await CommonAPI(body);
        if (response?.Data) {
            const list = response.Data.rd || [];
            return {
                success: true,
                data: list,
            };
        } else {
            return {
                success: false,
                data: [],
            };
        }
    } catch (error) {
        console.error('Error fetching template list:', error);
        return {
            success: false,
            data: [],
            error: error?.response?.data || error.message,
        };
    }
};
