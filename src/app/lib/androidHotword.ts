import { Capacitor, registerPlugin } from "@capacitor/core";

interface HotwordServicePlugin {
  start(options: { emergencyNumber: string; contactNumbers: string[] }): Promise<void>;
  stop(): Promise<void>;
  syncConfig(options: { emergencyNumber: string; contactNumbers: string[] }): Promise<void>;
  status(): Promise<{ running: boolean }>;
}

const HotwordService = registerPlugin<HotwordServicePlugin>("HotwordService");

function isAndroidNative(): boolean {
  return Capacitor.getPlatform() === "android";
}

export async function enableAndroidBackgroundProtection(emergencyNumber: string, contactNumbers: string[]) {
  if (!isAndroidNative()) return;
  await HotwordService.start({ emergencyNumber, contactNumbers });
}

export async function syncAndroidEmergencyConfig(emergencyNumber: string, contactNumbers: string[]) {
  if (!isAndroidNative()) return;
  await HotwordService.syncConfig({ emergencyNumber, contactNumbers });
}

export async function stopAndroidBackgroundProtection() {
  if (!isAndroidNative()) return;
  await HotwordService.stop();
}

export async function getAndroidProtectionStatus(): Promise<boolean> {
  if (!isAndroidNative()) return false;
  const response = await HotwordService.status();
  return !!response.running;
}
