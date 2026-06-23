import { callCommonApi } from "./CommonApi";

export const fetchCrmTemplates = async (userId, signal) => {
    try {

        const response = await callCommonApi({
            mode: "broadcast_crm_temp_list",
            f: "Broadcast ( Template List )",
            p: "",
            userId,
            signal,
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
