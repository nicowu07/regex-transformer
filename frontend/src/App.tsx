import axios from 'axios'
import './App.css'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

type UploadResponse = {
  filename: string
  rows: number
  columns: string[]
  preview: Record<string, unknown>[],
  file_id: string
}

type GenerateRegexResponse = {
  pattern: string,
  columns: string[],
  replacement: string
}
type ApplyRegexResponse = {
  result_file_id: string,
  counts: number,
  preview: Record<string, unknown>[],
  columns: string[]
}

const API_BASE = 'http://localhost:8000/api'


function App() {
  const [file, setFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState<string>('')

  const uploadMutation = useMutation<UploadResponse, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post(`${API_BASE}/upload/`, formData)
      return response.data
    },
  })

  const handleFileChange = () => {
    if (file)
      uploadMutation.mutate(file)
  }

  const generateMutation = useMutation<GenerateRegexResponse, Error, {prompt: string, columns: string[]}>({
    mutationFn: async (input) => {
      const res = await axios.post(`${API_BASE}/generate-regex/`, input)
      return res.data
    }
  })

  return (
    <div className="min-h-screen bg-gray-70 py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Regex Transformer</h1>
          <p className="text-sm text-gray-600 mt-1">
            Find and replace patterns in CSV files using natural language.
          </p>
        </header>

        {/* File upload section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Upload</h2>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
          <button 
            className="border-blue-200 text-blue-600 hover:border-transparent hover:bg-blue-300 hover:text-white active:bg-blue-700" 
            onClick={handleFileChange}
            disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </button>
        </section>

        {uploadMutation.isError && (
          <p>Error: {uploadMutation.error.message}</p>
        )}

        {/* File info and preview section */}
        {uploadMutation.data && (
          <div>
            <h2>File Info</h2>
            <p><strong>Filename:</strong> {uploadMutation.data.filename}</p>
            <p><strong>Rows:</strong> {uploadMutation.data.rows}</p>
            <p><strong>Columns:</strong> {uploadMutation.data.columns}</p>
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Preview</h2>
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    {uploadMutation.data.columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                    {uploadMutation.data.preview.map((row, index) => (
                      <tr key={index}>
                        {uploadMutation.data.columns.map((col) => (
                          <td key={col} className="border px-4 py-2">
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* Prompt input and regex generation section */}
        {uploadMutation.data && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Describe what to find</h2>
            <textarea
              className="w-full boarder boarder=gray-300 rounded p-3 text-sm"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Find all email addresses and replace the domain with 'example.com'"
            />
            <button
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (!prompt.trim()) return
                generateMutation.mutate({
                  prompt: prompt.trim(),
                  columns: uploadMutation.data?.columns || []
                })
              }}
              disabled={generateMutation.isPending || !prompt.trim()}
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate Regex'}
            </button>
            {generateMutation.isError && (
              <p className="">
                Error: {generateMutation.error.message}
              </p>
            )}
          </section>
        )}

        {/* Display generated regex info */}
        {generateMutation.data && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pattern</p>
              <code className="block bg-gray-500 rounded p-2 text-sm font-mono text-white shadow">{generateMutation.data.pattern}</code>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">columns to apply pattern</p>
              <p className="text-sm">
                {generateMutation.data.columns.length > 0
                  ? generateMutation.data.columns.join(', ')
                  : 'All columns (no specific columns identified)'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Replacement</p>
              <p className="text-sm font-mono">{generateMutation.data.replacement || '(empty)'}</p>
            </div>
          </div>
        )}


        {generateMutation.data && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Download</h2>
            <p className="text-sm text-gray-500">{/* TODO step 5 */}</p>
          </section>
        )}
        
      </div>
    </div>
  )
}
export default App
