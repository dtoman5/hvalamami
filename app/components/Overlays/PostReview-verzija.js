"use client";

import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { useUploads } from "../../context/UploadContext"; // Uvozite useUploads

export default function PostReview({ isOpen, onClose, post, onSave }) {
  const supabase = createClientComponentClient();
  const { addUpload, updateUpload, removeUpload } = useUploads(); // Uporabite useUploads
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

  useEffect(() => {
    if (post) {
      setSelectedCategory(post.category_id || "");
      setSelectedRating(post.rating || "");
      setTextContent(post.content || "");
      setPostUrl(post.external_url || "");
      setPreviewMedia(post.media?.file_url || "");
      setMediaType(post.media?.media_type || "");
    }
  }, [post]);

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
    }
  }, [isOpen, post]);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 120 * 1024 * 1024) {
        alert("Datoteka je prevelika. Največja dovoljena velikost je 20 MB.");
        return;
      }

      setSelectedFile(file);
      setMediaType(file.type.startsWith("video") ? "video" : "image");
      setPreviewMedia(URL.createObjectURL(file));
      setUrlSlika("");
    }
  };

  const handleUrlSlikaChange = (e) => {
    const url = e.target.value;
    setUrlSlika(url);

    if (url) {
      setPreviewMedia(url);
      setMediaType("image");
      setSelectedFile(null);
    }
  };

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 750,
      useWebWorker: true,
      fileType: "image/jpeg",
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error("Napaka pri kompresiji slike:", error);
      throw error;
    }
  };

  const compressVideo = async (file) => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();

    const fileData = await file.arrayBuffer();
    const fileName = "input.mp4";
    const outputFileName = "output.mp4";

    await ffmpeg.writeFile(fileName, new Uint8Array(fileData));

    await ffmpeg.exec([
      "-i", fileName,
      "-vf", "scale=720:-1",
      "-c:v", "libx264",
      "-b:v", "1000K",
      "-c:a", "aac",
      "-preset", "fast",
      outputFileName
    ]);

    const compressedFileData = await ffmpeg.readFile(outputFileName);
    const compressedFile = new File([compressedFileData], outputFileName, { type: "video/mp4" });

    return compressedFile;
  };

  const handleFileUploadWithProgress = async (file, userId) => {
    const bucketName = "posts-media";
    const uniqueFileName = `${userId}/${Date.now()}_${file.name}`;

    // Dodajte nalaganje v kontekst
    const uploadId = Date.now().toString();
    addUpload({ id: uploadId, fileName: file.name, progress: 0 });

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFileName, file, {
        cacheControl: "3600",
        upsert: true,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
          updateUpload(uploadId, progress); // Posodobite napredek nalaganja
        },
      });

    if (error) {
      removeUpload(uploadId); // Odstranite nalaganje v primeru napake
      throw new Error("Napaka pri nalaganju datoteke: " + error.message);
    }

    removeUpload(uploadId); // Odstranite nalaganje po uspešnem nalaganju
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${uniqueFileName}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    onClose(); // Takoj zapri overlay

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

      let mediaId = post?.media_id || null;

      if (selectedFile || urlSlika) {
        let fileUrl = null;

        if (selectedFile) {
          let compressedFile;
          if (mediaType === "image") {
            compressedFile = await compressImage(selectedFile);
          } else if (mediaType === "video") {
            compressedFile = await compressVideo(selectedFile);
          } else {
            throw new Error("Nepodprt tip datoteke.");
          }

          fileUrl = await handleFileUploadWithProgress(compressedFile, userId);
        } else if (urlSlika) {
          fileUrl = urlSlika;
        }

        const { data: mediaData, error: mediaError } = await supabase
          .from("media")
          .insert([
            {
              file_url: fileUrl,
              media_type: mediaType,
              user_id: userId,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (mediaError) {
          console.error("Napaka pri vstavljanju v tabelo 'media':", mediaError.message);
          setIsLoading(false);
          return;
        }

        if (!mediaData) {
          console.error("Napaka: Medij ni bil uspešno shranjen. Ni podatkov.");
          setIsLoading(false);
          return;
        }

        mediaId = mediaData.id;
      }

      const postData = {
        user_id: userId,
        content: textContent,
        media_id: mediaId,
        category_id: selectedCategory,
        rating: selectedRating || null,
        external_url: postUrl || null,
        created_at: new Date().toISOString(),
        has_rating: true,
      };

      let newPost;
      if (post?.id) {
        const { data: updatedPost, error: updateError } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", post.id)
          .select()
          .single();

        if (updateError) {
          console.error("Napaka pri posodabljanju objave:", updateError.message);
          setIsLoading(false);
          return;
        }

        newPost = updatedPost;
      } else {
        const { data: insertedPost, error: postError } = await supabase
          .from("posts")
          .insert([postData])
          .select()
          .single();

        if (postError) {
          console.error("Napaka pri vstavljanju objave:", postError.message);
          setIsLoading(false);
          return;
        }

        newPost = insertedPost;
      }

      // Dodaj obvestilo
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: userId,
            type: "post",
            source_user_id: userId,
            post_id: newPost.id,
            created_at: new Date().toISOString(),
            is_read: false,
            read_at: null,
          },
        ]);

      if (notificationError) {
        console.error("Napaka pri dodajanju obvestila:", notificationError.message);
      }

      if (typeof onSave === "function") {
        onSave(newPost);
      }
    } catch (error) {
      console.error("Napaka pri dodajanju objave:", error.message);
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