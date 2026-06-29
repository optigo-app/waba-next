import axios from "axios";
import { getHeaders } from "./Config";

export const UploadMedia = async (file, whatsappNumber, whatsappKey, onProgress) => {
  try {
    const token = JSON.parse(sessionStorage.getItem("token"));
    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("file", file);
    if (file?.type) formData.append("type", file.type);

    const baseURL = token?.isMeta == 1
      ? `https://graph.facebook.com/v19.0/${whatsappNumber}/media`
      : `https://crmapp.mpillarapi.com/api/meta/v19.0/${whatsappNumber}/media`;

    const headers = token?.isMeta == 1
      ? {
          Authorization: `Bearer ${whatsappKey}`,
          "Content-Type": "multipart/form-data",
        }
      : {
          ...getHeaders(whatsappNumber),
          Authorization: `Bearer ${whatsappKey}`,
          "Content-Type": "multipart/form-data",
        };

    const { data } = await axios.post(baseURL, formData, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const loaded = progressEvent?.loaded ?? 0;
          const total = progressEvent?.total ?? file?.size ?? 1;
          let percent = Math.round((loaded * 100) / total);

          if (!progressEvent?.total && file?.size) {
            const approxTotal = file.size;
            percent = loaded >= approxTotal ? 100 : Math.min(percent, 99);
          }
          onProgress(percent);
        }
      },
    });

    if (onProgress) onProgress(100);

    return data;
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
};