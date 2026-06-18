import React, { useState, useEffect } from 'react';
import { Pencil, ShieldCheck, ShieldAlert, Save, X, Shield, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Tenant {
  id: string;
  name: string | null;
  email: string | null;
  password?: string | null;
  admin_name: string | null;
  whatsapp: string | null;
  active: boolean | number;
  subscription_status: string | null;
  trial_ends_at: string | null;
  permissions?: string | any;
}

const AVAILABLE_TABS = [
  { id: 'cartão', label: 'Cardápio' },
  { id: 'cadastro', label: 'Clientes' },
  { id: 'irmão', label: 'Lançar Fiado' },
  { id: 'fazerOrdem', label: 'Novo Pedido' },
  { id: 'pedidosQr', label: 'Cozinha Geral' },
  { id: 'baixaCozinha', label: 'Baixa Pratos' },
  { id: 'relacional', label: 'Extrair' },
  { id: 'gráficos', label: 'Gráficos' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'painelCliente', label: 'Pintel TV' },
  { id: 'gmeas', label: 'Tabelas QR' },
  { id: 'siteQr', label: 'Site QR' },
  { id: 'entrega', label: '+ Entrega' },
  { id: 'porquinho', label: 'Menino' },
  { id: 'usuários', label: 'Usuários' },
  { id: 'usuários de cozinha', label: 'Usuário Login' },
  { id: 'promotor fiscal', label: 'Gestão Fiscal' },
  { id: 'configurar', label: 'Configurar' }
];

export default function SuperAdmin() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/tenants');
      const data = await res.json();

      if (Array.isArray(data)) {
        const parsed = data.map(t => ({
          ...t,
          permissions: t.permissions ? (typeof t.permissions === 'string' ? JSON.parse(t.permissions) : t.permissions) : {}
        }));
        setTenants(parsed);
      } else if (data.error) {
        setError(data.error);
        setTenants([]);
      } else {
        setError('O formato dos dados retornados é inválido.');
        setTenants([]);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError('Erro crítico ao carregar inquilinos.');
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    await fetch(`/api/admin/tenants/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing)
    });
    setEditing(null);
    fetchTenants();
  };

  const addDays = (days: number) => {
    if (!editing) return;
    const date = new Date();
    date.setDate(date.getDate() + days);
    setEditing({ ...editing, trial_ends_at: date.toISOString(), subscription_status: 'trialing', active: true });
  };

  const filteredTenants = tenants.filter(t =>
    (t.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.id?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const togglePermission = (tabId: string) => {
    if (!editing) return;
    const currentPerms = editing.permissions || {};
    const newPerms = { ...currentPerms, [tabId]: !currentPerms[tabId] };
    setEditing({ ...editing, permissions: newPerms });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12 font-sans">
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-blue-500 flex items-center gap-3">
            <Shield className="w-12 h-12" />
            marcos eduardo
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">
            Gestão de Licenças e Usuários Elite
          </p>
        </div>

        <div className="flex-1 max-w-md relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="PESQUISAR NOME, EMAIL OU ID..."
            className="w-full bg-[#141417] border border-white/5 p-5 pl-14 rounded-[24px] outline-none focus:border-blue-500/50 font-black text-[10px] uppercase tracking-widest transition-all placeholder:text-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="hidden md:block">
          <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl">
            <span className="text-blue-400 font-bold uppercase text-xs tracking-widest">Acesso Restrito</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex flex-col gap-2">
            <h3 className="text-red-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
              <ShieldAlert size={16} /> Falha de Conexão
            </h3>
            <p className="text-gray-400 text-sm font-medium whitespace-pre-wrap">{error}</p>
            <button
              onClick={fetchTenants}
              className="mt-2 w-fit bg-red-500/20 hover:bg-red-500/30 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        <div className="bg-[#141417] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center animate-pulse">
              <p className="text-gray-500 font-black uppercase tracking-widest">Carregando dados do servidor...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="p-8">Usuário / Empresa</th>
                  <th className="p-8">Status</th>
                  <th className="p-8">Validade</th>
                  <th className="p-8 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-gray-600 font-bold uppercase">
                      {searchTerm ? 'Nenhum resultado para sua busca.' : 'Nenhum tenant encontrado no banco.'}
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map(t => (
                    <tr key={t.id} className="hover:bg-white/5 transition-all group">
                      <td className="p-8">
                        <div className="font-black text-xl group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                          {t.name || 'Sem Nome'}
                        </div>
                        <div className="flex flex-col gap-1 mt-2">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Shield size={10} className="text-blue-500" /> ID: <span className="text-gray-400 font-mono lowercase">{t.id}</span>
                          </div>
                          {t.email && (
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                              <Shield size={10} className="text-green-500" /> Email: <span className="text-gray-400 lowercase">{t.email}</span>
                            </div>
                          )}
                          {t.admin_name && (
                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                              Admin: {t.admin_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-8">
                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-2 w-fit ${t.active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                          {t.active ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                          {t.active ? 'Ativo' : 'Suspenso'}
                        </span>
                      </td>
                      <td className="p-8">
                        <div className="font-mono text-blue-400 font-bold text-sm">
                          {t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString() : 'Expirado'}
                        </div>
                        <div className="text-[9px] uppercase font-bold text-gray-600 mt-1">Status: {t.subscription_status || 'N/A'}</div>
                      </td>
                      <td className="p-8 text-right">
                        <button
                          onClick={() => setEditing(t)}
                          className="p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                        >
                          <Pencil size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 text-center">
        <p className="text-gray-600 text-[10px] uppercase font-black tracking-[0.2em]">
          &copy; 2026 Admin Panel &bull; Conexão Hostinger MySQL
        </p>
      </footer>

      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1c1c21] w-full max-w-lg rounded-[30px] p-6 md:p-8 border border-white/10 relative my-4 shadow-2xl"
            >
              <button onClick={() => setEditing(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black uppercase text-blue-500">Editar Conta</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Ajuste de privilégios e tempo</p>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-4 p-4 bg-black/30 rounded-2xl border border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase font-black text-gray-600 mb-1 block tracking-widest">ID Usuário</label>
                      <div className="text-[11px] font-mono font-bold text-gray-400 p-3 bg-white/5 rounded-xl border border-white/5 break-all">{editing.id}</div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-black text-blue-500 mb-1 block tracking-widest">Senha Principal</label>
                      <input
                        type="text"
                        className="w-full bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl outline-none focus:border-blue-500 font-bold transition-all text-xs text-blue-200 placeholder:text-blue-900"
                        value={editing.password || ''}
                        placeholder="DEFINIR SENHA"
                        onChange={e => setEditing({ ...editing, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-black text-gray-600 mb-1 block tracking-widest">Email do Usuário</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 p-3 rounded-xl outline-none focus:border-blue-500 font-bold transition-all text-sm"
                      value={editing.email || ''}
                      placeholder="email@usuario.com"
                      onChange={e => setEditing({ ...editing, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-black text-gray-500 mb-2 block tracking-widest">Nome Empresa</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-xl outline-none focus:border-blue-500 font-bold transition-all text-xs"
                      value={editing.name || ''}
                      onChange={e => setEditing({ ...editing, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-black text-gray-500 mb-2 block tracking-widest">Administrador</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 p-4 rounded-xl outline-none focus:border-blue-500 font-bold transition-all text-xs"
                      value={editing.admin_name || ''}
                      placeholder="Admin"
                      onChange={e => setEditing({ ...editing, admin_name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-gray-500 mb-3 block">WhatsApp</label>
                  <input
                    className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all"
                    value={editing.whatsapp || ''}
                    onChange={e => setEditing({ ...editing, whatsapp: e.target.value })}
                  />
                </div>

                <div className="bg-black/30 p-6 rounded-[24px] border border-white/5">
                  <label className="text-[9px] uppercase font-black text-gray-400 mb-4 block text-center tracking-widest">Permissões de Abas</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AVAILABLE_TABS.map(tab => {
                      const isActive = editing.permissions?.[tab.id] === true;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => togglePermission(tab.id)}
                          className={`p-2 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all border flex items-center justify-between gap-2 ${isActive
                              ? 'bg-blue-600/10 text-blue-400 border-blue-500/30'
                              : 'bg-black/20 text-gray-600 border-white/5'
                            }`}
                        >
                          <span className="truncate">{tab.label}</span>
                          {isActive ? <ShieldCheck size={10} className="shrink-0" /> : <X size={10} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-black/30 p-6 rounded-[24px] border border-white/5">
                  <label className="text-[9px] uppercase font-black text-gray-400 mb-4 block text-center tracking-widest">Adicionar Validade (Dias)</label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => addDays(d)}
                        className="bg-blue-600/10 hover:bg-blue-600 p-2 rounded-lg text-[8px] font-black transition-all border border-blue-500/20 text-blue-400 hover:text-white"
                      >
                        +{d}D
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 90, 365].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => addDays(d)}
                        className="bg-white/5 hover:bg-blue-600 p-2 rounded-lg text-[8px] font-black transition-all border border-white/5 hover:border-blue-400"
                      >
                        +{d}D
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 text-center">
                    <span className="text-[8px] uppercase text-gray-600 font-black block mb-1">Nova Validade</span>
                    <span className="text-blue-400 font-mono font-bold text-xs">
                      {editing.trial_ends_at ? new Date(editing.trial_ends_at).toLocaleDateString() : 'A DEFINIR'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, active: !editing.active })}
                    className={`p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${editing.active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                  >
                    {editing.active ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                    {editing.active ? 'Ativo' : 'Suspenso'}
                  </button>

                  <button
                    type="submit"
                    className="bg-blue-600 p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Salvar no Sistema
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
