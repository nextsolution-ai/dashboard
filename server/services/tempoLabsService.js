const axios = require('axios');
const config = require('../config');

class TempoLabsService {
  async sendData(rows) {
    try {
      const headers = {
        'Content-Type': 'application/json'
        // Add any required TempoLabs authentication headers here
      };

      const payload = { data: rows };

      const response = await axios.post(
        config.tempoLabs.apiEndpoint,
        payload,
        { headers }
      );

      console.log(`Successfully sent ${rows.length} rows to TempoLabs`);
      return response.data;
    } catch (error) {
      console.error('Failed to send data to TempoLabs:', error);
      throw error;
    }
  }
}

module.exports = new TempoLabsService(); 