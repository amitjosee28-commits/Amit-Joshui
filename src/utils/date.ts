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

  // Approximate BS Conversion:
  // BS New Year is approx April 14
  let bsYear = year + 56;
  let bsMonthIndex = 0;
  let bsDateNum = date;

  const bsMonthsEn = ["Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashoj", "Kartik", "Mangsir", "Poush", "Magh", "Fagun", "Chaitra"];
  const bsMonthsNp = ["बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"];

  // Month-by-month approximate mapping
  if (month === 3) { // April
    if (date >= 14) {
      bsYear = year + 57;
      bsMonthIndex = 0; // Baishakh
      bsDateNum = date - 13;
    } else {
      bsYear = year + 56;
      bsMonthIndex = 11; // Chaitra
      bsDateNum = date + 17;
    }
  } else if (month === 4) { // May
    bsYear = year + 57;
    if (date >= 15) {
      bsMonthIndex = 1; // Jestha
      bsDateNum = date - 14;
    } else {
      bsMonthIndex = 0; // Baishakh
      bsDateNum = date + 17;
    }
  } else if (month === 5) { // June
    bsYear = year + 57;
    if (date >= 15) {
      bsMonthIndex = 2; // Ashadh
      bsDateNum = date - 14;
    } else {
      bsMonthIndex = 1; // Jestha
      bsDateNum = date + 16;
    }
  } else if (month === 6) { // July
    bsYear = year + 57;
    if (date >= 16) {
      bsMonthIndex = 3; // Shrawan
      bsDateNum = date - 15;
    } else {
      bsMonthIndex = 2; // Ashadh
      bsDateNum = date + 15;
    }
  } else if (month === 7) { // August
    bsYear = year + 57;
    if (date >= 17) {
      bsMonthIndex = 4; // Bhadra
      bsDateNum = date - 16;
    } else {
      bsMonthIndex = 3; // Shrawan
      bsDateNum = date + 16;
    }
  } else if (month === 8) { // September
    bsYear = year + 57;
    if (date >= 17) {
      bsMonthIndex = 5; // Ashoj
      bsDateNum = date - 16;
    } else {
      bsMonthIndex = 4; // Bhadra
      bsDateNum = date + 15;
    }
  } else if (month === 9) { // October
    bsYear = year + 57;
    if (date >= 18) {
      bsMonthIndex = 6; // Kartik
      bsDateNum = date - 17;
    } else {
      bsMonthIndex = 5; // Ashoj
      bsDateNum = date + 14;
    }
  } else if (month === 10) { // November
    bsYear = year + 57;
    if (date >= 17) {
      bsMonthIndex = 7; // Mangsir
      bsDateNum = date - 16;
    } else {
      bsMonthIndex = 6; // Kartik
      bsDateNum = date + 13;
    }
  } else if (month === 11) { // December
    bsYear = year + 57;
    if (date >= 16) {
      bsMonthIndex = 8; // Poush
      bsDateNum = date - 15;
    } else {
      bsMonthIndex = 7; // Mangsir
      bsDateNum = date + 14;
    }
  } else if (month === 0) { // January
    bsYear = year + 56;
    if (date >= 15) {
      bsMonthIndex = 9; // Magh
      bsDateNum = date - 14;
    } else {
      bsMonthIndex = 8; // Poush
      bsDateNum = date + 16;
    }
  } else if (month === 1) { // February
    bsYear = year + 56;
    if (date >= 13) {
      bsMonthIndex = 10; // Fagun
      bsDateNum = date - 12;
    } else {
      bsMonthIndex = 9; // Magh
      bsDateNum = date + 17;
    }
  } else if (month === 2) { // March
    bsYear = year + 56;
    if (date >= 14) {
      bsMonthIndex = 11; // Chaitra
      bsDateNum = date - 13;
    } else {
      bsMonthIndex = 10; // Fagun
      bsDateNum = date + 16;
    }
  }

  let hours = nepalDate.getHours();
  const minutes = nepalDate.getMinutes();
  const seconds = nepalDate.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const ampmNp = hours >= 12 ? 'अपराह्न' : 'पूर्वाह्न';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  const strSeconds = seconds < 10 ? '0' + seconds : seconds;
  const strHours = hours < 10 ? '0' + hours : hours;

  const gregMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const gregMonthsNp = ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"];
  
  const gregStrEn = `${gregMonths[month]} ${date}, ${year} ${strHours}:${strMinutes}:${strSeconds} ${ampm}`;
  const gregStrNp = `${gregMonthsNp[month]} ${toNepaliDigits(date)}, ${toNepaliDigits(year)} ${toNepaliDigits(strHours)}:${toNepaliDigits(strMinutes)}:${toNepaliDigits(strSeconds)} ${ampmNp}`;

  const bsStrEn = `${bsMonthsEn[bsMonthIndex]} ${bsDateNum}, ${bsYear} BS ${strHours}:${strMinutes}:${strSeconds} ${ampm}`;
  const bsStrNp = `${bsMonthsNp[bsMonthIndex]} ${toNepaliDigits(bsDateNum)}, ${toNepaliDigits(bsYear)} बि.सं. ${toNepaliDigits(strHours)}:${toNepaliDigits(strMinutes)}:${toNepaliDigits(strSeconds)} ${ampmNp}`;

  return {
    gregStrEn,
    gregStrNp,
    bsStrEn,
    bsStrNp,
    timeOnly: `${strHours}:${strMinutes}:${strSeconds} ${ampm}`,
    bsYear,
    bsMonthEn: bsMonthsEn[bsMonthIndex],
    bsMonthNp: bsMonthsNp[bsMonthIndex],
    bsDateNum,
    timeSemicolon: `${strHours};${strMinutes};${strSeconds}`
  };
}
