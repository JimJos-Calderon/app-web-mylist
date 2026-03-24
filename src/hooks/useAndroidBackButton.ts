import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);

  // Mantenemos la referencia del path actualizada para no recrear el listener
  // y asegurar que siempre tenemos la ruta actual dentro del callback.
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    // Si no es entorno nativo (ej. navegador web), no hacemos nada
    if (!Capacitor.isNativePlatform()) return;

    // Al agregar el listener, Capacitor devuelve un Promise<PluginListenerHandle>
    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      const currentPath = pathnameRef.current;
      
      // Si estamos en la raíz o en el dashboard, cerramos la app
      if (currentPath === '/' || currentPath === '/dashboard') {
        CapacitorApp.exitApp();
      } else {
        // En cualquier otra ruta, navegamos hacia atrás (react-router)
        navigate(-1);
      }
    });

    // Cleanup: se previene memory leak eliminando el listener cuando
    // el componente se desmonta. Esperamos a que la promesa se resuelva
    // para obtener el handle y llamar a remove().
    return () => {
      listenerPromise.then(handle => {
        if (handle && typeof handle.remove === 'function') {
          handle.remove();
        }
      });
    };
  }, [navigate]);
};
