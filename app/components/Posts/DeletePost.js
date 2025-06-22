// app/components/Posts/DeletePost.js
'use client';

import { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { toast } from 'react-toastify';

export default function DeletePost({ postId, onClose, onDeleted }) {
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const deletePost = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      onDeleted();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Napaka pri brisanju: ${error.message}`);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  // Start deletion immediately when component mounts
  useState(() => {
    deletePost();
  }, []);

  // No UI rendering
  return null;
}