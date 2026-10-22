import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface VimCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VimCheatSheetModal: React.FC<VimCheatSheetModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleModalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.ctrlKey && e.key === '[')) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleModalKey);
    return () => window.removeEventListener('keydown', handleModalKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: '📋 Gezinme & Seçim (NORMAL Mod)',
      shortcuts: [
        { key: 'j / ↓', desc: 'Aşağıdaki göreve veya nota geç' },
        { key: 'k / ↑', desc: 'Yukarıdaki göreve veya nota geç' },
        { key: 'Enter / Space', desc: 'Seçili görevin/notun detayını aşağı doğru genişlet / daralt' },
        { key: 'h / l', desc: 'Günlük ajandada Önceki Gün (h) / Sonraki Gün (l)' },
        { key: 't', desc: 'Doğrudan Bugünün ajandasına atla' },
        { key: 'Tab', desc: 'Günlük Akış ile Genel Notlar sekmeleri arasında geçiş yap' },
        { key: '/', desc: 'Arama / filtreleme kutusuna odaklan' },
      ],
    },
    {
      title: '⚡ Görev & Not Eylemleri',
      shortcuts: [
        { key: 'x', desc: 'Seçili görevi Tamamlandı / Yapılacak olarak işaretle' },
        { key: 'o', desc: 'Yeni görev ekleme kutusuna odaklan (INSERT)' },
        { key: 'i / e', desc: 'Seçili görevi veya notu düzenlemeye başla (INSERT)' },
        { key: 'd', desc: 'Seçili görevi veya notu sil' },
        { key: 'Esc / Ctrl + [', desc: 'Yazmayı bitir, kutudan çık ve NORMAL moda dön' },
        { key: 'Alt + Shift + N', desc: 'Global Hızlı Görev / Not Yakalama (Spotlight) penceresini aç' },
      ],
    },
    {
      title: '⚡ Hızlı Yakalama (Spotlight) Kısayolları',
      shortcuts: [
        { key: 'o / i', desc: 'Metin alanına odaklan ve yazmaya başla (INSERT mod)' },
        { key: 'v', desc: 'Doğrudan Sesli Dikteyi (Windows Sesle Yazma) başlat' },
        { key: '1 / 2 / 3', desc: 'Hedef seç: 1: Todo, 2: Standup, 3: Genel Not' },
        { key: 't / h / l', desc: 'Hedefler arasında sırayla dolaş' },
        { key: 'p / Tab', desc: 'Önceliği değiştir (Normal ➔ Yüksek ➔ Düşük)' },
        { key: 'Enter', desc: 'Kaydet ve pencereyi kapat' },
        { key: 'Esc / Ctrl + [', desc: 'INSERT modundaysa NORMAL moda dön, NORMAL moddaysa pencereyi kapat' },
      ],
    },
    {
      title: '📋 Hızlı Görevler HUD (Alt + Shift + M)',
      shortcuts: [
        { key: 'Alt + Shift + M', desc: 'Bugünün görevlerini gösteren yüzen HUD penceresini aç / kapat' },
        { key: 'j / k', desc: 'Görevler arasında aşağı / yukarı gezin' },
        { key: 'x / Space / Enter', desc: 'Seçili görevi anında tamamla veya geri al' },
        { key: 'e', desc: 'Seçili görevin akordeon detayını aç / kapat' },
        { key: 'o / n', desc: 'HUD içerisinden hızlı yeni görev ekle' },
        { key: 'Tab', desc: 'Filtreyi değiştir (Tümü ➔ Yapılacaklar ➔ Bitenler)' },
        { key: 'd', desc: 'Seçili görevi sil' },
        { key: 'q / Esc', desc: 'HUD penceresini kapat' },
      ],
    },
    {
      title: '🎙️ Sesli Komut & Zeka',
      shortcuts: [
        { key: 'v', desc: 'Sesli Dikteyi (Mikrofon) başlat / durdur' },
        { key: '?', desc: 'Bu Vim Kısayol Rehberini aç / kapat' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-2.5 mb-1">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">Vim Klavye Kısayolları Rehberi</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                -- NORMAL --
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Fareye dokunmadan tüm notlar ve görevler arasında klavyenizle ışık hızında gezinin.
            </p>
          </div>
        </div>

        {/* Shortcut Groups */}
        <div className="space-y-4 mt-5">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800/80">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                <span>{group.title}</span>
              </h4>
              <div className="space-y-1.5">
                {group.shortcuts.map((sc) => (
                  <div key={sc.key} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-900/60 transition-colors">
                    <span className="text-slate-400">{sc.desc}</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-emerald-300 border border-slate-700 rounded-md font-mono text-[11px] font-bold shadow-sm">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tip at bottom */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>İstediğiniz an klavyeden <kbd className="font-mono text-slate-400 bg-slate-800 px-1 py-0.5 rounded">?</kbd> tuşuna basarak bu rehberi açabilirsiniz.</span>
          <button
            onClick={onClose}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg transition-colors font-medium ml-2"
          >
            Kapat (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
