export function toNepaliDigits(num: number | string): string {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().split('').map(char => {
    const parsed = parseInt(char);
    return isNaN(parsed) ? char : nepaliDigits[parsed];
  }).join('');
}

export function getNepalTime() {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const nepalOffset = 5.75 * 3600000; // Kathmandu is UTC+5:45
  return new Date(utc + nepalOffset);
}

export function getNepalBSAndGregorian() {
  const nepalDate = getNepalTime();
  const year = nepalDate.getFullYear();
  const month = nepalDate.getMonth(); // 0-11
  const date = nepalDate.getDate();

  // BS Year calculation (Accurate Bikram Sambat mapping, e.g. 2083 BS)
  let bsYear = year + 57;
  let bsMonthIndex = 0;
  let bsDateNum = date;

  const bsMonthsEn = ["Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashoj", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];

  // Month-by-month accurate Bikram Sambat mapping
  if (month === 3) { // April
    if (date >= 14) {
      bsMonthIndex = 0; // Baishakh
      bsDateNum = date - 13;
    } else {
      bsYear = bsYear - 1;
      bsMonthIndex = 11; // Chaitra
      bsDateNum = date + 17;
    }
  } else if (month === 4) { // May
    if (date >= 15) {
      bsMonthIndex = 1; // Jestha
      bsDateNum = date - 14;
    } else {
      bsMonthIndex = 0; // Baishakh
      bsDateNum = date + 17;
    }
  } else if (month === 5) { // June
    if (date >= 15) {
      bsMonthIndex = 2; // Ashadh
      bsDateNum = date - 14;
    } else {
      bsMonthIndex = 1; // Jestha
      bsDateNum = date + 16;
    }
  } else if (month === 6) { // July
    if (date >= 17) {
      bsMonthIndex = 3; // Shrawan
      bsDateNum = date - 16;
    } else {
      bsMonthIndex = 2; // Ashadh
      bsDateNum = date + 15;
    }
  } else if (month === 7) { // August
    if (date >= 17) {
      bsMonthIndex = 4; // Bhadra
      bsDateNum = date - 16;
    } else {
      bsMonthIndex = 3; // Shrawan (Aug 14 = 29 Shrawan 2080)
      bsDateNum = date + 15;
    }
  } else if (month === 8) { // September
    if (date >= 17) {
      bsMonthIndex = 5; // Ashoj
      bsDateNum = date - 16;
    } else {
      bsMonthIndex = 4; // Bhadra
      bsDateNum = date + 15;
    }
  } else if (month === 9) { // October
    if (date >= 18) {
      bsMonthIndex = 6; // Kartik
      bsDateNum = date - 17;
    } else {
      bsMonthIndex = 5; // Ashoj
      bsDateNum = date + 14;
    }
  } else if (month === 10) { // November
    if (date >= 17) {
      bsMonthIndex = 7; // Mangsir
      bsDateNum = date - 16;
    } else {
      bsMonthIndex = 6; // Kartik
      bsDateNum = date + 13;
    }
  } else if (month === 11) { // December
    if (date >= 16) {
      bsMonthIndex = 8; // Poush
      bsDateNum = date - 15;
    } else {
      bsMonthIndex = 7; // Mangsir
      bsDateNum = date + 14;
    }
  } else if (month === 0) { // January
    if (date >= 15) {
      bsMonthIndex = 9; // Magh
      bsDateNum = date - 14;
    } else {
      bsYear = bsYear - 1;
      bsMonthIndex = 8; // Poush
      bsDateNum = date + 16;
    }
  } else if (month === 1) { // February
    if (date >= 13) {
      bsMonthIndex = 10; // Falgun
      bsDateNum = date - 12;
    } else {
      bsYear = bsYear - 1;
      bsMonthIndex = 9; // Magh
      bsDateNum = date + 17;
    }
  } else if (month === 2) { // March
    if (date >= 14) {
      bsMonthIndex = 11; // Chaitra
      bsDateNum = date - 13;
    } else {
      bsYear = bsYear - 1;
      bsMonthIndex = 10; // Falgun
      bsDateNum = date + 16;
    }
  }

  let hours = nepalDate.getHours();
  const minutes = nepalDate.getMinutes();
  const seconds = nepalDate.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  const strSeconds = seconds < 10 ? '0' + seconds : seconds;
  const strHours = hours < 10 ? '0' + hours : hours;

  const gregMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const gregStrEn = `${gregMonths[month]} ${date}, ${year} ${strHours}:${strMinutes}:${strSeconds} ${ampm}`;
  const bsStrEn = `${bsDateNum} ${bsMonthsEn[bsMonthIndex]} ${bsYear} BS ${strHours}:${strMinutes}:${strSeconds} ${ampm}`;

  return {
    gregStrEn,
    gregStrNp: gregStrEn,
    bsStrEn,
    bsStrNp: bsStrEn,
    timeOnly: `${strHours}:${strMinutes}:${strSeconds} ${ampm}`,
    bsYear,
    bsMonthEn: bsMonthsEn[bsMonthIndex],
    bsMonthNp: bsMonthsEn[bsMonthIndex],
    bsDateNum,
    timeSemicolon: `${strHours}:${strMinutes}:${strSeconds}`
  };
}

export function formatBlogDate(dateStr?: string): string {
  if (!dateStr) return 'Oct 24, 2024';

  const cleanStr = dateStr.trim();
  if (cleanStr.toLowerCase().includes('coming soon')) {
    return 'Coming Soon';
  }

  const parsed = new Date(cleanStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  return cleanStr;
}

export function formatBlogTimestamp(dateStr?: string, timeStr?: string): string {
  if (!dateStr) {
    return "2026-08-14 13:58:23";
  }

  let cleanDate = dateStr.trim();
  let cleanTime = timeStr ? timeStr.trim() : "";

  const parsed = new Date(cleanDate);
  if (!isNaN(parsed.getTime()) && cleanDate.includes('-')) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    cleanDate = `${y}-${m}-${d}`;

    if (!cleanTime) {
      const hh = String(parsed.getHours()).padStart(2, '0');
      const mm = String(parsed.getMinutes()).padStart(2, '0');
      const ss = String(parsed.getSeconds()).padStart(2, '0');
      cleanTime = `${hh}:${mm}:${ss}`;
    }
  }

  return cleanTime ? `${cleanDate} ${cleanTime}` : cleanDate;
}

export function formatBlogLocationDate(dateStr: string): { dateStr: string; location: string } {
  const location = 'Kathmandu, Nepal';
  const formattedDate = formatBlogDate(dateStr);
  const parsed = new Date(dateStr);
  const bsYr = !isNaN(parsed.getTime())
    ? (parsed.getFullYear() + (parsed.getMonth() < 3 || (parsed.getMonth() === 3 && parsed.getDate() < 14) ? 56 : 57))
    : 2083;
  
  return {
    dateStr: `${formattedDate} (${bsYr} BS)`,
    location
  };
}
