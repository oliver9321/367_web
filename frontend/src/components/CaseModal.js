import React from 'react';

const CaseModal = ({ case: caseItem, onClose }) => {
  if (!caseItem) return null;

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{caseItem.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Image Gallery */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              {caseItem.images && caseItem.images.map((image, index) => (
                <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.description || `Imagen ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Case Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Caso</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Número de Caso:</span>
                  <p className="text-gray-900 font-semibold">{caseItem.case_number}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Placa del Vehículo:</span>
                  <p className="text-gray-900 font-semibold">{caseItem.license_plate}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Fecha de Sometimiento:</span>
                  <p className="text-gray-900">
                    {new Date(caseItem.submitted_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {caseItem.reviewed_at && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Fecha de Revisión:</span>
                    <p className="text-gray-900">
                      {new Date(caseItem.reviewed_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500">Estado:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    caseItem.status === 'approved' ? 'status-approved' : 
                    caseItem.status === 'rejected' ? 'status-rejected' : 
                    'status-pending'
                  }`}>
                    {caseItem.status === 'approved' ? 'Aprobado' : 
                     caseItem.status === 'rejected' ? 'Rechazado' : 
                     'Pendiente'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubicación y Detalles</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Ubicación:</span>
                  <p className="text-gray-900">{caseItem.location}</p>
                </div>
                {caseItem.coordinates && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Coordenadas:</span>
                    <p className="text-gray-900">{caseItem.coordinates}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500">Descripción:</span>
                  <p className="text-gray-900">{caseItem.description}</p>
                </div>
                
                {caseItem.traffic_law && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Ley Infringida:</span>
                    <p className="text-gray-900">
                      {caseItem.traffic_law.article}, numeral {caseItem.traffic_law.number}
                    </p>
                    <p className="text-sm text-gray-600">{caseItem.traffic_law.description}</p>
                  </div>
                )}

                {caseItem.fine_amount && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Multa:</span>
                    <p className="text-gray-900 font-semibold">
                      RD${caseItem.fine_amount.toLocaleString()} pesos dominicanos
                    </p>
                  </div>
                )}

                {caseItem.review_comments && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Comentarios de Revisión:</span>
                    <p className="text-gray-900">{caseItem.review_comments}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resolution Info for Approved Cases */}
          {caseItem.status === 'approved' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-2">Este caso fue aprobado por ti en la fecha {new Date(caseItem.reviewed_at).toLocaleDateString('es-ES')}.</p>
                  <p>El conductor fue multado con RD${caseItem.fine_amount?.toLocaleString()} pesos dominicanos.</p>
                  <p className="mt-2 font-medium">
                    Con el monto de multa que pagará el conductor, se le pagará a quien sometió el caso que compartió las imágenes de dicha imprudencia.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button 
              onClick={onClose}
              className="text-center text-blue-600 hover:text-blue-800 transition-colors duration-200 cursor-pointer"
            >
              Haz clic aquí para ver el caso completo ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseModal;