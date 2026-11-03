import {
  Discipline,
  Schedule,
  StudySession,
  ScheduleOccurrence,
  TimerState,
} from '../types';

const DB_NAME = 'StudyTrackDB';
const DB_VERSION = 1;

class StudyTrackDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('disciplines')) {
          const store = db.createObjectStore('disciplines', { keyPath: 'id' });
          store.createIndex('archived', 'archived', { unique: false });
        }

        if (!db.objectStoreNames.contains('schedules')) {
          const store = db.createObjectStore('schedules', { keyPath: 'id' });
          store.createIndex('disciplineId', 'disciplineId', { unique: false });
          store.createIndex('dayOfWeek', 'dayOfWeek', { unique: false });
        }

        if (!db.objectStoreNames.contains('studySessions')) {
          const store = db.createObjectStore('studySessions', { keyPath: 'id' });
          store.createIndex('disciplineId', 'disciplineId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('scheduleOccurrences')) {
          const store = db.createObjectStore('scheduleOccurrences', { keyPath: 'id' });
          store.createIndex('scheduleId', 'scheduleId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('appState')) {
          db.createObjectStore('appState', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB read fallback for ${storeName}:`, err);
      const raw = localStorage.getItem(`studytrack_${storeName}`);
      return raw ? JSON.parse(raw) : [];
    }
  }

  private async putInStore<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB write error for ${storeName}:`, err);
    }
    // Also backup to localStorage for rapid resilience
    try {
      const current = await this.getAllFromStore<T>(storeName);
      const filtered = current.filter(x => x.id !== item.id);
      localStorage.setItem(`studytrack_${storeName}`, JSON.stringify([...filtered, item]));
    } catch {
      // ignore localstorage quota limits
    }
  }

  private async deleteFromStore(storeName: string, id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB delete error for ${storeName}:`, err);
    }
    try {
      const raw = localStorage.getItem(`studytrack_${storeName}`);
      if (raw) {
        const list: { id: string }[] = JSON.parse(raw);
        localStorage.setItem(`studytrack_${storeName}`, JSON.stringify(list.filter(x => x.id !== id)));
      }
    } catch {
      // ignore
    }
  }

  // Disciplines
  async getDisciplines(): Promise<Discipline[]> {
    return this.getAllFromStore<Discipline>('disciplines');
  }

  async saveDiscipline(discipline: Discipline): Promise<void> {
    return this.putInStore<Discipline>('disciplines', discipline);
  }

  async deleteDiscipline(id: string): Promise<void> {
    return this.deleteFromStore('disciplines', id);
  }

  // Schedules
  async getSchedules(): Promise<Schedule[]> {
    return this.getAllFromStore<Schedule>('schedules');
  }

  async saveSchedule(schedule: Schedule): Promise<void> {
    return this.putInStore<Schedule>('schedules', schedule);
  }

  async deleteSchedule(id: string): Promise<void> {
    return this.deleteFromStore('schedules', id);
  }

  // StudySessions
  async getStudySessions(): Promise<StudySession[]> {
    return this.getAllFromStore<StudySession>('studySessions');
  }

  async saveStudySession(session: StudySession): Promise<void> {
    return this.putInStore<StudySession>('studySessions', session);
  }

  async deleteStudySession(id: string): Promise<void> {
    return this.deleteFromStore('studySessions', id);
  }

  // ScheduleOccurrences
  async getScheduleOccurrences(): Promise<ScheduleOccurrence[]> {
    return this.getAllFromStore<ScheduleOccurrence>('scheduleOccurrences');
  }

  async saveScheduleOccurrence(occurrence: ScheduleOccurrence): Promise<void> {
    return this.putInStore<ScheduleOccurrence>('scheduleOccurrences', occurrence);
  }

  // Timer State
  async getTimerState(): Promise<TimerState | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('appState', 'readonly');
        const store = tx.objectStore('appState');
        const req = store.get('activeTimer');
        req.onsuccess = () => {
          if (req.result && req.result.state) {
            resolve(req.result.state as TimerState);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      const raw = localStorage.getItem('studytrack_timer');
      return raw ? JSON.parse(raw) : null;
    }
  }

  async saveTimerState(state: TimerState | null): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('appState', 'readwrite');
        const store = tx.objectStore('appState');
        if (state) {
          const req = store.put({ key: 'activeTimer', state });
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } else {
          const req = store.delete('activeTimer');
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        }
      });
    } catch {
      // fallback
    }
    if (state) {
      localStorage.setItem('studytrack_timer', JSON.stringify(state));
    } else {
      localStorage.removeItem('studytrack_timer');
    }
  }
}

export const dbService = new StudyTrackDatabase();
