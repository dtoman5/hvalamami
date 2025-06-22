// lib/processUpload.js
import { createClient } from '../../lib/supabase/client'
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { generateVideoThumbnail } from './generateThumbnail';

export async function processUpload({
  userId,
  content,
  external_url,
  category_id,
  rating,
  is_story,
  imageUrl,
  file,
  mediaType,
  previewMedia,
  editingPostId = null,
}) {
  const supabase = createClient();
  let postId = editingPostId;

  try {
    if (editingPostId) {
      // Update existing post
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          content,
          external_url,
          category_id,
          rating,
          is_story,
          updated_at: new Date().toISOString(),
          expires_at: is_story ? new Date(Date.now() + 86400000).toISOString() : null,
        })
        .eq('id', editingPostId);

      if (updateError) throw updateError;

      postId = editingPostId;

      // Only delete and re-add media if new one is provided
      if (file || imageUrl) {
        await supabase.from('images').delete().eq('post_id', postId);
        await supabase.from('videos').delete().eq('post_id', postId);
      }

      await supabase.from('notifications').insert({
        user_id: userId,
        type: is_story ? 'story-update' : 'post-update',
        source_user_id: userId,
        post_id: postId,
        is_read: false,
      });
    } else {
      // Insert new post
      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content,
          external_url,
          category_id,
          rating,
          is_story,
          expires_at: is_story ? new Date(Date.now() + 86400000).toISOString() : null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      postId = post.id;

      await supabase.from('notifications').insert({
        user_id: userId,
        type: is_story ? 'story' : 'post',
        source_user_id: userId,
        post_id: postId,
        is_read: false,
      });
    }

    // --- Media Upload ---
    if (imageUrl && !file) {
      const img = new Image();
      img.src = imageUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      await supabase.from('images').insert({
        post_id: postId,
        user_id: userId,
        file_url: imageUrl,
        file_size: 0,
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0,
        is_story,
      });
    }

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const folder = is_story ? 'stories' : 'posts';
      const filePath = `${userId}/${mediaType}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('posts-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/posts-media/${filePath}`;

      if (mediaType === 'image') {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });

        await supabase.from('images').insert({
          post_id: postId,
          user_id: userId,
          file_url: publicUrl,
          file_size: file.size,
          width: img.width,
          height: img.height,
          is_story,
        });
      } else if (mediaType === 'video') {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        await new Promise((res, rej) => {
          video.onloadedmetadata = res;
          video.onerror = rej;
        });

        const thumbBlob = await generateVideoThumbnail(file);
        const thumbPath = `${userId}/thumbnails/${uuidv4()}.jpg`;

        await supabase.storage
          .from('posts-media')
          .upload(thumbPath, thumbBlob);

        const thumbUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/posts-media/${thumbPath}`;

        await supabase.from('videos').insert({
          post_id: postId,
          user_id: userId,
          file_url: publicUrl,
          thumbnail_url: thumbUrl,
          file_size: file.size,
          width: video.videoWidth,
          height: video.videoHeight,
          video_duration: video.duration,
          is_story,
        });
      }
    }

  } catch (error) {
    console.error('Napaka pri nalaganju objave:', error);
    toast.error('Napaka: ' + error.message);
  }
}