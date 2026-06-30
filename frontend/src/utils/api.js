import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
})

export const predict        = (payload)  => api.post('/api/v1/predict', payload).then((r) => r.data)
export const getRecords     = (params)   => api.get('/api/v1/records',  { params }).then((r) => r.data)
export const createRecord   = (payload)  => api.post('/api/v1/records', payload).then((r) => r.data)
export const getRecordStats = ()         => api.get('/api/v1/records/stats').then((r) => r.data)
export const getSectors     = ()         => api.get('/api/v1/sectors').then((r) => r.data)
export const getSectorsGrouped = ()      => api.get('/api/v1/sectors/grouped').then((r) => r.data)
export const getDataset     = (params)   => api.get('/api/v1/dataset', { params }).then((r) => r.data)
export const getDatasetStats = ()        => api.get('/api/v1/dataset/stats').then((r) => r.data)
export const getHealth      = ()         => api.get('/health').then((r) => r.data)

export default api
