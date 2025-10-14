import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bots = lazy(() => import('./pages/Bots'));
const BotCreate = lazy(() => import('./pages/BotCreate'));
const BotEditor = lazy(() => import('./pages/BotEditor'));
const BotWebhook = lazy(() => import('./pages/BotWebhook'));
const BotCommands = lazy(() => import('./pages/BotCommands'));
const BotPayment = lazy(() => import('./pages/BotPayment'));
const Plans = lazy(() => import('./pages/Plans'));
const PlanForm = lazy(() => import('./pages/PlanForm'));
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
            <Route path="bots" element={<Suspense fallback={<LoadingFallback />}><Bots /></Suspense>} />
            <Route path="bots/create" element={<Suspense fallback={<LoadingFallback />}><BotCreate /></Suspense>} />
            <Route path="bots/edit/:botId" element={<Suspense fallback={<LoadingFallback />}><BotCreate /></Suspense>} />
            <Route path="bot-editor" element={<Suspense fallback={<LoadingFallback />}><BotEditor /></Suspense>} />
            <Route path="bots/:botId/webhook" element={<Suspense fallback={<LoadingFallback />}><BotWebhook /></Suspense>} />
            <Route path="bots/:botId/commands" element={<Suspense fallback={<LoadingFallback />}><BotCommands /></Suspense>} />
            <Route path="bots/:botId/payment" element={<Suspense fallback={<LoadingFallback />}><BotPayment /></Suspense>} />
            <Route path="bots/:botId/plans" element={<Suspense fallback={<LoadingFallback />}><Plans /></Suspense>} />
            <Route path="bots/:botId/plans/create" element={<Suspense fallback={<LoadingFallback />}><PlanForm /></Suspense>} />
            <Route path="bots/:botId/plans/edit/:planId" element={<Suspense fallback={<LoadingFallback />}><PlanForm /></Suspense>} />
            <Route path="subscriptions" element={<Suspense fallback={<LoadingFallback />}><Subscriptions /></Suspense>} />
            <Route path="transactions" element={<Suspense fallback={<LoadingFallback />}><Transactions /></Suspense>} />
            <Route path="statistics" element={<Suspense fallback={<LoadingFallback />}><Statistics /></Suspense>} />
            <Route path="cron-logs" element={<Suspense fallback={<LoadingFallback />}><CronLogs /></Suspense>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
