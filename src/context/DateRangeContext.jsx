import { createContext, useContext, useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const DateRangeContext = createContext();

export const useDateRange = () => useContext(DateRangeContext);

export function DateRangeProvider({ children }) {
  const [from, setFrom] = useState(() => {
    const saved = localStorage.getItem('sl_date_from');
    return saved || format(startOfMonth(new Date()), 'yyyy-MM-dd');
  });
  
  const [to, setTo] = useState(() => {
    const saved = localStorage.getItem('sl_date_to');
    return saved || format(endOfMonth(new Date()), 'yyyy-MM-dd');
  });

  useEffect(() => {
    localStorage.setItem('sl_date_from', from);
    localStorage.setItem('sl_date_to', to);
  }, [from, to]);

  return (
    <DateRangeContext.Provider value={{ from, to, setFrom, setTo }}>
      {children}
    </DateRangeContext.Provider>
  );
}
