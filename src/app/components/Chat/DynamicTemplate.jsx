'use client';

import { useState, useEffect, useRef } from 'react';
import { getTemplateBaseUrl } from '../../api/Config';
import MediaViewer from './MediaViewer';
import { Skeleton } from '@mui/material';
import {
  ChevronLeft, ChevronRight, ExternalLink, Phone, FileText, Play,
} from 'lucide-react';

const MEDIA_FORMATS = ['IMAGE', 'VIDEO'];

export default function DynamicTemplate({
  templateName = '',
  params = {},
  language = 'en',
  components = [],
}) {
  const [templateData, setTemplateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [initialMediaIndex, setInitialMediaIndex] = useState(0);

  const token = typeof window !== 'undefined'
    ? JSON.parse(sessionStorage.getItem('token') || '{}')
    : {};

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateName || !token?.whatsappPhoneNo) return;
      setLoading(true);
      setError(null);
      try {
        const baseUrl = getTemplateBaseUrl(token?.isMeta);
        const url = `${baseUrl}/${token.whatsappPhoneNo}/message_templates?name=${encodeURIComponent(templateName)}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token?.whatsappKey || ''}`,
          },
        });
        if (!response.ok) {
          setError('Failed to load template');
          return;
        }
        const data = await response.json();
        if (data?.data?.length > 0) {
          setTemplateData(data.data[0]);
        } else {
          setError('Template not found');
        }
      } catch (err) {
        console.error('Template fetch error:', err);
        setError('Failed to load template');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [templateName, token?.whatsappPhoneNo, token?.whatsappKey]);

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
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getMediaUrl = (comp) =>
    comp.example?.header_handle?.[0] || comp.example?.header_url?.[0];

  const collectAllMedia = () => {
    if (!templateData) return [];
    const media = [];
    const headerComp = templateData.components?.find(
      (c) => c.type === 'HEADER' && MEDIA_FORMATS.includes(c.format)
    );
    if (headerComp) {
      const url = getMediaUrl(headerComp);
      if (url) media.push({ url, type: headerComp.format.toLowerCase() });
    }
    const carouselComp = templateData.components?.find((c) => c.type === 'CAROUSEL');
    if (carouselComp?.cards) {
      carouselComp.cards.forEach((card) => {
        const cardHeader = card.components?.find(
          (c) => c.type === 'HEADER' && MEDIA_FORMATS.includes(c.format)
        );
        if (cardHeader) {
          const url = getMediaUrl(cardHeader);
          if (url) media.push({ url, type: cardHeader.format.toLowerCase() });
        }
      });
    }
    return media;
  };

  const handleMediaClick = (mediaUrl, mediaType = 'image') => {
    const allMedia = collectAllMedia();
    const items = allMedia.map((m, idx) => ({
      src: m.url,
      name: `Template ${m.type.charAt(0).toUpperCase() + m.type.slice(1)} ${idx + 1}`,
      type: m.type,
    }));
    const clickedIndex = allMedia.findIndex((m) => m.url === mediaUrl);
    setMediaItems(items);
    setInitialMediaIndex(clickedIndex >= 0 ? clickedIndex : 0);
    setMediaViewerOpen(true);
  };

  const renderText = (text = '', isCarouselCard = false) => {
    if (!isCarouselCard) {
      Object.entries(params).forEach(([key, value], index) => {
        const placeholder = new RegExp(`\\{\\{\\s*${index + 1}\\s*\\}\\}`, 'g');
        text = text.replace(placeholder, value || '');
      });
    }
    return text;
  };

  const renderComponent = (component, isCarouselCard = false) => {
    if (!component) return null;

    switch (component.type) {
      case 'HEADER': {
        const mediaUrl = getMediaUrl(component);

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
              <span className="location-label">Location</span>
            </div>
          );
        }

        return component.text ? (
          <div className="template-header text">{renderText(component.text, isCarouselCard)}</div>
        ) : null;
      }

      case 'BODY': {
        let bodyText = renderText(component.text || '', isCarouselCard);
        return (
          <div className="template-body">
            {bodyText.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        );
      }

      case 'FOOTER':
        return <div className="template-footer">{component.text}</div>;

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
              <button
                className="carousel-nav-btn left"
                onClick={() => scrollCarousel('left')}
                type="button"
              >
                <ChevronLeft size={20} />
              </button>
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
                      if (cardComp.type === 'HEADER' && MEDIA_FORMATS.includes(cardComp.format)) {
                        const cMediaUrl = getMediaUrl(cardComp);
                        return (
                          <div
                            key={compIndex}
                            className="card-component-wrapper"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (cMediaUrl) handleMediaClick(cMediaUrl, cardComp.format.toLowerCase());
                            }}
                            style={{ cursor: cMediaUrl ? 'pointer' : 'default' }}
                          >
                            {renderComponent(cardComp, true)}
                          </div>
                        );
                      }
                      return (
                        <div key={compIndex} className="card-component-wrapper">
                          {renderComponent(cardComp, true)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {showRightArrow && component.cards?.length > 1 && (
              <button
                className="carousel-nav-btn right"
                onClick={() => scrollCarousel('right')}
                type="button"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="whatsapp-template-skeleton">
        <Skeleton
          variant="rounded"
          sx={{ width: 380, height: 180, borderRadius: '12px' }}
        />
      </div>
    );
  }

  if (error) {
    return <div className="whatsapp-template-error">{error}</div>;
  }

  if (!templateData) {
    return null;
  }

  return (
    <>
      <div className="whatsapp-template">
        {templateData.components?.map((component, index) => (
          <div key={`${component.type}-${index}`}>
            {renderComponent(component)}
          </div>
        ))}
      </div>

      {mediaViewerOpen && (
        <MediaViewer
          mediaItems={mediaItems}
          initialIndex={initialMediaIndex}
          onClose={() => setMediaViewerOpen(false)}
        />
      )}
    </>
  );
}
