export interface Prestador {
  razaoSocial: string
  cnpj: string
  endereco: string
  email: string
  telefone: string
}

export interface Cliente {
  nome: string
  documento: string
  endereco: string
  email: string
  telefone: string
}

export interface Projeto {
  nome: string
  descricao: string
  exclusoes: string
  dataInicio: string
  dataEntrega: string
  rodasRevisao: number
}

export type ModeloPagamento = '50/50' | '33/33/33' | 'personalizado'
export type FormaPagamento = 'PIX' | 'Transferência bancária' | 'Outro'

export interface Pagamento {
  valorTotal: number
  modelo: ModeloPagamento
  modeloPersonalizado: string
  forma: FormaPagamento
  formaOutro: string
}

export interface ConfigContrato {
  cidade: string
  dataAssinatura: string
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
  config: ConfigContrato
}

export type ContratoFormData = Omit<Contrato, 'id' | 'numero' | 'createdAt' | 'status'>
