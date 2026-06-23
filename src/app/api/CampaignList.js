import { callCommonApi } from "./CommonApi";

export const fetchCampaignLists = async (userId) => {
    try {
        const response = await callCommonApi({
            mode: "broadcast_camp_list",
            f: "Broadcast ( Campaign List )",
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