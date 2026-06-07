// mDNS service advertisement using bonjour-service
// Broadcasts "_localshare._tcp" so clients can find the hub without knowing its IP

import Bonjour from 'bonjour-service';

let bonjourInstance: InstanceType<typeof Bonjour> | null = null;

/**
 * Advertise the hub on the local network via mDNS.
 * Other devices can discover it by browsing for "_localshare._tcp".
 */
export function advertiseService(port: number): void {
  bonjourInstance = new Bonjour();

  bonjourInstance.publish({
    name: 'LocalShare Hub',
    type: 'localshare',
    port,
    txt: { version: '1.0.0' },
  });

  console.log(`📡 mDNS: advertising LocalShare hub on port ${port}`);
}

/**
 * Browse for other LocalShare hubs on the network.
 * Returns a cleanup function.
 */
export function browseForHubs(
  onFound: (name: string, host: string, port: number) => void,
  onLost: (name: string) => void,
): () => void {
  const bonjour = new Bonjour();

  const browser = bonjour.find({ type: 'localshare' }, (service) => {
    const host = service.addresses?.[0] ?? service.host;
    onFound(service.name, host, service.port);
  });

  browser.on('down', (service) => {
    onLost(service.name);
  });

  return () => {
    browser.stop();
    bonjour.destroy();
  };
}

/** Gracefully unpublish on shutdown */
export function stopAdvertising(): void {
  if (bonjourInstance) {
    bonjourInstance.unpublishAll(() => {
      bonjourInstance?.destroy();
      console.log('📡 mDNS: service unpublished');
    });
  }
}
