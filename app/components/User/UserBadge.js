import React from 'react';

const getUserBadge = (userType) => {
  switch (userType) {
    case 'trgovina':
      return { icon: 'bi-handbag', color: 'violet' };
    case 'influencer':
      return { icon: 'bi-patch-check-fill', color: 'orange' };
    case 'superinfluencer':
      return { icon: 'bi-patch-check-fill', color: 'darkblue' };
    case 'golduser':
      return { icon: 'bi-patch-check-fill', color: '#b09c2f' };
    case 'admin':
      return { icon: 'bi-gem', color: '#000000' };
    default:
      return { icon: '', color: '' }; // Običajni uporabnik nima značke
  }
};

const UserBadge = ({ userType }) => {
  const badge = getUserBadge(userType);

  if (!badge.icon) {
    return null; // Če ni značke, ne prikaži ničesar
  }

  return (
    <span style={{ color: badge.color }}>
      <i className={`bi ${badge.icon}`}></i>
    </span>
  );
};

export default UserBadge;