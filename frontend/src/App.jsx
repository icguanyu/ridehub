import { Route, Routes } from 'react-router-dom';
import { Center, Stack, Box } from '@mantine/core';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import Wordmark from '@/components/Wordmark';

import DriverLogin from '@/pages/auth/DriverLogin';
import DriverSignup from '@/pages/auth/DriverSignup';
import DriverDashboard from '@/pages/DriverDashboard';
import DriverEdit from '@/pages/DriverEdit';
import DriverAvailability from '@/pages/DriverAvailability';
import BookingList from '@/pages/BookingList';
import BookingDetail from '@/pages/BookingDetail';
import DriverPublic from '@/pages/DriverPublic';
import CustomerBooking from '@/pages/CustomerBooking';
import BookingConfirmation from '@/pages/BookingConfirmation';
import HomePage from '@/pages/HomePage';
import NotFound from '@/pages/NotFound';

function CenteredPage({ children }) {
  return (
    <Center mih="100vh" px="md" py="xl">
      <Box w="100%" maw={380}>
        <Stack gap="lg" align="center">
          <Wordmark size={32} withMark markSize={40} slogan />
          <Box w="100%">{children}</Box>
        </Stack>
      </Box>
    </Center>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<CenteredPage><DriverLogin /></CenteredPage>} />
      <Route path="/signup" element={<CenteredPage><DriverSignup /></CenteredPage>} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DriverDashboard />} />
        <Route path="bookings" element={<BookingList />} />
        <Route path="bookings/:bookingId" element={<BookingDetail />} />
        <Route path="edit" element={<DriverEdit />} />
        <Route path="availability" element={<DriverAvailability />} />
      </Route>

      {/* 客人端（無需登入）*/}
      <Route path="/driver/:driverId" element={<DriverPublic />} />
      <Route path="/driver/:driverId/book" element={<CustomerBooking />} />
      <Route path="/booking/:bookingId" element={<BookingConfirmation />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
