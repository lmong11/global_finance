import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, AlertCircle } from 'lucide-react';
import CurrencySelector from '../components/CurrencySelector';
import { Company } from '../types/company';
import { useCompanyStore } from '../stores/companyStore';
import { supabase } from '../lib/supabase';

const CompanyForm: React.FC = () => {
  const navigate = useNavigate();
  const { createCompany, isLoading, error: storeError } = useCompanyStore();
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    code: '',
    taxId: '',
    currency: 'USD',
    fiscalYearEnd: '12-31',
    status: 'active',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  // Check authentication status
  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  const checkCompanyCode = async (code: string) => {
    try {
      const { count, error } = await supabase
        .from('companies')
        .select('code', { count: 'exact', head: true })
        .eq('code', code);

      if (error) {
        console.error('Error checking company code:', error);
        return false;
      }

      if (count && count > 0) {
        setError('Company code already exists');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking company code:', error);
      return false;
    }
  };

  const validateForm = async () => {
    if (!formData.name?.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.code?.trim()) {
      setError('Company code is required');
      return false;
    }
    if (!formData.currency?.trim()) {
      setError('Currency is required');
      return false;
    }
    if (!formData.fiscalYearEnd?.match(/^\d{2}-\d{2}$/)) {
      setError('Fiscal year end must be in MM-DD format');
      return false;
    }

    // Check if company code is unique
    setIsCheckingCode(true);
    const isCodeUnique = await checkCompanyCode(formData.code);
    setIsCheckingCode(false);

    if (!isCodeUnique) {
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    try {
      await createCompany(formData as Omit<Company, 'id' | 'createdAt' | 'updatedAt'>);
      navigate('/companies');
    } catch (err) {
      if (err instanceof Error && err.message.includes('not authenticated')) {
        navigate('/auth');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create company');
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">New Company</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/companies')}
            className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <X size={20} />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || isCheckingCode}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {isLoading ? 'Saving...' : isCheckingCode ? 'Validating...' : 'Save Company'}
          </button>
        </div>
      </div>

      {(error || storeError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <p>{error || storeError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                A unique identifier for the company (e.g., ACME)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax ID
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => handleChange('taxId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency <span className="text-red-500">*</span>
              </label>
              <CurrencySelector
                value={formData.currency || 'USD'}
                onChange={(currency) => handleChange('currency', currency)}
                showInactive={false}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiscal Year End (MM-DD) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fiscalYearEnd}
                onChange={(e) => handleChange('fiscalYearEnd', e.target.value)}
                placeholder="12-31"
                pattern="\d{2}-\d{2}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as 'active' | 'inactive')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Address Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address?.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.address?.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.address?.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.address?.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.address?.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;