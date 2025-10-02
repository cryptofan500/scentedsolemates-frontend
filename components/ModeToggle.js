import { useState, useEffect } from 'react';
import { modes } from '../lib/api';

export default function ModeToggle({ currentMode, onModeChange }) {
  const [mode, setMode] = useState(currentMode || 'tease_toes');
  const [switching, setSwitching] = useState(false);
  const [canAccessApocalypse, setCanAccessApocalypse] = useState(false);

  useEffect(() => {
    // Check if user has earned Apocalypse access
    checkApocalypseAccess();
  }, []);

  const checkApocalypseAccess = async () => {
    const hasAccess = await modes.canAccessApocalypse();
    setCanAccessApocalypse(hasAccess);
  };

  const handleModeSwitch = async () => {
    if (switching) return;
    
    const newMode = mode === 'tease_toes' ? 'apocalypse_ankles' : 'tease_toes';
    
    // Check if switching to Apocalypse requires challenges
    if (newMode === 'apocalypse_ankles' && !canAccessApocalypse) {
      alert('Complete 3 challenges to unlock Apocalypse Ankles mode! 👣');
      return;
    }
    
    setSwitching(true);
    
    try {
      await modes.switch(newMode);
      setMode(newMode);
      if (onModeChange) {
        onModeChange(newMode);
      }
    } catch (err) {
      console.error('Mode switch failed:', err);
      alert('Failed to switch mode. Please try again.');
    }
    
    setSwitching(false);
  };

  const getModeDisplay = () => {
    if (mode === 'tease_toes') {
      return {
        name: 'Tease Toes',
        icon: '🦶',
        color: 'bg-pink-500',
        description: 'Safe mode - Browse and match casually'
      };
    } else {
      return {
        name: 'Apocalypse Ankles',
        icon: '🔥',
        color: 'bg-red-600',
        description: 'Full experience - All features unlocked'
      };
    }
  };

  const modeInfo = getModeDisplay();

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">{modeInfo.icon}</span>
            {modeInfo.name}
          </h3>
          <p className="text-sm text-gray-600">{modeInfo.description}</p>
        </div>
        
        <button
          onClick={handleModeSwitch}
          disabled={switching || (!canAccessApocalypse && mode === 'tease_toes')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            mode === 'apocalypse_ankles' ? 'bg-red-600' : 'bg-gray-200'
          } ${switching ? 'opacity-50' : ''} ${
            !canAccessApocalypse && mode === 'tease_toes' ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              mode === 'apocalypse_ankles' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      {!canAccessApocalypse && mode === 'tease_toes' && (
        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          🔒 Complete 3 daily challenges to unlock Apocalypse Ankles mode
        </div>
      )}
      
      {mode === 'apocalypse_ankles' && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          ⚡ All features active - You're in the danger zone!
        </div>
      )}
    </div>
  );
}