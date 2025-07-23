import React from 'react';

export const getBrowserLanguage = (full = false) => {
  if (!navigator) return 'en';

  if (full) {
    return navigator?.language;
  }

  const browserLocale = navigator.language.split('-')[0];
  return browserLocale || navigator.languages[0] || 'en';
};
