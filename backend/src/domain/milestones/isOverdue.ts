import { MilestoneWorkStatus } from "@prisma/client";

/**
 * Returns true if today's calendar date in the freelancer's time zone is strictly
 * after the milestone's due date calendar date, and the milestone is NOT ACCEPTED.
 */
export function isOverdue(
  milestone: {
    dueDate?: Date | string | null;
    workStatus: MilestoneWorkStatus;
  },
  timezone: string = "UTC",
  now: Date = new Date()
): boolean {
  if (milestone.workStatus === MilestoneWorkStatus.ACCEPTED) {
    return false;
  }

  if (!milestone.dueDate) {
    return false;
  }

  const dueDateObj = typeof milestone.dueDate === "string" ? new Date(milestone.dueDate) : milestone.dueDate;
  if (isNaN(dueDateObj.getTime())) {
    return false;
  }

  try {
    const tz = timezone || "UTC";

    // Format current date in freelancer's timezone as YYYY-MM-DD
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const todayStr = formatter.format(now);
    const dueStr = typeof milestone.dueDate === "string" ? milestone.dueDate.slice(0, 10) : dueDateObj.toISOString().slice(0, 10);

    // If today is strictly greater than the due date string -> overdue
    return todayStr > dueStr;
  } catch (err) {
    // Fallback to UTC comparison
    return now.getTime() > dueDateObj.getTime();
  }
}
