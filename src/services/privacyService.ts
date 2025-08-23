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
    user_id: number;
    analytics: boolean;
    feedback: boolean;
    functional_cookies: boolean;
    consent_date: string;
    consent_version: string;
    cloud_sync_consent: boolean;
    data_retention_period: number;
    anonymize_after: number;
    tracking_level: 'minimal' | 'standard' | 'detailed';
    data_sharing_consent: boolean;
    marketing_consent: boolean;
    created_at?: string;
    updated_at?: string;
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
    user_id: number;
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
            const userId = await this.getUserId(authUserId);
            if (!userId) {
                throw new Error('User not found');
            }

            const privacySettings: Omit<DatabasePrivacySettings, 'id' | 'created_at' | 'updated_at'> = {
                user_id: userId,
                analytics: consents.analytics,
                feedback: consents.analytics,
                functional_cookies: true,
                consent_date: new Date().toISOString(),
                consent_version: '1.0',
                cloud_sync_consent: consents.cloudSync,
                data_retention_period: 365,
                anonymize_after: 730,
                tracking_level: consents.analytics ? 'standard' : 'minimal',
                data_sharing_consent: false,
                marketing_consent: consents.marketing
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
            const userId = await this.getUserId(authUserId);
            if (!userId) {
                return null;
            }

            const {data, error} = await client
                .from('privacy_settings')
                .select('*')
                .eq('user_id', userId)
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
                updated_at: new Date().toISOString()
            };

            if ('analytics' in updates) dbUpdates.analytics = updates.analytics;
            if ('marketing_consent' in updates) dbUpdates.marketing_consent = updates.marketing_consent;
            if ('cloud_sync_consent' in updates) dbUpdates.cloud_sync_consent = updates.cloud_sync_consent;
            if ('functional_cookies' in updates) dbUpdates.functional_cookies = updates.functional_cookies;
            if ('data_retention_period' in updates) dbUpdates.data_retention_period = updates.data_retention_period;
            if ('feedback' in updates) dbUpdates.feedback = updates.feedback;
            if ('data_sharing_consent' in updates) dbUpdates.data_sharing_consent = updates.data_sharing_consent;

            if ('tracking_level' in updates && updates.tracking_level) {
                dbUpdates.tracking_level = this.convertTrackingLevel(updates.tracking_level);
            }

            const {error} = await client
                .from('privacy_settings')
                .update(dbUpdates)
                .eq('user_id', userId);

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

            const {data, error} = await client.rpc('cleanup_user_data', {
                user_bigint: userId
            });

            if (error || !data) {
                console.error('Failed to delete user data:', error);
                throw new Error('Failed to delete user data');
            }

            console.log('All user data deleted successfully for user:', userId);
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
                .eq('user_id', userId)
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
            const {data, error} = await client
                .from('users')
                .select('id')
                .eq('external_id', authUserId)
                .single();

            if (error || !data) {
                console.error('Failed to get user ID:', error);
                return null;
            }

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
            marketing_consent: dbSettings.marketing_consent,
            cloud_sync_consent: dbSettings.cloud_sync_consent,
            functional_cookies: dbSettings.functional_cookies,
            tracking_level: this.convertFromDatabaseTrackingLevel(dbSettings.tracking_level),
            data_retention_period: dbSettings.data_retention_period,
            feedback: dbSettings.feedback,
            data_sharing_consent: dbSettings.data_sharing_consent,
            updated_at: dbSettings.updated_at
        };
    }
}

// Export singleton instance
export const privacyService = new PrivacyService();

// Export types for use in store and components
export type {AppPrivacySettings as PrivacySettings, PrivacyConsents};