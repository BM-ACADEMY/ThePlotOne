import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

const RequestCallBackModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    category: '',
    preferred_date: '',
    preferredTime: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/forms/request-call', formData);
      if (response.data.success) {
        toast.success(response.data.message || 'Call Back Requested Successfully!');
        setFormData({
          fullName: '',
          phone: '',
          email: '',
          category: '',
          preferred_date: '',
          preferredTime: ''
        });
        onClose();
      }
    } catch (error) {
      console.error('Error submitting callback request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      {/* Modal Container */}
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 hover:bg-gray-100 p-1 rounded-full transition-colors focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pt-8 pb-4 px-8">
          <h2 className="text-2xl font-bold text-[#003366] tracking-tight">
            Want us to call you back?
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Get a callback from our customer service team
          </p>
        </div>

        {/* Form Body */}
        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <input 
                type="text" 
                name="fullName"
                placeholder="Full Name" 
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-gray-800"
              />
            </div>

            {/* Phone Number with Prefix */}
            <div className="flex border border-gray-200 rounded-md focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
              <div className="bg-white px-3 py-3 border-r border-gray-200 text-gray-700 text-sm flex items-center justify-center min-w-max cursor-pointer">
                 IND (+91)
                 <svg className="w-4 h-4 ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              <input 
                type="tel" 
                name="phone"
                placeholder="Phone Number" 
                value={formData.phone}
                onChange={handleChange}
                required
                maxLength={10}
                onKeyPress={(e) => !/[0-9]/.test(e.key) && e.preventDefault()}
                className="w-full px-4 py-3 border-none focus:outline-none focus:ring-0 placeholder-gray-400 text-gray-800 rounded-r-md"
              />
            </div>

            {/* Email Address */}
            <div>
              <input 
                type="email" 
                name="email"
                placeholder="Email Address" 
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-gray-800"
              />
            </div>

            {/* What defines you best dropdown */}
            <div className="relative">
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-blue-500 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-gray-600 bg-white"
              >
                <option value="" disabled>What defines you best?</option>
                <option value="buyer">I am a Buyer</option>
                <option value="seller">I am a Seller / Owner</option>
                <option value="agent">I am an Agent / Broker</option>
                <option value="builder">I am a Builder</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {/* Preferred Date */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 pl-1">Preferred Date</span>
              <input 
                type="date" 
                name="preferred_date"
                value={formData.preferred_date}
                onChange={handleChange}
                min={getTodayString()}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-600 bg-white"
              />
            </div>

            {/* Time dropdown */}
            <div className="relative">
              <select 
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-600 bg-white"
              >
                <option value="" disabled>Preferred Time</option>
                <option value="morning">9 AM to 12 PM</option>
                <option value="afternoon">12 PM to 3 PM</option>
                <option value="evening">3 PM to 7 PM</option>
              </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full bg-[#0073e6] hover:bg-[#005bb5] text-white font-bold py-3.5 px-4 rounded-md transition duration-300 ease-in-out shadow-sm flex items-center justify-center ${isLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Request a callback'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestCallBackModal;
