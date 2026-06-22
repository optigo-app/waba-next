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
    const abortControllerRef = useRef(null);

    const userId = auth?.username || auth?.userid || auth?.userId || '';
    const createdBy = auth?.id || 4;
    const authUserId = auth?.userId || '';

    const load = useCallback(async (showLoader = true) => {
        if (!userId) return;
        if (showLoader) setLoading(true);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        try {
            const result = await fetchCrmTemplates(userId, controller.signal);
            setTemplates(result.data || []);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Error loading templates:', err);
            toast.error('Failed to load templates');
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
    }, [auth?.token]);

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
        } catch (err) {
            console.error('Error syncing templates:', err);
            toast.error('Failed to sync templates');
        } finally {
            setSyncLoading(false);
        }
    }, [userId, createdBy, authUserId, load]);

    const remove = useCallback(async (template) => {
        try {
            const result = await deleteTemplate({ TemplateId: template.Id });
            if (result.success) {
                await load(false);
                toast.success('Template deleted successfully');
            } else {
                toast.error('Failed to delete template');
            }
            return result.success;
        } catch (err) {
            console.error('Error deleting template:', err);
            toast.error('Failed to delete template');
            return false;
        }
    }, [load]);

    const publish = useCallback(async (template) => {
        try {
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
        } catch (err) {
            console.error('Error publishing template:', err);
            toast.error('Failed to publish template');
            return false;
        }
    }, [createdBy, authUserId, load]);

    return { templates, loading, syncLoading, refresh, sync, remove, publish };
}
