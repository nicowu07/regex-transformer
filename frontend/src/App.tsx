import axios from 'axios'
import './App.css'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

type UploadResponse = {
  filename: string
  rows: number
  columns: number
  preview: any[]
}

function App() {
  const [file, setFile] = useState<File | null>(null)

  const mutation = useMutation<UploadResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post('http://localhost:8000/api/upload/', formData)
      return response.data
    },
  })

  const handleFileChange = () => {
    if (file)
      mutation.mutate(file)
  }

  return (
    <div>
      <h1>File Upload</h1>

      <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
      <button onClick={handleFileChange} disabled={!file || mutation.isPending}>
        {mutation.isPending ? 'Uploading...' : 'Upload'}
      </button>

      {mutation.isError && (
        <p>Error: {mutation.error.message}</p>
      )}

      {mutation.data && (
        <div>
          <h2>File Info</h2>
          <p><strong>Filename:</strong> {mutation.data.filename}</p>
          <p><strong>Rows:</strong> {mutation.data.rows}</p>
          <p><strong>Columns:</strong> {mutation.data.columns}</p>

          <h3>Preview:</h3>
          <table>
            <thead>
              <tr>
                {mutation.data.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
                {mutation.data.preview.map((row, index) => (
                  <tr key={index}>
                    {mutation.data.columns.map((col) => (
                      <td key={col}>{String(row[col] ?? '')}</td>
                  ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
export default App
