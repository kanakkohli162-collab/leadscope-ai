/**
 * Builds a personalised outreach message from a lead's data.
 * Replace with the backend's /leads/:id/outreach endpoint when it's ready
 * (see generateOutreach in src/services/leadService.js).
 */
export function buildOutreachMessage(lead, service) {
  const gap = lead.hasWebsite
    ? `your website is ${lead.websiteAnalysis.toLowerCase()} and your online presence could be much stronger`
    : "you don't have a website yet, so patients searching online can't find you easily"

  return `Hi,

I came across ${lead.name} while researching top ${lead.category.toLowerCase()} businesses in ${lead.location}. You have a ${lead.rating}★ rating from ${lead.reviews} reviews, which shows a strong customer base. However, I noticed that ${gap}.

We help healthcare businesses like yours with ${service}, so you can turn that reputation into more online bookings.

Would you be open to a quick 15-minute call this week to discuss how we can help ${lead.name} grow online?

Best regards,
LeadScope AI Team`
}
