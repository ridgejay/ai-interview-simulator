interface StoredInterviewData {
  candidateName: string;
  responses: Array<{
    questionId: string;
    answer: string;
    timestamp: Date;
    isWeak?: boolean;
    hasSpecifics?: boolean;
    hasRealExample?: boolean;
    coversCorePoints?: boolean;
    reasoning?: string;
  }>;
  usedQuestions: string[];
  usedQuestionTypes: string[];
  startTime?: Date;
  currentState: string;
}

export class InterviewStorage {
  private static readonly STORAGE_KEY = 'interview_session';
  private static readonly BACKUP_KEY = 'interview_backup';

  static saveSession(data: any): void {
    try {
      // Create backup of previous session
      const existing = localStorage.getItem(this.STORAGE_KEY);
      if (existing) {
        localStorage.setItem(this.BACKUP_KEY, existing);
      }

      // Save current session
      const serialized = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save interview session:', error);
    }
  }

  static loadSession(): StoredInterviewData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      if (parsed.startTime) {
        parsed.startTime = new Date(parsed.startTime);
      }
      
      parsed.responses = parsed.responses?.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp)
      })) || [];

      return parsed;
    } catch (error) {
      console.error('Failed to load interview session:', error);
      return null;
    }
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear interview session:', error);
    }
  }

  static clearAllSessionData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.BACKUP_KEY);
      // Clear any other interview-related keys
      Object.keys(localStorage).forEach(key => {
        if (key.includes('interview') || key.includes('session')) {
          localStorage.removeItem(key);
        }
      });
      // Clear session storage too
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear all session data:', error);
    }
  }

  static hasStoredSession(): boolean {
    try {
      return localStorage.getItem(this.STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  static getBackupSession(): StoredInterviewData | null {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY);
      if (!backup) return null;
      return JSON.parse(backup);
    } catch {
      return null;
    }
  }
}

// Auto-save functionality
export function useAutoSave(state: any, enabled: boolean = true) {
  const saveInterval = 30000; // 30 seconds

  if (typeof window !== 'undefined' && enabled) {
    // Save on state changes (debounced)
    let saveTimeout: NodeJS.Timeout;
    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        InterviewStorage.saveSession(state);
      }, 1000);
    };

    // Save immediately on important state changes
    if (state.currentState !== 'landing') {
      debouncedSave();
    }

    // Periodic auto-save
    const intervalId = setInterval(() => {
      if (state.currentState !== 'landing') {
        InterviewStorage.saveSession(state);
      }
    }, saveInterval);

    // Save on page unload
    const handleBeforeUnload = () => {
      InterviewStorage.saveSession(state);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(saveTimeout);
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }
}