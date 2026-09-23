import { useState } from 'react'
import { auth } from '../../../firebase'
import UploadZone from '../upload/UploadZone'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Loader from '../ui/Loader'
import { validarESimularImportacao, confirmarImportacao } from '../../../features/surveys/import/surveyImportService'

// ============================================================
// FLUXO DE IMPORTAÇÃO DE PESQUISA — genérico sobre qualquer schema
// ============================================================
// Reaproveita conceitualmente o fluxo SELECIONAR → VALIDAR → REVISAR →
// CONFIRMAR → IMPORTAR → RESULTADO da Apuração Mensal (seção 8), mas com
// prévia própria: nunca reutiliza o PreviewTable genérico da Apuração,
// porque aqui os dados normalizados têm objetos aninhados (answers,
// município) e exigem uma prévia CURADA sem dados pessoais (seção 39) —
// bem diferente de "mostrar todas as colunas do CSV".
function formatarDataHora(valor) {
  if (!valor) return '—'
  return valor
}

function PreviaCurada({ classificacao }) {
  const linhas = [
    ...classificacao.novos.map(r => ({ ...r, _situacao: 'Novo' })),
    ...classificacao.atualizados.map(r => ({ ...r, _situacao: 'Atualizado' })),
  ].slice(0, 15)

  if (linhas.length === 0) return null

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-subtle)' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--font-family)' }}>
          Prévia — {linhas.length} de {classificacao.novos.length + classificacao.atualizados.length} respostas novas/atualizadas
        </h3>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: '260px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {['ID da resposta', 'Conclusão em', 'Município', 'Situação'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', whiteSpace: 'nowrap', position: 'sticky', top: 0, borderBottom: '1px solid var(--border-default)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map(r => (
              <tr key={r.sourceResponseId} style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{r.sourceResponseId}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{formatarDataHora(r.completedAt)}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{r.municipalityName || (r.municipalityRaw ? `${r.municipalityRaw} (não reconhecido)` : '—')}</td>
                <td style={{ padding: '10px 16px' }}><Badge variant={r._situacao === 'Novo' ? 'success' : 'info'}>{r._situacao}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function SurveyUploadFlow({ schema, onImportComplete }) {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle|selected|validating|valid|invalid|importing|success|error
  const [resultado, setResultado] = useState(null)
  const [resumoFinal, setResumoFinal] = useState(null)
  const [erroImportacao, setErroImportacao] = useState('')

  function handleFile(novoFile) {
    setFile(novoFile)
    setStatus('selected')
    setResultado(null)
    setErroImportacao('')
  }

  function handleTrocarArquivo() {
    setFile(null)
    setStatus('idle')
    setResultado(null)
  }

  async function handleValidar() {
    setStatus('validating')
    const r = await validarESimularImportacao(schema, file)
    setResultado(r)
    setStatus(r.ok ? 'valid' : 'invalid')
  }

  async function handleConfirmar() {
    setStatus('importing')
    try {
      await confirmarImportacao(schema, resultado, file, { uid: auth.currentUser?.uid, email: auth.currentUser?.email })
      setResumoFinal({
        novos: resultado.classificacao.novos.length,
        atualizados: resultado.classificacao.atualizados.length,
        inalterados: resultado.classificacao.inalterados.length,
        arquivo: file.name,
      })
      setStatus('success')
      onImportComplete?.()
    } catch (e) {
      setErroImportacao(e.message || '')
      setStatus('error')
    }
  }

  function handleNovaImportacao() {
    setFile(null)
    setStatus('idle')
    setResultado(null)
    setResumoFinal(null)
    setErroImportacao('')
  }

  const podeConfirmar = status === 'valid' && resultado?.classificacao &&
    (resultado.classificacao.novos.length + resultado.classificacao.atualizados.length) > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {status === 'idle' && <UploadZone onFile={handleFile} />}

      {(status === 'selected' || status === 'validating' || status === 'invalid') && file && (
        <div style={{ background: 'var(--bg-surface)', border: `1px solid ${status === 'invalid' ? 'var(--status-danger-border)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-family)', marginBottom: '6px' }}>
            {status === 'invalid' ? 'Arquivo inválido' : 'Arquivo selecionado'}
          </p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>{file.name}</p>

          {status === 'invalid' && resultado && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...resultado.errosArquivo, ...resultado.errosEstrutura].map((erro, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Badge variant="danger">✕</Badge>
                  <p style={{ fontSize: '13px', color: 'var(--status-danger-text)', fontFamily: 'var(--font-family)' }}>{erro.mensagem}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={handleTrocarArquivo} disabled={status === 'validating'}>
              {status === 'invalid' ? 'Escolher outro arquivo' : 'Trocar arquivo'}
            </Button>
            {status !== 'invalid' && (
              <Button variant="primary" onClick={handleValidar} loading={status === 'validating'} disabled={status === 'validating'}>
                Validar arquivo
              </Button>
            )}
          </div>
        </div>
      )}

      {status === 'validating' && <Loader message="Validando arquivo…" />}

      {(status === 'valid' || status === 'importing') && resultado && (
        <>
          {/* Resumo antes de confirmar — seção 40 */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--status-success-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '12px 20px', background: 'var(--status-success-bg)', borderBottom: '1px solid var(--border-default)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
                Validação — {schema.label}
              </h3>
              <Badge variant="success">Estrutura reconhecida</Badge>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '16px 20px' }}>
              {[
                ['Arquivo', file?.name],
                ['Versão do schema', schema.schemaVersion],
                ['Linhas encontradas', resultado.resumoValidacao.totalLinhas],
                ['Linhas válidas', resultado.resumoValidacao.validos],
                ['Novos', resultado.classificacao.novos.length],
                ['Atualizados', resultado.classificacao.atualizados.length],
                ['Inalterados', resultado.classificacao.inalterados.length],
                ['Avisos', resultado.resumoValidacao.avisos],
                ['Erros', resultado.resumoValidacao.invalidos],
              ].map(([label, valor]) => (
                <div key={label}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>{valor}</p>
                </div>
              ))}
            </div>
          </div>

          {resultado.avisos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {resultado.avisos.slice(0, 8).map((aviso, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 16px', background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning-border)', borderRadius: 'var(--radius-sm)' }}>
                  <Badge variant="warning">⚠</Badge>
                  <p style={{ fontSize: '13px', color: 'var(--status-warning-text)', fontFamily: 'var(--font-family)' }}>{aviso.mensagem}</p>
                </div>
              ))}
              {resultado.avisos.length > 8 && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)' }}>
                  + {resultado.avisos.length - 8} aviso(s) adicional(is).
                </p>
              )}
            </div>
          )}

          {resultado.errosLinha?.length > 0 && (
            <div style={{ padding: '12px 16px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontSize: '13px', color: 'var(--status-danger-text)', fontFamily: 'var(--font-family)' }}>
                {resultado.errosLinha.length} linha(s) com erro foram ignoradas e não serão importadas (ver detalhes técnicos abaixo).
              </p>
              <details style={{ marginTop: '8px' }}>
                <summary style={{ fontSize: '12px', color: 'var(--status-danger-text)', cursor: 'pointer' }}>Ver linhas com erro</summary>
                <ul style={{ marginTop: '8px', paddingLeft: '18px' }}>
                  {resultado.errosLinha.slice(0, 20).map((erro, i) => (
                    <li key={i} style={{ fontSize: '12px', color: 'var(--status-danger-text)', fontFamily: 'var(--font-family)' }}>{erro.mensagem}</li>
                  ))}
                </ul>
              </details>
            </div>
          )}

          <PreviaCurada classificacao={resultado.classificacao} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {!podeConfirmar && (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)' }}>
                Nenhuma resposta nova ou atualizada para importar.
              </span>
            )}
            <Button variant="secondary" onClick={handleTrocarArquivo} disabled={status === 'importing'}>Trocar arquivo</Button>
            <Button variant="primary" onClick={handleConfirmar} loading={status === 'importing'} disabled={!podeConfirmar || status === 'importing'}>
              Confirmar Importação
            </Button>
          </div>

          {status === 'importing' && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)', textAlign: 'center' }}>
              Importando respostas… Isso pode levar alguns instantes.
            </p>
          )}
        </>
      )}

      {status === 'success' && resumoFinal && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--status-success-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px', background: 'var(--status-success-bg)', borderBottom: '1px solid var(--border-default)' }}>
            <Badge variant="success">✓</Badge>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>Importação concluída</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '20px' }}>
            {[['Novos', resumoFinal.novos], ['Atualizados', resumoFinal.atualizados], ['Inalterados', resumoFinal.inalterados], ['Arquivo', resumoFinal.arquivo]].map(([label, valor]) => (
              <div key={label}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>{valor}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '0 20px 20px' }}>
            <Button variant="primary" onClick={handleNovaImportacao}>Nova Importação</Button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--status-danger-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px', background: 'var(--status-danger-bg)', borderBottom: '1px solid var(--border-default)' }}>
            <Badge variant="danger">⚠</Badge>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>Não foi possível concluir a importação</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-family)', marginBottom: '8px' }}>
              A importação não foi concluída. Como a gravação é feita em lotes, é possível que parte das respostas já tenha sido salva — reimportar o mesmo arquivo é seguro (idempotente) e não duplica registros.
            </p>
            {erroImportacao && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)' }}>Detalhe técnico: {erroImportacao}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '0 20px 20px' }}>
            <Button variant="primary" onClick={handleNovaImportacao}>Tentar novamente</Button>
          </div>
        </div>
      )}
    </div>
  )
}
