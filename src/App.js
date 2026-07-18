// App.js -- routing hub

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

// Auth
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LoginModal from './components/LoginModal/LoginModal';

// Shared layout components (public site)
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

// Public page components
import Home        from './pages/Home/Home';
import About       from './pages/About/About';
import Events      from './pages/Events/Events';
import Elections   from './pages/Elections/Elections';
import GetInvolved from './pages/GetInvolved/GetInvolved';

// Member area
import Dashboard from './pages/Member/Dashboard';

// ScrollToTop resets scroll position on every route change so navigating
// from mid-page doesn't land the next page mid-scroll. Renders nothing.
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

// PublicLayout wraps all public-facing pages with the shared Header + Footer.
// Defined here since it's only needed by App. The member Dashboard manages
// its own layout and does not use this wrapper.
function PublicLayout({ children }) {
    const { pathname } = useLocation();

    return (
        <div className="App">
            <Header />
            {/* Keyed by pathname so <main> remounts on navigation,
                replaying the pageEnter fade-in from App.css */}
            <main key={pathname}>
                {children}
            </main>
            <Footer />
        </div>
    );
}

function App() {
    return (
        // AuthProvider must be inside BrowserRouter because LoginModal and
        // Dashboard both call useNavigate(), which requires router context.
        <BrowserRouter>
            <AuthProvider>

                <ScrollToTop />

                {/* LoginModal is mounted at the top level so it renders over
                    any page. It self-hides when loginModalOpen is false. */}
                <LoginModal />

                <Routes>

                    {/* ── Public routes — all share Header + Footer ── */}
                    <Route path="/"             element={<PublicLayout><Home /></PublicLayout>} />
                    <Route path="/about"        element={<PublicLayout><About /></PublicLayout>} />
                    <Route path="/events"       element={<PublicLayout><Events /></PublicLayout>} />
                    <Route path="/elections"    element={<PublicLayout><Elections /></PublicLayout>} />
                    <Route path="/get-involved" element={<PublicLayout><GetInvolved /></PublicLayout>} />

                    {/* ── Member area — manages its own layout ── */}
                    <Route path="/member" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                </Routes>

            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
