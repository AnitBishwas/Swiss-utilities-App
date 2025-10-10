import { AppProvider as PolarisProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import { useRoutes } from "raviger";
import routes from "./Routes";
import AppBridgeProvider from "./providers/AppBridgeProvider";
import { Link } from "raviger";

export default function App() {
  const RouteComponents = useRoutes(routes);

  return (
    <PolarisProvider i18n={translations}>
      <AppBridgeProvider>
        <ui-nav-menu>
          <Link href="/sale">Sale</Link>
          <Link href="/listing">Listing</Link>
        </ui-nav-menu>
        {RouteComponents}
      </AppBridgeProvider>
    </PolarisProvider>
  );
}
