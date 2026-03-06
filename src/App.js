// App.js -- routing hub

import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import GetInvolved from './pages/GetInvolved/GetInvolved';

// Member area
import Dashboard from './pages/Member/Dashboard';

// PublicLayout wraps all public-facing pages with the shared Header + Footer.
// Defined here since it's only needed by App. The member Dashboard manages
// its own layout and does not use this wrapper.
function PublicLayout({ children }) {
    return (
        <div className="App">
            <Header />
            <main>
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

                {/* LoginModal is mounted at the top level so it renders over
                    any page. It self-hides when loginModalOpen is false. */}
                <LoginModal />

                <Routes>

                    {/* ── Public routes — all share Header + Footer ── */}
                    <Route path="/"             element={<PublicLayout><Home /></PublicLayout>} />
                    <Route path="/about"        element={<PublicLayout><About /></PublicLayout>} />
                    <Route path="/events"       element={<PublicLayout><Events /></PublicLayout>} />
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
