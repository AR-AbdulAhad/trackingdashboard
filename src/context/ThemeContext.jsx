import { createContext, useContext } from 'react';

// ThemeContext is kept so we don't break existing imports, but it's now a stub
const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Enforce light mode globally
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
  }

  return (
    <ThemeContext.Provider value={{ isDark: false, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};
