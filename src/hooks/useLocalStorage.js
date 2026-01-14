'use client';
import { useState } from 'react';

export function useLocalStorage(key, initialValue) {
  // 1. 상태 초기화
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // 로컬 스토리지에서 값 가져오기
      const item = window.localStorage.getItem(key);
      // 값이 있으면 파싱해서 쓰고, 없으면 초기값 사용
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  // 2. 값이 바뀔 때마다 로컬 스토리지에도 저장
  const setValue = (value) => {
    try {
      // 함수형 업데이트인지 체크
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}