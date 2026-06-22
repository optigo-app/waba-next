import { EXCELIMPORT, getHeaders } from "./Config";

export const ExcelImport = async (file, userid, CampaignId) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userid", userid);
    formData.append("CampaignId", CampaignId);

    const response = await fetch(EXCELIMPORT(), {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(response.statusText || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error("API Upload Error:", error);
    throw error;
  }
}
