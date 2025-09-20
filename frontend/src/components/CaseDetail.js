import React, { useState } from 'react';

const CaseDetail = ({ case: caseItem, onUpdate, onShowModal }) => {
  const [followUpAnswers, setFollowUpAnswers] = useState({
    hasViolation: null,
    plateMatches: null
  });
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    if (followUpAnswers.hasViolation === null || followUpAnswers.plateMatches === null) {
      alert('Por favor responde todas las preguntas de seguimiento');
      return;
    }

    if (!followUpAnswers.hasViolation || !followUpAnswers.plateMatches) {
      alert('Para aprobar el caso, debe haber infracción y coincidir la placa');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(caseItem.id, 'approved', comments);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onUpdate(caseItem.id, 'rejected', comments || 'Caso rechazado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mainImage = caseItem.images?.[0]?.url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600';
  const thumbnails = caseItem.images?.slice(1, 4) || [];

  return (
    <div className="flex-1 bg-white">
      {/* Image Gallery */}
      <div className="relative bg-black">
        <img
          src={mainImage}
          alt={caseItem.title}
          className="w-full h-80 object-contain"
        />
        
        {/* Navigation arrows */}
        <button className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Thumbnails */}
        <div className="absolute bottom-4 left-4 flex space-x-2">
          <div className="w-12 h-12 bg-white rounded border-2 border-green-500">
            <img src={mainImage} alt="Main" className="w-full h-full object-cover rounded" />
          </div>
          {thumbnails.map((img, index) => (
            <div key={index} className="w-12 h-12 bg-white rounded border">
              <img src={img.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover rounded" />
            </div>
          ))}
        </div>

        {/* Full screen button */}
        <button 
          onClick={onShowModal}
          className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded hover:bg-opacity-75"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Case Actions */}
      <div className="p-6 bg-gray-50 border-b">
        <div className="max-w-2xl mx-auto">
          <button className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium mb-6 hover:bg-gray-300 transition duration-200">
            Seguir este caso
          </button>

          {/* Follow-up Questions */}
          <div className="space-y-6">
            <div>
              <p className="text-gray-700 mb-3">¿Hay alguna infracción en este caso?</p>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasViolation"
                    value="yes"
                    checked={followUpAnswers.hasViolation === true}
                    onChange={() => setFollowUpAnswers(prev => ({ ...prev, hasViolation: true }))}
                    className="mr-2"
                  />
                  Sí
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasViolation"
                    value="no"
                    checked={followUpAnswers.hasViolation === false}
                    onChange={() => setFollowUpAnswers(prev => ({ ...prev, hasViolation: false }))}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            <div>
              <p className="text-gray-700 mb-3">
                ¿El número de placa en este audiovisual coincide con el número escrito por el usuario?
              </p>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="plateMatches"
                    value="yes"
                    checked={followUpAnswers.plateMatches === true}
                    onChange={() => setFollowUpAnswers(prev => ({ ...prev, plateMatches: true }))}
                    className="mr-2"
                  />
                  Sí
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="plateMatches"
                    value="no"
                    checked={followUpAnswers.plateMatches === false}
                    onChange={() => setFollowUpAnswers(prev => ({ ...prev, plateMatches: false }))}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800">
                  Acepto hablerte asegurado de que los datos suministrados coinciden con los audiovisuales.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Comentarios adicionales (opcional):</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows="3"
                placeholder="Agrega cualquier comentario sobre este caso..."
              />
            </div>

            <button
              onClick={handleApprove}
              disabled={isSubmitting || followUpAnswers.hasViolation === null || followUpAnswers.plateMatches === null}
              className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 ${
                isSubmitting || followUpAnswers.hasViolation === null || followUpAnswers.plateMatches === null
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Procesando...
                </div>
              ) : (
                'Aprobar este sometimiento'
              )}
            </button>

            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className={`w-full py-2 px-4 rounded-lg font-medium transition duration-200 ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'btn-danger'
              }`}
            >
              {isSubmitting ? 'Procesando...' : 'Rechazar Caso'}
            </button>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800">
                Al aprobar un sometimiento, se calculará el monto de cada infracción seleccionada, se multará al dueño del vehículo multado y se le pagará un porcentaje al usuario que sometió el caso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;