import { favoravelLikert, sempreAplicavel, excluirCodigo } from './common'

// ============================================================
// SCHEMA — RESPONSÁVEL LEGAL (Pesquisa de Satisfação)
// ============================================================
// Mapa canônico da manutenção (seção 23): 12 questões. ATENÇÃO à
// numeração (seção 58/104): IARR = Q11, ISR = Q12 — NUNCA a numeração
// histórica anterior à exclusão da antiga pergunta sobre quantidade de
// contatos.
export const GUARDIAN_SCHEMA = {
  surveyType: 'GUARDIAN',
  schemaVersion: 1,
  label: 'Responsável Legal',
  expectedQuestionCount: 12,
  municipioQuestionId: 'q3',
  dataPreenchimentoQuestionId: 'q1',
  questions: [
    { id: 'q1',  key: 'data',            position: 1,  aliases: ['Data'], type: 'date', scored: false },
    { id: 'q2',  key: 'nomeResponsavel', position: 2,  aliases: ['Nome'], type: 'text', scored: false, discard: true, sensitive: true },
    { id: 'q3',  key: 'municipio',       position: 3,  aliases: ['Município'], type: 'municipio', scored: false },
    { id: 'q4',  key: 'parentescoVinculo', position: 4, aliases: ['Parentesco/vínculo'], type: 'categorical', scored: false },
    { id: 'q5',  key: 'situacaoOcupacional', position: 5, aliases: ['Situação ocupacional'], type: 'categorical', scored: false },

    // IDF = Q6+Q7+Q8 (seção 58).
    { id: 'q6',  key: 'postura',      position: 6,  aliases: ['Postura'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q7',  key: 'comunicacao', position: 7,  aliases: ['Comunicação'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q8',  key: 'pontualidade', position: 8,  aliases: ['Pontualidade'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },

    { id: 'q9',  key: 'expectativaEmpregabilidade', position: 9, aliases: ['Expectativa de empregabilidade'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q10', key: 'condicaoFinanceira', position: 10, aliases: ['Condição financeira'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },

    // IARR = Q11 (seção 58/104), com N/A explícito (seção 33): 0 = nunca
    // precisei falar com a RENAPSI.
    { id: 'q11', key: 'qualidadeAtendimentoRenapsi', position: 11, aliases: ['Qualidade do atendimento RENAPSI'], type: 'coded', scored: true,
      isApplicable: excluirCodigo(0), isFavorable: favoravelLikert },

    // ISR = Q12 (seção 58/104).
    { id: 'q12', key: 'satisfacaoGeral', position: 12, aliases: ['Satisfação geral'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
  ],
}
