import React, { useState, useEffect, useCallback } from 'react';
import { storage, db } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, onValue, set } from 'firebase/database';
import { useLocalStorage } from '../hooks/useLocalStorage';

const initialPostState = {
  name: '',
  uid: '',
  title: '',
  content: '',
  photo: '',
};

const createEmptyComment = () => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  author: '',
  text: '',
  replies: [],
});

const FriendsPage = ({ isDarkMode }) => {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(initialPostState);
  const [showComments, setShowComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [likedPostIds, setLikedPostIds] = useLocalStorage(
    'friends-liked-posts',
    []
  );

  // Realtime Database에 현재 posts 배열을 저장하는 헬퍼
  const savePostsToDB = useCallback(
    (nextPosts) => {
      try {
        const postsRef = dbRef(db, 'friends/posts');
        const byId = {};
        nextPosts.forEach((p) => {
          if (p?.id) {
            byId[p.id] = p;
          }
        });
        set(postsRef, byId);
      } catch (err) {
        console.error('Failed to save posts to Realtime DB', err);
      }
    },
    []
  );

  // 마운트 시 한 번, Realtime DB에서 기존 글 목록 불러오기
  useEffect(() => {
    const postsRef = dbRef(db, 'friends/posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPosts([]);
        return;
      }
      const loaded = Object.values(data).sort(
        (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')
      );
      setPosts(loaded);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setForm(initialPostState);
    setProfileFile(null);
    setProfilePreview('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim()])
    );
    if (!trimmed.name || !trimmed.uid || !trimmed.title || !trimmed.content) {
      alert('이름, UID, 제목, 내용을 모두 입력해 주세요.');
      return;
    }

    let photoUrl = form.photo || '';

    // 새 파일이 선택되어 있으면 Storage에 업로드
    if (profileFile) {
      try {
        setIsUploading(true);
        const ext = profileFile.name.split('.').pop() || 'jpg';
        const fileRef = storageRef(
          storage,
          `friends/images/${trimmed.uid || 'anon'}_${Date.now()}.${ext}`
        );
        const snapshot = await uploadBytes(fileRef, profileFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error(err);
        alert('이미지를 업로드하는 중 문제가 발생했습니다.');
      } finally {
        setIsUploading(false);
      }
    }

    const newPost = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      ...trimmed,
      photo: photoUrl,
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      comments: [],
    };
    setPosts((prev) => {
      const updated = [newPost, ...prev];
      savePostsToDB(updated);
      return updated;
    });

    resetForm();
  };

  const handleProfileFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 간단한 이미지 확장자 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setProfileFile(file);

    // 미리보기 URL 생성
    const previewUrl = URL.createObjectURL(file);
    setProfilePreview(previewUrl);
  };

  const handleToggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleLike = (postId) => {
    // 이미 이 기기에서 좋아요 한 글이면 무시
    if (likedPostIds.includes(postId)) return;

    setPosts((prev) => {
      const updated = prev.map((p) =>
        p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
      );
      savePostsToDB(updated);
      return updated;
    });

    // 로컬 스토리지에 이 기기에서 좋아요한 글 ID 기록
    setLikedPostIds((prev) => [...prev, postId]);
  };

  const handleCommentChange = (postId, value) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  };

  const addComment = (postId) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;

    const newComment = {
      ...createEmptyComment(),
      text,
      author: '익명',
    };

    setPosts((prev) => {
      const updated = prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [...(p.comments || []), newComment] }
          : p
      );
      savePostsToDB(updated);
      return updated;
    });
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  };

  const countAllComments = (comments = []) => comments.length;

  const styles = {
    page: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '16px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      backgroundColor: isDarkMode ? '#0b1120' : '#f8fafc',
      color: isDarkMode ? '#e5e7eb' : '#0f172a',
    },
    layout: {
      display: 'flex',
      gap: '16px',
      height: '100%',
      flexDirection: 'column',
    },
    header: {
      marginBottom: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
    },
    form: {
      backgroundColor: isDarkMode ? '#020617' : '#ffffff',
      borderRadius: '12px',
      padding: '12px 14px',
      boxShadow: isDarkMode
        ? '0 10px 30px rgba(15,23,42,0.9)'
        : '0 8px 20px rgba(15,23,42,0.08)',
      border: isDarkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    formRow: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    input: {
      flex: 1,
      minWidth: '120px',
      padding: '6px 10px',
      borderRadius: '8px',
      border: isDarkMode ? '1px solid #1e293b' : '1px solid #cbd5f5',
      backgroundColor: isDarkMode ? '#020617' : '#f8fafc',
      color: isDarkMode ? '#e5e7eb' : '#0f172a',
      fontSize: '13px',
    },
    textarea: {
      width: '100%',
      minHeight: '70px',
      resize: 'vertical',
      padding: '6px 10px',
      borderRadius: '8px',
      border: isDarkMode ? '1px solid #1e293b' : '1px solid #cbd5f5',
      backgroundColor: isDarkMode ? '#020617' : '#f8fafc',
      color: isDarkMode ? '#e5e7eb' : '#0f172a',
      fontSize: '13px',
    },
    submitBtn: {
      alignSelf: 'flex-end',
      padding: '6px 14px',
      borderRadius: '999px',
      border: 'none',
      cursor: 'pointer',
      background:
        'linear-gradient(135deg, #3b82f6, #22c55e, #eab308)',
      color: '#0f172a',
      fontWeight: 'bold',
      fontSize: '13px',
      boxShadow: '0 8px 20px rgba(37,99,235,0.35)',
    },
    uploadHint: {
      fontSize: '11px',
      color: isDarkMode ? '#9ca3af' : '#64748b',
    },
    listWrapper: {
      flex: 1,
      overflowY: 'auto',
      paddingRight: '4px',
      marginTop: '8px',
    },
    postCard: {
      backgroundColor: isDarkMode ? '#020617' : '#ffffff',
      borderRadius: '14px',
      padding: '10px 12px',
      marginBottom: '10px',
      border: isDarkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
      boxShadow: isDarkMode
        ? '0 8px 24px rgba(15,23,42,0.85)'
        : '0 6px 18px rgba(15,23,42,0.08)',
    },
    postHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      marginBottom: '6px',
    },
    postUser: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      minWidth: 0,
    },
    userText: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
    },
    name: {
      fontSize: '13px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
    uid: {
      fontSize: '11px',
      color: isDarkMode ? '#64748b' : '#64748b',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
    postMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '11px',
      color: isDarkMode ? '#64748b' : '#6b7280',
    },
    badge: {
      padding: '2px 6px',
      borderRadius: '999px',
      backgroundColor: isDarkMode ? '#0f172a' : '#eff6ff',
      border: isDarkMode ? '1px solid #1e293b' : '1px solid #bfdbfe',
    },
    counts: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '11px',
    },
    countChip: {
      padding: '2px 6px',
      borderRadius: '999px',
      backgroundColor: isDarkMode ? '#020617' : '#f1f5f9',
    },
    titleRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px',
      marginTop: '2px',
    },
    titleText: {
      fontSize: '14px',
      fontWeight: 700,
      color: isDarkMode ? '#e5e7eb' : '#0f172a',
    },
    actions: {},
    likeBtn: {
      fontSize: '11px',
      padding: '2px 6px',
      borderRadius: '999px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: '#f97316',
      color: '#0f172a',
      fontWeight: 600,
    },
    content: {
      fontSize: '13px',
      lineHeight: 1.5,
      whiteSpace: 'pre-wrap',
      marginBottom: '6px',
    },
    imageWrapper: {
      marginTop: '6px',
      marginBottom: '4px',
      borderRadius: '10px',
      overflow: 'hidden',
      maxHeight: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#020617' : '#f1f5f9',
    },
    postImage: {
      width: '100%',
      height: 'auto',
      maxHeight: '200px',
      objectFit: 'contain',
      display: 'block',
    },
    commentsSection: {
      marginTop: '6px',
      borderTop: isDarkMode ? '1px solid #1f2937' : '1px solid #e5e7eb',
      paddingTop: '6px',
    },
    commentInputRow: {
      display: 'flex',
      gap: '4px',
      marginBottom: '6px',
    },
    commentInput: {
      flex: 1,
      padding: '4px 8px',
      borderRadius: '999px',
      border: isDarkMode ? '1px solid #1e293b' : '1px solid #cbd5f5',
      backgroundColor: isDarkMode ? '#020617' : '#f8fafc',
      color: isDarkMode ? '#e5e7eb' : '#0f172a',
      fontSize: '12px',
    },
    commentBtn: {
      fontSize: '11px',
      padding: '3px 8px',
      borderRadius: '999px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: '#22c55e',
      color: '#022c22',
      fontWeight: 600,
    },
    commentList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      maxHeight: '160px',
      overflowY: 'auto',
      paddingRight: '2px',
    },
    comment: {
      fontSize: '12px',
      padding: '4px 6px',
      borderRadius: '10px',
      backgroundColor: isDarkMode ? '#020617' : '#f8fafc',
      border: isDarkMode ? '1px solid #1e293b' : '1px solid #e5e7eb',
    },
    commentHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2px',
    },
    commentAuthor: {
      fontWeight: 600,
    },
    commentActions: {
      display: 'flex',
      gap: '4px',
      fontSize: '11px',
    },
    replyList: {
      marginTop: '3px',
      paddingLeft: '10px',
      borderLeft: isDarkMode ? '1px dashed #1e293b' : '1px dashed #cbd5f5',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    },
    replyInputRow: {
      display: 'flex',
      gap: '4px',
      marginTop: '3px',
    },
    replyInput: {
      flex: 1,
      padding: '3px 6px',
      borderRadius: '999px',
      border: isDarkMode ? '1px solid #1e293b' : '1px solid #cbd5f5',
      backgroundColor: isDarkMode ? '#020617' : '#f8fafc',
      color: isDarkMode ? '#e5e7eb' : '#0f172a',
      fontSize: '11px',
    },
    replyBtn: {
      fontSize: '11px',
      padding: '2px 6px',
      borderRadius: '999px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: '#38bdf8',
      color: '#0f172a',
      fontWeight: 600,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>👥 친구 찾기</div>
        <button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          style={{
            padding: '6px 10px',
            borderRadius: '999px',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer',
            backgroundColor: isFormOpen ? '#0f172a' : '#22c55e',
            color: isFormOpen ? '#e5e7eb' : '#022c22',
            fontWeight: 600,
          }}
        >
          {isFormOpen ? '닫기' : '글쓰기'}
        </button>
      </div>

      {isFormOpen && (
        <div style={styles.form}>
          <div style={styles.formRow}>
            <input
              style={styles.input}
              name="name"
              placeholder="이름"
              value={form.name}
              onChange={handleChange}
            />
            <input
              style={styles.input}
              name="uid"
              placeholder="게임 UID / 코드"
              value={form.uid}
              onChange={handleChange}
            />
          </div>
          <div style={styles.formRow}>
            <input
              style={styles.input}
              name="title"
              placeholder="제목 (예: 밤에 같이 농사하실 분!)"
              value={form.title}
              onChange={handleChange}
            />
          </div>
          <textarea
            style={styles.textarea}
            name="content"
            placeholder="하고 싶은 말, 시간대, 조건 등을 자유롭게 적어 주세요."
            value={form.content}
            onChange={handleChange}
          />
          <div style={{ marginTop: '4px' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileFileChange}
              style={{ width: '100%', fontSize: '11px' }}
            />
            <div style={styles.uploadHint}>
              폰/PC에서 이미지를 선택하면 함께 업로드됩니다. (선택 안 해도 글은 등록돼요)
            </div>
            {profilePreview && (
              <div
                style={{
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '11px' }}>이미지 미리보기</span>
                <img
                  src={profilePreview}
                  alt="이미지 미리보기"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '8px',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
          </div>
          <button 
            type="button"
            onClick={handleSubmit}
            style={styles.submitBtn} 
            disabled={isUploading}
          >
            {isUploading ? '이미지 업로드 중...' : '글 올리기'}
          </button>
        </div>
      )}

      <div style={styles.listWrapper}>
        {posts.map((post) => {
          const totalComments = countAllComments(post.comments);
          const isCommentsOpen = showComments[post.id] || false;
          const created =
            post.createdAt &&
            new Date(post.createdAt).toLocaleString('ko-KR', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });

          return (
            <div key={post.id} style={styles.postCard}>
              <div style={styles.postHeader}>
                <div style={styles.postUser}>
                  <span style={styles.name}>{post.name}</span>
                  <span style={styles.uid}>{post.uid}</span>
                </div>
                <div style={styles.postMeta}>
                  {created && <span style={styles.badge}>{created}</span>}
                  <div style={styles.counts}>
                    <span style={styles.countChip}>조회 {post.views}</span>
                    <span style={styles.countChip}>좋아요 {post.likes}</span>
                    <span style={styles.countChip}>
                      댓글 {totalComments}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.titleRow}>
                <div style={styles.titleText}>
                  {post.title}
                </div>
                <button
                  type="button"
                  style={styles.likeBtn}
                  onClick={() => handleLike(post.id)}
                >
                  👍 좋아요
                </button>
              </div>

              <div style={styles.content}>{post.content}</div>
              
              {post.photo && (
                <div style={styles.imageWrapper}>
                  <img
                    src={post.photo}
                    alt={post.title}
                    style={styles.postImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {!isCommentsOpen ? (
                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleComments(post.id)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                      color: isDarkMode ? '#e5e7eb' : '#0f172a',
                      fontWeight: 600,
                    }}
                  >
                    댓글 보기 ({totalComments})
                  </button>
                </div>
              ) : (
                <div style={styles.commentsSection}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '6px'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                      댓글 {totalComments}개
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleComments(post.id)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                        color: isDarkMode ? '#e5e7eb' : '#0f172a',
                        fontWeight: 600,
                      }}
                    >
                      숨기기
                    </button>
                  </div>

                  <div style={styles.commentList}>
                    {post.comments.map((c) => (
                      <div key={c.id} style={styles.comment}>
                        <div style={styles.commentHeader}>
                          <span style={styles.commentAuthor}>
                            {c.author || '익명'}
                          </span>
                        </div>
                        <div>{c.text}</div>
                      </div>
                    ))}
                  </div>

                  <div style={styles.commentInputRow}>
                    <input
                      style={styles.commentInput}
                      placeholder="댓글을 입력하세요"
                      value={commentDrafts[post.id] || ''}
                      onChange={(e) =>
                        handleCommentChange(post.id, e.target.value)
                      }
                    />
                    <button
                      type="button"
                      style={styles.commentBtn}
                      onClick={() => addComment(post.id)}
                    >
                      등록
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {posts.length === 0 && (
          <div
            style={{
              fontSize: '13px',
              color: isDarkMode ? '#64748b' : '#9ca3af',
              textAlign: 'center',
              marginTop: '16px',
            }}
          >
            첫 친구 찾기 글을 남겨 보세요!
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;