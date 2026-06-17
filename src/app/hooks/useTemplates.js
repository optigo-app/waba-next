'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCrmTemplates } from '../api/CrmTemplates';
import { syncTemplates, deleteTemplate, publishTemplate } from '../api/TemplateApi';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';
import { getSocket } from '../socket';

export function useTemplates() {
    const { auth } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const hasLoaded = useRef(false);

    const userId = auth?.username || auth?.userid || auth?.userId || '';
    const createdBy = auth?.id || 4;
    const authUserId = auth?.userId || '';

    const load = useCallback(async (showLoader = true) => {
        if (!userId) return;
        if (showLoader) setLoading(true);
        try {
            const result = await fetchCrmTemplates(userId);
            setTemplates(result.data || []);
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId && !hasLoaded.current) {
            hasLoaded.current = true;
            load();
        }
    }, [userId, load]);

    // Socket listener for real-time template updates
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const socket = getSocket();
        if (!socket) return;

        const onUpdate = (eventData) => {
            const update = Array.isArray(eventData) ? eventData[1] : eventData;
            if (!update?.Id) return;
            setTemplates((prev) =>
                prev.map((t) =>
                    Number(t?.Id) === Number(update.Id)
                        ? {
                            ...t,
                            TemplateType: update.TemplateType ?? t.TemplateType,
                            WabaStatus: update.WabaStatus ?? t.WabaStatus,
                            TemplateJson: update.TemplateJson ?? t.TemplateJson,
                        }
                        : t
                )
            );
        };

        socket.on('templateUpdate', onUpdate);
        return () => socket.off('templateUpdate', onUpdate);
    }, []);

    const refresh = useCallback(() => load(true), [load]);

    const sync = useCallback(async () => {
        if (!userId) return;
        setSyncLoading(true);
        try {
            const result = await syncTemplates({ CreatedBy: createdBy, UserId: authUserId });
            if (result.success) {
                await load(false);
                toast.success('Templates synced successfully');
            } else {
                toast.error('Failed to sync templates');
            }
        } finally {
            setSyncLoading(false);
        }
    }, [userId, createdBy, authUserId, load]);

    const remove = useCallback(async (template) => {
        const result = await deleteTemplate({ TemplateId: template.Id });
        if (result.success) {
            await load(false);
            toast.success('Template deleted successfully');
        } else {
            toast.error('Failed to delete template');
        }
        return result.success;
    }, [load]);

    const publish = useCallback(async (template) => {
        const result = await publishTemplate({
            TemplateId: template.Id,
            CreatedBy: createdBy,
            UserId: authUserId,
        });
        if (result.success) {
            await load(false);
            toast.success('Template published successfully');
        } else {
            toast.error(result.error?.message || 'Failed to publish template');
        }
        return result.success;
    }, [createdBy, authUserId, load]);

    return { templates, loading, syncLoading, refresh, sync, remove, publish };
}
