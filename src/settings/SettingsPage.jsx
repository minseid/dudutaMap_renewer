'use client';
import React from 'react';

// 🚨 중요: props로 (isDarkMode, setIsDarkMode)를 받아옵니다.
const SettingsPage = ({ isDarkMode, setIsDarkMode }) => {
  
  const toggleStyle = {
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  };

  const handleContact = () => {
    window.location.href ="https://open.kakao.com/o/s2fGH6ai"
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      padding: '40px 20px', 
      boxSizing: 'border-box',
      // 배경색도 다크모드 따라가게 수정
      backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa', 
      color: isDarkMode ? 'white' : 'black',
      overflowY: 'auto'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '30px' }}>⚙️ 환경 설정</h2>
        
        {/* 다크 모드 설정 */}
        <div style={{ 
          backgroundColor: isDarkMode ? '#333' : 'white', // 카드 배경색
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '15px',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>🌙 다크 모드</div>
            <div style={{ fontSize: '13px', color: isDarkMode ? '#aaa' : '#888', marginTop: '4px' }}>
              화면을 어둡게 하여 눈을 보호합니다.
            </div>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} // 🚨 부모(App.js)의 함수 실행
            style={{
              ...toggleStyle,
              backgroundColor: isDarkMode ? '#fbbf24' : '#e2e8f0',
              color: isDarkMode ? '#000' : '#64748b'
            }}
          >
            {isDarkMode ? 'ON' : 'OFF'}
          </button>
        </div>
        {/* 4. 문의하기 (새로 추가됨 ✨) */}
        <div style={{ 
          backgroundColor: isDarkMode ? '#333' : 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>📧 문의하기</div>
            <div style={{ fontSize: '13px', color: isDarkMode ? '#aaa' : '#888', marginTop: '4px' }}>
              오류 제보 및 기능 제안을 환영합니다.
            </div>
          </div>
          <button 
            onClick={handleContact}
            style={{
              ...toggleStyle,
              backgroundColor: isDarkMode ? '#4b5563' : '#f1f5f9',
              color: isDarkMode ? 'white' : '#334155',
              border: '1px solid',
              borderColor: isDarkMode ? '#6b7280' : '#cbd5e1'
            }}
          >
            채팅하기
          </button>
        </div>
        {/* 하단 버전 정보 */}
        <div style={{ marginTop: '30px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>
          현재 버전: v1.0.0 <br/>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;