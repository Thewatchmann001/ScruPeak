import React, { useState } from 'react';
import { X, MapPin, FileText, Camera, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Upload, Info, ShieldCheck, Map as MapIcon, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateListingModal({ isOpen, onClose, onSuccess }: CreateListingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    chief_letter: File | null;
    property_image: File | null;
    ministry_doc: File | null;
    spousal_consent_doc: File | null;
  }>({
    survey_plan: null,
    title_deed: null,
    chief_letter: null,
    property_image: null,
    ministry_doc: null,
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

  const handleSubmit = async () => {
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

      // Mandatory Files
      if (!files.survey_plan) throw new Error("Survey Plan is required");
      formPayload.append('survey_plan', files.survey_plan);
      
      if (!files.title_deed) throw new Error("Title Deed is required");
      formPayload.append('title_deed', files.title_deed);

      if (!files.chief_letter) throw new Error("Chief's Consent Letter is required");
      formPayload.append('chief_letter', files.chief_letter);

      if (!files.property_image) throw new Error("Property Photo is required");
      formPayload.append('property_image', files.property_image);

      // Optional Files
      if (files.ministry_doc) formPayload.append('ministry_doc', files.ministry_doc);
      if (formData.spousal_consent && files.spousal_consent_doc) {
          formPayload.append('spousal_consent_doc', files.spousal_consent_doc);
      }

      await api.post('/land', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Basic Info', icon: FileText },
    { id: 2, name: 'Location', icon: MapPin },
    { id: 3, name: 'Documents', icon: ShieldCheck },
    { id: 4, name: 'Review', icon: CheckCircle2 },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#1e293b] border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-[#1e293b] sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                 <Landmark className="h-5 w-5 text-white" />
              </div>
              National Land Registry
            </h2>
            <p className="text-slate-400 text-sm">Register your property on the secure digital ledger</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    currentStep === step.id ? 'bg-orange-600 border-orange-600 text-white scale-110 shadow-lg shadow-orange-600/20' :
                    currentStep > step.id ? 'bg-green-500 border-green-500 text-white' : 'border-slate-700 text-slate-500'
                  }`}>
                    <step.icon size={18} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${currentStep === step.id ? 'text-orange-500' : 'text-slate-500'}`}>
                    {step.name}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 rounded-full ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-800'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          {error && (
            <Alert variant="destructive" className="mb-8 bg-red-500/10 border-red-500/20 text-red-400 rounded-2xl">
              {error}
            </Alert>
          )}

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: -20, x: 0 }}
                className="space-y-6"
              >
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Property Title</label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="bg-slate-900/50 border-slate-800 h-14 rounded-2xl text-lg focus:ring-orange-500/20"
                      placeholder="e.g. 5 Acres Commercial Land in Newton"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Detailed Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                      placeholder="Provide comprehensive details about accessibility, soil, and environment..."
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Price (Leones)</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-bold">Le</span>
                           <Input
                             name="price"
                             type="number"
                             value={formData.price}
                             onChange={handleChange}
                             className="bg-slate-900/50 border-slate-800 h-14 pl-12 rounded-2xl text-lg"
                             placeholder="0.00"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Size (Acres)</label>
                        <Input
                          name="size_acres"
                          type="number"
                          value={formData.size_acres}
                          onChange={handleChange}
                          className="bg-slate-900/50 border-slate-800 h-14 rounded-2xl text-lg"
                          placeholder="e.g. 2.5"
                        />
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 flex gap-4">
                   <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                      <MapIcon size={24} />
                   </div>
                   <div>
                      <h4 className="font-bold text-white mb-1">Geospatial Intelligence</h4>
                      <p className="text-sm text-slate-400">Accurate coordinates allow the system to automatically generate your Smart Parcel ID and verify boundaries against the national grid.</p>
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Region</label>
                        <Input name="region" value={formData.region} onChange={handleChange} className="bg-slate-900/50 border-slate-800 h-12 rounded-xl" placeholder="e.g. Western Area" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">District</label>
                        <Input name="district" value={formData.district} onChange={handleChange} className="bg-slate-900/50 border-slate-800 h-12 rounded-xl" placeholder="e.g. Waterloo" />
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Latitude</label>
                        <Input name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} className="bg-slate-900/50 border-slate-800 h-12 rounded-xl" placeholder="8.484..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Longitude</label>
                        <Input name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} className="bg-slate-900/50 border-slate-800 h-12 rounded-xl" placeholder="-13.234..." />
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                 <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { id: 'survey_plan', name: 'Survey Plan', req: true, icon: FileText },
                      { id: 'title_deed', name: 'Title Deed', req: true, icon: Landmark },
                      { id: 'chief_letter', name: "Chief's Consent", req: true, icon: ShieldCheck },
                      { id: 'property_image', name: 'Property Photo', req: true, icon: Camera },
                      { id: 'ministry_doc', name: 'Ministry Doc', req: false, icon: FileText },
                    ].map((doc) => (
                      <div key={doc.id} className={`p-4 rounded-2xl border-2 transition-all relative ${files[doc.id as keyof typeof files] ? 'border-green-500 bg-green-500/5' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}>
                        <label className="flex items-center gap-4 cursor-pointer">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${files[doc.id as keyof typeof files] ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-400'}`}>
                             <doc.icon size={20} />
                           </div>
                           <div className="flex-1 overflow-hidden">
                              <p className="font-bold text-white text-sm flex items-center gap-2">
                                {doc.name} {doc.req && <span className="text-[10px] text-orange-500 font-black">REQ</span>}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {files[doc.id as keyof typeof files] ? files[doc.id as keyof typeof files]!.name : 'Click to upload'}
                              </p>
                           </div>
                           <input type="file" className="hidden" onChange={(e) => handleFileChange(e, doc.id as any)} />
                           {files[doc.id as keyof typeof files] ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <Upload className="text-slate-700 h-5 w-5" />}
                        </label>
                      </div>
                    ))}
                 </div>

                 <div className={`p-6 rounded-3xl border-2 transition-all ${formData.spousal_consent ? 'border-orange-500 bg-orange-500/5' : 'border-slate-800 bg-slate-900/50'}`}>
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                          <input
                            type="checkbox" name="spousal_consent" id="spousal_consent"
                            checked={formData.spousal_consent} onChange={handleChange}
                            className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-orange-600 focus:ring-orange-500"
                          />
                          <label htmlFor="spousal_consent" className="font-bold text-white">Spousal Consent</label>
                       </div>
                       <Info size={16} className="text-slate-600" />
                    </div>
                    {formData.spousal_consent && (
                      <div className="mt-4 p-4 rounded-xl border border-orange-500/20 bg-slate-900/50">
                         <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-slate-400">{files.spousal_consent_doc ? files.spousal_consent_doc.name : 'Upload signed consent form'}</span>
                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'spousal_consent_doc')} />
                            <Upload size={18} className="text-orange-500" />
                         </label>
                      </div>
                    )}
                 </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="text-center">
                   <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                      <Info className="h-10 w-10 text-orange-500" />
                   </div>
                   <h3 className="text-2xl font-bold text-white">Review & Authenticate</h3>
                   <p className="text-slate-400">By submitting, you confirm the legal ownership and accuracy of all data.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 bg-slate-900/50 p-8 rounded-[2rem] border border-slate-800">
                   <div className="space-y-4">
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-500 text-sm">Property</span>
                        <span className="text-white font-bold">{formData.title}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-500 text-sm">Price</span>
                        <span className="text-orange-500 font-bold">Le {parseFloat(formData.price || '0').toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-500 text-sm">Location</span>
                        <span className="text-white font-medium">{formData.district}, {formData.region}</span>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Compliance Check</h4>
                      {[
                        { label: 'Survey Plan', val: files.survey_plan },
                        { label: 'Title Deed', val: files.title_deed },
                        { label: 'Chief Consent', val: files.chief_letter },
                        { label: 'Property Photo', val: files.property_image }
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2 text-sm">
                           <CheckCircle2 size={14} className={item.val ? 'text-green-500' : 'text-slate-700'} />
                           <span className={item.val ? 'text-slate-300' : 'text-slate-600'}>{item.label}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-800 bg-[#1e293b]/50 flex items-center justify-between sticky bottom-0">
          <Button
            variant="ghost"
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex gap-4">
            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="h-12 px-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02]"
              >
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="h-12 px-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold shadow-xl shadow-orange-600/20 transition-all hover:scale-[1.02]"
              >
                {loading ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Authenticating...</> : 'Complete Registration'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
