# 📄 Gerador de Contratos

App web para gerar contratos de prestação de serviços de desenvolvimento de software. Preencha os dados, visualize o PDF e baixe — tudo sem backend, sem login, sem frescura.

---

## ✨ Funcionalidades

- **Formulário completo** dividido em 5 seções: Prestador, Cliente, Projeto, Pagamento e Configurações
- **Geração de PDF A4** profissional com 12 cláusulas jurídicas automáticas
- **Preview inline** do PDF antes de baixar
- **Download nomeado** automaticamente (`Contrato-ClienteNome-2026-04-29.pdf`)
- **Histórico persistente** via localStorage — seus contratos ficam salvos entre sessões
- **Dados do prestador pré-preenchidos** e atualizados automaticamente a cada novo contrato
- **Duplicar contratos** para reaproveitar estrutura em novos projetos
- **Numeração automática** de contratos (`CONT-2026-001`, `CONT-2026-002`…)

---

## 📋 Cláusulas geradas automaticamente

| # | Cláusula |
|---|---|
| 1 | Das Partes |
| 2 | Do Objeto |
| 3 | Do Prazo |
| 4 | Do Valor e do Pagamento |
| 5 | Da Propriedade Intelectual |
| 6 | Das Revisões |
| 7 | Da Aprovação Tácita |
| 8 | Da Confidencialidade |
| 9 | Da Rescisão |
| 10 | Das Penalidades por Descumprimento |
| 11 | Das Disposições Gerais |
| 12 | Das Assinaturas |

---

## 🚀 Como rodar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build
```

Acesse em `http://localhost:5173`

---

## 🗂 Estrutura do projeto

```
src/
├── pages/
│   ├── Home.tsx            # Histórico de contratos
│   └── NovoContrato.tsx    # Formulário (5 seções)
├── components/
│   ├── PDFPreviewModal.tsx # Modal de preview + download
│   └── Toast.tsx           # Feedback visual
├── ContratoPDF.tsx         # Documento PDF com todas as cláusulas
├── storage.ts              # CRUD no localStorage
├── types.ts                # Tipos TypeScript
└── App.tsx                 # Roteamento
```

---

## 💾 Persistência (localStorage)

| Chave | Conteúdo |
|---|---|
| `contrato_prestador_default` | Dados do prestador para pré-preenchimento |
| `contratos_historico` | Array com todos os contratos salvos |

---

## 🛠 Stack

- **React + Vite + TypeScript**
- **Tailwind CSS** — dark mode por padrão
- **@react-pdf/renderer** — geração de PDF no browser
- **React Hook Form** — formulário sem re-renders desnecessários
- **React Router DOM** — navegação client-side
- **date-fns** — formatação de datas em pt-BR
- **uuid** — IDs únicos por contrato

---

## ⚠️ O que este app não faz (por design)

- Sem autenticação ou backend
- Sem assinatura digital
- Sem envio por e-mail
- Sem banco de dados — tudo fica no seu navegador

> Para uso pessoal como PJ. Revise os textos das cláusulas com um advogado antes de usar em contratos reais.
