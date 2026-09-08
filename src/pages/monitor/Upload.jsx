import { useState } from 'react'
import UploadZone from '../../components/monitor/upload/UploadZone'
import PreviewTable from '../../components/monitor/upload/PreviewTable'
import Button from '../../components/monitor/ui/Button'
import Badge from '../../components/monitor/ui/Badge'
import { MonthInput } from '../../components/monitor/ui/Input'
import { parseCSV } from '../../services/csvService'
import { salvarPeriodo } from '../../services/firestoreService'
import { classificarBase, reconciliar } from '../../services/classificacaoService'

const LABELS_CHECK = {
  headcount:       'Jovens ativos + encerrados no mês = total da base',
  apuracao_minima: 'Jovens apurados ≥ jovens ativos',
  frequencia:      'Frequência da base financeira bate com a base inteira',
}

// Classifica e reconcilia a base ANTES de salvar, para bloquear o
// fechamento na tela — a checagem definitiva ainda roda de novo dentro de
// salvarPeriodo (defesa em profundidade), mas o usuário precisa ver o
// motivo aqui, sem precisar tentar salvar primeiro.
function tentarReconciliar(dados) {
  try {
    const classificados = classificarBase(dados)
    return reconciliar(classificados)
  } catch (e) {
    return {
      ok: false,
      checks: [{ chave: 'parse', descricao: 'Datas do CSV válidas (dd/mm/aaaa)', ok: false, detalhe: e.message }],
      resumo: null,
    }
  }
}

export default function Upload({ showToast }) {
  const [dados, setDados] = useState([])
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7))
  const [salvando, setSalvando] = useState(false)
  const [reconciliacao, setReconciliacao] = useState(null)

  async function handleFile(file) {
    try {
      const resultado = await parseCSV(file)
      setDados(resultado)
      setReconciliacao(tentarReconciliar(resultado))
    } catch {
      showToast('Erro ao ler o arquivo CSV')
    }
  }

  async function handleSalvar() {
    if (!periodo) { showToast('Selecione o período antes de salvar'); return }
    if (!dados.length) { showToast('Nenhum dado para salvar'); return }
    if (!reconciliacao?.ok) { showToast('Fechamento bloqueado — corrija a reconciliação antes de salvar'); return }
    setSalvando(true)
    try {
      await salvarPeriodo(periodo, dados)
      showToast(`${dados.length} registros salvos com sucesso!`)
      setDados([])
      setReconciliacao(null)
    } catch (e) {
      showToast('Erro ao salvar: ' + e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Page title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '26px', fontWeight: 700, lineHeight: '32px',
          color: 'var(--text-primary)', fontFamily: 'var(--font-family)',
          letterSpacing: '-0.01em',
        }}>
          Importar Dados
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-family)' }}>
          Faça upload do CSV mensal para atualizar o painel de monitoramento
        </p>
      </div>

      {/* Período */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '16px',
        padding: '16px 20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <MonthInput
          label="Período de referência"
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          style={{ width: '200px' }}
        />
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', paddingBottom: '10px', fontFamily: 'var(--font-family)' }}>
          Selecione o mês/ano antes de importar
        </p>
      </div>

      {/* Upload ou Preview */}
      {!dados.length ? (
        <UploadZone onFile={handleFile} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <PreviewTable dados={dados} />

          {reconciliacao && (
            <div style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${reconciliacao.ok ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
                padding: '12px 20px',
                background: reconciliacao.ok ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                borderBottom: '1px solid var(--border-default)',
              }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
                  Reconciliação da Competência
                </h3>
                <Badge variant={reconciliacao.ok ? 'success' : 'danger'}>
                  {reconciliacao.ok ? 'Liberado para fechamento' : 'Fechamento bloqueado'}
                </Badge>
              </div>

              {reconciliacao.resumo && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
                  {[
                    ['Total da base', reconciliacao.resumo.totalBase],
                    ['Jovens ativos', reconciliacao.resumo.jovensAtivos],
                    ['Jovens apurados', reconciliacao.resumo.jovensApurados],
                    ['Encerrados no mês', reconciliacao.resumo.desligadosNoMes],
                  ].map(([label, valor]) => (
                    <div key={label}>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                      <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>{valor}</p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {reconciliacao.checks.map(c => (
                  <div key={c.chave} style={{ display: 'flex', gap: '12px', padding: '12px 20px', borderBottom: '1px solid var(--border-default)' }}>
                    <Badge variant={c.ok ? 'success' : 'danger'}>{c.ok ? '✓' : '✗'}</Badge>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
                        {LABELS_CHECK[c.chave] || c.descricao}
                      </p>
                      {!c.ok && (
                        <p style={{ fontSize: '12px', color: 'var(--status-danger-text)', fontFamily: 'var(--font-family)', marginTop: '2px' }}>
                          {c.detalhe}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            {!reconciliacao?.ok && (
              <span style={{ fontSize: '13px', color: 'var(--status-danger-text)', fontFamily: 'var(--font-family)' }}>
                Corrija o CSV e importe novamente
              </span>
            )}
            <Button variant="secondary" onClick={() => { setDados([]); setReconciliacao(null) }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSalvar}
              loading={salvando}
              disabled={!reconciliacao?.ok}
            >
              Confirmar e Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
