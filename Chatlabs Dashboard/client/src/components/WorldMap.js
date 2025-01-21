import React from 'react';
import { VectorMap } from '@react-jvectormap/core';
import { worldMill } from '@react-jvectormap/world';

// Ensure jQuery is available globally as jVectorMap expects it
import $ from 'jquery';
window.$ = window.jQuery = $;

const WorldMap = ({ data }) => {
  // Transform data into the format needed by jVectorMap
  const mapData = React.useMemo(() => {
    return data?.reduce((acc, item) => {
      acc[item.code] = item.value;
      return acc;
    }, {}) || {};
  }, [data]);

  const mapConfig = {
    map: worldMill,
    backgroundColor: '#1a1b1e',
    containerStyle: {
      width: '100%',
      height: '400px'
    },
    series: {
      regions: [{
        values: mapData,
        scale: ['#2c2d32', '#FFD700'],
        normalizeFunction: 'polynomial',
        min: 0,
        max: 2500
      }]
    },
    onRegionTipShow: function(event, label, code) {
      const countryData = data?.find(d => d.code === code);
      if (countryData) {
        label.html(
          `<div class="map-tooltip">${countryData.name}: ${countryData.value.toLocaleString()} users</div>`
        );
      }
    },
    regionStyle: {
      initial: {
        fill: '#2c2d32',
        "fill-opacity": 1,
        stroke: 'none',
        "stroke-width": 0,
        "stroke-opacity": 1
      },
      hover: {
        "fill-opacity": 0.8,
        cursor: 'pointer'
      }
    }
  };

  return (
    <div className="map-container">
      <VectorMap {...mapConfig} />
    </div>
  );
};

export default WorldMap; 