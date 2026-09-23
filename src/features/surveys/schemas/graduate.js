import { favoravelLikert, favoravelApenasTopo, sempreAplicavel } from './common'

// ============================================================
// SCHEMA — EGRESSO (Avaliação de Resultados Pós-Programa)
// ============================================================
// Mapa canônico da manutenção (seção 24): 13 questões. NÃO é pesquisa de
// satisfação (seção 1) — metodologicamente é avaliação de resultados.
//
// Q5, Q6 e Q7 são categóricas com códigos específicos por indicador
// (TIP/TFET usam Q5 com conjuntos de opções diferentes; IAAP usa Q6; TCE
// usa Q7) — por isso não recebem um único `isFavorable` aqui: cada
// indicador em indicators/graduateIndicators.js define o predicado
// exato conforme a matriz (seções 61-66), evitando fixar uma
// favorabilidade única para uma questão que serve a mais de um cálculo.
export const GRADUATE_SCHEMA = {
  surveyType: 'GRADUATE',
  schemaVersion: 1,
  label: 'Egresso',
  expectedQuestionCount: 13,
  municipioQuestionId: 'q2',
  dataPreenchimentoQuestionId: 'q1',
  questions: [
    { id: 'q1', key: 'data', position: 1, aliases: ['Data'], type: 'date', scored: false },
    { id: 'q2', key: 'municipioResidencia', position: 2, aliases: ['Município de residência'], type: 'municipio', scored: false },
    { id: 'q3', key: 'municipioLocalTrabalho', position: 3, aliases: ['Município do local onde trabalhou'], type: 'municipio', scored: false },
    { id: 'q4', key: 'tempoDesdeSaida', position: 4, aliases: ['Tempo desde a saída do Programa'], type: 'categorical', scored: false },

    // TIP (opções 1,2,3) e TFET (opções 6,7) — ver graduateIndicators.js.
    { id: 'q5', key: 'situacaoAtual', position: 5, aliases: ['Situação atual'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel },

    // IAAP — opções 3,4 favoráveis (seção 64).
    { id: 'q6', key: 'relacaoSituacaoComAprendizagem', position: 6, aliases: ['Relação da situação atual com a aprendizagem'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel },

    // TCE — opções 1,3,4 favoráveis (seção 62).
    { id: 'q7', key: 'situacaoEducacional', position: 7, aliases: ['Situação educacional'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel },

    // IDSE = Q8+Q9+Q10 (seção 65).
    { id: 'q8',  key: 'postura',      position: 8,  aliases: ['Postura'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q9',  key: 'comunicacao',  position: 9,  aliases: ['Comunicação'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q10', key: 'pontualidade', position: 10, aliases: ['Pontualidade'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },

    // IIFE (seção 66).
    { id: 'q11', key: 'condicaoFinanceira', position: 11, aliases: ['Condição financeira'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },

    // IAFE (seção 31 da matriz): "categoria de maior incentivo" — só o
    // topo da escala é favorável. Escala assumida 1-5 (decisão do
    // usuário — ver relatório).
    { id: 'q12', key: 'apoioFamiliar', position: 12, aliases: ['Apoio familiar'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelApenasTopo(5) },

    // IIPT (seção 66).
    { id: 'q13', key: 'importanciaPrograma', position: 13, aliases: ['Importância do Programa'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
  ],
}
