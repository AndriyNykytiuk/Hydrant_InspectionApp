import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import { ProtectedRoute } from './auth/ProtectedRoute.jsx';
import { Layout } from './components/Layout/Layout.jsx';
import { LoginPage } from './pages/LoginPage/LoginPage.jsx';
import { HydrantsPage } from './pages/HydrantsPage/HydrantsPage.jsx';
import { HydrantDetailPage } from './pages/HydrantDetailPage/HydrantDetailPage.jsx';
import { InspectPage } from './pages/InspectPage/InspectPage.jsx';
import { AdminBrigadesPage } from './pages/AdminBrigadesPage/AdminBrigadesPage.jsx';
import { AdminUsersPage } from './pages/AdminUsersPage/AdminUsersPage.jsx';
import { AdminCreateHydrantsPage } from './pages/AdminCreateHydrantsPage/AdminCreateHydrantsPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/hydrants" replace />} />
            <Route path="/hydrants" element={<HydrantsPage />} />
            <Route path="/hydrants/:id" element={<HydrantDetailPage />} />
            <Route path="/inspect/:hydrantId" element={<InspectPage />} />
            <Route
              path="/admin/brigades"
              element={
                <ProtectedRoute role="god">
                  <AdminBrigadesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute role="god">
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/hydrants/new"
              element={
                <ProtectedRoute role="god">
                  <AdminCreateHydrantsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/hydrants" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
