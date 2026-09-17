import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { MonitoringNavigation, NavEntry } from './MonitoringNavigation';
import { UserManagement } from './UserManagement';
import RelatorioFinal from './RelatorioFinal';
import Frequencia from '../pages/monitor/Frequencia';
import Alcance from '../pages/monitor/Alcance';
import VisitaInLocoForm from '../pages/monitor/VisitaInLocoForm';
import VisitaInLocoDashboard from '../pages/monitor/VisitaInLocoDashboard';
import Formulario30DiasForm from '../pages/monitor/Formulario30DiasForm';
import Painel30Dias from '../pages/monitor/Painel30Dias';

type MetasTab = 'relatorio' | 'frequencia' | 'alcance' | 'eixo3' | 'eixo4' | 'formulario30dias' | 'painel30dias' | 'gestao';

interface MonitoramentoAvaliacaoProps {
  isAdmin: boolean;
  canAccessRelatorio: boolean;
  canAccessFrequencia: boolean;
  canAccessAlcance: boolean;
  canAccessEixo3: boolean;
  canAccessEixo4: boolean;
  canAccessFormulario30Dias: boolean;
  canAccessPainel30Dias: boolean;
  currentUserUid: string;
  onGoHome: () => void;
  onSignOut: () => void;
  showToast: (message: string) => void;
}

type MonitoringLeaf = { key: MetasTab; label: string; can: (p: MonitoramentoAvaliacaoProps) => boolean };
type MonitoringNavConfigEntry =
  | { type: 'group'; label: string; items: MonitoringLeaf[] }
  | ({ type: 'direct' } & MonitoringLeaf);

// Fonte única de configuração da navegação: rótulo, permissão e
// agrupamento vivem juntos aqui — nada disso é repetido em outro lugar.
// As chaves (frequencia, alcance, eixo3...) continuam as mesmas de
// sempre; só a apresentação passou a ser hierárquica.
const MONITORING_NAV: MonitoringNavConfigEntry[] = [
  {
    type: 'group', label: 'Indicadores', items: [
      { key: 'frequencia', label: 'Eixo 1 — Inclusão', can: p => p.isAdmin || p.canAccessFrequencia },
      { key: 'alcance',    label: 'Eixo 2 — Alcance',  can: p => p.isAdmin || p.canAccessAlcance },
    ],
  },
  {
    type: 'group', label: 'Visitas In Loco', items: [
      { key: 'eixo3', label: 'Nova Visita',        can: p => p.isAdmin || p.canAccessEixo3 },
      { key: 'eixo4', label: 'Painel de Visitas',  can: p => p.isAdmin || p.canAccessEixo4 },
    ],
  },
  {
    type: 'group', label: 'Verificação Inicial — 30 Dias', items: [
      { key: 'formulario30dias', label: 'Novo Formulário',       can: p => p.isAdmin || p.canAccessFormulario30Dias },
      { key: 'painel30dias',     label: 'Painel de Resultados',  can: p => p.isAdmin || p.canAccessPainel30Dias },
    ],
  },
  { type: 'direct', key: 'relatorio', label: 'Relatório Final', can: p => p.isAdmin || p.canAccessRelatorio },
];

// Lista achatada de todas as abas — usada só para decidir a primeira aba
// liberada quando as permissões chegam do Firestore.
const TODAS_ABAS: MonitoringLeaf[] = MONITORING_NAV.flatMap(entry => (entry.type === 'group' ? entry.items : [entry]));

export const MonitoramentoAvaliacao: React.FC<MonitoramentoAvaliacaoProps> = (props) => {
  const { isAdmin, onGoHome, onSignOut, showToast, currentUserUid } = props;
  const [activeTab, setActiveTab] = useState<MetasTab | null>(null);

  // Monta as entradas visíveis a partir da fonte única, na ordem definida
  // acima. Um grupo que fica com só 1 item liberado por permissão vira
  // acesso direto, na mesma posição — evita dropdown de item único.
  const entries: NavEntry[] = MONITORING_NAV.reduce<NavEntry[]>((acc, entry) => {
    if (entry.type === 'direct') {
      if (entry.can(props)) acc.push({ type: 'direct', key: entry.key, label: entry.label });
      return acc;
    }
    const visibleItems = entry.items.filter(i => i.can(props)).map(i => ({ key: i.key, label: i.label }));
    if (visibleItems.length === 0) return acc;
    if (visibleItems.length === 1) acc.push({ type: 'direct', key: visibleItems[0].key, label: visibleItems[0].label });
    else acc.push({ type: 'group', label: entry.label, items: visibleItems });
    return acc;
  }, []);

  // Seleciona a primeira aba liberada assim que as permissões chegam do
  // Firestore (chegam de forma assíncrona, depois do primeiro render).
  // Só decide uma vez — não atropela a navegação manual do usuário.
  useEffect(() => {
    if (activeTab !== null) return;
    const first = TODAS_ABAS.find(t => t.can(props));
    if (first) setActiveTab(first.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isAdmin, props.canAccessRelatorio, props.canAccessFrequencia, props.canAccessAlcance, props.canAccessEixo3, props.canAccessEixo4, props.canAccessFormulario30Dias, props.canAccessPainel30Dias]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header
        isAdmin={isAdmin}
        showItensButton={false}
        showExportButton={false}
        onGoHome={onGoHome}
        onNavigateItens={() => {}}
        onNavigateUsuarios={() => setActiveTab('gestao')}
        onExportCSV={() => {}}
        onSignOut={onSignOut}
      />

      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Escondida em Usuários: é página de gestão do app, sem lugar
              no fluxo de navegação normal — acesso só pelo Header. */}
          {activeTab !== 'gestao' && (
            <div className="mb-8">
              <MonitoringNavigation
                entries={entries}
                activeKey={activeTab}
                onSelect={key => setActiveTab(key as MetasTab)}
              />
            </div>
          )}

          {!activeTab && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">Acesso restrito</h2>
              <p className="text-slate-400 text-sm">Nenhuma seção desta dimensão foi liberada para o seu usuário ainda.</p>
            </div>
          )}

          {activeTab === 'frequencia' && <Frequencia />}
          {activeTab === 'alcance' && <Alcance />}
          {activeTab === 'eixo3' && <VisitaInLocoForm showToast={showToast} />}
          {activeTab === 'eixo4' && <VisitaInLocoDashboard />}
          {activeTab === 'formulario30dias' && <Formulario30DiasForm showToast={showToast} />}
          {activeTab === 'painel30dias' && <Painel30Dias />}
          {activeTab === 'relatorio' && <RelatorioFinal isAdmin={isAdmin} showToast={showToast} />}
          {activeTab === 'gestao' && isAdmin && <UserManagement currentUserUid={currentUserUid} />}
        </div>
      </div>
    </div>
  );
};
