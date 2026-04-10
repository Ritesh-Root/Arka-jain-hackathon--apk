import { Capacitor, registerPlugin } from "@capacitor/core";

interface HotwordServicePlugin {
  start(options: { emergencyNumber: string; contactNumbers: string[]; shakeEnabled: boolean }): Promise<void>;
  stop(): Promise<void>;
  syncConfig(options: { emergencyNumber: string; contactNumbers: string[]; shakeEnabled: boolean }): Promise<void>;
  status(): Promise<{ running: boolean }>;
  permissionsStatus(): Promise<{
    audio: boolean;
    camera: boolean;
    call: boolean;
    sms: boolean;
    notifications: boolean;
  }>;
  openAppSettings(): Promise<void>;
}

const HotwordService = registerPlugin<HotwordServicePlugin>("HotwordService");

function isAndroidNative(): boolean {
  return Capacitor.getPlatform() === "android";
}

export async function enableAndroidBackgroundProtection(
  emergencyNumber: string,
  contactNumbers: string[],
  shakeEnabled: boolean
) {
  if (!isAndroidNative()) return;
  await HotwordService.start({ emergencyNumber, contactNumbers, shakeEnabled });
}

export async function syncAndroidEmergencyConfig(
  emergencyNumber: string,
  contactNumbers: string[],
  shakeEnabled: boolean
) {
  if (!isAndroidNative()) return;
  await HotwordService.syncConfig({ emergencyNumber, contactNumbers, shakeEnabled });
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

export async function openAndroidPermissionSettings() {
  if (!isAndroidNative()) return;
  await HotwordService.openAppSettings();
}

export async function getAndroidPermissionStates() {
  if (!isAndroidNative()) {
    return {
      audio: false,
      camera: false,
      call: false,
      sms: false,
      notifications: false,
    };
  }

  return await HotwordService.permissionsStatus();
}
