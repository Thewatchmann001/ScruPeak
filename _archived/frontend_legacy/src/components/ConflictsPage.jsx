import React, { useEffect, useState } from 'react';
import { Table, Space, Button, Modal, Form, message, Spin, Tag, Popconfirm } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useConflictStore } from '../services/store';

export const ConflictsPage = ({ gridId }) => {
  const { conflicts, loading, fetchConflicts, detectConflicts, resolveConflict } = useConflictStore();
  const [resolveVisible, setResolveVisible] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (gridId) {
      fetchConflicts(gridId);
    }
  }, [gridId, fetchConflicts]);

  const handleDetect = async () => {
    try {
      await detectConflicts(gridId);
      message.success('Conflict detection completed');
    } catch (error) {
      message.error('Failed to detect conflicts');
    }
  };

  const handleResolve = async (conflictId, resolutionMethod) => {
    try {
      await resolveConflict(conflictId, { resolution_method: resolutionMethod });
      message.success('Conflict resolved');
      setResolveVisible(false);
    } catch (error) {
      message.error('Failed to resolve conflict');
    }
  };

  const columns = [
    {
      title: 'Parcel 1',
      dataIndex: 'parcel_code_1',
      key: 'parcel_code_1',
    },
    {
      title: 'Parcel 2',
      dataIndex: 'parcel_code_2',
      key: 'parcel_code_2',
    },
    {
      title: 'Type',
      dataIndex: 'conflict_type',
      key: 'conflict_type',
      render: (type) => (
        <Tag color={type === 'OVERLAP' ? 'orange' : 'red'}>{type}</Tag>
      ),
    },
    {
      title: 'Overlap (sq m)',
      dataIndex: 'overlap_area_sqm',
      key: 'overlap_area_sqm',
      render: (area) => area?.toFixed(2) || 'N/A',
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence_score',
      key: 'confidence_score',
      render: (score) => (
        <Tag color={score > 0.9 ? 'red' : 'orange'}>
          {(score * 100).toFixed(0)}%
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'resolved',
      key: 'resolved',
      render: (resolved) => (
        <Tag color={resolved ? 'green' : 'red'}>
          {resolved ? 'Resolved' : 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        !record.resolved && (
          <Popconfirm
            title="Resolve Conflict?"
            description="Mark this conflict as resolved."
            onConfirm={() => handleResolve(record.id, 'MANUAL_ADJUDICATION')}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" size="small">
              <CheckOutlined /> Resolve
            </Button>
          </Popconfirm>
        )
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h2>Conflict Management</h2>

      <Space style={{ marginBottom: '16px' }}>
        <Button type="primary" onClick={handleDetect} loading={loading}>
          Detect New Conflicts
        </Button>
      </Space>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={conflicts}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Spin>
    </div>
  );
};

export default ConflictsPage;
