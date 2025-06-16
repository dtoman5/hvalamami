// app/store/feedStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * useFeedStore
 *
 * sections: {
 *   [sectionKey]: {
 *     pages: Array<{ posts: Array<any>, currentPage, totalPages, nextCursor }>,
 *     ids: Array<string>,
 *     nextCursor: number|null,
 *     scrollPos: number
 *   }
 * }
 */
export const useFeedStore = create(
  persist(
    (set, get) => ({
      sections: {},

      // set or update scroll position
      setScrollPos: (sectionKey, pos) => {
        set(state => {
          const existing = state.sections[sectionKey] || {
            pages: [], ids: [], nextCursor: 1, scrollPos: 0
          }
          return {
            sections: {
              ...state.sections,
              [sectionKey]: { ...existing, scrollPos: pos }
            }
          }
        })
      },

      // clear a single section
      resetSection: (sectionKey) => {
        set(state => {
          const s = { ...state.sections }
          delete s[sectionKey]
          return { sections: s }
        })
      },

      // clear all sections
      resetAll: () => {
        set({ sections: {} })
      },

      // append a page of items to a section (deduped)
      addPage: (sectionKey, { posts, currentPage, totalPages, nextCursor }) => {
        set(state => {
          const existing = state.sections[sectionKey] || {
            pages: [], ids: [], nextCursor: 1, scrollPos: 0
          }
          const seen = new Set(existing.ids)
          const filtered = posts.filter(p => !seen.has(p.id))
          return {
            sections: {
              ...state.sections,
              [sectionKey]: {
                pages: [
                  ...existing.pages,
                  { posts: filtered, currentPage, totalPages, nextCursor }
                ],
                ids: [...existing.ids, ...filtered.map(p => p.id)],
                nextCursor,
                scrollPos: existing.scrollPos
              }
            }
          }
        })
      },

      // upsert a single item into a section, or prepend if new
      upsertItem: (sectionKey, item) => {
        set(state => {
          const existing = state.sections[sectionKey]
          if (!existing) {
            // brand-new section
            return {
              sections: {
                ...state.sections,
                [sectionKey]: {
                  pages: [ { posts: [item], currentPage: 1, totalPages: 1, nextCursor: 1 } ],
                  ids: [item.id],
                  nextCursor: 1,
                  scrollPos: 0
                }
              }
            }
          }

          const { pages, ids, nextCursor, scrollPos } = existing
          const idSet = new Set(ids)
          // 1) update existing pages
          const updated = pages.map(pg => ({
            ...pg,
            posts: pg.posts.map(p => p.id === item.id ? { ...p, ...item } : p)
          }))

          let newPages = updated
          let newIds   = ids

          // 2) if truly new, prepend
          if (!idSet.has(item.id)) {
            newIds = [ item.id, ...ids ]
            if (updated.length === 0) {
              newPages = [ { posts: [item], currentPage:1, totalPages:1, nextCursor } ]
            } else {
              newPages = [
                { ...updated[0], posts: [item, ...updated[0].posts] },
                ...updated.slice(1)
              ]
            }
          }

          return {
            sections: {
              ...state.sections,
              [sectionKey]: { pages: newPages, ids: newIds, nextCursor, scrollPos }
            }
          }
        })
      },

      // remove an item by id from a section
      removeItem: (sectionKey, id) => {
        set(state => {
          const existing = state.sections[sectionKey] || {
            pages: [], ids: [], nextCursor: 1, scrollPos: 0
          }
          const newPages = existing.pages.map(pg => ({
            ...pg,
            posts: pg.posts.filter(p => p.id !== id)
          }))
          const newIds = existing.ids.filter(i => i !== id)
          return {
            sections: {
              ...state.sections,
              [sectionKey]: {
                ...existing,
                pages: newPages,
                ids: newIds
              }
            }
          }
        })
      },

      /**
       * updatePostInSection(sectionKey, post)
       *
       * If you edit a post and toggle is_story:
       * - it'll remove it from the old section and insert into the matching one.
       * Otherwise it simply upserts into the given section.
       */
      updatePostInSection: (sectionKey, post) => {
        const isStory      = !!post.is_story
        const inStoriesKey = sectionKey.includes(':stories')            || sectionKey === 'feed:stories'
        const inPostsKey   = sectionKey.includes(':posts')              || sectionKey === 'feed:followers'

        // if moved from posts→stories
        if (isStory && inPostsKey) {
          get().removeItem(sectionKey, post.id)
          const target = sectionKey === 'feed:followers'
            ? 'feed:stories'
            : sectionKey.replace(/:posts$/, ':stories')
          get().upsertItem(target, post)
          return
        }

        // if moved from stories→posts
        if (!isStory && inStoriesKey) {
          get().removeItem(sectionKey, post.id)
          const target = sectionKey === 'feed:stories'
            ? 'feed:followers'
            : sectionKey.replace(/:stories$/, ':posts')
          get().upsertItem(target, post)
          return
        }

        // otherwise a normal in-place upsert
        get().upsertItem(sectionKey, post)
      }
    }),
    {
      name: 'feedStore-v2',         // ← bumped key here
      getStorage: () => sessionStorage
    }
  )
)