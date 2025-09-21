import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from "../assets/img/logo1.1_light_mode.png";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [globalFilter, setGlobalFilter] = useState('');

  const navigation = [
    { name: 'Casos Pendientes', href: '/casos-pendientes', current: location.pathname === '/casos-pendientes' },
    { name: 'Casos Revisados', href: '/casos-revisados', current: location.pathname === '/casos-revisados' },
    { name: 'Mi Perfil', href: '/mi-perfil', current: location.pathname === '/mi-perfil' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center">
                <img className="h-8 w-auto" src={logo} alt="367 Logo" />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-8">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-green-100 text-green-700 border-b-2 border-green-500'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Search and User menu */}
            <div className="flex items-center space-x-4">
              {/* Global Filter */}
              {(location.pathname === '/casos-pendientes' || location.pathname === '/casos-revisados') && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por caso, fecha, título..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">🇩🇴 ESP</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet context={{ globalFilter, setGlobalFilter }} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📞 809-458-4981 Ext. 904</p>
                <p>✉️ soporteagentes@367.com.do</p>
                <p>📍 Santo Domingo, D.N.</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">¿Necesitas ayuda?</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>Preguntas Frecuentes</p>
                <p>Reglamentos internos</p>
                <p>Términos y condiciones</p>
                <p>Política de Privacidad</p>
                <p>Leyes de tránsito</p>
                <p>¿Algo no funciona bien?</p>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-white">367</span>
                  <div className="flex space-x-1 ml-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-300">
                <p>@367online | @367.sdq</p>
                <p>367 2024 ® Todos los derechos reservados</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;