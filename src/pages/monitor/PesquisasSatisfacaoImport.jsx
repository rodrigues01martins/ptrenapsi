import SurveyImportCard from '../../components/monitor/surveys/SurveyImportCard'
import { ACTIVE_LEARNER_SCHEMA, MENTOR_SCHEMA, GUARDIAN_SCHEMA } from '../../features/surveys/schemas'

// ============================================================
// FORMULÁRIOS → INDICADORES DE SATISFAÇÃO (seção 6)
// ============================================================
// Concentra as três fontes (Aprendiz Ativo, Mentor da Prática,
// Responsável Legal) numa única página — nunca três páginas separadas
// sem necessidade (seção 6, último parágrafo). Nome técnico interno
// coerente com a seção 5: este é um ambiente de ENTRADA de dados, não um
// questionário preenchido no aplicativo.
export default function PesquisasSatisfacaoImport() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 700, lineHeight: '32px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', letterSpacing: '-0.01em' }}>
          Indicadores de Satisfação — Importação
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-family)' }}>
          Importe os arquivos CSV exportados do Microsoft Forms para cada uma das três pesquisas de satisfação.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SurveyImportCard schema={ACTIVE_LEARNER_SCHEMA} />
        <SurveyImportCard schema={MENTOR_SCHEMA} />
        <SurveyImportCard schema={GUARDIAN_SCHEMA} />
      </div>
    </div>
  )
}
