'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ArrowLeft, Users, Phone, MoreVertical, CheckCheck, ChevronLeft, ChevronRight, FileText, Image, Video, ExternalLink, PhoneCall, Reply } from 'lucide-react';
import styles from './MessagePreview.module.scss';
import { isOwnServerUrl } from '../../../utils/mediaUtils';
import imagePlaceholder from '../../../assests/imagePlaceholder.png';

const MessagePreview = ({
    headerType = 'None',
    headerText = '',
    headerTextExample = '',
    headerMedia = null,
    previewImageUrl = '',
    previewVideoUrl = '',
    body = '',
    footer = '',
    buttons = [],
    templateType = 'Interactive',
    carouselCards = [],
    variableValues = {},
    showEmptyHint = true
}) => {
    const currentPreviewTime = useMemo(
        () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        []
    );

    const [previewCardIndex, setPreviewCardIndex] = useState(0);
    const [videoError, setVideoError] = useState(false);

    useEffect(() => {
        setVideoError(false);
    }, [previewVideoUrl, headerMedia?.mediaUrl]);

    // Safe background style — computed inside component to avoid window at module level
    const chatBgStyle = useMemo(() => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return {
            backgroundImage: `linear-gradient(rgba(249, 250, 251, 0.30), rgba(249, 250, 251, 0.80)), url(${baseUrl}/assests/images/bg-3.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        };
    }, []);

    const handleImageFallback = (event) => {
        const img = event?.currentTarget;
        if (!img) return;
        img.onerror = null;
        img.src = imagePlaceholder;
    };

    const handleVideoError = () => {
        setVideoError(true);
    };

    const previewBody = useMemo(() =>
        (body || '').replace(/\{\{(\d+)\}\}/g, (_, k) => {
            const value = variableValues[k]?.trim();
            if (value) {
                return `<span style="color: #000; font-weight: 600; background: rgba(0, 0, 0, 0.05); padding: 0 2px; border-radius: 2px;">${value}</span>`;
            }
            return `{{${k}}}`;
        }), [body, variableValues]);

    const finalPreviewImageUrl = previewImageUrl || (headerType === 'Media' && headerMedia?.mediaType === 'image' ? (headerMedia.file ? URL.createObjectURL(headerMedia.file) : (headerMedia.mediaUrl && isOwnServerUrl(headerMedia.mediaUrl) ? headerMedia.mediaUrl : imagePlaceholder)) : '');
    const finalPreviewVideoUrl = previewVideoUrl || (headerType === 'Media' && headerMedia?.mediaType === 'video' ? (headerMedia.file ? URL.createObjectURL(headerMedia.file) : (headerMedia.mediaUrl || '')) : '');
    const previewDocumentLabel = useMemo(() => {
        if (headerType !== 'Media' || headerMedia?.mediaType !== 'document') return '';
        if (headerMedia?.file?.name) return headerMedia.file.name;
        if (headerMedia?.mediaUrl?.trim()) {
            try {
                const u = new URL(headerMedia.mediaUrl.trim());
                return u.pathname.split('/').filter(Boolean).pop() || u.hostname;
            } catch { return headerMedia.mediaUrl.trim(); }
        }
        return '';
    }, [headerType, headerMedia]);

    const hasPreviewMessage =
        Boolean(previewImageUrl) || Boolean(previewVideoUrl) || Boolean(previewDocumentLabel) ||
        Boolean(headerType === 'Text' && headerText?.trim()) ||
        Boolean(previewBody.trim()) || Boolean(footer?.trim()) ||
        buttons.length > 0 ||
        (templateType === 'Carousel' && carouselCards.length > 0);

    return (
        <Box className={styles.previewShell}>
            <Box className={styles.previewPhone}>
                <Box className={styles.previewChatHeader}>
                    <ArrowLeft size={16} className={styles.headerIcon} />
                    <Box className={styles.chatAvatar}><Users size={14} /></Box>
                    <Box className={styles.chatMeta}>
                        <Typography component="span" className={styles.chatName}>Business</Typography>
                        <Typography component="span" className={styles.chatStatus}>online</Typography>
                    </Box>
                    <Box className={styles.headerActions}>
                        <Phone size={15} className={styles.headerIcon} />
                        <MoreVertical size={15} className={styles.headerIcon} />
                    </Box>
                </Box>
                <Box className={styles.previewChatBg} sx={chatBgStyle}>
                    {hasPreviewMessage ? (
                        <Box className={`${styles.previewBubbleWrap} ${templateType === 'Carousel' ? styles.previewBubbleWrapCarousel : ''}`}>
                            {templateType === 'Carousel' ? (
                                <Box className={styles.previewCarouselWrap}>
                                    {/* Top level body for carousel */}
                                    {previewBody.trim() && (
                                        <Box className={styles.previewBubble}>
                                            <Typography
                                                className={styles.previewBodyText}
                                                dangerouslySetInnerHTML={{ __html: previewBody }}
                                            />
                                            <Box className={styles.previewMeta}>
                                                <Typography className={styles.previewTime}>{currentPreviewTime}</Typography>
                                                <CheckCheck size={12} className={styles.previewTick} />
                                            </Box>
                                        </Box>
                                    )}
                                    {/* Horizontal Cards */}
                                    <Box className={styles.previewCarouselContainer}>
                                        {previewCardIndex > 0 && (
                                            <IconButton
                                                className={styles.carouselNavBtnLeft}
                                                onClick={() => setPreviewCardIndex(p => Math.max(0, p - 1))}
                                                size="small"
                                            >
                                                <ChevronLeft size={16} />
                                            </IconButton>
                                        )}

                                        <Box className={styles.previewCardSlider} sx={{ transform: `translateX(-${previewCardIndex * 100}%)` }}>
                                            {carouselCards.map((card, idx) => (
                                                <Box key={card.id || idx} className={styles.previewCardUnit}>
                                                    <Box className={styles.previewCard}>
                                                        {(card.header.file || card.header.mediaUrl || card.header.existingHandle) ? (
                                                            card.header.mediaType === 'image' ? (
                                                                <Box
                                                                    component="img"
                                                                    src={card.header.file ? URL.createObjectURL(card.header.file) : ((card.header.mediaUrl && isOwnServerUrl(card.header.mediaUrl)) ? card.header.mediaUrl : imagePlaceholder)}
                                                                    alt="card"
                                                                    className={styles.previewCardMedia}
                                                                    onError={handleImageFallback}
                                                                />
                                                            ) : card.header.mediaType === 'video' ? (
                                                                <Box
                                                                    component="video"
                                                                    src={card.header.file ? URL.createObjectURL(card.header.file) : (card.header.mediaUrl || '')}
                                                                    className={styles.previewCardMedia}
                                                                    controls
                                                                    playsInline
                                                                    preload="metadata"
                                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                />
                                                            ) : (
                                                                <Box className={styles.previewCardMedia} sx={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Video size={24} color="#fff" />
                                                                </Box>
                                                            )
                                                        ) : (
                                                            <Box className={styles.previewCardMedia} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                                                {card.header.mediaType === 'image' ? <Image size={24} /> : <Video size={24} />}
                                                            </Box>
                                                        )}

                                                        <Box className={styles.previewCardContent}>
                                                            {card.body && <Typography className={styles.previewCardBody}>{card.body}</Typography>}
                                                        </Box>

                                                        <Box className={styles.previewCardButtons}>
                                                            {card.buttons.map((btn, bIdx) => (
                                                                <Box key={btn.id || bIdx} className={styles.previewCardBtn}>
                                                                    {btn.type === 'URL' && <ExternalLink size={13} className={styles.previewCardBtnIcon} />}
                                                                    {btn.type === 'PHONE_NUMBER' && <PhoneCall size={13} className={styles.previewCardBtnIcon} />}
                                                                    {btn.type === 'QUICK_REPLY' && <Reply size={13} className={styles.previewCardBtnIcon} />}
                                                                    <Typography component="span" className={styles.previewCardBtnText}>{btn.text || btn.label || 'Button'}</Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>

                                        {previewCardIndex < carouselCards.length - 1 && (
                                            <IconButton
                                                className={styles.carouselNavBtnRight}
                                                onClick={() => setPreviewCardIndex(p => Math.min(carouselCards.length - 1, p + 1))}
                                                size="small"
                                            >
                                                <ChevronRight size={16} />
                                            </IconButton>
                                        )}
                                    </Box>
                                    <Box className={styles.carouselDotRow}>
                                        {carouselCards.map((_, dotIdx) => (
                                            <Box
                                                key={dotIdx}
                                                className={`${styles.carouselDot} ${previewCardIndex === dotIdx ? styles.carouselDotActive : ''}`}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            ) : (
                                <Box className={styles.previewBubble}>
                                    {headerType === 'Text' && headerText && (
                                        <Typography className={styles.previewHeaderText}>
                                            {headerText.replace(/\{\{1\}\}/g, headerTextExample || '{{1}}')}
                                        </Typography>
                                    )}
                                    {finalPreviewImageUrl && (
                                        <Box
                                            component="img"
                                            src={finalPreviewImageUrl}
                                            alt="Header"
                                            className={styles.previewHeaderImage}
                                            onError={handleImageFallback}
                                        />
                                    )}
                                    {(finalPreviewVideoUrl && !videoError && !headerMedia?.isInvalid) ? (
                                        <Box
                                            component="video"
                                            key={finalPreviewVideoUrl}
                                            src={finalPreviewVideoUrl}
                                            className={styles.previewHeaderVideo}
                                            controls playsInline preload="metadata"
                                            onError={handleVideoError}
                                        />
                                    ) : (headerType === 'Media' && headerMedia?.mediaType === 'video' && (videoError || headerMedia?.isInvalid)) ? (
                                        <Box className={styles.previewVideoFallback}>
                                            <Video size={32} color="#94a3b8" />
                                            <Typography component="span">Video unavailable</Typography>
                                        </Box>
                                    ) : null}
                                    {previewDocumentLabel && (
                                        <Box className={styles.previewHeaderDocument}>
                                            <Box className={styles.previewDocIconWrap}>
                                                <FileText size={18} className={styles.previewDocIcon} />
                                            </Box>
                                            <Box className={styles.previewDocMeta}>
                                                <Typography component="span" className={styles.previewDocTitle}>Document</Typography>
                                                <Typography component="span" className={styles.previewDocSub}>{previewDocumentLabel}</Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    {previewBody.trim() && (
                                        <Typography 
                                            className={styles.previewBodyText}
                                            dangerouslySetInnerHTML={{ __html: previewBody }}
                                        />
                                    )}
                                    {footer && (
                                        <Typography className={styles.previewFooterText}>{footer}</Typography>
                                    )}
                                    {buttons.length > 0 && (
                                        <Box className={styles.previewButtons}>
                                            {(() => {
                                                const quickReplyButtons = buttons.filter(btn => btn.type === 'QUICK_REPLY');
                                                const ctaButtons = buttons.filter(btn => btn.type !== 'QUICK_REPLY');
                                                const visibleQuickReplies = quickReplyButtons.slice(0, 2);
                                                const hiddenQuickReplyCount = quickReplyButtons.length - 2;

                                                return (
                                                    <>
                                                        {ctaButtons.map((btn) => (
                                                            <Box key={btn.id} component="button" type="button" className={styles.previewActionBtn}>
                                                                {btn.type === 'URL' && <ExternalLink size={13} className={styles.previewBtnIcon} />}
                                                                {btn.type === 'PHONE_NUMBER' && <PhoneCall size={13} className={styles.previewBtnIcon} />}
                                                                <Typography component="span">{btn.text || btn.label || 'Button'}</Typography>
                                                            </Box>
                                                        ))}
                                                        {visibleQuickReplies.map((btn) => (
                                                            <Box key={btn.id} component="button" type="button" className={styles.previewActionBtn}>
                                                                <Reply size={13} className={styles.previewBtnIcon} />
                                                                <Typography component="span">{btn.text || btn.label || 'Button'}</Typography>
                                                            </Box>
                                                        ))}
                                                        {hiddenQuickReplyCount > 0 && (
                                                            <Box component="button" type="button" className={styles.previewActionBtn}>
                                                                <Typography component="span">+{hiddenQuickReplyCount} more</Typography>
                                                            </Box>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </Box>
                                    )}
                                    <Box className={styles.previewMeta}>
                                        <Typography className={styles.previewTime}>{currentPreviewTime}</Typography>
                                        <CheckCheck size={12} className={styles.previewTick} />
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        showEmptyHint && (
                            <Box className={styles.previewEmptyHint}>
                                <Typography>Preview will appear here</Typography>
                            </Box>
                        )
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default React.memo(MessagePreview);
