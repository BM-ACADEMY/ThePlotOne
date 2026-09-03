import "./App.css";
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NavProvider } from "./context/NavContext";
import { SocketProvider } from "./context/SocketContext";
import { LocationProvider } from "./context/LocationContext";
import { Toaster } from "react-hot-toast";

import ScrollToTop from "./components/Common/ScrollToTop";
import { HelmetProvider } from "react-helmet-async";
import Loader from "./components/Common/Loader";

import { setGlobalNavigate } from "./services/navigationService";


const AppRoutes = lazy(() => import("./AppRoute"));

// Helper component to capture the navigate function from React Router
const NavigateSetter = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setGlobalNavigate(navigate);
  }, [navigate]);
  return null;
};

function App() {
  return (
    <HelmetProvider>
        <div>
          <Toaster
            position="top-center"
            reverseOrder={false}
            containerStyle={{
              zIndex: 999999,
            }}
          />
          <AuthProvider>
            <LocationProvider>
              <SocketProvider>
                <NavProvider>
                  <BrowserRouter>
                    <NavigateSetter />
                    <ScrollToTop />
                    <Suspense fallback={<Loader />}>
                      <AppRoutes />
                    </Suspense>
                  </BrowserRouter>
                </NavProvider>
              </SocketProvider>
            </LocationProvider>
          </AuthProvider>
        </div>
    </HelmetProvider>
  );
}

export default App;
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { ConfigProvider } from 'antd';
// import Login from './components/Auth/Login';
// import Signup from './components/Auth/Signup';
// import OtpVerify from './components/Auth/OtpVerify';
// import ResendOtp from './components/Auth/ResendOtp';
// import ResetPassword from './components/Auth/ResetPassword';
// import ForgotPassword from './components/Auth/ForgotPassword';

// // Placeholder for protected/home page
// const Home = () => <div className="p-8 text-2xl">Welcome! You are logged in 🎉</div>;

// function App() {
//   return (
//     <ConfigProvider
//       theme={{
//         token: {
//           colorPrimary: '#1890ff',
//           borderRadius: 6,
//         },
//       }}
//     >
//       <Router>
//         <div className="min-h-screen bg-gray-50">
//           <Routes>
//             <Route path="/" element={<Navigate to="/login" replace />} />
//             <Route path="/login" element={<Login />} />
//             <Route path="/signup" element={<Signup />} />
//             <Route path="/otp-verify" element={<OtpVerify />} />
//             <Route path="/resend-otp" element={<ResendOtp />} />
//              <Route path="/forgot-password" element={<ForgotPassword />} />
//             <Route path="/reset-password" element={<ResetPassword />} />
//             <Route path="/home" element={<Home />} />

//             {/* Catch-all */}
//             <Route path="*" element={<div>404 - Not Found</div>} />
//           </Routes>
//         </div>
//       </Router>
//     </ConfigProvider>
//   );

// }

// export default App;
