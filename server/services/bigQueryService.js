const { BigQuery } = require('@google-cloud/bigquery');
const config = require('../config');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const req = require('express');

const COUNTRY_CODES = {
  // Europe
  'Albania': 'AL',
  'Andorra': 'AD',
  'Austria': 'AT',
  'Belarus': 'BY',
  'Belgium': 'BE',
  'Bosnia and Herzegovina': 'BA',
  'Bulgaria': 'BG',
  'Croatia': 'HR',
  'Czech Republic': 'CZ',
  'Czechia': 'CZ',
  'Denmark': 'DK',
  'Estonia': 'EE',
  'Finland': 'FI',
  'France': 'FR',
  'Germany': 'DE',
  'Greece': 'GR',
  'Hungary': 'HU',
  'Iceland': 'IS',
  'Ireland': 'IE',
  'Italy': 'IT',
  'Kosovo': 'XK',
  'Latvia': 'LV',
  'Liechtenstein': 'LI',
  'Lithuania': 'LT',
  'Luxembourg': 'LU',
  'Malta': 'MT',
  'Moldova': 'MD',
  'Monaco': 'MC',
  'Montenegro': 'ME',
  'Netherlands': 'NL',
  'North Macedonia': 'MK',
  'Norway': 'NO',
  'Poland': 'PL',
  'Portugal': 'PT',
  'Romania': 'RO',
  'Russia': 'RU',
  'San Marino': 'SM',
  'Serbia': 'RS',
  'Slovakia': 'SK',
  'Slovenia': 'SI',
  'Spain': 'ES',
  'Sweden': 'SE',
  'Switzerland': 'CH',
  'Ukraine': 'UA',
  'United Kingdom': 'GB',
  'UK': 'GB',
  'Vatican City': 'VA',

  // Americas
  'Antigua and Barbuda': 'AG',
  'Argentina': 'AR',
  'Bahamas': 'BS',
  'Barbados': 'BB',
  'Belize': 'BZ',
  'Bolivia': 'BO',
  'Brazil': 'BR',
  'Canada': 'CA',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Costa Rica': 'CR',
  'Cuba': 'CU',
  'Dominica': 'DM',
  'Dominican Republic': 'DO',
  'Ecuador': 'EC',
  'El Salvador': 'SV',
  'Grenada': 'GD',
  'Guatemala': 'GT',
  'Guyana': 'GY',
  'Haiti': 'HT',
  'Honduras': 'HN',
  'Jamaica': 'JM',
  'Mexico': 'MX',
  'Nicaragua': 'NI',
  'Panama': 'PA',
  'Paraguay': 'PY',
  'Peru': 'PE',
  'Saint Kitts and Nevis': 'KN',
  'Saint Lucia': 'LC',
  'Saint Vincent and the Grenadines': 'VC',
  'Suriname': 'SR',
  'Trinidad and Tobago': 'TT',
  'United States': 'US',
  'USA': 'US',
  'Uruguay': 'UY',
  'Venezuela': 'VE',

  // Asia
  'Afghanistan': 'AF',
  'Armenia': 'AM',
  'Azerbaijan': 'AZ',
  'Bahrain': 'BH',
  'Bangladesh': 'BD',
  'Bhutan': 'BT',
  'Brunei': 'BN',
  'Cambodia': 'KH',
  'China': 'CN',
  'Cyprus': 'CY',
  'Georgia': 'GE',
  'India': 'IN',
  'Indonesia': 'ID',
  'Iran': 'IR',
  'Iraq': 'IQ',
  'Israel': 'IL',
  'Japan': 'JP',
  'Jordan': 'JO',
  'Kazakhstan': 'KZ',
  'Kuwait': 'KW',
  'Kyrgyzstan': 'KG',
  'Laos': 'LA',
  'Lebanon': 'LB',
  'Malaysia': 'MY',
  'Maldives': 'MV',
  'Mongolia': 'MN',
  'Myanmar': 'MM',
  'Nepal': 'NP',
  'North Korea': 'KP',
  'Oman': 'OM',
  'Pakistan': 'PK',
  'Palestine': 'PS',
  'Philippines': 'PH',
  'Qatar': 'QA',
  'Saudi Arabia': 'SA',
  'Singapore': 'SG',
  'South Korea': 'KR',
  'Korea': 'KR',
  'Sri Lanka': 'LK',
  'Syria': 'SY',
  'Taiwan': 'TW',
  'Tajikistan': 'TJ',
  'Thailand': 'TH',
  'Timor-Leste': 'TL',
  'Turkey': 'TR',
  'Turkmenistan': 'TM',
  'United Arab Emirates': 'AE',
  'UAE': 'AE',
  'Uzbekistan': 'UZ',
  'Vietnam': 'VN',
  'Yemen': 'YE',

  // Africa
  'Algeria': 'DZ',
  'Angola': 'AO',
  'Benin': 'BJ',
  'Botswana': 'BW',
  'Burkina Faso': 'BF',
  'Burundi': 'BI',
  'Cabo Verde': 'CV',
  'Cameroon': 'CM',
  'Central African Republic': 'CF',
  'Chad': 'TD',
  'Comoros': 'KM',
  'Congo (Brazzaville)': 'CG',
  'Congo (Kinshasa)': 'CD',
  'Côte d’Ivoire': 'CI',
  'Djibouti': 'DJ',
  'Egypt': 'EG',
  'Equatorial Guinea': 'GQ',
  'Eritrea': 'ER',
  'Eswatini': 'SZ',
  'Ethiopia': 'ET',
  'Gabon': 'GA',
  'Gambia': 'GM',
  'Ghana': 'GH',
  'Guinea': 'GN',
  'Guinea-Bissau': 'GW',
  'Kenya': 'KE',
  'Lesotho': 'LS',
  'Liberia': 'LR',
  'Libya': 'LY',
  'Madagascar': 'MG',
  'Malawi': 'MW',
  'Mali': 'ML',
  'Mauritania': 'MR',
  'Mauritius': 'MU',
  'Morocco': 'MA',
  'Mozambique': 'MZ',
  'Namibia': 'NA',
  'Niger': 'NE',
  'Nigeria': 'NG',
  'Rwanda': 'RW',
  'Sao Tome and Principe': 'ST',
  'Senegal': 'SN',
  'Seychelles': 'SC',
  'Sierra Leone': 'SL',
  'Somalia': 'SO',
  'South Africa': 'ZA',
  'South Sudan': 'SS',
  'Sudan': 'SD',
  'Tanzania': 'TZ',
  'Togo': 'TG',
  'Tunisia': 'TN',
  'Uganda': 'UG',
  'Zambia': 'ZM',
  'Zimbabwe': 'ZW',

  // Oceania
  'Australia': 'AU',
  'Fiji': 'FJ',
  'Kiribati': 'KI',
  'Marshall Islands': 'MH',
  'Micronesia': 'FM',
  'Nauru': 'NR',
  'New Zealand': 'NZ',
  'Palau': 'PW',
  'Papua New Guinea': 'PG',
  'Samoa': 'WS',
  'Solomon Islands': 'SB',
  'Tonga': 'TO',
  'Tuvalu': 'TV',
  'Vanuatu': 'VU',

  // Dependent Territories
  'Greenland': 'GL'
};

class BigQueryService {
  constructor() {
    const serviceAccountPath = path.join(__dirname, 'service_account.json');
    
    console.log('Looking for service account file at:', serviceAccountPath);
    console.log('Current directory:', __dirname);
    
    // Check if file exists
    try {
      if (fs.existsSync(serviceAccountPath)) {
        console.log('✅ Service account file found');
        const fileContents = fs.readFileSync(serviceAccountPath, 'utf8');
        console.log('Service account file contents:', fileContents.substring(0, 100) + '...');
      } else {
        console.error('❌ Service account file not found');
        console.log('Directory contents:', fs.readdirSync(__dirname));
      }
    } catch (err) {
      console.error('Error checking for service account file:', err);
    }

    this.bigQueryClient = new BigQuery({
      keyFilename: serviceAccountPath,
      projectId: config.bigQuery.projectId
    });
  } 
  

  async getTableData(userId, dateRange) {
    try {
      console.log('Starting getTableData for user:', userId);
      const user = await User.findById(userId).populate('current_project');
      if (!user?.current_project?.bigquery_config) {
        throw new Error('No project configuration found');
      }
      const { project_id, dataset_id, table_id } = user.current_project.bigquery_config;

      // Determine start and end dates from the provided dateRange
      let startDate, endDate;
      if (typeof dateRange === 'object' && dateRange.startDate && dateRange.endDate) {
        startDate = new Date(dateRange.startDate);
        endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (dateRange) {
        let now = new Date();
        switch (dateRange) {
          case '24h':
            startDate = new Date(now - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'ytd':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          case '1y':
            startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
            break;
          case 'ly': {
            const lastYear = now.getFullYear() - 1;
            startDate = new Date(lastYear, 0, 1);
            now = new Date(lastYear, 11, 31, 23, 59, 59);
            break;
          }
          default:
            startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        }
        endDate = new Date(now);
      } else {
        endDate = new Date();
        startDate = new Date(endDate - 7 * 24 * 60 * 60 * 1000);
      }

      console.log('Filtering data from', startDate.toISOString(), 'to', endDate.toISOString());

      const query = `
WITH base AS (
  SELECT 
    Conversation_ID,
    Date,
    User_Statement_Category,
    Last_Utterance,
    Type_de_navigation,
    Country,
    voiceflow_ip_address,
    customer_ip_address,
    amount
  FROM \`${project_id}.${dataset_id}.${table_id}\`
  WHERE TIMESTAMP(Date) BETWEEN TIMESTAMP(@startDate) AND TIMESTAMP(@endDate)
),
conversion AS (
  SELECT 
    COUNT(*) AS total_matches,
    CAST(SUM(SAFE_CAST(REGEXP_REPLACE(amount_raw, r'[^0-9\\.-]', '') AS FLOAT64)) AS INT64) AS total_amount
  FROM (
    SELECT DISTINCT
      nav1.voiceflow_ip_address,
      nav2.customer_ip_address,
      TRIM(COALESCE(nav1.amount, nav2.amount)) AS amount_raw
    FROM base AS nav1
    JOIN base AS nav2
      ON nav1.voiceflow_ip_address = nav2.customer_ip_address
    WHERE TRIM(COALESCE(nav1.amount, nav2.amount)) <> ''
  )
),
messages AS (
  SELECT COUNT(*) AS messageCount
  FROM base
  WHERE Type_de_navigation IN ('Text', 'Button')
),
uniqueUsers AS (
  SELECT COUNT(DISTINCT voiceflow_ip_address) AS uniqueUserCount
  FROM base
  WHERE voiceflow_ip_address IS NOT NULL
),
interactions AS (
  SELECT COUNT(DISTINCT Conversation_ID) AS interactions
  FROM base
),
textQuestions AS (
  SELECT COUNT(*) AS textQuestions
  FROM base
  WHERE Type_de_navigation = 'Text'
),
buttonClicks AS (
  SELECT COUNT(*) AS buttonClicks
  FROM base
  WHERE Type_de_navigation = 'Button'
),
avgMessages AS (
  SELECT ROUND(m.messageCount / u.uniqueUserCount, 2) AS avgMessagesPerUser
  FROM messages m, uniqueUsers u
),
mostClicked AS (
  SELECT Last_Utterance AS text, COUNT(*) AS count
  FROM base
  WHERE Type_de_navigation = 'Button'
  GROUP BY Last_Utterance
  ORDER BY count DESC
  LIMIT 10
),
conversationInteractions AS (
  SELECT 
    Conversation_ID,
    MAX(CASE WHEN Type_de_navigation = 'Button' THEN 1 ELSE 0 END) AS hasButton,
    MAX(CASE WHEN Type_de_navigation = 'Text' THEN 1 ELSE 0 END) AS hasText
  FROM base
  GROUP BY Conversation_ID
),
conversationsWithBoth AS (
  SELECT COUNT(*) AS conversationsWithBoth
  FROM conversationInteractions
  WHERE hasButton = 1 AND hasText = 1
),
categories AS (
  SELECT 
    User_Statement_Category AS name, 
    COUNT(*) AS count
  FROM base
  WHERE User_Statement_Category IS NOT NULL
    AND User_Statement_Category <> '0'
  GROUP BY User_Statement_Category
),
validTotal AS (
  SELECT SUM(count) AS total_count FROM categories
),
conversationTopics AS (
  SELECT name, ROUND((count / total_count)*100, 2) AS percentage 
  FROM categories, validTotal
  UNION ALL
  SELECT "No data", 100
  FROM UNNEST([1])
  WHERE (SELECT COUNT(*) FROM categories) = 0
  ORDER BY percentage DESC
  LIMIT 10
),
countriesAgg AS (
  SELECT 
    t.code,
    COUNT(*) AS value,
    t.code AS name
  FROM (
    SELECT TRIM(Country) AS code
    FROM base
    WHERE Country IS NOT NULL
      AND TRIM(Country) NOT IN ('0', 'undefined')
  ) t
  GROUP BY t.code
  ORDER BY value DESC
),
peakTimes AS (
  WITH hourly_counts AS (
    SELECT 
      EXTRACT(HOUR FROM TIMESTAMP(Date)) AS hour, 
      COUNT(*) AS count
    FROM base
    WHERE Date IS NOT NULL 
      AND Date <> '0'
      AND Conversation_ID IS NOT NULL
    GROUP BY hour
  ),
  hours AS (
    SELECT hour FROM UNNEST(GENERATE_ARRAY(0, 23)) AS hour
  )
  SELECT 
    LPAD(CAST(hours.hour AS STRING), 2, '0') || ':00' AS label,
    IFNULL(hourly_counts.count, 0) AS value
  FROM hours
  LEFT JOIN hourly_counts ON hours.hour = hourly_counts.hour
  ORDER BY hours.hour
),
interactionTypeData AS (
  SELECT * FROM (
    SELECT 'Button' AS name, (SELECT buttonClicks.buttonClicks FROM buttonClicks) AS value
    UNION ALL
    SELECT 'Text', (SELECT textQuestions.textQuestions FROM textQuestions)
    UNION ALL
    SELECT 'Button and Text', (SELECT conversationsWithBoth.conversationsWithBoth FROM conversationsWithBoth)
    UNION ALL
    SELECT 'All', ((SELECT buttonClicks.buttonClicks FROM buttonClicks) + (SELECT textQuestions.textQuestions FROM textQuestions))
  )
)
SELECT 
  (SELECT interactions FROM interactions) AS interactions,
  (SELECT messageCount FROM messages) AS questionsCount,
  (SELECT uniqueUserCount FROM uniqueUsers) AS uniqueUserCount,
  (SELECT textQuestions FROM textQuestions) AS textQuestions,
  (SELECT buttonClicks FROM buttonClicks) AS buttonClicks,
  (SELECT avgMessagesPerUser FROM avgMessages) AS avgMessagesPerUser,
  (SELECT STRUCT(total_matches, total_amount) FROM conversion) AS conversion,
  (SELECT ARRAY_AGG(STRUCT(text, count)) FROM mostClicked) AS mostClickedButtons,
  (SELECT conversationsWithBoth FROM conversationsWithBoth) AS conversationsWithBoth,
  (SELECT ARRAY_AGG(STRUCT(name, percentage)) FROM conversationTopics) AS conversationTopics,
  (SELECT ARRAY_AGG(STRUCT(code, value, name)) FROM countriesAgg) AS countries,
  (SELECT ARRAY_AGG(STRUCT(label, value)) FROM peakTimes) AS peakTimes,
  (SELECT ARRAY_AGG(STRUCT(name, value)) FROM interactionTypeData) AS interactionTypeData
;
      `;

      console.log('Executing aggregated query...');
      const options = {
        query,
        useLegacySql: false,
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };

      const [result] = await this.bigQueryClient.query(options);
      console.log('Aggregated result:', JSON.stringify(result, null, 2));

      if (result && result.length > 0 && result[0].countries && Array.isArray(result[0].countries)) {
        result[0].countries = result[0].countries.map(item => {
          const originalCountry = item.code; 
          const mappedCode = COUNTRY_CODES[originalCountry] || originalCountry;
          console.log(`Mapping country: ${originalCountry} -> ${mappedCode}`);
          return {
            ...item,
            code: mappedCode, 
            name: item.name
          };
        });
      }

      return result;

    } catch (error) {
      console.error('Error fetching aggregated BigQuery data:', error);
      throw error;
    }
  }

  getEmptyDataStructure() {
    return {
      metrics: {
        interactions: 0,
        questionsCount: 0,
        uniqueUserCount: 0,
        textQuestions: 0,
        buttonClicks: 0,
        avgMessagesPerUser: '0.00'
      },
      conversion: { total_matches: 0, total_amount: 0 },
      mostClickedButtons: [],
      conversationsWithBoth: 0,
      conversationTopics: [],
      countries: Object.entries(COUNTRY_CODES).map(([country, code]) => ({
        code,
        name: code,
        value: 0
      })),
      peakTimes: [],
      interactionTypeData: []
    };
  }
}

module.exports = new BigQueryService();
