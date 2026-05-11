import axios from 'axios'
import './App.css'
import { useState, useEffect } from 'react'
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

  const applyMutation = useMutation<ApplyRegexResponse, Error, {file_id: string, pattern: string, columns: string[], replacement: string}>({
    mutationFn: async (input) => {
      const res = await axios.post(`${API_BASE}/apply-regex/`, input)
      return res.data
    }
  })

  useEffect(() => {
    if (uploadMutation.data?.file_id) {
      generateMutation.reset()
      applyMutation.reset()
    }
  }, [uploadMutation.data?.file_id])

  const previewColumns = applyMutation.data?.columns || uploadMutation.data?.columns || []
  const previewRows = applyMutation.data?.preview || uploadMutation.data?.preview || []

  return (
    <div className="min-h-screen bg-gray-100 py-8">
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
          {!uploadMutation.data && !uploadMutation.isPending && (
            <p className="text-sm text-gray-500 mt-2 my-5">Upload a CSV or Excel file to get started</p>
          )}
          <input 
            type="file" 
            accept=".csv,.xlsx,.xls" 
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="text-sm text-gray-600
              file:mr-4 file:py-1 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              file:cursor-pointer"
          />
          <button 
            className="border-blue-200 text-blue-600 hover:border-transparent hover:bg-blue-300 hover:bg-blue-700 px-4 py-1 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50" 
            onClick={handleFileChange}
            disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </button>
          {uploadMutation.data && (
            <p className="text-sm text-green-700 mt-2">
              ✓ Uploaded {uploadMutation.data.filename} ({uploadMutation.data.rows} rows)
            </p>
          )}
        </section>

        {uploadMutation.isError && (
          <p>Error: {uploadMutation.error.message}</p>
        )}

        {/* File preview section */}
        {uploadMutation.data && uploadMutation.data.preview.length && (  
          <div>
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Original File Preview</h2>
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100 text-left border-b">
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {uploadMutation.data.columns.map((col) => (
                      <th key={col} className="px-4 py-1 text-left font-medium text-gray-700">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                    {uploadMutation.data.preview.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        {uploadMutation.data.columns.map((col) => (
                          <td key={col} className="px-4 py-2 text-gray-900">
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
              className="w-full border border-gray-300 rounded p-3 text-sm"
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
              <p className="mt-2 text-sm text-red-600">
                Error: {generateMutation.error.message}
              </p>
            )}
          </section>
        )}

        {/* Display generated regex info */}
        {generateMutation.data && (
          <div className="space-y-3 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Generated pattern</h2>
            <div className="bg-gray-100 border border-gray-200 rounded p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pattern</p>
              <code className="text-sm font-mono break-all">{generateMutation.data.pattern}</code>
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
            <button
              className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                applyMutation.mutate({
                  pattern: generateMutation.data.pattern,
                  columns: generateMutation.data.columns,
                  replacement: generateMutation.data.replacement,
                  file_id: uploadMutation.data?.file_id || ''
                })
              }}
              disabled={applyMutation.isPending}
            >{applyMutation.isPending ? 'Applying...' : 'Apply Regex'}
            </button>
          </div>
        )}

        {/* Apply regex and show results section */}
        {applyMutation.data && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Transformed File Preview</h2>
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100 text-left border-b">
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {applyMutation.data.columns.map((col) => (
                      <th key={col} className="px-4 py-1 text-left font-medium text-gray-700">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                    {applyMutation.data.preview.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        {applyMutation.data.columns.map((col) => (
                          <td key={col} className="px-4 py-2 text-gray-900">
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            <p className="text-sm text-gray-600 my-2">
              ✓ Applied regex to {applyMutation.data.counts} cells.
            </p>
            <a 
              href={`${API_BASE}/download/${applyMutation.data.result_file_id}/`}
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 no-underline"
            >
              Download CSV
            </a>
          </div>
        )}
        
      </div>
    </div>
  )
}
export default App
