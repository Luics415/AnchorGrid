import { useCallback, useEffect, useMemo, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function runningStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  );
}

function detectIos() {
  const ua = navigator.userAgent.toLowerCase();
  const classicIos = /iphone|ipad|ipod/.test(ua);
  const ipadDesktopUa =
    navigator.platform === 'MacIntel' &&
    navigator.maxTouchPoints > 1;

  return classicIos || ipadDesktopUa;
}

export function useInstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => runningStandalone());

  const isIos = useMemo(() => detectIos(), []);

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');

    const syncStandalone = () => {
      if (runningStandalone()) {
        setInstalled(true);
        setInstallPrompt(null);
      }
    };

    const onBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();

      if (!runningStandalone()) {
        setInstallPrompt(promptEvent);
      }
    };

    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    media.addEventListener?.('change', syncStandalone);

    syncStandalone();

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      media.removeEventListener?.('change', syncStandalone);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt || installed) return false;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    // Chromium consumes the event after prompt(), regardless of the choice.
    setInstallPrompt(null);

    if (choice.outcome === 'accepted') {
      setInstalled(true);
      return true;
    }

    return false;
  }, [installPrompt, installed]);

  return {
    installed,
    canPromptInstall: Boolean(installPrompt) && !installed,
    isIos,
    install
  };
}
