
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ReportPage from "./pages/ReportPage";
import AdminPanel from "./pages/AdminPanel";
import Docs from "./pages/Docs";
import { CodeEditorThemeProvider } from "@/contexts/CodeEditorThemeContext";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import { ChatbotToggle } from "@/components/ChatbotToggle";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine if we're on the home page (Landing)
  const isHomePage = location.pathname === '/';
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/migration" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/legacy" element={<Index />} />
        <Route path="/report/:reportId" element={<ReportPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/docs" element={<Docs />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Show floating chatbot toggle for pages that don't have it in header */}
      {user && !isHomePage && location.pathname !== '/migration' && location.pathname !== '/history' && !location.pathname.startsWith('/report/') && location.pathname !== '/admin' && location.pathname !== '/auth' && location.pathname !== '/docs' && (
        <ChatbotToggle 
          isVisible={true}
          isCollapsed={true}
        />
      )}
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CodeEditorThemeProvider>
              <ChatbotProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </ChatbotProvider>
            </CodeEditorThemeProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
