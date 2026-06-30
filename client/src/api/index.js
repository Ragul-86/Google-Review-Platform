import API from './axios';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:       (data) => API.post('/auth/login', data),
  logout:      () => API.post('/auth/logout'),
  refresh:     (refreshToken) => API.post('/auth/refresh', { refreshToken }),
  me:          () => API.get('/auth/me'),
  setPassword: (data) => API.post('/auth/set-password', data),
};

// ─── Clients ─────────────────────────────────────────────────────────────────
export const clientsAPI = {
  getAll: (params) => API.get('/clients', { params }),
  getById: (id) => API.get(`/clients/${id}`),
  create: (data) => API.post('/clients', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => API.put(`/clients/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => API.delete(`/clients/${id}`),
  toggleStatus: (id) => API.patch(`/clients/${id}/status`),
  resetPassword: (id) => API.post(`/clients/${id}/reset-password`),
  resetLoginId: (id, newEmail) => API.patch(`/clients/${id}/reset-login`, { newEmail }),
  sendMessage: (id, data) => API.post(`/clients/${id}/message`, data),
  getMe:               () => API.get('/clients/me'),
  updateMe:            (data) => API.put('/clients/me', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // Onboarding status
  updateOnboardingStatus: (id, onboardingStatus) => API.patch(`/clients/${id}/onboarding-status`, { onboardingStatus }),
  onboardingAction:    (action) => API.patch('/clients/me/onboarding', { action }),
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll: (params) => API.get('/categories', { params }),
  create: (data) => API.post('/categories', data),
  bulkCreate: (data) => API.post('/categories/bulk', data),
  update: (id, data) => API.put(`/categories/${id}`, data),
  reorder: (data) => API.patch('/categories/reorder', data),
  delete: (id) => API.delete(`/categories/${id}`),
  suggest: (data) => API.post('/categories/suggest', data),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsAPI = {
  getAll: (params) => API.get('/reviews', { params }),
  getById: (id) => API.get(`/reviews/${id}`),
  submit: (data) => API.post('/reviews/submit', data),
  suggestions: (data) => API.post('/reviews/suggestions', data),
  delete: (id) => API.delete(`/reviews/${id}`),
  overview: (params) => API.get('/reviews/overview', { params }),
  stats: (params) => API.get('/reviews/stats', { params }),
};

// ─── Feedback ────────────────────────────────────────────────────────────────
export const feedbackAPI = {
  getAll: (params) => API.get('/feedback', { params }),
  getById: (id) => API.get(`/feedback/${id}`),
  updateStatus: (id, status) => API.patch(`/feedback/${id}/status`, { status }),
  delete: (id) => API.delete(`/feedback/${id}`),
};

// ─── QR Codes ────────────────────────────────────────────────────────────────
export const qrcodesAPI = {
  getAll: (params) => API.get('/qrcodes', { params }),
  create: (data) => API.post('/qrcodes', data),
  delete: (id) => API.delete(`/qrcodes/${id}`),
  regenerate: (id) => API.post(`/qrcodes/${id}/regenerate`),
  trackScan: (token) => API.post(`/qrcodes/scan/${token}`),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsAPI = {
  get: (params) => API.get('/analytics', { params }),
  overview: () => API.get('/analytics/overview'),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsAPI = {
  exportReviews:   (params) => API.get('/reports/reviews',   { params, responseType: 'blob' }),
  exportFeedback:  (params) => API.get('/reports/feedback',  { params, responseType: 'blob' }),
  exportFull:      (params) => API.get('/reports/full',      { params, responseType: 'blob' }),
  exportClients:   (params) => API.get('/reports/clients',   { params, responseType: 'blob' }),
  exportCustomers: (params) => API.get('/reports/customers', { params, responseType: 'blob' }),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => API.get('/users', { params }),
  getById: (id) => API.get(`/users/${id}`),
  create: (data) => API.post('/users', data),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
  updateProfile: (data) => API.put('/users/profile', data),
};

// ─── WhatsApp Templates ───────────────────────────────────────────────────────
export const whatsappAPI = {
  getAll:      ()         => API.get('/whatsapp-templates'),
  create:      (data)     => API.post('/whatsapp-templates', data),
  update:      (id, data) => API.put(`/whatsapp-templates/${id}`, data),
  delete:      (id)       => API.delete(`/whatsapp-templates/${id}`),
  setDefault:  (id)       => API.patch(`/whatsapp-templates/${id}/set-default`),
  aiGenerate:  (data)     => API.post('/whatsapp-templates/ai-generate', data),
};

// ─── Services ─────────────────────────────────────────────────────────────────
export const servicesAPI = {
  getAll:  (params)   => API.get('/services', { params }),
  create:  (data)     => API.post('/services', data),
  update:  (id, data) => API.put(`/services/${id}`, data),
  delete:  (id)       => API.delete(`/services/${id}`),
  toggle:  (id)       => API.patch(`/services/${id}/toggle`),
};

// ─── Customers ───────────────────────────────────────────────────────────────
export const customersAPI = {
  getAll:          (params) => API.get('/customers', { params }),
  create:          (data)   => API.post('/customers', data),
  update:          (id, data) => API.put(`/customers/${id}`, data),
  delete:          (id)     => API.delete(`/customers/${id}`),
  markWhatsapp:    (id)     => API.patch(`/customers/${id}/whatsapp-sent`),
  getAnalytics:    ()       => API.get('/customers/analytics'),
};

// ─── Public ──────────────────────────────────────────────────────────────────
export const publicAPI = {
  getClientBySlug: (slug) => API.get(`/public/client/${slug}`),
  // Track customer review journey from public review page (no auth)
  trackCustomer: (id, status) => API.patch(`/public/customer/${id}/track`, { status }),
};

// ─── Public Scratch Card link (/reward/:token) ─────────────────────────────────
export const publicScratchAPI = {
  // Read-only lookup — never mutates (except a lazy expiry sweep)
  getByToken: (token) => API.get(`/public/reward/${token}`),
  // The ONE-TIME reveal — only ever called once per token by the customer
  scratch:    (token) => API.post(`/public/reward/${token}/scratch`),
};

// ─── Rewards: tier configuration (Scratch Card Rewards) ───────────────────────
export const rewardConfigAPI = {
  getAll:       (params) => API.get('/rewards/configs', { params }),
  getMonths:    ()       => API.get('/rewards/configs/months'),
  getCycleStatus: ()     => API.get('/rewards/configs/cycle-status'),
  getHistory:   ()       => API.get('/rewards/configs/history'),
  create:       (data)   => API.post('/rewards/configs', data),
  bulkGenerate: (data)   => API.post('/rewards/configs/bulk-generate', data),
  update:       (id, data) => API.put(`/rewards/configs/${id}`, data),
  delete:       (id)     => API.delete(`/rewards/configs/${id}`),
  toggle:       (id)     => API.patch(`/rewards/configs/${id}/toggle`),
  reset:        (data)   => API.post('/rewards/configs/reset', data),
};

// ─── Rewards: transactions (Reward Management) ────────────────────────────────
export const rewardsAPI = {
  getAll:             (params) => API.get('/rewards/transactions', { params }),
  getById:            (id)     => API.get(`/rewards/transactions/${id}`),
  getCampaigns:       ()       => API.get('/rewards/campaigns'),
  create:             (data)   => API.post('/rewards/transactions', data),
  markWhatsappOpened: (id)     => API.patch(`/rewards/transactions/${id}/whatsapp-opened`),
  markSent:           (id)     => API.patch(`/rewards/transactions/${id}/mark-sent`),
  updateStatus:       (id, status) => API.patch(`/rewards/transactions/${id}/status`, { status }),
};
