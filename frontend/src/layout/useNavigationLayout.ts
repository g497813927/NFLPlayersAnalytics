import { useEffect, useState, useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

function subscribe(listener: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

function isMobileScreen() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function useNavigationLayout() {
  const isMobile = useSyncExternalStore(subscribe, isMobileScreen);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [isMobile]);

  return {
    isMobile,
    collapsed: isMobile ? !mobileOpen : desktopCollapsed,
    mobileOpen,
    toggle: () => {
      if (isMobile) setMobileOpen((value) => !value);
      else setDesktopCollapsed((value) => !value);
    },
    closeMobile: () => setMobileOpen(false),
  };
}
