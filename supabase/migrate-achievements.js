#!/usr/bin/env node

/**
 * Cloud Achievements Migration Script
 * 
 * This script migrates the achievement system from localStorage to Supabase
 * without affecting existing database data.
 * 
 * Usage: node supabase/migrate-achievements.js
 */

const fs = require('fs');
const path = require('path');

// Read the migration SQL file
const migrationPath = path.join(__dirname, 'cloud-achievements-migration.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Cloud Achievements Migration');
console.log('================================');
console.log('');
console.log('This migration will:');
console.log('✅ Create achievements table with all achievement definitions');
console.log('✅ Create user_achievements table to track unlocked achievements');
console.log('✅ Create user_stats table for user progress tracking');
console.log('✅ Add proper RLS policies for security');
console.log('✅ Create helper functions for achievement management');
console.log('✅ NOT affect any existing database data');
console.log('');
console.log('📋 Migration SQL:');
console.log('==================');
console.log(migrationSQL);
console.log('');
console.log('🔧 To apply this migration:');
console.log('1. Copy the SQL above');
console.log('2. Go to your Supabase dashboard');
console.log('3. Navigate to SQL Editor');
console.log('4. Paste and run the migration');
console.log('');
console.log('🔄 After migration:');
console.log('- Update your app to use useCloudAchievementStore instead of useAchievementStore');
console.log('- Test the achievement system with existing users');
console.log('- Existing user data will remain intact');
console.log('');
console.log('✨ Migration ready! Copy the SQL above to Supabase.');
