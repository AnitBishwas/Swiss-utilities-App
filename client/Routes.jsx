import React from "react";
import Index from "./pages/Index";
import Sale from "./pages/Sale";
import Listing from "./pages/Listing";

const routes = {
  "/": () => <Index />,
  "/sale": () => <Sale />,
  "/listing": () => <Listing />,
};

export default routes;
