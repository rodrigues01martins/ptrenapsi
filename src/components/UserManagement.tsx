import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Shield, ShieldOff, RefreshCw, Search } from 'lucide-react';

type PermissionKey =
  | 'canAccessUpload' | 'canAccessGerencial' | 'canAccessRepasse' | 'canAccessHistorico'
  | 'canAccessFrequencia' | 'canAccessAlcance' | 'canAccessEixo3' | 'canAccessEixo4'
  | 'canAccessRelatorio'
  | 'canAccessEntry' | 'canAccessReport';

interface PermissionField {
  key: PermissionKey;
  label: string;
  group: string;
}

// Ordem de exibição das colunas, agrupadas por dimensão do app.
const PERMISSION_FIELDS: PermissionField[] = [
  { key: 'canAccessUpload',     label: 'Upload',             group: 'Apuração Mensal' },
  { key: 'canAccessGerencial',  label: 'Gerencial',          group: 'Apuração Mensal' },
  { key: 'canAccessRepasse',    label: 'Repasse',            group: 'Apuração Mensal' },
  { key: 'canAccessHistorico',  label: 'Histórico',          group: 'Apuração Mensal' },
  { key: 'canAccessFrequencia', label: 'Eixo 1 — Inclusão',  group: 'Monitoramento e Avaliação' },
  { key: 'canAccessAlcance',    label: 'Eixo 2 — Alcance',   group: 'Monitoramento e Avaliação' },
  { key: 'canAccessEixo3',      label: 'Eixo 3',             group: 'Monitoramento e Avaliação' },
  { key: 'canAccessEixo4',      label: 'Eixo 4',             group: 'Monitoramento e Avaliação' },
  { key: 'canAccessRelatorio',  label: 'Relatório Final',    group: 'Monitoramento e Avaliação' },
  { key: 'canAccessEntry',      label: 'Novo Lançamento',        group: 'Acompanhamento Financeiro' },
  { key: 'canAccessReport',     label: 'Painel',                 group: 'Acompanhamento Financeiro' },
];

// Colunas consecutivas do mesmo grupo, para desenhar o cabeçalho em duas linhas.
const PERMISSION_GROUPS = PERMISSION_FIELDS.reduce<{ group: string; count: number }[]>((acc, f) => {
  const last = acc[acc.length - 1];
  if (last && last.group === f.group) last.count++;
  else acc.push({ group: f.group, count: 1 });
  return acc;
}, []);

type UserRecord = { uid: string; email: string; displayName?: string; role: string; createdAt?: string } & {
  [K in PermissionKey]: boolean;
};

interface UserManagementProps {
  currentUserUid: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUserUid }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Escuta em tempo real a coleção users
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
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const hasAnyAccess = (u: UserRecord) => PERMISSION_FIELDS.some(f => u[f.key]);

  const togglePermission = async (uid: string, field: PermissionKey, current: boolean) => {
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
      showToast(`Erro: ${e?.code || 'verifique as regras do Firestore'}`);
    }
  };

  const toggleRole = async (uid: string, current: string) => {
    if (uid === currentUserUid) return showToast('Você não pode alterar sua própria função.');
    try {
      const newRole = current === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      showToast(`Função alterada para ${newRole}.`);
    } catch (e) {
      showToast('Erro ao alterar função.');
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#007770]/10 p-2.5 rounded-xl">
          <Users size={28} className="text-[#007770]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestão de Usuários</h2>
          <p className="text-sm text-slate-500">Gerencie permissões de acesso dos usuários cadastrados</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de usuários', value: users.length, color: 'text-slate-800' },
          { label: 'Administradores', value: users.filter(u => u.role === 'admin').length, color: 'text-[#007770]' },
          { label: 'Acesso Relatório Final', value: users.filter(u => u.canAccessRelatorio).length, color: 'text-blue-600' },
          { label: 'Sem nenhum acesso liberado', value: users.filter(u => u.role !== 'admin' && !hasAnyAccess(u)).length, color: 'text-slate-400' },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por e-mail ou nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#007770] outline-none"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
          </span>
          {loading && <RefreshCw size={14} className="text-slate-400 animate-spin" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/70">
                <th rowSpan={2} className="text-left text-xs font-bold text-slate-500 uppercase p-4 align-bottom">Usuário</th>
                <th rowSpan={2} className="text-left text-xs font-bold text-slate-500 uppercase p-4 align-bottom">UID</th>
                <th rowSpan={2} className="text-center text-xs font-bold text-slate-500 uppercase p-4 align-bottom">Função</th>
                {PERMISSION_GROUPS.map(g => (
                  <th
                    key={g.group}
                    colSpan={g.count}
                    className="text-center text-[10px] font-bold text-[#007770] uppercase tracking-wider p-2 border-l border-slate-100 whitespace-nowrap"
                  >
                    {g.group}
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50/70">
                {PERMISSION_FIELDS.map((f, i) => (
                  <th
                    key={f.key}
                    className={`text-center text-[11px] font-bold text-slate-500 uppercase p-3 whitespace-nowrap ${
                      i === 0 || PERMISSION_FIELDS[i - 1]?.group !== f.group ? 'border-l border-slate-100' : ''
                    }`}
                  >
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3 + PERMISSION_FIELDS.length} className="p-8 text-center text-slate-400 text-sm">
                    Carregando usuários...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3 + PERMISSION_FIELDS.length} className="p-8 text-center text-slate-400 text-sm">
                    {users.length === 0
                      ? 'Nenhum usuário encontrado. Os documentos são criados automaticamente no primeiro login de cada usuário.'
                      : 'Nenhum usuário encontrado para a busca.'}
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.uid} className={`hover:bg-slate-50 transition-colors ${u.uid === currentUserUid ? 'bg-[#007770]/5' : ''}`}>
                    {/* Usuário */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#007770]/10 flex items-center justify-center text-[#007770] font-bold text-xs flex-shrink-0">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {u.email}
                            {u.uid === currentUserUid && (
                              <span className="ml-2 px-1.5 py-0.5 bg-[#007770]/10 text-[#007770] text-[10px] font-bold rounded-full">você</span>
                            )}
                          </p>
                          {u.displayName && <p className="text-xs text-slate-400">{u.displayName}</p>}
                        </div>
                      </div>
                    </td>

                    {/* UID */}
                    <td className="p-4">
                      <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                        {u.uid.slice(0, 16)}...
                      </span>
                    </td>

                    {/* Função */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleRole(u.uid, u.role)}
                        disabled={u.uid === currentUserUid}
                        title={u.uid === currentUserUid ? 'Não é possível alterar sua própria função' : `Clique para mudar para ${u.role === 'admin' ? 'user' : 'admin'}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all
                          ${u.role === 'admin'
                            ? 'bg-[#007770]/10 text-[#007770] hover:bg-[#007770]/20'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                          ${u.uid === currentUserUid ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {u.role === 'admin' ? <Shield size={11} /> : <ShieldOff size={11} />}
                        {u.role === 'admin' ? 'Admin' : 'Usuário'}
                      </button>
                    </td>

                    {/* Toggles de permissão, um por coluna configurada acima */}
                    {PERMISSION_FIELDS.map((f, i) => (
                      <td
                        key={f.key}
                        className={`p-4 text-center ${i === 0 || PERMISSION_FIELDS[i - 1]?.group !== f.group ? 'border-l border-slate-100' : ''}`}
                      >
                        {u.role === 'admin' ? (
                          <span className="text-xs text-slate-400 italic">auto</span>
                        ) : (
                          <button
                            onClick={() => togglePermission(u.uid, f.key, u[f.key])}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                              ${u[f.key] ? 'bg-[#007770]' : 'bg-slate-200'}`}
                            title={u[f.key] ? `Revogar acesso a ${f.label}` : `Liberar acesso a ${f.label}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                              ${u[f.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legenda */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400">
            <strong className="text-slate-500">Toggle verde</strong> = acesso liberado para aquela seção.
            Admins têm acesso automático a todas as seções.
            Alterações têm efeito imediato no próximo login ou recarregamento do app pelo usuário.
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium z-50 animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
};
