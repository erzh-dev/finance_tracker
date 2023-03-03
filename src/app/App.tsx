import React, { useState } from 'react';
import Modal from 'react-modal';
import { BrowserRouter, BrowserRouter as Router } from 'react-router-dom';
import { globalStyles } from 'shared/theme/GlobalStyles';
import { ErrorBoundary } from './ErrorBoundary';
import { ETheme } from 'shared/config/enums';
import { Routers } from './Routers';

Modal.setAppElement('#root');

const App: React.FC = () => {
  const [themeClass, setThemeClass] = useState<ETheme>(ETheme.dark);
  const onClick = () => {
    setThemeClass(themeClass === ETheme.dark ? ETheme.light : ETheme.dark);
  };

  return (
    <ErrorBoundary>
      <BrowserRouter basename="/">
        <Router>
          <div className={`${globalStyles} ${themeClass}`}>
            <Routers />
          </div>
        </Router>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
