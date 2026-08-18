import { Download, X, Share2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState } from 'react';

export function InstallPrompt() {
  const { isInstallable, isIOS, promptInstall } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  if (!isInstallable) {
    return null;
  }

  const handleInstallClick = async () => {
    const result = await promptInstall();
    if (result === 'ios') {
      setShowIOSInstructions(true);
    }
  };

  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Installer sur iPhone
            </h3>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Share2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  Appuyez sur le bouton Partager
                </p>
                <p className="text-gray-600 text-xs">
                  Icône carré avec flèche vers le haut en bas de l'écran
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  Sélectionnez "Sur l'écran d'accueil"
                </p>
                <p className="text-gray-600 text-xs">
                  Faites défiler vers le bas et appuyez sur cette option
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold text-sm">✓</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  Appuyez sur "Ajouter"
                </p>
                <p className="text-gray-600 text-xs">
                  L'icône apparaîtra sur votre écran d'accueil
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowIOSInstructions(false)}
            className="w-full mt-6 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            Compris
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4">
      <div className="max-w-md mx-auto bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-medium text-sm">
            Installez l'application
          </p>
          <p className="text-white/80 text-xs">
            {isIOS ? "iPhone : instructions d'installation" : "Accès rapide depuis votre écran d'accueil"}
          </p>
        </div>
        <button
          onClick={handleInstallClick}
          className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors"
        >
          Installer
        </button>
      </div>
    </div>
  );
}
