// app/components/Overlays/PostReview.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import { toast } from 'react-toastify';
import { useUploadStore } from '../../store/uploadStore';
import { useFeedStore } from '../../store/feedStore';
import { processUpload } from '../../lib/processUpload';
import { compressImage } from '../../lib/compressImage';

const MAX_FILE_SIZE_MB = 50;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_VIDEO_DURATION = 60;

export default function PostReview({ isOpen, onClose, post, categories: initialCategories = [] }) {
  const supabase = createClient();
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // ---- build sectionKey based on current route ----
  let sectionKey = '';
    if (post?.id) {
    // urejamo obstoječo objavo → uporabimo profile:{userId}:{posts|stories}
      const profSection = post.is_story ? 'stories' : 'posts';
      sectionKey = `profile:${post.user_id}:${profSection}`;
    } else if (segments[0] === 'zid') {
      const sec = segments[1] || 'followers';
      sectionKey = `feed:${sec}`;
    } else if (segments[0] === 'kategorija') {
      const name = decodeURIComponent(segments[1] || '');
      sectionKey = `category:${name}:posts`;
    } else if (segments[0] === 'objava') {
      const pid = segments[1];
      sectionKey = `post:${pid}:comments`;
    }

  const upsertItem = useFeedStore(s => s.upsertItem);
  const { setUploadInProgress, setUploadMessage } = useUploadStore();

  const [categories, setCategories] = useState(Array.isArray(initialCategories) ? initialCategories : []);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [file, setFile] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRating, setSelectedRating] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [validImageUrl, setValidImageUrl] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [isStory, setIsStory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // --- fetch current user + their profile + categories if needed ---
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: prof } = await supabase
        .from('profiles')
        .select('username, profile_picture_url')
        .eq('id', user.id)
        .single();
      setProfile(prof);

      if (categories.length === 0) {
        const { data: cats, error } = await supabase
          .from('categories')
          .select('id, name, hex_color, cat_img')
          .order('name', { ascending: true });
        if (!error) setCategories(cats);
      }
    })();
  }, [supabase, categories.length]);

  // --- populate form when editing ---
  useEffect(() => {
    if (post) {
      setTextContent(post.content || '');
      setSelectedRating(post.rating?.toString() || '');
      setSelectedCategory(post.category_id || null);
      setExternalUrl(post.external_url || '');
      setIsStory(!!post.is_story);

      const img = post.images?.[0]?.file_url;
      const vid = post.videos?.[0]?.file_url;
      if (img) {
        setPreviewMedia(img);
        setMediaType('image');
      } else if (vid) {
        setPreviewMedia(vid);
        setMediaType('video');
      }
    } else {
      resetForm();
    }
  }, [post]);

  // --- validate imageUrl ---
  useEffect(() => {
    if (!imageUrl) {
      setValidImageUrl(false);
      return;
    }
    const img = new Image();
    img.onload = () => setValidImageUrl(true);
    img.onerror = () => setValidImageUrl(false);
    img.src = imageUrl;
  }, [imageUrl]);

  // --- reset all inputs ---
  const resetForm = () => {
    setTextContent('');
    setExternalUrl('');
    setFile(null);
    setMediaType(null);
    setImageUrl('');
    setShowImageUrlInput(false);
    setValidImageUrl(false);
    setSelectedCategory(null);
    setSelectedRating('');
    setIsStory(false);
    setPreviewMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  // --- handle file selection + compress/validate ---
  const handleFileUpload = async e => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const sizeMB = selected.size / (1024 * 1024);
    const isImage = selected.type.startsWith('image');
    const typeOK = isImage
      ? ALLOWED_IMAGE_TYPES.includes(selected.type)
      : ALLOWED_VIDEO_TYPES.includes(selected.type);

    if (sizeMB > MAX_FILE_SIZE_MB || !typeOK) {
      toast.error(`Neveljavna datoteka (max ${MAX_FILE_SIZE_MB} MB, jpeg/png/webp ali mp4/webm).`);
      return;
    }

    if (isImage) {
      try {
        const compressed = await compressImage(selected);
        setFile(compressed);
        setPreviewMedia(URL.createObjectURL(compressed));
      } catch {
        setFile(selected);
        setPreviewMedia(URL.createObjectURL(selected));
      }
      setMediaType('image');
    } else {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(selected);
      video.onloadedmetadata = () => {
        if (video.duration > MAX_VIDEO_DURATION) {
          toast.error(`Video predolg (max ${MAX_VIDEO_DURATION} s).`);
        } else {
          setFile(selected);
          setPreviewMedia(video.src);
          setMediaType('video');
        }
      };
      video.onerror = () => toast.error('Napaka pri nalaganju videa.');
    }
  };

  // --- submit (upload or update + upsert into zustand) ---
  const handleSubmit = async () => {
    if (!userId || isLoading) return;
    if (!textContent.trim() && !file && !imageUrl) {
      toast.warning('Dodajte vsaj besedilo ali datoteko.');
      return;
    }
    if (imageUrl && !validImageUrl) {
      toast.error('Neveljaven URL slike.');
      return;
    }

    // optimistično zapri overlay in resetiraj
    onClose();
    resetForm();
    setUploadInProgress(true);
    setUploadMessage(false);
    setIsLoading(true);

    try {
      await processUpload({
        userId,
        content: textContent,
        external_url: externalUrl,
        category_id: selectedCategory,
        rating: selectedRating ? parseFloat(selectedRating) : null,
        is_story: isStory,
        imageUrl,
        file,
        mediaType,
        previewMedia,
        editingPostId: post?.id ?? null
      });

      if (post?.id) {
        const { data: updated, error: selErr } = await supabase
          .from('posts')
          .select(`
            *,
            profiles(*),
            categories(*),
            images(*),
            videos(*),
            comments(count),
            likes(count)
          `)
          .eq('id', post.id)
          .single();

        if (!selErr && updated) {
          upsertItem(sectionKey, updated);
        }
      }
    } catch (err) {
      console.error('Napaka pri nalaganju objave:', err);
      toast.error('Napaka pri objavi.');
    } finally {
      setIsLoading(false);
      setUploadInProgress(false);
      setUploadMessage(true);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="overlay active">
      <button className="close-btn" onClick={onClose}>
        <i className="bi bi-x-lg"></i>
      </button>
      <div className="overlay-content">
        <div className="post-overlay">
          <div className="post-content">

            {/* avatar + title */}
            <div className="user-post padding-none">
              <img
                src={profile?.profile_picture_url || '/default-avatar.png'}
                alt="Avatar"
                className="avatar"
              />
              <div className="user-post-intro">
                {profile?.username || 'uporabnik'}{' '}
                <span>{post ? 'uredi objavo' : 'dodaj objavo'}</span>
              </div>
            </div>

            {/* file / URL controls */}
            <div>
              <button
                className="btn-post-img m-b-2"
                onClick={() => fileInputRef.current.click()}
                disabled={isLoading}
              >
                <i className="bi bi-images"></i>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                disabled={isLoading}
              />
              <button
                className="btn-post-url m-b-2"
                onClick={() => setShowImageUrlInput(v => !v)}
                disabled={isLoading}
              >
                <i className="bi bi-link-45deg"></i>
              </button>
              {showImageUrlInput && (
                <input
                  type="text"
                  className="image-url"
                  placeholder="Vnesite URL slike"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  disabled={isLoading}
                />
              )}
            </div>

            {/* hint */}
            <div className="p-b-2">
              <span className="post-small">
                Opcijsko lahko dodaš sliko ali video (50 MB / 60 s).
              </span>
            </div>

            {/* preview */}
            {previewMedia && (
              <div className="preview-media">
                {mediaType === 'image' ? (
                  <img src={previewMedia} alt="Predogled" />
                ) : (
                  <video src={previewMedia} controls />
                )}
              </div>
            )}

            {/* story toggle */}
            <div className="row-inner-bg">
              <div className="flex-content group-checkbox">
                <span>24-urna objava (story)</span>
                <input
                  type="checkbox"
                  id="switch"
                  checked={isStory}
                  onChange={e => setIsStory(e.target.checked)}
                  disabled={isLoading}
                />
                <label htmlFor="switch"></label>
              </div>
            </div>

            {/* text */}
            <div className="form-group post-content-text m-t-2 m-b-2">
              <textarea
                placeholder="Vnesite besedilo..."
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* external URL */}
            <div className="form-group m-t-2 m-b-2">
              <input
                type="text"
                placeholder="Vnesite povezavo"
                value={externalUrl}
                onChange={e => setExternalUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* category + rating */}
            <div className="form-post-end">
              <div className="select-group">
                <div className="form-group cat-btn">
                  <select
                    value={selectedCategory || ''}
                    onChange={e => setSelectedCategory(e.target.value || null)}
                    disabled={isLoading || categories.length === 0}
                  >
                    <option value="">
                      {categories.length === 0 ? 'Ni kategorij' : 'Kategorija (izbirno)'}
                    </option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group cat-btn">
                  <select
                    value={selectedRating}
                    onChange={e => setSelectedRating(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Ocena (izbirno)</option>
                    {[1, 2, 3, 4, 5].map(r => (
                      <option key={r} value={r}>
                        {r} zvezdic
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={isLoading || (!textContent.trim() && !file && !imageUrl)}
              >
                {isLoading ? 'Objavljanje…' : post ? 'Shrani spremembe' : 'Objavi'}
              </button>
            </div>

            <span className="post-small">Vsi elementi so izbirni</span>
          </div>
        </div>
      </div>
    </div>
  );
}