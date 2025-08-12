import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import ReactGA from "react-ga4";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import { useAppStore } from "./store/appStore";
import { useIsMobile } from "./hooks/useIsMobile";
import MobileMenu from "./components/MobileMenu.tsx";
import {
  ActualAdModal,
  EndOfChatsModal,
  SignInModal,
  UserRegistrationModal,
  WatchAdModal,
} from "./components/FeatureModals.tsx";

const GA_MEASUREMENT_ID = "G-K7NPXST4BM";

function usePageViews() {
  const location = useLocation();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);
}

function MobileHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  return (
    <header className="mobile-header">
      <button onClick={onMenuToggle} className="btn btn--icon hamburger-btn" aria-label="Toggle menu">
        <span className="hamburger-box">
          <span className="hamburger-inner"></span>
        </span>
      </button>
      <div className="mobile-header__title">AI Chat</div>
    </header>
  );
}

function GlobalModals() {
  const activeModal = useAppStore((s) => s.activeModal);
  const characterId = useAppStore((s) => s.modalContextCharacterId);
  const setActiveModal = useAppStore((s) => s.setActiveModal);
  const handleModalAction = useAppStore((s) => s.handleModalAction);

  if (!activeModal) return null;

  const props = {
    characterId: characterId || undefined,
    onClose: () => {
      if (characterId) handleModalAction(characterId, "lockChat");
      setActiveModal(null);
    }
  };

  switch (activeModal) {
    case "userRegistration":
      return <UserRegistrationModal {...props} />;
    case "signIn":
      return <SignInModal {...props} />;
    case "watchAd":
      return <WatchAdModal {...props} />;
    case "actualAd":
      return <ActualAdModal {...props} />;
    case "endOfChats":
      return <EndOfChatsModal onClose={() => setActiveModal(null)} />;
    default:
      return null;
  }
}

function AppShell() {
  usePageViews();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="layout--mobile">
        <MobileHeader onMenuToggle={() => setIsMobileMenuOpen(prev => !prev)} />
        {isMobileMenuOpen && <MobileMenu onClose={() => setIsMobileMenuOpen(false)} />}
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat/:characterId" element={<Chat />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <GlobalModals />
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat/:characterId" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <GlobalModals />
    </div>
  );
}

export default function App() {
  const currentUser = useAppStore((s) => s.currentUser);

  useEffect(() => {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    ReactGA.set({ userId: currentUser.username });
  }, [currentUser.username]);

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
