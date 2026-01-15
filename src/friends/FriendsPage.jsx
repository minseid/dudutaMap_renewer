import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref, onValue, set, push, runTransaction, remove } from 'firebase/database';

const CATEGORIES = ['🧑‍🤝‍🧑친구찾아요', '🎣바다낚시', '🐛곤충유인', '🪿꽥꽥이 점핑', '🫧버블머신'];
const VILLAGE_CATEGORIES = ['바다낚시', '곤충유인', '꽥꽥이 점핑', '버블머신'];

const BoardPage = ({ isDarkMode }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [posts, setPosts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState([]);
  const [activeFilter, setActiveFilter] = useState('전체');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const postsPerPage = isMobile ? 6 : 9; 
  const [currentPage, setCurrentPage] = useState(1);
  const [myCreatedPostIds, setMyCreatedPostIds] = useState([]);

  useEffect(() => {
    const savedPosts = localStorage.getItem('myCreatedPosts');
    if (savedPosts) {
      setMyCreatedPostIds(JSON.parse(savedPosts));
    }
  }, []);

  // 폼 데이터 수정 (startMinutes -> startTime)
  const [formData, setFormData] = useState({
    name: '',
    uid: '',
    villageNumber: '', 
    password: '',       
    startTime: '',      // ★ 변경: 구체적인 시작 시간 (예: "14:30")
    title: '',
    content: '',
    category: CATEGORIES[0],
  });

  const hoverStyles = `
    .image-card-container { position: relative; overflow: hidden; height: 300px; }
    .image-card-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: filter 0.3s ease; z-index: 0; }
    .image-card-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; opacity: 0; background-color: rgba(0, 0, 0, 0.6); transition: all 0.3s ease; display: flex; flex-direction: column; justify-content: space-between; padding: 20px; box-sizing: border-box; color: white; backdrop-filter: blur(0px); }
    .image-card-container:hover .image-card-bg { filter: blur(4px) brightness(0.8); }
    .image-card-container:hover .image-card-overlay { opacity: 1; backdrop-filter: blur(2px); }
  `;

  useEffect(() => {
    const postsRef = ref(db, 'board/posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { setPosts([]); return; }
      
      const now = new Date();
      const loadedPosts = [];

      // ★ 데이터 순회하면서 만료된 글 삭제 & 유효한 글만 배열에 담기
      Object.entries(data).forEach(([key, value]) => {
        let isExpired = false;

        // 모임 시간(scheduledTime)이 있는 경우 만료 체크
        if (value.scheduledTime) {
          const scheduledDate = new Date(value.scheduledTime);
          // 만료 시간 = 시작 시간 + 30분 (30 * 60 * 1000 밀리초)
          const expirationDate = new Date(scheduledDate.getTime() + 30 * 60000);

          // 현재 시간이 만료 시간보다 지났으면
          if (now > expirationDate) {
            isExpired = true;
            // DB에서 해당 글 삭제 (자동 삭제)
            remove(ref(db, `board/posts/${key}`)).catch(err => console.error("자동 삭제 실패", err));
          }
        }

        // 만료되지 않은 글만 목록에 추가
        if (!isExpired) {
          loadedPosts.push({ id: key, ...value });
        }
      });
      
      // ★ 정렬 로직 (이전과 동일: 임박한 모임 우선)
      loadedPosts.sort((a, b) => {
        const timeA = a.scheduledTime ? new Date(a.scheduledTime) : null;
        const timeB = b.scheduledTime ? new Date(b.scheduledTime) : null;
        
        const isFutureA = timeA && timeA > now;
        const isFutureB = timeB && timeB > now;

        if (isFutureA && isFutureB) return timeA - timeB; 
        if (isFutureA && !isFutureB) return -1;
        if (!isFutureA && isFutureB) return 1;

        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setPosts(loadedPosts);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedLikes = localStorage.getItem('myLikedPosts');
    if (savedLikes) setLikedPostIds(JSON.parse(savedLikes));
  }, []);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'villageNumber') {
        const numbersOnly = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, [name]: numbersOnly }));
        return;
      }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isVillageCategory = VILLAGE_CATEGORIES.includes(formData.category);

    // 유효성 검사 (제목 필수)
    if (!formData.title) {
      alert('제목을 입력해주세요!');
      return;
    }

    // 일반 글일 때만 닉네임, 내용 필수
    if (!isVillageCategory) {
      if (!formData.name || !formData.content) {
        alert('닉네임과 내용을 입력해주세요!');
        return;
      }
    }

    // 모임 글일 때만 마을 번호 필수
    if (isVillageCategory && !formData.villageNumber) {
      alert('마을 번호를 입력해주세요!');
      return;
    }

    if (isUploading) return;
    setIsUploading(true);

    try {
      let imageUrl = '';
      if (!isVillageCategory && imageFile) {
        const imageRef = storageRef(storage, `board/images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      let scheduledTime = '';
      if (formData.startTime) {
        const [hours, minutes] = formData.startTime.split(':');
        const now = new Date();
        const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));
        scheduledTime = eventDate.toISOString();
      }

      const postsRef = ref(db, 'board/posts');
      const newPostRef = push(postsRef);
      
      await set(newPostRef, {
        ...formData,
        // ★ 수정: 모임이면 닉네임 없이('') 저장 (기존 '모임장' 제거)
        name: isVillageCategory ? '' : formData.name,
        content: isVillageCategory ? '' : formData.content, 
        uid: isVillageCategory ? '' : formData.uid, 
        villageNumber: isVillageCategory ? formData.villageNumber : '',
        // password 필드 저장 제거
        scheduledTime: isVillageCategory ? scheduledTime : '',
        startTime: '', 
        imageUrl: imageUrl,
        createdAt: new Date().toISOString(),
        likes: 0,
      });

      const newPostId = newPostRef.key;
      const updatedMyPosts = [...myCreatedPostIds, newPostId];
      setMyCreatedPostIds(updatedMyPosts);
      localStorage.setItem('myCreatedPosts', JSON.stringify(updatedMyPosts));

      // 초기화
      setFormData({ 
        name: '', uid: '', villageNumber: '', password: '', startTime: '', 
        title: '', content: '', category: CATEGORIES[0] 
      });
      setImageFile(null);
      setImagePreview('');
      setIsFormOpen(false);
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

const handleDeletePost = async (postId) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await remove(ref(db, `board/posts/${postId}`));
        alert("삭제되었습니다.");
        // (선택사항) 로컬 스토리지 목록에서도 제거하고 싶다면 여기서 처리 가능하나, 
        // 굳이 안 해도 기능상 문제는 없습니다.
      } catch (error) {
        console.error("삭제 실패:", error);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };
  
  const handleLikeToggle = async (postId) => {
    const isAlreadyLiked = likedPostIds.includes(postId);
    const postLikesRef = ref(db, `board/posts/${postId}/likes`);
    try {
      await runTransaction(postLikesRef, (curr) => {
        const val = curr || 0;
        return isAlreadyLiked ? (val > 0 ? val - 1 : 0) : val + 1;
      });
      let updatedLikes = isAlreadyLiked 
        ? likedPostIds.filter(id => id !== postId) 
        : [...likedPostIds, postId];
      setLikedPostIds(updatedLikes);
      localStorage.setItem('myLikedPosts', JSON.stringify(updatedLikes));
    } catch (error) { console.error(error); }
  };

  const filteredPosts = posts.filter((post) => {
    // ★ 추가: 필터가 '내가 쓴 글'이면 -> 내 로컬 목록(myCreatedPostIds)에 있는 ID인지 확인
    if (activeFilter === '내가 쓴 글') {
      return myCreatedPostIds.includes(post.id);
    }

    // 기존 로직
    if (activeFilter === '전체') return true;
    return post.category === activeFilter;
  });

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // 오전/오후 표시 추가
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12; // 0시를 12시로 표시
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${ampm} ${displayHours}:${displayMinutes}`;
  };

  const styles = {
    container: { padding: '24px', backgroundColor: isDarkMode ? '#262626' : '#f8fafc', minHeight: '100vh', color: isDarkMode ? '#e2e8f0' : '#1e293b' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '24px', fontWeight: 'bold' },
    writeButton: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    
    filterBar: { display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px', flexWrap: 'wrap' },
    filterButton: (isActive) => ({ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', backgroundColor: isActive ? '#3b82f6' : (isDarkMode ? '#4f4f4f' : '#e2e8f0'), color: isActive ? '#fff' : (isDarkMode ? '#94a3b8' : '#475569'), transition: 'all 0.2s' }),

    formContainer: { marginBottom: '32px', padding: '20px', backgroundColor: isDarkMode ? '#3d3d3d' : '#ffffff', borderRadius: '12px', border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' },
    row: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    input: { flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: isDarkMode ? '#2d2d2d' : '#fff', color: isDarkMode ? '#fff' : '#000', boxSizing: 'border-box', minWidth: '120px' },
    select: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: isDarkMode ? '#2d2d2d' : '#fff', color: isDarkMode ? '#fff' : '#000', boxSizing: 'border-box', cursor: 'pointer' },
    textarea: { width: '100%', minHeight: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: isDarkMode ? '#2d2d2d' : '#fff', color: isDarkMode ? '#fff' : '#000', resize: 'vertical', boxSizing: 'border-box' },
    submitBtn: { alignSelf: 'flex-end', padding: '8px 20px', backgroundColor: isUploading ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: isUploading ? 'not-allowed' : 'pointer', fontWeight: 'bold' },
    
    gridContainer: { display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? '10px' : '20px', width: '100%' },    cardBase: { backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff', borderRadius: '16px', border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' },
    textCardContentPadding: { padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', minHeight: '300px' },
    categoryBadge: (isOverlay) => ({ display: 'inline-block', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px', backgroundColor: isOverlay ? 'rgba(255,255,255,0.2)' : (isDarkMode ? '#414141' : '#e2e8f0'), color: isOverlay ? '#fff' : (isDarkMode ? '#cbd5e1' : '#475569'), fontWeight: 'bold' }),
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' },
    cardTitle: { fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' },
    cardContent: { fontSize: '14px', lineHeight: '1.6', flex: 1, marginBottom: '16px', whiteSpace: 'pre-wrap', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical' },
    cardFooter: { borderTop: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' },
    overlayFooter: { borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#e2e8f0' },
    nameBadge: { backgroundColor: isDarkMode ? '#414141' : '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', fontSize: '12px' },
    likeButton: (isLiked, isOverlay = false) => ({ border: isLiked ? '1px solid #f87171' : (isOverlay ? '1px solid rgba(255,255,255,0.5)' : (isDarkMode ? '1px solid #334155' : '1px solid #cbd5e1')), backgroundColor: isLiked ? 'rgba(248, 113, 113, 0.1)' : 'transparent', color: isLiked ? '#f87171' : (isOverlay ? '#fff' : (isDarkMode ? '#94a3b8' : '#64748b')), cursor: 'pointer', padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }),
    lockButton: { cursor: 'pointer', color: '#ef4444', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #ef4444', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    timeBadge: { fontSize: '11px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' },
    paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px', marginBottom: '20px' },
    pageButton: { padding: '8px 16px', borderRadius: '8px', border: isDarkMode ? '1px solid #334155' : '1px solid #cbd5e1', backgroundColor: isDarkMode ? '#414141' : '#fff', color: isDarkMode ? '#e2e8f0' : '#1e293b', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' },
    pageInfo: { fontSize: '14px', fontWeight: 'bold', color: isDarkMode ? '#cbd5e1' : '#475569' },
  };

  const isVillageInputRequired = VILLAGE_CATEGORIES.includes(formData.category);

  // ★ 페이징 계산 로직 (return 문 직전에 위치)
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  return (
    <div style={styles.container}>
      <style>{hoverStyles}</style>

      <div style={styles.header}>
        <h1 style={styles.title}>커뮤니티</h1>
        <button style={styles.writeButton} onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? '닫기' : '+ 글쓰기'}
        </button>
      </div>

      <div style={styles.filterBar}>
        <button 
          style={styles.filterButton(activeFilter === '전체')} 
          onClick={() => { setActiveFilter('전체'); setCurrentPage(1); }} // 페이지 초기화 추가
        >
          전체
        </button>
        <button 
          style={styles.filterButton(activeFilter === '내가 쓴 글')} 
          onClick={() => { setActiveFilter('내가 쓴 글'); setCurrentPage(1); }}
        >
          🙋‍♂️ 내가 쓴 글
        </button>

        {CATEGORIES.map((cat) => (
          <button 
            key={cat} 
            style={styles.filterButton(activeFilter === cat)} 
            onClick={() => { setActiveFilter(cat); setCurrentPage(1); }} // 페이지 초기화 추가
          >
            {cat}
          </button>
        ))}
      </div>

      {isFormOpen && (
        <form style={styles.formContainer} onSubmit={handleSubmit}>
          <select style={styles.select} name="category" value={formData.category} onChange={handleChange}>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <div style={styles.row}>
            {!isVillageInputRequired && (
              <input style={styles.input} name="name" placeholder="닉네임" value={formData.name} onChange={handleChange} />
            )}
            
            {isVillageInputRequired ? (
              <>
                <input 
                  type="text"
                  inputMode="numeric"
                  style={styles.input} 
                  name="villageNumber" 
                  placeholder="🏠 마을 번호" 
                  value={formData.villageNumber} 
                  onChange={handleChange} 

                />
                <input 
                  type="time"
                  style={styles.input} 
                  name="startTime" 
                  value={formData.startTime} 
                  onChange={handleChange} 
                />
              </>
            ) : (
              <input 
                style={styles.input} 
                name="uid" 
                placeholder="UID" 
                value={formData.uid} 
                onChange={handleChange} 
              />
            )}
          </div>

          <input style={styles.input} name="title" placeholder="제목" value={formData.title} onChange={handleChange} />
          {!isVillageInputRequired && (
            <>
              <textarea 
                style={styles.textarea} 
                name="content" 
                placeholder="내용을 입력하세요" 
                value={formData.content} 
                onChange={handleChange} 
              />
              
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{fontSize:'14px', color: isDarkMode ? '#94a3b8':'#64748b'}} />
                {imagePreview && <img src={imagePreview} alt="preview" style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px'}} />}
              </div>
            </>
          )}
          
          <button type="submit" style={styles.submitBtn} disabled={isUploading}>
            {isUploading ? '등록 중...' : '등록하기'}
          </button>
        </form>
      )}

      <div style={styles.gridContainer}>
        {currentPosts.map((post) => {
          const isLiked = likedPostIds.includes(post.id);
          const hasImage = !!post.imageUrl;
          const hasVillageInfo = !!post.villageNumber;

          const CardContentInner = ({ isOverlay = false }) => (
            <>
              <div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div style={styles.categoryBadge(isOverlay)}>
                    {post.category || '기타'}
                  </div>
                  {post.scheduledTime && (
                    <div style={styles.timeBadge}>
                      ⏰ {formatTime(post.scheduledTime)} 시작
                    </div>
                  )}
                </div>

                <div style={styles.cardHeader}>
                  {post.name && (
                    <span style={{...styles.nameBadge, backgroundColor: isOverlay?'rgba(255,255,255,0.2)':'undefined', color: isOverlay?'#fff':'inherit'}}>
                      {post.name}
                    </span>
                  )}
                  
                  {/* ★ 수정: 비밀번호 표시 삭제 */}
                  {hasVillageInfo ? (
                    <span style={{ fontSize: '11px', color: isOverlay ? '#cbd5e1' : '#3b82f6', fontWeight: 'bold' }}>
                      🏠 {post.villageNumber}
                    </span>
                  ) : (
                    post.uid && <span style={{ fontSize: '11px', color: isOverlay ? '#cbd5e1' : '#94a3b8' }}>{post.uid}</span>
                  )}
                </div>

                <div style={{...styles.cardTitle, color: isOverlay ? '#fff' : styles.cardTitle.color}}>{post.title}</div>
                <div style={{...styles.cardContent, color: isOverlay ? '#e2e8f0' : styles.cardContent.color}}>{post.content}</div>
              </div>
              
              <div style={isOverlay ? styles.overlayFooter : styles.cardFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  
                  {/* ★ [추가] 내가 쓴 글이면 삭제 버튼 표시 */}
                  {myCreatedPostIds.includes(post.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post.id);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: isOverlay ? '#fca5a5' : '#ef4444',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textDecoration: 'underline',
                        padding: 0
                      }}
                    >
                      삭제
                    </button>
                  )}
                </div>

                <button 
                  style={styles.likeButton(isLiked, isOverlay)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLikeToggle(post.id);
                  }}
                >
                  {isLiked ? '❤️' : '🤍'} {post.likes || 0}
                </button>
              </div>
            </>
          );

          return (
            <div key={post.id} style={styles.cardBase}>
              {hasImage ? (
                <div className="image-card-container">
                  <img src={post.imageUrl} alt={post.title} className="image-card-bg" />
                  <div className="image-card-overlay">
                    <CardContentInner isOverlay={true} />
                  </div>
                </div>
              ) : (
                <div style={styles.textCardContentPadding}>
                  <CardContentInner isOverlay={false} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* ★ 페이지네이션 컨트롤 추가 */}
      {filteredPosts.length > 0 && (
        <div style={styles.paginationContainer}>
          <button 
            style={styles.pageButton} 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            이전
          </button>
          
          <span style={styles.pageInfo}>
            {currentPage} / {totalPages}
          </span>
          
          <button 
            style={styles.pageButton} 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
          </button>
        </div>
      )}

      {/* 등록된 글이 없습니다 (filteredPosts 기준) */}
      {filteredPosts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', gridColumn: '1 / -1' }}>
          등록된 글이 없습니다.
        </div>
      )}
    </div>
  );
};

export default BoardPage;