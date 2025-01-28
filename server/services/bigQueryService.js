const axios = require('axios');
const config = require('../config');
const User = require('../models/User');
const req = require('express');

const COUNTRY_CODES = {
  // Europe
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'United Kingdom': 'GB',
  'UK': 'GB',
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Poland': 'PL',
  'Ireland': 'IE',
  'Portugal': 'PT',
  'Greece': 'GR',

  // Americas
  'United States': 'US',
  'USA': 'US',
  'Canada': 'CA',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Peru': 'PE',

  // Asia Pacific
  'China': 'CN',
  'Japan': 'JP',
  'South Korea': 'KR',
  'Korea': 'KR',
  'India': 'IN',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Singapore': 'SG',
  'Malaysia': 'MY',
  'Indonesia': 'ID',
  'Thailand': 'TH',
  'Vietnam': 'VN',
  'Philippines': 'PH',

  // Middle East & Africa
  'South Africa': 'ZA',
  'United Arab Emirates': 'AE',
  'UAE': 'AE',
  'Saudi Arabia': 'SA',
  'Israel': 'IL',
  'Turkey': 'TR',
  'Egypt': 'EG'
};

class BigQueryService {
  constructor() {
    this.baseURL = process.env.BIGQUERY_API_URL || 'https://bigquery.googleapis.com/bigquery/v2';
    this.authToken = null;
    this.tokenExpiry = null;
  }

  async refreshAuthToken() {
    try {
      console.log('Refreshing auth token...');
      const response = await axios.get(config.bigQuery.authTokenUrl);

      if (!response.data || !response.data.access_token) {
        console.error('Invalid token response:', response.data);
        throw new Error('Invalid token response from auth server');
      }

      this.authToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (55 * 60 * 1000);

      console.log('Token refreshed successfully');
      return this.authToken;
    } catch (error) {
      console.error('Error refreshing auth token:', error.response?.data || error.message);
      throw error;
    }
  }

  async getAuthToken() {
    try {
      if (!this.authToken || Date.now() >= this.tokenExpiry) {
        await this.refreshAuthToken();
      }
      return this.authToken;
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw error;
    }
  }

  async getHeaders() {
    const token = await this.getAuthToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getRawData() {
    try {
      const { projectId, datasetId, tableId, apiBaseUrl } = config.bigQuery;
      const url = `${apiBaseUrl}/projects/${projectId}/datasets/${datasetId}/tables/${tableId}/data`;
      const headers = await this.getHeaders();

      const response = await axios.get(url, { headers });

      console.log('Raw BigQuery Response:');
      console.log(JSON.stringify(response.data, null, 2));

      if (response.data.rows && response.data.rows.length > 0) {
        console.log('\nFirst Row Structure:');
        console.log(JSON.stringify(response.data.rows[0], null, 2));

        console.log('\nFirst Row Fields:');
        response.data.rows[0].f.forEach((field, index) => {
          console.log(`Field ${index}: ${field.v}`);
        });
      }

      return response.data.rows || [];
    } catch (error) {
      console.error('Failed to fetch raw data from BigQuery:', error);
      throw error;
    }
  }

  async getTableData(userId) {
    try {
      // Get the current user's project
      const user = await User.findById(userId).populate('current_project');
      const project = user.current_project;

      if (!project) {
        throw new Error('No project selected');
      }

      const { project_id, dataset_id, table_id } = project.bigquery_config;

      // Use the project credentials
      const url = `${config.bigQuery.apiBaseUrl}/projects/${project_id}/datasets/${dataset_id}/tables/${table_id}/data`;
      const headers = await this.getHeaders();

      const response = await axios.get(url, { headers });
      return this.processDataForDashboard(response.data.rows || []);
    } catch (error) {
      console.error('Error fetching BigQuery data:', error);
      throw error;
    }
  }

  getEmptyDataStructure() {
    return {
      metrics: {
        interactions: 0,
        questions: 0,
        uniqueUsers: 0,
        textQuestions: 0,
        buttonClicks: 0,
        avgMessagesPerUser: '0.00'
      },
      conversationTopics: [{
        name: "No data",
        value: 100
      }],
      interactionTypes: [],
      userLocations: [],
      timeDistribution: []
    };
  }

  processDataForDashboard(rows) {
    console.log(`Processing ${rows.length} total interactions`);

    // Safely get field value with null check
    const safeGetFieldValue = (row, index) => {
      return row?.f?.[index]?.v || null;
    };

    // Count unique IP addresses for interactions (field 7)
    const uniqueIPs = new Set(
      rows.filter(row => safeGetFieldValue(row, 7))
          .map(row => safeGetFieldValue(row, 7))
    ).size;

    // Calculate conversion metrics
    const voiceflowIPs = new Set(
      rows.filter(row => safeGetFieldValue(row, 7))
          .map(row => safeGetFieldValue(row, 7).trim().toLowerCase())
    );
    
    const customerIPs = new Set(
      rows.filter(row => safeGetFieldValue(row, 9))
          .map(row => safeGetFieldValue(row, 9).trim().toLowerCase())
    );

    // Find intersection of IPs
    const matchingIPs = [...voiceflowIPs].filter(ip => customerIPs.has(ip)).length;

    const conversionMetrics = {
      percentage: voiceflowIPs.size > 0 
        ? ((matchingIPs / voiceflowIPs.size) * 100).toFixed(2)
        : 0,
      matched: matchingIPs,
      total: voiceflowIPs.size
    };

    const metrics = {
      interactions: uniqueIPs,
      questions: rows.filter(row => 
        safeGetFieldValue(row, 5) === "Text" || 
        safeGetFieldValue(row, 5) === "Button"
      ).length,
      uniqueUsers: new Set(
        rows.filter(row => safeGetFieldValue(row, 0))
            .map(row => safeGetFieldValue(row, 0))
      ).size,
      textQuestions: rows.filter(row => 
        safeGetFieldValue(row, 5) === "Text"
      ).length,
      buttonClicks: rows.filter(row => 
        safeGetFieldValue(row, 5) === "Button"
      ).length,
      avgMessagesPerUser: (
        rows.length / 
        new Set(rows.filter(row => safeGetFieldValue(row, 0))
                   .map(row => safeGetFieldValue(row, 0))).size
      ).toFixed(2),
      conversion: conversionMetrics
    };

    const buttonClicks = rows
      .filter(row => safeGetFieldValue(row, 5) === "Button")
      .reduce((acc, row) => {
        const buttonText = safeGetFieldValue(row, 4);
        acc[buttonText] = (acc[buttonText] || 0) + 1;
        return acc;
      }, {});

    const mostClickedButtons = Object.entries(buttonClicks)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const conversationInteractions = rows.reduce((acc, row) => {
      const conversationId = safeGetFieldValue(row, 1);
      if (!acc[conversationId]) {
        acc[conversationId] = { hasButton: false, hasText: false };
      }
      if (safeGetFieldValue(row, 5) === "Button") acc[conversationId].hasButton = true;
      if (safeGetFieldValue(row, 5) === "Text") acc[conversationId].hasText = true;
      return acc;
    }, {});

    // Add this near the other interaction type calculations
    const aiResponses = rows.filter(row => {
      const type = safeGetFieldValue(row, 5);
      const turnType = safeGetFieldValue(row, 8); // Assuming type is in field 8
      return type === "Text" && 
             turnType === "request" && 
             safeGetFieldValue(row, 4)?.includes("asst_"); // Check for assistant ID in the message
    }).length;

    const interactionTypeData = [
      {
        name: "AI",
        value: aiResponses
      },
      {
        name: "Button",
        value: metrics.buttonClicks
      },
      {
        name: "Text",
        value: metrics.textQuestions
      },
      {
        name: "Button and Text",
        value: Object.values(conversationInteractions)
          .filter(conv => conv.hasButton && conv.hasText).length
      },
      {
        name: "All",
        value: metrics.buttonClicks + metrics.textQuestions + aiResponses
      }
    ];

    const categoryCount = rows.reduce((acc, row) => {
      const category = safeGetFieldValue(row, 3);
      if (category && category !== '0') {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {});

    const conversationTopics = Object.keys(categoryCount).length > 0
      ? Object.entries(categoryCount)
          .map(([name, count]) => ({
            name,
            value: parseFloat(((count / rows.length) * 100).toFixed(2))
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      : [{ name: "No data", value: 100 }];

    const locationCount = rows.reduce((acc, row) => {
      const location = safeGetFieldValue(row, 6);
      if (location && location !== '0' && location !== 'undefined') {
        const countryCode = COUNTRY_CODES[location.trim()];
        if (countryCode) {
          acc[countryCode] = (acc[countryCode] || 0) + 1;
        }
      }
      return acc;
    }, {});

    const locations = Object.entries(locationCount)
      .map(([code, value]) => ({
        code,
        value,
        name: Object.keys(COUNTRY_CODES).find(key => COUNTRY_CODES[key] === code) || code
      }))
      .sort((a, b) => b.value - a.value);

    // Update time distribution calculation using field 2 (timestamp)
    const timeDistribution = rows.reduce((acc, row) => {
      const timestamp = safeGetFieldValue(row, 2);
      // Skip if timestamp is 0, null, undefined, or invalid
      if (timestamp && timestamp !== '0' && timestamp !== 0) {
        try {
          const date = new Date(timestamp);
          // Verify it's a valid date before processing
          if (!isNaN(date.getTime())) {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            if (!acc[hours]) {
              acc[hours] = {
                time: formattedTime,
                hour: hours,
                count: 0
              };
            }
            acc[hours].count += 1;
          }
        } catch (error) {
          console.log('Invalid date:', timestamp);
        }
      }
      return acc;
    }, {});

    // Convert to array and sort by hour, only including hours with actual data
    const timeData = Object.values(timeDistribution)
      .sort((a, b) => a.hour - b.hour)
      .map(({ time, count }) => ({
        label: time,
        value: count
      }))
      .filter(data => data.value > 0); // Only include non-zero values

    // Fill in missing hours with zero counts
    const fullTimeData = Array.from({ length: 24 }, (_, i) => {
      const existingData = timeData.find(d => parseInt(d.label) === i);
      return existingData || {
        label: `${i.toString().padStart(2, '0')}:00`,
        value: 0
      };
    });

    return {
      metrics,
      mostClickedButtons,
      interactionTypeData,
      conversationTopics,
      locations,
      timeDistribution: fullTimeData
    };
  }
}

module.exports = new BigQueryService();
