import {
  InlineStack,
  Thumbnail,
  Text,
  BlockStack,
  TextField,
  Button,
  Popover,
  ActionList,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { CaretDownIcon, CollectionFilledIcon } from "@shopify/polaris-icons";

const CollectionItem = ({ id, title, productsCount, image, discount }) => {
  const [discountAmount, setDiscountAmount] = useState(discount || 0);
  const [popoverActive, setPopoverActive] = useState(false);

  const handleDiscountChange = useCallback((value) => setDiscountAmount(value));
  const togglePopoverActive = useCallback(
    () => setPopoverActive((popoverActive) => !popoverActive),
    []
  );
  const activator = (
    <Button
      onClick={togglePopoverActive}
      icon={CaretDownIcon}
      variant="monochromePlain"
    />
  );

  return (
    <InlineStack gap={200} align="space-between" blockAlign="center">
      <Thumbnail source={image?.originalSrc || CollectionFilledIcon} />
      <BlockStack gap={100}>
        <Text variant="bodyMd">{title}</Text>
        <Text variant="bodySm">Products {productsCount}</Text>
      </BlockStack>
      <InlineStack gap={200}>
        <TextField
          onChange={handleDiscountChange}
          max={100}
          min={0}
          value={discountAmount}
          type="number"
          placeholder="Enter discount"
        />
        <Popover
          active={popoverActive}
          activator={activator}
          autofocusTarget="first-node"
          onClose={togglePopoverActive}
        >
          <ActionList
            actionRole="menuitem"
            items={[
              { content: "Update" },
              { content: "Remove", destructive: true },
            ]}
          />
        </Popover>
      </InlineStack>
    </InlineStack>
  );
};

export default CollectionItem;
