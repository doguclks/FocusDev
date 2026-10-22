import { Notification } from 'electron';
import { NudgeEvent } from './types';

export class NudgeManager {
  private consecutiveYouTubeSeconds = 0;
  private lastAlertTime = 0;
  private alertCooldownSeconds = 120; // At least 2 minutes between nudge alerts unless dismissed
  private onNudgeCallback: (event: NudgeEvent) => void;

  constructor(onNudge: (event: NudgeEvent) => void) {
    this.onNudgeCallback = onNudge;
  }

  public tick(isYouTubeForeground: boolean, currentTitle: string, thresholdMinutes: number): void {
    if (isYouTubeForeground) {
      this.consecutiveYouTubeSeconds++;

      const thresholdSeconds = thresholdMinutes * 60;
      const now = Date.now();

      if (
        this.consecutiveYouTubeSeconds >= thresholdSeconds &&
        now - this.lastAlertTime > this.alertCooldownSeconds * 1000
      ) {
        this.triggerNudge(currentTitle, thresholdMinutes);
        this.lastAlertTime = now;
      }
    } else {
      // Switched away from YouTube
      // Reset counter
      this.consecutiveYouTubeSeconds = 0;
    }
  }

  public snooze(minutes = 5): void {
    this.lastAlertTime = Date.now() + (minutes * 60 * 1000);
    this.consecutiveYouTubeSeconds = 0;
  }

  public reset(): void {
    this.consecutiveYouTubeSeconds = 0;
    this.lastAlertTime = 0;
  }

  public getConsecutiveYouTubeSeconds(): number {
    return this.consecutiveYouTubeSeconds;
  }

  private triggerNudge(videoTitle: string, thresholdMinutes: number): void {
    const event: NudgeEvent = {
      consecutiveYouTubeSeconds: this.consecutiveYouTubeSeconds,
      thresholdMinutes,
      videoTitle,
      timestamp: Date.now(),
    };

    // Callback for Electron renderer UI
    this.onNudgeCallback(event);

    // Native Windows OS Notification
    if (Notification.isSupported()) {
      const notif = new Notification({
        title: 'Focus Dev 🎯',
        body: `${thresholdMinutes} dakikadır aralıksız YouTube'dasın. Kodun hazır mı? Derin Odak seni bekliyor!`,
        silent: false,
      });
      notif.show();
    }
  }
}
