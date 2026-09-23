import { favoravelLikert, sempreAplicavel, excluirCodigo } from './common'

// ============================================================
// SCHEMA — MENTOR DA PRÁTICA (Pesquisa de Satisfação)
// ============================================================
// Mapa canônico da manutenção (seção 22): 17 questões. Ver nota sobre
// aliases curtos em activeLearner.js — mesma decisão, mesmo motivo.
export const MENTOR_SCHEMA = {
  surveyType: 'MENTOR',
  schemaVersion: 1,
  label: 'Mentor da Prática',
  expectedQuestionCount: 17,
  municipioQuestionId: 'q3',
  dataPreenchimentoQuestionId: 'q1',
  questions: [
    { id: 'q1',  key: 'data',                    position: 1,  aliases: ['Data'], type: 'date', scored: false },
    { id: 'q2',  key: 'nomeMentor',               position: 2,  aliases: ['Nome'], type: 'text', scored: false, discard: true, sensitive: true },
    { id: 'q3',  key: 'municipioAtuacao',         position: 3,  aliases: ['Município de atuação'], type: 'municipio', scored: false },
    { id: 'q4',  key: 'orgaoUnidadeSetor',        position: 4,  aliases: ['Órgão/unidade/setor'], type: 'categorical', scored: false },
    { id: 'q5',  key: 'tempoComoMentor',          position: 5,  aliases: ['Tempo como mentor/supervisor'], type: 'categorical', scored: false },
    { id: 'q6',  key: 'qtdAprendizesSupervisionados', position: 6, aliases: ['Quantidade de aprendizes supervisionados'], type: 'coded', scored: false },

    // IDAP = Q7+Q8+Q9+Q10 (seção 59).
    { id: 'q7',  key: 'assiduidadePontualidadeJornada', position: 7,  aliases: ['Assiduidade/pontualidade/jornada'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q8',  key: 'posturaRespeitoNormas',    position: 8,  aliases: ['Postura/respeito/normas'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q9',  key: 'iniciativaInteresseDisposicao', position: 9, aliases: ['Iniciativa/interesse/disposição'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q10', key: 'assimilacaoAplicacaoOrientacoes', position: 10, aliases: ['Assimilação e aplicação das orientações'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },

    // ICDP = Q11+Q12+Q13 (seção 59).
    { id: 'q11', key: 'contribuicaoPostura',      position: 11, aliases: ['Contribuição para postura'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q12', key: 'contribuicaoComunicacao',  position: 12, aliases: ['Contribuição para comunicação'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q13', key: 'contribuicaoPontualidade', position: 13, aliases: ['Contribuição para pontualidade'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },

    { id: 'q14', key: 'contribuicaoCondicoesFinanceiras', position: 14, aliases: ['Contribuição para condições financeiras'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },

    // Regra especial seção 33: Mentor Q15 é uma das 3 questões de
    // atendimento com N/A explícito (0 = nunca precisou). Escala
    // assumida 1-5 (decisão do usuário — ver relatório).
    { id: 'q15', key: 'atendimentoPrograma',      position: 15, aliases: ['Atendimento do Programa'], type: 'coded', scored: true,
      isApplicable: excluirCodigo(0), isFavorable: favoravelLikert },

    { id: 'q16', key: 'desempenhoGeral',          position: 16, aliases: ['Desempenho geral'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q17', key: 'disposicaoReceberNovosAprendizes', position: 17, aliases: ['Disposição para receber novos aprendizes'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
  ],
}
