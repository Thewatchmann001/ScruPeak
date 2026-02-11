import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea'; // Assuming this exists or I'll use standard textarea
import { api } from '@/services/api';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateListingModal({ isOpen, onClose, onSuccess }: CreateListingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    size_acres: '',
    region: '',
    district: '',
    latitude: '',
    longitude: '',
    spousal_consent: false,
    surveyor_id: '',
  });

  const [files, setFiles] = useState<{
    survey_plan: File | null;
    title_deed: File | null;
    spousal_consent_doc: File | null;
  }>({
    survey_plan: null,
    title_deed: null,
    spousal_consent_doc: null
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
        setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
        setFiles(prev => ({ ...prev, [fieldName]: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formPayload = new FormData();
      formPayload.append('title', formData.title);
      formPayload.append('description', formData.description);
      formPayload.append('price', formData.price);
      formPayload.append('size_sqm', (parseFloat(formData.size_acres || '0') * 4046.86).toString());
      formPayload.append('region', formData.region);
      formPayload.append('district', formData.district);
      formPayload.append('latitude', formData.latitude);
      formPayload.append('longitude', formData.longitude);
      formPayload.append('spousal_consent', formData.spousal_consent.toString());
      if (formData.surveyor_id) formPayload.append('surveyor_id', formData.surveyor_id);

      // Files
      if (!files.survey_plan) throw new Error("Survey Plan is required");
      formPayload.append('survey_plan', files.survey_plan);
      
      if (!files.title_deed) throw new Error("Title Deed is required");
      formPayload.append('title_deed', files.title_deed);

      if (formData.spousal_consent && files.spousal_consent_doc) {
          formPayload.append('spousal_consent_doc', files.spousal_consent_doc);
      }

      await api.post('/land', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Listing created successfully! Pending Admin Approval.');
      onSuccess();
      onClose();
      // Reset form...
    } catch (err: any) {
      console.error('Failed to create listing:', err);
      let errorMessage = 'Failed to create listing. Please check your inputs.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          // Handle Pydantic validation errors
          errorMessage = err.response.data.detail
            .map((e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`)
            .join('\n');
        } else if (typeof err.response.data.detail === 'object') {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">List New Land Property</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. 2 Acres Beachfront Land in Freetown"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe the property..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (SLE)</label>
                <Input
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size (Acres)</label>
                <Input
                  name="size_acres"
                  type="number"
                  value={formData.size_acres}
                  onChange={handleChange}
                  placeholder="e.g. 2.5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <Input
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="e.g. Western Area"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <Input
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="e.g. Freetown"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <Input
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 8.484"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <Input
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g. -13.234"
                  required
                />
              </div>
            </div>

            {/* Compliance Section */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
                <h3 className="font-semibold text-gray-900">Compliance Documents</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Survey Plan (Required)</label>
                        <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(e, 'survey_plan')} required className="text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title Deed (Required)</label>
                        <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(e, 'title_deed')} required className="text-sm" />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            name="spousal_consent" 
                            id="spousal_consent"
                            checked={formData.spousal_consent}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="spousal_consent" className="text-sm font-medium text-gray-700">
                            I have Spousal Consent to sell this property
                        </label>
                    </div>
                    {formData.spousal_consent && (
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Consent Document</label>
                             <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleFileChange(e, 'spousal_consent_doc')} className="text-sm" />
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-white" disabled={loading}>
              {loading ? 'Creating...' : 'Create Listing'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
