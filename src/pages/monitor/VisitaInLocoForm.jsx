import { useState } from 'react'
import { auth } from '../../firebase'
import Button from '../../components/monitor/ui/Button'
import { Input, Select } from '../../components/monitor/ui/Input'
import { COORDS_GOIAS } from '../../components/monitor/coordsGoias'
import {
  BLOCOS,
  PONTUACAO_MAXIMA,
  OPCOES_PONTUACAO,
  calcularSemestre,
  calcularPontuacao,
  validarRespostasCompletas,
  salvarVisita,
} from '../../services/inLocoService'

const MUNICIPIOS = Object.keys(COORDS_GOIAS).sort((a, b) => a.localeCompare(b, 'pt-BR'))

function agora() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return {
    data: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    hora: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  }
}

function opcoesSemestre(valorAtual) {
  const anoBase = new Date().getFullYear()
  const anos = [anoBase - 1, anoBase, anoBase + 1]
  const opcoes = anos.flatMap(a => [`${a}/1`, `${a}/2`])
  if (valorAtual && !opcoes.includes(valorAtual)) opcoes.push(valorAtual)
  return opcoes.sort()
}

const cabecalhoInicial = () => {
  const { data, hora } = agora()
  return {
    municipio: '',
    nome_local: '',
    data_visita: data,
    hora_visita: hora,
    responsavel_visita: '',
    representante_osc: '',
    semestre_referencia: calcularSemestre(data),
    local_terreo: false,
  }
}

const textareaStyle = {
  width: '100%',
  minHeight: '64px',
  padding: '10px 14px',
  fontSize: '14px',
  fontFamily: 'var(--font-family)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  outline: 'none',
  resize: 'vertical',
}

function BotaoPontuacao({ opcao, selecionado, disabled, onClick }) {
  const cores = {
    danger:  { bg: 'var(--status-danger-bg)',  border: 'var(--status-danger-border)',  text: 'var(--status-danger-text)'  },
    warning: { bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)', text: 'var(--status-warning-text)' },
    success: { bg: 'var(--status-success-bg)', border: 'var(--status-success-border)', text: 'var(--status-success-text)' },
  }
  const c = cores[opcao.variant]
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: '1 1 140px',
        minHeight: '56px',
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        border: `2px solid ${selecionado ? c.border : 'var(--border-default)'}`,
        background: selecionado ? c.bg : 'var(--bg-surface)',
        color: selecionado ? c.text : 'var(--text-secondary)',
        fontFamily: 'var(--font-family)',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.02em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !selecionado ? 0.5 : 1,
        transition: `all var(--motion-normal)`,
      }}
    >
      {opcao.valor} — {opcao.label}
    </button>
  )
}

function ItemQuestao({ item, resposta, disabled, onPontuacao, onObservacoes }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-family)', marginBottom: '2px' }}>
        {item.label}
      </p>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)', marginBottom: '10px' }}>
        {item.descricao}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
        {OPCOES_PONTUACAO.map(op => (
          <BotaoPontuacao
            key={op.valor}
            opcao={op}
            selecionado={resposta?.pontuacao === op.valor}
            disabled={disabled}
            onClick={() => onPontuacao(op.valor)}
          />
        ))}
      </div>
      {disabled && (
        <p style={{ fontSize: '11px', color: 'var(--brand-primary)', fontFamily: 'var(--font-family)', marginBottom: '8px' }}>
          Pontuação automática — local marcado como estritamente térreo.
        </p>
      )}
      <textarea
        placeholder="Observações / evidências (opcional)"
        value={resposta?.observacoes || ''}
        onChange={e => onObservacoes(e.target.value)}
        style={textareaStyle}
      />
    </div>
  )
}

export default function VisitaInLocoForm({ showToast }) {
  const [cabecalho, setCabecalho] = useState(cabecalhoInicial)
  const [respostas, setRespostas] = useState({})
  const [salvando, setSalvando] = useState(null) // 'rascunho' | 'enviada' | null
  const [tentouEnviar, setTentouEnviar] = useState(false)

  const calculo = calcularPontuacao(respostas)
  const completo = validarRespostasCompletas(respostas)

  function atualizarCabecalho(campo, valor) {
    setCabecalho(c => {
      const novo = { ...c, [campo]: valor }
      if (campo === 'data_visita') novo.semestre_referencia = calcularSemestre(valor)
      return novo
    })
  }

  function alternarTerreo(checked) {
    setCabecalho(c => ({ ...c, local_terreo: checked }))
    setRespostas(r => ({
      ...r,
      item_2_3: checked
        ? { pontuacao: 2, observacoes: r.item_2_3?.observacoes || '' }
        : { pontuacao: undefined, observacoes: r.item_2_3?.observacoes || '' },
    }))
  }

  function setPontuacao(itemId, valor) {
    setRespostas(r => ({ ...r, [itemId]: { ...r[itemId], pontuacao: valor } }))
  }

  function setObservacoes(itemId, texto) {
    setRespostas(r => ({ ...r, [itemId]: { ...r[itemId], observacoes: texto } }))
  }

  function resetarFormulario() {
    setCabecalho(cabecalhoInicial())
    setRespostas({})
    setTentouEnviar(false)
  }

  async function handleSalvar(status) {
    if (!cabecalho.municipio || !cabecalho.nome_local || !cabecalho.responsavel_visita || !cabecalho.representante_osc) {
      setTentouEnviar(true)
      showToast?.('Preencha os campos obrigatórios do cabeçalho antes de salvar.')
      return
    }
    if (status === 'enviada' && !completo) {
      setTentouEnviar(true)
      showToast?.('Responda todos os 21 itens antes de enviar a visita.')
      return
    }

    setSalvando(status)
    try {
      await salvarVisita(
        { ...cabecalho, respostas },
        { status, uid: auth.currentUser?.uid, email: auth.currentUser?.email }
      )
      showToast?.(status === 'enviada' ? 'Visita enviada com sucesso!' : 'Rascunho salvo com sucesso!')
      resetarFormulario()
    } catch (e) {
      showToast?.('Erro ao salvar: ' + e.message)
    } finally {
      setSalvando(null)
    }
  }

  return (
    <div style={{ paddingBottom: '96px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 700, lineHeight: '32px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', letterSpacing: '-0.01em' }}>
          Formulário de Visita In Loco
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-family)' }}>
          Fiscalização de cursos teóricos de aprendizagem — preenchimento em campo
        </p>
      </div>

      {/* ── Cabeçalho de identificação ── */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <Select label="Município *" value={cabecalho.municipio} onChange={e => atualizarCabecalho('municipio', e.target.value)}>
            <option value="">Selecione…</option>
            {MUNICIPIOS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input label="Nome do local *" value={cabecalho.nome_local} onChange={e => atualizarCabecalho('nome_local', e.target.value)} placeholder="OSC / unidade de ensino" />
          <Input label="Data da visita *" type="date" value={cabecalho.data_visita} onChange={e => atualizarCabecalho('data_visita', e.target.value)} />
          <Input label="Hora da visita *" type="time" value={cabecalho.hora_visita} onChange={e => atualizarCabecalho('hora_visita', e.target.value)} />
          <Input label="Responsável pela visita *" value={cabecalho.responsavel_visita} onChange={e => atualizarCabecalho('responsavel_visita', e.target.value)} placeholder="Nome do(a) fiscal" />
          <Input label="Representante da OSC *" value={cabecalho.representante_osc} onChange={e => atualizarCabecalho('representante_osc', e.target.value)} placeholder="Nome de quem acompanhou" />
          <Select label="Semestre de referência" value={cabecalho.semestre_referencia} onChange={e => atualizarCabecalho('semestre_referencia', e.target.value)}>
            {opcoesSemestre(cabecalho.semestre_referencia).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', cursor: 'pointer' }}>
          <input type="checkbox" checked={cabecalho.local_terreo} onChange={e => alternarTerreo(e.target.checked)} style={{ width: '18px', height: '18px' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-family)' }}>
            Local é estritamente térreo (marca automaticamente o item 2.3)
          </span>
        </label>

        {tentouEnviar && (!cabecalho.municipio || !cabecalho.nome_local || !cabecalho.responsavel_visita || !cabecalho.representante_osc) && (
          <p style={{ fontSize: '12px', color: 'var(--status-danger-text)', marginTop: '10px', fontFamily: 'var(--font-family)' }}>
            Preencha todos os campos marcados com * antes de continuar.
          </p>
        )}
      </div>

      {/* ── Blocos de avaliação ── */}
      {BLOCOS.map(bloco => {
        const pontosBloco = bloco.itens.reduce((s, item) => s + (respostas[item.id]?.pontuacao ?? 0), 0)
        return (
          <div key={bloco.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
                {bloco.titulo}
              </h3>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-family)' }}>
                {pontosBloco} / {bloco.maxPontos} pts
              </span>
            </div>
            {bloco.itens.map(item => (
              <ItemQuestao
                key={item.id}
                item={item}
                resposta={respostas[item.id]}
                disabled={item.id === 'item_2_3' && cabecalho.local_terreo}
                onPontuacao={valor => setPontuacao(item.id, valor)}
                onObservacoes={texto => setObservacoes(item.id, texto)}
              />
            ))}
          </div>
        )
      })}

      {tentouEnviar && !completo && (
        <p style={{ fontSize: '13px', color: 'var(--status-danger-text)', fontFamily: 'var(--font-family)', marginBottom: '16px' }}>
          Ainda faltam itens sem resposta — não é possível enviar a visita.
        </p>
      )}

      {/* ── Barra de totalizador + ações, fixa no rodapé ── */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        padding: '16px 20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
      }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-family)' }}>
            Pontuação total
          </p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-family)' }}>
            {calculo.pontuacaoTotal} / {PONTUACAO_MAXIMA} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>({calculo.icl.toFixed(1)}%)</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => handleSalvar('rascunho')} loading={salvando === 'rascunho'} disabled={salvando !== null}>
            Salvar Rascunho
          </Button>
          <Button variant="primary" onClick={() => handleSalvar('enviada')} loading={salvando === 'enviada'} disabled={salvando !== null}>
            Enviar Visita
          </Button>
        </div>
      </div>
    </div>
  )
}
