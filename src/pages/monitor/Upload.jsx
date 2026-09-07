import { useState } from 'react'
import UploadZone from '../../components/monitor/upload/UploadZone'
import PreviewTable from '../../components/monitor/upload/PreviewTable'
import Button from '../../components/monitor/ui/Button'
import { MonthInput } from '../../components/monitor/ui/Input'
import { parseCSV } from '../../services/csvService'
import { salvarPeriodo } from '../../services/firestoreService'

export default function Upload({ showToast }) {
  const [dados, setDados] = useState([])
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7))
  const [salvando, setSalvando] = useState(false)

  async function handleFile(file) {
    try {
      const resultado = await parseCSV(file)
      setDados(resultado)
    } catch {
      showToast('Erro ao ler o arquivo CSV')
    }
  }

  async function handleSalvar() {
    if (!periodo) { showToast('Selecione o período antes de salvar'); return }
    if (!dados.length) { showToast('Nenhum dado para salvar'); return }
    setSalvando(true)
    try {
      await salvarPeriodo(periodo, dados)
      showToast(`${dados.length} registros salvos com sucesso!`)
      setDados([])
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setDados([])}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSalvar}
              loading={salvando}
            >
              Confirmar e Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
