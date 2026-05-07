import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import './App.css'

function App() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['status'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/health/')
      return response.data
    },
  })

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {(error as Error).message}</p>

  return <p>Backend says: {JSON.stringify(data)}</p>
}
export default App
