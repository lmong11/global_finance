import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Transaction } from '../types/ledger';
import { useAuth } from '../hooks/useAuth';

interface ApprovalWorkflowProps {
  transaction: Transaction;
  onApprove: () => void;
  onReject: (comment: string) => void;
  className?: string;
}

const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  transaction,
  onApprove,
  onReject,
  className = ''
}) => {
  const { t } = useTranslation();
  const { user, userRoles } = useAuth();
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="text-green-500" />;
      case 'rejected':
        return <XCircle className="text-red-500" />;
      case 'pending':
        return <Clock className="text-yellow-500" />;
      default:
        return <AlertCircle className="text-gray-500" />;
    }
  };

  const canApprove = () => {
    return userRoles.includes('Boss') && transaction.status === 'draft';
  };

  const handleReject = () => {
    if (!rejectComment.trim()) return;
    onReject(rejectComment);
    setShowRejectForm(false);
    setRejectComment('');
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-medium mb-6">{t('approval.title')}</h3>

      <div className="space-y-6">
        <div className="relative">
          <div className="flex items-start mb-8">
            <div className="flex-shrink-0">
              {getStatusIcon(transaction.status)}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{t('approval.bossApproval')}</p>
                  {transaction.status === 'approved' && transaction.approvals?.[0] && (
                    <p className="text-sm text-gray-500">
                      {t('approval.approvedBy', {
                        user: transaction.approvals[0].userId,
                        date: new Date(transaction.approvals[0].createdAt).toLocaleDateString()
                      })}
                    </p>
                  )}
                  {transaction.status === 'rejected' && transaction.approvals?.[0]?.comment && (
                    <p className="text-sm text-red-600 mt-1">
                      {t('approval.rejectionReason')}: {transaction.approvals[0].comment}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  transaction.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : transaction.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : transaction.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {transaction.status === 'draft' 
                    ? t('approval.status.pendingApproval')
                    : t(`approval.status.${transaction.status}`)}
                </span>
              </div>
              {canApprove() && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={onApprove}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    {t('approval.actions.approve')}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  >
                    {t('approval.actions.reject')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showRejectForm && (
          <div className="space-y-3">
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder={t('approval.rejectForm.placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={!rejectComment.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle size={20} />
                {t('approval.rejectForm.confirm')}
              </button>
              <button
                onClick={() => setShowRejectForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {!canApprove() && !showRejectForm && (
          <div className="text-sm text-gray-500 italic">
            {transaction.status === 'approved' 
              ? t('approval.messages.approved')
              : transaction.status === 'rejected'
              ? t('approval.messages.rejected')
              : t('approval.messages.waitingForBoss')}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalWorkflow;