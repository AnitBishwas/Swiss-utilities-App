import React from "react";
import Index from "./pages/Index";
import Sale from "./pages/Sale";

const routes = {
  "/": () => <Index />,
  "/sale": () => <Sale/>
};

export default routes;
