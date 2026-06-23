import { callCommonApi } from "./CommonApi";

export const fetchExcelList = async (userId, fetchCampignId, groupFilter, filters, searchTerm) => {
    try {

        const response = await callCommonApi({
            mode: "broadcast_excel_cust_list",
            f: "Broadcast ( Customer Group List )",
            p: `{"CampaignId": ${fetchCampignId},"GroupFilter": "${groupFilter}","CompanyName":"${filters?.companyName ?? ""}","CompanyType":"${filters?.companyType ?? ""}","State": "${filters?.state ?? ""}","City": "${filters?.city ?? ""}","Country": "${filters?.country ?? ""}","SearchTerm": "${searchTerm}"}`,
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