import axios from "axios";
import { getHeaders, MEDIARETRIEVED } from "./Config";

export const MediaApi = async (authToken, whatsappNumber, fileId) => {
  try {
    const response = await axios.post(
      `${MEDIARETRIEVED}`,
      {
        mediaid: fileId
      },
      {
        headers: getHeaders(),
        responseType: "blob"
      }
    );

    return response.data;
  } catch (error) {
    console.error("MediaApi Error:", error);
    return null;
  }
};
