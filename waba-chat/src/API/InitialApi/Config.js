
const isLocal = ["localhost", '5dmjw0dg-2000.inc1.devtunnels.ms'].includes(window.location.hostname);
const isNxt = ['nxtwabachat.optigoapps.com'].includes(window.location.hostname);
const isLocalWeb = ["wabachat.web"].includes(window.location.hostname);

const API_BASE_URL = isLocal ?
    process.env.REACT_APP_API_DEVELOPMENT_URL :
    isLocalWeb ? process.env.REACT_APP_API_WEB_DEVELOPMENT_URL :
        isNxt ? process.env.REACT_APP_API_NXT_PRODUCTION_URL :
            process.env.REACT_APP_API_PRODUCTION_URL;

const BASE_URL = API_BASE_URL;
const MEDIA_BASE_URL = process.env.REACT_APP_MEDIA_BASE_URL;

export const APIURL = `${BASE_URL}/report`;
export const MEDIAAPIURL = MEDIA_BASE_URL;
export const MESSAGEAPIURL = `${BASE_URL}/whatsapp/chat/send`;
export const MESSAGEAPIURLBULK = `${BASE_URL}/whatsapp/chat/send-bulk`;
export const GETCONVERSATIONURL = `${BASE_URL}/report`;
export const LOGOUTAPI = `${BASE_URL}/whatsapp/chat/logout`;
export const UPLOADMEDIA = MEDIA_BASE_URL;
export const SAVEPLAYERID = `${BASE_URL}/report`;
export const MEDIARETRIEVED = `${BASE_URL}/whatsapp/media/retrieved`;


const getAuthData = () => {
    try {
        const authData = sessionStorage.getItem("token");
        return authData ? JSON.parse(authData) : null;
    } catch (error) {
        console.error("Error parsing AuthData:", error);
        return null;
    }
};

// ✅ Updated function to skip credentials if missing
export const getHeaders = (init = {}) => {
    const { version = 'v2', token = "" } = init;
    const AuthData = getAuthData();
    const sp_version = process.env.REACT_APP_SP_VERSION || "16";
    
    return {
        Authorization: `Bearer ${token}` ?? '',
        Yearcode: (AuthData?.yc ?? AuthData?.yearcode) ?? "",
        whatsappNumber: AuthData?.whatsappNumber || "",
        Version: (AuthData?.cuver ?? version) ?? 'v2',
        sv: (AuthData?.sv ?? AuthData?.svid) ?? "1",
        sp: "16",
    };
};