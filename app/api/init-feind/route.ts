import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const FEIND_2025_SURVEY_ID = "feind_2025_official_v1" // Fixed ID

export async function POST() {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    // Check if the FEIND 2025 survey already exists
    const existingSurveyResult = await sql`
      SELECT id FROM surveys.surveys WHERE id = ${FEIND_2025_SURVEY_ID}
    `

    if (existingSurveyResult.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Pesquisa FEIND 2025 já inicializada.",
        surveyId: FEIND_2025_SURVEY_ID,
      })
    }

    const fields = [
      {
        id: "divider_1",
        type: "divider",
        label: "🧾 Seção 1 – Informações do Participante",
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
        type: "email",
        label: "E-mail",
        description: "Seu e-mail para contato",
        required: true,
        validation: {
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        },
      },
      {
        id: "telefone",
        type: "phone",
        label: "Telefone",
        description: "Telefone para contato (opcional)",
        required: false,
        validation: {
          pattern: "^$$\\d{2}$$\\s\\d{4,5}-\\d{4}$", // Corrected pattern
          mask: "(99) 99999-9999",
        },
      },
      {
        id: "divider_2",
        type: "divider",
        label: "🗂️ Seção 2 – Pré-Feira",
      },
      {
        id: "processo_aquisicao",
        type: "stars",
        label: "Processo de aquisição do espaço",
        description: "Avalie todo o processo desde o primeiro contato até a confirmação do espaço",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "atendimento_adriana",
        type: "stars",
        label: "Atendimento comercial da Polo Eventos – Adriana",
        description: "Qualidade do atendimento, agilidade nas respostas e suporte comercial",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "comentario_comercial",
        type: "textarea",
        label: "Comentário sobre o processo comercial",
        description: "Compartilhe sua experiência com o atendimento comercial da Polo Eventos",
        required: false,
      },
      {
        id: "processo_contratual",
        type: "stars",
        label: "Processo contratual com CIESP",
        description: "Clareza dos contratos, prazos e procedimentos contratuais",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "suporte_financeiro",
        type: "stars",
        label: "Suporte financeiro",
        description: "Organização financeira, clareza nos boletos e cumprimento de prazos",
        required: true,
        min: 1,
        max: 5,
      },
      {
        id: "observacoes_contratual",
        type: "textarea",
        label: "Observações sobre parte contratual ou financeira",
        description: "Sugestões ou comentários sobre os processos contratuais e financeiros",
        required: false,
      },
      {
        id: "divider_3",
        type: "divider",
        label: "⭐ Seção 3 – Estrutura da Feira",
      },
      {
        id: "acesso_feira",
        type: "stars",
        label: "Acesso à feira",
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
        label: "Comunicação visual",
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
        id: "divider_4",
        type: "divider",
        label: "📊 Seção 4 – Indicadores Comerciais",
      },
      {
        id: "orcamentos_gerados",
        type: "radio",
        label: "Quantos orçamentos foram gerados?",
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
        id: "valor_estimado",
        type: "currency",
        label: "Valor estimado (R$)",
        description: "Valor aproximado dos negócios fechados",
        required: false,
        validation: {
          currency: "BRL",
          min: 0,
        },
      },
      {
        id: "pretende_expor_2025",
        type: "radio",
        label: "Pretende expor em 2025?",
        description: "Intenção de participar da próxima edição",
        required: true,
        options: ["Sim", "Não"],
      },
      {
        id: "divider_5",
        type: "divider",
        label: "💬 Seção 5 – Feedback Aberto",
      },
      {
        id: "ponto_positivo",
        type: "textarea",
        label: "Ponto positivo do evento",
        description: "Conte-nos o que mais gostou na FEIND 2025",
        required: false,
      },
      {
        id: "ponto_negativo",
        type: "textarea",
        label: "Ponto negativo do evento",
        description: "O que podemos melhorar para a próxima edição?",
        required: false,
      },
      {
        id: "sugestao_proxima_edicao",
        type: "textarea",
        label: "Sugestão para a próxima edição",
        description: "Suas ideias são muito importantes para aprimorarmos a FEIND",
        required: false,
      },
    ]

    await sql`
      INSERT INTO surveys.surveys (
        id, 
        title, 
        description, 
        logo, 
        fields, 
        is_active, 
        created_at
      ) VALUES (
        ${FEIND_2025_SURVEY_ID},
        'Pesquisa de Satisfação – FEIND 2025',
        'Sua opinião é fundamental para aprimorarmos a próxima edição da FEIND. Compartilhe sua experiência conosco e nos ajude a construir um evento ainda melhor.',
        '',
        ${JSON.stringify(fields)}::jsonb,
        true,
        now()
      )
    `

    return NextResponse.json({
      success: true,
      message: "Pesquisa FEIND 2025 criada com sucesso!",
      surveyId: FEIND_2025_SURVEY_ID,
    })
  } catch (error) {
    console.error("Erro ao criar pesquisa FEIND:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar pesquisa FEIND",
      },
      { status: 500 },
    )
  }
}
