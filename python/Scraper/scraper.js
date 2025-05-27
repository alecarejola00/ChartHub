// Function to check if a date is a weekend (Saturday or Sunday)
function isWeekend(date) {
    return date.getDay() === 6 || date.getDay() === 0; // 6 = Saturday, 0 = Sunday
}

// Function to adjust date if it is a weekend
function adjustDate(date, isStartDate=true) {
    while (isWeekend(date)) {
        if (isStartDate) {
            // Move to the next weekday (Monday)
            date.setDate(date.getDate() + 1);
        } else {
            // Move to the previous weekday (Friday)
            date.setDate(date.getDate() - 1);
        }
    }
    return date;
}

// Function to format date as MM/DD/YYYY
function formatDate(date) {
    let month = (date.getMonth() + 1).toString().padStart(2, '0'); // months are 0-indexed
    let day = date.getDate().toString().padStart(2, '0');
    let year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

// Function to add a delay (in ms) to simulate human-like behavior
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to simulate the button click event more realistically
async function simulateButtonClick() {
    let updateButton = document.querySelector("button[data-track-payload*='Download_Data_Update_Results']");
    if (updateButton) {
        updateButton.click();
        console.log("Clicked 'Update Results' button.");
        // Wait for the page to process before moving to the next iteration
        await delay(2500); // Delay 2.5 seconds to allow the page to process the request
    } else {
        console.log("Update button not found.");
    }
}

// Function to trigger the download link
async function triggerDownload() {
    let downloadLink = document.querySelector("a[download][href*='downloaddatapartial']");
    if (downloadLink) {
        console.log("Found download link, triggering download...");
        downloadLink.click();
        await delay(3000); // Wait 3 seconds to allow the download to start
    } else {
        console.log("Download link not found.");
    }
}

// Loop through the start and end dates
let startYear = 2020;
let endYear = 2025;

for (let year = startYear; year <= endYear; year++) {
    let startDate = new Date(year, 0, 1); // January 1st
    let endDate = new Date(year, 11, 31); // December 31st

    // Adjust the end date for 2025 to April 30th
    if (year === 2025) {
        endDate = new Date(2025, 3, 30); // April 30th for 2025
    }

    // Adjust start and end dates if they fall on weekends
    startDate = adjustDate(startDate, true);
    endDate = adjustDate(endDate, false);

    // Format the adjusted start and end dates
    let startStr = formatDate(startDate);
    let endStr = formatDate(endDate);

    console.log(`Processing from ${startStr} to ${endStr}...`);

    // Fill the start date and end date fields
    let startInput = document.querySelector("input[name='startdate']");
    let endInput = document.querySelector("input[name='enddate']");

    // Clear and set the dates in the input fields
    startInput.value = startStr;
    endInput.value = endStr;

    // Simulate clicking the "Update Results" button
    await simulateButtonClick();

    // Trigger the download after the update
    await triggerDownload();

    console.log("Processing next date range...");
}

console.log("Completed processing all date ranges.");
