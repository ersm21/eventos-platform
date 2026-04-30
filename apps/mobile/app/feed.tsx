import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

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

type SelectedMedia = {
  uri: string;
  name: string;
  mimeType: string;
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

export default function FeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [likes, setLikes] = useState<FeedLike[]>([]);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [postContent, setPostContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadAdminStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUserId(user?.id ?? null);

    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data, error: adminError } = await supabase
      .from('feed_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError) {
      setIsAdmin(false);
      return;
    }

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
      setRefreshing(false);
      return;
    }

    const loadedPosts = (postsData || []) as FeedPost[];
    setPosts(loadedPosts);

    const postIds = loadedPosts.map((post) => post.id);

    if (postIds.length === 0) {
      setLikes([]);
      setComments([]);
      setLoading(false);
      setRefreshing(false);
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

    setLikes((likesData || []) as FeedLike[]);
    setComments((commentsData || []) as FeedComment[]);

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const refreshFeed = async () => {
    setRefreshing(true);
    await loadFeed();
  };

  const pickMedia = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'video/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];

    setSelectedMedia({
      uri: asset.uri,
      name: asset.name || `feed-media-${Date.now()}`,
      mimeType: asset.mimeType || 'application/octet-stream',
    });
  };

  const clearMedia = () => {
    setSelectedMedia(null);
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

    if (!postContent.trim() && !selectedMedia) {
      setError('Escribe algo o selecciona una foto/video.');
      return;
    }

    setPosting(true);
    setError(null);

    let mediaUrl: string | null = null;
    let mediaType: 'image' | 'video' | 'none' = 'none';

    try {
      if (selectedMedia) {
        mediaType = getMediaType(selectedMedia.mimeType);

        if (mediaType === 'none') {
          setError('Solo puedes subir imágenes o videos.');
          setPosting(false);
          return;
        }

        const safeName = selectedMedia.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${currentUserId}/${Date.now()}-${safeName}`;

        const response = await fetch(selectedMedia.uri);
        const fileBlob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('feed-media')
          .upload(filePath, fileBlob, {
            contentType: selectedMedia.mimeType,
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

        mediaUrl = publicUrlData.publicUrl;
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
      setSelectedMedia(null);
      setPosting(false);
      Alert.alert('Publicado', 'Tu publicación fue subida al feed.');
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

    Alert.alert('Borrar publicación', '¿Seguro que quieres borrar esta publicación del feed?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
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
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#020617', '#070914', '#111827']} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshFeed} tintColor="#fbbf24" />
          }
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>SM Events</Text>
              <Text style={styles.title}>Feed</Text>
              <Text style={styles.subtitle}>
                Actualizaciones, montajes, eventos y contenido reciente.
              </Text>
            </View>

            <Link href="/" asChild>
              <Pressable style={styles.backButton}>
                <Text style={styles.backButtonText}>Inicio</Text>
              </Pressable>
            </Link>
          </View>

          {isAdmin && (
            <View style={styles.composerCard}>
              <View style={styles.composerHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>SM</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.composerTitle}>Crear publicación</Text>
                  <Text style={styles.composerSubtitle}>Publicarás como SM Events</Text>
                </View>
              </View>

              <TextInput
                value={postContent}
                onChangeText={setPostContent}
                placeholder="Escribe una actualización, montaje o anuncio..."
                placeholderTextColor="#64748b"
                multiline
                style={styles.composerInput}
              />

              {selectedMedia && (
                <View style={styles.selectedMediaBox}>
                  <Text style={styles.selectedMediaText}>
                    {getMediaType(selectedMedia.mimeType) === 'video' ? 'Video' : 'Imagen'} seleccionada: {selectedMedia.name}
                  </Text>

                  <Pressable onPress={clearMedia} style={styles.removeMediaButton}>
                    <Text style={styles.removeMediaText}>Quitar</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.composerActions}>
                <Pressable onPress={pickMedia} style={styles.secondaryActionButton}>
                  <Text style={styles.secondaryActionText}>Foto / video</Text>
                </Pressable>

                <Pressable
                  onPress={publishPost}
                  disabled={posting}
                  style={[styles.publishButton, posting && styles.buttonDisabled]}
                >
                  <Text style={styles.publishButtonText}>
                    {posting ? 'Publicando...' : 'Publicar'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {loading && (
            <View style={styles.infoBox}>
              <ActivityIndicator color="#fbbf24" />
              <Text style={styles.infoText}>Cargando feed...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!loading && !error && posts.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Todavía no hay publicaciones.</Text>
              <Text style={styles.emptyText}>
                Cuando publiques contenido de SM Events, aparecerá aquí para los clientes.
              </Text>
            </View>
          )}

          {!loading && posts.length > 0 && (
            <View style={styles.feedList}>
              {posts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>SM</Text>
                    </View>

                    <View style={styles.postHeaderText}>
                      <Text style={styles.postAuthor}>SM Events</Text>
                      <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
                    </View>
                  </View>

                  <Text style={styles.postContent}>{post.content}</Text>

                  {post.media_url && post.media_type === 'image' && (
                    <Image source={{ uri: post.media_url }} style={styles.postImage} resizeMode="cover" />
                  )}

                  {post.media_url && post.media_type === 'video' && (
                    <Pressable
                      style={styles.videoCard}
                      onPress={() => Linking.openURL(post.media_url || '')}
                    >
                      <Text style={styles.videoIcon}>▶</Text>
                      <Text style={styles.videoText}>Abrir video</Text>
                    </Pressable>
                  )}

                  <View style={styles.postFooter}>
                    <Pressable
                      onPress={() => toggleLike(post.id)}
                      disabled={likingPostId === post.id}
                      style={[
                        styles.feedActionButton,
                        hasLikedPost(post.id) && styles.feedActionButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.feedActionText,
                          hasLikedPost(post.id) && styles.feedActionTextActive,
                        ]}
                      >
                        {hasLikedPost(post.id) ? '♥' : '♡'} {getLikesCount(post.id)}
                      </Text>
                    </Pressable>

                    <View style={styles.feedActionButton}>
                      <Text style={styles.feedActionText}>💬 {getCommentsCount(post.id)}</Text>
                    </View>

                    {(isAdmin || post.user_id === currentUserId) && (
                      <Pressable
                        onPress={() => deletePost(post)}
                        disabled={deletingPostId === post.id}
                        style={styles.deletePostButton}
                      >
                        <Text style={styles.deletePostText}>
                          {deletingPostId === post.id ? 'Borrando...' : 'Borrar'}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.commentsBox}>
                    {getPostComments(post.id).length > 0 && (
                      <View style={styles.commentsList}>
                        {getPostComments(post.id).slice(-3).map((comment) => (
                          <View key={comment.id} style={styles.commentBubble}>
                            <Text style={styles.commentAuthor}>Cliente</Text>
                            <Text style={styles.commentText}>{comment.comment}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.commentInputRow}>
                      <TextInput
                        value={commentInputs[post.id] || ''}
                        onChangeText={(value) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: value }))
                        }
                        placeholder="Escribe un comentario..."
                        placeholderTextColor="#64748b"
                        style={styles.commentInput}
                      />

                      <Pressable
                        onPress={() => submitComment(post.id)}
                        disabled={submittingCommentId === post.id}
                        style={styles.commentButton}
                      >
                        <Text style={styles.commentButtonText}>
                          {submittingCommentId === post.id ? '...' : 'Enviar'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 18, paddingBottom: 118, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  eyebrow: { color: '#fbbf24', fontSize: 12, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 36, lineHeight: 39, fontWeight: '900', letterSpacing: -1.2, marginTop: 4 },
  subtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 260 },
  backButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.86)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.16)' },
  backButtonText: { color: '#fde68a', fontSize: 12, fontWeight: '900' },

  composerCard: { borderRadius: 24, padding: 15, backgroundColor: 'rgba(15,23,42,0.90)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.26)', gap: 12 },
  composerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  composerTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  composerSubtitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginTop: 2 },
  composerInput: { minHeight: 92, borderRadius: 18, padding: 13, backgroundColor: 'rgba(2,6,23,0.58)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', color: '#f8fafc', fontSize: 14, lineHeight: 20, textAlignVertical: 'top' },
  selectedMediaBox: { padding: 12, borderRadius: 16, backgroundColor: 'rgba(250,204,21,0.08)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.16)', gap: 8 },
  selectedMediaText: { color: '#fde68a', fontSize: 13, fontWeight: '800' },
  removeMediaButton: { alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(127,29,29,0.30)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.30)' },
  removeMediaText: { color: '#fecaca', fontSize: 12, fontWeight: '900' },
  composerActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  secondaryActionButton: { flex: 1, minWidth: 130, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 13, borderRadius: 15, backgroundColor: 'rgba(2,6,23,0.52)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.16)' },
  secondaryActionText: { color: '#fde68a', fontSize: 13, fontWeight: '900' },
  publishButton: { flex: 1, minWidth: 130, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 13, borderRadius: 15, backgroundColor: '#f97316' },
  publishButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  buttonDisabled: { opacity: 0.6 },

  infoBox: { padding: 18, borderRadius: 20, backgroundColor: 'rgba(15,23,42,0.82)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.14)', gap: 10, alignItems: 'center' },
  infoText: { color: '#cbd5e1', fontSize: 14, fontWeight: '800' },
  errorBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(127,29,29,0.30)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.32)' },
  errorText: { color: '#fecaca', fontWeight: '800' },
  emptyCard: { padding: 20, borderRadius: 22, backgroundColor: 'rgba(15,23,42,0.84)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.14)', gap: 8 },
  emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  emptyText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  feedList: { gap: 14 },
  postCard: { borderRadius: 24, padding: 15, backgroundColor: 'rgba(15,23,42,0.88)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.14)', gap: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,115,22,0.18)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.34)' },
  avatarText: { color: '#fed7aa', fontSize: 13, fontWeight: '900' },
  postHeaderText: { flex: 1 },
  postAuthor: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  postDate: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginTop: 2 },
  postContent: { color: '#e5e7eb', fontSize: 14, lineHeight: 21 },
  postImage: { width: '100%', height: 240, borderRadius: 18, backgroundColor: 'rgba(2,6,23,0.50)' },
  videoCard: { minHeight: 160, borderRadius: 18, backgroundColor: 'rgba(2,6,23,0.58)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.22)', alignItems: 'center', justifyContent: 'center', gap: 8 },
  videoIcon: { color: '#fbbf24', fontSize: 34, fontWeight: '900' },
  videoText: { color: '#bfdbfe', fontSize: 14, fontWeight: '900' },
  postFooter: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.12)' },
  footerText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  feedActionButton: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(2,6,23,0.44)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)' },
  feedActionButtonActive: { backgroundColor: 'rgba(249,115,22,0.16)', borderColor: 'rgba(249,115,22,0.28)' },
  feedActionText: { color: '#94a3b8', fontSize: 13, fontWeight: '900' },
  feedActionTextActive: { color: '#fed7aa' },
  deletePostButton: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(127,29,29,0.24)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.28)' },
  deletePostText: { color: '#fecaca', fontSize: 13, fontWeight: '900' },
  commentsBox: { gap: 10, paddingTop: 2 },
  commentsList: { gap: 8 },
  commentBubble: { padding: 10, borderRadius: 14, backgroundColor: 'rgba(2,6,23,0.38)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.10)' },
  commentAuthor: { color: '#fbbf24', fontSize: 11, fontWeight: '900', marginBottom: 3 },
  commentText: { color: '#e5e7eb', fontSize: 13, lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  commentInput: { flex: 1, minHeight: 42, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: 'rgba(2,6,23,0.56)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', color: '#f8fafc', fontSize: 13 },
  commentButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#f97316' },
  commentButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
});
