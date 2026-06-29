import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Contrato, UnidadePrazo, UnidadeInicio } from './types'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 52,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contractNumber: {
    fontSize: 9,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
  },
  section: {
    marginBottom: 14,
  },
  clauseTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#111',
  },
  clauseText: {
    fontSize: 9.5,
    color: '#2a2a2a',
    lineHeight: 1.6,
  },
  signatureSection: {
    marginTop: 32,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 32,
    paddingTop: 6,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#444',
  },
  signatureName: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 52,
    right: 52,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#888',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginVertical: 10,
  },
})

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return dateStr
  }
}

function numeroPorExtenso(n: number, feminino = false): string {
  if (n === 0) return 'zero'
  if (n === 100) return 'cem'

  const unidades = feminino
    ? ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
    : ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const centenas = feminino
    ? ['', 'cento', 'duzentas', 'trezentas', 'quatrocentas', 'quinhentas', 'seiscentas', 'setecentas', 'oitocentas', 'novecentas']
    : ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

  const partes: string[] = []
  let resto = n

  if (resto >= 100) {
    partes.push(centenas[Math.floor(resto / 100)])
    resto = resto % 100
  }

  if (resto >= 20) {
    partes.push(dezenas[Math.floor(resto / 10)])
    resto = resto % 10
    if (resto > 0) partes.push(unidades[resto])
  } else if (resto >= 10) {
    partes.push(especiais[resto - 10])
  } else if (resto > 0) {
    partes.push(unidades[resto])
  }

  return partes.join(' e ')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatUnidadePrazo(valor: number, unidade: UnidadePrazo): string {
  const femininas: Record<UnidadePrazo, boolean> = { dias_uteis: false, semanas: true, meses: false }
  const labels: Record<UnidadePrazo, [string, string]> = {
    dias_uteis: ['dia útil', 'dias úteis'],
    semanas: ['semana', 'semanas'],
    meses: ['mês', 'meses'],
  }
  const [singular, plural] = labels[unidade]
  return `${valor} (${numeroPorExtenso(valor, femininas[unidade])}) ${valor === 1 ? singular : plural}`
}

function formatPrazoInicio(valor: number, unidade: UnidadeInicio): string {
  const femininas: Record<UnidadeInicio, boolean> = { dias: false, semanas: true }
  const labels: Record<UnidadeInicio, [string, string]> = {
    dias: ['dia', 'dias'],
    semanas: ['semana', 'semanas'],
  }
  const [singular, plural] = labels[unidade]
  return `${valor} (${numeroPorExtenso(valor, femininas[unidade])}) ${valor === 1 ? singular : plural}`
}

function buildModeloPagamentoText(contrato: Contrato): string {
  const { etapas, valorTotal, forma, formaOutro } = contrato.pagamento
  const total = formatCurrency(valorTotal)
  const formaTxt = forma === 'Outro' ? formaOutro : forma

  if (!etapas || etapas.length === 0) {
    return `O valor total do contrato é de ${total}. Forma de pagamento: ${formaTxt}.`
  }

  const letra = (i: number) => String.fromCharCode(97 + i)
  const linhas = etapas.map((etapa, i) => {
    const valor = formatCurrency(valorTotal * etapa.percentual / 100)
    return `${letra(i)}) ${etapa.percentual}% (${valor}) — ${etapa.descricao || 'A definir'}`
  }).join(';\n')

  return `O valor total do contrato é de ${total}, a ser pago em ${etapas.length} (${numeroPorExtenso(etapas.length, true)}) parcela(s) conforme as seguintes etapas de entrega:\n\n${linhas}.\n\nForma de pagamento: ${formaTxt}.`
}

interface Props {
  contrato: Contrato
}

export function ContratoPDF({ contrato }: Props) {
  const { prestador, cliente, projeto, config, numero, servicosAdicionais } = contrato
  const dataGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  const docLabel = cliente.tipoPessoa === 'juridica' ? 'CNPJ' : 'CPF'

  const modoServicos = servicosAdicionais?.modo || 'nenhum'
  const temServicosAdicionais = modoServicos === 'pacote' || (modoServicos === 'individual' && (servicosAdicionais?.hospedagem?.incluso || servicosAdicionais?.manutencao?.incluso))

  let cl = 0
  const nextCl = () => { cl++; return cl }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Título */}
        <Text style={styles.title}>
          Contrato de Prestação de Serviços{'\n'}de Desenvolvimento de Software
        </Text>
        <Text style={styles.contractNumber}>{numero}</Text>

        <View style={styles.divider} />

        {/* Cláusula — Das Partes */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DAS PARTES</Text>
          <Text style={styles.clauseText}>
            {`CONTRATADA: ${prestador.razaoSocial}, inscrita no CNPJ sob o nº ${prestador.cnpj}, com sede em ${prestador.endereco}, e-mail: ${prestador.email}, telefone: ${prestador.telefone}.`}
            {'\n\n'}
            {`CONTRATANTE: ${cliente.nome}, ${cliente.tipoPessoa === 'juridica' ? 'inscrita' : 'inscrito(a)'} no ${docLabel} sob o nº ${cliente.documento}, ${cliente.tipoPessoa === 'juridica' ? 'com sede em' : 'residente/domiciliado(a) em'} ${cliente.endereco}, e-mail: ${cliente.email}, telefone: ${cliente.telefone}.`}
            {'\n\n'}
            {`As partes acima qualificadas celebram o presente contrato, que se regerá pelas cláusulas seguintes.`}
          </Text>
        </View>

        {/* Cláusula — Do Objeto */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DO OBJETO</Text>
          <Text style={styles.clauseText}>
            {`O presente contrato tem por objeto a prestação de serviços de desenvolvimento de software referente ao projeto "${projeto.nome}", conforme escopo detalhado a seguir:`}
            {'\n\n'}
            {`ESCOPO INCLUSO:\n${projeto.descricao}`}
            {projeto.exclusoes ? `\n\nEXCLUSÕES DO ESCOPO (não fazem parte deste contrato):\n${projeto.exclusoes}` : ''}
          </Text>
        </View>

        {/* Cláusula — Do Prazo */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DO PRAZO</Text>
          <Text style={styles.clauseText}>
            {`Os serviços terão início em até ${formatPrazoInicio(projeto.prazoInicio, projeto.unidadeInicio)} após a assinatura do presente contrato por ambas as partes, condicionado ao recebimento do pagamento da entrada e à aprovação formal do escopo pelo CONTRATANTE.`}
            {'\n\n'}
            {`O prazo estimado para a conclusão dos serviços é de ${formatUnidadePrazo(projeto.prazoEstimado, projeto.unidadePrazo)}, contados a partir do efetivo início dos trabalhos.`}
            {projeto.tolerancia > 0 && ` O prazo poderá ser estendido em até ${formatUnidadePrazo(projeto.tolerancia, projeto.unidadePrazo)} adicionais sem ônus para a CONTRATADA, totalizando um prazo máximo de ${formatUnidadePrazo(projeto.prazoEstimado + projeto.tolerancia, projeto.unidadePrazo)}.`}
            {'\n\n'}
            {`Eventuais atrasos causados pelo CONTRATANTE (atraso em aprovações, fornecimento de conteúdo, etc.) não serão imputados à CONTRATADA e poderão resultar na prorrogação proporcional do prazo de entrega.`}
          </Text>
        </View>

        {/* Cláusula — Do Valor e Pagamento */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DO VALOR E DO PAGAMENTO</Text>
          <Text style={styles.clauseText}>
            {buildModeloPagamentoText(contrato)}
            {'\n\n'}
            {`O atraso no pagamento de qualquer parcela implicará na suspensão dos serviços até a regularização, sem prejuízo de encargos de 1% ao mês e multa de 2% sobre o valor em atraso.`}
          </Text>
        </View>

        {/* Cláusula condicional — Da Hospedagem, Domínio e Manutenção */}
        {temServicosAdicionais && (
          <View style={styles.section}>
            <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DA HOSPEDAGEM, DOMÍNIO E MANUTENÇÃO</Text>
            <Text style={styles.clauseText}>
              {modoServicos === 'pacote' && (
                `A CONTRATADA fornecerá serviço de hospedagem, registro de domínio e manutenção corretiva e preventiva do software pelo período de ${servicosAdicionais.pacoteMeses} (${numeroPorExtenso(servicosAdicionais.pacoteMeses)}) ${servicosAdicionais.pacoteMeses === 1 ? 'mês' : 'meses'} a contar da entrega final do projeto, inclusos no valor contratado. A infraestrutura contempla rotinas de backup periódico dos dados armazenados. Entende-se por manutenção a correção de bugs, ajustes de desempenho e pequenas melhorias que não alterem o escopo original.\n\nApós o término desse período, o CONTRATANTE poderá renovar ambos os serviços em conjunto mediante contratação à parte pelo valor mensal de ${formatCurrency(servicosAdicionais.pacoteValorMensal)}, sujeito a reajuste anual.`
              )}
              {modoServicos === 'individual' && servicosAdicionais.hospedagem?.incluso && (
                `A CONTRATADA fornecerá serviço de hospedagem e registro de domínio pelo período de ${servicosAdicionais.hospedagem.meses} (${numeroPorExtenso(servicosAdicionais.hospedagem.meses)}) ${servicosAdicionais.hospedagem.meses === 1 ? 'mês' : 'meses'} a contar da entrega final do projeto, incluso no valor contratado. A infraestrutura contempla rotinas de backup periódico dos dados armazenados. Após o término desse período, o CONTRATANTE poderá renovar o serviço mediante contratação à parte pelo valor mensal de ${formatCurrency(servicosAdicionais.hospedagem.valorMensal)}, sujeito a reajuste anual.`
              )}
              {modoServicos === 'individual' && servicosAdicionais.hospedagem?.incluso && servicosAdicionais.manutencao?.incluso && '\n\n'}
              {modoServicos === 'individual' && servicosAdicionais.manutencao?.incluso && (
                `A CONTRATADA fornecerá serviço de manutenção corretiva e preventiva do software pelo período de ${servicosAdicionais.manutencao.meses} (${numeroPorExtenso(servicosAdicionais.manutencao.meses)}) ${servicosAdicionais.manutencao.meses === 1 ? 'mês' : 'meses'} a contar da entrega final do projeto, incluso no valor contratado. Entende-se por manutenção a correção de bugs, ajustes de desempenho e pequenas melhorias que não alterem o escopo original. Após o término desse período, o CONTRATANTE poderá renovar o serviço mediante contratação à parte pelo valor mensal de ${formatCurrency(servicosAdicionais.manutencao.valorMensal)}, sujeito a reajuste anual.`
              )}
              {'\n\n'}
              {`A não renovação dos serviços acima após o período incluso não gera qualquer ônus ao CONTRATANTE, ficando a CONTRATADA desobrigada da prestação dos respectivos serviços.`}
            </Text>
          </View>
        )}

        {/* Cláusula — Da Propriedade Intelectual */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DA PROPRIEDADE INTELECTUAL</Text>
          <Text style={styles.clauseText}>
            {`Todo o código-fonte, designs e demais materiais produzidos no âmbito deste contrato serão de propriedade exclusiva do CONTRATANTE somente após a quitação integral do valor contratado.`}
            {'\n\n'}
            {`Enquanto houver valor em aberto, a CONTRATADA retém todos os direitos sobre o material produzido. Após a quitação total, a CONTRATADA cede ao CONTRATANTE todos os direitos patrimoniais sobre o produto desenvolvido.`}
            {'\n\n'}
            {`A CONTRATADA poderá utilizar o projeto em seu portfólio, salvo objeção expressa e por escrito do CONTRATANTE.`}
          </Text>
        </View>

        {/* Cláusula — Das Revisões */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DAS REVISÕES</Text>
          <Text style={styles.clauseText}>
            {`Este contrato prevê ${projeto.rodasRevisao} (${numeroPorExtenso(projeto.rodasRevisao, true)}) rodada(s) de revisão incluída(s) no valor contratado.`}
            {'\n\n'}
            {`Entende-se por "revisão" ajustes e correções dentro do escopo originalmente aprovado. Alterações de escopo, adição de funcionalidades ou mudanças de direcionamento após o início do desenvolvimento serão tratadas como aditivo contratual, com novo orçamento e prazo.`}
          </Text>
        </View>

        {/* Cláusula — Da Entrega e Critérios de Aceite */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DA ENTREGA E DOS CRITÉRIOS DE ACEITE</Text>
          <Text style={styles.clauseText}>
            {`Considera-se o sistema (ou etapa) entregue quando a CONTRATADA disponibilizar o software em ambiente acessível ao CONTRATANTE (homologação ou produção) e comunicar formalmente a conclusão, indicando o que foi implementado.`}
            {'\n\n'}
            {`O sistema será considerado funcional e apto à aprovação quando atender simultaneamente aos seguintes critérios:`}
            {'\n'}
            {`a) operar em conformidade com as funcionalidades descritas no escopo contratado;`}
            {'\n'}
            {`b) estar livre de defeitos críticos que impeçam o uso das funcionalidades contratadas;`}
            {'\n'}
            {`c) estar acessível e utilizável no ambiente acordado entre as partes.`}
            {'\n\n'}
            {`Eventuais rejeições por parte do CONTRATANTE deverão ser formalizadas por escrito (e-mail ou mensagem registrada), com descrição objetiva do problema encontrado, incluindo: qual funcionalidade apresentou falha, qual o comportamento esperado e qual o comportamento observado. Comunicações genéricas como "não funciona" ou "não está pronto", sem detalhamento, não serão consideradas rejeições válidas.`}
            {'\n\n'}
            {`Não constituem motivo válido para rejeição de entrega: solicitações de funcionalidades não previstas no escopo, preferências estéticas subjetivas não acordadas previamente, comparações com outros sistemas, nem quaisquer demandas que configurem alteração ou ampliação do escopo original.`}
            {'\n\n'}
            {`Os critérios acima aplicam-se tanto às entregas parciais (vinculadas às etapas de pagamento) quanto à entrega final do projeto.`}
          </Text>
        </View>

        {/* Cláusula — Da Garantia */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DA GARANTIA</Text>
          <Text style={styles.clauseText}>
            {`A CONTRATADA oferece garantia de 60 (sessenta) dias corridos sobre o produto entregue, contados a partir da data de entrega final e aprovação (expressa ou tácita) do projeto.`}
            {'\n\n'}
            {`Durante o período de garantia, a CONTRATADA compromete-se a corrigir, sem custo adicional, eventuais defeitos de funcionamento (bugs), falhas técnicas e comportamentos inesperados do software que estejam em desacordo com o escopo originalmente contratado.`}
            {'\n\n'}
            {`Não estão cobertos pela garantia: solicitações de novas funcionalidades, alterações de layout, adição ou remoção de campos, integrações não previstas no escopo original, nem quaisquer outras modificações que configurem alteração ou ampliação do escopo contratado. Tais demandas serão tratadas como novo orçamento.`}
            {'\n\n'}
            {`A garantia também não se aplica a problemas decorrentes de alterações realizadas no software por terceiros ou pelo próprio CONTRATANTE sem autorização prévia da CONTRATADA.`}
          </Text>
        </View>

        {/* Cláusula — Da Aprovação Tácita */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DA APROVAÇÃO TÁCITA</Text>
          <Text style={styles.clauseText}>
            {`A cada entrega parcial ou final realizada pela CONTRATADA, o CONTRATANTE terá o prazo de 7 (sete) dias corridos para apresentar feedback formal por escrito (e-mail ou mensagem registrada).`}
            {'\n\n'}
            {`Transcorrido esse prazo sem manifestação do CONTRATANTE, a entrega será considerada tacitamente aprovada, liberando a CONTRATADA para prosseguir para a etapa seguinte e, no caso de entrega final, para emitir a cobrança da parcela correspondente.`}
            {'\n\n'}
            {`A aprovação tácita não prejudica o direito às rodadas de revisão previstas neste contrato, desde que solicitadas dentro do prazo contratual.`}
          </Text>
        </View>

        {/* Cláusula — Da Confidencialidade */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DA CONFIDENCIALIDADE</Text>
          <Text style={styles.clauseText}>
            {`Ambas as partes comprometem-se a manter em sigilo todas as informações confidenciais trocadas durante a vigência deste contrato, incluindo dados técnicos, estratégicos, comerciais e financeiros, não as divulgando a terceiros sem prévia autorização por escrito da outra parte.`}
            {'\n\n'}
            {`Esta obrigação permanece em vigor por 2 (dois) anos após o encerramento do contrato.`}
          </Text>
        </View>

        {/* Cláusula — Da Proteção de Dados (LGPD) */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DA PROTEÇÃO DE DADOS (LGPD)</Text>
          <Text style={styles.clauseText}>
            {`A CONTRATADA compromete-se a desenvolver o software em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD), adotando as melhores práticas de privacidade e segurança da informação aplicáveis ao projeto.`}
            {'\n\n'}
            {`Dentre as medidas aplicáveis, incluem-se:`}
            {'\n'}
            {`a) tratamento de dados pessoais com base nas hipóteses legais previstas na LGPD;`}
            {'\n'}
            {`b) implementação de mecanismos de controle de acesso e autenticação segura;`}
            {'\n'}
            {`c) criptografia de dados sensíveis em trânsito e em repouso, quando aplicável;`}
            {'\n'}
            {`d) rotinas de backup periódico dos dados armazenados, como parte da infraestrutura fornecida;`}
            {'\n'}
            {`e) registro e rastreabilidade de operações relevantes (logs de auditoria).`}
            {'\n\n'}
            {`O CONTRATANTE é responsável por definir sua política de privacidade, termos de uso e base legal para coleta de dados dos seus próprios usuários. A CONTRATADA poderá orientar tecnicamente, mas a responsabilidade jurídica perante os titulares dos dados é do CONTRATANTE enquanto controlador dos dados.`}
          </Text>
        </View>

        {/* Cláusula — Da Rescisão */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DA RESCISÃO</Text>
          <Text style={styles.clauseText}>
            {`Qualquer das partes poderá rescindir o presente contrato mediante aviso prévio de 15 (quinze) dias.`}
            {'\n\n'}
            {`Em caso de rescisão por iniciativa do CONTRATANTE, os valores já pagos não serão reembolsados, e as entregas realizadas até a data da rescisão serão proporcionalmente cobradas caso o valor pago seja inferior ao trabalho executado.`}
            {'\n\n'}
            {`Em caso de rescisão por iniciativa da CONTRATADA sem justa causa, esta deverá devolver os valores pagos referentes às entregas não realizadas.`}
          </Text>
        </View>

        {/* Cláusula — Das Penalidades por Descumprimento */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DAS PENALIDADES POR DESCUMPRIMENTO</Text>
          <Text style={styles.clauseText}>
            {`O descumprimento de qualquer obrigação prevista neste contrato, por qualquer das partes, sem justificativa aceita pela outra parte, sujeitará o infrator ao pagamento de multa não compensatória equivalente a 10% (dez por cento) do valor total do contrato, sem prejuízo das perdas e danos que forem apurados.`}
            {'\n\n'}
            {`Considera-se descumprimento, entre outros: abandono injustificado do projeto pela CONTRATADA; recusa injustificada do CONTRATANTE em efetuar pagamento nas datas pactuadas; divulgação de informações confidenciais; e uso indevido dos materiais entregues antes da quitação total.`}
            {'\n\n'}
            {`A multa será cobrada mediante notificação extrajudicial, com prazo de 10 (dez) dias corridos para pagamento. Decorrido o prazo, o valor poderá ser acrescido de juros de mora de 1% ao mês e correção monetária pelo IPCA.`}
          </Text>
        </View>

        {/* Cláusula — Das Disposições Gerais */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DAS DISPOSIÇÕES GERAIS</Text>
          <Text style={styles.clauseText}>
            {`Qualquer alteração ao presente contrato somente será válida mediante aditivo escrito, assinado por ambas as partes.`}
            {'\n\n'}
            {`Este contrato tem validade de ${config.prazoValidade} (${numeroPorExtenso(config.prazoValidade)}) dias a partir da data de assinatura. Caso não executado neste prazo, os valores e condições aqui estabelecidos poderão ser revistos pela CONTRATADA.`}
            {'\n\n'}
            {`As partes elegem o foro da Comarca de ${config.cidade} para dirimir quaisquer controvérsias decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`}
          </Text>
        </View>

        {/* Cláusula — Das Assinaturas */}
        <View style={[styles.section, styles.signatureSection]}>
          <Text style={styles.clauseTitle}>CLÁUSULA {nextCl()}ª — DAS ASSINATURAS</Text>
          <Text style={styles.clauseText}>
            {`Por estarem assim justos e contratados, as partes assinam o presente instrumento em duas vias de igual teor e forma, na cidade de ${config.cidade}, em ${formatDate(new Date().toISOString().split('T')[0])}.`}
          </Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{prestador.razaoSocial}</Text>
              <Text style={styles.signatureLabel}>CNPJ: {prestador.cnpj}</Text>
              <Text style={styles.signatureLabel}>CONTRATADA</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{cliente.nome}</Text>
              <Text style={styles.signatureLabel}>{docLabel}: {cliente.documento}</Text>
              <Text style={styles.signatureLabel}>CONTRATANTE</Text>
            </View>
          </View>
        </View>

        {/* Rodapé */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{numero}</Text>
          <Text style={styles.footerText}>Gerado em {dataGeracao}</Text>
        </View>
      </Page>
    </Document>
  )
}
