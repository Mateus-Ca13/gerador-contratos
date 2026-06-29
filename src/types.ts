export interface Prestador {
  razaoSocial: string
  cnpj: string
  endereco: string
  email: string
  telefone: string
}

export type TipoPessoa = 'fisica' | 'juridica'

export interface Cliente {
  tipoPessoa: TipoPessoa
  nome: string
  documento: string
  endereco: string
  email: string
  telefone: string
}

export type UnidadePrazo = 'dias_uteis' | 'semanas' | 'meses'

export type UnidadeInicio = 'dias' | 'semanas'

export interface Projeto {
  nome: string
  descricao: string
  exclusoes: string
  prazoInicio: number
  unidadeInicio: UnidadeInicio
  prazoEstimado: number
  unidadePrazo: UnidadePrazo
  tolerancia: number
  rodasRevisao: number
}

export type ModeloPagamento = '50/50' | '33/33/33' | 'personalizado'
export type FormaPagamento = 'PIX' | 'Transferência bancária' | 'Outro'

export interface EtapaPagamento {
  descricao: string
  percentual: number
}

export interface Pagamento {
  valorTotal: number
  modelo: ModeloPagamento
  etapas: EtapaPagamento[]
  forma: FormaPagamento
  formaOutro: string
}

export interface ServicoAdicional {
  incluso: boolean
  meses: number
  valorMensal: number
}

export type ModoServicos = 'nenhum' | 'individual' | 'pacote'

export interface ServicosAdicionais {
  modo: ModoServicos
  hospedagem: ServicoAdicional
  manutencao: ServicoAdicional
  pacoteMeses: number
  pacoteValorMensal: number
}

export interface ConfigContrato {
  cidade: string
  prazoValidade: number
}

export type StatusContrato = 'rascunho' | 'gerado'

export interface Contrato {
  id: string
  numero: string
  createdAt: string
  status: StatusContrato
  prestador: Prestador
  cliente: Cliente
  projeto: Projeto
  pagamento: Pagamento
  servicosAdicionais: ServicosAdicionais
  config: ConfigContrato
}

export type ContratoFormData = Omit<Contrato, 'id' | 'numero' | 'createdAt' | 'status'>
