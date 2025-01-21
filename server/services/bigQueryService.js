const axios = require('axios');
const config = require('../config');

const COUNTRY_CODES = {
  'USA': 'US',
  'United States': 'US',
  'UK': 'GB',
  'United Kingdom': 'GB',
  'Canada': 'CA',
  'Australia': 'AU',
  'France': 'FR',
  'Germany': 'DE',
  'Italy': 'IT',
  'Spain': 'ES',
  'Japan': 'JP',
  'China': 'CN',
  'Brazil': 'BR',
  'India': 'IN',
  'Russia': 'RU',
  'Mexico': 'MX',
  'South Africa': 'ZA',
  // Add more mappings as needed
};

class BigQueryService {
  constructor() {
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
      // Set token expiry to 55 minutes (5 minutes before actual expiry)
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
      
      // Log the raw data structure
      console.log('Raw BigQuery Response:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Log the first row to see the structure
      if (response.data.rows && response.data.rows.length > 0) {
        console.log('\nFirst Row Structure:');
        console.log(JSON.stringify(response.data.rows[0], null, 2));
        
        // Log the fields and their values in a more readable format
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

  async getTableData() {
    try {
      // First ensure we have a valid token
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Failed to get authorization token');
      }

      console.log('Making BigQuery request with token...');
      
      const url = `${config.bigQuery.apiBaseUrl}/projects/${config.bigQuery.projectId}/datasets/${config.bigQuery.datasetId}/tables/${config.bigQuery.tableId}/data`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data || !response.data.rows) {
        console.log('No data returned from BigQuery');
        return this.getEmptyDataStructure();
      }

      const rows = response.data.rows;
      return this.processDataForDashboard(rows);

    } catch (error) {
      console.error('Error fetching BigQuery data:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
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

    // Calculate metrics
    const metrics = {
      interactions: rows.length,
      questions: rows.filter(row => row.f[5].v === "Text" || row.f[5].v === "Button").length,
      uniqueUsers: new Set(rows.map(row => row.f[0].v)).size,
      textQuestions: rows.filter(row => row.f[5].v === "Text").length,
      buttonClicks: rows.filter(row => row.f[5].v === "Button").length,
      avgMessagesPerUser: (rows.length / new Set(rows.map(row => row.f[0].v)).size).toFixed(2)
    };

    // Process conversation topics
    const categoryCount = rows.reduce((acc, row) => {
      const category = row.f[3].v; // User_Statement_Category
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

    // Process interaction types
    const interactionTypes = [
      {
        name: 'Text',
        value: metrics.textQuestions
      },
      {
        name: 'Button',
        value: metrics.buttonClicks
      },
      {
        name: 'Button and Text',
        value: rows.filter(row => 
          row.f[5].v === "Button" && 
          rows.some(r => r.f[0].v === row.f[0].v && r.f[5].v === "Text")
        ).length
      }
    ];

    // Process user locations
    const locationCount = rows.reduce((acc, row) => {
      const location = row.f[2].v; // Location field
      if (location && location !== '0') {
        const countryCode = COUNTRY_CODES[location] || location;
        acc[countryCode] = (acc[countryCode] || 0) + 1;
      }
      return acc;
    }, {});

    const userLocations = Object.entries(locationCount)
      .map(([code, value]) => ({ code, value }))
      .sort((a, b) => b.value - a.value);

    // Process time distribution
    const timeDistribution = rows.reduce((acc, row) => {
      const hour = new Date(row.f[4].v).getHours(); // Timestamp field
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const timeData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      value: timeDistribution[i] || 0
    }));

    return {
      metrics,
      conversationTopics,
      interactionTypes,
      userLocations,
      timeDistribution: timeData
    };
  }

  calculatePeakTimes(rows) {
    // Extract timestamp from conversation ID (last 10 digits are Unix timestamp)
    const hourCounts = rows.reduce((acc, row) => {
      const conversationId = row.f[0].v;  // Get the first field value
      const timestamp = parseInt(conversationId.slice(-10)) * 1000; // Convert to milliseconds
      const hour = new Date(timestamp).getHours();
      
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    // Sort by hour and format for the chart
    return Array.from({ length: 24 }, (_, hour) => ({
      time: `${hour.toString().padStart(2, '0')}:00`,
      users: hourCounts[hour] || 0,
      sessions: Math.floor((hourCounts[hour] || 0) * 0.8) // Assuming 80% of conversations have multiple sessions
    }));
  }

  calculateTrends(rows) {
    // Group by week
    const weekCounts = rows.reduce((acc, row) => {
      const timestamp = new Date(row.f.find(f => f.v.includes('T')).v);
      const week = Math.floor(timestamp.getDate() / 7);
      acc[week] = (acc[week] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(weekCounts).map(([week, count]) => ({
      date: `Week ${parseInt(week) + 1}`,
      value: count
    }));
  }

  calculateLTV(rows) {
    return [
      { period: 'Jan', value: 120 },
      { period: 'Feb', value: 140 },
      { period: 'Mar', value: 180 },
      { period: 'Apr', value: 220 },
      { period: 'May', value: 260 }
    ];
  }

  calculateSentiment(rows) {
    return [
      { time: '1', value: 30 },
      { time: '2', value: 25 },
      { time: '3', value: 35 },
      { time: '4', value: 28 }
    ];
  }

  calculateMarketShare(rows) {
    // Count conversations by country
    const countryCounts = rows.reduce((acc, row) => {
      const country = row.f.find(f => f.v.includes('Country'))?.v || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    // Calculate percentages
    const total = Object.values(countryCounts).reduce((a, b) => a + b, 0);
    return Object.entries(countryCounts).map(([country, count]) => ({
      name: country,
      value: parseFloat(((count / total) * 100).toFixed(2))
    }));
  }

  getCategories(rows) {
    const categories = rows.reduce((acc, row) => {
      const category = row.f.find(f => f.v.includes('category'))?.v || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categories).map(([name, count]) => ({
      name,
      count
    }));
  }

  getCustomers(rows) {
    // Extract unique customers and their sentiment
    const customers = rows.reduce((acc, row) => {
      const name = row.f.find(f => f.v.includes('customer'))?.v;
      const sentiment = row.f.find(f => f.v.includes('sentiment'))?.v;
      
      if (name) {
        if (sentiment === 'positive') {
          acc.happy.add(name);
        } else if (sentiment === 'negative') {
          acc.unhappy.add(name);
        }
      }
      return acc;
    }, { happy: new Set(), unhappy: new Set() });

    return {
      happy: Array.from(customers.happy).slice(0, 5).map(name => ({ name })),
      unhappy: Array.from(customers.unhappy).slice(0, 3).map(name => ({ name }))
    };
  }

  generateInsights(rows) {
    // Generate insights based on the data
    const insights = [];
    
    // Add peak hours insight
    const peakTimes = this.calculatePeakTimes(rows);
    const peakHour = peakTimes.reduce((a, b) => a.users > b.users ? a : b);
    insights.push({
      message: `Peak conversation hours are around ${peakHour.time}`
    });

    // Add volume insight
    const recentCount = rows.filter(row => {
      const date = new Date(row.f.find(f => f.v.includes('T')).v);
      return date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }).length;
    insights.push({
      message: `${recentCount} conversations in the last 7 days`
    });

    return insights;
  }

  getLocations(rows) {
    // Simplified fake data with fewer countries but more realistic numbers
    const fakeLocationData = {
      'US': { value: 2500, name: 'United States' },
      'GB': { value: 1200, name: 'United Kingdom' },
      'FR': { value: 800, name: 'France' },
      'DE': { value: 950, name: 'Germany' },
      'CA': { value: 750, name: 'Canada' },
      'AU': { value: 600, name: 'Australia' },
      'BR': { value: 450, name: 'Brazil' },
      'IN': { value: 1800, name: 'India' },
      'JP': { value: 900, name: 'Japan' },
      'ES': { value: 400, name: 'Spain' }
    };

    // Calculate max value for intensity scaling
    const maxValue = Math.max(...Object.values(fakeLocationData).map(d => d.value));

    // Transform data into required format
    const locations = Object.entries(fakeLocationData).map(([code, data]) => ({
      code,
      name: data.name,
      value: data.value,
      intensity: (data.value / maxValue) * 100
    }));

    console.log("Generated locations data:", locations);
    return locations;
  }
}

module.exports = new BigQueryService(); 