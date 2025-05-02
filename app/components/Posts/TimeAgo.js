"use client";
import React, { useEffect, useState } from 'react';

function TimeAgo({ timestamp }) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const calculateTimeAgo = () => {
      const now = new Date();
      const past = new Date(timestamp);
      const seconds = Math.floor((now - past) / 1000);

      let interval = Math.floor(seconds / 31536000); // Leta
      if (interval >= 1) {
        setTimeAgo(`${interval} let${interval === 1 ? '' : ''}`);
        return;
      }

      interval = Math.floor(seconds / 2592000); // Meseci
      if (interval >= 1) {
        setTimeAgo(`${interval} mesec${interval === 1 ? '' : ''}`);
        return;
      }

      interval = Math.floor(seconds / 86400); // Dnevi
      if (interval >= 1) {
        setTimeAgo(`${interval} dan${interval === 1 ? '' : ''}`);
        return;
      }

      interval = Math.floor(seconds / 3600); // Ure
      if (interval >= 1) {
        setTimeAgo(`${interval} ur${interval === 1 ? '' : ''}`);
        return;
      }

      interval = Math.floor(seconds / 60); // Minute
      if (interval >= 1) {
        setTimeAgo(`${interval} minut${interval === 1 ? '' : ''}`);
        return;
      }

      setTimeAgo('pravkar');
    };

    calculateTimeAgo();
    const intervalId = setInterval(calculateTimeAgo, 60000); // Posodobi vsako minuto

    return () => clearInterval(intervalId); // Počisti interval ob unmountu
  }, [timestamp]);

  return <span>{timeAgo}</span>;
}

export default TimeAgo;