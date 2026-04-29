import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Contrato } from './types'

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
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 10,
  },
  headerCompany: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111',
  },
  headerCnpj: {
    fontSize: 9,
    color: '#555',
    marginTop: 2,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 20,
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function buildModeloPagamentoText(contrato: Contrato): string {
  const { modelo, modeloPersonalizado, valorTotal, forma, formaOutro } = contrato.pagamento
  const total = formatCurrency(valorTotal)
  const formaTxt = forma === 'Outro' ? formaOutro : forma

  if (modelo === '50/50') {
    const parcela = formatCurrency(valorTotal / 2)
    return `O valor total do contrato é de ${total}, a ser pago em duas parcelas: ${parcela} no ato da assinatura e ${parcela} na entrega final do projeto. Forma de pagamento: ${formaTxt}.`
  }
  if (modelo === '33/33/33') {
    const parcela = formatCurrency(valorTotal / 3)
    return `O valor total do contrato é de ${total}, a ser pago em três parcelas de ${parcela}: a primeira no ato da assinatura, a segunda no meio do desenvolvimento e a terceira na entrega final. Forma de pagamento: ${formaTxt}.`
  }
  return `O valor total do contrato é de ${total}. Condições de pagamento: ${modeloPersonalizado}. Forma de pagamento: ${formaTxt}.`
}

interface Props {
  contrato: Contrato
}

export function ContratoPDF({ contrato }: Props) {
  const { prestador, cliente, projeto, config, numero } = contrato
  const dataGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.headerCompany}>{prestador.razaoSocial}</Text>
          <Text style={styles.headerCnpj}>CNPJ: {prestador.cnpj}</Text>
        </View>

        {/* Título */}
        <Text style={styles.title}>
          Contrato de Prestação de Serviços{'\n'}de Desenvolvimento de Software
        </Text>
        <Text style={styles.contractNumber}>{numero}</Text>

        <View style={styles.divider} />

        {/* Cláusula 1 — Das Partes */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA 1ª — DAS PARTES</Text>
          <Text style={styles.clauseText}>
            {`CONTRATADA: ${prestador.razaoSocial}, inscrita no CNPJ sob o nº ${prestador.cnpj}, com sede em ${prestador.endereco}, e-mail: ${prestador.email}, telefone: ${prestador.telefone}.`}
            {'\n\n'}
            {`CONTRATANTE: ${cliente.nome}, inscrito(a) no CPF/CNPJ sob o nº ${cliente.documento}, residente/domiciliado(a) em ${cliente.endereco}, e-mail: ${cliente.email}, telefone: ${cliente.telefone}.`}
            {'\n\n'}
            {`As partes acima qualificadas celebram o presente contrato, que se regerá pelas cláusulas seguintes.`}
          </Text>
        </View>

        {/* Cláusula 2 — Do Objeto */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA 2ª — DO OBJETO</Text>
          <Text style={styles.clauseText}>
            {`O presente contrato tem por objeto a prestação de serviços de desenvolvimento de software referente ao projeto "${projeto.nome}", conforme escopo detalhado a seguir:`}
            {'\n\n'}
            {`ESCOPO INCLUSO:\n${projeto.descricao}`}
            {projeto.exclusoes ? `\n\nEXCLUSÕES DO ESCOPO (não fazem parte deste contrato):\n${projeto.exclusoes}` : ''}
          </Text>
        </View>

        {/* Cláusula 3 — Do Prazo */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA 3ª — DO PRAZO</Text>
          <Text style={styles.clauseText}>
            {`Os serviços terão início em ${formatDate(projeto.dataInicio)} e a entrega está prevista para ${formatDate(projeto.dataEntrega)}.`}
            {'\n\n'}
            {`O prazo acima será contado a partir do recebimento do pagamento da entrada e da aprovação formal do escopo pelo CONTRATANTE. Eventuais atrasos causados pelo CONTRATANTE (atraso em aprovações, fornecimento de conteúdo, etc.) não serão imputados à CONTRATADA.`}
          </Text>
        </View>

        {/* Cláusula 4 — Do Valor e Pagamento */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA 4ª — DO VALOR E DO PAGAMENTO</Text>
          <Text style={styles.clauseText}>
            {buildModeloPagamentoText(contrato)}
            {'\n\n'}
            {`O atraso no pagamento de qualquer parcela implicará na suspensão dos serviços até a regularização, sem prejuízo de encargos de 1% ao mês e multa de 2% sobre o valor em atraso.`}
          </Text>
        </View>

        {/* Cláusula 5 — Da Propriedade Intelectual */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA 5ª — DA PROPRIEDADE INTELECTUAL</Text>
          <Text style={styles.clauseText}>
            {`Todo o código-fonte, designs e demais materiais produzidos no âmbito deste contrato serão de propriedade exclusiva do CONTRATANTE somente após a quitação integral do valor contratado.`}
            {'\n\n'}
            {`Enquanto houver valor em aberto, a CONTRATADA retém todos os direitos sobre o material produzido. Após a quitação total, a CONTRATADA cede ao CONTRATANTE todos os direitos patrimoniais sobre o produto desenvolvido.`}
            {'\n\n'}
            {`A CONTRATADA poderá utilizar o projeto em seu portfólio, salvo objeção expressa e por escrito do CONTRATANTE.`}
          </Text>
        </View>

        {/* Cláusula 6 — Das Revisões */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA 6ª — DAS REVISÕES</Text>
          <Text style={styles.clauseText}>
            {`Este contrato prevê ${projeto.rodasRevisao} (${projeto.rodasRevisao === 1 ? 'uma' : projeto.rodasRevisao}) rodada(s) de revisão incluída(s) no valor contratado.`}
            {'\n\n'}
            {`Entende-se por "revisão" ajustes e correções dentro do escopo originalmente aprovado. Alterações de escopo, adição de funcionalidades ou mudanças de direcionamento após o início do desenvolvimento serão tratadas como aditivo contratual, com novo orçamento e prazo.`}
          </Text>
        </View>

        {/* Cláusula 7 — Da Aprovação Tácita */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA 7ª — DA APROVAÇÃO TÁCITA</Text>
          <Text style={styles.clauseText}>
            {`A cada entrega parcial ou final realizada pela CONTRATADA, o CONTRATANTE terá o prazo de 5 (cinco) dias úteis para apresentar feedback formal por escrito (e-mail ou mensagem registrada).`}
            {'\n\n'}
            {`Transcorrido esse prazo sem manifestação do CONTRATANTE, a entrega será considerada tacitamente aprovada, liberando a CONTRATADA para prosseguir para a etapa seguinte e, no caso de entrega final, para emitir a cobrança da parcela correspondente.`}
            {'\n\n'}
            {`A aprovação tácita não prejudica o direito à rodada de revisão prevista na Cláusula 6ª, desde que solicitada dentro do prazo contratual.`}
          </Text>
        </View>

        {/* Cláusula 8 — Da Confidencialidade */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA 8ª — DA CONFIDENCIALIDADE</Text>
          <Text style={styles.clauseText}>
            {`Ambas as partes comprometem-se a manter em sigilo todas as informações confidenciais trocadas durante a vigência deste contrato, incluindo dados técnicos, estratégicos, comerciais e financeiros, não as divulgando a terceiros sem prévia autorização por escrito da outra parte.`}
            {'\n\n'}
            {`Esta obrigação permanece em vigor por 2 (dois) anos após o encerramento do contrato.`}
          </Text>
        </View>

        {/* Cláusula 9 — Da Rescisão */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA 9ª — DA RESCISÃO</Text>
          <Text style={styles.clauseText}>
            {`Qualquer das partes poderá rescindir o presente contrato mediante aviso prévio de 15 (quinze) dias.`}
            {'\n\n'}
            {`Em caso de rescisão por iniciativa do CONTRATANTE, os valores já pagos não serão reembolsados, e as entregas realizadas até a data da rescisão serão proporcionalmente cobradas caso o valor pago seja inferior ao trabalho executado.`}
            {'\n\n'}
            {`Em caso de rescisão por iniciativa da CONTRATADA sem justa causa, esta deverá devolver os valores pagos referentes às entregas não realizadas.`}
          </Text>
        </View>

        {/* Cláusula 10 — Das Penalidades por Descumprimento */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA 10ª — DAS PENALIDADES POR DESCUMPRIMENTO</Text>
          <Text style={styles.clauseText}>
            {`O descumprimento de qualquer obrigação prevista neste contrato, por qualquer das partes, sem justificativa aceita pela outra parte, sujeitará o infrator ao pagamento de multa não compensatória equivalente a 10% (dez por cento) do valor total do contrato, sem prejuízo das perdas e danos que forem apurados.`}
            {'\n\n'}
            {`Considera-se descumprimento, entre outros: abandono injustificado do projeto pela CONTRATADA; recusa injustificada do CONTRATANTE em efetuar pagamento nas datas pactuadas; divulgação de informações confidenciais; e uso indevido dos materiais entregues antes da quitação total.`}
            {'\n\n'}
            {`A multa será cobrada mediante notificação extrajudicial, com prazo de 10 (dez) dias corridos para pagamento. Decorrido o prazo, o valor poderá ser acrescido de juros de mora de 1% ao mês e correção monetária pelo IPCA.`}
          </Text>
        </View>

        {/* Cláusula 11 — Das Disposições Gerais */}
        <View style={styles.section}>
          <Text style={styles.clauseTitle}>CLÁUSULA 11ª — DAS DISPOSIÇÕES GERAIS</Text>
          <Text style={styles.clauseText}>
            {`Qualquer alteração ao presente contrato somente será válida mediante aditivo escrito, assinado por ambas as partes.`}
            {'\n\n'}
            {`Este contrato tem validade de ${config.prazoValidade} (${config.prazoValidade}) dias a partir da data de assinatura. Caso não executado neste prazo, os valores e condições aqui estabelecidos poderão ser revistos pela CONTRATADA.`}
            {'\n\n'}
            {`As partes elegem o foro da Comarca de ${config.cidade} para dirimir quaisquer controvérsias decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`}
          </Text>
        </View>

        {/* Cláusula 12 — Das Assinaturas */}
        <View style={[styles.section, styles.signatureSection]}>
          <Text style={styles.clauseTitle}>CLÁUSULA 12ª — DAS ASSINATURAS</Text>
          <Text style={styles.clauseText}>
            {`Por estarem assim justos e contratados, as partes assinam o presente instrumento em duas vias de igual teor e forma, na cidade de ${config.cidade}, em ${formatDate(config.dataAssinatura)}.`}
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
              <Text style={styles.signatureLabel}>CPF/CNPJ: {cliente.documento}</Text>
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
