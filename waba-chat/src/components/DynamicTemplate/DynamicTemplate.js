import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './DynamicTemplate.scss';
import { Skeleton, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight, ExternalLink, Phone, FileText, Play } from 'lucide-react';
import MediaViewer from '../MediaViewer/MediaViewer';

const DynamicTemplate = ({
    templateName = 'album',
    params = {},
    language = 'en',
    components = []
}) => {
    const [templateData, setTemplateData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
    const [mediaItems, setMediaItems] = useState([]);
    const [initialMediaIndex, setInitialMediaIndex] = useState(0);
    const token = JSON?.parse(sessionStorage.getItem('token')) || {};
    
    const API_BASE_URL = token?.isMeta == 1 ? process.env.REACT_APP_META_TEMP_BASE_URL : process.env.REACT_APP_MPL_TEMP_BASE_URL;

    useEffect(() => {
        const fetchTemplate = async () => {
            if (templateName) {
                setLoading(true);
                try {
                    const response = await axios.get(
                        `${API_BASE_URL}/${token?.whatsappPhoneNo}/message_templates?name=${templateName}`,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token?.whatsappKey
                            }
                        }
                    );

                    if (response.data?.data?.length > 0) {
                        setTemplateData(response.data.data[0]);
                    } else {
                        setError('Template not found');
                    }
                } catch (err) {
                    console.error('Error fetching template:', err);
                    setError('Failed to load template');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchTemplate();
    }, [templateName]);

    const carouselRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = (e) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.target;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const clientWidth = carouselRef.current.clientWidth;
            // Scroll by almost full width to show the next card clearly
            const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
            carouselRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Supported visual media formats for the viewer
    const MEDIA_FORMATS = ['IMAGE', 'VIDEO'];

    // Collect all media from template (header + carousel cards)
    const collectAllMedia = () => {
        if (!templateData) return [];

        const media = [];

        const getMediaUrl = (comp) => comp.example?.header_handle?.[0] || comp.example?.header_url?.[0];

        // Collect header media
        const headerComp = templateData.components?.find(c => c.type === 'HEADER' && MEDIA_FORMATS.includes(c.format));
        if (headerComp) {
            const url = getMediaUrl(headerComp);
            if (url) media.push({ url, type: headerComp.format.toLowerCase() });
        }

        // Collect carousel media
        const carouselComp = templateData.components?.find(c => c.type === 'CAROUSEL');
        if (carouselComp?.cards) {
            carouselComp.cards.forEach(card => {
                const cardHeader = card.components?.find(c => c.type === 'HEADER' && MEDIA_FORMATS.includes(c.format));
                if (cardHeader) {
                    const url = getMediaUrl(cardHeader);
                    if (url) media.push({ url, type: cardHeader.format.toLowerCase() });
                }
            });
        }

        return media;
    };

    // Handle media click to open MediaViewer
    const handleMediaClick = (mediaUrl, mediaType = 'image') => {
        const allMedia = collectAllMedia();
        const items = allMedia.map((m, idx) => ({
            src: m.url,
            name: `Template ${m.type.charAt(0).toUpperCase() + m.type.slice(1)} ${idx + 1}`,
            type: m.type
        }));

        const clickedIndex = allMedia.findIndex(m => m.url === mediaUrl);
        setMediaItems(items);
        setInitialMediaIndex(clickedIndex >= 0 ? clickedIndex : 0);
        setMediaViewerOpen(true);
    };

    const renderTemplateComponent = (component, isCarouselCard = false) => {
        if (!component) return null;

        switch (component.type) {
            case 'HEADER': {
                const mediaUrl = component.example?.header_handle?.[0] || component.example?.header_url?.[0];

                if (component.format === 'IMAGE') {
                    return (
                        <div
                            className="template-header image"
                            onClick={() => mediaUrl && handleMediaClick(mediaUrl, 'image')}
                            style={{ cursor: mediaUrl ? 'pointer' : 'default' }}
                        >
                            {mediaUrl ? (
                                <img src={mediaUrl} alt="Header" className="header-image" />
                            ) : (
                                <Skeleton variant="rectangular" width="100%" height={200} />
                            )}
                        </div>
                    );
                }

                if (component.format === 'VIDEO') {
                    return (
                        <div
                            className="template-header video"
                            onClick={() => mediaUrl && handleMediaClick(mediaUrl, 'video')}
                            style={{ cursor: mediaUrl ? 'pointer' : 'default' }}
                        >
                            {mediaUrl ? (
                                <div className="video-wrapper">
                                    <video src={mediaUrl} className="header-video" preload="metadata" />
                                    <div className="video-overlay">
                                        <Play size={40} className="play-icon" />
                                    </div>
                                </div>
                            ) : (
                                <Skeleton variant="rectangular" width="100%" height={200} />
                            )}
                        </div>
                    );
                }

                if (component.format === 'DOCUMENT') {
                    return (
                        <div className="template-header document">
                            {mediaUrl ? (
                                <a
                                    href={mediaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="document-link"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <FileText size={32} className="document-icon" />
                                    <span className="document-label">View Document</span>
                                </a>
                            ) : (
                                <Skeleton variant="rectangular" width="100%" height={100} />
                            )}
                        </div>
                    );
                }

                if (component.format === 'LOCATION') {
                    return (
                        <div className="template-header location">
                            <span className="location-label">📍 Location</span>
                        </div>
                    );
                }

                return component.text ? <div className="template-header text">{component.text}</div> : null;
            }

            case 'BODY':
                let bodyText = component.text || '';
                // Replace placeholders with params if not in a carousel card (params usually apply to main body)
                if (!isCarouselCard) {
                    Object.entries(params).forEach(([key, value], index) => {
                        const placeholder = new RegExp(`\\{\\{\\s*${index + 1}\\s*\\}\\}`, 'g');
                        bodyText = bodyText.replace(placeholder, value || '');
                    });
                }

                return (
                    <div className="template-body">
                        {bodyText.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                );

            case 'FOOTER':
                return (
                    <div className="template-footer">
                        {component.text}
                    </div>
                );

            case 'BUTTONS':
                return (
                    <div className="template-buttons">
                        {component.buttons?.map((button, i) => {
                            const isUrl = button.type === 'URL';
                            const isCall = button.type === 'PHONE_NUMBER';
                            const isQuickReply = button.type === 'QUICK_REPLY';

                            return (
                                <button
                                    key={i}
                                    className={`template-button ${button.type?.toLowerCase() || ''}`}
                                    onClick={() => {
                                        if (isUrl && button.url) window.open(button.url, '_blank');
                                        if (isCall && button.phone_number) window.location.href = `tel:${button.phone_number}`;
                                    }}
                                >
                                    {isUrl && <ExternalLink size={16} className="button-icon" />}
                                    {isCall && <Phone size={16} className="button-icon" />}
                                    {button.text}
                                </button>
                            );
                        })}
                    </div>
                );

            case 'CAROUSEL':
                return (
                    <div className="template-carousel-wrapper">
                        {showLeftArrow && (
                            <IconButton 
                                className="carousel-nav-btn left" 
                                onClick={() => scrollCarousel('left')}
                                size="small"
                            >
                                <ChevronLeft size={20} />
                            </IconButton>
                        )}
                        
                        <div 
                            className="template-carousel" 
                            ref={carouselRef}
                            onScroll={handleScroll}
                        >
                            <div className="carousel-container">
                                {component.cards?.map((card, cardIndex) => (
                                    <div key={cardIndex} className="carousel-card">
                                        {card.components?.map((cardComp, compIndex) => {
                                            // Make carousel card media clickable
                                            if (cardComp.type === 'HEADER' && MEDIA_FORMATS.includes(cardComp.format)) {
                                                const mediaUrl = cardComp.example?.header_handle?.[0] || cardComp.example?.header_url?.[0];
                                                return (
                                                    <div
                                                        key={compIndex}
                                                        className="card-component-wrapper"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (mediaUrl) handleMediaClick(mediaUrl, cardComp.format.toLowerCase());
                                                        }}
                                                        style={{ cursor: mediaUrl ? 'pointer' : 'default' }}
                                                    >
                                                        {renderTemplateComponent(cardComp, true)}
                                                    </div>
                                                );
                                            }
                                            
                                            return (
                                                <div key={compIndex} className="card-component-wrapper">
                                                    {renderTemplateComponent(cardComp, true)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {showRightArrow && component.cards?.length > 1 && (
                            <IconButton 
                                className="carousel-nav-btn right" 
                                onClick={() => scrollCarousel('right')}
                                size="small"
                            >
                                <ChevronRight size={20} />
                            </IconButton>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return <div className="loading">
            <Skeleton
                variant="rounded"
                className="media-skeleton"
                sx={{
                    width: "350px",
                    height: "220px",
                }}
            />
        </div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!templateData) {
        return null;
    }

    return (
        <>
            <div className="whatsapp-template">
                {templateData.components?.map((component, index) => (
                    <div key={`${component.type}-${index}`}>
                        {renderTemplateComponent(component)}
                    </div>
                ))}
            </div>
            
            {/* MediaViewer for template images */}
            {mediaViewerOpen && (
                <MediaViewer
                    mediaItems={mediaItems}
                    initialIndex={initialMediaIndex}
                    onClose={() => setMediaViewerOpen(false)}
                />
            )}
        </>
    );
};

export default DynamicTemplate;