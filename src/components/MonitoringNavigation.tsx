import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Navegação hierárquica do módulo Monitoramento e Avaliação — grupos com
// dropdown (Indicadores, Visitas In Loco, Verificação Inicial — 30 Dias)
// e acessos diretos (Relatório Final, ou um grupo que ficou com só 1 item
// visível por permissão). Puramente apresentacional: recebe os dados já
// filtrados por permissão, não conhece o modelo de props do módulo.

export type NavEntry =
  | { type: 'group'; label: string; items: { key: string; label: string }[] }
  | { type: 'direct'; key: string; label: string };

interface MonitoringNavigationProps {
  entries: NavEntry[];
  activeKey: string | null;
  onSelect: (key: string) => void;
}

// Mesmas classes já usadas na barra de abas original — preserva a
// identidade visual (teal ativo, borda teal inativo) sem reinventar.
const triggerBase = 'px-6 py-2.5 rounded-xl font-bold transition-all inline-flex items-center gap-1.5 whitespace-nowrap';
const triggerActive = 'bg-[#007770] text-white shadow-lg';
const triggerInactive = 'bg-white text-[#007770] border';

function isGroupActive(entry: NavEntry, activeKey: string | null): boolean {
  if (entry.type === 'direct') return entry.key === activeKey;
  return entry.items.some(i => i.key === activeKey);
}

export const MonitoringNavigation: React.FC<MonitoringNavigationProps> = ({ entries, activeKey, onSelect }) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openGroup && !mobileOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openGroup, mobileOpen]);

  function handleSelect(key: string) {
    onSelect(key);
    setOpenGroup(null);
    setMobileOpen(false);
  }

  return (
    <nav ref={wrapperRef} aria-label="Navegação de Monitoramento e Avaliação">
      {/* ── Desktop/tablet: grupos lado a lado ── */}
      <div className="hidden md:flex gap-3 flex-wrap relative">
        {entries.map(entry => {
          if (entry.type === 'direct') {
            const active = isGroupActive(entry, activeKey);
            return (
              <button
                key={entry.key}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => handleSelect(entry.key)}
                className={`${triggerBase} ${active ? triggerActive : triggerInactive}`}
              >
                {entry.label}
              </button>
            );
          }

          const active = isGroupActive(entry, activeKey);
          const open = openGroup === entry.label;
          return (
            <div key={entry.label} className="relative">
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpenGroup(o => (o === entry.label ? null : entry.label))}
                className={`${triggerBase} ${active ? triggerActive : triggerInactive}`}
              >
                {entry.label}
                <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2 min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40"
                >
                  {entry.items.map(item => {
                    const itemActive = item.key === activeKey;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="menuitem"
                        aria-current={itemActive ? 'page' : undefined}
                        onClick={() => handleSelect(item.key)}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${
                          itemActive ? 'bg-[#007770]/10 text-[#007770]' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mobile: controle único e compacto ── */}
      <div className="flex md:hidden relative">
        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(o => !o)}
          className={`${triggerBase} w-full justify-between ${triggerInactive}`}
        >
          Monitoramento e Avaliação
          <ChevronDown size={16} className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>
        {mobileOpen && (
          <div
            role="menu"
            className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-40 max-h-[70vh] overflow-y-auto"
          >
            {entries.map(entry => {
              if (entry.type === 'direct') {
                const active = entry.key === activeKey;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    role="menuitem"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => handleSelect(entry.key)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${
                      active ? 'bg-[#007770]/10 text-[#007770]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {entry.label}
                  </button>
                );
              }
              return (
                <div key={entry.label}>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {entry.label}
                  </p>
                  {entry.items.map(item => {
                    const itemActive = item.key === activeKey;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="menuitem"
                        aria-current={itemActive ? 'page' : undefined}
                        onClick={() => handleSelect(item.key)}
                        className={`w-full text-left pl-6 pr-4 py-2.5 text-sm font-semibold transition-colors ${
                          itemActive ? 'bg-[#007770]/10 text-[#007770]' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};
