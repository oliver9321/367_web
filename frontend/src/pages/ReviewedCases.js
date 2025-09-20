import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import CaseCard from '../components/CaseCard';
import CaseModal from '../components/CaseModal';
import TrafficLawsPanel from '../components/TrafficLawsPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReviewedCases = () => {
  const { globalFilter } = useOutletContext() || { globalFilter: '' };
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchReviewedCases();
  }, []);

  const fetchReviewedCases = async () => {
    try {
      const response = await axios.get(`${API}/cases/reviewed`);
      setCases(response.data);
      if (response.data.length > 0) {
        setSelectedCase(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching reviewed cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseSelect = (caseItem) => {
    setSelectedCase(caseItem);
  };

  // Combined filter: local search + status filter + global filter
  const filteredCases = cases.filter(caseItem => {
    const matchesLocalSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              caseItem.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              caseItem.license_plate.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatusFilter = filterStatus === 'all' || caseItem.status === filterStatus;
    
    const matchesGlobalFilter = !globalFilter || 
                               caseItem.title.toLowerCase().includes(globalFilter.toLowerCase()) ||
                               caseItem.case_number.toLowerCase().includes(globalFilter.toLowerCase()) ||
                               new Date(caseItem.submitted_at).toLocaleDateString('es-ES').includes(globalFilter.toLowerCase());
    
    return matchesLocalSearch && matchesStatusFilter && matchesGlobalFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Cargando casos revisados...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar - Cases List */}
      <div className="w-80 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Casos Revisados</h2>
          
          <div className="space-y-3">
            {/* Local Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar casos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
            </select>

            {/* Global Filter Indicator */}
            {globalFilter && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <div className="flex items-center text-yellow-800">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Filtro global: "{globalFilter}"
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 text-sm text-gray-600">
            {filteredCases.length} de {cases.length} casos
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredCases.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>
                {globalFilter || searchTerm || filterStatus !== 'all'
                  ? 'No se encontraron casos que coincidan'
                  : 'No hay casos revisados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredCases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  case={caseItem}
                  isSelected={selectedCase?.id === caseItem.id}
                  onClick={() => handleCaseSelect(caseItem)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Traffic Laws Panel */}
        <TrafficLawsPanel />
      </div>

      {/* Center - Case Details */}
      <div className="flex-1 flex flex-col">
        {selectedCase ? (
          <div className="flex-1 bg-white">
            {/* Image Gallery */}
            <div className="relative bg-black">
              <img
                src={selectedCase.images?.[0]?.url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600'}
                alt={selectedCase.title}
                className="w-full h-80 object-contain"
              />
              
              {/* Thumbnails */}
              <div className="absolute bottom-4 left-4 flex space-x-2">
                {selectedCase.images?.slice(0, 4).map((img, index) => (
                  <div key={index} className="w-12 h-12 bg-white rounded border">
                    <img src={img.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover rounded" />
                  </div>
                ))}
              </div>

              {/* Full screen button */}
              <button 
                onClick={() => setShowModal(true)}
                className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded hover:bg-opacity-75"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>

            {/* Case Resolution Details */}
            <div className="p-6 bg-gray-50">
              <div className="max-w-2xl mx-auto">
                {selectedCase.status === 'approved' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-green-800">Caso Aprobado</h3>
                        <p className="text-sm text-green-600">
                          Revisado el {new Date(selectedCase.reviewed_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-green-800">
                      <p>• En este sometimiento, el conductor infringió la <strong>{selectedCase.traffic_law?.article}, numeral {selectedCase.traffic_law?.number}</strong>, al transitar sin placa.</p>
                      <p>• Este caso fue aprobado por ti en la fecha <strong>{new Date(selectedCase.reviewed_at).toLocaleDateString('es-ES')}</strong>.</p>
                      <p>• El conductor fue multado con <strong>RD${selectedCase.fine_amount?.toLocaleString()} pesos dominicanos</strong>.</p>
                    </div>

                    <div className="mt-4 p-3 bg-green-100 rounded border-l-4 border-green-500">
                      <p className="text-sm text-green-800">
                        Con el monto de multa que pagará el conductor, se le pagará a quien sometió las imágenes de dicha imprudencia.
                      </p>
                    </div>

                    {selectedCase.review_comments && (
                      <div className="mt-4">
                        <h4 className="font-medium text-green-800 mb-2">Comentarios de revisión:</h4>
                        <p className="text-sm text-green-700 italic">"{selectedCase.review_comments}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-red-800">Caso Rechazado</h3>
                        <p className="text-sm text-red-600">
                          Revisado el {new Date(selectedCase.reviewed_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-red-800">
                      <p>Este caso fue rechazado debido a que no cumplió con los criterios de aprobación.</p>
                      
                      {selectedCase.review_comments && (
                        <div className="mt-4">
                          <h4 className="font-medium text-red-800 mb-2">Razón del rechazo:</h4>
                          <p className="text-sm text-red-700 italic">"{selectedCase.review_comments}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 text-sm text-gray-600">
                  <p className="font-medium">367 se siente agradecido de tu compromiso de revisar las infracciones con el fin de mejorar el tránsito del país.</p>
                  <p className="mt-2">¡Gracias!</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">Selecciona un caso para ver los detalles</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Case Information */}
      <div className="w-80 bg-white shadow-sm border-l border-gray-200 p-4">
        {selectedCase && (
          <div>
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">NÚMERO DE CASO</h3>
              <p className="text-lg font-semibold">{selectedCase.case_number}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">PLACA DEL VEHÍCULO INVOLUCRADO</h3>
              <p className="text-lg font-semibold">{selectedCase.license_plate}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center text-sm text-green-600 mb-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(selectedCase.submitted_at).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="text-sm text-gray-600">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {selectedCase.location}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">ESTADO DEL CASO</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedCase.status === 'approved' ? 'status-approved' : 'status-rejected'
              }`}>
                {selectedCase.status === 'approved' ? 'APROBADO' : 'RECHAZADO'}
              </span>
            </div>

            {selectedCase.traffic_law && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">LEY INFRINGIDA</h3>
                <p className="text-sm text-gray-700">
                  {selectedCase.traffic_law.article}, numeral {selectedCase.traffic_law.number}
                </p>
                <p className="text-xs text-gray-600 mt-1">{selectedCase.traffic_law.description}</p>
              </div>
            )}

            {selectedCase.fine_amount && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">MULTA APLICADA</h3>
                <p className="text-lg font-semibold text-green-600">
                  RD${selectedCase.fine_amount.toLocaleString()}
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <button className="w-full btn-secondary mb-3">
                Exporta el acta de este expediente
              </button>
              <button className="w-full text-sm text-blue-600 hover:text-blue-800">
                Descarga el documento aquí 📋
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Case Modal */}
      {showModal && selectedCase && (
        <CaseModal
          case={selectedCase}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default ReviewedCases;