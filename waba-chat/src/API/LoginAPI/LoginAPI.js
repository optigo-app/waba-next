import { CommonAPI } from "../InitialApi/CommonApi";

export const fetchLoginApi = async (data) => {
    try {
        const combinedValue = JSON.stringify({
            companycode: data?.companycode ?? '',
            psw: data?.password ?? '',
        });

        const body = {
            "con": `{\"id\":\"\",\"mode\":\"login\",\"appuserid\":\"${data?.userId ?? ''}\"}`,
            "f": "Chat module (login)",
            "p": combinedValue,
        };

        const response = await CommonAPI(body, "login");
        if (response?.Data) {
            return response?.Data;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
};