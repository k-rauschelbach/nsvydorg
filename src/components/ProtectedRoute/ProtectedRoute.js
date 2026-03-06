// ProtectedRoute.js — Wraps routes that require authentication.
// Unauthenticated users are redirected to the home page; the
// "Member Login" button in the Header is always visible for them to sign in.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children }) {
    const { currentUser } = useAuth();
    return currentUser
        ? children
        : <Navigate to="/" replace />;
}

export default ProtectedRoute;
