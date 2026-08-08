# Jacky AI Final v1
Tamil-first personal assistant foundation.

## Included
- Salary, farm, purchase, home and interest records
- Temporary and permanent notes
- Individual delete buttons
- Temporary-note bulk delete
- Reminder creation with early reminder minutes
- Tamil speech recognition and speech synthesis
- Browser notifications
- localStorage persistence
- PWA manifest/service worker

## Important
A normal GitHub Pages/browser PWA cannot reliably wake the phone and speak an alarm after the browser/app has been fully killed or the phone is locked. For that requirement, the next phase should use an Android native foreground/background alarm service and notification channel.


## v2 account-source logic
- A farm/purchase expense can specify whether the money came from Home, Salary, or Farm.
- Example: "வீட்டு பணத்தில் இருந்து கொல்லைக்கு ₹500 மருந்து வாங்கினேன்" records ₹500 farm expense and deducts ₹500 once from Home.
- Deleting the linked expense also removes its linked source-account deduction.
- The same logic works for Salary as the source account.
