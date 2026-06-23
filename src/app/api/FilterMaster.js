import { callCommonApi } from "./CommonApi";

export const fetchFilterMasterList = async (userId) => {
    try {
        const response = await callCommonApi({
            mode: "broadcast_camp_masters",
            f: "Broadcast ( Masters )",
            p: "",
            userId,
        });
        if (response?.Data) {
            return {
                data: response?.Data,
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