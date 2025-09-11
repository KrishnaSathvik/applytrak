// Data Recovery Script - Run this in your browser console
// Copy and paste this entire script into your browser's developer console

console.log('🚨 APPLYTRAK DATA RECOVERY SCRIPT');
console.log('==================================');

// Import the recovery utilities
const runRecoveryCheck = async () => {
  try {
    // Check if we're in the right context
    if (typeof window === 'undefined') {
      console.log('❌ This script must be run in the browser console');
      return;
    }

    console.log('🔍 Checking for recovery data...');
    
    // Check localStorage for backup data
    const localStorageBackup = localStorage.getItem('jobTrackerBackup');
    if (localStorageBackup) {
      try {
        const data = JSON.parse(localStorageBackup);
        if (Array.isArray(data) && data.length > 0) {
          console.log(`✅ Found localStorage backup: ${data.length} applications`);
          console.log('Sample applications:');
          data.slice(0, 3).forEach((app, index) => {
            console.log(`${index + 1}. ${app.company} - ${app.position}`);
          });
          
          // Ask if user wants to recover
          const shouldRecover = confirm(`Found ${data.length} applications in localStorage backup. Do you want to recover them?`);
          if (shouldRecover) {
            console.log('🔄 Starting recovery...');
            // This would need to be integrated with your app's recovery system
            console.log('Please use the app\'s recovery feature to restore this data');
          }
        }
      } catch (error) {
        console.log('❌ Error parsing localStorage backup:', error);
      }
    } else {
      console.log('❌ No localStorage backup found');
    }

    // Check IndexedDB for backup data
    console.log('🔍 Checking IndexedDB for backup data...');
    
    const checkIndexedDB = () => {
      return new Promise((resolve) => {
        try {
          const request = indexedDB.open('JobApplicationsDB');
          
          request.onsuccess = (event) => {
            const db = event.target.result;
            
            try {
              if (db.objectStoreNames.contains('backups')) {
                const transaction = db.transaction(['backups'], 'readonly');
                const store = transaction.objectStore('backups');
                const getAllRequest = store.getAll();
                
                getAllRequest.onsuccess = () => {
                  const backups = getAllRequest.result;
                  console.log(`✅ Found ${backups.length} IndexedDB backups`);
                  
                  backups.forEach((backup, index) => {
                    try {
                      let backupData;
                      if (typeof backup.data === 'string') {
                        backupData = JSON.parse(backup.data);
                      } else {
                        backupData = backup.data;
                      }
                      
                      const applications = backupData.applications || backupData || [];
                      if (Array.isArray(applications) && applications.length > 0) {
                        console.log(`Backup ${index + 1}: ${applications.length} applications (${backup.timestamp})`);
                        console.log('Sample applications:');
                        applications.slice(0, 3).forEach((app, i) => {
                          console.log(`  ${i + 1}. ${app.company} - ${app.position}`);
                        });
                      }
                    } catch (error) {
                      console.log(`❌ Error processing backup ${index + 1}:`, error);
                    }
                  });
                  
                  db.close();
                  resolve(backups);
                };
                
                getAllRequest.onerror = () => {
                  console.log('❌ Failed to get backups from IndexedDB');
                  db.close();
                  resolve([]);
                };
              } else {
                console.log('❌ No backups table found in IndexedDB');
                db.close();
                resolve([]);
              }
            } catch (error) {
              console.log('❌ Error accessing IndexedDB:', error);
              db.close();
              resolve([]);
            }
          };
          
          request.onerror = () => {
            console.log('❌ Failed to open IndexedDB');
            resolve([]);
          };
        } catch (error) {
          console.log('❌ Error checking IndexedDB:', error);
          resolve([]);
        }
      });
    };

    const indexedDBBackups = await checkIndexedDB();
    
    // Summary
    console.log('\n📋 RECOVERY SUMMARY:');
    console.log('==================');
    console.log(`localStorage backup: ${localStorageBackup ? 'Found' : 'Not found'}`);
    console.log(`IndexedDB backups: ${indexedDBBackups.length} found`);
    
    if (localStorageBackup || indexedDBBackups.length > 0) {
      console.log('\n🔄 NEXT STEPS:');
      console.log('1. Open your ApplyTrak app');
      console.log('2. Look for a "Recovery" or "Restore Data" option');
      console.log('3. Or contact support for manual recovery assistance');
    } else {
      console.log('\n❌ No recovery data found');
      console.log('Your data may have been permanently deleted or never backed up');
    }

  } catch (error) {
    console.log('❌ Error during recovery check:', error);
  }
};

// Run the recovery check
runRecoveryCheck();
