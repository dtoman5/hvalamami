// Updated PostReview.js with compression, unload warning, and upload notification
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-toastify';
import { useUploadStore } from '@/store/uploadStore';
import { processUpload } from '@/lib/processUpload';
import { compressImage } from '@/lib/compressImage';

const MAX_FILE_SIZE_MB = 50;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_VIDEO_DURATION = 60;

export default function PostReview({ isOpen, onClose, post, categories }) {
  const supabase = createClientComponentClient();
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [file, setFile] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [validImageUrl, setValidImageUrl] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [isStory, setIsStory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { setUploadInProgress, setUploadMessage } = useUploadStore();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: prof } = await supabase
          .from('profiles')
          .select('username, profile_picture_url')
          .eq('id', user.id)
          .single();
        setProfile(prof);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (post) {
      setTextContent(post.content || '');
      setSelectedRating(post.rating?.toString() || '');
      setSelectedCategory(post.category_id || '');
      setExternalUrl(post.external_url || '');
      setIsStory(post.is_story || false);

      const image = post.images?.[0]?.file_url;
      const video = post.videos?.[0]?.file_url;

      if (image) {
        setPreviewMedia(image);
        setMediaType('image');
      } else if (video) {
        setPreviewMedia(video);
        setMediaType('video');
      }
    } else {
      resetForm();
    }
  }, [post]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isLoading) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLoading]);

  const resetForm = () => {
    setTextContent('');
    setSelectedCategory('');
    setSelectedRating('');
    setExternalUrl('');
    setFile(null);
    setMediaType(null);
    setImageUrl('');
    setShowImageUrlInput(false);
    setValidImageUrl(false);
    setIsStory(false);
    setPreviewMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const validateImageUrl = (url) => {
    const img = new Image();
    img.onload = () => setValidImageUrl(true);
    img.onerror = () => setValidImageUrl(false);
    img.src = url;
  };

  useEffect(() => {
    if (imageUrl) validateImageUrl(imageUrl);
    else setValidImageUrl(false);
  }, [imageUrl]);

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const fileSizeMB = selectedFile.size / (1024 * 1024);
    const fileType = selectedFile.type.startsWith('image') ? 'image' : 'video';

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      toast.error(`Datoteka je prevelika (max ${MAX_FILE_SIZE_MB} MB)`);
      return;
    }

    if (
      (fileType === 'image' && !ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) ||
      (fileType === 'video' && !ALLOWED_VIDEO_TYPES.includes(selectedFile.type))
    ) {
      toast.error('Nepodprta vrsta datoteke');
      return;
    }

    if (fileType === 'image') {
      try {
        const compressed = await compressImage(selectedFile);
        setFile(compressed);
        setPreviewMedia(URL.createObjectURL(compressed));
      } catch (e) {
        setFile(selectedFile);
        setPreviewMedia(URL.createObjectURL(selectedFile));
      }
    } else {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(selectedFile);

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          if (video.duration > MAX_VIDEO_DURATION) {
            toast.error('Video je predolg (max 1 minuta).');
            reject();
          } else {
            setFile(selectedFile);
            setPreviewMedia(video.src);
            resolve();
          }
        };
        video.onerror = reject;
      });
    }

    setMediaType(fileType);
  };

  const handleSubmit = async () => {
    if (!userId || isLoading) return;
    if (!textContent && !file && !imageUrl) {
      toast.warning('Dodajte vsebino ali datoteko');
      return;
    }
    if (!selectedRating) {
      toast.error('Izberite oceno med 1 in 5 zvezdicami');
      return;
    }
    if (imageUrl && !validImageUrl) {
      toast.error('URL slike ni veljaven');
      return;
    }

    setUploadInProgress(true);
    setUploadMessage(false);
    setIsLoading(true);
    onClose();

    await processUpload({
      userId,
      content: textContent,
      external_url: externalUrl,
      category_id: selectedCategory,
      rating: parseFloat(selectedRating),
      is_story: isStory,
      imageUrl,
      file,
      mediaType,
      previewMedia,
      editingPostId: post?.id || null
    });

    setUploadInProgress(false);
    setUploadMessage(true);
    setIsLoading(false);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="overlay active">
      <button className="close-btn" onClick={onClose}><i className="bi bi-x-lg"></i></button>
      <div className="overlay-content">
        <div className="post-overlay">
          <div className="post-content">
            <div className="user-post padding-none">
              <img src={profile?.profile_picture_url || '/default-avatar.png'} alt="Avatar" className="avatar" />
              <div className="user-post-intro">
                {profile?.username || 'uporabnik'} <span>{post ? 'uredi objavo' : 'dodaj objavo'}</span>
              </div>
            </div>
            <div className=''>
            <button className="btn-post-img m-b-2" onClick={() => fileInputRef.current.click()}><i className="bi bi-images"></i></button>
            <input type="file" ref={fileInputRef} accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isLoading} />
            <button className="btn-post-url m-b-2" onClick={() => setShowImageUrlInput(!showImageUrlInput)}><i className="bi bi-link-45deg"></i></button>
            <div className=''>
            {showImageUrlInput && (
              <input type="text" className="image-url" placeholder="Vnesite URL slike" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={isLoading} />
            )}
            </div>
            </div>
            <div className='p-b-2'>
            <span className='post-small'>opcijsko lahko dodaš sliko ali video. Video je omejen na 50 MB velikosti in dolžine 60 s. Predlaga se kompresija pred nalaganjem.</span>
            </div>
            {previewMedia && (
              <div className="preview-media">
                {mediaType === 'image' ? (
                  <img src={previewMedia} alt="Predogled" />
                ) : (
                  <video src={previewMedia} controls />
                )}
              </div>
            )}
            {validImageUrl && !file && (
              <div className="preview-media">
                <img src={imageUrl} alt="Predogled URL slike" />
              </div>
            )}
            <div className="row-inner-bg">
              <div className="form-group group-checkbox">
              <div className='flex-content'>
                <span>24-urna objava (story)</span>
                <input type="checkbox" id="switch" checked={isStory} onChange={(e) => setIsStory(e.target.checked)} disabled={isLoading} />
                <label htmlFor="switch"></label>
              </div>
              </div>
            </div>
            <div className="form-group post-content-text m-t-2 m-b-2">
              <textarea placeholder="Vnesite besedilo..." value={textContent} onChange={(e) => setTextContent(e.target.value)} disabled={isLoading} />
            </div>
            <div className="form-group m-t-2 m-b-2">
              <input type="text" placeholder="Vnesite povezavo" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} disabled={isLoading} />
            </div>
            <div className="form-post-end">
              <div className="select-group">
                <div className="form-group cat-btn">
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} disabled={isLoading}>
                    <option value="">Kategorija*</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group cat-btn">
                  <select value={selectedRating} onChange={(e) => setSelectedRating(e.target.value)} disabled={isLoading}>
                    <option value="">Ocena*</option>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>{rating} zvezdic</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="submit-button" onClick={handleSubmit} disabled={isLoading || (!textContent && !file && !imageUrl)}>
                {isLoading ? (<><span className="spinner"></span> Objavljanje...</>) : (post ? 'Shrani spremembe' : 'Objavi')}
              </button>
            </div>
            <span className='post-small'>Vsi * označeni elementi so opcijski</span>
          </div>
        </div>
      </div>
    </div>
  );
}