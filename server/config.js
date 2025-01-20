require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || 'development',
  bigQuery: {
    projectId: process.env.BIGQUERY_PROJECT_ID,
    datasetId: process.env.BIGQUERY_DATASET_ID,
    tableId: process.env.BIGQUERY_TABLE_ID
  },
  mongodb: {
    uri: process.env.MONGODB_URI
  }
}; 