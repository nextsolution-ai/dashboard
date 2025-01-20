import React, { useState, useEffect } from 'react';
import { fetchAnalyticsData } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
  ComposedChart, Area, Scatter, BarChart, Bar
} from 'recharts';
import WorldMap from './WorldMap';
import './Dashboard.css';
import Sidebar from './Sidebar';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const TOPIC_COLORS = {
  'Support': '#00B8D9',
  'Store/Shop': '#FF8B00',
  'Recommendations': '#FF5630',
  'General Information': '#36B37E',
  'Other Topics': '#6554C0',
  'Location': '#FFAB00',
  'Daily Usage': '#8777D9',
  'Other': '#998DD9',
  'faq': '#C1C7D0'
};

const INTERACTION_COLORS = {
  'Button': '#FF69B4', // Pink
  'Text': '#FFD700',   // Yellow
  'Button and Text': '#FFA07A', // Light salmon
  'All': '#FF6B6B'     // Red
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchAnalyticsData();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <div className="top-bar">
          <h1>Analytics Dashboard</h1>
          <div className="action-buttons">
            <button className="re-arrange-btn">Re-arrange</button>
          </div>
        </div>
        
        <div className="dashboard">
          {/* Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Interactions</h3>
              <div className="metric-value">{data?.metrics?.interactions || 0}</div>
            </div>
            <div className="metric-card">
              <h3>Questions</h3>
              <div className="metric-value">{data?.metrics?.questions || 0}</div>
            </div>
            <div className="metric-card">
              <h3>Unique Users</h3>
              <div className="metric-value">{data?.metrics?.uniqueUsers || 0}</div>
            </div>
            <div className="metric-card">
              <h3>Text Questions</h3>
              <div className="metric-value">{data?.metrics?.textQuestions || 0}</div>
            </div>
            <div className="metric-card">
              <h3>Button Clicks</h3>
              <div className="metric-value">{data?.metrics?.buttonClicks || 0}</div>
            </div>
            <div className="metric-card">
              <h3>Avg Messages/User</h3>
              <div className="metric-value">{data?.metrics?.avgMessagesPerUser || '0.00'}</div>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Second row */}
            {/* Topics of Conversation (Donut) */}
            <div className="dashboard-card topics-card">
              <h2>Conversation Topics</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.conversationTopics}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      value,
                      name
                    }) => {
                      if (name === "No data") {
                        return (
                          <text
                            x={cx}
                            y={cy}
                            dy={8}
                            textAnchor="middle"
                            fill="#a0a0a0"
                          >
                            No data
                          </text>
                        );
                      }
                      
                      const RADIAN = Math.PI / 180;
                      const radius = 25 + innerRadius + (outerRadius - innerRadius);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#a0a0a0"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                        >
                          {`${name} (${value}%)`}
                        </text>
                      );
                    }}
                  >
                    {data?.conversationTopics.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.name === "No data" ? "#444444" : (TOPIC_COLORS[entry.name] || COLORS[index % COLORS.length])}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Interaction Types */}
            <div className="dashboard-card interaction-types-card">
              <h2>Interaction Types</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.interactionTypeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  >
                    {data?.interactionTypeData?.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={INTERACTION_COLORS[entry.name]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Conversion Metrics */}
            <div className="dashboard-card conversion-metrics-card">
              <h2>Conversion Metrics</h2>
              <div className="conversion-stats">
                <div className="stat-item">
                  <h3>Revenue this month</h3>
                  <div className="stat-value">$0</div>
                </div>
                <div className="stat-item">
                  <h3>Chatbot Conversion</h3>
                  <div className="stat-row">
                    <div>
                      <span>Our conversion</span>
                      <span className="stat-value">0%</span>
                    </div>
                    <div>
                      <span>Their conversion</span>
                      <span className="stat-value">0%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sentiment Chart */}
            <div className="dashboard-card sentiment-card">
              <h2>Sentiment</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.sentiment || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Third row */}
            {/* Most Clicked Buttons */}
            <div className="dashboard-card button-clicks-card">
              <h2>Most Clicked Buttons</h2>
              <div className="button-clicks-table">
                <table>
                  <thead>
                    <tr>
                      <th>Button Text</th>
                      <th>Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.buttonClicks?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.text}</td>
                        <td>{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Map */}
            <div className="dashboard-card map-card">
              <h2>Location Heat map</h2>
              <div className="map-container">
                <WorldMap data={data?.locations} />
              </div>
            </div>

            {/* Peak Times */}
            <div className="dashboard-card peak-times-card">
              <h2>Peak Times</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.peakTimes || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 