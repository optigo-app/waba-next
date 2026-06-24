import { CommonAPI } from "../InitialApi/CommonApi";

export const deleteCampaign = async (userId, campaignId) => {
    try {
        const body = {
            "con": `{"id":"","mode":"broadcast_camp_delete","appuserid":"${userId}"}`,
            "p": `{"CampaignId": ${campaignId}}`,
            "f": "Broadcast ( campaign delete )"
        }

        const response = await CommonAPI(body);
        if (response?.Data) {
            return {
                success: true,
                data: response?.Data,
            };
        } else {
            return {
                success: false,
                data: null,
            };
        }
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return {
            success: false,
            data: null,
            error: error?.response?.data || error.message,
        };
    }
};
