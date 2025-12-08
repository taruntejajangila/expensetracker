import axios from 'axios';
import { logger } from '../utils/logger';

const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY || '';
const TWO_FACTOR_BASE_URL = 'https://2factor.in/API/V1';

interface SendOTPResponse {
  Status: string;
  Details: string;
}

export class TwoFactorService {
  /**
   * Send OTP to phone number via 2Factor.in
   * @param phone Phone number with country code (e.g., +919876543210)
   * @param otp The OTP code to send
   * @returns Promise with success status
   */
  static async sendOTP(phone: string, otp: string): Promise<boolean> {
    try {
      if (!TWO_FACTOR_API_KEY) {
        logger.error('2Factor.in API key not configured');
        return false;
      }

      // Remove + from phone number for 2Factor.in API
      const cleanPhone = phone.replace(/^\+/, '');
      
      // Use 2Factor.in Transactional SMS endpoint (TSMS) - guarantees SMS delivery, no voice call fallback
      // Format: /ADDON_SERVICES/SEND/TSMS/{API_KEY}/{PHONE}/{OTP}
      // This endpoint ensures SMS-only delivery and will NOT fall back to voice calls
      const url = `/ADDON_SERVICES/SEND/TSMS/${TWO_FACTOR_API_KEY}/${cleanPhone}/${otp}`;
      
      logger.info(`Sending OTP via 2Factor.in Transactional SMS (TSMS) to ${phone}`);
      
      const response = await axios.get<SendOTPResponse>(url, {
        baseURL: TWO_FACTOR_BASE_URL,
        timeout: 10000, // 10 second timeout
      });

      if (response.data.Status === 'Success') {
        logger.info(`OTP sent successfully via Transactional SMS (TSMS) to ${phone}`);
        return true;
      } else {
        logger.error(`Failed to send OTP via TSMS: ${response.data.Details || response.data}`);
        logger.error(`2Factor.in TSMS response status: ${response.data.Status}`);
        return false;
      }
    } catch (error: any) {
      logger.error('2Factor.in TSMS API error:', error.message);
      if (error.response) {
        logger.error('2Factor.in TSMS API response status:', error.response.status);
        logger.error('2Factor.in TSMS API response data:', error.response.data);
      }
      if (error.request) {
        logger.error('2Factor.in TSMS API request details:', {
          url: error.config?.url,
          baseURL: error.config?.baseURL
        });
      }
      return false;
    }
  }
}

