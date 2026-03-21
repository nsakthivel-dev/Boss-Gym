import { db } from '../firebase/config';
import { doc, getDoc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

const randomDigits = () => Math.floor(100000 + Math.random() * 900000);

export const seedDatabase = async () => {
  if (!db) {
    console.warn("Seeding skipped: Database not initialized.");
    return;
  }
  try {
    // Check if already seeded
    const metaRef = doc(db, 'meta', 'seeded');
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists()) return;

    const now = new Date();
    const dayMs = 86400000;

    // Seed Plans
    const planData = [
      { name: 'Monthly', durationDays: 30, price: 999, active: true, createdAt: Timestamp.fromDate(new Date(now.getTime() - dayMs * 60)) },
      { name: 'Quarterly', durationDays: 90, price: 2499, active: true, createdAt: Timestamp.fromDate(new Date(now.getTime() - dayMs * 60)) },
      { name: 'Yearly', durationDays: 365, price: 7999, active: true, createdAt: Timestamp.fromDate(new Date(now.getTime() - dayMs * 60)) },
    ];
    const planRefs = [];
    for (const plan of planData) {
      const ref = await addDoc(collection(db, 'plans'), plan);
      planRefs.push({ id: ref.id, ...plan });
    }

    // Seed Members
    const membersData = [
      { name: 'Arjun Kumar', phone: '9876543210', email: 'arjun@example.com', planIndex: 0, daysOffset: -10 },
      { name: 'Priya Sharma', phone: '9876543211', email: 'priya@example.com', planIndex: 1, daysOffset: -20 },
      { name: 'Rahul Verma', phone: '9876543212', email: 'rahul@example.com', planIndex: 2, daysOffset: -5 },
      { name: 'Meena Nair', phone: '9876543213', email: 'meena@example.com', planIndex: 0, daysOffset: -25 },
      { name: 'Vikram Singh', phone: '9876543214', email: 'vikram@example.com', planIndex: 1, daysOffset: -15 },
      { name: 'Sunita Reddy', phone: '9876543215', email: 'sunita@example.com', planIndex: 2, daysOffset: -3 },
    ];
    const memberRefs = [];
    for (const m of membersData) {
      const plan = planRefs[m.planIndex];
      const startDate = new Date(now.getTime() + m.daysOffset * dayMs);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate.getTime() + plan.durationDays * dayMs);
      const status = endDate >= now ? 'active' : 'expired';
      const ref = await addDoc(collection(db, 'members'), {
        name: m.name, phone: m.phone, email: m.email,
        planId: plan.id, planName: plan.name,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        status,
        createdAt: Timestamp.fromDate(startDate),
        qrValue: '', // will be updated below
      });
      const qrValue = `GYM-${ref.id}-${randomDigits()}`;
      await setDoc(doc(db, 'members', ref.id), { qrValue }, { merge: true });
      memberRefs.push({ id: ref.id, name: m.name, qrValue });
    }

    // Seed Sessions — 15 sessions across last 7 days
    const statuses = ['closed', 'closed', 'closed', 'no-exit', 'open'];
    for (let i = 0; i < 15; i++) {
      const memberEntry = memberRefs[i % memberRefs.length];
      const daysAgo = Math.floor(i / 3);
      const sessionDate = new Date(now.getTime() - daysAgo * dayMs);
      sessionDate.setHours(0, 0, 0, 0);
      const sessionDateStr = sessionDate.toISOString().split('T')[0];
      const entryHour = 6 + (i % 8);
      const entryTime = new Date(sessionDate.getTime() + entryHour * 3600000);
      const status = daysAgo === 0 && i % 5 === 0 ? 'open' : (daysAgo > 0 && i % 5 === 3 ? 'no-exit' : 'closed');
      const exitTime = status === 'open' ? null : new Date(entryTime.getTime() + (45 + i * 5) * 60000);
      const durationMinutes = exitTime ? Math.floor((exitTime - entryTime) / 60000) : null;

      await addDoc(collection(db, 'sessions'), {
        memberId: memberEntry.id,
        memberName: memberEntry.name,
        sessionDate: sessionDateStr,
        entryTime: Timestamp.fromDate(entryTime),
        exitTime: exitTime ? Timestamp.fromDate(exitTime) : null,
        durationMinutes,
        status,
        edited: false,
        editedBy: null,
        createdAt: Timestamp.fromDate(entryTime),
      });
    }

    // Mark seeded
    await setDoc(metaRef, { exists: true, seededAt: Timestamp.fromDate(now) });
    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  }
};
