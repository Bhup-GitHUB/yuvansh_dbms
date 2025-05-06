
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Get user role
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          setRole(data?.role || null);
        } else {
          setRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Get user role
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setRole(data?.role || null);
      }
      
      setLoading(false);
    };

    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              user ? (
                role === 'teacher' ? <Navigate to="/teacher-dashboard" /> : <Navigate to="/student-dashboard" />
              ) : (
                <Index />
              )
            } />
            <Route path="/login" element={
              user ? (
                role === 'teacher' ? <Navigate to="/teacher-dashboard" /> : <Navigate to="/student-dashboard" />
              ) : (
                <Index />
              )
            } />
            <Route 
              path="/teacher-dashboard" 
              element={
                user ? (
                  role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/" />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            <Route 
              path="/student-dashboard" 
              element={
                user ? (
                  role === 'student' ? <StudentDashboard /> : <Navigate to="/" />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
