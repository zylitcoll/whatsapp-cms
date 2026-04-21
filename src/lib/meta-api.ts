import axios from 'axios';

interface SendMessageParams {
  recipientPhoneNumber: string;
  messageContent: Record<string, any>;
  messageType: 'text' | 'template' | 'media' | 'interactive';
}

interface SendTemplateParams {
  recipientPhoneNumber: string;
  templateName: string;
  templateLanguage?: string;
  templateVariables?: string[];
}

/**
 * Meta WhatsApp API Client
 * Handles all communication with Meta's WhatsApp Cloud API
 */
class MetaApiClient {
  private client: AxiosInstance;
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;

  constructor() {
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.apiVersion = process.env.META_API_VERSION || 'v18.0';

    this.client = axios.create({
      baseURL: `https://graph.instagram.com/${this.apiVersion}`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Send a text message
   */
  async sendTextMessage(
    toPhoneNumber: string,
    text: string
  ): Promise<{ messageId: string; success: boolean }> {
    try {
      const response = await this.client.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: toPhoneNumber.replace(/\D/g, ''),
          type: 'text',
          text: { body: text },
        }
      );

      return {
        messageId: response.data.messages[0].id,
        success: true,
      };
    } catch (error: any) {
      console.error('Error sending text message:', error.response?.data || error.message);
      throw new Error(`Failed to send text message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(params: SendTemplateParams): Promise<{ messageId: string; success: boolean }> {
    try {
      const response = await this.client.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: params.recipientPhoneNumber.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: params.templateName,
            language: {
              code: params.templateLanguage || 'en',
            },
            components: params.templateVariables
              ? [
                  {
                    type: 'body',
                    parameters: params.templateVariables.map((v) => ({
                      type: 'text',
                      text: v,
                    })),
                  },
                ]
              : undefined,
          },
        }
      );

      return {
        messageId: response.data.messages[0].id,
        success: true,
      };
    } catch (error: any) {
      console.error('Error sending template:', error.response?.data || error.message);
      throw new Error(
        `Failed to send template: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Send a media message (image, video, audio, document)
   */
  async sendMediaMessage(
    toPhoneNumber: string,
    mediaType: 'image' | 'video' | 'audio' | 'document',
    mediaUrl: string,
    caption?: string
  ): Promise<{ messageId: string; success: boolean }> {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to: toPhoneNumber.replace(/\D/g, ''),
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
        },
      };

      if (caption && (mediaType === 'image' || mediaType === 'video')) {
        payload[mediaType].caption = caption;
      }

      const response = await this.client.post(`/${this.phoneNumberId}/messages`, payload);

      return {
        messageId: response.data.messages[0].id,
        success: true,
      };
    } catch (error: any) {
      console.error('Error sending media:', error.response?.data || error.message);
      throw new Error(
        `Failed to send media: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Send an interactive message (buttons, list)
   */
  async sendInteractiveMessage(
    toPhoneNumber: string,
    interactive: Record<string, any>
  ): Promise<{ messageId: string; success: boolean }> {
    try {
      const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        to: toPhoneNumber.replace(/\D/g, ''),
        type: 'interactive',
        interactive,
      });

      return {
        messageId: response.data.messages[0].id,
        success: true,
      };
    } catch (error: any) {
      console.error('Error sending interactive:', error.response?.data || error.message);
      throw new Error(
        `Failed to send interactive message: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });
      return true;
    } catch (error: any) {
      console.error('Error marking message as read:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get media by ID (returns download URL)
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const response = await this.client.get(`/${mediaId}`);
      return response.data.url;
    } catch (error: any) {
      console.error('Error getting media URL:', error.response?.data || error.message);
      throw new Error(`Failed to get media URL: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Download media from URL
   */
  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error downloading media:', error.message);
      throw new Error(`Failed to download media: ${error.message}`);
    }
  }

  /**
   * Get contact info from WhatsApp
   */
  async getContactInfo(phoneNumber: string): Promise<{ name: string; picture?: string } | null> {
    try {
      const cleanedNumber = phoneNumber.replace(/\D/g, '');
      // This is a simplified version. Actual implementation depends on Meta's API capabilities
      // Meta doesn't provide a direct endpoint to get contact info, so this would typically
      // come from the webhook or stored in your database
      return null;
    } catch (error: any) {
      console.error('Error getting contact info:', error.message);
      return null;
    }
  }
}

// Export singleton instance
export const metaApi = new MetaApiClient();
