import type { Survey } from "@/types/survey"

// Dados de exemplo para inicialização
export const sampleSurveys: Survey[] = [
  {
    id: "feind-2025-oficial",
    title: "Pesquisa de Satisfação – FEIND 2025",
    description:
      "Sua opinião é fundamental para aprimorarmos a próxima edição da FEIND. Compartilhe sua experiência conosco e nos ajude a construir um evento ainda melhor.",
    createdAt: new Date().toISOString(),
    isActive: true,
    logo: "",
    fields: [
      // Manter todos os campos da FEIND 2025 exatamente como estão
      {
        id: "divider_1",
        type: "divider",
        label: "🧾 Seção 1: Informações do Participante",
      },
      {
        id: "empresa",
        type: "text",
        label: "Empresa",
        description: "Nome da sua empresa ou organização",
        required: true,
      },
      {
        id: "nome",
        type: "text",
        label: "Nome",
        description: "Seu nome completo",
        required: true,
      },
      {
        id: "email",
        type: "text",
        label: "E-mail",
        description: "Seu e-mail para contato",
        required: true,
      },
      {
        id: "telefone",
        type: "text",
        label: "Telefone",
        description: "Telefone para contato (opcional)",
        required: false,
      },
      {
        id: "divider_2",
        type: "divider",
        label: "🗂️ Seção 2: Antes do Evento (Pré-Feira)",
      },
      {
        id: "processo_aquisicao",
        type: "stars",
        label: "Como você avalia o processo de aquisição do seu espaço na FEIND 2025?",
        description: "Avalie todo o processo desde o primeiro contato até a confirmação do espaço",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "atendimento_comercial",
        type: "stars",
        label: "Como você avalia o atendimento comercial realizado pela Polo Eventos (Adriana)?",
        description: "Qualidade do atendimento, agilidade nas respostas e suporte comercial",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "comentario_comercial",
        type: "textarea",
        label: "Gostaria de deixar algum comentário sobre o processo comercial?",
        description: "Compartilhe sua experiência com o atendimento comercial da Polo Eventos",
        required: false,
      },
      {
        id: "processo_contratual",
        type: "stars",
        label: "Como você avalia o processo contratual conduzido pelo CIESP?",
        description: "Clareza dos contratos, prazos e procedimentos contratuais",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "suporte_financeiro",
        type: "stars",
        label: "Como você avalia o suporte financeiro (envio de boletos, comprovantes, prazos)?",
        description: "Organização financeira, clareza nos boletos e cumprimento de prazos",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "observacao_contratual",
        type: "textarea",
        label: "Deseja deixar alguma observação sobre a parte contratual ou financeira?",
        description: "Sugestões ou comentários sobre os processos contratuais e financeiros",
        required: false,
      },
      {
        id: "divider_3",
        type: "divider",
        label: "⭐ Seção 3: Avaliação da Estrutura",
      },
      {
        id: "acesso_feira",
        type: "stars",
        label: "Acesso à Feira",
        description: "Avalie a facilidade de acesso ao local do evento",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "estacionamento",
        type: "stars",
        label: "Estacionamento",
        description: "Qualidade e disponibilidade do estacionamento",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "sanitarios",
        type: "stars",
        label: "Sanitários",
        description: "Limpeza e disponibilidade dos sanitários",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "comunicacao_visual",
        type: "stars",
        label: "Comunicação visual interna",
        description: "Sinalização e orientação dentro do evento",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "acessibilidade",
        type: "stars",
        label: "Acessibilidade",
        description: "Facilidades para pessoas com deficiência",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "praca_alimentacao",
        type: "stars",
        label: "Praça de alimentação",
        description: "Qualidade e variedade da alimentação",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "credenciamento",
        type: "stars",
        label: "Credenciamento",
        description: "Processo de entrada e credenciamento",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "acesso_internet",
        type: "stars",
        label: "Acesso à internet",
        description: "Qualidade da conexão Wi-Fi disponível",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "empresas_expositoras",
        type: "stars",
        label: "Empresas expositoras",
        description: "Qualidade e relevância das empresas participantes",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "layout_stands",
        type: "stars",
        label: "Layout interno dos stands",
        description: "Organização e distribuição dos estandes",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "coquetel_abertura",
        type: "stars",
        label: "Coquetel de abertura",
        description: "Qualidade do evento de abertura",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "lounge",
        type: "stars",
        label: "Lounge",
        description: "Conforto e utilidade do espaço lounge",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "estrutura_palestras",
        type: "stars",
        label: "Estrutura para palestras",
        description: "Qualidade do auditório e equipamentos",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "tema_palestras",
        type: "stars",
        label: "Tema das palestras",
        description: "Relevância e qualidade dos conteúdos apresentados",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "podcast",
        type: "stars",
        label: "Podcast",
        description: "Qualidade e relevância do conteúdo do podcast",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "divider_4",
        type: "divider",
        label: "📊 Seção 4: Indicadores Comerciais",
      },
      {
        id: "visitantes_atendidos",
        type: "radio",
        label: "Quantos visitantes foram atendidos?",
        description: "Número aproximado de pessoas que visitaram seu estande",
        required: true,
        options: ["até 10", "de 11 a 20", "de 21 a 50", "+50"],
      },
      {
        id: "orcamentos_gerados",
        type: "radio",
        label: "Quantos orçamentos/cotações foram gerados?",
        description: "Propostas comerciais elaboradas durante o evento",
        required: true,
        options: ["nenhum", "de 1 a 5", "de 6 a 15", "+15"],
      },
      {
        id: "fechou_negocio",
        type: "radio",
        label: "Fechou algum negócio?",
        description: "Vendas efetivadas durante a feira",
        required: true,
        options: ["Sim", "Não"],
      },
      {
        id: "valor_negocio",
        type: "text",
        label: "Se sim, valor estimado (R$)",
        description: "Valor aproximado dos negócios fechados (apenas números)",
        required: false,
      },
      {
        id: "investimento_total",
        type: "text",
        label: "Valor total do investimento da empresa na feira (R$)",
        description: "Inclua stand, produtos, pessoal, hospedagem, etc. (apenas números)",
        required: false,
      },
      {
        id: "perspectiva_negocios",
        type: "text",
        label: "Perspectiva de negócios futuros gerados pela feira (R$)",
        description: "Estimativa de negócios que podem ser fechados nos próximos meses (apenas números)",
        required: false,
      },
      {
        id: "novas_parcerias",
        type: "radio",
        label: "Novas parcerias durante a feira?",
        description: "Contatos comerciais estabelecidos para futuras parcerias",
        required: true,
        options: ["até 5", "de 6 a 15", "+15"],
      },
      {
        id: "expor_2025",
        type: "radio",
        label: "Pretende expor na FEIND 2025?",
        description: "Intenção de participar da próxima edição",
        required: true,
        options: ["Sim", "Não"],
      },
      {
        id: "aumentar_investimento",
        type: "radio",
        label: "Pretende aumentar os investimentos na próxima edição?",
        description: "Planos para ampliar a participação no próximo evento",
        required: true,
        options: ["Sim", "Não"],
      },
      {
        id: "divider_5",
        type: "divider",
        label: "💬 Seção 5: Feedback Aberto",
      },
      {
        id: "ponto_positivo",
        type: "textarea",
        label: "Um ponto positivo",
        description: "Conte-nos o que mais gostou na FEIND 2025",
        required: false,
      },
      {
        id: "ponto_negativo",
        type: "textarea",
        label: "Um ponto negativo",
        description: "O que podemos melhorar para a próxima edição?",
        required: false,
      },
      {
        id: "sugestao",
        type: "textarea",
        label: "Deixe uma sugestão",
        description: "Suas ideias são muito importantes para aprimorarmos a FEIND",
        required: false,
      },
    ],
    responses: [],
  },
]

export async function initializeSampleData() {
  try {
    console.log("🔄 Inicializando dados de exemplo via API...")

    // Verificar se já existem pesquisas
    const response = await fetch("/api/surveys")
    if (!response.ok) {
      throw new Error("Failed to check existing surveys")
    }

    const data = await response.json()
    const existingSurveys = data.surveys || []

    if (existingSurveys.length === 0) {
      console.log("📝 Inserindo pesquisa FEIND 2025 via API...")

      // Salvar pesquisa de exemplo
      for (const survey of sampleSurveys) {
        const saveResponse = await fetch("/api/surveys", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(survey),
        })

        if (saveResponse.ok) {
          console.log(`✅ Pesquisa ${survey.title} inserida com sucesso!`)
        } else {
          console.error(`❌ Erro ao inserir pesquisa ${survey.title}`)
        }
      }
    } else {
      console.log("✅ Pesquisas já existem no banco, pulando inicialização")
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar dados de exemplo:", error)
  }
}
