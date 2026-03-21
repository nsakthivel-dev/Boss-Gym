// Opens WhatsApp with pre-filled membership expiry alert
export function sendExpiryAlert(member, daysLeft) {
  const gymName = import.meta.env.VITE_GYM_NAME || "BOSS GYM"
  const expiryDate = member.endDate?.toDate?.() ? member.endDate.toDate().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }) : 'N/A'

  const planInfo = member.planName || (member.price ? `₹${member.price} / ${member.durationDays}d` : "Gym");

  const message = `Hi ${member.name}! 👋

This is a reminder from *${gymName}*.

Your *${planInfo}* membership expires in *${daysLeft} day${daysLeft > 1 ? "s" : ""}* on ${expiryDate}.

Please visit us to renew your membership and continue your fitness journey! 💪

Thank you,
${gymName} Team 🏋️`

  const phone = "91" + member.phone.replace(/\D/g, "")
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  window.open(url, "_blank")
}

// Opens WhatsApp with pre-filled membership expired alert
export function sendExpiredAlert(member) {
  const gymName = import.meta.env.VITE_GYM_NAME || "BOSS GYM"
  const planInfo = member.planName || (member.price ? `₹${member.price} / ${member.durationDays}d` : "Gym");

  const message = `Hi ${member.name}! 👋

This is a message from *${gymName}*.

Your *${planInfo}* membership has *expired*. 😔

We miss you! Please visit us to renew your membership and get back to your fitness routine! 💪

Thank you,
${gymName} Team 🏋️`

  const phone = "91" + member.phone.replace(/\D/g, "")
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  window.open(url, "_blank")
}

// Opens WhatsApp with pre-filled welcome message for new member
export function sendWelcomeMessage(member) {
  const gymName = import.meta.env.VITE_GYM_NAME || "BOSS GYM"
  const expiryDate = member.endDate?.toDate?.() ? member.endDate.toDate().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }) : 'N/A'

  const planInfo = member.planName || (member.price ? `₹${member.price} / ${member.durationDays}d` : "Gym");

  const message = `Hi ${member.name}! 👋

Welcome to *${gymName}*! 🎉

Your membership has been activated successfully.

📋 *Membership Details:*
Plan: ${planInfo}
Valid until: ${expiryDate}

We are excited to have you with us. Let us crush those fitness goals together! 💪

See you at the gym!
${gymName} Team 🏋️`

  const phone = "91" + member.phone.replace(/\D/g, "")
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  window.open(url, "_blank")
}
