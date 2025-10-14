import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { BotProvider } from './contexts/BotContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const BotCreate = lazy(() => import('./pages/BotCreate'));
const BotEditor = lazy(() => import('./pages/BotEditor'));
const BotPayment = lazy(() => import('./pages/BotPayment'));
const Plans = lazy(() => import('./pages/Plans'));
const PlanForm = lazy(() => import('./pages/PlanForm'));
const Remarketing = lazy(() => import('./pages/Remarketing'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Statistics = lazy(() => import('./pages/Statistics'));
const CronLogs = lazy(() => import('./pages/CronLogs'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BotProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
              <Route path="bot-create" element={<Suspense fallback={<LoadingFallback />}><BotCreate /></Suspense>} />
              <Route path="bot-editor" element={<Suspense fallback={<LoadingFallback />}><BotEditor /></Suspense>} />
              <Route path="payment" element={<Suspense fallback={<LoadingFallback />}><BotPayment /></Suspense>} />
              <Route path="plans" element={<Suspense fallback={<LoadingFallback />}><Plans /></Suspense>} />
              <Route path="plans/create" element={<Suspense fallback={<LoadingFallback />}><PlanForm /></Suspense>} />
              <Route path="plans/edit/:planId" element={<Suspense fallback={<LoadingFallback />}><PlanForm /></Suspense>} />
              <Route path="remarketing" element={<Suspense fallback={<LoadingFallback />}><Remarketing /></Suspense>} />
              <Route path="subscriptions" element={<Suspense fallback={<LoadingFallback />}><Subscriptions /></Suspense>} />
              <Route path="transactions" element={<Suspense fallback={<LoadingFallback />}><Transactions /></Suspense>} />
              <Route path="statistics" element={<Suspense fallback={<LoadingFallback />}><Statistics /></Suspense>} />
              <Route path="cron-logs" element={<Suspense fallback={<LoadingFallback />}><CronLogs /></Suspense>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BotProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
