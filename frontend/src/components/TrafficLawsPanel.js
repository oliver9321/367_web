import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrafficLawsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [trafficLaws, setTrafficLaws] = useState([]);
  const [expandedLaws, setExpandedLaws] = useState(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  // Mock data for traffic laws with descriptions
  const mockTrafficLaws = [
    {
      title: 'Actividades en Vehículos de Motor',
      article: 'Art. 155-A',
      description: 'Prohibición de realizar actividades que distraigan la atención del conductor durante la conducción, incluyendo el uso de dispositivos móviles sin manos libres.'
    },
    {
      title: 'Aditamentos en las Placas (Art. 189-B)',
      article: 'Art. 189-B',
      description: 'Está prohibido colocar cualquier objeto, material o sustancia sobre las placas de identificación que impida su correcta lectura o identificación.'
    },
    {
      title: 'Alterar o Modificar la lectura del odómetro',
      article: 'Art. 201-C',
      description: 'Prohibición de alterar, modificar o manipular el odómetro de un vehículo de motor con el propósito de cambiar la lectura del millaje.'
    },
    {
      title: 'Aparatos Receptores de Imágenes en Vehículos',
      article: 'Art. 158-D',
      description: 'Los conductores no podrán utilizar aparatos receptores de imágenes, televisores o dispositivos similares mientras el vehículo esté en movimiento.'
    },
    {
      title: 'Alcanzar y Pasar por la Izquierda (Art. 112-A)',
      article: 'Art. 112-A',  
      description: 'Regulaciones sobre cuándo y cómo es permitido adelantar a otro vehículo por el lado izquierdo de manera segura y legal.'
    },
    {
      title: 'Estacionamiento Indebido',
      article: 'Art. 145-B',
      description: 'Prohibición de estacionar vehículos en lugares no autorizados, zonas de carga y descarga, aceras, o espacios reservados para personas con discapacidad.'
    },
    {
      title: 'Exceso de Velocidad en Zona Escolar',
      article: 'Art. 98-C',
      description: 'Límites especiales de velocidad en zonas escolares y horarios específicos. Multas agravadas por poner en riesgo la seguridad de menores.'
    },
    {
      title: 'Transitar sin Placa de Identificación',
      article: 'Art. 63-17, num. 13',
      description: 'Todo vehículo debe portar las placas de identificación correspondientes en la parte delantera y trasera, según corresponda por tipo de vehículo.'
    },
    {
      title: 'Usar Celular mientras Conduce',
      article: 'Art. 155-F',
      description: 'Prohibición total del uso de teléfonos celulares o dispositivos móviles mientras se conduce, excepto con sistemas de manos libres debidamente instalados.'
    }
  ];

  useEffect(() => {
    // In a real implementation, you would fetch from the API
    setTrafficLaws(mockTrafficLaws);
  }, []);

  const handleLawToggle = (index) => {
    const newExpanded = new Set(expandedLaws);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLaws(newExpanded);
  };

  const filteredLaws = trafficLaws.filter(law => 
    law.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    law.article.toLowerCase().includes(searchTerm.toLowerCase())
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

        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {filteredLaws.map((law, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => handleLawToggle(index)}
                className="w-full flex items-center justify-between text-left px-3 py-2 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium">{law.title}</div>
                    <div className="text-gray-500">{law.article}</div>
                  </div>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    expandedLaws.has(index) ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedLaws.has(index) && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {law.description}
                  </p>
                </div>
              )}
            </div>
          ))}
          
          {filteredLaws.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No se encontraron leyes que coincidan con tu búsqueda
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {isExpanded ? 'Colapsar panel' : 'Expandir panel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrafficLawsPanel;