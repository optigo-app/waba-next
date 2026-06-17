'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    ToggleButtonGroup,
    ToggleButton,
    Tooltip,
    IconButton,
    Drawer,
} from '@mui/material';
import {
    Plus, RefreshCw, FileText, LayoutGrid, List, ArrowLeft,
    X, AlertTriangle,
} from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../contexts/WalletContext';
import TemplateGrid from '../components/Template/TemplateGrid';
import TemplateCardGrid from '../components/Template/TemplateCardGrid'; // NEW modern card UI
import TemplateTable from '../components/Template/TemplateTable';
import TemplateSkelton from '../components/Template/TemplateSkelton';
import FilterBar from '../components/Common/FilterBar/FilterBar';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import styles from '../components/Template/Templates.module.scss';
import SendTemplateDialog from '../components/SendTemplateDialog/SendTemplateDialog';
import MessagePreview from '../components/Common/MessagePreview/MessagePreview';
import { extractTemplatePreviewData } from '../utils/templatePreviewUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getSortTime = (item) => {
    const updatedAtMs = new Date(item?.UpdatedAt).getTime();
    if (Number.isFinite(updatedAtMs)) return updatedAtMs;
    const entryDateMs = new Date(item?.EntryDate).getTime();
    if (Number.isFinite(entryDateMs)) return entryDateMs;
    return 0;
};

// ── Page ──────────────────────────────────────────────────────────────────────
const TemplatesPage = () => {
    const router = useRouter();
    const { auth } = useAuth();
    const { templates, loading, syncLoading, refresh, sync, remove, publish } = useTemplates();
    const { hasSufficientBalance, walletInfo } = useWallet();

    // UI State
    const [viewMode, setViewMode] = useState('grid');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);

    // Dialog State
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [openPreview, setOpenPreview] = useState(false);
    const [deleteTemplateData, setDeleteTemplateData] = useState(null);
    const [publishTemplateData, setPublishTemplateData] = useState(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [openSendDialog, setOpenSendDialog] = useState(false);
    const [selectedTemplateForSend, setSelectedTemplateForSend] = useState(null);
    const [showInsufficientBalanceDialog, setShowInsufficientBalanceDialog] = useState(false);

    const userToken = auth;

    // Synchronous preview data — MessagePreview handles broken URLs internally
    const validatedPreviewData = useMemo(() => {
        if (!previewTemplate) return null;
        return extractTemplatePreviewData(previewTemplate);
    }, [previewTemplate]);

    // Reset page when search/filter changes
    const handleSearchChange = useCallback((val) => { setSearch(val); setCurrentPage(1); }, []);
    const handleFilterChange = useCallback((val) => { setFilterStatus(val); setCurrentPage(1); }, []);

    // Filtered, sorted, paginated
    const { filtered, paginated, statusCounts } = useMemo(() => {
        let list = templates;

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((t) => {
                const fields = [
                    t.TemplateName, t.WabaStatus, t.Category,
                    t.Type, t.EntryDate, t.WabaTemplateId,
                ].filter(Boolean).map((f) => String(f).toLowerCase());
                return fields.some((f) => f.includes(q));
            });
        }

        if (filterStatus !== 'ALL') {
            list = filterStatus === 'OTHERS'
                ? list.filter((t) => !t.WabaStatus || !['APPROVED', 'PENDING', 'REJECTED', 'DRAFT'].includes(t.WabaStatus.toUpperCase()))
                : list.filter((t) => t.WabaStatus?.toUpperCase() === filterStatus);
        }

        const sorted = [...list].sort((a, b) => {
            if (sortBy === 'newest') return getSortTime(b) - getSortTime(a);
            if (sortBy === 'oldest') return getSortTime(a) - getSortTime(b);
            if (sortBy === 'name') return (a.TemplateName || '').localeCompare(b.TemplateName || '');
            return 0;
        });

        const counts = templates.reduce((acc, t) => {
            const s = t.WabaStatus?.toUpperCase() || 'OTHERS';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        const start = (currentPage - 1) * itemsPerPage;
        const pageItems = sorted.slice(start, start + itemsPerPage);

        return { filtered: sorted, paginated: pageItems, statusCounts: counts };
    }, [templates, search, filterStatus, sortBy, currentPage, itemsPerPage]);

    // Action Handlers
    const handlers = {
        onView: (t) => { setPreviewTemplate(t); setOpenPreview(true); },
        onSend: (t) => {
            if (!hasSufficientBalance) {
                setShowInsufficientBalanceDialog(true);
                return;
            }
            setSelectedTemplateForSend(t);
            setOpenSendDialog(true);
        },
        onClone: (t) => {
            const params = new URLSearchParams();
            params.set('clone', '1');
            params.set('id', t.Id);
            router.push(`/templates/create?${params.toString()}`);
        },
        onEdit: (t) => {
            router.push(`/templates/create?id=${t.Id}`);
        },
        onDelete: (t) => setDeleteTemplateData(t),
        onPublish: (t) => setPublishTemplateData(t),
    };

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteTemplateData) return;
        const ok = await remove(deleteTemplateData);
        if (ok) setDeleteTemplateData(null);
    }, [deleteTemplateData, remove]);

    const handleConfirmPublish = useCallback(async () => {
        if (!publishTemplateData) return;
        setIsPublishing(true);
        await publish(publishTemplateData);
        setIsPublishing(false);
        setPublishTemplateData(null);
    }, [publishTemplateData, publish]);

    const filterChips = useMemo(() => {
        const all = templates.length;
        return [
            { value: 'ALL', label: `All (${all})` },
            { value: 'APPROVED', label: `Approved (${statusCounts.APPROVED || 0})` },
            { value: 'PENDING', label: `Pending (${statusCounts.PENDING || 0})` },
            { value: 'REJECTED', label: `Rejected (${statusCounts.REJECTED || 0})` },
            { value: 'DRAFT', label: `Draft (${statusCounts.DRAFT || 0})` },
            { value: 'OTHERS', label: `Others (${statusCounts.OTHERS || 0})` },
        ];
    }, [templates.length, statusCounts]);


    const renderPreviewContent = () => {
        if (!validatedPreviewData) return null;

        return (
            <MessagePreview
                headerType={validatedPreviewData.headerType}
                headerText={validatedPreviewData.headerText}
                headerTextExample={validatedPreviewData.headerTextExample}
                headerMedia={validatedPreviewData.headerMedia}
                body={validatedPreviewData.body}
                footer={validatedPreviewData.footer}
                buttons={validatedPreviewData.buttons}
                templateType={validatedPreviewData.templateType}
                carouselCards={validatedPreviewData.carouselCards}
                variableValues={validatedPreviewData.variableValues}
                showEmptyHint={false}
            />
        );
    };

    return (
        <div className={styles.page}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <button className={styles.backBtn} onClick={() => router.push('/')}>
                        <ArrowLeft size={16} />
                    </button>
                    <div className={styles.headerIconWrap}>
                        <FileText size={18} />
                    </div>
                    <div>
                        <h2 className={styles.pageTitle}>Templates</h2>
                        <p className={styles.pageSubtitle}>
                            {templates.length} template{templates.length !== 1 ? 's' : ''} total
                        </p>
                    </div>
                </div>
                <div className={styles.topActions}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, v) => v && setViewMode(v)}
                        size="small"
                    >
                        <Tooltip title="Grid View" arrow>
                            <ToggleButton value="grid"><LayoutGrid size={16} /></ToggleButton>
                        </Tooltip>
                        <Tooltip title="List View" arrow>
                            <ToggleButton value="list"><List size={16} /></ToggleButton>
                        </Tooltip>
                    </ToggleButtonGroup>

                    <Button
                        variant="outlined"
                        startIcon={<RefreshCw size={15} />}
                        onClick={() => refresh()}
                        disabled={loading || syncLoading}
                        sx={{ textTransform: 'none', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.8rem' }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshCw size={15} />}
                        onClick={sync}
                        disabled={loading || syncLoading}
                        sx={{ textTransform: 'none', borderRadius: '10px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '0.8rem' }}
                    >
                        Sync
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Plus size={16} />}
                        onClick={() => router.push('/templates/create')}
                        sx={{
                            textTransform: 'none',
                            borderRadius: '10px',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            background: '#1daa61',
                            color: '#fff',
                            boxShadow: 'none',
                            '&:hover': { background: '#1a9a57', boxShadow: 'none' },
                        }}
                    >
                        Create Template
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <FilterBar
                search={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search templates..."
                sortBy={sortBy}
                onSortChange={setSortBy}
                filterChips={filterChips}
                activeFilter={filterStatus}
                onFilterChange={handleFilterChange}
            />

            {/* Content */}
            <div className={styles.contentArea}>
                {loading ? (
                    <TemplateSkelton count={8} />
                ) : filtered.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: '6rem', gap: '1.5rem' }}>
                        <Box sx={{
                            width: 64, height: 64, borderRadius: '18px',
                            background: 'linear-gradient(135deg, rgba(29,170,97,0.08), rgba(37,211,102,0.05))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(29,170,97,0.12)',
                        }}>
                            <FileText size={28} color="#1daa61" />
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#444050' }}>
                                {search ? 'No templates found' : 'No templates yet'}
                            </Typography>
                            <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.875rem', color: '#6D6B77', mt: '0.25rem' }}>
                                {search ? 'Try adjusting your search query' : 'Create your first WhatsApp message template to get started.'}
                            </Typography>
                        </Box>
                    </Box>
                ) : viewMode === 'grid' ? (
                    <TemplateCardGrid
                        items={paginated}
                        {...handlers}
                        count={filtered.length}
                        page={currentPage - 1}
                        rowsPerPage={itemsPerPage}
                        onPageChange={(_, p) => setCurrentPage(p + 1)}
                        onRowsPerPageChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    />
                ) : (
                    <TemplateTable
                        items={paginated}
                        {...handlers}
                        count={filtered.length}
                        page={currentPage - 1}
                        rowsPerPage={itemsPerPage}
                        onPageChange={(_, p) => setCurrentPage(p + 1)}
                        onRowsPerPageChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    />
                )}
            </div>

            {/* Preview Drawer */}
            <Drawer
                anchor="right"
                open={openPreview}
                onClose={() => setOpenPreview(false)}
                PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, background: '#f8fafc' } }}
            >
                <div className={styles.drawerRoot}>
                    <div className={styles.drawerHeader}>
                        <h3 className={styles.drawerTitle}>{previewTemplate?.TemplateName}</h3>
                        <button className={styles.drawerClose} onClick={() => setOpenPreview(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className={styles.drawerContent}>
                        {renderPreviewContent()}
                    </div>
                </div>
            </Drawer>

            {/* Send Dialog */}
            <SendTemplateDialog
                open={openSendDialog}
                onClose={() => setOpenSendDialog(false)}
                template={selectedTemplateForSend}
                userToken={userToken}
            />

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={!!deleteTemplateData}
                onClose={() => setDeleteTemplateData(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Template"
                description={`Are you sure you want to delete the template "${deleteTemplateData?.TemplateName}"? This action cannot be undone.`}
                isDanger
            />
            <ConfirmationModal
                isOpen={!!publishTemplateData}
                onClose={() => setPublishTemplateData(null)}
                onConfirm={handleConfirmPublish}
                title="Publish Template"
                description={`Are you sure you want to publish the template "${publishTemplateData?.TemplateName}"? This will submit it to WhatsApp for approval.`}
                isDanger={false}
                isLoading={isPublishing}
            />
            <ConfirmationModal
                isOpen={showInsufficientBalanceDialog}
                onClose={() => setShowInsufficientBalanceDialog(false)}
                onConfirm={() => setShowInsufficientBalanceDialog(false)}
                title="Insufficient Balance"
                description={`Your available balance is ₹${walletInfo?.availableBalance?.toLocaleString('en-IN') || 0}. You need at least ₹1 to send templates. Please recharge your wallet to continue.`}
                icon={AlertTriangle}
                isDanger={false}
                confirmLabel="OK"
                hideCancel
            />
        </div>
    );
};

export default TemplatesPage;
