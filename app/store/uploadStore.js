// store/uploadStore.js
import { create } from 'zustand';

export const useUploadStore = create((set) => ({
  uploadInProgress: false,
  uploadMessage: false,

  setUploadInProgress: (value) => set({ uploadInProgress: value }),
  setUploadMessage: (value) => set({ uploadMessage: value })
}));