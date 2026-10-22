# 🎯 Focus Dev

<div align="center">

![Electron](https://img.shields.io/badge/Electron-33.x-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D6?style=for-the-badge&logo=windows&logoColor=white)

**Yazılımcılar ve Mühendisler için Akıllı Odaklanma, Gerçek Zamanlı YouTube Takibi ve Vim Destekli Günlük Ajanda**

[Özellikler](#-özellikler) • [Kısayollar](#-klavye-kısayolları) • [Mimari](#-mimari) • [Kurulum](#-kurulum--çalıştırma)

</div>

---

## 💡 Neden Focus Dev?

Geliştiriciler kod yazarken arka planda müzik/lofi dinler veya teknik bir videoya bakmak isterken kolayca YouTube önerilerinde kaybolabilir. Standart site engelleyiciler arka planda çalan müziği de engelleyerek motivasyonu düşürür.

**Focus Dev**, Windows `user32.dll` API'lerini kullanarak **yalnızca ön planda (foreground) aktif izlenen pencereleri** sıfır CPU tüketimiyle takip eder:
- YouTube arkada müzik çalarken siz **VS Code**, **WezTerm**, **Antigravity** veya **Terminal**'de kod yazıyorsanız, YouTube sayacı durur ve üretken çalışma süreniz sayılır.
- YouTube'da aralıksız dikkat dağıtıcı video izlendiğinde nazikçe uyarır (**Gentle Nudge**).
- Tüm görevlerinizi, standup notlarınızı ve günlük akışınızı klavyeden elinizi kaldırmadan **Vim ergonomisiyle** yönetmenizi sağlar.

---

## ✨ Özellikler

### ⚡ 1. Global Hızlı Görev & Not Yakalama (Spotlight)
- Windows genelinde hangi uygulamada olursanız olun **`Alt + Shift + N`** kısayolu ile ekranın ortasında minimalist bir Spotlight açılır.
- **Vim Normal & Insert Modu:** Yanlışlıkla harf girmeyi engellemek için Normal modda açılır; **`o`** veya **`i`** ile yazmaya başlanır, **`Ctrl + [`** veya **`Esc`** ile yazma modundan çıkılır.
- **Klavye ile Hedef Seçimi:**
  - `1`: **Todo** (Günlük Görev)
  - `2`: **Standup** (Günlük Ajanda Maddesi)
  - `3`: **Not** (Genel Not Defteri `#hızlı-not`)
  - `t` veya `h / l`: Hedefler arasında tek tuşla geçiş.
- **`Tab` veya `p`**: Görev önceliğini döngüsel değiştirme (`Normal` ➔ `Yüksek 🔥` ➔ `Düşük`).
- **`Ctrl + Q`**: Herhangi bir moddayken anında iptal edip kapatma.
- **Canlı Senkronizasyon:** Kaydedilen görev ve notlar arka planda SQLite'a yazılır ve ana ekranda anında güncellenir.

### 📋 2. Vim Ergonomili Notlar & Ajanda
- **Tam Klavye Kontrolü:** Fareye dokunmadan `j / k` ile görevler arasında gezinme.
- **Akordeon Detay Görünümü:** Uzun notlar veya görevler için `Enter` veya `Space` tuşuna basarak aşağı doğru açılan şık detay çekmecesi.
- **Inline Düzenleme & Silme:** `i` veya `e` ile görevi satır içi düzenleme, `d` ile silme, `x` ile tamamlandı işaretleme.
- **Tarihler Arası Geçiş:** `h / l` ile dünün/yarının ajandasına geçiş, `t` ile bugüne dönüş.

### 🎙️ 3. Windows Sesle Yazma & Dikte (Voice Typing)
- Dahili mikrofon butonuna tıklayarak veya Normal modda **`v`** tuşuna basarak Windows Yerleşik Sesle Yazma (**`Win + H`**) servisi tetiklenir.
- Türkçe dikte desteğiyle sesli komut doğrudan aktif input alanına yazıya dökülür.

### 💻 4. Geliştirici Odaklı Süreç Tanıma (WezTerm & Terminaller)
- Rust tabanlı GPU hızlandırmalı **WezTerm** terminalini (`wezterm-gui.exe`, `wezterm`) doğrudan algılar.
- **Windows Terminal**, **PowerShell**, **CMD**, **Git-Bash**, **Alacritty**, **Warp** gibi geliştirici terminallerini ve editörleri doğrudan **"Üretken Kodlama & Araçlar"** kategorisine dahil eder.

### 🔔 5. Akıllı Dürtme (Gentle Nudge)
- YouTube'da aralıksız 5 dakika geçirildiğinde ekranın sağ altında zarif bir bildirim belirir:  
  *"YouTube'da 5 dakikadır vakit geçiriyorsun. Kodun hazır mı? 🎯"*
- Bildirim üzerinden tek tıkla mola süresi (+5 dk) uzatılabilir veya video teknik/eğitim kategorisine eklenebilir.

### ⏱️ 6. Kişiselleştirilebilir Derin Odak (Custom Pomodoro)
- 15, 25, 45, 60 dakika veya slider ile belirlenen özel sürelerle derin odak oturumu başlatılabilir.
- Odak oturumu esnasında YouTube açılırsa pencereyi küçültme veya koruma kalkanı devreye girer.

### 🪟 7. Yüzen Mini Masa Saati & Zen Widget (PIP)
- **`Alt + P`** ile her zaman en üstte (Always on Top) kalabilen minimalist widget modu.
- Saat, Pomodoro sayacı ve Üretken Kodlama sayacı arasında tek tıkla geçiş.

### 📊 8. 09:00 - 18:00 Saatlik Isı Haritası & Raporlama
- Günün her saati için kodlama süresi ve dikkat dağınıklığı dağılımı.
- Gün Sonu Raporu: Odak skoru, tamamlanan görevler ve tek tıkla **Slack / Markdown** uyumlu Standup özeti kopyalama.

---

## ⌨️ Klavye Kısayolları

### Notlar & Ajanda (Vim NORMAL Mod)
| Kısayol | İşlev |
| :--- | :--- |
| `j` / `↓` | Aşağıdaki göreve/nota geç |
| `k` / `↑` | Yukarıdaki göreve/nota geç |
| `Enter` / `Space` | Seçili görevin detayını akordeon şeklinde aç / kapat |
| `o` | Yeni görev ekleme kutusuna odaklan (`INSERT` mod) |
| `i` / `e` | Seçili görevi yerinde düzenle (`INSERT` mod) |
| `x` | Seçili görevi Yapıldı / Yapılacak olarak işaretle |
| `d` | Seçili görevi sil |
| `h` / `l` | Önceki gün / Sonraki gün ajandasına geç |
| `t` | Doğrudan Bugünün ajandasına dön |
| `Tab` | Günlük Ajanda ile Genel Notlar sekmeleri arasında geçiş yap |
| `/` | Arama / filtreleme kutusuna odaklan |
| `v` | Sesli Dikteyi (Mikrofon) başlat / durdur |
| `?` | Vim Kısayol Rehberi modalını aç / kapat |
| `Esc` / `Ctrl + [` | Yazma modundan çık ve `NORMAL` moda dön |

### Global Hızlı Yakalama (Spotlight: `Alt + Shift + N`)
| Kısayol | İşlev |
| :--- | :--- |
| `Alt + Shift + N` | Windows genelinde Spotlight penceresini aç / kapat |
| `o` / `i` | Metin alanına odaklan (`INSERT` mod) |
| `v` | Doğrudan Sesli Dikteyi (Windows Sesle Yazma) başlat |
| `1` / `2` / `3` | Hedef seç (`1: Todo`, `2: Standup`, `3: Not`) |
| `t` veya `h / l` | Hedefler arasında sırayla dolaş |
| `Tab` / `p` | Öncelik derecesini değiştir (`Normal` ➔ `Yüksek` ➔ `Düşük`) |
| `Enter` | Görevi / Notu kaydet ve pencereyi kapat |
| `Ctrl + [` / `Esc` | Yazı yazılıyorsa `NORMAL` moda dön; Normal moddaysa pencereyi kapat |
| `Ctrl + Q` | Hangi modda olursa olsun pencereyi anında iptal edip kapat |

---

## 🏗️ Mimari

```mermaid
flowchart TD
    subgraph WindowsOS ["Windows İşletim Sistemi"]
        WinTracker["WinTracker.exe (C# .NET)"] -->|"user32.dll Foreground Window API (1Hz)"| WinAPI["Windows Window Manager"]
        VoiceTyping["Windows Sesle Yazma (Win + H)"]
    end

    subgraph ElectronCore ["Electron Ana Süreç"]
        MainProcess["main.ts (Electron Main)"]
        TrackerManager["tracker.ts (Aktivite Sınıflandırıcı)"]
        Storage["storage.ts / SQLite3 (focus_dev.db)"]
        Tray["System Tray & Global Shortcuts"]

        WinTracker -->|"JSON IPC (stdout)"| TrackerManager
        TrackerManager --> Storage
        Tray -->|"Alt+Shift+N"| MainProcess
    end

    subgraph FrontendApp ["Kullanıcı Arayüzü (React 18 + Vite)"]
        Dashboard["Dashboard & Saatlik Isı Haritası"]
        NotesView["Vim Destekli Notlar & Ajanda"]
        QuickCapture["Spotlight Hızlı Yakalama Penceresi"]
        MiniClock["Mini Desk Clock & Zen PIP Widget"]

        MainProcess -->|"IPC Bridges"| FrontendApp
    end
```

---

## 🚀 Kurulum & Çalıştırma

### Gereksinimler
- **İşletim Sistemi:** Windows 10 veya Windows 11 (64-bit)
- **Node.js:** v18 veya üstü
- **npm:** v9 veya üstü

### 1. Projeyi Klonlayın & Bağımlılıkları Kurun
```bash
git clone https://github.com/kullanici-adiniz/focus-dev.git
cd focus-dev
npm install
```

### 2. Geliştirici Modunda Çalıştırma (Hot-Reload)
```bash
npm run dev
```

### 3. Uygulamayı Derleme & Paketleme
```bash
# TypeScript ve Vite derlemesi
npm run build

# Bağımsız Windows (.exe) paketini üretme
npm run dist
```
Üretilen çalıştırılabilir dosya `dist-desktop/win-unpacked/Focus Dev.exe` dizininde hazır olacaktır.

---

## 📁 Proje Dizini

```
focus-dev/
├── assets/                  # Uygulama ikonları (.ico, .png)
├── bin-win/                 # Native C# WinTracker.exe ikili dosyası
├── electron/
│   ├── main.ts              # Electron ana süreç, tray ve kısayollar
│   ├── tracker.ts           # Süreç sınıflandırma (IDE, WezTerm, YouTube)
│   ├── storage.ts           # SQLite3 veritabanı sürücüsü & migrasyonlar
│   ├── database.ts          # SQLite tabloları (todos, logs, notes, stats)
│   ├── preload.ts           # Güvenli contextBridge IPC API'leri
│   └── win-helper/          # C# .NET WinTracker kaynak kodu
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx            # Canlı sayaçlar ve odak metrikleri
│   │   ├── NotesView.tsx            # Vim destekli not defteri ve ajanda
│   │   ├── QuickCaptureModal.tsx    # Global Spotlight hızlı yakalama
│   │   ├── MiniDeskClockWidget.tsx  # PIP masa saati widget'ı
│   │   ├── HourlyHeatmap.tsx        # 09:00 - 18:00 saatlik ısı haritası
│   │   ├── VimCheatSheetModal.tsx   # Kısayol rehberi
│   │   └── DailyReportModal.tsx     # Gün sonu standup raporu
│   ├── App.tsx              # Ana görünüm yönlendiricisi
│   └── types.ts             # Global TypeScript arayüz tanımları
├── package.json
└── README.md
```

---

## 📄 Lisans

Bu proje **MIT** lisansı ile korunmaktadır.
