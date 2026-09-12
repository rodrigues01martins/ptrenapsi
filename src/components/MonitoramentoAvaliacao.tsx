import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { UserManagement } from './UserManagement';
import RelatorioFinal from './RelatorioFinal';
import Frequencia from '../pages/monitor/Frequencia';
import Alcance from '../pages/monitor/Alcance';
import VisitaInLocoForm from '../pages/monitor/VisitaInLocoForm';
import VisitaInLocoDashboard from '../pages/monitor/VisitaInLocoDashboard';

type MetasTab = 'relatorio' | 'frequencia' | 'alcance' | 'eixo3' | 'eixo4' | 'gestao';

interface MonitoramentoAvaliacaoProps {
  isAdmin: boolean;
  canAccessRelatorio: boolean;
  canAccessFrequencia: boolean;
  canAccessAlcance: boolean;
  canAccessEixo3: boolean;
  canAccessEixo4: boolean;
  currentUserUid: string;
  onGoHome: () => void;
  onSignOut: () => void;
  showToast: (message: string) => void;
}

const TABS: { key: MetasTab; label: string; can: (p: MonitoramentoAvaliacaoProps) => boolean }[] = [
  { key: 'frequencia', label: 'Eixo 1 — Inclusão',            can: p => p.isAdmin || p.canAccessFrequencia },
  { key: 'alcance',    label: 'Eixo 2 — Alcance',             can: p => p.isAdmin || p.canAccessAlcance },
  { key: 'eixo3',      label: 'Formulário de Visita In Loco', can: p => p.isAdmin || p.canAccessEixo3 },
  { key: 'eixo4',      label: 'Painel Visita in Loco',        can: p => p.isAdmin || p.canAccessEixo4 },
  { key: 'relatorio',  label: 'Relatório Final',              can: p => p.isAdmin || p.canAccessRelatorio },
];

export const MonitoramentoAvaliacao: React.FC<MonitoramentoAvaliacaoProps> = (props) => {
  const { isAdmin, onGoHome, onSignOut, showToast, currentUserUid } = props;
  const [activeTab, setActiveTab] = useState<MetasTab | null>(null);
  const visibleTabs = TABS.filter(t => t.can(props));

  // Seleciona a primeira aba liberada assim que as permissões chegam do
  // Firestore (chegam de forma assíncrona, depois do primeiro render).
  // Só decide uma vez — não atropela a navegação manual do usuário.
  useEffect(() => {
    if (activeTab !== null) return;
    const first = TABS.find(t => t.can(props));
    if (first) setActiveTab(first.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isAdmin, props.canAccessRelatorio, props.canAccessFrequencia, props.canAccessAlcance, props.canAccessEixo3, props.canAccessEixo4]);

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
            <div className="mb-8 flex gap-3 flex-wrap">
              {visibleTabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === t.key ? 'bg-[#007770] text-white shadow-lg' : 'bg-white text-[#007770] border'}`}
                >
                  {t.label}
                </button>
              ))}
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
          {activeTab === 'relatorio' && <RelatorioFinal isAdmin={isAdmin} showToast={showToast} />}
          {activeTab === 'gestao' && isAdmin && <UserManagement currentUserUid={currentUserUid} />}
        </div>
      </div>
    </div>
  );
};
