import React, { useState } from 'react';
import { Anchor, User, ArrowRight, Waves } from 'lucide-react';

export interface FishermanProfile {
  name: string;
  entryTime: string;
}

interface FishermanAuthModalProps {
  isOpen: boolean;
  onComplete: (profile: FishermanProfile) => void;
}

export const FishermanAuthModal: React.FC<FishermanAuthModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleContinue = () => {
    if (name.trim()) {
      onComplete({
        name: name.trim(),
        entryTime: new Date().toISOString(),
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleContinue();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md mx-auto mb-3 flex items-center justify-center">
            <Anchor className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">SAMUDRA AI</h2>
          <p className="text-teal-100 text-sm font-medium">Fisherman Companion</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-[#111111]">Welcome, Fisherman!</h3>
            <p className="text-sm text-[#666666] leading-relaxed">
              Enter your name to begin your voice-first marine assistance experience.
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#333333] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>Your Name</span>
            </label>
            <input
              type="text"
              id="fisherman-name-input"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5] text-sm text-[#111111] placeholder-[#999999] focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            />
            <p className="text-[11px] text-[#777777] italic">
              Example: Ravi, Murugan, Kumar, Vishnu, Arjun
            </p>
          </div>

          {/* Continue Button */}
          <button
            id="fisherman-continue-btn"
            disabled={!name.trim()}
            onClick={handleContinue}
            className="w-full px-6 py-3.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:shadow-none"
          >
            <span>Continue to SAMUDRA AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Info Footer */}
          <div className="pt-3 border-t border-[#E5E5E5]">
            <div className="flex items-start gap-2 text-xs text-[#666666]">
              <Waves className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                SAMUDRA AI will provide voice-first fishing zone intelligence, weather alerts,
                sea-state conditions, and safe route guidance in your language.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
