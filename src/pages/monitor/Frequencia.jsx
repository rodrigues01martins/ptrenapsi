import { useState, useEffect } from 'react'
import { buscarPeriodos, buscarDadosPeriodo } from '../../services/firestoreService'
import { enriquecerDados, calcularAgregados, formatarPeriodo } from '../../services/csvService'
import { baseFinanceira } from '../../services/classificacaoService'
import KpiCard from '../../components/monitor/ui/KpiCard'
import Loader from '../../components/monitor/ui/Loader'
import EmptyState from '../../components/monitor/ui/EmptyState'
import NotaMetodologica from '../../components/monitor/ui/NotaMetodologica'
import { Select } from '../../components/monitor/ui/Input'

const SvgIcon = ({ path, size = 28 }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" fill="var(--brand-primary)">
    <path d={path} />
  </svg>
)

const ICONS = {
  vagas:    'M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Z',
  freq:     'M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm80-80h400v-80H280v80Zm0-160h400v-80H280v80Z',
  evasao:   'M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z',
  reposicao:'M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z',
}

function GaugeCard({ label, value, sub, meta, color = 'blue', icon }) {
  const pct = Math.min(value, 100)
  const colorMap = {
    blue:   'var(--brand-primary)',
    green:  'var(--status-success-text)',
    danger: 'var(--status-danger-text)',
    warn:   'var(--status-warning-text)',
    teal:   'var(--brand-secondary)',
  }
  const barColor = colorMap[color] || colorMap.blue

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '4px', background: barColor,
        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', marginTop: '4px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-family)', lineHeight: '16px' }}>
          {label}
        </p>
        {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
      </div>

      <p style={{ fontSize: '28px', fontWeight: 700, lineHeight: '32px', letterSpacing: '-0.02em', color: barColor, fontFamily: 'var(--font-family)', marginBottom: '6px' }}>
        {value.toFixed(1)}%
      </p>

      {sub && <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)', marginBottom: '12px' }}>{sub}</p>}

      {/* Barra de progresso */}
      <div style={{ width: '100%', height: '6px', background: 'var(--border-default)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.6s ease',
        }} />
      </div>

      {meta && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-family)' }}>
          {meta}
        </p>
      )}
    </div>
  )
}

export default function Frequencia() {
  const [periodos, setPeriodos] = useState([])
  const [periodoSel, setPeriodoSel] = useState('')
  const [agregados, setAgregados] = useState(null)
  const [dadosEnriquecidos, setDadosEnriquecidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarPeriodos().then(ps => { setPeriodos(ps); if (ps.length) setPeriodoSel(ps[0].periodo) })
  }, [])

  useEffect(() => {
    if (!periodoSel) return
    setLoading(true)
    buscarDadosPeriodo(periodoSel).then(dados => {
      const enriquecidos = enriquecerDados(dados)
      setDadosEnriquecidos(enriquecidos)
      // Regra de ouro: base explícita = quem gerou custo/participação na
      // competência (apuravelFinanceiro), nunca a base gerencial.
      setAgregados(calcularAgregados(baseFinanceira(enriquecidos), periodoSel))
      setLoading(false)
    })
  }, [periodoSel])

  if (loading) return <Loader message="Calculando indicadores..." />
  if (!agregados) return <EmptyState title="Nenhum dado encontrado" description="Faça upload de um CSV na aba Upload primeiro." />

  const VAGAS_TOTAL = 5000

  // 1. Preenchimento de vagas
  const ind_vagas = (agregados.total_aprendizes / VAGAS_TOTAL) * 100

  // 2. Participação regular (frequência) — soma sobre a base financeira,
  // para incluir os dias trabalhados por quem foi desligado no meio do mês.
  const dadosFinanceiros = baseFinanceira(dadosEnriquecidos)
  const soma_freq_util = dadosFinanceiros.reduce((s, r) => s + r._kpis.freq_util, 0)
  const soma_freq_base = dadosFinanceiros.reduce((s, r) => s + r._kpis.freq_base, 0)
  const ind_freq = soma_freq_base > 0 ? (soma_freq_util / soma_freq_base) * 100 : 0

  // 3. Evasão antecipada
  const total_evasoes = agregados.total_evasoes || 0
  const ind_evasao = agregados.total_aprendizes > 0
    ? (total_evasoes / agregados.total_aprendizes) * 100
    : 0

  // 4. Reposição de vagas
  const ind_reposicao = agregados.contratos_finalizados > 0
    ? (agregados.contratos_iniciados / agregados.contratos_finalizados) * 100
    : 0

  // Cor semântica por meta
  const corEvasao    = ind_evasao <= 15 ? 'green' : 'danger'
  const corReposicao = ind_reposicao < 50 ? 'green' : 'danger'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, lineHeight: '32px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', letterSpacing: '-0.01em' }}>
            Eixo 1 — Inclusão
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-family)' }}>
            Matriz de Indicadores · {formatarPeriodo(periodoSel)}
          </p>
        </div>
        <Select value={periodoSel} onChange={e => setPeriodoSel(e.target.value)} style={{ width: '220px' }}>
          {periodos.map(p => (
            <option key={p.periodo} value={p.periodo}>{formatarPeriodo(p.periodo)} ({p.total})</option>
          ))}
        </Select>
      </div>

      {/* KPIs de contexto */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiCard
          icon={<SvgIcon path={ICONS.vagas} />}
          label="Jovens Apurados na Competência"
          value={agregados.total_aprendizes}
          sub={`de ${VAGAS_TOTAL.toLocaleString('pt-BR')} vagas disponíveis`}
          color="blue"
        />
        <KpiCard
          icon={<SvgIcon path={ICONS.reposicao} />}
          label="Contratos Iniciados"
          value={agregados.contratos_iniciados}
          sub="novas entradas no mês"
          color="green"
        />
        <KpiCard
          icon={<SvgIcon path={ICONS.evasao} />}
          label="Evasões no Mês"
          value={total_evasoes}
          sub="saídas antes do término"
          color={total_evasoes > 0 ? 'danger' : 'green'}
        />
        <KpiCard
          icon={<SvgIcon path={ICONS.freq} />}
          label="Contratos Finalizados"
          value={agregados.contratos_finalizados}
          sub="término previsto no mês"
          color="teal"
        />
      </div>

      <NotaMetodologica titulo="Por que este número pode ser maior que o de Apuração Mensal?">
        <strong>Jovens Apurados na Competência</strong> inclui todos que tiveram vínculo em qualquer dia do
        mês — mesmo quem foi desligado antes do fim dele. Para a posição final da competência (sem quem saiu
        no meio do mês), veja <strong>Jovens Ativos</strong>, em Apuração Mensal → Gerencial.
      </NotaMetodologica>

      {/* Indicadores com barra de progresso */}
      <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'var(--font-family)' }}>
        Indicadores de Meta
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <GaugeCard
          icon={<SvgIcon path={ICONS.vagas} />}
          label="Preenchimento de Vagas"
          value={ind_vagas}
          sub={`${agregados.total_aprendizes} aprendizes de ${VAGAS_TOTAL.toLocaleString('pt-BR')} vagas`}
          meta="Meta: 100% das vagas preenchidas"
          color="blue"
        />
        <GaugeCard
          icon={<SvgIcon path={ICONS.freq} />}
          label="Participação Regular"
          value={ind_freq}
          sub={`${soma_freq_util.toLocaleString('pt-BR')} dias úteis trabalhados`}
          meta="Meta: máxima participação nas atividades"
          color="teal"
        />
        <GaugeCard
          icon={<SvgIcon path={ICONS.evasao} />}
          label="Taxa de Evasão Antecipada"
          value={ind_evasao}
          sub={`${total_evasoes} evasões de ${agregados.total_aprendizes} participantes`}
          meta="Meta: ≤ 15% de evasão"
          color={corEvasao}
        />
        <GaugeCard
          icon={<SvgIcon path={ICONS.reposicao} />}
          label="Reposição de Vagas"
          value={ind_reposicao}
          sub={`${agregados.contratos_iniciados} entradas para ${agregados.contratos_finalizados} saídas`}
          meta="Meta: < 50% das vagas liberadas repostas"
          color={corReposicao}
        />
      </div>
    </div>
  )
}
