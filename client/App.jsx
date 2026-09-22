import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import RequireAuth from "@/components/RequireAuth.jsx";

import Home from "./pages/Home.jsx";
import Index from "./pages/Index.jsx";
import DoctorLogin from "./pages/DoctorLogin.jsx";
import Registration from "./pages/Registration.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import DoctorProfile from "./pages/DoctorProfile.jsx";
import UserHome from "./pages/UserHome.jsx";
import DoctorHome from "./pages/DoctorHome.jsx";
import MedicalRecords from "./pages/MedicalRecords.jsx";
import CreateMedicalRecord from "./pages/CreateMedicalRecord.jsx";
import DoctorRecordDetail from "./pages/DoctorRecordDetail.jsx";
import NotFound from "./pages/NotFound.jsx";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />

            {/* User */}
            <Route path="/user-login" element={<Index />} />

            <Route
              path="/register/user"
              element={<Registration role="user" />}
            />

            <Route
              path="/user-profile"
              element={
                <RequireAuth role="patient">
                  <UserProfile />
                </RequireAuth>
              }
            />

            <Route
              path="/user-home"
              element={
                <RequireAuth role="patient">
                  <UserHome />
                </RequireAuth>
              }
            />

            {/* Doctor */}
            <Route
              path="/doctor-login"
              element={<DoctorLogin />}
            />

            <Route
              path="/register/doctor"
              element={<Registration role="doctor" />}
            />

            <Route
              path="/doctor-profile"
              element={
                <RequireAuth role="doctor">
                  <DoctorProfile />
                </RequireAuth>
              }
            />

            <Route
              path="/doctor-home"
              element={
                <RequireAuth role="doctor">
                  <DoctorHome />
                </RequireAuth>
              }
            />

            <Route
              path="/doctor-home/records/:id"
              element={
                <RequireAuth role="doctor">
                  <DoctorRecordDetail />
                </RequireAuth>
              }
            />

            {/* Medical Records */}
            <Route
              path="/medical-records"
              element={
                <RequireAuth role="patient">
                  <MedicalRecords />
                </RequireAuth>
              }
            />

            <Route
              path="/medical-records/new"
              element={
                <RequireAuth role="patient">
                  <CreateMedicalRecord />
                </RequireAuth>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
