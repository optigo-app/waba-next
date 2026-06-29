import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  useTheme,
  CircularProgress,
  Slide,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  MusicNote as MusicNoteIcon,
  AudioFile as AudioFileIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, Thumbs, Zoom } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';
import 'swiper/css/thumbs';

// Import preview components
import ExcelPreview from '../ExcelPreview/ExcelPreview';
import WordPreview from '../WordPreview/WordPreview';

import './MediaViewer.scss';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Helper to deduce file type from extension if not provided
const getMediaType = (item) => {
  if (item.type) return item.type;
  const ext = item.name?.split('.').pop()?.toLowerCase();
  
  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  
  // Videos
  if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  
  // Audio
  if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'wma'].includes(ext)) return 'audio';
  
  // PDF
  if (ext === 'pdf') return 'pdf';
  
  // Excel
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  
  // Word
  if (['doc', 'docx'].includes(ext)) return 'word';
  
  // Other documents
  if (['txt', 'rtf'].includes(ext)) return 'document';
  
  return 'unknown';
};

const MediaViewer = ({ mediaItems = [], initialIndex = 0, onClose }) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideTo(initialIndex, 0);
    }
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleDownload = (e) => {
    e.stopPropagation();
    const currentMedia = mediaItems[currentIndex];
    if (currentMedia?.src) {
      const link = document.createElement('a');
      link.href = currentMedia.src;
      link.download = currentMedia.name || `media-${currentIndex}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClose = () => {
    onClose && onClose();
  };

  // Renderers
  const renderImage = (item) => (
    <div className="swiper-zoom-container">
      <img src={item.src} alt={item.name} loading="lazy" />
    </div>
  );

  const VideoRenderer = ({ item, isActive }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      // Auto-pause when slide is not active
      if (!isActive && videoRef.current) {
        videoRef.current.pause();
      }
    }, [isActive]);

    return (
      <div className="video-container">
        <video
          ref={videoRef}
          src={item.src}
          controls
          className="media-video"
        // ResizeObserver loop limit fix strategy: 
        // Avoid 100% height on fluid containers if it causes layout thrashing
        />
      </div>
    );
  };

  // Audio Renderer
  const AudioRenderer = ({ item }) => {
    const audioRef = useRef(null);

    return (
      <Box className="audio-container">
        <Box className="audio-card">
          <MusicNoteIcon sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 2 }} />
          <Typography variant="h6" className="audio-name">{item.name}</Typography>
          {item.size && <Typography variant="body2" color="textSecondary">{item.size}</Typography>}
          
          <Box mt={3} width="100%" display="flex" justifyContent="center">
            <audio
              ref={audioRef}
              src={item.src}
              controls
              style={{ width: '100%', maxWidth: 400 }}
            />
          </Box>

          <Box mt={2}>
            <IconButton
              onClick={handleDownload}
              sx={{ bgcolor: theme.palette.primary.main, color: '#fff', '&:hover': { bgcolor: theme.palette.primary.dark } }}
            >
              <DownloadIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    );
  };

  // PDF Renderer
  const PDFRenderer = ({ item }) => {
    const [error, setError] = useState(false);

    return (
      <Box className="pdf-container">
        {error ? (
          <Box className="pdf-error-card">
            <PdfIcon sx={{ fontSize: 80, color: '#F40F02', mb: 2 }} />
            <Typography variant="h6" className="pdf-name">{item.name}</Typography>
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              Unable to preview PDF. Please download to view.
            </Alert>
            <IconButton
              onClick={handleDownload}
              sx={{ bgcolor: theme.palette.primary.main, color: '#fff', '&:hover': { bgcolor: theme.palette.primary.dark } }}
            >
              <DownloadIcon />
            </IconButton>
          </Box>
        ) : (
          <iframe
            src={item.src}
            title={item.name}
            onError={() => setError(true)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              minHeight: '80vh'
            }}
          />
        )}
      </Box>
    );
  };

  // Excel Renderer
  const ExcelRenderer = ({ item }) => {
    const [fileObject, setFileObject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchFile = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch(item.src);
          const blob = await response.blob();
          const file = new File([blob], item.name, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          setFileObject(file);
        } catch (err) {
          console.error('Error loading Excel file:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchFile();
    }, [item.src, item.name]);

    if (loading) {
      return (
        <Box className="excel-container" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box className="excel-error-card">
          <TableChartIcon sx={{ fontSize: 80, color: '#217346', mb: 2 }} />
          <Typography variant="h6">{item.name}</Typography>
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            Error loading Excel file: {error}
          </Alert>
          <IconButton
            onClick={handleDownload}
            sx={{ bgcolor: theme.palette.primary.main, color: '#fff', '&:hover': { bgcolor: theme.palette.primary.dark } }}
          >
            <DownloadIcon />
          </IconButton>
        </Box>
      );
    }

    return (
      <Box className="excel-container">
        {fileObject && <ExcelPreview fileObject={fileObject} />}
      </Box>
    );
  };

  // Word Renderer
  const WordRenderer = ({ item }) => {
    const [fileObject, setFileObject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchFile = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch(item.src);
          const blob = await response.blob();
          const file = new File([blob], item.name, {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
          setFileObject(file);
        } catch (err) {
          console.error('Error loading Word file:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchFile();
    }, [item.src, item.name]);

    if (loading) {
      return (
        <Box className="word-container" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box className="word-error-card">
          <DescriptionIcon sx={{ fontSize: 80, color: '#2B579A', mb: 2 }} />
          <Typography variant="h6">{item.name}</Typography>
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            Error loading Word file: {error}
          </Alert>
          <IconButton
            onClick={handleDownload}
            sx={{ bgcolor: theme.palette.primary.main, color: '#fff', '&:hover': { bgcolor: theme.palette.primary.dark } }}
          >
            <DownloadIcon />
          </IconButton>
        </Box>
      );
    }

    return (
      <Box className="word-container">
        {fileObject && <WordPreview fileObject={fileObject} />}
      </Box>
    );
  };

  const renderDocument = (item) => {
    const ext = item.name?.split('.').pop()?.toLowerCase();
    let Icon = FileIcon;
    let color = theme.palette.text.secondary;

    if (ext === 'pdf') {
      Icon = PdfIcon;
      color = '#F40F02';
    } else if (['doc', 'docx'].includes(ext)) {
      Icon = DescriptionIcon;
      color = '#2B579A';
    } else if (['xls', 'xlsx'].includes(ext)) {
      Icon = TableChartIcon;
      color = '#217346';
    }

    return (
      <Box className="document-preview-card">
        <Icon sx={{ fontSize: 80, color, mb: 2 }} />
        <Typography variant="h6" className="doc-name">{item.name}</Typography>
        {item.size && <Typography variant="body2" color="textSecondary">{item.size}</Typography>}

        <Box mt={3}>
          <IconButton
            onClick={handleDownload}
            sx={{ bgcolor: theme.palette.primary.main, color: '#fff', '&:hover': { bgcolor: theme.palette.primary.dark } }}
          >
            <DownloadIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };

  if (!mediaItems || mediaItems.length === 0) return null;

  return (
    <Dialog
      fullScreen
      open={true}
      onClose={handleClose}
      TransitionComponent={Transition}
      className="media-viewer-dialog"
    >
      <AppBar position="fixed" className="media-viewer-appbar">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div" noWrap>
            {mediaItems[currentIndex]?.name || `Media ${currentIndex + 1} of ${mediaItems.length}`}
          </Typography>
          <IconButton color="inherit" onClick={handleDownload}>
            <DownloadIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box className="media-viewer-content">
        {mediaItems.length === 1 ? (
          // Single Item View - No Swiper
          <Box className="media-slide-content single-view">
          {(() => {
            const item = mediaItems[0];
            const type = getMediaType(item);
            if (type === 'image') return <img src={item.src} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />;
            if (type === 'video') return <VideoRenderer item={item} isActive={true} />;
            if (type === 'audio') return <AudioRenderer item={item} />;
            if (type === 'pdf') return <PDFRenderer item={item} />;
            if (type === 'excel') return <ExcelRenderer item={item} />;
            if (type === 'word') return <WordRenderer item={item} />;
            if (type === 'document') return renderDocument(item);
            return null;
          })()}
        </Box>
        ) : (
          // Multi Item View - With Swiper
          <>
            <Swiper
              ref={swiperRef}
              modules={[Navigation, Pagination, Keyboard, Thumbs, Zoom]}
              initialSlide={initialIndex}
              spaceBetween={30}
              slidesPerView={1}
              navigation={{
                prevEl: '.custom-prev',
                nextEl: '.custom-next'
              }}
              pagination={{ clickable: true, dynamicBullets: true }}
              keyboard={{ enabled: true }}
              zoom={true}
              thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
              onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
              className="main-swiper"
            >
              {mediaItems.map((item, index) => {
                const type = getMediaType(item);
                return (
                  <SwiperSlide key={index}>
                    {({ isActive }) => (
                      <Box className="media-slide-content">
                        {type === 'image' && renderImage(item)}
                        {type === 'video' && <VideoRenderer item={item} isActive={isActive} />}
                        {type === 'audio' && <AudioRenderer item={item} />}
                        {type === 'pdf' && <PDFRenderer item={item} />}
                        {type === 'excel' && <ExcelRenderer item={item} />}
                        {type === 'word' && <WordRenderer item={item} />}
                        {type === 'document' && renderDocument(item)}
                        {type === 'unknown' && (
                          <Box display="flex" flexDirection="column" alignItems="center">
                            <Typography variant="h5" color="error">Unsupported Media Type</Typography>
                            <Typography>{item.name}</Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* Custom Navigation Helper */}
            <div className="custom-prev swiper-nav-btn"><ChevronLeftIcon fontSize="large" /></div>
            <div className="custom-next swiper-nav-btn"><ChevronRightIcon fontSize="large" /></div>
          </>
        )}
      </Box>

      {/* Thumbnails Strip */}
      {mediaItems.length > 1 && (
        <Box className="thumbnails-container">
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={10}
            slidesPerView={'auto'}
            freeMode={true}
            watchSlidesProgress={true}
            modules={[Thumbs, Navigation]}
            className="thumbs-swiper"
          >
            {mediaItems.map((item, idx) => {
              const type = getMediaType(item);
              return (
                <SwiperSlide key={idx} className="thumb-slide">
                  {type === 'image' ? (
                    <img src={item.src} alt="thumb" />
                  ) : (
                    <Box className={`thumb-placeholder ${type}`}>
                      {type === 'video' && '🎬'}
                      {type === 'audio' && '🎵'}
                      {type === 'pdf' && '📕'}
                      {type === 'excel' && '📊'}
                      {type === 'word' && '📄'}
                      {type === 'document' && '📄'}
                    </Box>
                  )}
                </SwiperSlide>
              )
            })}
          </Swiper>
        </Box>
      )}
    </Dialog>
  );
};

export default MediaViewer;