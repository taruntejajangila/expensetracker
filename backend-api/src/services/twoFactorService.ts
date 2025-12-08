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
      
      // Use 2Factor.in SMS endpoint
      // Correct format: https://2factor.in/API/V1/{API_KEY}/SMS/{PHONE}/{OTP}
      // Note: API_KEY comes BEFORE /SMS/ in the URL path
      const url = `/${TWO_FACTOR_API_KEY}/SMS/${cleanPhone}/${otp}`;
      
      logger.info(`Sending OTP via 2Factor.in SMS to ${phone}`);
      logger.info(`2Factor.in API URL: ${TWO_FACTOR_BASE_URL}${url}`);
      
      const response = await axios.get<SendOTPResponse>(url, {
        baseURL: TWO_FACTOR_BASE_URL,
        timeout: 10000, // 10 second timeout
      });

      if (response.data.Status === 'Success') {
        logger.info(`OTP sent successfully via SMS to ${phone}`);
        return true;
      } else {
        logger.error(`Failed to send OTP via SMS: ${response.data.Details || JSON.stringify(response.data)}`);
        logger.error(`2Factor.in SMS response status: ${response.data.Status}`);
        return false;
      }
    } catch (error: any) {
      logger.error('2Factor.in SMS API error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullUrl: `${error.config?.baseURL}${error.config?.url}`
      });
      return false;
    }
  }
}

