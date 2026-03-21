import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';

export const runMidnightCleanup = async () => {
  try {
    const today = new Date().toISOString().split("T")[0]
    const q = query(
      collection(db, "sessions"),
      where("status", "==", "open"),
      where("sessionDate", "<", today)
    )
    const snapshot = await getDocs(q)
    
    const updates = [];
    snapshot.forEach((docSnap) => {
      const session = docSnap.data()
      const entryTime = session.entryTime.toDate()
      const autoExit = new Date(session.sessionDate + "T23:59:00")
      const durationMinutes = Math.round((autoExit - entryTime) / 60000)
      
      updates.push(updateDoc(doc(db, "sessions", docSnap.id), {
        exitTime: Timestamp.fromDate(autoExit),
        durationMinutes: durationMinutes,
        status: "closed"
      }));
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`Cleaned up ${updates.length} no-exit sessions`);
    }
  } catch (error) {
    console.error("Midnight cleanup error:", error);
  }
};

