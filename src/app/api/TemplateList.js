import { callCommonApi } from "./CommonApi";

export const fetchTemplateLists = async (userId) => {
    try {
        
        const response = await callCommonApi({
            mode: "broadcast_temp_list",
            f: "Broadcast ( Template List )",
            p: "",
            userId,
        });
        if (response?.Data) {
            return {
                data: response?.Data?.rd || [],
            };
        } else {
            return {
                data: [],
            };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            data: [],
        };
    }
};