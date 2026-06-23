import { callCommonApi } from "./CommonApi";

export const fetchGroupList = async (userId) => {
    try {
        const response = await callCommonApi({
            mode: "broadcast_cust_group_list",
            f: "Broadcast ( Customer Group List )",
            p: "",
            userId,
        });
        if (response?.Data) {
            return {
                data: response?.Data?.rd,
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