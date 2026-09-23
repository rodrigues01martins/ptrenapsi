import { useEffect, useState } from 'react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Loader from '../ui/Loader'
import SurveyUploadFlow from './SurveyUploadFlow'
import { buscarRespostas, buscarUltimaImportacao } from '../../../features/surveys/import/surveyImportService'

// ============================================================
// CARD DE IMPORTAÇÃO POR INSTRUMENTO (seção 6/7)
// ============================================================
// Cada fonte (Aprendiz/Mentor/Responsável/Egresso) mostra nome, qtd de
// respostas válidas persistidas, última importação, status e a ação
// "Importar CSV" — que expande o fluxo genérico (SurveyUploadFlow) sem
// navegar para outra página.
function formatarDataHora(timestamp) {
  if (!timestamp?.toDate) return null
  return timestamp.toDate().toLocaleString('pt-BR')
}

export default function SurveyImportCard({ schema }) {
  const [carregando, setCarregando] = useState(true)
  const [totalRespostas, setTotalRespostas] = useState(0)
  const [ultimaImportacao, setUltimaImportacao] = useState(null)
  const [expandido, setExpandido] = useState(false)

  async function carregar() {
    setCarregando(true)
    const [respostas, ultima] = await Promise.all([
      buscarRespostas(schema.surveyType),
      buscarUltimaImportacao(schema.surveyType),
    ])
    setTotalRespostas(respostas.length)
    setUltimaImportacao(ultima)
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [schema.surveyType]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', padding: '20px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-family)', marginBottom: '4px' }}>
            {schema.label}
          </h3>
          {carregando ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)' }}>Carregando…</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-family)' }}>Respostas válidas</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>{totalRespostas}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-family)' }}>Última importação</p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-family)' }}>
                  {ultimaImportacao ? formatarDataHora(ultimaImportacao.importadoEm) || 'agora há pouco' : '—'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-family)' }}>Status</p>
                <Badge variant={ultimaImportacao ? 'success' : 'neutral'}>
                  {ultimaImportacao ? 'Dados importados' : 'Nenhuma importação ainda'}
                </Badge>
              </div>
            </div>
          )}
        </div>
        <Button variant={expandido ? 'secondary' : 'primary'} onClick={() => setExpandido(v => !v)}>
          {expandido ? 'Fechar' : 'Importar CSV'}
        </Button>
      </div>

      {expandido && (
        <div style={{ padding: '0 20px 20px' }}>
          {carregando ? <Loader message="Carregando…" /> : (
            <SurveyUploadFlow schema={schema} onImportComplete={carregar} />
          )}
        </div>
      )}
    </div>
  )
}
