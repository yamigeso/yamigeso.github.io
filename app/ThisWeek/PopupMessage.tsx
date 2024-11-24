import React, { useEffect } from 'react';

interface PopupMessageProps {
  message: string;
  duration?: number; // 表示時間（ミリ秒）
  onClose: () => void; // クローズハンドラー
}

const PopupMessage: React.FC<PopupMessageProps> = ({ message, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '5px',
      zIndex: 1000,
    }}>
      {message}
    </div>
  );
};

export default PopupMessage;
