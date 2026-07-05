import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Friends from "./pages/Friends";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import Settlements from "./pages/Settlements";
import AiAssistant from "./pages/AiAssistant";
import DebtMinimizerPage from "./pages/DebtMinimizerPage";
import ExpenseHistory from "./pages/ExpenseHistory";
import SpendingCharts from "./pages/SpendingCharts";
import ScanReceiptPage from "./pages/ScanReceiptPage";
import FeedbackPage from "./pages/FeedbackPage";
import Evidence from "./pages/Evidence";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
          <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
          <Route path="/settlements" element={<ProtectedRoute><Settlements /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AiAssistant /></ProtectedRoute>} />
          <Route path="/minimizer" element={<ProtectedRoute><DebtMinimizerPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><ExpenseHistory /></ProtectedRoute>} />
          <Route path="/charts" element={<ProtectedRoute><SpendingCharts /></ProtectedRoute>} />
          <Route path="/scan" element={<ProtectedRoute><ScanReceiptPage /></ProtectedRoute>} />
          <Route path="/scan/:groupId" element={<ProtectedRoute><ScanReceiptPage /></ProtectedRoute>} />
          <Route path="/evidence" element={<ProtectedRoute><Evidence /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
          <Route path="*" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                <p className="text-gray-500 mb-4">Page not found</p>
                <a href="/" className="text-green-600 hover:underline">Go to Dashboard</a>
              </div>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
