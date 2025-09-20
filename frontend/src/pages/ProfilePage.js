import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CaseModal from '../components/CaseModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [allCases, setAllCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

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
      
      setStatistics(statsResponse.data);
      setAllCases(casesResponse.data);
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
    return allCases.filter(caseItem => caseItem.status === status);
  };

  const pendingCases = getCasesByStatus('pending');
  const approvedCases = getCasesByStatus('approved');
  const rejectedCases = getCasesByStatus('rejected');

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
            <button className="btn-secondary mb-2">
              Editar perfil
            </button>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Coat_of_arms_of_the_Dominican_Republic.svg/100px-Coat_of_arms_of_the_Dominican_Republic.svg.png" alt="Procuraduría" className="h-8" />
              <img src="https://intrant.gob.do/images/logo_intrant.png" alt="INTRANT" className="h-8" />
              <div className="bg-green-600 text-white px-2 py-1 rounded text-xs">INTRANT</div>
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

      {/* Cases Gallery */}
      <div className="space-y-6">
        {/* Pending Cases */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Casos pendientes de completar:
          </h3>
          {pendingCases.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay casos pendientes</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pendingCases.slice(0, 4).map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => handleCaseClick(caseItem)}
                  className="cursor-pointer group"
                >
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img
                      src={caseItem.images?.[0]?.url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300'}
                      alt={caseItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 truncate">{caseItem.title}</h4>
                  <p className="text-xs text-gray-600">{caseItem.case_number}</p>
                  <p className="text-xs text-gray-500">
                    Sometido {Math.floor(Math.random() * 5 + 1)} horas, {Math.floor(Math.random() * 60)} minutos
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Cases */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Casos completados</h3>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Casos aprobados
            </div>
          </div>
          {approvedCases.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay casos aprobados</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {approvedCases.slice(0, 5).map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => handleCaseClick(caseItem)}
                  className="cursor-pointer group"
                >
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img
                      src={caseItem.images?.[0]?.url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300'}
                      alt={caseItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 truncate">{caseItem.title}</h4>
                  <p className="text-xs text-gray-600">{caseItem.case_number}</p>
                  <p className="text-xs text-gray-500">
                    Aprobado {new Date(caseItem.reviewed_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejected Cases */}
        {rejectedCases.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Casos rechazados</h3>
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                Casos rechazados
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {rejectedCases.slice(0, 5).map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => handleCaseClick(caseItem)}
                  className="cursor-pointer group"
                >
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img
                      src={caseItem.images?.[0]?.url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300'}
                      alt={caseItem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 truncate">{caseItem.title}</h4>
                  <p className="text-xs text-gray-600">{caseItem.case_number}</p>
                  <p className="text-xs text-gray-500">
                    Rechazado {new Date(caseItem.reviewed_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* More Cases Available */}
        <div className="text-center">
          <button className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition duration-200">
            Mostrar más casos completados
          </button>
        </div>

        {/* Featured Cases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allCases.slice(0, 3).map((caseItem) => (
            <div
              key={caseItem.id}
              onClick={() => handleCaseClick(caseItem)}
              className="bg-black rounded-lg overflow-hidden cursor-pointer group relative"
            >
              <img
                src={caseItem.images?.[0]?.url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400'}
                alt={caseItem.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <h4 className="text-white font-medium">{caseItem.title}</h4>
                <p className="text-gray-300 text-sm">{caseItem.case_number}</p>
                <p className="text-gray-400 text-xs">
                  {new Date(caseItem.submitted_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          ))}
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