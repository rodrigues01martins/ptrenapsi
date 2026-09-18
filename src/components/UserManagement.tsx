import React, { useEffect, useRef, useState } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Shield, ShieldOff, RefreshCw, Search, ChevronDown, X } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { KpiCard } from './ui/Card';
import { TextInput } from './ui/FormField';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

// Fonte única das permissões — a mesma usada em App.tsx/firestore.rules.
// `group`/`subgroup` são só metadados de apresentação (como a Gestão de
// Usuários organiza visualmente os toggles); não criam perfil nenhum e
// não mudam a chave nem o significado de nenhuma permissão existente.
// `subgroup` em Monitoramento e Avaliação espelha a navegação real do
// módulo (Formulários × Painéis, Item 3) — não é um agrupamento novo.
type PermissionKey =
  | 'canAccessUpload' | 'canAccessGerencial' | 'canAccessRepasse' | 'canAccessHistorico'
  | 'canAccessFrequencia' | 'canAccessAlcance' | 'canAccessEixo3' | 'canAccessEixo4'
  | 'canAccessFormulario30Dias' | 'canAccessPainel30Dias'
  | 'canAccessRelatorio'
  | 'canAccessEntry' | 'canAccessReport';

type AreaKey = 'Apuração Mensal' | 'Monitoramento e Avaliação' | 'Acompanhamento Financeiro';

interface PermissionField {
  key: PermissionKey;
  label: string;
  group: AreaKey;
  subgroup?: 'Formulários' | 'Painéis';
}

const PERMISSION_FIELDS: PermissionField[] = [
  { key: 'canAccessUpload',    label: 'Upload',    group: 'Apuração Mensal' },
  { key: 'canAccessGerencial', label: 'Gerencial', group: 'Apuração Mensal' },
  { key: 'canAccessRepasse',   label: 'Repasse',   group: 'Apuração Mensal' },
  { key: 'canAccessHistorico', label: 'Histórico', group: 'Apuração Mensal' },

  { key: 'canAccessEixo3',             label: 'Visita In Loco',                group: 'Monitoramento e Avaliação', subgroup: 'Formulários' },
  { key: 'canAccessFormulario30Dias',  label: 'Verificação Inicial — 30 Dias', group: 'Monitoramento e Avaliação', subgroup: 'Formulários' },
  { key: 'canAccessRelatorio',         label: 'Relatório Final',               group: 'Monitoramento e Avaliação', subgroup: 'Formulários' },
  { key: 'canAccessFrequencia',        label: 'Eixo 1 — Inclusão',             group: 'Monitoramento e Avaliação', subgroup: 'Painéis' },
  { key: 'canAccessAlcance',           label: 'Eixo 2 — Alcance',              group: 'Monitoramento e Avaliação', subgroup: 'Painéis' },
  { key: 'canAccessEixo4',             label: 'Visitas In Loco',               group: 'Monitoramento e Avaliação', subgroup: 'Painéis' },
  { key: 'canAccessPainel30Dias',      label: 'Verificação Inicial — 30 Dias', group: 'Monitoramento e Avaliação', subgroup: 'Painéis' },

  { key: 'canAccessEntry',  label: 'Novo Lançamento',                       group: 'Acompanhamento Financeiro' },
  { key: 'canAccessReport', label: 'Acompanhar Despesa e Painel Financeiro', group: 'Acompanhamento Financeiro' },
];

const AREA_ORDER: AreaKey[] = ['Apuração Mensal', 'Monitoramento e Avaliação', 'Acompanhamento Financeiro'];

type UserRecord = { uid: string; email: string; displayName?: string; role: string; createdAt?: string } & {
  [K in PermissionKey]: boolean;
};

function contarAtivos(user: UserRecord, campos: PermissionField[]) {
  return campos.filter(f => user[f.key]).length;
}

function areasComAcesso(user: UserRecord): AreaKey[] {
  if (user.role === 'admin') return AREA_ORDER;
  return AREA_ORDER.filter(area => PERMISSION_FIELDS.some(f => f.group === area && user[f.key]));
}

// ============================================================
// MODAL — Gerenciar permissões de um usuário
// ============================================================
interface GerenciarPermissoesProps {
  user: UserRecord;
  isCurrentUser: boolean;
  savingKey: string | null;
  onClose: () => void;
  onTogglePermission: (uid: string, field: PermissionKey, current: boolean) => void;
  onToggleRole: (uid: string, current: string) => void;
}

function GerenciarPermissoesModal({ user, isCurrentUser, savingKey, onClose, onTogglePermission, onToggleRole }: GerenciarPermissoesProps) {
  const previamenteFocado = useRef<Element | null>(null);
  const botaoFecharRef = useRef<HTMLButtonElement>(null);
  const totalAtivos = contarAtivos(user, PERMISSION_FIELDS);

  useEffect(() => {
    previamenteFocado.current = document.activeElement;
    botaoFecharRef.current?.focus();
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      (previamenteFocado.current as HTMLElement | null)?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderToggle(f: PermissionField) {
    const ativo = !!user[f.key];
    const salvando = savingKey === `${user.uid}:${f.key}`;
    return (
      <div key={f.key} className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm text-slate-700">{f.label}</span>
        <button
          onClick={() => onTogglePermission(user.uid, f.key, ativo)}
          disabled={salvando}
          aria-label={`${ativo ? 'Revogar' : 'Permitir'} acesso a ${f.label} para ${user.displayName || user.email}`}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--native-focus)] focus-visible:ring-offset-2 disabled:opacity-60 ${ativo ? 'bg-[var(--native-primary)]' : 'bg-slate-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${ativo ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Gerenciar permissões de ${user.displayName || user.email}`}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-lg max-h-[88vh] rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900">{user.displayName || user.email}</h3>
              {isCurrentUser && <Badge variant="primary">Você</Badge>}
              {user.role === 'admin' && <Badge variant="success" icon={<Shield size={11} />}>Admin</Badge>}
            </div>
            {user.displayName && <p className="text-sm text-slate-400">{user.email}</p>}
            <p className="text-xs text-slate-400 mt-1">
              {user.role === 'admin' ? 'Acesso automático a todas as funcionalidades' : `${totalAtivos} de ${PERMISSION_FIELDS.length} permissões ativas`}
            </p>
          </div>
          <button ref={botaoFecharRef} onClick={onClose} aria-label="Fechar" className="shrink-0 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--native-focus)] rounded-lg p-1">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Função */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Função</p>
              <p className="text-sm text-slate-700 mt-0.5">{user.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onToggleRole(user.uid, user.role)}
              disabled={isCurrentUser}
              title={isCurrentUser ? 'Não é possível alterar sua própria função' : undefined}
            >
              {user.role === 'admin' ? <ShieldOff size={13} /> : <Shield size={13} />}
              {user.role === 'admin' ? 'Tornar usuário comum' : 'Tornar administrador'}
            </Button>
          </div>

          {user.role === 'admin' ? (
            <div className="p-4 rounded-xl bg-[var(--native-primary-light)] border border-[var(--native-primary)]/30 text-sm text-slate-700">
              Administradores têm acesso automático a todas as áreas do sistema — os toggles individuais não têm efeito enquanto a função for Administrador.
            </div>
          ) : (
            AREA_ORDER.map(area => {
              const camposArea = PERMISSION_FIELDS.filter(f => f.group === area);
              const ativosArea = contarAtivos(user, camposArea);
              const subgrupos = [...new Set(camposArea.map(f => f.subgroup).filter(Boolean))] as string[];

              return (
                <details key={area} className="group border border-slate-200 rounded-xl overflow-hidden" open={ativosArea > 0}>
                  <summary className="list-none flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 cursor-pointer select-none [&::-webkit-details-marker]:hidden">
                    <span className="text-sm font-bold text-slate-700">{area}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">{ativosArea} / {camposArea.length}</span>
                      <ChevronDown size={16} className="text-slate-400 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <div className="divide-y divide-slate-100">
                    {subgrupos.length > 0 ? (
                      subgrupos.map(sub => (
                        <div key={sub}>
                          <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{sub}</p>
                          <div className="divide-y divide-slate-100">
                            {camposArea.filter(f => f.subgroup === sub).map(renderToggle)}
                          </div>
                        </div>
                      ))
                    ) : (
                      camposArea.map(renderToggle)
                    )}
                  </div>
                </details>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PÁGINA — lista de usuários
// ============================================================
interface UserManagementProps {
  currentUserUid: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUserUid }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [gerenciando, setGerenciando] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      const data = snap.docs.map(d => {
        const raw = d.data();
        const permissions = PERMISSION_FIELDS.reduce((acc, f) => {
          acc[f.key] = raw[f.key] === true;
          return acc;
        }, {} as Record<PermissionKey, boolean>);
        return {
          uid: d.id,
          email: raw.email || '',
          displayName: raw.displayName || '',
          role: raw.role || 'user',
          createdAt: raw.createdAt || '',
          ...permissions,
        } as UserRecord;
      });
      setUsers(data);
      setLoading(false);
      setErro(false);
    }, () => { setLoading(false); setErro(true); });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const hasAnyAccess = (u: UserRecord) => PERMISSION_FIELDS.some(f => u[f.key]);

  const togglePermission = async (uid: string, field: PermissionKey, current: boolean) => {
    const chave = `${uid}:${field}`;
    setSavingKey(chave);
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { [field]: !current });
      } else {
        const u = users.find(u => u.uid === uid);
        const defaults = PERMISSION_FIELDS.reduce((acc, f) => {
          acc[f.key] = false;
          return acc;
        }, {} as Record<PermissionKey, boolean>);
        await setDoc(ref, {
          uid,
          email: u?.email || '',
          displayName: u?.displayName || '',
          role: 'user',
          ...defaults,
          [field]: !current,
          createdAt: new Date().toISOString(),
        });
      }
      const label = PERMISSION_FIELDS.find(f => f.key === field)?.label || field;
      showToast(`Acesso a "${label}" ${!current ? 'liberado' : 'revogado'} com sucesso.`);
    } catch (e: any) {
      console.error('Erro ao atualizar permissão:', e?.code, e?.message);
      showToast('Não foi possível atualizar a permissão. Tente novamente.');
    } finally {
      setSavingKey(prev => (prev === chave ? null : prev));
    }
  };

  const toggleRole = async (uid: string, current: string) => {
    if (uid === currentUserUid) return showToast('Você não pode alterar sua própria função.');
    try {
      const newRole = current === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      showToast(`Função alterada para ${newRole === 'admin' ? 'Administrador' : 'Usuário'}.`);
    } catch (e) {
      showToast('Erro ao alterar função.');
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(search.toLowerCase())
  );

  const usuarioGerenciando = gerenciando ? users.find(u => u.uid === gerenciando) || null : null;

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          icon={<Users size={28} />}
          title="Gestão de Usuários"
          description="Gerencie permissões de acesso dos usuários cadastrados"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard compact label="Total de usuários" value={users.length} />
        <KpiCard compact label="Administradores" value={users.filter(u => u.role === 'admin').length} tone="primary" />
        <KpiCard compact label="Acesso Relatório Final" value={users.filter(u => u.canAccessRelatorio).length} tone="success" />
        <KpiCard compact label="Sem nenhum acesso liberado" value={users.filter(u => u.role !== 'admin' && !hasAnyAccess(u)).length} tone="muted" />
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
        <TextInput
          type="text"
          placeholder="Buscar por e-mail ou nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
          </span>
          {loading && <RefreshCw size={14} className="text-slate-400 animate-spin" />}
        </div>

        {erro ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500 mb-3">Não foi possível carregar os usuários.</p>
            <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>Tentar novamente</Button>
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Carregando usuários...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={users.length === 0 ? 'Nenhum usuário encontrado' : 'Nenhum usuário corresponde à busca'}
            description={
              users.length === 0
                ? 'Os documentos são criados automaticamente no primeiro login de cada usuário.'
                : undefined
            }
            action={users.length > 0 && search ? <Button size="sm" variant="ghost" onClick={() => setSearch('')}>Limpar busca</Button> : undefined}
          />
        ) : (
          <>
            {/* Desktop / tablet — lista compacta */}
            <div className="hidden md:block divide-y divide-slate-100">
              {filtered.map(u => (
                <div key={u.uid} className={`flex items-center gap-4 p-4 ${u.uid === currentUserUid ? 'bg-[var(--native-primary-light)]/40' : ''}`}>
                  <div className="w-9 h-9 rounded-full bg-[var(--native-primary-light)] flex items-center justify-center text-[var(--native-primary)] font-bold text-xs shrink-0">
                    {u.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <p className="font-semibold text-slate-800 text-sm flex items-center gap-2 flex-wrap">
                      {u.displayName || u.email}
                      {u.uid === currentUserUid && <Badge variant="primary">Você</Badge>}
                      {u.role === 'admin' && <Badge variant="success" icon={<Shield size={10} />}>Admin</Badge>}
                    </p>
                    {u.displayName && <p className="text-xs text-slate-400">{u.email}</p>}
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    {u.role === 'admin' ? (
                      <span className="text-xs text-slate-500">Todas as áreas</span>
                    ) : areasComAcesso(u).length === 0 ? (
                      <span className="text-xs text-slate-400 italic">Nenhuma área</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {areasComAcesso(u).map(a => <Badge key={a} variant="neutral">{a}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div className="w-28 shrink-0 text-sm text-slate-500">
                    {u.role === 'admin' ? 'Automático' : `${contarAtivos(u, PERMISSION_FIELDS)}/${PERMISSION_FIELDS.length}`}
                  </div>
                  <div className="shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => setGerenciando(u.uid)}>Gerenciar</Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile — cards, sem matriz horizontal */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map(u => (
                <div key={u.uid} className={`p-4 ${u.uid === currentUserUid ? 'bg-[var(--native-primary-light)]/40' : ''}`}>
                  <p className="font-semibold text-slate-800 text-sm flex items-center gap-2 flex-wrap">
                    {u.displayName || u.email}
                    {u.uid === currentUserUid && <Badge variant="primary">Você</Badge>}
                    {u.role === 'admin' && <Badge variant="success" icon={<Shield size={10} />}>Admin</Badge>}
                  </p>
                  {u.displayName && <p className="text-xs text-slate-400">{u.email}</p>}
                  <p className="text-xs text-slate-500 mt-2">
                    {u.role === 'admin' ? 'Acesso automático a todas as áreas' : `${contarAtivos(u, PERMISSION_FIELDS)}/${PERMISSION_FIELDS.length} permissões`}
                  </p>
                  <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => setGerenciando(u.uid)}>Gerenciar</Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {usuarioGerenciando && (
        <GerenciarPermissoesModal
          user={usuarioGerenciando}
          isCurrentUser={usuarioGerenciando.uid === currentUserUid}
          savingKey={savingKey}
          onClose={() => setGerenciando(null)}
          onTogglePermission={togglePermission}
          onToggleRole={toggleRole}
        />
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium z-50" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
};
