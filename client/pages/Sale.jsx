import {
  Layout,
  Page,
  Text,
  Card,
  TextField,
  Button,
  InlineStack,
  Avatar,
  BlockStack,
  Thumbnail,
} from "@shopify/polaris";
import { SearchIcon, XIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useState } from "react";

const Sale = () => {
  const [collection, setCollection] = useState(null);
  const shopify = useAppBridge();

  const displayModal = async () => {
    const selected = await shopify.resourcePicker({ type: "collection" });
    if (selected) {
      setCollection(selected[0]);
    }
  };
  const handleCollectionRemove = () =>{
    setCollection(null);
  }
  console.log(collection);

  return (
    <Page title="Manage Sale">
      <Layout>
        <Layout.Section variant="oneHalf">
          <Card>
            {!collection && (
              <TextField
                onFocus={displayModal}
                label="Choose collection"
                connectedRight={
                  <Button onClick={displayModal} icon={SearchIcon}></Button>
                }
              />
            )}
            {collection && (
              <Card>
                <InlineStack align="center" gap={400}>
                  <Thumbnail
                    source={collection.image}
                    alt={collection.handle}
                  />
                  <BlockStack gap={200}>
                    <Text variant="headingSm">{collection.title}</Text>
                    <Text>Product : {collection.productsCount}</Text>
                  </BlockStack>
                  <div style={{ marginLeft: "auto" }}>
                    <Button onClick={handleCollectionRemove} variant="plain" icon={XIcon} />
                  </div>
                </InlineStack>
              </Card>
            )}
            <div style={{marginTop: 10}}></div>
            <InlineStack align="end">
                <Button variant="primary">Enable</Button>
            </InlineStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneHalf"></Layout.Section>
      </Layout>
    </Page>
  );
};

export default Sale;
