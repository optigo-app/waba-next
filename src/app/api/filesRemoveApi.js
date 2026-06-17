import { REMOVE_FILE_URL } from './Config';

export const removeFileApi = async ({ attachments }) => {
    try {
        const response = await fetch(REMOVE_FILE_URL(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: attachments }),
        });
        return response;
    } catch (error) {
        console.error('File remove failed:', error);
        throw error;
    }
};
