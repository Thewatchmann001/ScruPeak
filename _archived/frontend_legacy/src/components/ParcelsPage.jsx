import React, { useEffect, useState } from 'react';
import { Table, Space, Button, Modal, Form, Input, message, Spin, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useParcelStore } from '../services/store';

export const ParcelsPage = ({ gridId }) => {
  const { parcels, selectedParcel, loading, fetchParcels, getParcel, createParcel } = useParcelStore();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (gridId) {
      fetchParcels(gridId);
    }
  }, [gridId, fetchParcels]);

  const handleViewDetails = (parcelId) => {
    getParcel(parcelId);
    setDetailsVisible(true);
  };

  const handleCreate = async (values) => {
    try {
      await createParcel({ ...values, grid_id: gridId });
      message.success('Parcel created successfully');
      form.resetFields();
    } catch (error) {
      message.error('Failed to create parcel');
    }
  };

  const columns = [
    {
      title: 'Parcel Code',
      dataIndex: 'parcel_code',
      key: 'parcel_code',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Area (sq m)',
      dataIndex: 'area_sqm',
      key: 'area_sqm',
      render: (area) => area.toFixed(2),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record.id)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h2>Parcels Management</h2>

      <Button
        type="primary"
        style={{ marginBottom: '16px' }}
        onClick={() => setDetailsVisible(true)}
      >
        Add New Parcel
      </Button>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={parcels}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Spin>

      <Modal
        title="Parcel Details"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={null}
      >
        {selectedParcel && (
          <div>
            <p><strong>Code:</strong> {selectedParcel.parcel_code}</p>
            <p><strong>Area:</strong> {selectedParcel.area_sqm.toFixed(2)} sq m</p>
            <p><strong>Status:</strong> {selectedParcel.active ? 'Active' : 'Inactive'}</p>
            <p><strong>Hash:</strong> {selectedParcel.spatial_identity_hash}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParcelsPage;
