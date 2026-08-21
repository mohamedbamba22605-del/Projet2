import { useState, useEffect, useCallback } from 'react';
import { supabase, MatchConfig } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { clearQueue } from '@/lib/offline';
import { Settings, Users, Download, UserPlus, Trash2, CircleAlert as AlertCircle, Check, RotateCcw, UserCheck, Shield, UserPlus2 } from 'lucide-react';

type Tab = 'bonus' | 'users' | 'roles' | 'staff_inscriptions' | 'export' | 'reset';

export function Admin() {
  const [tab, setTab] = useState<Tab>('bonus');

  return (
    <div className="space-y-4 pb-4">
      <div className="flex gap-2">
        <TabButton active={tab === 'bonus'} onClick={() => setTab('bonus')} icon={<Settings className="w-4 h-4" />}>
          Bonus match
        </TabButton>
        <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon={<Users className="w-4 h-4" />}>
          Utilisateurs
        </TabButton>
        <TabButton active={tab === 'roles'} onClick={() => setTab('roles')} icon={<Shield className="w-4 h-4" />}>
          Rôles Match
        </TabButton>
        <TabButton active={tab === 'staff_inscriptions'} onClick={() => setTab('staff_inscriptions')} icon={<Users className="w-4 h-4" />}>
          Inscriptions Staff
        </TabButton>
        <TabButton active={tab === 'export'} onClick={() => setTab('export')} icon={<Download className="w-4 h-4" />}>
          Export CSV
        </TabButton>
        <TabButton active={tab === 'reset'} onClick={() => setTab('reset')} icon={<RotateCcw className="w-4 h-4" />}>
          Réinitialiser
        </TabButton>
      </div>

      {tab === 'bonus' && <BonusTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'staff_inscriptions' && <StaffInscriptionsTab />}
      {tab === 'export' && <ExportTab />}
      {tab === 'reset' && <ResetTab />}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex-1 justify-center ${
        active ? 'bg-red-600 text-white' : 'bg-white text-gray-600 shadow-sm'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function BonusTab() {
  const [config, setConfig] = useState<MatchConfig | null>(null);
  const [bonusG, setBonusG] = useState(0);
  const [bonusF, setBonusF] = useState(0);
  const [objectif, setObjectif] = useState(50);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('match_config').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) {
        setConfig(data);
        setBonusG(data.score_bonus_garcons);
        setBonusF(data.score_bonus_filles);
        setObjectif(data.objectif_global);
      }
    });
  }, []);

  const save = async () => {
    setError('');
    const { error: err } = await supabase
      .from('match_config')
      .update({
        score_bonus_garcons: bonusG,
        score_bonus_filles: bonusF,
        objectif_global: objectif,
      })
      .eq('id', 1);
    if (err) {
      setError(err.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 space-y-5">
      <h2 className="text-lg font-bold text-gray-900">Réglage du bonus match</h2>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
          <Check className="w-4 h-4" />
          Enregistré
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bonus Garçons (score du match du 27)</label>
        <input
          type="number"
          value={bonusG}
          onChange={(e) => setBonusG(parseInt(e.target.value) || 0)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:outline-none text-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bonus Filles (score du match du 27)</label>
        <input
          type="number"
          value={bonusF}
          onChange={(e) => setBonusF(parseInt(e.target.value) || 0)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:outline-none text-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Objectif global (nombre de donneurs)</label>
        <input
          type="number"
          value={objectif}
          onChange={(e) => setObjectif(parseInt(e.target.value) || 50)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:outline-none text-lg"
        />
      </div>

      <button
        onClick={save}
        className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
      >
        Enregistrer
      </button>
    </div>
  );
}

function UsersTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Array<{ id: string; prenom: string; role: string; created_at: string }>>([]);
  const [newPrenom, setNewPrenom] = useState('');
  const [newRole, setNewRole] = useState<'mobilisateur' | 'staff'>('mobilisateur');
  const [newPin, setNewPin] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('utilisateurs').select('id, prenom, role, created_at').order('created_at', { ascending: true });
    if (data) setUsers(data);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addUser = async () => {
    setError('');
    setNewPin(null);
    if (!newPrenom.trim()) {
      setError('Prénom requis');
      return;
    }
    const { data, error: err } = await supabase.rpc('create_user', {
      p_prenom: newPrenom.trim(),
      p_role: newRole,
    });
    if (err) {
      setError(err.message);
      return;
    }
    if (data && data[0]) {
      setNewPin(data[0].v_pin);
    }
    setNewPrenom('');
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (id === user?.id) {
      setError('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    await supabase.from('utilisateurs').delete().eq('id', id);
    fetchUsers();
  };

  const roleLabel = (r: string) => r === 'organisateur' ? 'Organisateur' : r === 'mobilisateur' ? 'Mobilisateur' : 'Staff';
  const roleColor = (r: string) => r === 'organisateur' ? 'bg-red-100 text-red-700' : r === 'mobilisateur' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-red-600" />
          Ajouter un utilisateur
        </h2>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {newPin && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 space-y-2">
            <p className="text-sm text-green-700">Utilisateur créé. Transmettez ce PIN :</p>
            <p className="text-3xl font-bold text-center text-green-700 tracking-[0.3em]">{newPin}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
          <input
            type="text"
            value={newPrenom}
            onChange={(e) => setNewPrenom(e.target.value)}
            placeholder="Ex: Awa"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setNewRole('mobilisateur')}
              className={`py-3 rounded-xl font-medium border-2 transition-colors ${newRole === 'mobilisateur' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200'}`}
            >
              Mobilisateur
            </button>
            <button
              type="button"
              onClick={() => setNewRole('staff')}
              className={`py-3 rounded-xl font-medium border-2 transition-colors ${newRole === 'staff' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-200'}`}
            >
              Staff
            </button>
          </div>
        </div>

        <button
          onClick={addUser}
          disabled={!newPrenom.trim()}
          className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          Créer l'utilisateur
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Tous les utilisateurs ({users.length})</h3>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-800">{u.prenom}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${roleColor(u.role)}`}>{roleLabel(u.role)}</span>
              </div>
              {u.role !== 'organisateur' && (
                <button onClick={() => deleteUser(u.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExportTab() {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const exportCSV = async () => {
    setExporting(true);
    setDone(false);

    const [participants, promesses, staff, spontanes] = await Promise.all([
      supabase.from('participants').select('nom, telephone, genre, role_joueur, present, timestamp_pointage, created_at'),
      supabase.from('promesses').select('nom_personne, telephone, statut, timestamp_enregistrement, timestamp_pointage, recruteur_id'),
      supabase.from('inscriptions_staff').select('nom, telephone, statut, timestamp_enregistrement, timestamp_pointage'),
      supabase.from('donneurs_spontanes').select('nom, telephone, timestamp_pointage'),
    ]);

    const recruteurMap = new Map<string, string>();
    if (participants.data) {
      participants.data.forEach((p) => recruteurMap.set(p.id, p.nom));
    }

    const rows: string[] = [];
    rows.push('Type,Nom,Telephone,Equipe,Statut,Recruteur,Date_Inscription,Date_Pointage');

    const escape = (s: string | null) => `"${(s || '').replace(/"/g, '""')}"`;

    participants.data?.forEach((p) => {
      rows.push([
        'Recruteur',
        escape(p.nom),
        escape(p.telephone),
        p.genre === 'M' ? 'Garcons' : 'Filles',
        p.present ? 'Present' : 'En_attente',
        '',
        p.created_at,
        p.timestamp_pointage || '',
      ].join(','));
    });

    promesses.data?.forEach((p) => {
      rows.push([
        'Promesse',
        escape(p.nom_personne),
        escape(p.telephone),
        '',
        p.statut,
        escape(recruteurMap.get(p.recruteur_id) || ''),
        p.timestamp_enregistrement,
        p.timestamp_pointage || '',
      ].join(','));
    });

    staff.data?.forEach((s) => {
      rows.push([
        'Staff',
        escape(s.nom),
        escape(s.telephone),
        '',
        s.statut,
        '',
        s.timestamp_enregistrement,
        s.timestamp_pointage || '',
      ].join(','));
    });

    spontanes.data?.forEach((s) => {
      rows.push([
        'Spontane',
        escape(s.nom),
        escape(s.telephone),
        '',
        'Present',
        '',
        '',
        s.timestamp_pointage,
      ].join(','));
    });

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `le_match_continue_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setExporting(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Download className="w-5 h-5 text-red-600" />
        Export CSV
      </h2>
      <p className="text-sm text-gray-500">
        Téléchargez un fichier CSV avec toutes les données: recruteurs, promesses, inscriptions staff et donneurs spontanés.
      </p>

      {done && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
          <Check className="w-4 h-4" />
          Export téléchargé avec succès
        </div>
      )}

      <button
        onClick={exportCSV}
        disabled={exporting}
        className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {exporting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Exportation...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Télécharger le CSV
          </>
        )}
      </button>
    </div>
  );
}

function RolesTab() {
  const [users, setUsers] = useState<Array<{ id: string; prenom: string; role: string; roles_supp: Array<{ role: string; id: string }> }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.rpc('obtenir_utilisateurs_avec_roles_supp');
    
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    
    if (data) {
      setUsers(data.utilisateurs || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const assignRole = async (userId: string, role: 'treasurer' | 'controller') => {
    setError('');
    const { data, error: err } = await supabase.rpc('attribuer_role_supp', {
      p_utilisateur_id: userId,
      p_role_supp: role
    });
    
    if (err) {
      setError(err.message);
      return;
    }
    
    if (data?.success) {
      setSuccess(`Rôle ${role === 'treasurer' ? 'Trésorier' : 'Contrôleur'} attribué avec succès`);
      setTimeout(() => setSuccess(''), 2000);
      fetchUsers();
    } else {
      setError(data?.error || 'Erreur lors de l\'attribution du rôle');
    }
  };

  const removeRole = async (userId: string, role: 'treasurer' | 'controller') => {
    setError('');
    const { error: err } = await supabase.rpc('supprimer_role_supp', {
      p_utilisateur_id: userId,
      p_role_supp: role
    });
    
    if (err) {
      setError(err.message);
      return;
    }
    
    setSuccess(`Rôle ${role === 'treasurer' ? 'Trésorier' : 'Contrôleur'} supprimé avec succès`);
    setTimeout(() => setSuccess(''), 2000);
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-5">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Shield className="w-5 h-5 text-red-600" />
        Gestion des rôles Match
      </h2>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      <p className="text-sm text-gray-600">
        Attribuez des rôles supplémentaires pour l'activité du match (Trésorier, Contrôleur)
      </p>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">{user.prenom}</p>
                <p className="text-xs text-gray-500 capitalize">Rôle principal: {user.role}</p>
              </div>
              <div className="flex gap-2">
                {user.roles_supp.find(r => r.role === 'treasurer') ? (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Trésorier
                  </span>
                ) : (
                  <button
                    onClick={() => assignRole(user.id, 'treasurer')}
                    className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full hover:bg-yellow-100 transition-colors flex items-center gap-1"
                  >
                    <UserPlus2 className="w-3 h-3" />
                    Trésorier
                  </button>
                )}
                {user.roles_supp.find(r => r.role === 'controller') ? (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Contrôleur
                  </span>
                ) : (
                  <button
                    onClick={() => assignRole(user.id, 'controller')}
                    className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full hover:bg-purple-100 transition-colors flex items-center gap-1"
                  >
                    <UserPlus2 className="w-3 h-3" />
                    Contrôleur
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {user.roles_supp.find(r => r.role === 'treasurer') && (
                <button
                  onClick={() => removeRole(user.id, 'treasurer')}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Retirer Trésorier
                </button>
              )}
              {user.roles_supp.find(r => r.role === 'controller') && (
                <button
                  onClick={() => removeRole(user.id, 'controller')}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Retirer Contrôleur
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100 text-sm text-gray-600">
        <p className="font-medium mb-2">Légende des rôles :</p>
        <ul className="space-y-1">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span><strong>Trésorier</strong> : Peut inscrire les joueurs pour le match et valider les paiements</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span><strong>Contrôleur</strong> : Peut valider les paiements le jour du match</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function StaffInscriptionsTab() {
  const [staffMembers, setStaffMembers] = useState<Array<{ id: string; prenom: string; role: string; inscriptions_count: number }>>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [inscriptions, setInscriptions] = useState<Array<{ id: string; nom: string; telephone: string; statut: string; timestamp_enregistrement: string; timestamp_pointage: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const fetchStaffMembers = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('utilisateurs')
      .select('id, prenom, role')
      .in('role', ['mobilisateur', 'staff'])
      .order('prenom', { ascending: true });
    
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Get inscription count for each staff member
    const staffWithCounts = await Promise.all(
      (data || []).map(async (staff) => {
        const { count } = await supabase
          .from('inscriptions_staff')
          .select('*', { count: 'exact', head: true })
          .eq('staff_utilisateur_id', staff.id);
        return {
          ...staff,
          inscriptions_count: count || 0
        };
      })
    );

    setStaffMembers(staffWithCounts);
    setLoading(false);
  };

  const fetchStaffInscriptions = async (staffId: string) => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('inscriptions_staff')
      .select('*')
      .eq('staff_utilisateur_id', staffId)
      .order('timestamp_enregistrement', { ascending: false });
    
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    
    setInscriptions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const handleStaffClick = (staffId: string) => {
    setSelectedStaff(staffId);
    fetchStaffInscriptions(staffId);
  };

  const handleBack = () => {
    setSelectedStaff(null);
    setInscriptions([]);
  };

  if (loading && !selectedStaff) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-5">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (selectedStaff) {
    const selectedStaffMember = staffMembers.find(s => s.id === selectedStaff);
    
    return (
      <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-600"
          >
            ← Retour
          </button>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-red-600" />
            Inscriptions de {selectedStaffMember?.prenom}
          </h2>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Total: {inscriptions.length} inscription(s)
          </p>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">
              Présentes: {inscriptions.filter(i => i.statut === 'presente').length}
            </span>
            <span className="text-gray-500">
              En attente: {inscriptions.filter(i => i.statut === 'en_attente').length}
            </span>
          </div>
        </div>

        {inscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune inscription pour ce membre du staff
          </div>
        ) : (
          <div className="space-y-2">
            {inscriptions.map((ins) => (
              <div key={ins.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="font-medium text-gray-800">{ins.nom}</span>
                  <span className="text-sm text-gray-500 ml-2">{ins.telephone}</span>
                </div>
                <div className="flex items-center gap-2">
                  {ins.statut === 'presente' ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Présent</span>
                  ) : (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">En attente</span>
                  )}
                  {ins.timestamp_pointage && (
                    <span className="text-xs text-gray-400">
                      {new Date(ins.timestamp_pointage).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-red-600" />
        Inscriptions par membre du staff
      </h2>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <p className="text-sm text-gray-600">
        Cliquez sur un membre du staff pour voir ses inscriptions
      </p>

      {staffMembers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun membre du staff inscrit
        </div>
      ) : (
        <div className="space-y-2">
          {staffMembers.map((staff) => (
            <button
              key={staff.id}
              onClick={() => handleStaffClick(staff.id)}
              className="w-full flex items-center justify-between bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{staff.prenom}</p>
                  <p className="text-xs text-gray-500 capitalize">{staff.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  {staff.inscriptions_count}
                </span>
                <span className="text-xs text-gray-500">inscription(s)</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total des membres staff:</span>
          <span className="font-semibold text-gray-900">{staffMembers.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-600">Total des inscriptions:</span>
          <span className="font-semibold text-gray-900">{staffMembers.reduce((sum, s) => sum + s.inscriptions_count, 0)}</span>
        </div>
      </div>
    </div>
  );
}

function ResetTab() {
  const [mode, setMode] = useState<'full' | 'selective'>('full');
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  
  // Options de réinitialisation sélective
  const [selectedOptions, setSelectedOptions] = useState({
    recruteurs: false,
    promesses: false,
    staff: false,
    spontanes: false,
    utilisateurs: false,
    bonus: false,
  });

  const handleReset = async () => {
    setResetting(true);
    setError('');
    
    try {
      if (mode === 'full') {
        const { data, error: err } = await supabase.rpc('reset_database');
        if (err) throw err;
        if (data) {
          clearQueue();
          setDone(true);
        }
      } else {
        // Réinitialisation sélective
        const operations = [];
        
        if (selectedOptions.recruteurs) {
          operations.push(supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
        }
        if (selectedOptions.promesses) {
          operations.push(supabase.from('promesses').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
        }
        if (selectedOptions.staff) {
          operations.push(supabase.from('inscriptions_staff').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
        }
        if (selectedOptions.spontanes) {
          operations.push(supabase.from('donneurs_spontanes').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
        }
        if (selectedOptions.utilisateurs) {
          operations.push(supabase.from('utilisateurs').delete().neq('role', 'organisateur'));
        }
        if (selectedOptions.bonus) {
          operations.push(supabase.from('match_config').update({ score_bonus_garcons: 0, score_bonus_filles: 0 }).eq('id', 1));
        }
        
        if (operations.length > 0) {
          await Promise.all(operations);
          clearQueue();
          setDone(true);
        } else {
          setError('Veuillez sélectionner au moins une option');
          setResetting(false);
          return;
        }
      }
      
      setResetting(false);
      setConfirming(false);
      setTimeout(() => setDone(false), 4000);
    } catch (err: any) {
      setError(err.message);
      setResetting(false);
      setConfirming(false);
    }
  };

  const hasSelection = Object.values(selectedOptions).some(v => v);

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <RotateCcw className="w-5 h-5 text-red-600" />
        Réinitialiser la base de données
      </h2>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {done && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
          <Check className="w-4 h-4" />
          {mode === 'full' ? 'Base de données réinitialisée avec succès' : 'Données sélectionnées réinitialisées avec succès'}
        </div>
      )}

      {/* Sélection du mode */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('full')}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
            mode === 'full' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Réinitialisation complète
        </button>
        <button
          onClick={() => setMode('selective')}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
            mode === 'selective' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Réinitialisation sélective
        </button>
      </div>

      {mode === 'full' ? (
        <>
          <p className="text-sm text-gray-600">
            Cette action efface toutes les données de l'événement: recruteurs, promesses, inscriptions staff, donneurs spontanés et utilisateurs non-organisateurs.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-red-700">Données qui seront supprimées:</p>
            <ul className="text-sm text-red-600 space-y-1 pl-4 list-disc">
              <li>Tous les recruteurs et leurs promesses</li>
              <li>Toutes les inscriptions Staff</li>
              <li>Tous les donneurs spontanés</li>
              <li>Tous les comptes Mobilisateur et Staff</li>
            </ul>
            <p className="text-sm text-green-600 font-medium mt-2">
              Les comptes Organisateurs et le bonus match sont conservés (remis à 0).
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Sélectionnez les données spécifiques que vous souhaitez réinitialiser:
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={selectedOptions.recruteurs}
                onChange={(e) => setSelectedOptions({...selectedOptions, recruteurs: e.target.checked})}
                className="w-5 h-5 text-red-600 rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Recruteurs</p>
                <p className="text-xs text-gray-500">Supprime tous les recruteurs et leurs données</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={selectedOptions.promesses}
                onChange={(e) => setSelectedOptions({...selectedOptions, promesses: e.target.checked})}
                className="w-5 h-5 text-red-600 rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Promesses</p>
                <p className="text-xs text-gray-500">Supprime toutes les promesses de don</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={selectedOptions.staff}
                onChange={(e) => setSelectedOptions({...selectedOptions, staff: e.target.checked})}
                className="w-5 h-5 text-red-600 rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Inscriptions Staff</p>
                <p className="text-xs text-gray-500">Supprime toutes les inscriptions du staff</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={selectedOptions.spontanes}
                onChange={(e) => setSelectedOptions({...selectedOptions, spontanes: e.target.checked})}
                className="w-5 h-5 text-red-600 rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Donneurs spontanés</p>
                <p className="text-xs text-gray-500">Supprime tous les donneurs spontanés</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={selectedOptions.utilisateurs}
                onChange={(e) => setSelectedOptions({...selectedOptions, utilisateurs: e.target.checked})}
                className="w-5 h-5 text-red-600 rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Utilisateurs (Mobilisateur/Staff)</p>
                <p className="text-xs text-gray-500">Supprime les comptes sauf organisateurs</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={selectedOptions.bonus}
                onChange={(e) => setSelectedOptions({...selectedOptions, bonus: e.target.checked})}
                className="w-5 h-5 text-red-600 rounded"
              />
              <div>
                <p className="font-medium text-gray-900">Bonus match</p>
                <p className="text-xs text-gray-500">Remet les bonus garçons et filles à 0</p>
              </div>
            </label>
          </div>
        </>
      )}

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          disabled={mode === 'selective' && !hasSelection}
          className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          {mode === 'full' ? 'Réinitialiser la base' : 'Réinitialiser la sélection'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-red-700">Êtes-vous absolument sûr ?</p>
            <p className="text-xs text-red-600 mt-1">Cette action est irréversible.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setConfirming(false)}
              className="py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {resetting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Confirmer
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
