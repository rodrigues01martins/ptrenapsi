import React from 'react';
import { Home } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  showItensButton: boolean;
  showExportButton: boolean;
  onGoHome: () => void;
  onNavigateItens: () => void;
  onNavigateUsuarios: () => void;
  onExportCSV: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isAdmin, showItensButton, showExportButton, onGoHome, onNavigateItens, onNavigateUsuarios, onExportCSV, onSignOut }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto h-24 px-6 md:px-10 flex items-center justify-between gap-6">

        {/* ── Marcas ── */}
        <div className="flex items-center gap-4 shrink-0">
          <img src="/logo-seds-goias.png" alt="SEDS · Governo de Goiás" className="h-10 w-auto object-contain" />
          <img src="/logo-aprendiz-futuro.png" alt="Aprendiz do Futuro" className="h-10 w-auto object-contain" />
        </div>

        {/* ── Menu ── */}
        <nav className="flex items-center gap-8">
          <button
            onClick={onGoHome}
            title="Voltar para a seleção de dimensão"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-[#007770] transition-colors whitespace-nowrap"
          >
            <Home size={16} />
            Início
          </button>
          {isAdmin && showItensButton && (
            <button
              onClick={onNavigateItens}
              className="text-sm font-medium text-slate-700 hover:text-[#007770] transition-colors whitespace-nowrap"
            >
              Cadastrar Itens
            </button>
          )}
          {isAdmin && (
            <button
              onClick={onNavigateUsuarios}
              className="text-sm font-medium text-slate-700 hover:text-[#007770] transition-colors whitespace-nowrap"
            >
              Usuários
            </button>
          )}
          {showExportButton && (
            <button
              onClick={onExportCSV}
              className="text-sm font-medium text-slate-700 hover:text-[#007770] transition-colors whitespace-nowrap"
            >
              Exportar registros
            </button>
          )}
          <button
            onClick={onSignOut}
            className="bg-[#007770] text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-[#005f59] transition-colors whitespace-nowrap"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
};
