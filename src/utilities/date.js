export function transformDateFormat(dateString) {
  // Create a Date object from the input dateString
  const date = new Date(dateString);

  // Get the year, month, and day from the Date object
  const year = date.getFullYear();
  // Get the month (0-indexed) and add 1 to get the correct month
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  // Assemble the date string in "yyyy-MM-dd" format
  const formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

export function currentDateFormatted() {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = months[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return `${month} ${day}, ${year}`;
}

export function getDate3DaysFromNow() {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 3); // Add 3 days

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = currentDate.getDate();
  const month = months[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return `${month} ${day}, ${year}`;
}

export function isDueDateGreater(dateBorrowed, due) {
  // Parse the dates
  const borrowedDate = new Date(dateBorrowed);
  const dueDate = new Date(due);

  // Compare the dates
  return dueDate > borrowedDate;
}

export function formatDateTime(dateString) {
  const date = new Date(dateString);

  // Array of month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Get day, month, year
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  // Get hours and minutes
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  // Pad minutes with leading zero if needed
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;

  // Create formatted date string
  const formattedDate = `${month} ${day}, ${year} ${hours}:${minutesStr}${ampm}`;

  return formattedDate;
}

export function getMonthNameFromDate(dateString) {
  //use case: January 1, 2001
  // Split the date string into month, day, and year
  var parts = dateString.split(" ");
  var month = parts[0];

  return month;
}

export function getCurrentMonthName() {
  // Create a new Date object
  var currentDate = new Date();

  // Get the current month (0-11)
  var currentMonthIndex = currentDate.getMonth();

  // Array of month names
  var monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Get the month name using the current month index
  var currentMonthName = monthNames[currentMonthIndex];

  return currentMonthName;
}

export function getPreviousMonthName() {
  // Create a new Date object
  var currentDate = new Date();

  // Get the current month (0-11)
  var currentMonthIndex = currentDate.getMonth();

  // Array of month names
  var monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Calculate the index of the previous month
  var previousMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;

  // Get the name of the previous month
  var previousMonthName = monthNames[previousMonthIndex];

  return previousMonthName;
}
