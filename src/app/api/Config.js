'use client';

const getEnvFlags = () => {
    if (typeof window === "undefined") return { isLocal: false, isNxt: false, isLocalWeb: false };
    const hostname = window.location.hostname;
    return {
        isLocal: ["localhost", '5dmjw0dg-2000.inc1.devtunnels.ms'].includes(hostname),
        isNxt: ['nxt21.optigoapps.com'].includes(hostname),
        isLocalWeb: ["wabachat.web"].includes(hostname),
    };
};

const getApiBaseUrl = () => {
    const { isLocal, isNxt, isLocalWeb } = getEnvFlags();
    console.log("hostname", process.env.NEXT_PUBLIC_API_DEVELOPMENT_URL);

    return isLocal
        ? process.env.NEXT_PUBLIC_API_DEVELOPMENT_URL
        : isLocalWeb
            ? process.env.NEXT_PUBLIC_API_WEB_DEVELOPMENT_URL
            : isNxt
                ? process.env.NEXT_PUBLIC_API_NXT_PRODUCTION_URL
                : process.env.NEXT_PUBLIC_API_PRODUCTION_URL;
};

const Image_upload_url = process.env.NEXT_PUBLIC_IMAGE_UPLOAD;

export const APIURL = () => `${getApiBaseUrl()}/report`;
export const LOGOUTAPI = () => `${getApiBaseUrl()}/whatsapp/chat/logout`;

export const TEMPLATE_CREATE = () => `${getApiBaseUrl()}/whatsapp/template/manage/create`;
export const TEMPLATE_DELETE = () => `${getApiBaseUrl()}/whatsapp/template/manage/delete`;
export const TEMPLATE_EDIT = () => `${getApiBaseUrl()}/whatsapp/template/manage/edit`;
export const TEMPLATE_PUBLISH = () => `${getApiBaseUrl()}/whatsapp/template/manage/publish`;
export const TEMPLATE_SYNC = () => `${getApiBaseUrl()}/whatsapp/template/manage/sync`;
export const TEMPLATE_TESTSEND = () => `${getApiBaseUrl()}/whatsapp/template/manage/testsend`;

export const UPLOADFILE = () => {
    const { isLocal } = getEnvFlags();
    return isLocal ? 'https://nxt22.optigoapps.com/api/upload' : `${Image_upload_url}/upload`;
};
export const REMOVE_FILE_URL = () => {
    const { isLocal } = getEnvFlags();
    return isLocal ? 'https://nxt22.optigoapps.com/api/removefile' : `${Image_upload_url}/removefile`;
};

const getAuthData = () => {
    try {
        const authData = sessionStorage.getItem("token");
        return authData ? JSON.parse(authData) : null;
    } catch (error) {
        console.error("Error parsing AuthData:", error);
        return null;
    }
};

export const getHeaders = (init = {}) => {
    const { version = 'v2', token = "" } = init;
    const AuthData = getAuthData();
    
    return {
        Authorization: `Bearer ${token}` ?? '',
        Yearcode: (AuthData?.yc ?? AuthData?.yearcode) ?? "",
        whatsappNumber: AuthData?.whatsappNumber || "",
        Version: (AuthData?.cuver ?? version) ?? 'v2',
        sv: (AuthData?.sv ?? AuthData?.svid) ?? "1",
        sp: "16",
    };
};