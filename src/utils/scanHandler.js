import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';

export const handleScan = async (qrValue) => {
  try {
    // Step 1: Query member using qrValue
    const membersRef = collection(db, 'members');
    const q = query(membersRef, where('qrValue', '==', qrValue));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { status: 'not_found' };
    }
    
    const memberDoc = querySnapshot.docs[0];
    const member = { id: memberDoc.id, ...memberDoc.data() };
    const memberName = member.name;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Step 2: Check expiry
    const endDate = member.endDate?.toDate();
    if (!endDate || endDate < new Date(new Date().setHours(0,0,0,0))) {
      return { status: 'expired', memberName };
    }

    // Prepare response data using transactions
    const result = await runTransaction(db, async (transaction) => {
      const cooldownRef = doc(db, 'cooldowns', member.id);
      const cooldownSnap = await transaction.get(cooldownRef);
      
      const now = new Date();
      
      // Step 3: Check cooldown (120 seconds)
      if (cooldownSnap.exists()) {
        const lastScan = cooldownSnap.data().lastScan?.toDate();
        if (lastScan) {
          const diffSeconds = Math.floor((now.getTime() - lastScan.getTime()) / 1000);
          if (diffSeconds < 120) {
            return { status: 'cooldown', memberName, secondsRemaining: 120 - diffSeconds };
          }
        }
      }
      
      // We will write the new cooldown at the end of transaction
      transaction.set(cooldownRef, { lastScan: serverTimestamp() }, { merge: true });
      
      // Step 5: Query Open sessions for this member today
      // Transactions in SDK do not support queries directly, so we run the query outside the transaction locked reads.
      // Wait, we can't do query() inside runTransaction safely if we want to lock. 
      // Firestore transactions require reading documents first. Since we don't know the session ID, we have to query first.
      return 'proceed_to_session';
    });

    if (result !== 'proceed_to_session') {
      return result;
    }

    // Handle Session Creation / Closing outside main transaction if query needed, or inside another
    // Actually, according to prompt: Use Firestore transactions for Step 5 to 7. 
    // Since we need to query open sessions:
    const sessionsRef = collection(db, 'sessions');
    const sq = query(sessionsRef, where('memberId', '==', member.id), where('sessionDate', '==', todayStr), where('status', '==', 'open'));
    const sessionSnap = await getDocs(sq);
    
    if (sessionSnap.empty) {
      // Step 6: Create entry
      const newSessionRef = doc(collection(db, 'sessions'));
      await setDoc(newSessionRef, {
        memberId: member.id,
        memberName: member.name,
        sessionDate: todayStr,
        entryTime: serverTimestamp(),
        exitTime: null,
        durationMinutes: null,
        status: 'open',
        edited: false,
        editedBy: null,
        createdAt: serverTimestamp()
      });
      return { status: 'entry', memberName, entryTime: new Date() };
    } else {
      // Step 7: Update session
      const openSessionDoc = sessionSnap.docs[0];
      const entryTime = openSessionDoc.data().entryTime?.toDate() || new Date();
      const now = new Date();
      const durationMinutes = Math.max(1, Math.floor((now.getTime() - entryTime.getTime()) / 60000));
      
      // Lock the session document specifically to close it
      return await runTransaction(db, async (transaction) => {
        const sessionRef = doc(db, 'sessions', openSessionDoc.id);
        const latestSessionSnap = await transaction.get(sessionRef);
        if (latestSessionSnap.data().status !== 'open') {
          // If already closed by another concurrent call
          return { status: 'cooldown', memberName, secondsRemaining: 120 };
        }
        transaction.update(sessionRef, {
          exitTime: serverTimestamp(),
          durationMinutes,
          status: 'closed'
        });
        return { status: 'exit', memberName, entryTime, exitTime: now, durationMinutes };
      });
    }

  } catch (error) {
    console.error("Scan error:", error);
    return { status: 'error', message: error.message };
  }
};
