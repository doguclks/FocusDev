import React, { useState } from 'react';
import { Settings, Save, Clock, ShieldAlert, Sparkles, Plus, X, Check } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (settings: Partial<AppSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [newKeyword, setNewKeyword] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !form.whitelistKeywords.includes(newKeyword.trim())) {
      setForm({
        ...form,
        whitelistKeywords: [...form.whitelistKeywords, newKeyword.trim().toLowerCase()],
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setForm({
      ...form,
      whitelistKeywords: form.whitelistKeywords.filter((k) => k !== kw),
    });
  };

  const handleSave = () => {
    onSave(form);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
            <Settings className="h-5 w-5 text-brand-400 flex-shrink-0" />
            <span>Uygulama Ayarları</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Çalışma saatleri, dürtme eşikleri ve derin odak tercihlerini yapılandırın
          </p>
        </div>

        <button
          onClick={handleSave}
          className="self-start sm:self-auto bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center space-x-1.5"
        >
          {savedToast ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{savedToast ? 'Kaydedildi!' : 'Ayarları Kaydet'}</span>
        </button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-sm">
        {/* Working Hours */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 mb-3">
            <Clock className="h-4 w-4 text-brand-400" />
            <span>Mesai Saatleri</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Başlangıç Saati:</label>
              <input
                type="time"
                value={form.workStartTime}
                onChange={(e) => setForm({ ...form, workStartTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Bitiş Saati:</label>
              <input
                type="time"
                value={form.workEndTime}
                onChange={(e) => setForm({ ...form, workEndTime: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Bu saatler arasında YouTube takibi ve günlük verimlilik logları aktif olur.
          </p>
        </div>

        <hr className="border-slate-800/80" />

        {/* Nudge Alert Threshold */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 mb-3">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Akıllı Dürtme (Gentle Nudge) Eşiği</span>
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">YouTube'da aralıksız kalma süresi:</span>
              <span className="font-mono text-amber-400 font-bold">{form.nudgeThresholdMinutes} Dakika</span>
            </div>
            <input
              type="range"
              min="2"
              max="15"
              step="1"
              value={form.nudgeThresholdMinutes}
              onChange={(e) => setForm({ ...form, nudgeThresholdMinutes: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
            <p className="text-[11px] text-slate-500">
              Bu süre aşıldığında ekranda tatlı bir uyarı bildirimi gösterilir ("Kodun hazır mı? 🎯").
            </p>
          </div>
        </div>

        <hr className="border-slate-800/80" />

        {/* Deep Focus Protection Level */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 mb-3">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>Derin Odak Koruma Seviyesi</span>
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setForm({ ...form, deepFocusBlockLevel: 'soft' })}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                form.deepFocusBlockLevel === 'soft'
                  ? 'border-brand-500 bg-brand-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-bold block text-brand-300">Yumuşak Uyarı (Soft)</span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                YouTube açılırsa ekranda dikkat dağılması hatırlatıcı banner'ı belirir.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, deepFocusBlockLevel: 'strict' })}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                form.deepFocusBlockLevel === 'strict'
                  ? 'border-rose-500 bg-rose-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-bold block text-rose-400">Sert Engel (Strict)</span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Derin odak sırasında YouTube sekmesi açılırsa pencere otomatik minimize edilir.
              </span>
            </button>
          </div>
        </div>

        <hr className="border-slate-800/80" />

        {/* Whitelist Keywords */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Beyaz Liste Anahtar Kelimeleri (İstisnalar)
          </h4>
          <p className="text-[11px] text-slate-400 mb-3">
            Video başlığında bu kelimeler geçtiğinde YouTube dikkat dağıtıcı sayılmaz (teknik video / müzik):
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {form.whitelistKeywords.map((kw) => (
              <span
                key={kw}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg flex items-center space-x-1.5"
              >
                <span>{kw}</span>
                <button
                  onClick={() => handleRemoveKeyword(kw)}
                  className="text-slate-400 hover:text-rose-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              placeholder="Yeni anahtar kelime ekle (örn: rust, kubernetes, podcast)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={handleAddKeyword}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-xl border border-slate-700 flex items-center space-x-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Ekle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
