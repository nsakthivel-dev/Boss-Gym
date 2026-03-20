import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export const runMidnightCleanup = async () => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const sessionsRef = collection(db, 'sessions');
    
    // Find all open sessions from before today
    // Find all open sessions and filter by date in memory to avoid composite index
    const q = query(sessionsRef, where('status', '==', 'open'));
    const snapshot = await getDocs(q);

    const oldSessions = snapshot.docs.filter(d => d.data().sessionDate < todayStr);
    
    const updates = oldSessions.map(sessionDoc => {
      const sessionDate = sessionDoc.data().sessionDate;
      const entryTime = sessionDoc.data().entryTime?.toDate();
      
      // Calculate 23:59 of that sessionDate
      const exitTimeObj = new Date(sessionDate + 'T23:59:59');
      
      let durationMinutes = 0;
      if (entryTime) {
        durationMinutes = Math.floor((exitTimeObj.getTime() - entryTime.getTime()) / 60000);
      }
      
      return updateDoc(doc(db, 'sessions', sessionDoc.id), {
        exitTime: exitTimeObj,
        status: 'no-exit',
        durationMinutes: durationMinutes > 0 ? durationMinutes : 0
      });
    });
    
    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`Cleaned up ${updates.length} no-exit sessions`);
    }
  } catch (error) {
    console.error("Midnight cleanup error:", error);
  }
};
