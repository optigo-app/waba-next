import { CommonAPI } from "../InitialApi/CommonApi";

export const getToken = async (companyCode) => {

    try {
        const body = {
            "con": "{\"id\":\"\",\"mode\":\"gettokenbycompanycode\",\"appuserid\":\"\"}",
            "p": `{\"companycode\":\"${companyCode}\"}`,
            "f": "Gettoken By Company Code (ConversionDetail)"
        }

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
};