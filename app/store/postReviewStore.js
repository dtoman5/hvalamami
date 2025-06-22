import { create } from 'zustand';

export const usePostReviewStore = create((set) => ({
  isOpen: false,
  editingPost: null,
  openReview: (post) => set({ isOpen: true, editingPost: post }),
  closeReview: () => set({ isOpen: false, editingPost: null }),
}));