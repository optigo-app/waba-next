import {
    TEMPLATE_CREATE,
    TEMPLATE_DELETE,
    TEMPLATE_EDIT,
    TEMPLATE_PUBLISH,
    TEMPLATE_SYNC,
} from "./Config";
import { postJson } from "./postJson";

export const createTemplate = async (payload) => {
    try {
        const data = await postJson(TEMPLATE_CREATE(), {
            ...payload,
            IsDraft: payload.IsDraft ?? 0,
        });
        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("createTemplate Error:", error);
        return {
            success: false,
            data: null,
            error: error.message,
        };
    }
};

export const deleteTemplate = async (payload) => {
    try {
        const data = await postJson(TEMPLATE_DELETE(), payload);
        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("deleteTemplate Error:", error);
        return {
            success: false,
            data: null,
            error: error.message,
        };
    }
};

export const editTemplate = async (payload) => {
    try {
        const data = await postJson(TEMPLATE_EDIT(), payload);
        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("editTemplate Error:", error);
        return {
            success: false,
            data: null,
            error: error.message,
        };
    }
};

export const publishTemplate = async (payload) => {
    try {
        const data = await postJson(TEMPLATE_PUBLISH(), payload);
        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("publishTemplate Error:", error);
        return {
            success: false,
            data: null,
            error: error.message,
        };
    }
};

export const sendTemplate = async (payload) => {
    try {
        const data = await postJson(TEMPLATE_TESTSEND(), payload);
        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("sendTemplate Error:", error);
        return {
            success: false,
            data: null,
            error: error.message,
        };
    }
};

export const syncTemplates = async (payload) => {
    try {
        const data = await postJson(TEMPLATE_SYNC(), payload);
        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("syncTemplates Error:", error);
        return {
            success: false,
            data: null,
            error: error.message,
        };
    }
};
