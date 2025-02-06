import React, { useEffect, useState } from 'react';
import { Plus, Search, ChevronDown, FolderTree } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '../stores/accountStore';
import { useCompanyContext } from '../contexts/CompanyContext';

const Accounts: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { defaultCompany } = useCompanyContext();
  const { accounts, fetchAccounts, isLoading, error } = useAccountStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  useEffect(() => {
    if (defaultCompany) {
      fetchAccounts(defaultCompany.id);
    }
  }, [fetchAccounts, defaultCompany]);

  const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || account.type === selectedType;
    return matchesSearch && matchesType;
  });

  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const type = account.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as Record<string, typeof accounts>);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t('accounts.title')}</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/accounts/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            {t('accounts.new')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('common.search')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowTypeFilter(!showTypeFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                {selectedType ? t(`accounts.types.${selectedType}`) : t('accounts.type')}
                <ChevronDown size={16} className={`transform transition-transform ${showTypeFilter ? 'rotate-180' : ''}`} />
              </button>
              {showTypeFilter && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      setSelectedType(null);
                      setShowTypeFilter(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
                  >
                    {t('common.all')}
                  </button>
                  {accountTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedType(type);
                        setShowTypeFilter(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
                    >
                      {t(`accounts.types.${type}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <FolderTree size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">{t('accounts.empty')}</p>
            <button
              onClick={() => navigate('/accounts/new')}
              className="text-blue-600 hover:text-blue-700"
            >
              {t('accounts.createFirst')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {accountTypes.map((type) => (
              groupedAccounts[type] && groupedAccounts[type].length > 0 && (
                <div key={type} className="p-6">
                  <h2 className="text-lg font-medium mb-4">{t(`accounts.types.${type}`)}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm font-medium text-gray-500">
                          <th className="pb-3">{t('accounts.code')}</th>
                          <th className="pb-3">{t('accounts.name')}</th>
                          <th className="pb-3">{t('accounts.parent')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {groupedAccounts[type].map((account) => (
                          <tr
                            key={account.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/accounts/${account.id}`)}
                          >
                            <td className="py-3 pr-4">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {account.code}
                              </code>
                            </td>
                            <td className="py-3 pr-4">{account.name}</td>
                            <td className="py-3 pr-4 text-gray-500">
                              {account.parent || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;