/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public Pages (Lazy Loaded Chunks)
const MapPage = lazy(() => import('./pages/public/MapPage'));
const NewReportPage = lazy(() => import('./pages/public/NewReportPage'));
const TrackReportPage = lazy(() => import('./pages/public/TrackReportPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));

// Admin Pages (Lazy Loaded Chunks - Isolated from public bundle)
const LoginPage = lazy(() => import('./pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const MapAdminPage = lazy(() => import('./pages/admin/MapAdminPage'));
const ReportDetailPage = lazy(() => import('./pages/admin/ReportDetailPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

// Smooth Material You Page Loader Fallback
const PageFallback = () => (
  <div className="h-screen w-screen bg-[#111416] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-3 border-[#354376] border-t-[#8ca0eb] rounded-full animate-spin" />
      <p className="text-xs text-slate-400 font-medium font-['Poppins',sans-serif]">
        Memuat InfraCheck...
      </p>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<MapPage />} />
              <Route path="/report/new" element={<NewReportPage />} />
              <Route path="/report/track" element={<TrackReportPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/map"
                element={
                  <ProtectedRoute>
                    <MapAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports-map"
                element={<Navigate to="/admin/map" replace />}
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute>
                    <ReportDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports/:id"
                element={
                  <ProtectedRoute>
                    <ReportDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/history"
                element={
                  <ProtectedRoute>
                    <ReportDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/history/:id"
                element={
                  <ProtectedRoute>
                    <ReportDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  );
}

