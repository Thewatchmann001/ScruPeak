import { openDB, DBSchema } from 'idb';

interface LandDB extends DBSchema {
  points: {
    key: string;
    value: {
      id: string;
      latitude: number;
      longitude: number;
      timestamp: number;
      synced: boolean;
      accuracy: number;
    };
  };
}

const dbPromise = openDB<LandDB>('land-field-tool', 1, {
  upgrade(db) {
    db.createObjectStore('points', { keyPath: 'id' });
  },
});

export const savePoint = async (lat: number, lng: number, accuracy: number) => {
  const point = {
    id: crypto.randomUUID(),
    latitude: lat,
    longitude: lng,
    timestamp: Date.now(),
    synced: false,
    accuracy
  };
  return (await dbPromise).put('points', point);
};

export const getAllPoints = async () => {
  return (await dbPromise).getAll('points');
};

export const getUnsyncedPoints = async () => {
  const points = await getAllPoints();
  return points.filter(p => !p.synced);
};
