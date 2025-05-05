"use client";
import React, { useState, useEffect } from "react";

export default function PostReview({ isOpen, onClose, post, onSave }) {
  const supabase = createClientComponentClient();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [textContent, setTextContent] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaType, setMediaType] = useState("");
  const [previewMedia, setPreviewMedia] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlSlika, setUrlSlika] = useState("");
  const [prikaziUrlVnos, setPrikaziUrlVnos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [imageId, setImageId] = useState(null);

  // Inicializirajte stanje z vrednostmi iz `post`
  useEffect(() => {
    if (post) {
      setSelectedCategory(post.category_id || "");
      setSelectedRating(post.rating || "");
      setTextContent(post.content || "");
      setPostUrl(post.external_url || "");
      setVideoId(post.video_id || null);
      setImageId(post.image_id || null);
      
      // Če je video ali slika že shranjena, pridobimo URL za predogled
      if (post.video_id) {
        fetchMediaUrl(post.video_id, 'videos');
      } else if (post.image_id) {
        fetchMediaUrl(post.image_id, 'images');
      }
    }
  }, [post]);

  // Pridobi URL medija iz baze
  const fetchMediaUrl = async (id, table) => {
    const { data, error } = await supabase
      .from(table)
      .select('file_url')
      .eq('id', id)
      .single();
    
    if (!error && data) {
      setPreviewMedia(data.file_url);
      setMediaType(table === 'videos' ? 'video' : 'image');
    }
  };

  // Resetirajte stanje, ko se overlay odpre za novo objavo
  useEffect(() => {
    if (isOpen && (post === null || post === undefined)) {
      setSelectedCategory("");
      setSelectedRating("");
      setTextContent("");
      setPostUrl("");
      setSelectedFile(null);
      setMediaType("");
      setPreviewMedia("");
      setUploadProgress(0);
      setUrlSlika("");
      setPrikaziUrlVnos(false);
      setVideoId(null);
      setImageId(null);
    }
  }, [isOpen, post]);

  // Pridobi kategorije ob nalaganju komponente
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase.from("categories").select("id, name");
      if (error) {
        console.error("Napaka pri pridobivanju kategorij:", error.message);
        return;
      }
      setCategories(data || []);
    }

    fetchCategories();
  }, []);

  // Obdelaj nalaganje datoteke
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 120 * 1024 * 1024) {
        alert("Datoteka je prevelika. Največja dovoljena velikost je 120 MB.");
        return;
      }

      setSelectedFile(file);
      setMediaType(file.type.startsWith("video") ? "video" : "image");
      setPreviewMedia(URL.createObjectURL(file));
      setUrlSlika("");
    }
  };

  // Obdelaj spremembo URL slike
  const handleUrlSlikaChange = (e) => {
    const url = e.target.value;
    setUrlSlika(url);

    if (url) {
      setPreviewMedia(url);
      setMediaType("image");
      setSelectedFile(null);
    }
  };

  // Nalaganje datoteke s progresom
  const handleFileUploadWithProgress = async (file, userId) => {
    const bucketName = "posts-media";
    const uniqueFileName = `${userId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFileName, file, {
        cacheControl: "3600",
        upsert: true,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
        },
      });

    if (error) {
      throw new Error("Napaka pri nalaganju datoteke: " + error.message);
    }

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${uniqueFileName}`;
  };

  // Shrani video v bazo
  const saveVideoToDB = async (fileUrl, userId, file) => {
    const { data, error } = await supabase
      .from('videos')
      .insert([
        {
          user_id: userId,
          file_url: fileUrl,
          file_size: file.size,
          video_duration: 0, // Tukaj bi lahko dodali izračun trajanja
          width: 0,          // Tukaj bi lahko dodali dejanske dimenzije
          height: 0,
          thumbnail_url: fileUrl + '.thumbnail.jpg', // Tukaj bi lahko dodali generiranje thumbnaila
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  // Shrani sliko v bazo
  const saveImageToDB = async (fileUrl, userId, file) => {
    const { data, error } = await supabase
      .from('images')
      .insert([
        {
          user_id: userId,
          file_url: fileUrl,
          file_size: file.size,
          width: 0,  // Tukaj bi lahko dodali dejanske dimenzije
          height: 0,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  // Obdelaj oddajo forme
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Napaka pri pridobivanju uporabnika:", userError?.message || "Uporabnik ni prijavljen.");
        setIsLoading(false);
        return;
      }
      const userId = user.id;

      if (!selectedCategory) {
        console.error("Napaka: kategorija ni izbrana.");
        setIsLoading(false);
        return;
      }

      let newVideoId = videoId;
      let newImageId = imageId;

      if (selectedFile || urlSlika) {
        let fileUrl = urlSlika;

        if (selectedFile) {
          // Naloži datoteko brez kompresije
          fileUrl = await handleFileUploadWithProgress(selectedFile, userId);

          // Shrani v ustrezno tabelo
          if (mediaType === 'video') {
            newVideoId = await saveVideoToDB(fileUrl, userId, selectedFile);
            newImageId = null; // Ponastavimo imageId, če smo dodali video
          } else {
            newImageId = await saveImageToDB(fileUrl, userId, selectedFile);
            newVideoId = null; // Ponastavimo videoId, če smo dodali sliko
          }
        } else if (urlSlika) {
          // Shrani samo URL slike v tabelo images
          const { data, error } = await supabase
            .from('images')
            .insert([{
              user_id: userId,
              file_url: fileUrl,
              file_size: 0,
              width: 0,
              height: 0
            }])
            .select()
            .single();

          if (error) throw error;
          newImageId = data.id;
          newVideoId = null;
        }
      }

      const postData = {
        user_id: userId,
        content: textContent,
        video_id: newVideoId,
        image_id: newImageId,
        category_id: selectedCategory,
        rating: selectedRating || null,
        external_url: postUrl || null,
      };

      if (post?.id) {
        // Urejanje obstoječe objave
        const { data: updatedPost, error: updateError } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", post.id)
          .select()
          .single();

        if (updateError) throw updateError;

        if (typeof onSave === "function") {
          onSave(updatedPost);
        }
      } else {
        // Ustvarjanje nove objave
        const { data: newPost, error: postError } = await supabase
          .from("posts")
          .insert([postData])
          .select()
          .single();

        if (postError) throw postError;

        if (typeof onSave === "function") {
          onSave(newPost);
        }
      }

      // Zapri overlay
      onClose();
    } catch (error) {
      console.error("Napaka pri dodajanju objave:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="postReview" className="overlay active">
      <button className="close-btn" onClick={onClose}>
        <i className="bi bi-x-lg"></i>
      </button>
      <div className="overlay-content">
        <div className="post-overlay">
          <div className="user-post padding-none">
            <img
              src="https://static.vecteezy.com/system/resources/previews/029/796/026/non_2x/asian-girl-anime-avatar-ai-art-photo.jpg"
              alt="Avatar"
              className="avatar"
            />
            <div className="user-post-intro">
              @uporabnik <span>deli svojo objavo:</span>
            </div>
          </div>

          <div className="post-content">
            <button
              className="btn-post-img m-b-2"
              onClick={() => document.getElementById("imageInput").click()}
            >
              <i className="bi bi-images"></i>
            </button>
            <input
              type="file"
              id="imageInput"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />

            <button
              id="btn-url-toggle"
              className="btn-post-url"
              onClick={() => setPrikaziUrlVnos(!prikaziUrlVnos)}
            >
              <i className="bi bi-link-45deg"></i>
            </button>
            {prikaziUrlVnos && (
              <div className="form-group m-b-2">
                <input
                  type="text"
                  className="image-url"
                  placeholder="Vnesite URL povezavo slike"
                  value={urlSlika}
                  onChange={handleUrlSlikaChange}
                />
              </div>
            )}

            {previewMedia && (
              <div style={{ marginTop: "20px" }}>
                {mediaType === "image" ? (
                  <img src={previewMedia} alt="Predogled slike" style={{ maxWidth: "100%", height: "auto" }} />
                ) : (
                  <video src={previewMedia} controls style={{ maxWidth: "100%" }} />
                )}
              </div>
            )}

            {uploadProgress > 0 && (
              <div style={{ marginTop: "10px" }}>Nalaganje medija: {uploadProgress}%</div>
            )}

            <div className="form-group post-content-text m-t-2 m-b-2">
              <textarea
                id="postText"
                placeholder="Vnesite besedilo..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
            </div>

            <div className="form-group m-t-2 m-b-2">
              <input
                type="text"
                id="postUrl"
                placeholder="Vnesite povezavo"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
              />
            </div>

            <div className="form-post-end">
              <div className="select-group">
                <div className="form-group cat-btn">
                  <select
                    id="categories"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="" hidden>
                      Izberi kategorijo *
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group cat-btn">
                  <select
                    id="ratings"
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                  >
                    <option value="" hidden>
                      Izberi oceno
                    </option>
                    {[...Array(9)].map((_, i) => (
                      <option key={i} value={(i + 2) / 2}>
                        {((i + 2) / 2).toFixed(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? `Nalagam...` : "Objavi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}