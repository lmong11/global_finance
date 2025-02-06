import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Calendar, Globe2, MapPin, Edit, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Company } from '../types/company';

const CompanyDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company] = useState<Company>({
    id: '1',
    name: 'Global Tech Solutions',
    code: 'GTS',
    taxId: '123-45-6789',
    currency: 'USD',
    fiscalYearEnd: '12-31',
    address: {
      street: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94105'
    },
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-10T10:30:00Z'
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/companies')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold">{company.name}</h1>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          company.status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {company.status}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => navigate(`/companies/${id}/edit`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Edit size={20} />
          Edit Company
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Company Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Company Code</label>
                <p className="mt-1">{company.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Tax ID</label>
                <p className="mt-1">{company.taxId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Currency</label>
                <div className="mt-1 flex items-center gap-2">
                  <Globe2 size={16} className="text-gray-400" />
                  <span>{company.currency}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Fiscal Year End</label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{company.fiscalYearEnd}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Address</h2>
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-gray-400 mt-1" />
              <div>
                <p>{company.address?.street}</p>
                <p>{company.address?.city}, {company.address?.state} {company.address?.postalCode}</p>
                <p>{company.address?.country}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Activity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1">{format(new Date(company.createdAt), 'PPP')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1">{format(new Date(company.updatedAt), 'PPP')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;