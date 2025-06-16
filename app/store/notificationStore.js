// store/notificationStore.js
import create from 'zustand';

export const useNotificationStore = create((set, get) => ({
  // vsaka stran vrne niza obvestil pod ključem `notifications`
  pages: [],               // [ { notifications: [...], nextCursor } ]
  nextCursor: null,        // ko ni več, je null
  scrollPos: 0,

  addPage: ({ notifications, nextCursor }) =>
    set((state) => {
      // filtriraj podvajanja po id
      const existingIds = new Set(state.pages.flatMap(p => p.notifications.map(n => n.id)));
      const newOnes = notifications.filter(n => !existingIds.has(n.id));
      if (newOnes.length === 0) return state;

      return {
        pages: [...state.pages, { notifications: newOnes, nextCursor }],
        nextCursor,
      };
    }),

  reset: () =>
    set({
      pages: [],
      nextCursor: null,
      scrollPos: 0,
    }),

  setScrollPos: (pos) =>
    set({ scrollPos: pos }),
}));