import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import CaseModal from '../components/CaseModal';
import intrantLogo from '../assets/img/intrantLogo.png';
import procuraduriaLogo from '../assets/img/procuraduriaLogo.png';
import digesetLogo from '../assets/img/digesetLogo.jpeg';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = () => {
  const { user } = useAuth();
  const { globalFilter } = useOutletContext() || { globalFilter: '' };
  const [statistics, setStatistics] = useState(null);
  const [allCases, setAllCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedCategory, setSelectedCategory] = useState('pending');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, selectedPeriod]);

  const fetchUserData = async () => {
    try {
      const [statsResponse, casesResponse] = await Promise.all([
        axios.get(`${API}/statistics/${user.id}?period=${selectedPeriod}`),
        axios.get(`${API}/cases`)
      ]);
      
      setStatistics(statsResponse?.data);
      setAllCases(casesResponse?.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseClick = (caseItem) => {
    setSelectedCase(caseItem);
    setShowModal(true);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ));
  };

  const getCasesByStatus = (status) => {
    const cases = allCases.filter(caseItem => caseItem.status === status);
    
    // Apply global filter if exists
    if (globalFilter) {
      return cases.filter(caseItem =>
        caseItem.title.toLowerCase().includes(globalFilter.toLowerCase()) ||
        caseItem.case_number.toLowerCase().includes(globalFilter.toLowerCase()) ||
        new Date(caseItem.submitted_at).toLocaleDateString('es-ES').includes(globalFilter.toLowerCase())
      );
    }
    return cases;
  };

  const pendingCases = getCasesByStatus('pending');
  const approvedCases = getCasesByStatus('approved');
  const rejectedCases = getCasesByStatus('rejected');

  const categories = [
    {
      key: 'pending',
      title: 'Casos pendientes de completar',
      count: pendingCases.length,
      cases: pendingCases,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      key: 'approved', 
      title: 'Casos completados',
      count: approvedCases.length,
      cases: approvedCases,
      color: 'text-green-600 bg-green-100'
    },
    {
      key: 'rejected',
      title: 'Casos rechazados', 
      count: rejectedCases.length,
      cases: rejectedCases,
      color: 'text-red-600 bg-red-100'
    }
  ];

  const selectedCategoryData = categories.find(cat => cat.key === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Cargando perfil...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
              <p className="text-gray-600">ID: {user?.badge_id}</p>
              <div className="flex items-center mt-2">
                {renderStars(user?.rating || 4.0)}
                <span className="ml-2 text-sm text-gray-600">({user?.rating || 4.0}/5)</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <button className="btn-secondary mb-4">
              Editar perfil
            </button>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <img src={procuraduriaLogo} alt="Procuraduría" className="h-10" />
              <img src={intrantLogo} alt="INTRANT" className="h-10" />
               <img src={digesetLogo} alt="INTRANT" className="h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Tu actividad histórica</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="current">Junio 2024</option>
            <option value="historical">Histórico</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {selectedPeriod === 'current' ? statistics?.cases_reviewed || 25 : 146}
            </div>
            <div className="text-sm text-gray-600">Casos revisados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {selectedPeriod === 'current' ? statistics?.cases_approved || 22 : 124}
            </div>
            <div className="text-sm text-gray-600">Casos aprobados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 mb-1">
              {selectedPeriod === 'current' ? statistics?.cases_rejected || 3 : 22}
            </div>
            <div className="text-sm text-gray-600">Casos rechazados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {statistics?.cases_pending || pendingCases.length}
            </div>
            <div className="text-sm text-gray-600">Casos pendientes</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Su actividad de hoy, 23/06/2024:</strong>
          </p>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>Casos revisados: <strong>24</strong></div>
            <div>Casos aprobados: <strong>17</strong></div>
            <div>Casos rechazados: <strong>7</strong></div>
          </div>
        </div>
      </div>

      {/* Cases Management Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex">
          {/* Left Sidebar - Categories */}
          <div className="w-80 border-r border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Gestión de Casos</h3>
            
            <div className="space-y-3">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                    selectedCategory === category.key
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{category.title}</h4>
                      <p className="text-sm text-gray-600">
                        {globalFilter 
                          ? `${category.cases.length} casos encontrados`
                          : `${category.count} casos totales`
                        }
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                      {category.cases.length}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {globalFilter && (
              <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Filtro activo</p>
                    <p className="text-xs text-yellow-700">"{globalFilter}"</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Content - Cases Display */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedCategoryData?.title}
              </h3>
              <div className="text-sm text-gray-600">
                {selectedCategoryData?.cases.length} casos
              </div>
            </div>

            {selectedCategoryData?.cases.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">
                  {globalFilter 
                    ? 'No se encontraron casos que coincidan con tu búsqueda'
                    : `No hay casos ${selectedCategory === 'pending' ? 'pendientes' : selectedCategory === 'approved' ? 'aprobados' : 'rechazados'}`
                  }
                </p>
              </div>
            ) : (
              <div className="h-96 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedCategoryData?.cases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      onClick={() => handleCaseClick(caseItem)}
                      className="cursor-pointer group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
                    >
                      <div className="aspect-video bg-gray-100 overflow-hidden">
                        <img
                          src={caseItem.images?.[0]?.url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300'}
                          alt={caseItem.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-sm text-gray-900 truncate mb-1">
                          {caseItem.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">{caseItem.case_number}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {selectedCategory === 'pending' 
                              ? `Sometido ${Math.floor((new Date() - new Date(caseItem.submitted_at)) / (1000 * 60 * 60))}h`
                              : `${selectedCategory === 'approved' ? 'Aprobado' : 'Rechazado'} ${new Date(caseItem.reviewed_at).toLocaleDateString('es-ES')}`
                            }
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedCategory === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            selectedCategory === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {selectedCategory === 'pending' ? 'Pendiente' :
                             selectedCategory === 'approved' ? 'Aprobado' : 'Rechazado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scroll Indicator */}
            {selectedCategoryData?.cases.length > 6 && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Desplázate para ver más casos
                </div>
              </div>
            )}
          </div>
        </div>
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

export default ProfilePage;