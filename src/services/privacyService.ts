// src/services/privacyService.ts - Fixed for your database setup
import {supabase} from './databaseService';

// Types matching your actual database structure
interface PrivacyConsents {
    required: boolean;
    cloudSync: boolean;
    analytics: boolean;
    marketing: boolean;
}

// Database PrivacySettings (what's stored in DB)
interface DatabasePrivacySettings {
    id?: string;
    userid: number;
    analytics: boolean;
    feedback: boolean;
    functionalcookies: boolean;
    consentdate: string;
    consentversion: string;
    cloudsyncconsent: boolean;
    dataretentionperiod: number;
    anonymizeafter: number;
    trackinglevel: 'minimal' | 'standard' | 'detailed';
    datasharingconsent: boolean;
    marketingconsent: boolean;
    createdat?: string;
    updatedat?: string;
}

// App PrivacySettings (what's used in components)
interface AppPrivacySettings {
    analytics: boolean;
    marketing_consent: boolean;
    cloud_sync_consent: boolean;
    functional_cookies: boolean;
    tracking_level: 'minimal' | 'standard' | 'enhanced';
    data_retention_period: number;
    feedback?: boolean;
    data_sharing_consent?: boolean;
    updated_at?: string;
}

interface UserDataExport {
    userid: number;
    export_date: string;
    user_info: any;
    applications: any[];
    goals: any;
    analytics_events: any[];
    feedback: any[];
    privacy_settings: DatabasePrivacySettings;
}

/**
 * Privacy Service - Fixed for your database setup
 */
class PrivacyService {

    /**
     * Save privacy settings after user signup
     */
    async savePrivacySettings(authUserId: string, consents: PrivacyConsents): Promise<void> {
        try {
            const client = this.ensureSupabase();
            
            // Check if we have a valid session before proceeding
            const { data: { session } } = await client.auth.getSession();
            if (!session?.user) {
                throw new Error('No active session - user must be authenticated');
            }
            
            const userId = await this.getUserId(authUserId);
            if (!userId) {
                throw new Error('User not found');
            }

            const privacySettings: Omit<DatabasePrivacySettings, 'id' | 'created_at' | 'updated_at'> = {
                userid: userId,
                analytics: consents.analytics,
                feedback: consents.analytics,
                functionalcookies: true,
                consentdate: new Date().toISOString(),
                consentversion: '1.0',
                cloudsyncconsent: consents.cloudSync,
                dataretentionperiod: 365,
                anonymizeafter: 730,
                trackinglevel: consents.analytics ? 'standard' : 'minimal',
                datasharingconsent: false,
                marketingconsent: consents.marketing
            };

            const {error} = await client
                .from('privacy_settings')
                .upsert(privacySettings);

            if (error) {
                console.error('Failed to save privacy settings:', error);
                throw new Error('Failed to save privacy settings');
            }

            console.log('Privacy settings saved successfully for user:', userId);
        } catch (error) {
            console.error('Privacy service error:', error);
            throw error;
        }
    }

    /**
     * Get current privacy settings for a user
     */
    async getPrivacySettings(authUserId: string): Promise<AppPrivacySettings | null> {
        try {
            const client = this.ensureSupabase();
            
            // Check if we have a valid session before proceeding
            const { data: { session } } = await client.auth.getSession();
            if (!session?.user) {
                console.log('No active session - skipping privacy settings lookup');
                return null;
            }
            
            const userId = await this.getUserId(authUserId);
            if (!userId) {
                return null;
            }

            const {data, error} = await client
                .from('privacy_settings')
                .select('*')
                .eq('userid', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('No privacy settings found for user:', userId);
                    return null;
                }
                throw error;
            }

            return this.convertToAppSettings(data as DatabasePrivacySettings);
        } catch (error) {
            console.error('Failed to get privacy settings:', error);
            return null;
        }
    }

    /**
     * Check if user has given consent for specific data processing
     */
    async hasConsentFor(authUserId: string, consentType: keyof AppPrivacySettings): Promise<boolean> {
        try {
            const settings = await this.getPrivacySettings(authUserId);
            return settings ? Boolean(settings[consentType]) : false;
        } catch (error) {
            console.error('Failed to check consent:', error);
            return false;
        }
    }

    /**
     * Update specific privacy setting
     */
    async updatePrivacySettings(authUserId: string, updates: Partial<AppPrivacySettings>): Promise<void> {
        try {
            const client = this.ensureSupabase();
            const userId = await this.getUserId(authUserId);
            if (!userId) {
                throw new Error('User not found');
            }

            const currentSettings = await this.getPrivacySettings(authUserId);
            if (!currentSettings) {
                throw new Error('No existing privacy settings found. Cannot update.');
            }

            const dbUpdates: Partial<DatabasePrivacySettings> = {
                updatedat: new Date().toISOString()
            };

            if ('analytics' in updates) dbUpdates.analytics = updates.analytics;
            if ('marketing_consent' in updates) dbUpdates.marketingconsent = updates.marketing_consent;
            if ('cloud_sync_consent' in updates) dbUpdates.cloudsyncconsent = updates.cloud_sync_consent;
            if ('functional_cookies' in updates) dbUpdates.functionalcookies = updates.functional_cookies;
            if ('data_retention_period' in updates) dbUpdates.dataretentionperiod = updates.data_retention_period;
            if ('feedback' in updates) dbUpdates.feedback = updates.feedback;
            if ('data_sharing_consent' in updates) dbUpdates.datasharingconsent = updates.data_sharing_consent;

            if ('tracking_level' in updates && updates.tracking_level) {
                dbUpdates.trackinglevel = this.convertTrackingLevel(updates.tracking_level);
            }

            const {error} = await client
                .from('privacy_settings')
                .update(dbUpdates)
                .eq('userid', userId);

            if (error) {
                console.error('Failed to update privacy settings:', error);
                throw new Error('Failed to update privacy settings');
            }

            console.log('Privacy settings updated successfully for user:', userId);
        } catch (error) {
            console.error('Privacy settings update error:', error);
            throw error;
        }
    }

    /**
     * Update specific consent and apply changes immediately
     */
    async updateConsent(authUserId: string, consentType: string, value: boolean): Promise<void> {
        try {
            await this.updatePrivacySettings(authUserId, {[consentType]: value} as Partial<AppPrivacySettings>);

            if (consentType === 'analytics') {
                try {
                    const {analyticsService} = await import('./analyticsService');
                    if (value) {
                        await analyticsService.enableAnalytics({trackingLevel: 'standard'});
                    } else {
                        analyticsService.disableAnalytics();
                    }
                } catch (error) {
                    console.warn('Analytics service not available:', error);
                }
            }

            console.log(`Consent updated: ${consentType} = ${value}`);
        } catch (error) {
            console.error('Failed to update consent:', error);
            throw error;
        }
    }

    /**
     * Export all user data for GDPR compliance
     */
    async exportUserData(authUserId: string): Promise<UserDataExport> {
        try {
            const client = this.ensureSupabase();
            const userId = await this.getUserId(authUserId);
            if (!userId) {
                throw new Error('User not found');
            }

            const {data, error} = await client.rpc('export_user_data', {
                user_bigint: userId
            });

            if (error) {
                console.error('Failed to export user data:', error);
                throw new Error('Failed to export user data');
            }

            console.log('User data export prepared for user:', userId);
            return data as UserDataExport;
        } catch (error) {
            console.error('Failed to export user data:', error);
            throw new Error('Failed to export user data');
        }
    }

    /**
     * Delete all user data for GDPR "right to be forgotten"
     */
    async deleteAllUserData(authUserId: string): Promise<void> {
        try {
            const client = this.ensureSupabase();
            const userId = await this.getUserId(authUserId);
            if (!userId) {
                throw new Error('User not found');
            }

            console.log('Attempting to delete user data for user ID:', userId);

            const {data, error} = await client.rpc('cleanup_user_data', {
                user_bigint: userId
            });

            if (error) {
                console.error('RPC call failed:', error);
                throw new Error(`Database error: ${error.message}`);
            }

            if (!data) {
                console.error('No data returned from cleanup function');
                throw new Error('No response from cleanup function');
            }

            // Handle the new JSON response format
            if (typeof data === 'object' && data !== null) {
                const result = data as any;
                
                if (result.success) {
                    console.log(`User data deleted successfully. Deleted ${result.deleted_records} records for user:`, userId);
                    return;
                } else {
                    const errors = result.errors || [];
                    console.error('Cleanup function failed with errors:', errors);
                    throw new Error(`Failed to delete user data: ${errors.join(', ')}`);
                }
            } else if (typeof data === 'boolean') {
                // Handle the old boolean response format
                if (data) {
                    console.log('User data deleted successfully for user:', userId);
                    return;
                } else {
                    throw new Error('Cleanup function returned false');
                }
            } else {
                console.error('Unexpected response format:', data);
                throw new Error('Unexpected response from cleanup function');
            }

        } catch (error) {
            console.error('Failed to delete user data:', error);
            throw error;
        }
    }

    /**
     * Check if user needs to be shown consent update modal
     */
    async needsConsentUpdate(authUserId: string, currentVersion: string = '1.0'): Promise<boolean> {
        try {
            const client = this.ensureSupabase();
            const userId = await this.getUserId(authUserId);
            if (!userId) return true;

            const {data, error} = await client
                .from('privacy_settings')
                .select('consent_version')
                .eq('userid', userId)
                .single();

            if (error || !data) return true;

            return data.consent_version !== currentVersion;
        } catch (error) {
            console.error('Failed to check consent version:', error);
            return true;
        }
    }

    /**
     * Get privacy settings summary for UI display
     */
    async getPrivacySummary(authUserId: string): Promise<{
        status: 'privacy-focused' | 'balanced' | 'full-sharing';
        description: string;
        activeFeatures: string[];
    }> {
        try {
            const client = this.ensureSupabase();
            const userId = await this.getUserId(authUserId);
            if (!userId) {
                return {
                    status: 'privacy-focused',
                    description: 'User not found',
                    activeFeatures: []
                };
            }

            const {data, error} = await client.rpc('get_privacy_summary', {
                user_bigint: userId
            });

            if (error || !data) {
                return {
                    status: 'privacy-focused',
                    description: 'Privacy settings not configured',
                    activeFeatures: ['Essential features only']
                };
            }

            const activeFeatures: string[] = [];
            if (data.cloud_sync) activeFeatures.push('Cloud sync');
            if (data.analytics) activeFeatures.push('Usage analytics');
            if (data.marketing) activeFeatures.push('Product updates');

            let status: 'privacy-focused' | 'balanced' | 'full-sharing';
            let description: string;

            switch (data.level) {
                case 'full-sharing':
                    status = 'full-sharing';
                    description = 'Helping improve ApplyTrak for everyone';
                    break;
                case 'balanced':
                    status = 'balanced';
                    description = 'Balanced privacy and functionality';
                    break;
                default:
                    status = 'privacy-focused';
                    description = 'Maximum privacy protection';
            }

            return {status, description, activeFeatures};
        } catch (error) {
            console.error('Failed to get privacy summary:', error);
            return {
                status: 'privacy-focused',
                description: 'Error loading privacy settings',
                activeFeatures: []
            };
        }
    }

    async saveInitialPrivacySettings(authUserId: string, cloudSync: boolean, analytics: boolean = true): Promise<void> {
        const consents: PrivacyConsents = {required: true, cloudSync, analytics, marketing: false};
        
        // Retry mechanism for initial privacy settings (user record might not be immediately available)
        let retries = 5;
        while (retries > 0) {
            try {
                console.log(`Attempting to save privacy settings (attempt ${6 - retries}/5) for user:`, authUserId);
                return await this.savePrivacySettings(authUserId, consents);
            } catch (error: any) {
                retries--;
                console.log(`Privacy settings save failed (${retries} retries left):`, error.message);
                if (retries === 0 || !error.message?.includes('User not found')) {
                    throw error;
                }
                // Wait before retrying (increasing delay)
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    /**
     * Migrate old analytics consent to new privacy system
     */
    async migrateExistingConsent(authUserId: string, hasAnalyticsConsent: boolean): Promise<void> {
        try {
            const existingSettings = await this.getPrivacySettings(authUserId);

            if (existingSettings) {
                return;
            }

            const migrationConsents: PrivacyConsents = {
                required: true,
                cloudSync: true,
                analytics: hasAnalyticsConsent,
                marketing: false
            };

            await this.savePrivacySettings(authUserId, migrationConsents);
            console.log('Migrated existing user consent to privacy system:', authUserId);
        } catch (error) {
            console.error('Failed to migrate existing consent:', error);
        }
    }

    /**
     * Check if user has analytics consent using database function
     */
    async hasAnalyticsConsent(authUserId: string): Promise<boolean> {
        try {
            const client = this.ensureSupabase();
            
            // Check if we have a valid session before proceeding
            const { data: { session } } = await client.auth.getSession();
            if (!session?.user) {
                console.log('No active session - skipping analytics consent check');
                return false;
            }
            
            const userId = await this.getUserId(authUserId);
            if (!userId) return false;

            const {data, error} = await client.rpc('user_has_analytics_consent', {
                user_bigint: userId
            });

            return error ? false : Boolean(data);
        } catch (error) {
            console.error('Failed to check analytics consent:', error);
            return false;
        }
    }

    /**
     * Check if user has marketing consent using database function
     */
    async hasMarketingConsent(authUserId: string): Promise<boolean> {
        try {
            const client = this.ensureSupabase();
            
            // Check if we have a valid session before proceeding
            const { data: { session } } = await client.auth.getSession();
            if (!session?.user) {
                console.log('No active session - skipping marketing consent check');
                return false;
            }
            
            const userId = await this.getUserId(authUserId);
            if (!userId) return false;

            const {data, error} = await client.rpc('user_has_marketing_consent', {
                user_bigint: userId
            });

            return error ? false : Boolean(data);
        } catch (error) {
            console.error('Failed to check marketing consent:', error);
            return false;
        }
    }

    /**
     * Ensure supabase is initialized
     */
    private ensureSupabase() {
        if (!supabase) {
            throw new Error('Supabase not initialized. Please check your environment variables.');
        }
        return supabase;
    }

    /**
     * Get user ID from Supabase auth external_id
     */
    private async getUserId(authUserId: string): Promise<number | null> {
        try {
            const client = this.ensureSupabase();
            
            // Check if we have a valid session before querying
            const { data: { session } } = await client.auth.getSession();
            if (!session?.user) {
                console.log('No active session - skipping user lookup');
                return null;
            }

            console.log('Looking up user with externalid:', authUserId);

            // Try to get user ID using the current_user_id function first
            try {
                const { data: userId, error: rpcError } = await client.rpc('current_user_id');
                if (!rpcError && userId) {
                    console.log('Found user ID via current_user_id function:', userId);
                    return userId;
                } else if (rpcError) {
                    console.warn('current_user_id RPC failed:', rpcError.message);
                }
            } catch (rpcError) {
                console.warn('current_user_id function failed, trying direct query:', rpcError);
            }

            // Fallback to direct query
            const {data, error} = await client
                .from('users')
                .select('id')
                .eq('externalid', authUserId)
                .maybeSingle();

            if (error) {
                console.error('Failed to get user ID by externalid:', error);
                
                // Handle specific error codes
                if (error.code === 'PGRST116' || error.code === '406' || error.code === '400') {
                    console.log('User not found with externalid, trying email fallback...');
                } else {
                    console.log('Database error, skipping email fallback:', error.message);
                    return null;
                }
                
                // If externalid lookup fails, try to get user by email from session
                if (session?.user?.email) {
                    try {
                        console.log('Trying to get user by email:', session.user.email);
                        const {data: emailData, error: emailError} = await client
                            .from('users')
                            .select('id')
                            .eq('email', session.user.email)
                            .maybeSingle();
                        
                        if (emailError) {
                            console.warn('Email lookup failed:', emailError.message);
                            // If it's a schema error, don't try again
                            if (emailError.message.includes('does not exist')) {
                                console.log('Database schema error detected, skipping further attempts');
                                return null;
                            }
                        } else if (emailData) {
                            console.log('Found user by email with ID:', emailData.id);
                            return emailData.id;
                        }
                    } catch (emailLookupError) {
                        console.warn('Email lookup error:', emailLookupError);
                    }
                }
                
                return null;
            }

            if (!data) {
                console.log('No user found with externalid:', authUserId);
                
                // Try to get user by email as fallback
                if (session?.user?.email) {
                    try {
                        console.log('Trying to get user by email as fallback:', session.user.email);
                        const {data: emailData, error: emailError} = await client
                            .from('users')
                            .select('id')
                            .eq('email', session.user.email)
                            .maybeSingle();
                        
                        if (emailError) {
                            console.warn('Fallback email lookup failed:', emailError.message);
                            // If it's a schema error, don't try again
                            if (emailError.message.includes('does not exist')) {
                                console.log('Database schema error detected, skipping further attempts');
                                return null;
                            }
                        } else if (emailData) {
                            console.log('Found user by email with ID:', emailData.id);
                            return emailData.id;
                        }
                    } catch (fallbackError) {
                        console.warn('Fallback email lookup error:', fallbackError);
                    }
                }
                
                return null;
            }

            console.log('Found user with ID:', data.id);
            return data.id;
        } catch (error) {
            console.error('Error getting user ID:', error);
            return null;
        }
    }

    /**
     * Convert app tracking level to database tracking level
     */
    private convertTrackingLevel(appLevel: 'minimal' | 'standard' | 'enhanced'): 'minimal' | 'standard' | 'detailed' {
        return appLevel === 'enhanced' ? 'detailed' : appLevel;
    }

    /**
     * Convert database tracking level to app tracking level
     */
    private convertFromDatabaseTrackingLevel(dbLevel: 'minimal' | 'standard' | 'detailed'): 'minimal' | 'standard' | 'enhanced' {
        return dbLevel === 'detailed' ? 'enhanced' : dbLevel;
    }

    /**
     * Convert database settings to app settings
     */
    private convertToAppSettings(dbSettings: DatabasePrivacySettings): AppPrivacySettings {
        return {
            analytics: dbSettings.analytics,
            marketing_consent: dbSettings.marketingconsent,
            cloud_sync_consent: dbSettings.cloudsyncconsent,
            functional_cookies: dbSettings.functionalcookies,
            tracking_level: this.convertFromDatabaseTrackingLevel(dbSettings.trackinglevel),
            data_retention_period: dbSettings.dataretentionperiod,
            feedback: dbSettings.feedback,
            data_sharing_consent: dbSettings.datasharingconsent,
            ...(dbSettings.updatedat && { updated_at: dbSettings.updatedat })
        };
    }
}

// Export singleton instance
export const privacyService = new PrivacyService();

// Export types for use in store and components
export type {AppPrivacySettings as PrivacySettings, PrivacyConsents};