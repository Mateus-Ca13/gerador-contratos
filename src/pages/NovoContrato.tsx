import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import type { Contrato, ContratoFormData, ModeloPagamento, FormaPagamento } from '../types'
import {
  getPrestadorDefault,
  savePrestadorDefault,
  saveContrato,
  gerarNumeroContrato,
} from '../storage'
import { Toast } from '../components/Toast'
import { PDFPreviewModal } from '../components/PDFPreviewModal'

type ToastState = { message: string; type: 'success' | 'error' } | null

const defaultValues: ContratoFormData = {
  prestador: {
    razaoSocial: '',
    cnpj: '',
    endereco: '',
    email: '',
    telefone: '',
  },
  cliente: {
    nome: '',
    documento: '',
    endereco: '',
    email: '',
    telefone: '',
  },
  projeto: {
    nome: '',
    descricao: '',
    exclusoes: '',
    dataInicio: '',
    dataEntrega: '',
    rodasRevisao: 2,
  },
  pagamento: {
    valorTotal: 0,
    modelo: '50/50',
    modeloPersonalizado: '',
    forma: 'PIX',
    formaOutro: '',
  },
  config: {
    cidade: '',
    dataAssinatura: new Date().toISOString().split('T')[0],
    prazoValidade: 7,
  },
}

function getInitialValues(): ContratoFormData {
  const prestadorSalvo = getPrestadorDefault()
  if (prestadorSalvo) {
    return { ...defaultValues, prestador: prestadorSalvo }
  }
  return defaultValues
}

const inputClass =
  'w-full rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors'
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5'
const sectionClass = 'rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-4'
const sectionTitleClass = 'text-sm font-bold uppercase tracking-widest text-indigo-400 mb-1'

export function NovoContrato() {
  const navigate = useNavigate()
  const [toast, setToast] = useState<ToastState>(null)
  const [previewContrato, setPreviewContrato] = useState<Contrato | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContratoFormData>({ defaultValues: getInitialValues() })

  const modeloPagamento = watch('pagamento.modelo') as ModeloPagamento
  const formaPagamento = watch('pagamento.forma') as FormaPagamento

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])

  function buildContrato(data: ContratoFormData, status: 'rascunho' | 'gerado'): Contrato {
    return {
      id: uuidv4(),
      numero: gerarNumeroContrato(),
      createdAt: new Date().toISOString(),
      status,
      ...data,
    }
  }

  function onSalvarRascunho(data: ContratoFormData) {
    savePrestadorDefault(data.prestador)
    const contrato = buildContrato(data, 'rascunho')
    saveContrato(contrato)
    showToast('Rascunho salvo com sucesso!')
  }

  function onGerarContrato(data: ContratoFormData) {
    savePrestadorDefault(data.prestador)
    const contrato = buildContrato(data, 'gerado')
    saveContrato(contrato)
    setPreviewContrato(contrato)
    showToast('Contrato gerado com sucesso!')
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="rounded-lg border border-gray-700 p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Novo Contrato</h1>
            <p className="text-sm text-gray-500">Preencha os dados abaixo para gerar o contrato</p>
          </div>
        </div>

        <form className="space-y-6">
          {/* Seção 1 — Prestador */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>1. Prestador de Serviços</p>
            <p className="text-xs text-gray-500 mb-4">Seus dados de PJ (pré-preenchidos e salvos automaticamente)</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Razão Social *</label>
                <input {...register('prestador.razaoSocial', { required: true })} className={inputClass} placeholder="Empresa Ltda." />
                {errors.prestador?.razaoSocial && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>CNPJ *</label>
                <input {...register('prestador.cnpj', { required: true })} className={inputClass} placeholder="00.000.000/0001-00" />
                {errors.prestador?.cnpj && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <input {...register('prestador.telefone')} className={inputClass} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className={labelClass}>E-mail *</label>
                <input {...register('prestador.email', { required: true })} type="email" className={inputClass} placeholder="contato@empresa.com" />
                {errors.prestador?.email && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Endereço completo *</label>
                <input {...register('prestador.endereco', { required: true })} className={inputClass} placeholder="Rua, número, bairro, cidade, estado, CEP" />
                {errors.prestador?.endereco && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
            </div>
          </div>

          {/* Seção 2 — Cliente */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>2. Cliente (Contratante)</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nome completo ou Razão Social *</label>
                <input {...register('cliente.nome', { required: true })} className={inputClass} placeholder="João da Silva" />
                {errors.cliente?.nome && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>CPF ou CNPJ *</label>
                <input {...register('cliente.documento', { required: true })} className={inputClass} placeholder="000.000.000-00" />
                {errors.cliente?.documento && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <input {...register('cliente.telefone')} className={inputClass} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className={labelClass}>E-mail *</label>
                <input {...register('cliente.email', { required: true })} type="email" className={inputClass} placeholder="cliente@email.com" />
                {errors.cliente?.email && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Endereço completo *</label>
                <input {...register('cliente.endereco', { required: true })} className={inputClass} placeholder="Rua, número, bairro, cidade, estado, CEP" />
                {errors.cliente?.endereco && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
            </div>
          </div>

          {/* Seção 3 — Projeto */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>3. Projeto</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nome do Projeto *</label>
                <input {...register('projeto.nome', { required: true })} className={inputClass} placeholder="App de Gestão Financeira" />
                {errors.projeto?.nome && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Descrição detalhada do escopo *</label>
                <textarea
                  {...register('projeto.descricao', { required: true })}
                  rows={5}
                  className={`${inputClass} resize-none`}
                  placeholder="Descreva tudo que está incluso neste projeto..."
                />
                {errors.projeto?.descricao && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Exclusões do escopo</label>
                <textarea
                  {...register('projeto.exclusoes')}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="O que NÃO está incluso neste contrato (ex: hospedagem, conteúdo, integrações de terceiros...)"
                />
              </div>
              <div>
                <label className={labelClass}>Data de Início *</label>
                <input {...register('projeto.dataInicio', { required: true })} type="date" className={inputClass} />
                {errors.projeto?.dataInicio && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>Data de Entrega Prevista *</label>
                <input {...register('projeto.dataEntrega', { required: true })} type="date" className={inputClass} />
                {errors.projeto?.dataEntrega && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>Rodadas de revisão inclusas *</label>
                <input
                  {...register('projeto.rodasRevisao', { required: true, min: 0, valueAsNumber: true })}
                  type="number"
                  min={0}
                  className={inputClass}
                />
                {errors.projeto?.rodasRevisao && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
            </div>
          </div>

          {/* Seção 4 — Pagamento */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>4. Pagamento</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Valor Total (R$) *</label>
                <input
                  {...register('pagamento.valorTotal', { required: true, min: 1, valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min={0}
                  className={inputClass}
                  placeholder="5000.00"
                />
                {errors.pagamento?.valorTotal && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>Forma de Pagamento *</label>
                <select {...register('pagamento.forma')} className={inputClass}>
                  <option value="PIX">PIX</option>
                  <option value="Transferência bancária">Transferência bancária</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              {formaPagamento === 'Outro' && (
                <div className="sm:col-span-2">
                  <label className={labelClass}>Especifique a forma de pagamento</label>
                  <input {...register('pagamento.formaOutro')} className={inputClass} placeholder="Descreva a forma..." />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className={labelClass}>Modelo de Pagamento *</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(['50/50', '33/33/33', 'personalizado'] as ModeloPagamento[]).map((m) => (
                    <label
                      key={m}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors
                        ${modeloPagamento === m
                          ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                          : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                        }`}
                    >
                      <input type="radio" {...register('pagamento.modelo')} value={m} className="sr-only" />
                      <span className="text-sm font-medium">
                        {m === '50/50' && '50% + 50%'}
                        {m === '33/33/33' && '33% + 33% + 33%'}
                        {m === 'personalizado' && 'Personalizado'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {modeloPagamento === 'personalizado' && (
                <div className="sm:col-span-2">
                  <label className={labelClass}>Descreva as condições de pagamento *</label>
                  <textarea
                    {...register('pagamento.modeloPersonalizado')}
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="Ex: 30% na assinatura, 70% na entrega..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Seção 5 — Config */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>5. Configurações do Contrato</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className={labelClass}>Cidade (para foro) *</label>
                <input {...register('config.cidade', { required: true })} className={inputClass} placeholder="São Paulo" />
                {errors.config?.cidade && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>Data de Assinatura *</label>
                <input {...register('config.dataAssinatura', { required: true })} type="date" className={inputClass} />
                {errors.config?.dataAssinatura && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>Validade da proposta (dias) *</label>
                <input
                  {...register('config.prazoValidade', { required: true, min: 1, valueAsNumber: true })}
                  type="number"
                  min={1}
                  className={inputClass}
                  placeholder="7"
                />
                {errors.config?.prazoValidade && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleSubmit(onSalvarRascunho)}
              className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Salvar como Rascunho
            </button>
            <button
              type="button"
              onClick={handleSubmit(onGerarContrato)}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Gerar Contrato e Visualizar PDF
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {previewContrato && (
        <PDFPreviewModal
          contrato={previewContrato}
          onClose={() => {
            setPreviewContrato(null)
            navigate('/')
          }}
        />
      )}
    </div>
  )
}
