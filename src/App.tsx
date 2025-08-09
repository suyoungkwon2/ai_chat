import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import { useAppStore } from "./store/appStore";
import { useIsMobile } from "./hooks/useIsMobile";

function MobileHeader() {
  const currentUser = useAppStore((s) => s.currentUser);
  return (
    <header className="mobile-header">
      <Link to="/" className="btn btn--icon">🏠</Link>
      <img className="avatar avatar--sm" src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${currentUser.username}`} alt="me" />
    </header>
  );
}

function AppShell() {
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="layout--mobile">
        <MobileHeader />
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
