import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import CaseCard from '../components/CaseCard';
import CaseDetail from '../components/CaseDetail';
import CaseModal from '../components/CaseModal';
import TrafficLawsPanel from '../components/TrafficLawsPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PendingCases = () => {
  const { globalFilter } = useOutletContext() || { globalFilter: '' };
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingCases();
  }, []);

  const fetchPendingCases = async () => {
    try {
      const response = await axios.get(`${API}/cases?status=pending`);
      setCases(response.data);
      if (response.data.length > 0) {
        setSelectedCase(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching pending cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseSelect = (caseItem) => {
    setSelectedCase(caseItem);
  };

  const handleCaseUpdate = async (caseId, status, comments) => {
    try {
      await axios.put(`${API}/cases/${caseId}/review`, {
        status,
        comments
      });
      
      // Refresh cases list
      fetchPendingCases();
      
      // Find next pending case
      const remainingCases = cases.filter(c => c.id !== caseId);
      if (remainingCases.length > 0) {
        setSelectedCase(remainingCases[0]);
      } else {
        setSelectedCase(null);
      }
    } catch (error) {
      console.error('Error updating case:', error);
    }
  };

  // Combined filter: local search + global filter
  const filteredCases = cases.filter(caseItem => {
    const matchesLocalSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              caseItem.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              caseItem.license_plate.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGlobalFilter = !globalFilter || 
                               caseItem.title.toLowerCase().includes(globalFilter.toLowerCase()) ||
                               caseItem.case_number.toLowerCase().includes(globalFilter.toLowerCase()) ||
                               new Date(caseItem.submitted_at).toLocaleDateString('es-ES').includes(globalFilter.toLowerCase());
    
    return matchesLocalSearch && matchesGlobalFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Cargando casos pendientes...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar - Cases List */}
      <div className="w-[450px] bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-md font-bold text-gray-900 mb-3">Casos Pendientes</h3>

          {/* Local Search */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Buscar caso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Global Filter Indicator */}
          {globalFilter && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <div className="flex items-center text-yellow-800">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Filtro global: "{globalFilter}"
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
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
                {globalFilter || searchTerm 
                  ? 'No se encontraron casos que coincidan'
                  : 'No hay casos pendientes'
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

      {/* Center - Case Detail */}
      <div className="flex-1 flex flex-col">
        {selectedCase ? (
          <CaseDetail
            case={selectedCase}
            onUpdate={handleCaseUpdate}
            onShowModal={() => setShowModal(true)}
          />
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
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Número de caso</h3>
              <p className="text-md font-semibold">{selectedCase.case_number}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Placa del vehículo involucrado</h3>
              <p className="text-md font-semibold">{selectedCase.license_plate}</p>
            </div>

            <div className="mb-4">
              <div className="flex items-center text-sm text-green-600 mb-1">
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
              <h3 className="text-sm font-medium text-gray-500 mb-2">Referencia del lugar</h3>
              <p className="text-sm">{selectedCase.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Comentarios</h3>
              <p className="text-sm italic">
                "Fíjense como gira en U donde se ve claramente que no puede"
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Usuario sometedor</h3>
              <p className="text-sm">@gestionperez</p>
            </div>

            <div className="border-t pt-4">
              <button className="w-full btn-secondary mb-3">
                Exporta expediente
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

export default PendingCases;