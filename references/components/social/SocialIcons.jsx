import React from 'react';

const ICONS = {
  facebook: 'assets/icons/social/facebook.png',
  instagram: 'assets/icons/social/instagram.png',
  linkedin: 'assets/icons/social/linkedin.png',
  twitter: 'assets/icons/social/twitter.png',
};

export function SocialIcons({ networks = ['facebook', 'instagram', 'linkedin', 'twitter'], size = 26, basePath = '' }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {networks.map(n => (
        <img key={n} src={basePath + ICONS[n]} alt={n} width={size} height={size} style={{ borderRadius: 6 }} />
      ))}
    </div>
  );
}
