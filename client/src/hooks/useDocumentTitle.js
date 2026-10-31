import { useEffect } from 'react';

/**
 * useDocumentTitle
 * Sets the document page title on component mount and updates when title changes.
 * @param {string} title - Page specific title (e.g. "Shop", "My Orders")
 */
export const useDocumentTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) {
      document.title = `${title} — Rameshwar Namkeen`;
    } else {
      document.title = 'Rameshwar Namkeen — Authentic Gujarati Namkeen';
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default useDocumentTitle;
