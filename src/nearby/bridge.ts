import type { NearbyLobbyState, NearbyPlatform } from './types';

export interface AnchorGridNearbyNativeBridge {
  platform: 'android' | 'ios';
  available?: boolean;

  /**
   * Starts advertising a public AnchorGrid room nearby.
   * No invitation code is exposed to the player.
   */
  advertisePublicRoom?: (payload: string) => Promise<void>;

  /**
   * Starts scanning for nearby public AnchorGrid rooms.
   */
  discoverPublicRooms?: () => Promise<void>;

  /**
   * Sends a small JSON message to connected nearby peers.
   */
  broadcast?: (payload: string) => Promise<void>;

  /**
   * Stops advertising/discovery and closes nearby links.
   */
  stop?: () => Promise<void>;
}

declare global {
  interface Window {
    AnchorGridNearby?: AnchorGridNearbyNativeBridge;
  }
}

export function nearbyNativeAvailable() {
  return Boolean(
    window.AnchorGridNearby &&
    window.AnchorGridNearby.available !== false
  );
}

export function nearbyPlatform(): NearbyPlatform {
  const platform = window.AnchorGridNearby?.platform;
  if (platform === 'android' || platform === 'ios') return platform;
  return 'web';
}

export async function advertiseNearbyLobby(lobby: NearbyLobbyState) {
  const bridge = window.AnchorGridNearby;
  if (!bridge?.advertisePublicRoom) return false;

  await bridge.advertisePublicRoom(JSON.stringify({
    version: 1,
    type: 'anchorgrid-public-room',
    lobbyId: lobby.id,
    mode: lobby.mode,
    themeId: lobby.themeId,
    hostDeviceId: lobby.hostDeviceId
  }));

  return true;
}

export async function stopNearbyBridge() {
  await window.AnchorGridNearby?.stop?.();
}
