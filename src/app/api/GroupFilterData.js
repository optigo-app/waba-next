import { callCommonApi } from "./CommonApi";

export const fetchGroupFilterList = async (
    userId,
    {
        groupFilter = "",
        branchFilter = "",
    } = {}
) => {
    try {
        const payload = {
            GroupFilter: groupFilter,
            Branch: branchFilter,
        };

        const response = await callCommonApi({
            mode: "broadcast_cust_list",
            f: "Broadcast ( Customer Group List )",
            p: JSON.stringify(payload),
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