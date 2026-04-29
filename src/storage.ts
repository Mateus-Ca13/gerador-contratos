import type { Contrato, Prestador } from './types'

const KEY_PRESTADOR = 'contrato_prestador_default'
const KEY_HISTORICO = 'contratos_historico'

export function getPrestadorDefault(): Prestador | null {
  try {
    const raw = localStorage.getItem(KEY_PRESTADOR)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function savePrestadorDefault(prestador: Prestador): void {
  localStorage.setItem(KEY_PRESTADOR, JSON.stringify(prestador))
}

export function getHistorico(): Contrato[] {
  try {
    const raw = localStorage.getItem(KEY_HISTORICO)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveContrato(contrato: Contrato): void {
  const historico = getHistorico()
  const idx = historico.findIndex((c) => c.id === contrato.id)
  if (idx >= 0) {
    historico[idx] = contrato
  } else {
    historico.unshift(contrato)
  }
  localStorage.setItem(KEY_HISTORICO, JSON.stringify(historico))
}

export function deleteContrato(id: string): void {
  const historico = getHistorico().filter((c) => c.id !== id)
  localStorage.setItem(KEY_HISTORICO, JSON.stringify(historico))
}

export function gerarNumeroContrato(): string {
  const historico = getHistorico()
  const year = new Date().getFullYear()
  const seq = String(historico.length + 1).padStart(3, '0')
  return `CONT-${year}-${seq}`
}
