import { useState, useEffect } from 'react';
import { supabase, normalizePhone, type InscriptionMatch } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Phone, AlertCircle, Check, Trophy, Users } from 'lucide-react';

export function InscriptionMatch() {
  const { user } = useAuth();
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [equipe, setEquipe] = useState<'garcons' | 'filles'>('garcons');
  const [roleJoueur, setRoleJoueur] = useState<'joueur' | 'spectateur'>('joueur');
  const [inscriptions, setInscriptions] = useState<InscriptionMatch[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!nom.trim() || !telephone.trim()) {
      setError('Nom et téléphone requis');
      return;
    }
    if (telephone.length < 8) {
      setError('Numéro de téléphone trop court');
      return;
    }

    setLoading(true);
    const phone = normalizePhone(telephone);
    const { data, error: err } = await supabase.rpc('inscrire_joueur_match', {
      p_nom: nom.trim(),
      p_telephone: phone,
      p_equipe: equipe,
      p_role_joueur: roleJoueur,
      p_inscrit_par_utilisateur_id: user?.id,
    });

    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    if (data?.success) {
      setSuccess(`${nom} inscrit pour le match (${equipe})`);
      setTimeout(() => setSuccess(''), 2000);
      setNom('');
      setTelephone('');
      fetchInscriptions();
    } else {
      setError(data?.error || 'Erreur lors de l\'inscription');
    }
  };

  const fetchInscriptions = async () => {
    if (!user?.id) return;
    const { data } = await supabase.rpc('obtenir_inscriptions_match_utilisateur', {
      p_utilisateur_id: user.id,
    });
    if (data) {
      setInscriptions(data.inscriptions || []);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('inscriptions_match').delete().eq('id', id);
    fetchInscriptions();
  };

  useEffect(() => {
    fetchInscriptions();
  }, []);

  return (
    <div className="space-y-4 pb-4">
      <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-red-600" />
          Inscrire un joueur pour le Match
        </h2>

        {error && (
          <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
            <Check className="w-4 h-4" />
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Jean Kouassi"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Ex: 0701020304"
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Équipe</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEquipe('garcons')}
              className={`py-3 rounded-xl font-medium border-2 transition-colors ${equipe === 'garcons' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200'}`}
            >
              Garçons
            </button>
            <button
              type="button"
              onClick={() => setEquipe('filles')}
              className={`py-3 rounded-xl font-medium border-2 transition-colors ${equipe === 'filles' ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-700 border-gray-200'}`}
            >
              Filles
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRoleJoueur('joueur')}
              className={`py-3 rounded-xl font-medium border-2 transition-colors ${roleJoueur === 'joueur' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-200'}`}
            >
              Joueur
            </button>
            <button
              type="button"
              onClick={() => setRoleJoueur('spectateur')}
              className={`py-3 rounded-xl font-medium border-2 transition-colors ${roleJoueur === 'spectateur' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-200'}`}
            >
              Spectateur
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!nom.trim() || telephone.length < 8 || loading}
          className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Inscription...' : 'Inscrire pour le Match'}
        </button>
      </div>

      {inscriptions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Mes inscriptions Match ({inscriptions.length})</h3>
          <div className="space-y-2">
            {inscriptions.map((ins) => (
              <div key={ins.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="font-medium text-gray-800">{ins.nom}</span>
                  <span className="text-sm text-gray-500 ml-2">{ins.telephone}</span>
                  <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${ins.equipe === 'garcons' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                    {ins.equipe === 'garcons' ? 'Garçons' : 'Filles'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {ins.statut_paiement === 'paye' ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Payé</span>
                  ) : (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Non payé</span>
                  )}
                  <button onClick={() => handleDelete(ins.id)} className="text-gray-400 hover:text-red-600">
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}