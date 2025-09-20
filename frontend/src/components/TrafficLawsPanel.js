import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrafficLawsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [trafficLaws, setTrafficLaws] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchTrafficLaws();
  }, []);

  const fetchTrafficLaws = async () => {
    try {
      const response = await axios.get(`${API}/traffic-laws`);
      setTrafficLaws(response.data);
    } catch (error) {
      console.error('Error fetching traffic laws:', error);
    }
  };

  const lawsMenuItems = [
    'Actividades en Vehículos...',
    'Aditamentos en las Placas (Art. 189-B)',
    'Alterar o Modificar la lectura del...',
    'Aparatos Receptores de Imágenes...',
    'Actividades en Vehículos de Motor...',
    'Alcanzar y Pasar por la Izquierda (Art...)',
    'Alterar o Modificar la lectura del...',
    'Aparatos Receptores de Imágenes (Art...)',
    'Aditamentos en las Placas'
  ];

  const filteredLaws = lawsMenuItems.filter(law => 
    law.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="border-t border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Consulta de leyes de tránsito</h3>
          <div className="flex items-center text-xs text-green-600">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Santo Domingo, República Dominicana
          </div>
        </div>

        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Buscar infracción"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button className="absolute right-2 top-2 bg-green-500 text-white p-1 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        <div className="space-y-1">
          {filteredLaws.slice(0, isExpanded ? filteredLaws.length : 5).map((law, index) => (
            <div key={index} className="flex items-center text-xs text-gray-600 hover:text-gray-800 cursor-pointer py-1">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2 flex-shrink-0"></div>
              <span className="truncate">{law}</span>
            </div>
          ))}
          
          {filteredLaws.length > 5 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-2"
            >
              {isExpanded ? 'Ver menos' : `Ver ${filteredLaws.length - 5} más...`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrafficLawsPanel;