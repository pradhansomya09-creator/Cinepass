import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization token if stored in memory or localStorage fallback
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ==========================================
// API SERVICES
// ==========================================

export const api = {
  // Auth
  auth: {
    login: (data: any) => apiClient.post('/auth/login', data).then((res) => res.data),
    register: (data: any) => apiClient.post('/auth/register', data).then((res) => res.data),
    logout: () => apiClient.post('/auth/logout').then((res) => res.data),
    getMe: () => apiClient.get('/auth/me').then((res) => res.data),
  },

  // Movies
  movies: {
    getAll: (params?: any) => apiClient.get('/movies', { params }).then((res) => res.data),
    getById: (id: string) => apiClient.get(`/movies/${id}`).then((res) => res.data),
    create: (data: any) => apiClient.post('/movies', data).then((res) => res.data),
    update: (id: string, data: any) => apiClient.patch(`/movies/${id}`, data).then((res) => res.data),
    delete: (id: string) => apiClient.delete(`/movies/${id}`).then((res) => res.data),
  },

  // Cities & Cinemas
  cinemas: {
    getCities: () => apiClient.get('/cinemas/cities').then((res) => res.data),
    getAll: (params?: any) => apiClient.get('/cinemas', { params }).then((res) => res.data),
    getById: (id: string) => apiClient.get(`/cinemas/${id}`).then((res) => res.data),
    createCity: (data: any) => apiClient.post('/cinemas/cities', data).then((res) => res.data),
    createCinema: (data: any) => apiClient.post('/cinemas', data).then((res) => res.data),
    createScreen: (data: any) => apiClient.post('/cinemas/screens', data).then((res) => res.data),
  },

  // Shows & Seats
  shows: {
    getAll: (params?: any) => apiClient.get('/shows', { params }).then((res) => res.data),
    getById: (id: string) => apiClient.get(`/shows/${id}`).then((res) => res.data),
    getSeats: (showId: string) => apiClient.get(`/shows/${showId}/seats`).then((res) => res.data),
    create: (data: any) => apiClient.post('/shows', data).then((res) => res.data),
    delete: (id: string) => apiClient.delete(`/shows/${id}`).then((res) => res.data),
  },

  // Seats & Holds
  seats: {
    hold: (data: { showId: string; seatIds: string[] }) =>
      apiClient.post('/seats/holds', data).then((res) => res.data),
    getHoldStatus: (holdId: string) =>
      apiClient.get(`/seats/holds/${holdId}`).then((res) => res.data),
    releaseHold: (holdId: string) =>
      apiClient.delete(`/seats/holds/${holdId}`).then((res) => res.data),
  },

  // Bookings
  bookings: {
    create: (data: { showId: string; seatHoldId: string; couponCode?: string }) =>
      apiClient.post('/bookings', data).then((res) => res.data),
    getAll: (params?: any) => apiClient.get('/bookings', { params }).then((res) => res.data),
    getById: (id: string) => apiClient.get(`/bookings/${id}`).then((res) => res.data),
    cancel: (id: string, reason: string) =>
      apiClient.post(`/bookings/${id}/cancel`, { reason }).then((res) => res.data),
  },

  // Coupons
  coupons: {
    validate: (data: { code: string; showId: string; subtotal: number }) =>
      apiClient.post('/coupons/validate', data).then((res) => res.data),
    getAll: () => apiClient.get('/coupons').then((res) => res.data),
    create: (data: any) => apiClient.post('/coupons', data).then((res) => res.data),
    delete: (id: string) => apiClient.delete(`/coupons/${id}`).then((res) => res.data),
  },

  // Payments
  payments: {
    verify: (data: {
      bookingId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => apiClient.post('/payments/verify', data).then((res) => res.data),
  },

  // Tickets
  tickets: {
    getById: (id: string) => apiClient.get(`/tickets/${id}`).then((res) => res.data),
    validateStaff: (token: string) => apiClient.post('/tickets/validate', { token }).then((res) => res.data),
  },

  // User Profile
  users: {
    getProfile: () => apiClient.get('/users/profile').then((res) => res.data),
    updateProfile: (data: any) => apiClient.patch('/users/profile', data).then((res) => res.data),
    changePassword: (data: any) => apiClient.patch('/users/password', data).then((res) => res.data),
  },

  // Admin
  admin: {
    getDashboard: () => apiClient.get('/admin/dashboard').then((res) => res.data),
    getBookings: (params?: any) => apiClient.get('/admin/bookings', { params }).then((res) => res.data),
    getUsers: (params?: any) => apiClient.get('/admin/users', { params }).then((res) => res.data),
    updateUserRole: (id: string, role: string) =>
      apiClient.patch(`/admin/users/${id}/role`, { role }).then((res) => res.data),
    getPayments: () => apiClient.get('/admin/payments').then((res) => res.data),
  },
};

export default api;
