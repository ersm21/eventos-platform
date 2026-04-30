'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase/client';
import AppNavbar from '../../components/AppNavbar';

type FeedPost = {
  id: string;
  user_id: string | null;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | 'none' | null;
  created_at: string | null;
};

type FeedLike = {
  id: string;
  post_id: string;
  user_id: string | null;
};

type FeedComment = {
  id: string;
  post_id: string;
  user_id: string | null;
  comment: string;
  created_at: string | null;
};

type Profile = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return 'Ahora';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Ahora';

  return date.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getMediaType(mimeType: string | null | undefined): 'image' | 'video' | 'none' {
  if (!mimeType) return 'none';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'none';
}

function normalizeSupabasePublicUrl(url: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return url;

  return url
    .replace('http://127.0.0.1:54321', supabaseUrl)
    .replace('http://localhost:54321', supabaseUrl);
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [likes, setLikes] = useState<FeedLike[]>([]);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [postContent, setPostContent] = useState('');
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const profilesByUserId = useMemo(() => {
    return profiles.reduce<Record<string, Profile>>((accumulator, profile) => {
      accumulator[profile.user_id] = profile;
      return accumulator;
    }, {});
  }, [profiles]);

  const loadAdminStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUserId(user?.id ?? null);

    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('feed_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const loadFeed = async () => {
    setError(null);

    await loadAdminStatus();

    const { data: postsData, error: postsError } = await supabase
      .from('feed_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (postsError) {
      setError(postsError.message);
      setLoading(false);
      return;
    }

    const loadedPosts = (postsData || []) as FeedPost[];
    setPosts(loadedPosts);

    const postIds = loadedPosts.map((post) => post.id);
    const userIds = Array.from(
      new Set(loadedPosts.map((post) => post.user_id).filter(Boolean) as string[])
    );

    if (postIds.length === 0) {
      setLikes([]);
      setComments([]);
      setProfiles([]);
      setLoading(false);
      return;
    }

    const { data: likesData } = await supabase
      .from('feed_likes')
      .select('*')
      .in('post_id', postIds);

    const { data: commentsData } = await supabase
      .from('feed_comments')
      .select('*')
      .in('post_id', postIds)
      .order('created_at', { ascending: true });

    const commentUserIds = Array.from(
      new Set(
        ((commentsData || []) as FeedComment[])
          .map((comment) => comment.user_id)
          .filter(Boolean) as string[]
      )
    );

    const allUserIds = Array.from(new Set([...userIds, ...commentUserIds]));

    if (allUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', allUserIds);

      setProfiles((profilesData || []) as Profile[]);
    } else {
      setProfiles([]);
    }

    setLikes((likesData || []) as FeedLike[]);
    setComments((commentsData || []) as FeedComment[]);
    setLoading(false);
  };

  useEffect(() => {
    loadFeed();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadFeed();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const requireCompleteProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/profile';
      return false;
    }

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !data?.full_name?.trim() || !data?.avatar_url?.trim()) {
      setError('Debes completar tu perfil con nombre y foto antes de comentar.');
      window.location.href = '/profile';
      return false;
    }

    return true;
  };

  const publishPost = async () => {
    if (!currentUserId) {
      setError('Debes iniciar sesión para publicar.');
      return;
    }

    if (!isAdmin) {
      setError('Tu cuenta no tiene permiso para publicar en el feed.');
      return;
    }

    if (!postContent.trim() && !selectedMediaFile) {
      setError('Escribe algo o selecciona una foto/video.');
      return;
    }

    setPosting(true);
    setError(null);

    let mediaUrl: string | null = null;
    let mediaType: 'image' | 'video' | 'none' = 'none';

    try {
      if (selectedMediaFile) {
        mediaType = getMediaType(selectedMediaFile.type);

        if (mediaType === 'none') {
          setError('Solo puedes subir imágenes o videos.');
          setPosting(false);
          return;
        }

        const safeName = selectedMediaFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${currentUserId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('feed-media')
          .upload(filePath, selectedMediaFile, {
            contentType: selectedMediaFile.type,
            upsert: true,
          });

        if (uploadError) {
          setError(uploadError.message);
          setPosting(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('feed-media')
          .getPublicUrl(filePath);

        mediaUrl = normalizeSupabasePublicUrl(publicUrlData.publicUrl);
      }

      const { error: insertError } = await supabase.from('feed_posts').insert([
        {
          user_id: currentUserId,
          content: postContent.trim() || 'Nueva publicación de SM Events.',
          media_url: mediaUrl,
          media_type: mediaType,
        },
      ]);

      if (insertError) {
        setError(insertError.message);
        setPosting(false);
        return;
      }

      setPostContent('');
      setSelectedMediaFile(null);
      setPosting(false);
      await loadFeed();
    } catch (publishError) {
      const message =
        publishError instanceof Error
          ? publishError.message
          : 'Error inesperado publicando en el feed.';

      setError(message);
      setPosting(false);
    }
  };

  const getLikesCount = (postId: string) =>
    likes.filter((like) => like.post_id === postId).length;

  const getCommentsCount = (postId: string) =>
    comments.filter((comment) => comment.post_id === postId).length;

  const getPostComments = (postId: string) =>
    comments.filter((comment) => comment.post_id === postId);

  const hasLikedPost = (postId: string) =>
    likes.some((like) => like.post_id === postId && like.user_id === currentUserId);

  const toggleLike = async (postId: string) => {
    if (!currentUserId) {
      setError('Debes iniciar sesión para dar like.');
      return;
    }

    setLikingPostId(postId);
    setError(null);

    const existingLike = likes.find(
      (like) => like.post_id === postId && like.user_id === currentUserId
    );

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('feed_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        setError(deleteError.message);
        setLikingPostId(null);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('feed_likes').insert([
        {
          post_id: postId,
          user_id: currentUserId,
        },
      ]);

      if (insertError) {
        setError(insertError.message);
        setLikingPostId(null);
        return;
      }
    }

    setLikingPostId(null);
    await loadFeed();
  };

  const submitComment = async (postId: string) => {
    const profileOk = await requireCompleteProfile();

    if (!profileOk) return;

    if (!currentUserId) {
      setError('Debes iniciar sesión para comentar.');
      return;
    }

    const comment = commentInputs[postId]?.trim();

    if (!comment) {
      setError('Escribe un comentario.');
      return;
    }

    setSubmittingCommentId(postId);
    setError(null);

    const { error: commentError } = await supabase.from('feed_comments').insert([
      {
        post_id: postId,
        user_id: currentUserId,
        comment,
      },
    ]);

    if (commentError) {
      setError(commentError.message);
      setSubmittingCommentId(null);
      return;
    }

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setSubmittingCommentId(null);
    await loadFeed();
  };

  const deletePost = async (post: FeedPost) => {
    if (!currentUserId) {
      setError('Debes iniciar sesión para borrar publicaciones.');
      return;
    }

    if (!isAdmin && post.user_id !== currentUserId) {
      setError('No tienes permiso para borrar esta publicación.');
      return;
    }

    const confirmed = window.confirm('¿Seguro que quieres borrar esta publicación del feed?');

    if (!confirmed) return;

    setDeletingPostId(post.id);
    setError(null);

    const { error: deleteError } = await supabase
      .from('feed_posts')
      .delete()
      .eq('id', post.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingPostId(null);
      return;
    }

    setDeletingPostId(null);
    await loadFeed();
  };

  const getProfileName = (userId: string | null | undefined) => {
    if (!userId) return 'Cliente';

    const profile = profilesByUserId[userId];

    return profile?.full_name || 'Cliente';
  };

  const getProfileAvatar = (userId: string | null | undefined) => {
    if (!userId) return null;

    const profile = profilesByUserId[userId];

    return profile?.avatar_url ? normalizeSupabasePublicUrl(profile.avatar_url) : null;
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/cotizar" ctaLabel="Cotizar ahora" />

        <section style={heroCardStyle}>
          <p style={eyebrowStyle}>SM Events</p>
          <h1 style={heroTitleStyle}>Feed</h1>
          <p style={heroTextStyle}>
            Actualizaciones, montajes, eventos y contenido reciente de SM Events.
          </p>
        </section>

        {isAdmin && (
          <section style={composerCardStyle}>
            <div style={composerHeaderStyle}>
              <div style={smAvatarStyle}>SM</div>
              <div>
                <h2 style={composerTitleStyle}>Crear publicación</h2>
                <p style={mutedTextStyle}>Publicarás como SM Events.</p>
              </div>
            </div>

            <textarea
              value={postContent}
              onChange={(event) => setPostContent(event.target.value)}
              placeholder="Escribe una actualización, montaje o anuncio..."
              style={composerInputStyle}
            />

            <div style={composerActionsStyle}>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setSelectedMediaFile(file);
                }}
                style={fileInputStyle}
              />

              <button
                type="button"
                onClick={publishPost}
                disabled={posting}
                style={{
                  ...primaryButtonStyle,
                  opacity: posting ? 0.65 : 1,
                }}
              >
                {posting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>

            {selectedMediaFile && (
              <div style={selectedMediaBoxStyle}>
                Archivo seleccionado: {selectedMediaFile.name}
              </div>
            )}
          </section>
        )}

        {loading && <div style={infoBoxStyle}>Cargando feed...</div>}
        {error && <div style={errorBoxStyle}>{error}</div>}

        {!loading && posts.length === 0 && (
          <section style={emptyCardStyle}>
            <h2 style={emptyTitleStyle}>Todavía no hay publicaciones.</h2>
            <p style={mutedTextStyle}>
              Cuando publiques contenido de SM Events, aparecerá aquí.
            </p>
          </section>
        )}

        {!loading && posts.length > 0 && (
          <section style={feedListStyle}>
            {posts.map((post) => (
              <article key={post.id} style={postCardStyle}>
                <div style={postHeaderStyle}>
                  <div style={smAvatarStyle}>SM</div>

                  <div>
                    <h2 style={postAuthorStyle}>SM Events</h2>
                    <p style={postDateStyle}>{formatDate(post.created_at)}</p>
                  </div>
                </div>

                <p style={postContentStyle}>{post.content}</p>

                {post.media_url && post.media_type === 'image' && (
                  <img
                    src={normalizeSupabasePublicUrl(post.media_url)}
                    alt="Publicación de SM Events"
                    style={postImageStyle}
                  />
                )}

                {post.media_url && post.media_type === 'video' && (
                  <a
                    href={normalizeSupabasePublicUrl(post.media_url)}
                    target="_blank"
                    rel="noreferrer"
                    style={videoCardStyle}
                  >
                    ▶ Abrir video
                  </a>
                )}

                <div style={postFooterStyle}>
                  <button
                    type="button"
                    onClick={() => toggleLike(post.id)}
                    disabled={likingPostId === post.id}
                    style={
                      hasLikedPost(post.id)
                        ? feedActionButtonActiveStyle
                        : feedActionButtonStyle
                    }
                  >
                    {hasLikedPost(post.id) ? '♥' : '♡'} {getLikesCount(post.id)}
                  </button>

                  <span style={feedActionButtonStyle}>
                    💬 {getCommentsCount(post.id)}
                  </span>

                  {(isAdmin || post.user_id === currentUserId) && (
                    <button
                      type="button"
                      onClick={() => deletePost(post)}
                      disabled={deletingPostId === post.id}
                      style={deletePostButtonStyle}
                    >
                      {deletingPostId === post.id ? 'Borrando...' : 'Borrar'}
                    </button>
                  )}
                </div>

                <div style={commentsBoxStyle}>
                  {getPostComments(post.id).length > 0 && (
                    <div style={commentsListStyle}>
                      {getPostComments(post.id).slice(-5).map((comment) => {
                        const avatarUrl = getProfileAvatar(comment.user_id);

                        return (
                          <div key={comment.id} style={commentBubbleStyle}>
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={getProfileName(comment.user_id)}
                                style={commentAvatarStyle}
                              />
                            ) : (
                              <div style={commentAvatarFallbackStyle}>
                                {getProfileName(comment.user_id).slice(0, 1).toUpperCase()}
                              </div>
                            )}

                            <div>
                              <p style={commentAuthorStyle}>
                                {getProfileName(comment.user_id)}
                              </p>
                              <p style={commentTextStyle}>{comment.comment}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={commentInputRowStyle}>
                    <input
                      value={commentInputs[post.id] || ''}
                      onChange={(event) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: event.target.value,
                        }))
                      }
                      placeholder="Escribe un comentario..."
                      style={commentInputStyle}
                    />

                    <button
                      type="button"
                      onClick={() => submitComment(post.id)}
                      disabled={submittingCommentId === post.id}
                      style={commentButtonStyle}
                    >
                      {submittingCommentId === post.id ? '...' : 'Enviar'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  color: '#f8fafc',
  padding: '34px 20px 80px',
  background:
    'radial-gradient(circle at 12% 18%, rgba(168,85,247,0.20), transparent 28%), radial-gradient(circle at 88% 12%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(135deg, #020617 0%, #09090f 48%, #111827 100%)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 820,
  margin: '0 auto',
};

const heroCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(24,24,37,0.88) 42%, rgba(30,27,75,0.86) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 28,
  padding: 24,
  boxShadow: '0 24px 58px rgba(0,0,0,0.30)',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontWeight: 900,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const heroTitleStyle: React.CSSProperties = {
  margin: '10px 0 8px',
  fontSize: 42,
  lineHeight: 1.04,
  letterSpacing: '-0.04em',
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.6,
};

const composerCardStyle: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 24,
  padding: 16,
  background: 'rgba(15,23,42,0.90)',
  border: '1px solid rgba(249,115,22,0.26)',
  display: 'grid',
  gap: 12,
};

const composerHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const composerTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
};

const composerInputStyle: React.CSSProperties = {
  minHeight: 104,
  borderRadius: 18,
  padding: 13,
  background: 'rgba(2,6,23,0.58)',
  border: '1px solid rgba(148,163,184,0.14)',
  color: '#f8fafc',
  fontSize: 14,
  lineHeight: 1.5,
  resize: 'vertical',
};

const composerActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const fileInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 220,
  padding: '11px 12px',
  borderRadius: 14,
  border: '1px solid rgba(250,204,21,0.16)',
  background: 'rgba(2,6,23,0.52)',
  color: '#e5e7eb',
};

const selectedMediaBoxStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 16,
  background: 'rgba(250,204,21,0.08)',
  border: '1px solid rgba(250,204,21,0.16)',
  color: '#fde68a',
  fontWeight: 800,
};

const feedListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  marginTop: 14,
};

const postCardStyle: React.CSSProperties = {
  borderRadius: 24,
  padding: 16,
  background: 'rgba(15,23,42,0.88)',
  border: '1px solid rgba(250,204,21,0.14)',
  display: 'grid',
  gap: 12,
};

const postHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const smAvatarStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(249,115,22,0.18)',
  border: '1px solid rgba(249,115,22,0.34)',
  color: '#fed7aa',
  fontSize: 13,
  fontWeight: 900,
  flexShrink: 0,
};

const postAuthorStyle: React.CSSProperties = {
  margin: 0,
  color: '#ffffff',
  fontSize: 15,
};

const postDateStyle: React.CSSProperties = {
  margin: '2px 0 0',
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 700,
};

const postContentStyle: React.CSSProperties = {
  margin: 0,
  color: '#e5e7eb',
  fontSize: 15,
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap',
};

const postImageStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: 520,
  objectFit: 'cover',
  borderRadius: 18,
  background: 'rgba(2,6,23,0.50)',
};

const videoCardStyle: React.CSSProperties = {
  minHeight: 160,
  borderRadius: 18,
  background: 'rgba(2,6,23,0.58)',
  border: '1px solid rgba(96,165,250,0.22)',
  display: 'grid',
  placeItems: 'center',
  color: '#bfdbfe',
  textDecoration: 'none',
  fontWeight: 900,
};

const postFooterStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  paddingTop: 8,
  borderTop: '1px solid rgba(148,163,184,0.12)',
};

const feedActionButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 11px',
  borderRadius: 999,
  background: 'rgba(2,6,23,0.44)',
  border: '1px solid rgba(148,163,184,0.14)',
  color: '#94a3b8',
  fontSize: 13,
  fontWeight: 900,
  cursor: 'pointer',
};

const feedActionButtonActiveStyle: React.CSSProperties = {
  ...feedActionButtonStyle,
  background: 'rgba(249,115,22,0.16)',
  border: '1px solid rgba(249,115,22,0.28)',
  color: '#fed7aa',
};

const deletePostButtonStyle: React.CSSProperties = {
  ...feedActionButtonStyle,
  background: 'rgba(127,29,29,0.24)',
  border: '1px solid rgba(248,113,113,0.28)',
  color: '#fecaca',
};

const commentsBoxStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const commentsListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
};

const commentBubbleStyle: React.CSSProperties = {
  display: 'flex',
  gap: 9,
  alignItems: 'flex-start',
  padding: 10,
  borderRadius: 14,
  background: 'rgba(2,6,23,0.38)',
  border: '1px solid rgba(148,163,184,0.10)',
};

const commentAvatarStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  objectFit: 'cover',
  flexShrink: 0,
};

const commentAvatarFallbackStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(59,130,246,0.18)',
  color: '#bfdbfe',
  fontWeight: 900,
  flexShrink: 0,
};

const commentAuthorStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontSize: 11,
  fontWeight: 900,
};

const commentTextStyle: React.CSSProperties = {
  margin: '3px 0 0',
  color: '#e5e7eb',
  fontSize: 13,
  lineHeight: 1.45,
};

const commentInputRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
};

const commentInputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 42,
  borderRadius: 999,
  padding: '9px 13px',
  background: 'rgba(2,6,23,0.56)',
  border: '1px solid rgba(148,163,184,0.14)',
  color: '#f8fafc',
  outline: 'none',
};

const commentButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: '0 14px',
  borderRadius: 999,
  border: 'none',
  background: '#f97316',
  color: '#ffffff',
  fontWeight: 900,
  cursor: 'pointer',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 15px',
  borderRadius: 14,
  border: 'none',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  boxShadow: '0 16px 30px rgba(236,72,153,0.22)',
};

const infoBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: '16px',
  borderRadius: 16,
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  color: '#a7b5c9',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: '13px 15px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
  fontWeight: 800,
};

const emptyCardStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 18,
  borderRadius: 22,
  background: 'rgba(15,23,42,0.84)',
  border: '1px solid rgba(250,204,21,0.14)',
};

const emptyTitleStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 20,
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
};
