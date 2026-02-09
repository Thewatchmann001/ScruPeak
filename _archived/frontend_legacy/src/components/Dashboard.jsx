import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message } from 'antd';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGridStore } from '../services/store';

export const Dashboard = () => {
  const { grids, statistics, getHierarchy, getStatistics, loading } = useGridStore();
  const [selectedGrid, setSelectedGrid] = useState(null);

  useEffect(() => {
    getHierarchy().catch(() => message.error('Failed to load grids'));
  }, [getHierarchy]);

  useEffect(() => {
    if (grids.length > 0 && !selectedGrid) {
      setSelectedGrid(grids[0].id);
      getStatistics(grids[0].id);
    }
  }, [grids, selectedGrid, getStatistics]);

  if (loading) return <Spin size="large" />;

  const chartData = statistics ? [
    { name: 'Total Parcels', value: statistics.parcel_count },
    { name: 'Active Parcels', value: statistics.active_parcels },
  ] : [];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Land Registry Dashboard</h1>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Parcels"
              value={statistics?.parcel_count || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Parcels"
              value={statistics?.active_parcels || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Coverage %"
              value={statistics?.coverage_percentage || 0}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Grid Area (sq km)"
              value={(statistics?.grid_area_sqm / 1000000) || 0}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="Parcel Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Coverage Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={[{ name: 'Coverage', coverage: statistics?.coverage_percentage || 0 }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="coverage" stroke="#1890ff" fill="#1890ff" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
