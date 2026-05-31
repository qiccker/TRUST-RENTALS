import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { AuthProvider } from "../hooks/useAuth";
import { BookingsProvider } from "../hooks/useBookings";
import { AccountLayout } from "../routes/account/AccountLayout";
import { AccountProfilePage } from "../routes/account/AccountProfilePage";
import { MyBookingsPage } from "../routes/account/MyBookingsPage";
import { AdminBookingsPage } from "../routes/admin/AdminBookingsPage";
import { AdminCarsPage } from "../routes/admin/AdminCarsPage";
import { AdminLayout } from "../routes/admin/AdminLayout";
import { AdminOverviewPage } from "../routes/admin/AdminOverviewPage";
import { AdminRoute } from "../routes/admin/AdminRoute";
import { AdminStaffPage } from "../routes/admin/AdminStaffPage";
import { AdminCustomersPage } from "../routes/admin/AdminCustomersPage";
import { LoginPage } from "../routes/auth/LoginPage";
import { RegisterPage } from "../routes/auth/RegisterPage";
import { ResetPasswordPage } from "../routes/auth/ResetPasswordPage";
import { UpdatePasswordPage } from "../routes/auth/UpdatePasswordPage";
import { BookingCancelPage } from "../routes/booking/BookingCancelPage";
import { BookingPage } from "../routes/booking/BookingPage";
import { BookingSuccessPage } from "../routes/booking/BookingSuccessPage";
import { ReceiptPage } from "../routes/booking/ReceiptPage";
import { CarDetailPage } from "../routes/public/CarDetailPage";
import { FleetPage } from "../routes/public/FleetPage";
import { HomePage } from "../routes/public/HomePage";
function App() {
  return <BrowserRouter>
      <AuthProvider>
        <BookingsProvider>
          <Routes>
            {/* Public pages with header/footer */}
            <Route element={<PageShell />}>
              <Route index element={<HomePage />} />
              <Route path="fleet" element={<FleetPage />} />
              <Route path="cars/:slug" element={<CarDetailPage />} />
              <Route path="book/:slug" element={<BookingPage />} />
              <Route path="success" element={<BookingSuccessPage />} />
              <Route path="checkout-cancelled" element={<BookingCancelPage />} />
              <Route path="receipt/:bookingId" element={<ReceiptPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="update-password" element={<UpdatePasswordPage />} />

              <Route path="account" element={<AccountLayout />}>
                <Route index element={<Navigate to="/account/profile" replace />} />
                <Route path="profile" element={<AccountProfilePage />} />
                <Route path="bookings" element={<MyBookingsPage />} />
              </Route>
            </Route>

            {/* Admin pages — own full-screen layout (no header/footer) */}
            <Route path="admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="cars" element={<AdminCarsPage />} />
                <Route path="bookings" element={<AdminBookingsPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="staff" element={<AdminStaffPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/fleet" replace />} />
          </Routes>
        </BookingsProvider>
      </AuthProvider>
    </BrowserRouter>;
}
export {
  App
};
