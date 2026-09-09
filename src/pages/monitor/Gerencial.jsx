import { useState, useEffect } from 'react'
import { buscarPeriodos, buscarDadosPeriodo } from '../../services/firestoreService'
import { enriquecerDados, calcularAgregados, formatarPeriodo, parseMoeda } from '../../services/csvService'
import { baseGerencial, baseFinanceira } from '../../services/classificacaoService'
import KpiCard from '../../components/monitor/ui/KpiCard'
import Loader from '../../components/monitor/ui/Loader'
import EmptyState from '../../components/monitor/ui/EmptyState'
import NotaMetodologica from '../../components/monitor/ui/NotaMetodologica'
import MapaMunicipios from '../../components/monitor/ui/MapaMunicipios'
import { Select } from '../../components/monitor/ui/Input'

const SvgIcon = ({ path, size = 28 }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" fill="var(--brand-primary)">
    <path d={path} />
  </svg>
)

const ICONS = {
  users:    'M400-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM80-160v-112q0-33 17-62t47-44q51-26 115-44t141-18q77 0 141 18t115 44q30 15 47 44t17 62v112H80Z',
  plus:     'M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z',
  minus:    'M200-440v-80h560v80H200Z',
  map:      'M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Z',
  building: 'M120-120v-560l320-160 320 160v560H120Zm80-80h560v-440L520-800 200-640v440Z',
  shield:   'M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Z',
  cake:     'M160-80v-80h640v80H160Zm0-160v-200q0-52 35-87.5t87-42.5l-2-10q0-42 29-71t71-29q42 0 71 29t29 71v10q52 8 86 43.5t34 86.5v200H160Z',
}

export default function Gerencial() {
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
      // Agregador financeiro/eventos: base explícita = quem gerou custo na
      // competência (nunca a base gerencial — regra de ouro).
      setAgregados(calcularAgregados(baseFinanceira(enriquecidos), periodoSel))
      setLoading(false)
    })
  }, [periodoSel])

  if (loading) return <Loader message="Calculando indicadores..." />
  if (!agregados) return <EmptyState title="Nenhum dado encontrado" description="Faça upload de um CSV na aba Upload primeiro." />

  // Indicador GERENCIAL: quem terminou a competência vinculado ao programa
  // (posição final). Não inclui quem foi desligado no meio do mês, mesmo
  // que tenha gerado custo — esse é o número da base financeira, acima.
  const jovensAtivos = baseGerencial(dadosEnriquecidos).length
  const dataBaseFormatada = (() => {
    const [ano, mes] = periodoSel.split('-').map(Number)
    return new Date(ano, mes, 0).toLocaleDateString('pt-BR')
  })()

  // Vale Transporte é um item de custo (oc_vt), igual aos demais que
  // compõem val_apu_inc — segue a regra de ouro e usa a base financeira,
  // não a gerencial: quem recebeu VT e foi desligado no meio do mês
  // continua contando aqui.
  const dadosComVT = baseFinanceira(dadosEnriquecidos).filter(r => parseMoeda(r.oc_vt) > 0)
  const contagemVTPorCidade = {}
  dadosComVT.forEach(r => {
    const cidade = (r.cidade || '').toUpperCase().trim()
    if (cidade) contagemVTPorCidade[cidade] = (contagemVTPorCidade[cidade] || 0) + 1
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, lineHeight: '32px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', letterSpacing: '-0.01em' }}>
            Indicadores Gerenciais
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-family)' }}>
            {formatarPeriodo(periodoSel)} · {jovensAtivos} jovens ativos
          </p>
        </div>
        <Select
          value={periodoSel}
          onChange={e => setPeriodoSel(e.target.value)}
          style={{ width: '220px' }}
        >
          {periodos.map(p => (
            <option key={p.periodo} value={p.periodo}>{formatarPeriodo(p.periodo)} ({p.total})</option>
          ))}
        </Select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <KpiCard icon={<SvgIcon path={ICONS.users} />} label={`Jovens Ativos em ${dataBaseFormatada} (posição final)`} value={jovensAtivos} sub="não inclui quem foi desligado neste mês" color="blue" />
        <KpiCard icon={<SvgIcon path={ICONS.plus} />} label="Contratos Iniciados" value={agregados.contratos_iniciados} sub="no mês de referência" color="green" />
        <KpiCard icon={<SvgIcon path={ICONS.minus} />} label="Contratos Finalizados" value={agregados.contratos_finalizados} sub="no mês de referência" color="danger" />
        <KpiCard icon={<SvgIcon path={ICONS.map} />} label="Municípios Atendidos" value={agregados.municipios} sub="cidades com aprendizes" color="teal" />
      </div>

      <NotaMetodologica titulo="Por que este número pode ser menor que o de Monitoramento e Avaliação?">
        <strong>Jovens Ativos</strong> é a posição final da competência: exclui quem foi admitido e/ou desligado
        durante o mês. Para o total de jovens que geraram custo ou participação em qualquer dia do mês —
        mesmo os desligados no meio dele — veja <strong>Jovens Apurados na Competência</strong>, em
        Monitoramento e Avaliação → Eixo 1 — Inclusão.
      </NotaMetodologica>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiCard icon={<SvgIcon path={ICONS.building} />} label="Órgãos e Entidades" value={agregados.lotacoes} sub="locais de lotação" color="blue" />
        <KpiCard icon={<SvgIcon path={ICONS.shield} />} label="Acima de 18 anos — PCD ou Estabilidade" value={agregados.total_acima_18_prot} sub="oc_pcds = 1 ou oc_estab = 1" color="purple" />
        <KpiCard icon={<SvgIcon path={ICONS.cake} />} label="Jovens que Atingiram 18 anos no Mês" value={agregados.total_aniversario_mes} sub="completaram 18 anos no período" color="warn" />
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
            Jovens com Vale Transporte por Município
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)' }}>
            Círculo proporcional à quantidade de jovens com VT · clique para detalhes
          </span>
        </div>
        <MapaMunicipios
          contagensPorCidade={contagemVTPorCidade}
          rotulo="jovens com VT"
          totalBase={dadosComVT.length}
          key={periodoSel}
        />
      </div>
    </div>
  )
}
