// Data Recovery Helper - Check and recover your lost data
import { recoveryUtils } from '../services/recoveryUtils';
import { databaseService } from '../services/databaseService';

export const checkForRecoveryData = async () => {
  console.log('🔍 Checking for recovery data...');
  
  try {
    // Check if there's any recovery data available
    const hasRecoveryData = await recoveryUtils.checkForRecoveryData();
    
    if (!hasRecoveryData) {
      console.log('❌ No recovery data found');
      return { hasData: false, options: [] };
    }
    
    // Get all available recovery options
    const options = await recoveryUtils.getRecoveryOptions();
    
    console.log(`✅ Found ${options.length} recovery options:`);
    options.forEach((option, index) => {
      console.log(`${index + 1}. ${option.source} - ${option.count} applications (${option.lastModified})`);
    });
    
    return { hasData: true, options };
  } catch (error) {
    console.error('❌ Error checking recovery data:', error);
    return { hasData: false, options: [] };
  }
};

export const recoverData = async (optionIndex: number = 0) => {
  console.log('🔄 Starting data recovery...');
  
  try {
    const options = await recoveryUtils.getRecoveryOptions();
    
    if (options.length === 0) {
      throw new Error('No recovery options available');
    }
    
    if (optionIndex >= options.length) {
      throw new Error('Invalid option index');
    }
    
    const selectedOption = options[optionIndex];
    console.log(`📥 Recovering from: ${selectedOption.source}`);
    console.log(`📊 Applications to recover: ${selectedOption.count}`);
    
    // Perform the recovery
    await recoveryUtils.performRecovery(selectedOption);
    
    console.log('✅ Data recovery completed successfully!');
    return { success: true, recoveredCount: selectedOption.count };
  } catch (error) {
    console.error('❌ Data recovery failed:', error);
    return { success: false, error: error.message };
  }
};

export const checkCurrentData = async () => {
  console.log('📊 Checking current data...');
  
  try {
    const applications = await databaseService.getApplications();
    console.log(`📋 Current applications: ${applications.length}`);
    
    if (applications.length > 0) {
      console.log('Recent applications:');
      applications.slice(0, 5).forEach((app, index) => {
        console.log(`${index + 1}. ${app.company} - ${app.position} (${app.dateApplied})`);
      });
    }
    
    return { count: applications.length, applications };
  } catch (error) {
    console.error('❌ Error checking current data:', error);
    return { count: 0, applications: [] };
  }
};

// Helper function to run recovery check
export const runRecoveryCheck = async () => {
  console.log('🚨 DATA RECOVERY CHECK');
  console.log('====================');
  
  // Check current data
  const currentData = await checkCurrentData();
  
  // Check for recovery options
  const recoveryData = await checkForRecoveryData();
  
  console.log('\n📋 SUMMARY:');
  console.log(`Current applications: ${currentData.count}`);
  console.log(`Recovery options available: ${recoveryData.hasData ? recoveryData.options.length : 0}`);
  
  if (recoveryData.hasData && recoveryData.options.length > 0) {
    console.log('\n🔄 To recover your data, run:');
    console.log('recoverData(0) // for the most recent backup');
    console.log('recoverData(1) // for the second most recent backup');
    console.log('// etc.');
  }
  
  return {
    currentData,
    recoveryData
  };
};
