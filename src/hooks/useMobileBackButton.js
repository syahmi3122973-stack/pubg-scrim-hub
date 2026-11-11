import { useEffect, useRef } from 'react';

const DEFAULT_ROOT_TABS = ['playground', 'home'];

/**
 * Reusable Mobile Back-Button & Swipe-Back Navigation Hook.
 *
 * Handles:
 * 1. Modals, Drawers, Popovers & Preview Overlays (Priority 1):
 *    Closes the topmost active modal/overlay first without navigating away or closing the app.
 * 2. Page / Tab History Navigation (Priority 2):
 *    Steps backward through visited tabs (`onNavigateBackTab`) and synthesizes a return to the
 *    root Home screen (`playground`) if the user landed directly on a deep link.
 * 3. Root Screen Exit Behavior (Priority 3):
 *    Only allows browser exit or triggers `Capacitor.Plugins.App.exitApp()` when the user is
 *    explicitly on the root Home screen (`playground` / `home`) with zero active overlays.
 *
 * Works across mobile browsers (Android Chrome, iOS Safari), standalone PWAs (`window.history` /
 * `popstate`), and Capacitor / Android WebView wrappers (`App.addListener('backButton')` /
 * `document` `backbutton` event).
 */
export function useMobileBackButton({
  activeTab = 'playground',
  rootTabs = DEFAULT_ROOT_TABS,
  tabHistory = [],
  activeOverlayCount = 0,
  closeTopmostOverlay,
  onNavigateBackTab
}) {
  const isAtRootTab = rootTabs.includes(activeTab);
  const effectiveTabDepth = isAtRootTab ? 0 : Math.max(1, tabHistory.length);
  const targetDepth = effectiveTabDepth + activeOverlayCount;

  const latestRef = useRef({
    activeTab,
    isAtRootTab,
    tabHistoryLength: tabHistory.length,
    activeOverlayCount,
    targetDepth,
    closeTopmostOverlay,
    onNavigateBackTab
  });

  useEffect(() => {
    latestRef.current = {
      activeTab,
      isAtRootTab,
      tabHistoryLength: tabHistory.length,
      activeOverlayCount,
      targetDepth,
      closeTopmostOverlay,
      onNavigateBackTab
    };
  });

  // Tracks how many in-app history entries are currently pushed on window.history
  const historyDepthRef = useRef(0);
  // Tracks programmatic history.go(-delta) calls when closing overlays via UI buttons
  const suppressPopStateCountRef = useRef(0);
  // Flags when a state change originated from a user-triggered popstate event
  const isHandlingPopStateRef = useRef(false);
  const isInitializedRef = useRef(false);

  // 1. Initialize base root history entry on mount & handle initial deep-link state
  useEffect(() => {
    if (typeof window === 'undefined' || isInitializedRef.current) return;
    isInitializedRef.current = true;

    try {
      const currentState = window.history.state || {};
      window.history.replaceState(
        {
          ...currentState,
          __scrimHubRoot: true,
          __scrimHubDepth: 0
        },
        ''
      );

      // If the user opened the app on a non-root tab (e.g. #teams) or with an initial modal (#guide),
      // seed the history stack so pressing Back returns to Home instead of exiting the app.
      const initialDepth = latestRef.current.targetDepth;
      for (let d = 1; d <= initialDepth; d += 1) {
        window.history.pushState(
          {
            __scrimHubGuard: true,
            __scrimHubDepth: d,
            tab: latestRef.current.activeTab,
            overlayCount: latestRef.current.activeOverlayCount
          },
          ''
        );
      }
      historyDepthRef.current = initialDepth;
    } catch {
      // Ignore history API errors in restricted environments
    }
  }, []);

  // 2. Keep window.history depth synchronized with active tab stack + open modal/overlay count
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitializedRef.current) return;

    if (isHandlingPopStateRef.current) {
      isHandlingPopStateRef.current = false;
      historyDepthRef.current = targetDepth;
      return;
    }

    try {
      if (targetDepth > historyDepthRef.current) {
        while (historyDepthRef.current < targetDepth) {
          historyDepthRef.current += 1;
          window.history.pushState(
            {
              __scrimHubGuard: true,
              __scrimHubDepth: historyDepthRef.current,
              tab: activeTab,
              overlayCount: activeOverlayCount
            },
            ''
          );
        }
      } else if (targetDepth < historyDepthRef.current) {
        const delta = historyDepthRef.current - targetDepth;
        historyDepthRef.current = targetDepth;
        if (window.history.state && window.history.state.__scrimHubGuard) {
          suppressPopStateCountRef.current += delta;
          window.history.go(-delta);
        }
      }
    } catch {
      // Ignore history API errors
    }
  }, [targetDepth, activeTab, activeOverlayCount]);

  // 3. Register popstate, Escape key, and Capacitor/WebView hardware back-button listeners
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handlePopState = () => {
      if (suppressPopStateCountRef.current > 0) {
        suppressPopStateCountRef.current -= 1;
        return;
      }

      const {
        activeOverlayCount: currentOverlayCount,
        isAtRootTab: currentlyAtRootTab,
        tabHistoryLength,
        closeTopmostOverlay: closeOverlayFn,
        onNavigateBackTab: navigateBackTabFn
      } = latestRef.current;

      // Priority 1: Close topmost modal, drawer, popover, or preview overlay first
      if (currentOverlayCount > 0 && typeof closeOverlayFn === 'function') {
        isHandlingPopStateRef.current = true;
        historyDepthRef.current = Math.max(0, historyDepthRef.current - 1);
        const closed = closeOverlayFn();
        if (closed) return;
      }

      // Priority 2: Navigate back one step in page/tab history if not on root Home screen
      if ((!currentlyAtRootTab || tabHistoryLength > 0) && typeof navigateBackTabFn === 'function') {
        isHandlingPopStateRef.current = true;
        historyDepthRef.current = Math.max(0, historyDepthRef.current - 1);
        const navigated = navigateBackTabFn();
        if (navigated) return;
      }

      // Priority 3: User is on root Home screen with no active overlays — allow default behavior
      historyDepthRef.current = 0;
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && latestRef.current.activeOverlayCount > 0) {
        if (typeof latestRef.current.closeTopmostOverlay === 'function') {
          latestRef.current.closeTopmostOverlay();
        }
      }
    };

    // Handler for Capacitor / Cordova / Native Android WebView hardware back button events
    const handleNativeBackButton = (event) => {
      const {
        activeOverlayCount: currentOverlayCount,
        isAtRootTab: currentlyAtRootTab,
        tabHistoryLength,
        closeTopmostOverlay: closeOverlayFn,
        onNavigateBackTab: navigateBackTabFn
      } = latestRef.current;

      if (currentOverlayCount > 0 && typeof closeOverlayFn === 'function') {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        closeOverlayFn();
        return;
      }

      if ((!currentlyAtRootTab || tabHistoryLength > 0) && typeof navigateBackTabFn === 'function') {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        navigateBackTabFn();
        return;
      }

      // Explicitly on root Home screen with no open modals/overlays: allow native exit
      try {
        const capacitorApp = window.Capacitor?.Plugins?.App;
        if (capacitorApp && typeof capacitorApp.exitApp === 'function') {
          capacitorApp.exitApp();
        }
      } catch {
        // Ignore if not running inside Capacitor native bridge
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('backbutton', handleNativeBackButton, false);

    let capacitorListenerHandle = null;
    try {
      const capacitorApp = window.Capacitor?.Plugins?.App;
      if (capacitorApp && typeof capacitorApp.addListener === 'function') {
        capacitorListenerHandle = capacitorApp.addListener('backButton', () => {
          handleNativeBackButton();
        });
      }
    } catch {
      // Ignore if Capacitor plugin is unavailable
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('backbutton', handleNativeBackButton, false);

      if (capacitorListenerHandle) {
        try {
          if (typeof capacitorListenerHandle.remove === 'function') {
            capacitorListenerHandle.remove();
          } else if (typeof capacitorListenerHandle.then === 'function') {
            capacitorListenerHandle.then((handle) => handle?.remove?.()).catch(() => {});
          }
        } catch {
          // Ignore teardown errors
        }
      }
    };
  }, []);
}

/**
 * Declarative root wrapper component for mobile back-button & modal/history management.
 */
export function BackButtonHandler(props) {
  useMobileBackButton(props);
  return null;
}

export default BackButtonHandler;

