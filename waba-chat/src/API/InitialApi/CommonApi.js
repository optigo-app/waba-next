import axios from "axios";
import { APIURL, getHeaders } from "./Config";

export const CommonAPI = async (body) => {
    try {
        const headers = getHeaders();
        const { data } = await axios.post(APIURL, body, { headers: headers });
        return data;
    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request canceled:', error.message);
            throw new Error('AbortError');
        }
        console.error("API Error:", error);
        return null;
    }
};