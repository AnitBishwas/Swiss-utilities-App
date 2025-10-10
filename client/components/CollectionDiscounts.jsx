import {
  Card,
  LegacyFilters,
  Text,
  EmptyState,
  ResourceList,
  ResourceItem,
  Thumbnail,
  BlockStack,
  InlineStack,
  TextField,
  Button,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useState } from "react";
import { PlusIcon } from "@shopify/polaris-icons";
import CollectionItem from "./CollectionItem";

const CollectionDiscounts = () => {
  const [collections, setCollections] = useState([]);
  const shopify = useAppBridge();

  const showCollectionPicker = async () => {
    try {
      const selected = await shopify.resourcePicker({
        type: "collection",
        multiple: false,
      });
      console.log(selected);
      setCollections([...collections, ...selected]);
    } catch (err) {
      console.log("Failed to shown collection picker reason -->" + err.message);
    }
  };
  const emptyMarkup = !collections.length ? (
    <EmptyState
      heading="No collection selected"
      action={{ content: "Choose collection", onAction: showCollectionPicker }}
    />
  ) : undefined;
  return (
    <Card>
      <InlineStack blockAlign="center" align="space-between">
        <Text variant="headingSm">Collection Discounts</Text>
        <Button
          icon={PlusIcon}
          onClick={showCollectionPicker}
          variant="monochromePlain"
        />
      </InlineStack>
      <div style={{ marginBottom: 10 }}></div>
      <ResourceList
        emptyState={emptyMarkup}
        items={collections}
        filterControl={null}
        resourceName={{ singular: "collection", plural: "collections" }}
        renderItem={(item) => {
          const { id, title, productsCount, image, discount } = item;
          return (
            <ResourceItem id={id}>
              <CollectionItem
                id={id}
                title={title}
                productsCount={productsCount}
                image={image}
                discount={discount}
              />
            </ResourceItem>
          );
        }}
      />
    </Card>
  );
};

export default CollectionDiscounts;
