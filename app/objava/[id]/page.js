'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import Link from 'next/link';
import TimeAgo from '../../components/Posts/TimeAgo';
import UserBadge from '../../components/User/UserBadge';
import LikeButton from '../../components/Posts/LikeButtons';
import LikeComment from '../../components/Comments/LikeComment';
import Navbar from '../../components/Navbar';
import { usePostReviewStore } from '../../store/postReviewStore';
import { createNotification } from '../../lib/notifications';
import InfiniteList from '../../components/Feed/InfiniteList';
import MediaLazyLoader from '../../components/LazyLoading';
import Spinner from '../../components/Loader/Spinner';
import { useFeedStore } from '../../store/feedStore';
import { useSectionScrollRestore } from '../../lib/useSectionScrollRestore';

export default function PostPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const { openReview } = usePostReviewStore();

  // State za objavo, naloživanje, uporabnika, vnos komentarja ipd.
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const textareaRef = useRef(null);

  // Zustand ključ za komentarje te objave
  const commentsSectionKey = `post:${params.id}:comments`;
  useSectionScrollRestore(commentsSectionKey);
  const upsertItem = useFeedStore((s) => s.upsertItem);
  const removeItem = useFeedStore((s) => s.removeItem);

  // Dostop do feed stanja, da sprožimo prvi fetch
  const feedFromStore = useFeedStore((s) => s.sections?.[commentsSectionKey]);
  const feed = feedFromStore ?? { pages: [], nextCursor: 1, scrollPos: 0, ids: [] };
  const pagesArray = Array.isArray(feed.pages) ? feed.pages : [];

  // 1. Pridobi trenutno prijavljenega uporabnika
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUser(user);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  // 2. Pridobi podatke objave
  useEffect(() => {
    let mounted = true;
    if (!params.id) return;
    const fetchPost = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*), categories(*), images(*), videos(*), comments(count)')
        .eq('id', params.id)
        .single();
      if (!mounted) return;
      if (error) {
        console.error('Napaka pri nalaganju objave:', error);
        setPost(null);
      } else {
        setPost(data);
      }
      setLoading(false);
    };
    fetchPost();
    return () => {
      mounted = false;
    };
  }, [params.id, supabase]);

  // 3. Preveri, ali je uporabnik že označil objavo kot sporno
  useEffect(() => {
    let mounted = true;
    const checkReport = async () => {
      if (!user || !params.id) return;
      const { data: report } = await supabase
        .from('post_reports')
        .select('id')
        .eq('post_id', params.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (mounted) {
        setHasReported(!!report);
      }
    };
    checkReport();
    return () => {
      mounted = false;
    };
  }, [user, params.id, supabase]);

  // 4. Realtime posodobitve za objavo in komentarje (INSERT, UPDATE, DELETE)
  useEffect(() => {
    if (!params.id) return;

    // Kanal za spremembe same objave
    const postChan = supabase
      .channel(`post-${params.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: `id=eq.${params.id}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setPost((prev) => ({ ...prev, ...payload.new }));
          }
          if (payload.eventType === 'DELETE') {
            router.push('/');
          }
        }
      )
      .subscribe();

    // Kanal za spremembe v tabeli "comments" za točno to objavo
    const commentsChan = supabase
      .channel(`comments-${params.id}`)
      // INSERT
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${params.id}`,
        },
        async (payload) => {
          const newComment = payload.new;
          if (!newComment) return;

          // Vedno pridobimo profil iz tabele "profiles"
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, profile_picture_url, user_type')
            .eq('id', newComment.user_id)
            .single();

          if (profileError) {
            console.error('Napaka pri pridobivanju profila za novi komentar:', profileError);
            newComment.profiles = {
              username: 'Nepoznani',
              profile_picture_url: '/default-avatar.jpg',
              user_type: 'user',
            };
          } else {
            newComment.profiles = profileData;
          }

          upsertItem(commentsSectionKey, newComment);
        }
      )
      // UPDATE
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${params.id}`,
        },
        async (payload) => {
          const updatedComment = payload.new;
          if (!updatedComment) return;

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, profile_picture_url, user_type')
            .eq('id', updatedComment.user_id)
            .single();

          if (profileError) {
            console.error('Napaka pri pridobivanju profila za posodobljen komentar:', profileError);
            updatedComment.profiles = {
              username: 'Nepoznani',
              profile_picture_url: '/default-avatar.jpg',
              user_type: 'user',
            };
          } else {
            updatedComment.profiles = profileData;
          }

          upsertItem(commentsSectionKey, updatedComment);
        }
      )
      // DELETE
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${params.id}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          removeItem(commentsSectionKey, deletedId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postChan);
      supabase.removeChannel(commentsChan);
    };
  }, [params.id, router, supabase, upsertItem, removeItem]);

  // 5. Pridobivanje komentarjev za InfiniteList
  const fetchComments = useCallback(
    async (cursor = 1, pageSize = 10) => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(*), comment_likes(count)')
        .eq('post_id', params.id)
        .order('created_at', { ascending: false })
        .range((cursor - 1) * pageSize, cursor * pageSize - 1);
      if (error) {
        console.error('Napaka pri fetchComments:', error);
        return { items: [], nextCursor: null };
      }
      return {
        items: data || [],
        nextCursor: data && data.length === pageSize ? cursor + 1 : null,
        currentPage: cursor,
        totalPages: data && data.length === pageSize ? Infinity : cursor,
      };
    },
    [params.id, supabase]
  );

  // 5a. Ob montaži naložimo prvo stran komentarjev, če še ni nič naloženo
  useEffect(() => {
    if (pagesArray.length === 0 && feed.nextCursor === 1) {
      fetchComments(1, 10).then((result) => {
        if (result.items.length) {
          useFeedStore.getState().addPage(commentsSectionKey, {
            posts: result.items,
            currentPage: 1,
            totalPages: result.nextCursor ? Infinity : 1,
            nextCursor: result.nextCursor,
          });
        }
      });
    }
    // eslint-disable-next-line
  }, [pagesArray.length, feed.nextCursor]);

  // 6. Dodaj ali uredi komentar (z upoštevanjem created_at in updated_at ter takojšnji upsert s profilom)
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const handleAddOrUpdateComment = async () => {
    if (!commentInput.trim()) return;
    if (!user) {
      alert('Za komentiranje se morate prijaviti.');
      return;
    }
    setCommentSubmitting(true);

    const timestamp = new Date().toISOString();

    if (editingCommentId) {
      // Uredi obstoječi komentar
      const { error } = await supabase
        .from('comments')
        .update({ content: commentInput, updated_at: timestamp })
        .eq('id', editingCommentId);

      if (error) {
        console.error('Napaka pri urejanju komentarja:', error);
      }
      setEditingCommentId(null);
      setCommentInput('');
    } else {
      // Dodaj nov komentar in takoj preberi poln zapis z vključenim profilom
      const { data: newC, error: insertError } = await supabase
        .from('comments')
        .insert([
          {
            content: commentInput,
            post_id: post.id,
            user_id: user.id,
            created_at: timestamp,
            updated_at: timestamp,
          },
        ])
        .select('id')
        .single();

      setCommentInput('');
      if (insertError) {
        console.error('Napaka pri vpisu komentarja:', insertError);
      } else {
        // Pridobimo celoten komentar z vključenim profilom
        const { data: fullComment, error: selectError } = await supabase
          .from('comments')
          .select('*, profiles(username, profile_picture_url, user_type)')
          .eq('id', newC.id)
          .single();

        if (selectError || !fullComment) {
          console.error('Napaka pri pridobivanju novega komentarja z vključenim profilom:', selectError);
        } else {
          // TRENUTNO vstavljamo v zustand takoj
          upsertItem(commentsSectionKey, fullComment);
        }

        // Pošiljanje notifikacije, če ni avtor
        if (post.user_id !== user.id && newC) {
          await createNotification({
            user_id: post.user_id,
            source_user_id: user.id,
            type: 'comment',
            post_id: post.id,
            comment_id: newC.id,
          });
        }
      }
    }

    setCommentSubmitting(false);
  };

  // 7. Izbriši komentar (optimistično iz zustand, nato v bazo)
  const handleDeleteComment = async (id) => {
    if (!confirm('Ali ste prepričani, da želite izbrisati ta komentar?')) return;

    // 1) Optimalni removal iz zustand in UI
    removeItem(commentsSectionKey, id);

    // 2) Poskusi izbris v bazo
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) {
      console.error('Napaka pri brisanju komentarja v bazi:', error);
      // Če delete v bazi spodleti, ročno ponovno naložimo prvo stran
      fetchComments(1, 10).then((result) => {
        useFeedStore.getState().resetSection(commentsSectionKey);
        if (result.items.length) {
          useFeedStore.getState().addPage(commentsSectionKey, {
            posts: result.items,
            currentPage: 1,
            totalPages: result.nextCursor ? Infinity : 1,
            nextCursor: result.nextCursor,
          });
        }
      });
    }
  };

  // 8. Prijavi objavo (označi kot sporno)
  const handleReportPost = async () => {
    if (!user) return alert('Prijavite se, da označite objavo kot sporno.');
    if (hasReported) return;
    await supabase.from('post_reports').insert([{ post_id: post.id, user_id: user.id }]);
    setHasReported(true);
    alert('Objava je označena kot sporna.');
  };

  // 9. Izbriši objavo
  const handleDeletePost = async () => {
    if (!confirm('Ali ste prepričani, da želite izbrisati to objavo?')) return;
    await supabase.from('posts').delete().eq('id', post.id);
    router.push('/');
  };

  // 10. Deli objavo
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.profiles?.username} - ${post.categories?.name || 'Objava'}`,
          text: post.content?.slice(0, 100) + (post.content?.length > 100 ? '...' : ''),
          url: `${window.location.origin}/objava/${post.id}`,
        });
        setShowShareNotification({ type: 'success', message: 'Uspešno deljeno!' });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/objava/${post.id}`);
        setShowShareNotification({ type: 'info', message: 'Povezava kopirana v odložišče' });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setShowShareNotification({ type: 'error', message: 'Napaka pri deljenju' });
      }
    } finally {
      setTimeout(() => setShowShareNotification(null), 3000);
    }
  };

  // Render
  if (!post) return <div>Objava ni najdena.</div>;

  const image = post.images?.[0];
  const video = post.videos?.[0];
  const isAuthor = user && post.user_id === user.id;
  const displayedContent = showFullContent
    ? post.content
    : (post.content || '').slice(0, 200);

   // Supabase returns post.comments = [{ count: X }], not a bare number.
  const commentCount = Array.isArray(post.comments)
    ? post.comments[0]?.count ?? 0
    : post.comments?.count ?? 0;

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="container-content-full">
          <div className="row p-b-15">
            <div className="posts">
              {/* Header objave */}
              <div className="posts-info">
                <div className="posts-user-cat">
                  <Link href={`/profil/${post.profiles?.username}`} className="posts-avatar">
                    <img
                      src={post.profiles?.profile_picture_url || '/default-avatar.jpg'}
                      alt="Profilna slika"
                      loading="lazy"
                    />
                  </Link>
                  <div className="posts-username-cat">
                    <div className="posts-username">
                      <Link href={`/profil/${post.profiles?.username}`}>
                        {post.profiles?.username}
                      </Link>
                      <UserBadge userType={post.profiles?.user_type} />
                    </div>
                    <div className="posts-cat">
                      Objavljeno v{' '}
                      <Link href={`/kategorija/${post.categories?.name}`}>
                        <span>{post.categories?.name}</span>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="posts-time-menu">
                  <div className="posts-time">
                    <TimeAgo timestamp={post.created_at} />
                  </div>
                  <div className="posts-menu">
                    <i
                      className="bi bi-three-dots-vertical"
                      onClick={() => setIsMenuOpen(v => !v)}
                    />
                  </div>
                </div>
              </div>

              {/* Meni objave */}
              {isAuthor ? (
                isMenuOpen && (
                  <div className="show-post-menu m-b-2">
                    <button
                      className="dropdown-item edit"
                      onClick={() => openReview(post)}
                    >
                      <i className="bi bi-pencil" /> Uredi objavo
                    </button>
                    <button
                      className="dropdown-item delete"
                      onClick={handleDeletePost}
                    >
                      <i className="bi bi-trash" /> Izbriši objavo
                    </button>
                  </div>
                )
              ) : (
                isMenuOpen && (
                  <div className="show-post-menu m-b-2">
                    <button
                      className={`dropdown-item report ${hasReported ? 'disabled' : ''}`}
                      onClick={handleReportPost}
                      disabled={hasReported}
                    >
                      <i className="bi bi-flag" />{' '}
                      {hasReported ? 'Označeno' : 'Označi kot sporno'}
                    </button>
                  </div>
                )
              )}

              {/* Zgodba in ocena */}
              <div className="m-b-2">
                {post.is_story && <p className="story-label">Zgodba</p>}
                {post.rating && <span className="posts-review">
                  Ocena: {post.rating} <i className="bi bi-asterisk" />
                </span>}
              </div>

              {/* Slika ali video */}
              {(image || video) && (
                <div className="posts-img">
                  {image ? (
                    <MediaLazyLoader
                      type="image"
                      src={image.file_url}
                      width={image.width}
                      height={image.height}
                    />
                  ) : (
                    <MediaLazyLoader
                      type="video"
                      src={video.file_url}
                      thumbnail={video.thumbnail_url}
                      width={video.width}
                      height={video.height}
                    />
                  )}
                </div>
              )}

              {/* Besedilo objave */}
              <h2 className="posts-content-text">
                {displayedContent}
                {post.content && post.content.length > 200 && (
                  <span
                    className="p-l-1 posts-show-more"
                    onClick={() => setShowFullContent(!showFullContent)}
                  >
                    {showFullContent ? 'pokaži manj' : 'pokaži več'}
                  </span>
                )}
              </h2>

              {/* Interakcijski gumbi */}
              <div className="posts-buttons">
                <div className="posts-buttons-left">
                  <LikeButton postId={post.id} />
                  <Link href={`/objava/${post.id}`} className="posts-buttons-comments">
                    <i className="bi bi-chat" /> <span>{commentCount}</span>
                  </Link>
                  <div className="posts-buttons-share" onClick={handleShare}>
                    <i className="bi bi-share" />
                  </div>
                </div>
              </div>

              {/* Komentarji */}
              <section id="comments">
                <h2 className="menu-title m-t-5 m-b-2">Vsi komentarji</h2>
                <InfiniteList
                  section={commentsSectionKey}
                  fetchItems={fetchComments}
                  renderItem={(c) => (
                    <div
                      key={`${c.id}-${c.updated_at || c.created_at}`}
                      className="flex-inline w-b-container p-t-2 p-b-2"
                    >
                      <div className="avatar">
                        <img
                          src={c.profiles?.profile_picture_url || '/default-avatar.jpg'}
                          alt="Profilna slika"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-l-2">
                        <div className="username">
                          <Link href={`/profil/${c.profiles?.username}`}>
                            {c.profiles?.username}
                          </Link>
                          <UserBadge userType={c.profiles?.user_type} />
                          <TimeAgo timestamp={c.updated_at || c.created_at} />
                        </div>
                        <p className="p-t-1">{c.content}</p>
                        <div className="posts-buttons-left m-t-1">
                          <LikeComment commentId={c.id} />
                          {user?.id === c.user_id && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setCommentInput(c.content);
                                  textareaRef.current.focus();
                                }}
                                className="btn-comm-edit"
                              >
                                <i className="bi bi-pencil" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="btn-comm-delete"
                              >
                                <i className="bi bi-trash" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  pageSize={10}
                  emptyComponent={<p className="text-center">Ni komentarjev.</p>}
                  endComponent={<p className="text-center m-t-2">Ni več komentarjev.</p>}
                  className="comments-loader-wrapper"
                />
              </section>

              {/* Obrazec za dodajanje/urejanje komentarja */}
              <div className="posts-comment-input">
                <div className="form-group">
                  <textarea
                    ref={textareaRef}
                    rows={2}
                    placeholder="Dodaj svoj komentar..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddOrUpdateComment();
                      }
                    }}
                    style={{
                      resize: 'none',
                      overflowY: 'auto',
                      minHeight: '50px',
                      maxHeight: '228px',
                      lineHeight: '1.5',
                      padding: '8px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    className={`btn-1 ${
                      !commentInput.trim() || commentSubmitting ? 'disabled' : ''
                    }`}
                    onClick={handleAddOrUpdateComment}
                    disabled={!commentInput.trim() || commentSubmitting}
                  >
                    {commentSubmitting ? 'Dodajam...' : editingCommentId ? 'Posodobi' : 'Komentiraj'}
                  </button>
                </div>
              </div>

              {/* Obvestilo o kopiranju/deljenju */}
              {showShareNotification && (
                <div className={`share-notification ${showShareNotification.type}`}>
                  {showShareNotification.message}
                </div>
              )}

              <div className="overlay-list-end"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}