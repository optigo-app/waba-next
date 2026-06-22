import { APIURL, getHeaders, SENDBULK } from "./Config";

export const SendBulkCampaign = async (body, whatsappNumber) => {
  try {
    const headers = getHeaders();
    const response = await fetch(SENDBULK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...(whatsappNumber ? { whatsappNumber } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("SendBulk API Error:", response.statusText);
      return { success: false, data: [] };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in SendBulkCampaign:", error);
    return { success: false, data: [] };
  }
};
