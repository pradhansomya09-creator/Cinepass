import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CityProvider } from './context/CityContext';

// Layout & Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CityModal from './components/common/CityModal';

// Pages
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import CinemasPage from './pages/CinemasPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import TicketViewPage from './pages/TicketViewPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-cinema-darkest" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-cinema-darkest" />;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CityProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-cinema-darkest text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
              <Navbar />
              <CityModal />
              <main className="flex-1">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/movies" element={<MoviesPage />} />
                  <Route path="/movies/:id" element={<MovieDetailsPage />} />
                  <Route path="/cinemas" element={<CinemasPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/tickets/:ticketId" element={<TicketViewPage />} />

                  {/* Authenticated routes */}
                  <Route
                    path="/book/seats/:showId"
                    element={
                      <ProtectedRoute>
                        <SeatSelectionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/booking/success/:bookingId"
                    element={
                      <ProtectedRoute>
                        <BookingSuccessPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Protected routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboardPage />
                      </AdminRoute>
                    }
                  />

                  {/* 404 Catch-All */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </CityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
