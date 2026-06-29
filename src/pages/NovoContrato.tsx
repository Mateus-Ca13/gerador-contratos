import { useState, useCallback, useEffect, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import type { Contrato, ContratoFormData, ModeloPagamento, FormaPagamento, TipoPessoa, EtapaPagamento, ModoServicos } from '../types'
import {
  getPrestadorDefault,
  savePrestadorDefault,
  saveContrato,
  getContrato,
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
    tipoPessoa: 'fisica',
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
    prazoInicio: 7,
    unidadeInicio: 'dias',
    prazoEstimado: 30,
    unidadePrazo: 'dias_uteis',
    tolerancia: 5,
    rodasRevisao: 2,
  },
  pagamento: {
    valorTotal: 0,
    modelo: '50/50',
    etapas: [
      { descricao: 'Assinatura do contrato', percentual: 50 },
      { descricao: 'Entrega final do projeto', percentual: 50 },
    ],
    forma: 'PIX',
    formaOutro: '',
  },
  servicosAdicionais: {
    modo: 'nenhum',
    hospedagem: { incluso: false, meses: 12, valorMensal: 0 },
    manutencao: { incluso: false, meses: 3, valorMensal: 0 },
    pacoteMeses: 12,
    pacoteValorMensal: 0,
  },
  config: {
    cidade: '',
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
  const { id: editId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const baseId = searchParams.get('base')

  const contratoExistente = useMemo(() => {
    const targetId = editId || baseId
    return targetId ? getContrato(targetId) : null
  }, [editId, baseId])

  const isEditing = !!editId && !!contratoExistente

  function getFormValues(): ContratoFormData {
    if (contratoExistente) {
      const { id: _id, numero: _num, createdAt: _cr, status: _st, ...formData } = contratoExistente
      return formData
    }
    return getInitialValues()
  }

  const [toast, setToast] = useState<ToastState>(null)
  const [previewContrato, setPreviewContrato] = useState<Contrato | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<ContratoFormData>({ defaultValues: getFormValues() })

  const { fields: etapasFields, replace: replaceEtapas, append: appendEtapa, remove: removeEtapa } = useFieldArray({
    control,
    name: 'pagamento.etapas',
  })

  const tipoPessoa = watch('cliente.tipoPessoa') as TipoPessoa
  const modeloPagamento = watch('pagamento.modelo') as ModeloPagamento
  const formaPagamento = watch('pagamento.forma') as FormaPagamento
  const modoServicos = watch('servicosAdicionais.modo') as ModoServicos
  const hospedagemInclusa = watch('servicosAdicionais.hospedagem.incluso')
  const manutencaoInclusa = watch('servicosAdicionais.manutencao.incluso')

  const etapasDefaults: Record<ModeloPagamento, EtapaPagamento[]> = {
    '50/50': [
      { descricao: 'Assinatura do contrato', percentual: 50 },
      { descricao: 'Entrega final do projeto', percentual: 50 },
    ],
    '33/33/33': [
      { descricao: 'Assinatura do contrato', percentual: 33 },
      { descricao: '', percentual: 33 },
      { descricao: 'Entrega final do projeto', percentual: 34 },
    ],
    'personalizado': [
      { descricao: 'Assinatura do contrato', percentual: 50 },
      { descricao: 'Entrega final do projeto', percentual: 50 },
    ],
  }

  useEffect(() => {
    replaceEtapas(etapasDefaults[modeloPagamento])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeloPagamento])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])

  function buildContrato(data: ContratoFormData, status: 'rascunho' | 'gerado'): Contrato {
    if (isEditing && contratoExistente) {
      return {
        ...contratoExistente,
        status,
        ...data,
      }
    }
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
    showToast(isEditing ? 'Contrato atualizado!' : 'Rascunho salvo com sucesso!')
  }

  function onGerarContrato(data: ContratoFormData) {
    savePrestadorDefault(data.prestador)
    const contrato = buildContrato(data, 'gerado')
    saveContrato(contrato)
    setPreviewContrato(contrato)
    showToast(isEditing ? 'Contrato atualizado e gerado!' : 'Contrato gerado com sucesso!')
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
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? 'Editar Contrato' : baseId ? 'Novo Contrato (usando base)' : 'Novo Contrato'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditing
                ? `Editando ${contratoExistente.numero}`
                : baseId && contratoExistente
                  ? `Baseado em ${contratoExistente.numero} — será criado como novo contrato`
                  : 'Preencha os dados abaixo para gerar o contrato'}
            </p>
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
                <label className={labelClass}>Tipo de Pessoa *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['fisica', 'juridica'] as TipoPessoa[]).map((tipo) => (
                    <label
                      key={tipo}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors
                        ${tipoPessoa === tipo
                          ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                          : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                        }`}
                    >
                      <input type="radio" {...register('cliente.tipoPessoa')} value={tipo} className="sr-only" />
                      <span className="text-sm font-medium">
                        {tipo === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  {tipoPessoa === 'juridica' ? 'Razão Social *' : 'Nome completo *'}
                </label>
                <input
                  {...register('cliente.nome', { required: true })}
                  className={inputClass}
                  placeholder={tipoPessoa === 'juridica' ? 'Empresa Ltda.' : 'João da Silva'}
                />
                {errors.cliente?.nome && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>
                  {tipoPessoa === 'juridica' ? 'CNPJ *' : 'CPF *'}
                </label>
                <input
                  {...register('cliente.documento', { required: true })}
                  className={inputClass}
                  placeholder={tipoPessoa === 'juridica' ? '00.000.000/0001-00' : '000.000.000-00'}
                />
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
                <label className={labelClass}>Início após assinatura *</label>
                <div className="flex gap-2">
                  <input
                    {...register('projeto.prazoInicio', { required: true, min: 1, valueAsNumber: true })}
                    type="number"
                    min={1}
                    className={`${inputClass} w-24`}
                    placeholder="7"
                  />
                  <select {...register('projeto.unidadeInicio')} className={inputClass}>
                    <option value="dias">dias</option>
                    <option value="semanas">semanas</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-600">Prazo para início do projeto após a assinatura</p>
                {errors.projeto?.prazoInicio && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>Prazo Estimado *</label>
                <div className="flex gap-2">
                  <input
                    {...register('projeto.prazoEstimado', { required: true, min: 1, valueAsNumber: true })}
                    type="number"
                    min={1}
                    className={`${inputClass} w-24`}
                    placeholder="30"
                  />
                  <select {...register('projeto.unidadePrazo')} className={inputClass}>
                    <option value="dias_uteis">dias úteis</option>
                    <option value="semanas">semanas</option>
                    <option value="meses">meses</option>
                  </select>
                </div>
                {errors.projeto?.prazoEstimado && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
              </div>
              <div>
                <label className={labelClass}>Tolerância (mesma unidade)</label>
                <input
                  {...register('projeto.tolerancia', { min: 0, valueAsNumber: true })}
                  type="number"
                  min={0}
                  className={inputClass}
                  placeholder="5"
                />
                <p className="mt-1 text-xs text-gray-600">Margem adicional sem penalidade</p>
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
              <div className="sm:col-span-2">
                <label className={labelClass}>Etapas de Entrega</label>
                <p className="text-xs text-gray-500 mb-3">Cada parcela do pagamento é vinculada a uma etapa. Descreva o que será entregue em cada marco.</p>
                <div className="space-y-2">
                  {etapasFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <span className="mt-2.5 text-xs font-bold text-gray-500 w-5 shrink-0 text-right">{index + 1}.</span>
                      <div className="flex-1 flex gap-2">
                        <input
                          {...register(`pagamento.etapas.${index}.descricao`, { required: true })}
                          className={inputClass}
                          placeholder={index === 0 ? 'Ex: Assinatura do contrato' : index === etapasFields.length - 1 ? 'Ex: Entrega final do projeto' : 'Ex: Conclusão do backend e integrações'}
                        />
                        {modeloPagamento === 'personalizado' ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              {...register(`pagamento.etapas.${index}.percentual`, { required: true, min: 1, max: 100, valueAsNumber: true })}
                              type="number"
                              min={1}
                              max={100}
                              className={`${inputClass} w-20 text-center`}
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                        ) : (
                          <span className="mt-2.5 text-xs font-semibold text-indigo-400 w-12 shrink-0 text-center">
                            {watch(`pagamento.etapas.${index}.percentual`)}%
                          </span>
                        )}
                      </div>
                      {modeloPagamento === 'personalizado' && etapasFields.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEtapa(index)}
                          className="mt-2 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                          title="Remover etapa"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {modeloPagamento === 'personalizado' && (
                  <button
                    type="button"
                    onClick={() => appendEtapa({ descricao: '', percentual: 0 })}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar etapa
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Seção 5 — Serviços Adicionais */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>5. Serviços Adicionais</p>
            <p className="text-xs text-gray-500 mb-4">Defina se hospedagem/domínio e manutenção estão inclusos no contrato</p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 mb-4">
              {([
                { value: 'nenhum', label: 'Não incluir' },
                { value: 'individual', label: 'Configurar separadamente' },
                { value: 'pacote', label: 'Pacote completo' },
              ] as { value: ModoServicos; label: string }[]).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors
                    ${modoServicos === opt.value
                      ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                      : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                    }`}
                >
                  <input type="radio" {...register('servicosAdicionais.modo')} value={opt.value} className="sr-only" />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>

            {modoServicos === 'pacote' && (
              <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4">
                <p className="text-sm font-semibold text-white mb-3">Hospedagem, Domínio e Manutenção — Pacote Completo</p>
                <p className="text-xs text-gray-500 mb-4">Ambos os serviços inclusos juntos, com período e valor mensal unificados após o término</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Período incluso (meses) *</label>
                    <input
                      {...register('servicosAdicionais.pacoteMeses', { required: modoServicos === 'pacote', min: 1, valueAsNumber: true })}
                      type="number"
                      min={1}
                      className={inputClass}
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Valor mensal do pacote após período (R$) *</label>
                    <input
                      {...register('servicosAdicionais.pacoteValorMensal', { required: modoServicos === 'pacote', min: 0, valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min={0}
                      className={inputClass}
                      placeholder="350.00"
                    />
                  </div>
                </div>
              </div>
            )}

            {modoServicos === 'individual' && (
              <>
                <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4 space-y-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      {...register('servicosAdicionais.hospedagem.incluso')}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="text-sm font-semibold text-white">Incluir Hospedagem e Domínio</span>
                  </label>
                  {hospedagemInclusa && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pl-7">
                      <div>
                        <label className={labelClass}>Período incluso (meses) *</label>
                        <input
                          {...register('servicosAdicionais.hospedagem.meses', { required: hospedagemInclusa, min: 1, valueAsNumber: true })}
                          type="number"
                          min={1}
                          className={inputClass}
                          placeholder="12"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Valor mensal após período (R$) *</label>
                        <input
                          {...register('servicosAdicionais.hospedagem.valorMensal', { required: hospedagemInclusa, min: 0, valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min={0}
                          className={inputClass}
                          placeholder="89.90"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4 space-y-4 mt-2">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      {...register('servicosAdicionais.manutencao.incluso')}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="text-sm font-semibold text-white">Incluir Manutenção</span>
                  </label>
                  {manutencaoInclusa && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pl-7">
                      <div>
                        <label className={labelClass}>Período incluso (meses) *</label>
                        <input
                          {...register('servicosAdicionais.manutencao.meses', { required: manutencaoInclusa, min: 1, valueAsNumber: true })}
                          type="number"
                          min={1}
                          className={inputClass}
                          placeholder="3"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Valor mensal após período (R$) *</label>
                        <input
                          {...register('servicosAdicionais.manutencao.valorMensal', { required: manutencaoInclusa, min: 0, valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min={0}
                          className={inputClass}
                          placeholder="250.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Seção 6 — Config */}
          <div className={sectionClass}>
            <p className={sectionTitleClass}>6. Configurações do Contrato</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Cidade (para foro) *</label>
                <input {...register('config.cidade', { required: true })} className={inputClass} placeholder="São Paulo" />
                {errors.config?.cidade && <p className="mt-1 text-xs text-red-400">Obrigatório</p>}
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
              {isEditing ? 'Salvar Alterações' : 'Salvar como Rascunho'}
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
