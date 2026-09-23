import {
  favoravelLikert, favoravelInvertido, favoravelApenasTopo,
  sempreAplicavel, excluirCodigo,
} from './common'

// ============================================================
// SCHEMA — APRENDIZ ATIVO (Pesquisa de Satisfação)
// ============================================================
// Mapa canônico da manutenção (seção 21): 21 questões. Aliases usam por
// ora os RÓTULOS CURTOS do próprio mapeamento da manutenção — decisão
// explícita do usuário enquanto o CSV/PDF real do Forms não é anexado
// (ver relatório final, seção "Limitações"). Quando o arquivo real
// chegar, só esta lista de aliases precisa de ajuste; nada na
// arquitetura de validação/normalização/indicadores muda.
export const ACTIVE_LEARNER_SCHEMA = {
  surveyType: 'ACTIVE_LEARNER',
  schemaVersion: 1,
  label: 'Aprendiz Ativo',
  expectedQuestionCount: 21,
  municipioQuestionId: 'q4',
  dataPreenchimentoQuestionId: 'q1',
  questions: [
    { id: 'q1',  key: 'dataPreenchimento',        position: 1,  aliases: ['Data de Preenchimento'], type: 'date', scored: false },
    { id: 'q2',  key: 'nomeJovem',                position: 2,  aliases: ['Nome do Jovem'], type: 'text', scored: false, discard: true, sensitive: true },
    { id: 'q3',  key: 'cpf',                      position: 3,  aliases: ['CPF'], type: 'text', scored: false, discard: true, sensitive: true },
    { id: 'q4',  key: 'municipio',                position: 4,  aliases: ['Município'], type: 'municipio', scored: false },
    { id: 'q5',  key: 'modalidade',               position: 5,  aliases: ['Modalidade'], type: 'categorical', scored: false },
    { id: 'q6',  key: 'etapaAprendizagem',        position: 6,  aliases: ['Etapa da aprendizagem'], type: 'categorical', scored: false },
    { id: 'q7',  key: 'atividadesNaoRelacionadas',position: 7,  aliases: ['Atividades não relacionadas ao trabalho administrativo'], type: 'coded', scored: false },

    { id: 'q8',  key: 'didaticaProfessores',  position: 8,  aliases: ['Didática dos professores'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q9',  key: 'conteudosMinistrados', position: 9,  aliases: ['Conteúdos ministrados'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },

    // Regra especial seção 29: 0 é resposta negativa real, permanece no
    // denominador (nunca é N/A automático).
    { id: 'q10', key: 'materialDidatico', position: 10, aliases: ['Material didático'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },

    // Regra especial seção 30: 0 = nunca teve acesso ao conteúdo EAD →
    // fora do denominador.
    { id: 'q11', key: 'conteudoEad', position: 11, aliases: ['Conteúdo EAD/Online/Virtual'], type: 'coded', scored: true,
      isApplicable: excluirCodigo(0), isFavorable: favoravelLikert },

    // Regra especial seção 31: 0 = não teve aulas em Polo Presencial →
    // fora do denominador.
    { id: 'q12', key: 'poloPresencial', position: 12, aliases: ['Polo Presencial'], type: 'coded', scored: true,
      isApplicable: excluirCodigo(0), isFavorable: favoravelLikert },

    // Regra especial seção 32/55: escala 1-3, todas válidas, favorável
    // é somente 3 ("Sempre consigo acessar").
    { id: 'q13', key: 'acessoPlataformaEad', position: 13, aliases: ['Acesso à plataforma/conteúdo EAD'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelApenasTopo(3) },

    { id: 'q14', key: 'qtdContatosRenapsi', position: 14, aliases: ['Quantidade de contatos com RENAPSI'], type: 'coded', scored: false },

    // Regra especial seção 33: 0 = nunca precisei falar com a RENAPSI →
    // não aplicável (fora do numerador e do denominador).
    { id: 'q15', key: 'qualidadeAtendimentoRenapsi', position: 15, aliases: ['Qualidade do atendimento RENAPSI'], type: 'coded', scored: true,
      isApplicable: excluirCodigo(0), isFavorable: favoravelLikert },

    { id: 'q16', key: 'acolhimentoFormacao', position: 16, aliases: ['Acolhimento na formação'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
    { id: 'q17', key: 'acolhimentoPratica', position: 17, aliases: ['Acolhimento na prática'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },

    // Regra especial seção 34: item invertido — favorável é 1 ou 2.
    { id: 'q18', key: 'ociosidade', position: 18, aliases: ['Ociosidade'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelInvertido },

    { id: 'q19', key: 'expectativaEmpregabilidade', position: 19, aliases: ['Expectativa de empregabilidade'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },

    // IAFA (matriz linha 13): "categoria de maior incentivo" — só o topo
    // da escala é favorável, não 4-ou-5. Escala assumida 1-5 (decisão do
    // usuário — ver relatório).
    { id: 'q20', key: 'incentivoFamiliar', position: 20, aliases: ['Incentivo familiar'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelApenasTopo(5) },

    { id: 'q21', key: 'satisfacaoGeral', position: 21, aliases: ['Satisfação geral'], type: 'coded', scored: true,
      isApplicable: sempreAplicavel, isFavorable: favoravelLikert },
  ],
}
