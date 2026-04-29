import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { ContratoPDF } from '../ContratoPDF'
import type { Contrato } from '../types'
import { format } from 'date-fns'

interface Props {
  contrato: Contrato
  onClose: () => void
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').replace(/\s+/g, '-').trim()
}

export function PDFPreviewModal({ contrato, onClose }: Props) {
  const dateStr = format(new Date(contrato.createdAt), 'yyyy-MM-dd')
  const filename = `Contrato-${sanitizeFilename(contrato.cliente.nome)}-${dateStr}.pdf`

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950/95 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-3">
        <div>
          <p className="text-sm font-semibold text-white">{contrato.numero}</p>
          <p className="text-xs text-gray-400">{contrato.cliente.nome} — {contrato.projeto.nome}</p>
        </div>
        <div className="flex items-center gap-3">
          <PDFDownloadLink
            document={<ContratoPDF contrato={contrato} />}
            fileName={filename}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            {({ loading }) => loading ? 'Preparando...' : 'Baixar PDF'}
          </PDFDownloadLink>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <ContratoPDF contrato={contrato} />
        </PDFViewer>
      </div>
    </div>
  )
}
