import { supabase } from '../lib/supabaseClient';

class UserProfileService {
  async getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session?.user ?? null;
  }

  /**
   * Get user profile, create if doesn't exist
   * @returns {Promise<Object>} User profile with default_alerts_initialized flag
   */
  async getOrCreateProfile() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Try to get existing profile
    const { data: existing, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle?.() ?? { data: null, error: null };

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', fetchError);
      throw fetchError;
    }

    if (existing) {
      return this._toCamel(existing);
    }

    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        user_email: user.email,
        default_alerts_initialized: false
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user profile:', createError);
      throw createError;
    }

    return this._toCamel(newProfile);
  }

  /**
   * Mark that default alerts have been initialized for this user
   * @returns {Promise<Object>} Updated profile
   */
  async markDefaultAlertsInitialized() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        user_email: user.email,
        default_alerts_initialized: true
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error marking alerts initialized:', error);
      throw error;
    }

    return this._toCamel(data);
  }

  /**
   * Check if user needs default alerts initialization
   * @returns {Promise<boolean>} True if user needs initialization, false otherwise
   */
  async needsDefaultAlertsInitialization() {
    try {
      const profile = await this.getOrCreateProfile();
      return !profile.defaultAlertsInitialized;
    } catch (error) {
      console.error('Error checking initialization status:', error);
      return false; // Safe default - don't initialize on error
    }
  }

  _toCamel(row) {
    return {
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      defaultAlertsInitialized: row.default_alerts_initialized,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

const userProfileService = new UserProfileService();
export default userProfileService;

