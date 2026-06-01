import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || 'Something went wrong'
    if (typeof msg === 'string') {
      toast.error(msg)
    } else if (Array.isArray(msg)) {
      toast.error(msg[0]?.msg || 'Validation error')
    }
    return Promise.reject(err)
  }
)

export default api
