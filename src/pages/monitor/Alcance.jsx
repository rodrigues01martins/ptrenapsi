import { useState, useEffect, useRef } from 'react'
import { buscarPeriodos, buscarDadosPeriodo } from '../../services/firestoreService'
import { enriquecerDados, formatarPeriodo } from '../../services/csvService'
import KpiCard from '../../components/monitor/ui/KpiCard'
import Loader from '../../components/monitor/ui/Loader'
import EmptyState from '../../components/monitor/ui/EmptyState'
import { Select } from '../../components/monitor/ui/Input'

const SvgIcon = ({ path, size = 28 }) => (
  <svg width={size} height={size} viewBox="0 -960 960 960" fill="var(--brand-primary)">
    <path d={path} />
  </svg>
)

const ICONS = {
  map:   'M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Z',
  check: 'M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z',
}

// Coordenadas dos 244 municípios de Goiás
const COORDS_GOIAS = {
  'ABADIA DE GOIÁS': [-16.7572, -49.4414],
  'ABADIÂNIA': [-16.1975, -48.7061],
  'ACREÚNA': [-17.3939, -50.3789],
  'ADELÂNDIA': [-16.3489, -50.1597],
  'ÁGUA FRIA DE GOIÁS': [-15.7522, -47.7761],
  'ÁGUA LIMPA': [-17.7814, -48.9161],
  'ÁGUAS LINDAS DE GOIÁS': [-15.7428, -48.2814],
  'ALEXÂNIA': [-16.0789, -48.5111],
  'ALOÂNDIA': [-17.7356, -49.4728],
  'ALTO HORIZONTE': [-14.1917, -49.3358],
  'ALTO PARAÍSO DE GOIÁS': [-14.1322, -47.5089],
  'ALVORADA DO NORTE': [-14.4814, -46.4897],
  'AMARALINA': [-13.9294, -46.7711],
  'AMERICANO DO BRASIL': [-16.2547, -50.3317],
  'AMORINÓPOLIS': [-16.6239, -51.0817],
  'ANÁPOLIS': [-16.3281, -48.9528],
  'ANHANGUERA': [-18.3219, -48.1311],
  'ANICUNS': [-16.4628, -49.9589],
  'APARECIDA DE GOIÂNIA': [-16.8232, -49.2438],
  'APARECIDA DO RIO DOCE': [-18.3131, -51.1997],
  'APORÉ': [-18.9608, -51.9222],
  'ARAÇU': [-16.4489, -49.8286],
  'ARAGARÇAS': [-15.8997, -52.2411],
  'ARAGOIÂNIA': [-16.9194, -49.4397],
  'ARAGUAPAZ': [-15.0789, -50.6422],
  'ARENÓPOLIS': [-16.3917, -51.5531],
  'ARUANÃ': [-14.9161, -51.0794],
  'AURILÂNDIA': [-16.5117, -50.4708],
  'AVELINÓPOLIS': [-16.4661, -49.8969],
  'BALIZA': [-16.1917, -52.5328],
  'BARRO ALTO': [-14.9908, -48.9156],
  'BELA VISTA DE GOIÁS': [-16.9731, -48.9528],
  'BOM JARDIM DE GOIÁS': [-16.2011, -52.1731],
  'BOM JESUS DE GOIÁS': [-18.2136, -49.7386],
  'BONFINÓPOLIS': [-16.6897, -49.1269],
  'BONÓPOLIS': [-13.1856, -48.6936],
  'BRAZABRANTES': [-16.5322, -49.4153],
  'BRITÂNIA': [-15.2383, -51.1572],
  'BURITI ALEGRE': [-18.1361, -49.0408],
  'BURITI DE GOIÁS': [-15.9678, -50.4153],
  'BURITINÓPOLIS': [-14.6289, -46.2667],
  'CABECEIRAS': [-15.7994, -46.9244],
  'CACHOEIRA ALTA': [-18.7583, -50.9444],
  'CACHOEIRA DE GOIÁS': [-16.6511, -50.6533],
  'CACHOEIRA DOURADA': [-18.4861, -49.4797],
  'CAÇU': [-18.5578, -51.1278],
  'CAIAPÔNIA': [-16.9514, -51.8122],
  'CALDAS NOVAS': [-17.7428, -48.6253],
  'CALDAZINHA': [-16.7044, -48.9036],
  'CAMPESTRE DE GOIÁS': [-17.5339, -49.2958],
  'CAMPINAÇU': [-13.8172, -48.5861],
  'CAMPINORTE': [-14.3144, -49.1461],
  'CAMPO ALEGRE DE GOIÁS': [-17.6628, -47.7753],
  'CAMPO LIMPO DE GOIÁS': [-16.3303, -49.5381],
  'CAMPOS BELOS': [-13.0317, -46.7711],
  'CAMPOS VERDES': [-14.2411, -49.6628],
  'CARMO DO RIO VERDE': [-15.3494, -49.7039],
  'CASTELÂNDIA': [-17.8072, -50.2453],
  'CATALÃO': [-18.1661, -47.9461],
  'CATURAÍ': [-16.4656, -49.6917],
  'CAVALCANTE': [-13.7978, -47.4578],
  'CERES': [-15.3067, -49.5964],
  'CEZARINA': [-16.9578, -49.8747],
  'CHAPADÃO DO CÉU': [-18.4044, -52.5169],
  'CIDADE OCIDENTAL': [-16.0797, -47.9236],
  'COCALZINHO DE GOIÁS': [-15.7961, -48.7747],
  'COLINAS DO SUL': [-14.1344, -48.0439],
  'CÓRREGO DO OURO': [-16.3161, -50.5711],
  'CORUMBÁ DE GOIÁS': [-15.9197, -48.8092],
  'CORUMBAÍBA': [-18.1317, -48.5608],
  'CRISTALINA': [-16.7683, -47.6147],
  'CRISTIANÓPOLIS': [-17.1961, -48.7083],
  'CRIXÁS': [-14.5478, -49.9731],
  'CROMÍNIA': [-17.3389, -49.4097],
  'CUMARI': [-18.2997, -48.1669],
  'DAMIANÓPOLIS': [-14.4994, -46.1728],
  'DAMOLÂNDIA': [-16.2464, -49.6597],
  'DAVINÓPOLIS': [-18.1828, -47.9869],
  'DIORAMA': [-16.2347, -51.2467],
  'DIVINÓPOLIS DE GOIÁS': [-13.5894, -46.3978],
  'DOVERLÂNDIA': [-17.2947, -52.3211],
  'EDEALINA': [-17.3508, -49.7258],
  'EDÉIA': [-17.3394, -49.9289],
  'ESTRELA DO NORTE': [-13.8722, -49.0794],
  'FAINA': [-15.4489, -50.3919],
  'FAZENDA NOVA': [-16.1817, -50.7789],
  'FIRMINÓPOLIS': [-16.5828, -50.3181],
  'FLORES DE GOIÁS': [-14.4533, -47.0769],
  'FORMOSA': [-15.5367, -47.3339],
  'FORMOSO': [-13.6347, -48.9039],
  'GAMELEIRA DE GOIÁS': [-16.9961, -48.5808],
  'GOIANÁPOLIS': [-16.5008, -49.1178],
  'GOIANDIRA': [-18.4219, -48.0803],
  'GOIANÉSIA': [-15.3197, -49.1167],
  'GOIÂNIA': [-16.6864, -49.2643],
  'GOIANIRA': [-16.4942, -49.4275],
  'GOIÁS': [-15.9317, -50.1408],
  'GOIATUBA': [-18.0106, -49.3567],
  'GOUVELÂNDIA': [-18.6022, -50.1047],
  'GUAPÓ': [-16.8317, -49.5292],
  'GUARAÍTA': [-15.5022, -50.1736],
  'GUARANI DE GOIÁS': [-13.9578, -46.5033],
  'GUARINOS': [-14.7494, -49.3003],
  'HEITORAÍ': [-15.6828, -49.9736],
  'HIDROLÂNDIA': [-16.9703, -49.5878],
  'HIDROLINA': [-14.7342, -49.5878],
  'IACIARA': [-14.1036, -46.6372],
  'INACIOLÂNDIA': [-18.5289, -50.6047],
  'INDIARA': [-17.1422, -49.9869],
  'INHUMAS': [-16.3578, -49.4917],
  'IPAMERI': [-17.7197, -48.1597],
  'IPIRANGA DE GOIÁS': [-15.1183, -50.2914],
  'IPORÁ': [-16.4403, -51.1178],
  'ISRAELÂNDIA': [-16.4072, -50.8239],
  'ITABERAÍ': [-16.0228, -49.8044],
  'ITAGUARI': [-15.9572, -49.6339],
  'ITAGUARU': [-15.7622, -49.6375],
  'ITAJÁ': [-19.0736, -51.5542],
  'ITAPACI': [-14.9503, -49.5503],
  'ITAPIRAPUÃ': [-15.8228, -50.6208],
  'ITAPURANGA': [-15.5594, -49.9497],
  'ITARUMÃ': [-18.7583, -51.3528],
  'ITAUÇU': [-16.2097, -49.6142],
  'ITUMBIARA': [-18.4186, -49.2158],
  'IVOLÂNDIA': [-16.5458, -50.8447],
  'JANDAIA': [-17.0939, -50.1317],
  'JARAGUÁ': [-15.7567, -49.3358],
  'JATAÍ': [-17.8803, -51.7147],
  'JAUPACI': [-16.1822, -50.9606],
  'JESÚPOLIS': [-15.8461, -49.3683],
  'JOVIÂNIA': [-17.8189, -49.6261],
  'JUSSARA': [-15.8717, -51.3378],
  'LAGOA SANTA': [-17.9628, -50.3197],
  'LEOPOLDO DE BULHÕES': [-16.6208, -48.7447],
  'LUZIÂNIA': [-16.2522, -47.9508],
  'MAIRIPOTABA': [-17.2861, -49.4839],
  'MAMBAÍ': [-14.4861, -46.1158],
  'MARA ROSA': [-14.0197, -49.1764],
  'MARZAGÃO': [-17.9481, -49.2011],
  'MATRINCHÃ': [-15.1572, -50.7472],
  'MAURILÂNDIA': [-17.9789, -50.3486],
  'MIMOSO DE GOIÁS': [-15.1689, -48.1578],
  'MINAÇU': [-13.5322, -48.2219],
  'MINEIROS': [-17.5694, -52.5536],
  'MOIPORÁ': [-16.3917, -50.9911],
  'MONTE ALEGRE DE GOIÁS': [-13.2519, -46.8914],
  'MONTES CLAROS DE GOIÁS': [-16.0069, -51.3839],
  'MONTIVIDIU': [-17.4428, -51.1736],
  'MONTIVIDIU DO NORTE': [-13.2781, -48.8011],
  'MORRINHOS': [-17.7317, -49.1044],
  'MOSSÂMEDES': [-16.1308, -50.2014],
  'MOZARLÂNDIA': [-14.7483, -50.5758],
  'MUNDO NOVO': [-15.6169, -50.2719],
  'MUTUNÓPOLIS': [-13.7356, -49.2792],
  'NAZÁRIO': [-16.5778, -49.8825],
  'NERÓPOLIS': [-16.4006, -49.2161],
  'NIQUELÂNDIA': [-14.4728, -48.4586],
  'NOVA AMÉRICA': [-15.0522, -49.9025],
  'NOVA AURORA': [-16.5317, -50.6242],
  'NOVA CRIXÁS': [-14.0897, -50.3469],
  'NOVA GLÓRIA': [-15.1169, -49.5769],
  'NOVA IGUAÇU DE GOIÁS': [-13.6119, -49.1386],
  'NOVA ROMA': [-13.6214, -46.9308],
  'NOVA VENEZA': [-16.3253, -49.3111],
  'NOVO BRASIL': [-16.0044, -50.8908],
  'NOVO GAMA': [-16.0617, -48.0378],
  'NOVO PLANALTO': [-13.3211, -49.5722],
  'ORIZONA': [-17.0378, -48.2961],
  'OURO VERDE DE GOIÁS': [-16.2233, -49.8089],
  'OUVIDOR': [-18.2322, -47.8564],
  'PADRE BERNARDO': [-15.1706, -48.2883],
  'PALESTINA DE GOIÁS': [-16.7061, -52.0297],
  'PALMEIRAS DE GOIÁS': [-16.8058, -49.9239],
  'PALMELO': [-17.3317, -48.4617],
  'PALMINÓPOLIS': [-16.7556, -50.1711],
  'PANAMÁ': [-18.1994, -49.5097],
  'PARANAIGUARA': [-18.9122, -51.1872],
  'PARAÚNA': [-16.9483, -50.4489],
  'PEROLÂNDIA': [-17.5344, -52.1378],
  'PETROLINA DE GOIÁS': [-16.0939, -49.3411],
  'PILAR DE GOIÁS': [-14.7683, -49.5761],
  'PIRACANJUBA': [-17.3028, -49.0178],
  'PIRANHAS': [-16.4261, -51.8244],
  'PIRENÓPOLIS': [-15.8528, -48.9578],
  'PIRES DO RIO': [-17.2994, -48.2836],
  'PLANALTINA': [-15.4533, -47.6142],
  'PONTALINA': [-17.5208, -49.4786],
  'PORANGATU': [-13.4406, -49.1503],
  'PORTELÂNDIA': [-17.3611, -52.6711],
  'POSSE': [-14.0939, -46.3678],
  'PROFESSOR JAMIL': [-17.2161, -49.4628],
  'QUIRINÓPOLIS': [-18.4494, -50.4503],
  'RIALMA': [-15.3128, -49.5808],
  'RIANÁPOLIS': [-15.3028, -49.5194],
  'RIO QUENTE': [-17.7800, -48.7611],
  'RIO VERDE': [-17.7983, -50.9278],
  'RUBIATABA': [-15.1544, -49.8075],
  'SANCLERLÂNDIA': [-16.2039, -50.3017],
  'SANTA BÁRBARA DE GOIÁS': [-16.5611, -49.7264],
  'SANTA CRUZ DE GOIÁS': [-17.3219, -48.3578],
  'SANTA FÉ DE GOIÁS': [-15.5397, -50.5461],
  'SANTA HELENA DE GOIÁS': [-17.8133, -50.5967],
  'SANTA ISABEL': [-16.4983, -49.3258],
  'SANTA RITA DO ARAGUAIA': [-17.3283, -53.1983],
  'SANTA RITA DO NOVO DESTINO': [-15.0917, -49.3664],
  'SANTA ROSA DE GOIÁS': [-16.0711, -49.4906],
  'SANTA TEREZA DE GOIÁS': [-13.7167, -49.2011],
  'SANTA TEREZINHA DE GOIÁS': [-14.4344, -49.6969],
  'SANTO ANTÔNIO DA BARRA': [-17.9578, -51.2461],
  'SANTO ANTÔNIO DE GOIÁS': [-16.4789, -49.3028],
  'SANTO ANTÔNIO DO DESCOBERTO': [-15.9428, -48.2583],
  'SÃO DOMINGOS': [-13.4006, -46.3256],
  'SÃO FRANCISCO DE GOIÁS': [-16.2167, -49.2897],
  'SÃO JOÃO DA PARAÚNA': [-16.9406, -50.3894],
  "SÃO JOÃO D'ALIANÇA": [-14.7064, -47.5194],
  'SÃO LUÍS DE MONTES BELOS': [-16.5261, -50.3722],
  'SÃO LUIZ DO NORTE': [-15.0281, -49.3294],
  'SÃO MIGUEL DO ARAGUAIA': [-13.2764, -50.1639],
  'SÃO MIGUEL DO PASSA QUATRO': [-17.4622, -48.3928],
  'SÃO PATRÍCIO': [-15.3033, -49.8150],
  'SÃO SIMÃO': [-18.9942, -50.5503],
  'SENADOR CANEDO': [-16.7067, -49.0928],
  'SERRANÓPOLIS': [-18.3000, -52.0006],
  'SILVÂNIA': [-16.6614, -48.6089],
  'SIMOLÂNDIA': [-14.5014, -46.1236],
  'TAQUARAL DE GOIÁS': [-16.0644, -49.5975],
  'TERESINA DE GOIÁS': [-13.7083, -47.2794],
  'TEREZÓPOLIS DE GOIÁS': [-16.6428, -49.0931],
  'TRÊS RANCHOS': [-18.3658, -47.7894],
  'TRINDADE': [-16.6503, -49.4878],
  'TROMBAS': [-13.5361, -48.7533],
  'TURVÂNIA': [-16.6053, -50.1297],
  'TURVELÂNDIA': [-17.8469, -50.1197],
  'UIRAPURU': [-14.7803, -50.2625],
  'URUAÇU': [-14.5242, -49.1394],
  'URUANA': [-15.5017, -49.6861],
  'URUTAÍ': [-17.4664, -48.1961],
  'VALPARAÍSO DE GOIÁS': [-16.0764, -47.9922],
  'VARJÃO': [-17.0289, -49.6311],
  'VIANÓPOLIS': [-16.7469, -48.5153],
  'VICENTINÓPOLIS': [-17.8303, -49.8011],
  'VILA BOA': [-14.9400, -46.5261],
  'VILA PROPÍCIO': [-15.3658, -48.9258],
}

function MapaAprendizes({ dadosEnriquecidos }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!dadosEnriquecidos.length) return

    function inicializarMapa() {
      if (!mapRef.current || mapInstanceRef.current) return
      const L = window.L

      // Agrupa por cidade normalizando o nome
      const cidadeMap = {}
      dadosEnriquecidos.forEach(r => {
        const cidade = (r.cidade || '').toUpperCase().trim()
        if (cidade) cidadeMap[cidade] = (cidadeMap[cidade] || 0) + 1
      })

      const map = L.map(mapRef.current, { zoomControl: true }).setView([-16.0, -49.5], 7)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      const counts = Object.values(cidadeMap)
      const maxCount = counts.length ? Math.max(...counts) : 1
      const minCount = counts.length ? Math.min(...counts) : 1

      let plotados = 0
      let naoEncontrados = []

     Object.entries(cidadeMap).forEach(([cidade, count]) => {
  const coords = COORDS_GOIAS[cidade]
  if (!coords) {
    naoEncontrados.push(cidade)
    return
  }

  const ratio = maxCount > minCount
    ? (count - minCount) / (maxCount - minCount)
    : 1
  const radius = 6 + ratio * 34
  const opacity = 0.4 + ratio * 0.5

  const circle = L.circleMarker(coords, {
    radius,
    fillColor: '#356859',
    color: '#2a5247',
    weight: 1.5,
    opacity: 1,
    fillOpacity: opacity,
  }).addTo(map)

  // Tooltip permanente com nome e quantidade
  circle.bindTooltip(`
    <div style="font-family: Inter, sans-serif; padding: 4px 2px;">
      <strong style="color: #356859; font-size: 13px; display: block;">${cidade}</strong>
      <span style="font-size: 12px; color: #4B5563;">${count} aprendiz${count !== 1 ? 'es' : ''}</span>
    </div>
  `, {
    sticky: true,
    opacity: 0.95,
    className: 'mapa-tooltip',
  })

  // Popup ao clicar com mais detalhes
  circle.bindPopup(`
    <div style="font-family: Inter, sans-serif; min-width: 180px; padding: 4px;">
      <strong style="color: #356859; font-size: 14px; display: block; margin-bottom: 6px;">${cidade}</strong>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4B5563;">
        <span>Aprendizes</span>
        <strong style="color: #356859;">${count}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #4B5563; margin-top: 4px;">
        <span>% do total</span>
        <strong style="color: #356859;">${((count / dadosEnriquecidos.length) * 100).toFixed(1)}%</strong>
      </div>
    </div>
  `)

  // Efeito hover
  circle.on('mouseover', function () {
    this.setStyle({
      fillColor: '#FD5523',
      color: '#c44019',
      weight: 2.5,
      fillOpacity: Math.min(opacity + 0.2, 1),
      radius: radius + 4,
    })
    this.setRadius(radius + 4)
    this.openTooltip()
  })

  circle.on('mouseout', function () {
    this.setStyle({
      fillColor: '#356859',
      color: '#2a5247',
      weight: 1.5,
      fillOpacity: opacity,
    })
    this.setRadius(radius)
  })

  plotados++
})

      if (naoEncontrados.length) {
        console.warn('Municípios não encontrados no mapa:', naoEncontrados)
      }
    }

    if (window.L) {
      inicializarMapa()
    } else {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = inicializarMapa
      document.head.appendChild(script)
    }
// Injeta estilo do tooltip uma única vez
if (!document.getElementById('mapa-tooltip-style')) {
  const style = document.createElement('style')
  style.id = 'mapa-tooltip-style'
  style.textContent = `
    .mapa-tooltip {
      background: white;
      border: 1px solid #B9E4C9;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 8px 12px;
      pointer-events: none;
    }
    .mapa-tooltip::before {
      display: none;
    }
    .leaflet-tooltip-bottom.mapa-tooltip::before {
      display: none;
    }
  `
  document.head.appendChild(style)
}
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [dadosEnriquecidos])

  return (
    <div ref={mapRef} style={{ height: '480px', width: '100%', borderRadius: '0 0 var(--radius-md) var(--radius-md)', zIndex: 1 }} />
  )
}

export default function Alcance() {
  const [periodos, setPeriodos] = useState([])
  const [periodoSel, setPeriodoSel] = useState('')
  const [dadosEnriquecidos, setDadosEnriquecidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarPeriodos().then(ps => { setPeriodos(ps); if (ps.length) setPeriodoSel(ps[0].periodo) })
  }, [])

  useEffect(() => {
    if (!periodoSel) return
    setLoading(true)
    buscarDadosPeriodo(periodoSel).then(dados => {
      setDadosEnriquecidos(enriquecerDados(dados))
      setLoading(false)
    })
  }, [periodoSel])

  if (loading) return <Loader message="Carregando dados territoriais..." />
  if (!dadosEnriquecidos.length) return <EmptyState title="Nenhum dado encontrado" description="Faça upload de um CSV na aba Upload primeiro." />

  const TOTAL_MUNICIPIOS_GO = 246

  const municipiosAtivos = new Set(
    dadosEnriquecidos.map(r => (r.cidade || '').toUpperCase().trim()).filter(Boolean)
  )
  const num_municipios = municipiosAtivos.size
  const ind_territorial = (num_municipios / TOTAL_MUNICIPIOS_GO) * 100

  const cidadeMap = {}
  dadosEnriquecidos.forEach(r => {
    const c = r.cidade || 'Não informado'
    cidadeMap[c] = (cidadeMap[c] || 0) + 1
  })
  const top10 = Object.entries(cidadeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, lineHeight: '32px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', letterSpacing: '-0.01em' }}>
            Eixo 2 — Alcance
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

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiCard icon={<SvgIcon path={ICONS.map} />} label="Municípios Atendidos" value={num_municipios} sub={`de ${TOTAL_MUNICIPIOS_GO} municípios de Goiás`} color="blue" />
        <KpiCard icon={<SvgIcon path={ICONS.check} />} label="Cobertura Territorial" value={`${ind_territorial.toFixed(1)}%`} sub="meta: máxima cobertura dos 246 municípios" color={ind_territorial >= 50 ? 'green' : 'warn'} />
      </div>

      {/* Barra de cobertura */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-family)' }}>
            Dimensão Territorial do Programa
          </p>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-family)' }}>
            {num_municipios} / {TOTAL_MUNICIPIOS_GO} municípios
          </p>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--border-default)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(ind_territorial, 100)}%`, background: 'var(--brand-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease' }} />
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-family)' }}>
          Fórmula: (nº municípios com aprendiz ÷ 246) × 100 = {ind_territorial.toFixed(1)}%
        </p>
      </div>

      {/* Mapa */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
            Distribuição Territorial dos Aprendizes — Goiás
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-family)' }}>
            Círculo proporcional ao número de aprendizes · clique para detalhes
          </span>
        </div>
        <MapaAprendizes dadosEnriquecidos={dadosEnriquecidos} key={periodoSel} />
      </div>

      {/* Top 10 */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-subtle)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
            Top 10 — Municípios com Mais Aprendizes
          </h3>
        </div>
        <div style={{ padding: '8px 0' }}>
          {top10.map(([cidade, count], i) => {
            const max = top10[0][1]
            const pct = (count / max) * 100
            return (
              <div key={cidade}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', transition: 'background var(--motion-normal)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', width: '20px', textAlign: 'right', fontFamily: 'var(--font-family)' }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>{cidade}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-family)' }}>{count}</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'var(--border-default)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand-primary)', borderRadius: 'var(--radius-full)' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
