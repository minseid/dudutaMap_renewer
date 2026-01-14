import React, { useState, useEffect } from 'react';
import { Map, Home, Users, Settings, Filter, ChevronDown, CheckSquare, Square } from 'lucide-react'; 
import MapComponent from './components/MapComponent';
import { Category, DUDU_DATA } from './data'; 

function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [checkedItems, setCheckedItems] = useState({});

  // ✨ 화면 크기 감지 (모바일 여부 확인)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 데이터 필터링 로직 ---
  const filteredMarkers = DUDU_DATA.filter(marker => checkedItems[marker.category]);

  const allItemIds = Object.values(Category).flat().map(item => item.id);
  const isAnyGlobalSelected = allItemIds.some(id => checkedItems[id]);

  const toggleGlobalSelection = () => {
    if (isAnyGlobalSelected) {
      setCheckedItems({});
    } else {
      const newChecked = {};
      allItemIds.forEach(id => { newChecked[id] = true; });
      setCheckedItems(newChecked);
    }
  };

  const toggleCategorySelection = (e, categoryName) => {
    e.stopPropagation(); 
    const itemsInCategory = Category[categoryName];
    const isAnyInCatSelected = itemsInCategory.some(item => checkedItems[item.id]);

    setCheckedItems(prev => {
      const next = { ...prev };
      itemsInCategory.forEach(item => {
        next[item.id] = !isAnyInCatSelected;
      });
      return next;
    });
  };

  const toggleItem = (itemId) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleAccordion = (categoryName) => {
    setExpandedCategories(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };

  // --- 스타일 (반응형 적용) ---
  const styles = {
    container: {
      display: 'flex', 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      margin: 0, padding: 0, fontFamily: 'sans-serif', backgroundColor: '#fff',
      position: 'relative',
      // ✨ 모바일이면 세로 배치(역순: 사이드바가 아래로), PC면 가로 배치
      flexDirection: isMobile ? 'column-reverse' : 'row', 
    },

    // 1. 사이드바 (내비게이션)
    sidebar: {
      backgroundColor: '#f8f9fa',
      display: 'flex', 
      alignItems: 'center', 
      zIndex: 30, // 필터보다 위에 있어야 함
      position: 'relative',
      boxShadow: isMobile ? '0 -2px 5px rgba(0,0,0,0.05)' : '2px 0 5px rgba(0,0,0,0.05)',
      // PC vs Mobile 스타일 분기
      width: isMobile ? '100%' : '80px',
      height: isMobile ? '70px' : '100%',
      flexDirection: isMobile ? 'row' : 'column', // 모바일은 가로 배열
      borderRight: isMobile ? 'none' : '1px solid #dee2e6',
      borderTop: isMobile ? '1px solid #dee2e6' : 'none',
      justifyContent: isMobile ? 'space-around' : 'flex-start', // 모바일은 균등 배치
      paddingTop: isMobile ? '0' : '20px',
      flexShrink: 0, 
    },

    // 2. 필터 패널 (Overlay)
    filterPanelWrapper: {
      position: 'absolute', 
      zIndex: 20, 
      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
      backdropFilter: 'blur(5px)',
      overflow: 'hidden', 
      display: 'flex', flexDirection: 'column',
      whiteSpace: 'nowrap',
      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      
      // ✨ [핵심] 모바일/PC 위치 및 애니메이션 분기
      ...(isMobile ? {
        // Mobile: 아래에서 위로 올라옴
        left: 0,
        bottom: '70px', // 사이드바 높이만큼 띄움
        width: '100%',
        height: (isFilterOpen && activeTab === 'map') ? '50vh' : '0px', // 반 화면 덮기
        borderTop: (isFilterOpen && activeTab === 'map') ? '1px solid #dee2e6' : 'none',
        boxShadow: (isFilterOpen && activeTab === 'map') ? '0 -5px 15px rgba(0,0,0,0.1)' : 'none',
      } : {
        // PC: 왼쪽에서 오른쪽으로 펼쳐짐
        left: '81px',
        top: 0,
        height: '100%',
        width: (isFilterOpen && activeTab === 'map') ? '280px' : '0px',
        borderRight: (isFilterOpen && activeTab === 'map') ? '1px solid #dee2e6' : 'none',
        boxShadow: (isFilterOpen && activeTab === 'map') ? '5px 0 15px rgba(0,0,0,0.1)' : 'none',
      })
    },

    filterContent: { 
      minWidth: isMobile ? '100%' : '280px', 
      height: '100%', 
      display: 'flex', flexDirection: 'column' 
    },
    
    // ... 나머지 내부 스타일은 동일 ...
    filterHeader: {
      padding: '20px', borderBottom: '1px solid #eee',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: 'transparent', position: 'sticky', top: 0, zIndex: 10
    },
    categoryGroup: { borderBottom: '1px solid #f0f0f0' },
    categoryHeader: {
      padding: '12px 15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', fontWeight: 'bold', fontSize: '14px', backgroundColor: 'transparent',
      userSelect: 'none', transition: 'background 0.2s'
    },
    accordionWrapper: (isOpen) => ({
      display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease-out',
    }),
    accordionInner: { overflow: 'hidden', minHeight: '0' },
    catBtn: (isActive) => ({
      fontSize: '11px', padding: '4px 10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
      backgroundColor: isActive ? '#fee2e2' : '#eff6ff', color: isActive ? '#dc2626' : '#2563eb',
      fontWeight: 'bold', marginLeft: 'auto', marginRight: '10px', transition: 'all 0.2s ease'
    }),
    globalBtn: (isActive) => ({
      fontSize: '12px', padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
      backgroundColor: isActive ? '#ef4444' : '#3b82f6', color: 'white', fontWeight: 'bold', 
      transition: 'background-color 0.3s ease, transform 0.1s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }),
    itemList: { backgroundColor: 'rgba(252, 252, 252, 0.5)', padding: '5px 0' },
    itemRow: {
      display: 'flex', alignItems: 'center', padding: '8px 20px 8px 30px',
      cursor: 'pointer', fontSize: '13px', color: '#555', transition: 'background-color 0.2s'
    },
    itemImage: { width: '22px', height: '22px', marginRight: '12px', objectFit: 'contain' },
    colorDot: (color) => ({
      width: '18px', height: '18px', borderRadius: '50%', marginRight: '12px',
      backgroundColor: color === 'pink' ? '#f9a8d4' : '#93c5fd', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
    }),

    // 3. 메인 콘텐츠
    mainContent: { 
      flex: 1, 
      width: '100%',
      height: '100%', 
      position: 'relative', 
      backgroundColor: '#ffffff', 
      zIndex: 1,
      overflow: 'hidden' 
    },
    
    menuItem: (isActive, isFilterBtn = false) => ({
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      // 모바일에서는 너비 제한 없이 유연하게
      width: isMobile ? 'auto' : '100%', 
      flex: isMobile ? 1 : 'none', // 모바일에서 버튼 등분
      padding: isMobile ? '10px 0' : '16px 0', 
      cursor: 'pointer', border: 'none', background: 'transparent',
      color: isActive ? '#2563eb' : (isFilterBtn ? '#ef4444' : '#94a3b8'),
      fontWeight: isActive ? 'bold' : 'normal', transition: 'all 0.2s ease', 
      transform: isActive ? 'scale(1.05)' : 'scale(1)',
      // 모바일 터치 영역 확보
      minHeight: '44px' 
    }),
    iconWrapper: { marginBottom: '4px', transition: 'transform 0.2s' },
    separator: { 
      // 모바일에서는 구분선 방향 변경 (세로선) 혹은 제거
      width: isMobile ? '1px' : '30px', 
      height: isMobile ? '20px' : '1px', 
      backgroundColor: '#eee', 
      margin: isMobile ? '0 5px' : '10px 0' 
    },
    arrowIcon: (isOpen) => ({
      transition: 'transform 0.3s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#9ca3af'
    })
  };

  return (
    <div style={styles.container}>
      {/* 1. 사이드바 (Nav)
        isMobile이 true면 flexDirection: column-reverse이므로
        코드상으로 위에 있어도 화면에서는 '맨 아래'에 렌더링됩니다.
      */}
      <nav style={styles.sidebar}>
        {activeTab === 'map' && (
          <>
            <button style={styles.menuItem(isFilterOpen, true)} onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <div style={styles.iconWrapper}><Filter size={isMobile ? 20 : 24} /></div>
              <span style={{ fontSize: '10px' }}>필터</span>
            </button>
            <div style={styles.separator}></div>
          </>
        )}
        {['map', 'home', 'friends', 'settings'].map(tab => (
          <button key={tab} style={styles.menuItem(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            <div style={styles.iconWrapper}>
              {tab === 'map' && <Map size={isMobile ? 20 : 24} />}
              {tab === 'home' && <Home size={isMobile ? 20 : 24} />}
              {tab === 'friends' && <Users size={isMobile ? 20 : 24} />}
              {tab === 'settings' && <Settings size={isMobile ? 20 : 24} />}
            </div>
            <span style={{ fontSize: '10px' }}>
              {tab === 'map' ? '맵스' : tab === 'home' ? '공유' : tab === 'friends' ? '친구' : '설정'}
            </span>
          </button>
        ))}
      </nav>

      {/* 2. 필터 패널 */}
      <div style={styles.filterPanelWrapper}>
        <div style={styles.filterContent}>
          <div style={styles.filterHeader}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>필터 목록</h2>
            <button onClick={toggleGlobalSelection} style={styles.globalBtn(isAnyGlobalSelected)}>
              {isAnyGlobalSelected ? '해제' : '선택'}
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {Object.keys(Category).map((catName) => {
              const isAnyInCatSelected = Category[catName].some(item => checkedItems[item.id]);
              const isExpanded = expandedCategories[catName];
              return (
                <div key={catName} style={styles.categoryGroup}>
                  <div style={styles.categoryHeader} onClick={() => toggleAccordion(catName)}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', color: '#334155' }}>{catName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button onClick={(e) => toggleCategorySelection(e, catName)} style={styles.catBtn(isAnyInCatSelected)}>
                        {isAnyInCatSelected ? '해제' : '선택'}
                      </button>
                      <div style={styles.arrowIcon(isExpanded)}><ChevronDown size={18} /></div>
                    </div>
                  </div>
                  <div style={styles.accordionWrapper(isExpanded)}>
                    <div style={styles.accordionInner}>
                      <div style={styles.itemList}>
                        {Category[catName].map((item) => (
                          <div 
                            key={item.id} style={styles.itemRow} onClick={() => toggleItem(item.id)}
                            onMouseOver={(e) => !isMobile && (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
                            onMouseOut={(e) => !isMobile && (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div style={{ marginRight: '12px', color: checkedItems[item.id] ? '#2563eb' : '#cbd5e1', transition: 'color 0.2s' }}>
                              {checkedItems[item.id] ? <CheckSquare size={20} fill="#eff6ff" /> : <Square size={20} />}
                            </div>
                            {item.image.includes('/') ? (
                              <img src={item.image} alt={item.label} style={styles.itemImage} onError={(e) => e.target.style.display = 'none'} />
                            ) : (
                              <div style={styles.colorDot(item.image)}></div>
                            )}
                            <span style={{ fontWeight: checkedItems[item.id] ? '600' : '400', color: checkedItems[item.id] ? '#1e293b' : '#64748b' }}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 메인 콘텐츠 (지도 등) */}
      <main style={styles.mainContent}>
        {activeTab === 'map' && <div style={{ width: '100%', height: '100%' }}><MapComponent markers={filteredMarkers} /></div>}
        {activeTab === 'home' && <Placeholder text="🏠 집 공유페이지 개발중" />}
        {activeTab === 'friends' && <Placeholder text="👥 친구 찾기페이지 개발중" />}
        {activeTab === 'settings' && <Placeholder text="⚙️ 설정 개발중" />}
      </main>
    </div>
  );
}

const Placeholder = ({ text }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '24px', color: '#adb5bd', userSelect: 'none' }}>
    {text}
  </div>
);

export default App;