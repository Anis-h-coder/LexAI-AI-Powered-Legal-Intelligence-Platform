import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatBot from "./components/ChatBot";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ContractAnalyzer from "./pages/ContractAnalyzer";
import DocumentQA from "./pages/DocumentQA";
import ContractGenerator from "./pages/ContractGenerator";
import ClauseComparator from "./pages/ClauseComparator";
import JargonTranslator from "./pages/JargonTranslator";


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/analyzer" element={<ProtectedRoute><ContractAnalyzer /></ProtectedRoute>} />
          <Route path="/qa" element={<ProtectedRoute><DocumentQA /></ProtectedRoute>} />
          <Route path="/generator" element={<ProtectedRoute><ContractGenerator /></ProtectedRoute>} />
          <Route path="/comparator" element={<ProtectedRoute><ClauseComparator /></ProtectedRoute>} />
          <Route path="/translator" element={<ProtectedRoute><JargonTranslator /></ProtectedRoute>} />
        </Routes>
        <ChatBot />
      </BrowserRouter>
    </AuthProvider>
  );
}