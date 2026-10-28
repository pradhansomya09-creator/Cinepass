import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface City {
  id: string;
  name: string;
  state: string;
  _count?: { cinemas: number };
}

interface CityContextType {
  selectedCity: City | null;
  setSelectedCity: (city: City) => void;
  cities: City[];
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCityState] = useState<City | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    api.cinemas.getCities().then((res) => {
      if (res.success && res.data) {
        setCities(res.data);
        const saved = localStorage.getItem('selectedCity');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const found = res.data.find((c: City) => c.id === parsed.id);
            if (found) {
              setSelectedCityState(found);
              return;
            }
          } catch (e) {}
        }
        // Default to Mumbai or first city
        const defaultCity = res.data.find((c: City) => c.name === 'Mumbai') || res.data[0];
        if (defaultCity) {
          setSelectedCityState(defaultCity);
        }
      }
    });
  }, []);

  const setSelectedCity = (city: City) => {
    setSelectedCityState(city);
    localStorage.setItem('selectedCity', JSON.stringify(city));
    setIsModalOpen(false);
  };

  return (
    <CityContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        cities,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};
