import React from 'react';

const CaseCard = ({ case: caseItem, isSelected, onClick }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-pending px-2 py-1 rounded-full text-xs font-medium">Sin revisar</span>;
      case 'overdue':
        return <span className="status-overdue px-2 py-1 rounded-full text-xs font-medium">Atrasado</span>;
      case 'approved':
        return <span className="status-approved px-2 py-1 rounded-full text-xs font-medium">Aprobado</span>;
      case 'rejected':
        return <span className="status-rejected px-2 py-1 rounded-full text-xs font-medium">Rechazado</span>;
      default:
        return null;
    }
  };

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining(caseItem.due_date);
  const mainImage = caseItem.images?.[0]?.url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=100';

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer card-hover ${
        isSelected
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <img
            src={mainImage}
            alt={caseItem.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {caseItem.title}
            </h3>
            {getStatusBadge(caseItem.status)}
          </div>
          
          <p className="text-xs text-gray-600 mb-1">
            {caseItem.case_number}
          </p>
          
          <p className="text-xs text-gray-500 mb-2">
            Caso sometido en {new Date(caseItem.submitted_at).toLocaleDateString('es-ES')}
          </p>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {Math.abs(daysRemaining)} días • {caseItem.images?.length || 0} horas para revisar este caso
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseCard;