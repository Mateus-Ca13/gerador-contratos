import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Contrato } from '../types'
import { getHistorico, deleteContrato } from '../storage'
import { Toast } from '../components/Toast'
import { PDFPreviewModal } from '../components/PDFPreviewModal'

type ToastState = { message: string; type: 'success' | 'error' } | null

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function Home() {
  const navigate = useNavigate()
  const [historico, setHistorico] = useState<Contrato[]>(() => getHistorico())
  const [previewContrato, setPreviewContrato] = useState<Contrato | null>(null)
  const [toast, setToast] = useState<ToastState>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])

  function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return
    deleteContrato(id)
    setHistorico(getHistorico())
    showToast('Contrato excluído.')
  }

  function handleEdit(contrato: Contrato) {
    navigate(`/editar/${contrato.id}`)
  }

  function handleUseAsBase(contrato: Contrato) {
    navigate(`/novo?base=${contrato.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Contratos</h1>
            <p className="mt-1 text-sm text-gray-500">
              {historico.length === 0
                ? 'Nenhum contrato gerado ainda'
                : `${historico.length} contrato${historico.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => navigate('/novo')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Contrato
          </button>
        </div>

        {/* Empty state */}
        {historico.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-900/50 py-20 text-center">
            <svg className="mb-4 h-12 w-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 text-sm">Nenhum contrato ainda.</p>
            <button
              onClick={() => navigate('/novo')}
              className="mt-4 text-indigo-400 text-sm hover:text-indigo-300 underline"
            >
              Criar primeiro contrato
            </button>
          </div>
        )}

        {/* Contract list */}
        {historico.length > 0 && (
          <div className="space-y-3">
            {historico.map((contrato) => (
              <div
                key={contrato.id}
                className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 transition-colors hover:border-gray-700"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono text-gray-500">{contrato.numero}</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold
                        ${contrato.status === 'gerado'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-yellow-900/30 text-yellow-500'
                        }`}
                    >
                      {contrato.status === 'gerado' ? 'Gerado' : 'Rascunho'}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-base font-semibold text-white">
                    {contrato.cliente.nome}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                    <span>{contrato.projeto.nome}</span>
                    <span>·</span>
                    <span className="font-semibold text-gray-400">
                      {formatCurrency(contrato.pagamento.valorTotal)}
                    </span>
                    <span>·</span>
                    <span>
                      {format(new Date(contrato.createdAt), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setPreviewContrato(contrato)}
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
                    title="Visualizar PDF"
                  >
                    Ver PDF
                  </button>
                  <button
                    onClick={() => handleEdit(contrato)}
                    className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    title="Editar contrato"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleUseAsBase(contrato)}
                    className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    title="Usar como base para novo contrato"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(contrato.id)}
                    className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:border-red-700 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {previewContrato && (
        <PDFPreviewModal
          contrato={previewContrato}
          onClose={() => setPreviewContrato(null)}
        />
      )}
    </div>
  )
}
