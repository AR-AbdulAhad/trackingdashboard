import { createContext, useContext, useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const DateRangeContext = createContext();

export const useDateRange = () => useContext(DateRangeContext);

export function DateRangeProvider({ children }) {
  const [from, setFrom] = useState(() => {
    return localStorage.getItem('sl_date_from') ?? '';
  });
  
  const [to, setTo] = useState(() => {
    return localStorage.getItem('sl_date_to') ?? '';
  });

  useEffect(() => {
    if (from) {
      localStorage.setItem('sl_date_from', from);
    } else {
      localStorage.removeItem('sl_date_from');
    }
    if (to) {
      localStorage.setItem('sl_date_to', to);
    } else {
      localStorage.removeItem('sl_date_to');
    }
  }, [from, to]);

  return (
    <DateRangeContext.Provider value={{ from, to, setFrom, setTo }}>
      {children}
    </DateRangeContext.Provider>
  );
}
