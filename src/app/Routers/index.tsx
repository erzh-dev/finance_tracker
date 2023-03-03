import React, { FC } from 'react';
import { Route, Switch } from 'react-router-dom';

export const Routers: FC = () => {
  return (
    <Switch>
      <Route path="/">
        <>Main</>
      </Route>
    </Switch>
  );
};
