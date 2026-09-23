export function formatDateRange(fromDate, toDate) {
  if (!fromDate && !toDate) return 'No dates';

  const options = { month: 'short', day: 'numeric', year: 'numeric' };

  if (fromDate && !toDate) {
    try {
      const d = new Date(fromDate);
      return isNaN(d.getTime()) ? fromDate : d.toLocaleDateString('en-US', options);
    } catch {
      return fromDate;
    }
  }

  if (!fromDate && toDate) {
    try {
      const d = new Date(toDate);
      return isNaN(d.getTime()) ? toDate : d.toLocaleDateString('en-US', options);
    } catch {
      return toDate;
    }
  }

  try {
    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return `${fromDate} – ${toDate}`;
    }

    const y1 = d1.getFullYear();
    const y2 = d2.getFullYear();
    const m1 = d1.toLocaleDateString('en-US', { month: 'short' });
    const m2 = d2.toLocaleDateString('en-US', { month: 'short' });
    const day1 = d1.getDate();
    const day2 = d2.getDate();

    if (y1 === y2 && m1 === m2) {
      return `${m1} ${day1} – ${day2}, ${y1}`;
    }
    if (y1 === y2) {
      return `${m1} ${day1} – ${m2} ${day2}, ${y1}`;
    }
    return `${m1} ${day1}, ${y1} – ${m2} ${day2}, ${y2}`;
  } catch {
    return `${fromDate} – ${toDate}`;
  }
}

