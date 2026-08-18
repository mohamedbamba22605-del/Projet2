import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallPrompt() {
  const { isInstallable, promptInstall } = usePWAInstall();

  if (!isInstallable) {
    return null;
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
            Accès rapide depuis votre écran d'accueil
          </p>
        </div>
        <button
          onClick={promptInstall}
          className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors"
        >
          Installer
        </button>
      </div>
    </div>
  );
}
