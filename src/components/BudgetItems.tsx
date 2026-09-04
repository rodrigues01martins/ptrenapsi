import React, { useState } from 'react';
import { addDoc, deleteDoc, doc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { BudgetItem } from '../types';
import { fmt } from '../lib/utils';
import { ClipboardList, Plus, Trash2, Edit, X, Check } from 'lucide-react';

interface BudgetItemsProps {
  budgetItems: BudgetItem[];
  showToast: (message: string) => void;
}

const emptyForm = { id: '', stage: '', group: '', category: '', desc: '', value: '' };

export const BudgetItems: React.FC<BudgetItemsProps> = ({ budgetItems, showToast }) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalPrevisto = budgetItems.reduce((acc, i) => acc + (i.value || 0), 0);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setForm({
      id: item.id,
      stage: item.stage,
      group: item.group,
      category: item.category,
      desc: item.desc,
      value: String(item.value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(form.value.replace(',', '.'));
    if (!form.stage || !form.group || !form.category || !form.desc || Number.isNaN(value)) {
      showToast('Preencha etapa, grupo, categoria, descrição e valor.');
      return;
    }
    try {
      const data = { stage: form.stage, group: form.group, category: form.category, desc: form.desc, value };
      if (editingId) {
        await updateDoc(doc(db, 'budgetItems', editingId), data);
        showToast('Item atualizado.');
      } else if (form.id) {
        // Código informado manualmente vira o id do documento
        await setDoc(doc(db, 'budgetItems', form.id), data);
        showToast('Item cadastrado.');
      } else {
        await addDoc(collection(db, 'budgetItems'), data);
        showToast('Item cadastrado.');
      }
      resetForm();
    } catch (err) {
      showToast('Erro ao salvar item.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este item do Plano de Trabalho? Lançamentos já vinculados a ele não serão removidos.')) return;
    try {
      await deleteDoc(doc(db, 'budgetItems', id));
      showToast('Item removido.');
    } catch {
      showToast('Erro ao excluir item.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="bg-[#00735C]/10 p-2.5 rounded-xl">
          <ClipboardList size={28} className="text-[#00735C]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Itens do Plano de Trabalho</h2>
          <p className="text-sm text-slate-500">Cadastre as etapas, grupos e valores previstos que serão auditados</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold mb-1">Itens cadastrados</p>
          <p className="text-2xl font-bold text-slate-800">{budgetItems.length}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold mb-1">Total previsto</p>
          <p className="text-2xl font-bold text-[#00735C]">{fmt.format(totalPrevisto)}</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">{editingId ? 'Editar item' : 'Novo item'}</h3>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <X size={12} /> Cancelar edição
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!editingId && (
            <div className="space-y-1 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Código do item</label>
              <input
                type="text" placeholder="Ex: 1.1.1.1 (opcional — gerado automaticamente se vazio)"
                value={form.id}
                onChange={e => setForm(p => ({ ...p, id: e.target.value }))}
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Etapa</label>
            <input
              type="text" placeholder="Ex: 1. Implantação"
              value={form.stage}
              onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Grupo de despesa</label>
            <input
              type="text" placeholder="Ex: Custeio"
              value={form.group}
              onChange={e => setForm(p => ({ ...p, group: e.target.value }))}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Categoria</label>
            <input
              type="text" placeholder="Ex: Material de Consumo"
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Valor previsto (R$)</label>
            <input
              type="text" placeholder="0,00"
              value={form.value}
              onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-[#00735C]"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Descrição</label>
            <input
              type="text" placeholder="Descrição do item"
              value={form.desc}
              onChange={e => setForm(p => ({ ...p, desc: e.target.value }))}
              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-6 flex items-center gap-2 bg-[#00735C] text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-[#005c4a] transition-all"
        >
          {editingId ? <Check size={16} /> : <Plus size={16} />}
          {editingId ? 'Salvar alterações' : 'Adicionar item'}
        </button>
      </form>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Código</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Etapa</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Grupo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Categoria</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Descrição</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Previsto</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Editar</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Excluir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budgetItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                    Nenhum item cadastrado ainda.
                  </td>
                </tr>
              ) : budgetItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold text-[#00735C]">{item.id}</td>
                  <td className="p-4 text-xs text-slate-600 max-w-[160px] truncate" title={item.stage}>{item.stage}</td>
                  <td className="p-4 text-xs text-slate-600">{item.group}</td>
                  <td className="p-4 text-xs text-slate-600">{item.category}</td>
                  <td className="p-4 text-xs text-slate-600 max-w-[220px] truncate" title={item.desc}>{item.desc}</td>
                  <td className="p-4 text-right text-sm font-bold text-slate-800">{fmt.format(item.value)}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-[#00735C] transition-colors" title="Editar">
                      <Edit size={14} />
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
