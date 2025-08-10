import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import { useAppStore } from "./store/appStore";
import { useIsMobile } from "./hooks/useIsMobile";
import MobileMenu from "./components/MobileMenu";

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

function AppShell() {
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
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
      </div>
    );
  }

  return (
    <div className="layout" style={{ gridTemplateColumns: `${sidebarWidth}px 1fr` }}>
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat/:characterId" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
