import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';
import {
  subscribeMedications,
  subscribeIntakeLogs,
  subscribeAllIntakeLogs,
  subscribePRNLogs,
  addMedication,
  updateMedication,
  deleteMedication,
  logDoseTaken,
  deleteIntakeLog,
  logPRN,
  deletePRNLog,
  subscribeUserProfile,
  saveUserProfile,
} from '../services/firestore';
import { checkDrugInteractions } from '../services/fdaApi';

const MedicationContext = createContext(null);

export function MedicationProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;

  // State
  const [medications, setMedications] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [prnLogs, setPRNLogs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const notifRef = useRef([]);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Real-time subscriptions
  useEffect(() => {
    if (!uid) {
      setMedications([]);
      setTodayLogs([]);
      setAllLogs([]);
      setPRNLogs([]);
      setUserProfile(null);
      setLoadingMeds(false);
      return;
    }
    setLoadingMeds(true);

    const unsubMeds = subscribeMedications(uid, (meds) => {
      setMedications(meds);
      setLoadingMeds(false);
    });
    const unsubToday = subscribeIntakeLogs(uid, today, setTodayLogs);
    const unsubAll = subscribeAllIntakeLogs(uid, setAllLogs);
    const unsubPRN = subscribePRNLogs(uid, setPRNLogs);
    const unsubProfile = subscribeUserProfile(uid, setUserProfile);

    return () => {
      unsubMeds();
      unsubToday();
      unsubAll();
      unsubPRN();
      unsubProfile();
    };
  }, [uid, today]);

  // Check drug interactions whenever medications change
  useEffect(() => {
    if (medications.length < 2) {
      setInteractions([]);
      return;
    }
    checkDrugInteractions(medications).then(setInteractions);
  }, [medications]);

  // Notification engine — useEffect watching medication schedules
  useEffect(() => {
    if (!medications.length) return;

    const checkSchedules = () => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      const newNotifs = [];

      medications.forEach((med) => {
        if (!med.schedule || med.status !== 'active') return;
        med.schedule.forEach((scheduleTime) => {
          const [h, m] = scheduleTime.split(':').map(Number);
          const schedDate = new Date();
          schedDate.setHours(h, m, 0, 0);
          const diffMin = (schedDate - now) / 60000;

          // Notify if medication is due in next 15 minutes
          if (diffMin >= 0 && diffMin <= 15) {
            const alreadyLogged = todayLogs.some(
              (l) => l.medicationId === med.id && l.scheduledTime === scheduleTime
            );
            if (!alreadyLogged) {
              const key = `${med.id}-${scheduleTime}`;
              if (!notifRef.current.includes(key)) {
                newNotifs.push({
                  id: key,
                  type: 'reminder',
                  title: `Time for ${med.brandName}`,
                  message: `${med.dosage} — scheduled at ${scheduleTime}`,
                  medicationId: med.id,
                  scheduledTime: scheduleTime,
                  createdAt: new Date().toISOString(),
                });
                notifRef.current.push(key);
              }
            }
          }

          // Overdue notification (30+ minutes past)
          if (diffMin < -30 && diffMin > -120) {
            const alreadyLogged = todayLogs.some(
              (l) => l.medicationId === med.id && l.scheduledTime === scheduleTime
            );
            if (!alreadyLogged) {
              const key = `overdue-${med.id}-${scheduleTime}`;
              if (!notifRef.current.includes(key)) {
                newNotifs.push({
                  id: key,
                  type: 'overdue',
                  title: `Missed dose: ${med.brandName}`,
                  message: `Scheduled at ${scheduleTime} — please take now or skip`,
                  medicationId: med.id,
                  scheduledTime: scheduleTime,
                  createdAt: new Date().toISOString(),
                });
                notifRef.current.push(key);
              }
            }
          }
        });
      });

      if (newNotifs.length > 0) {
        setNotifications((prev) => [...newNotifs, ...prev].slice(0, 20));
      }
    };

    checkSchedules();
    const interval = setInterval(checkSchedules, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [medications, todayLogs]);

  // ---- CRUD Actions ----

  const addMed = useCallback(async (med) => {
    await addMedication(uid, med);
  }, [uid]);

  const updateMed = useCallback(async (id, updates) => {
    await updateMedication(id, updates);
  }, []);

  const removeMed = useCallback(async (id) => {
    await deleteMedication(id);
  }, []);

  const markDoseTaken = useCallback(async (med, scheduledTime) => {
    await logDoseTaken(uid, {
      medicationId: med.id,
      medicationName: med.brandName,
      dosage: med.dosage,
      scheduledTime,
      date: today,
      notes: '',
    });
    // Deduct from pill count
    if (med.pillCount > 0) {
      await updateMedication(med.id, { pillCount: med.pillCount - 1 });
    }
  }, [uid, today]);

  const undoDose = useCallback(async (logId, med) => {
    await deleteIntakeLog(logId);
    if (med) {
      await updateMedication(med.id, { pillCount: (med.pillCount || 0) + 1 });
    }
  }, []);

  const addPRNLog = useCallback(async (log) => {
    await logPRN(uid, log);
  }, [uid]);

  const removePRNLog = useCallback(async (id) => {
    await deletePRNLog(id);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    await saveUserProfile(uid, updates);
  }, [uid]);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Memoized derived data
  const todayProgress = useMemo(() => {
    let total = 0;
    let taken = 0;
    medications.filter((m) => m.status === 'active').forEach((med) => {
      const schedCount = med.schedule?.length || 0;
      total += schedCount;
      taken += todayLogs.filter((l) => l.medicationId === med.id).length;
    });
    return { total, taken, percent: total > 0 ? Math.round((taken / total) * 100) : 0 };
  }, [medications, todayLogs]);

  const lowStockMeds = useMemo(
    () => medications.filter((m) => m.pillCount !== undefined && m.pillCount <= 7 && m.pillCount >= 0),
    [medications]
  );

  const severeInteractions = useMemo(
    () => interactions.filter((i) => i.severity === 'severe'),
    [interactions]
  );

  return (
    <MedicationContext.Provider
      value={{
        medications,
        todayLogs,
        allLogs,
        prnLogs,
        userProfile,
        interactions,
        severeInteractions,
        notifications,
        loadingMeds,
        todayProgress,
        lowStockMeds,
        today,
        addMed,
        updateMed,
        removeMed,
        markDoseTaken,
        undoDose,
        addPRNLog,
        removePRNLog,
        updateProfile,
        dismissNotification,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
}

export function useMedication() {
  const ctx = useContext(MedicationContext);
  if (!ctx) throw new Error('useMedication must be used within MedicationProvider');
  return ctx;
}
