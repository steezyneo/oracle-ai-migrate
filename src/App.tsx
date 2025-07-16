
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import HistorySystem from "./components/HistorySystem";
import HistoryTest from "./components/HistoryTest";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ReportPage from "./pages/ReportPage";

const queryClient = new QueryClient();

<<<<<<< HEAD
// Simple test component to debug routing
const TestComponent = () => {
  console.log("TestComponent rendered");
  return (
    <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' }}>
      <h1>Test Component - If you see this, routing is working</h1>
      <p>This is a test to see if the routing is functioning properly.</p>
    </div>
  );
};

const App = () => {
  console.log("App component rendered");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/migration" element={<Dashboard />} />
              <Route path="/history" element={<HistorySystem />} />
              <Route path="/history-test" element={<HistoryTest />} />
              <Route path="/legacy" element={<Index />} />
              <Route path="/test" element={<TestComponent />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
=======
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/migration" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/legacy" element={<Index />} />
            <Route path="/report/:reportId" element={<ReportPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
>>>>>>> c87813688d0b740fce765260f0e1a703e70a7ea1

export default App;
