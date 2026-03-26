import {
  collection, query, where,
  getDocs, doc, setDoc, getDoc
} from "firebase/firestore"
import { db } from "../firebase/config"
import {
  sendBrowserNotification,
  getTodayString
} from "./notifications"

const getGymName = async () => {
  try {
    const docRef = doc(db, "settings", "config");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().gymName : "BOSS GYM";
  } catch (err) {
    return "BOSS GYM";
  }
};

export async function checkAndNotifyExpiring() {
  try {
    const gymName = await getGymName();
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = getTodayString()

    // Calculate date 3 days from now
    const threeDaysLater = new Date(today)
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)
    threeDaysLater.setHours(23, 59, 59, 999)

    // Check if alerts already sent today
    const alertDocRef = doc(db, "alertLogs", todayStr)
    const alertDocSnap = await getDoc(alertDocRef)
    if (alertDocSnap.exists() && alertDocSnap.data().sent === true) {
      // Alerts already sent today, skip
      console.log("Alerts already sent today")
      return
    }

    // Query members expiring within 3 days
    // Note: To avoid composite index, we query all and filter in memory if necessary,
    // but here we can just query active members and filter dates.
    const membersRef = collection(db, "members")
    const snapshot = await getDocs(membersRef)

    const expiringMembers = []
    const expiredMembers = []

    snapshot.forEach((docSnap) => {
      const member = { id: docSnap.id, ...docSnap.data() }
      if (!member.endDate) return

      const endDate = member.endDate.toDate()
      endDate.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))

      if (daysLeft < 0) {
        expiredMembers.push({ ...member, daysLeft })
      } else if (daysLeft <= 3) {
        expiringMembers.push({ ...member, daysLeft })
      }
    })

    // Small delay between notifications so they stack nicely
    let delay = 0

    // Send notification for each expiring member
    for (const member of expiringMembers) {
      setTimeout(() => {
        const daysText = member.daysLeft === 0
          ? "expires TODAY"
          : member.daysLeft === 1
          ? "expires TOMORROW"
          : `expires in ${member.daysLeft} days`

        sendBrowserNotification(
          `⚠️ ${member.name} — Membership Expiring`,
          `${member.planName || (member.price ? `₹${member.price} / ${member.durationDays}d` : 'Gym')} membership ${daysText}. Please remind them to renew.`,
        )
      }, delay)
      delay += 1500
    }

    // Send notification for each expired member
    for (const member of expiredMembers) {
      setTimeout(() => {
        sendBrowserNotification(
          `🔴 ${member.name} — Membership Expired`,
          `${member.planName || (member.price ? `₹${member.price} / ${member.durationDays}d` : 'Gym')} membership has expired. Please follow up for renewal.`,
        )
      }, delay)
      delay += 1500
    }

    // Send summary notification first (appears at top)
    if (expiringMembers.length > 0 || expiredMembers.length > 0) {
      sendBrowserNotification(
        `🏋️ ${gymName} — Daily Alert`,
        `${expiringMembers.length} expiring soon, ${expiredMembers.length} already expired. Check dashboard.`
      )
    }

    // Mark alerts as sent today in Firestore
    await setDoc(alertDocRef, {
      sent: true,
      sentAt: new Date(),
      expiringCount: expiringMembers.length,
      expiredCount: expiredMembers.length,
      members: [
        ...expiringMembers.map(m => ({ name: m.name, daysLeft: m.daysLeft })),
        ...expiredMembers.map(m => ({ name: m.name, daysLeft: m.daysLeft }))
      ]
    })

  } catch (error) {
    console.error("Alert checker error:", error)
  }
}
