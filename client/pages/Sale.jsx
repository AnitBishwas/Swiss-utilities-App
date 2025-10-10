import {
  Layout,
  Page,
  Text,
  Card,
  TextField,
  Button,
  InlineStack,
  BlockStack,
  Thumbnail,
  Banner,
  Popover,
  ActionList,
} from "@shopify/polaris";
import { SearchIcon, XIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useState } from "react";
import {
  getSaleData,
  enableSale,
  disableSale,
  updateTags,
  removeTags,
} from "../helpers/index.js";
import { MenuVerticalIcon } from "@shopify/polaris-icons";
import CollectionDiscounts from "../components/CollectionDiscounts.jsx";

const Sale = () => {
  const [collection, setCollection] = useState(null);
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("disable");
  const [state, setState] = useState("completed");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bannerTone, setBannerTone] = useState("info");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerDescription, setBannerDescription] = useState("");
  const [actionPopover, setActionPopover] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);

  const shopify = useAppBridge();
  const displayModal = async () => {
    const selected = await shopify.resourcePicker({ type: "collection" });
    if (selected) {
      setCollection(selected[0]);
    }
  };
  const handleCollectionRemove = () => {
    setCollection(null);
  };
  const handleTagChange = useCallback((value) => setTag(value), []);
  const toggleAtionPopover = useCallback(() =>
    setActionPopover(!actionPopover)
  );
  const actionPopoverActivator = (
    <Button
      onClick={toggleAtionPopover}
      icon={MenuVerticalIcon}
      variant="monochromePlain"
    />
  );
  const handleSaleEnable = async () => {
    setLoading(true);
    try {
      const payload = {
        tag: tag,
        collection: {
          title: collection.title,
          id: (collection.id + "").replace("gid://shopify/Collection/", ""),
          image: collection.image ? collection.image : "",
          productsCount: collection.productsCount,
        },
      };
      const sale = await enableSale(payload);
      makePollRequestForStatus();
    } catch (err) {
      console.log("Failed to handle sale enable reasom -->" + err.message);
      shopify.toast.show("Failed", {
        isError: true,
      });
      setLoading(false);
    }
  };
  const handleSaleDisable = async () => {
    setLoading(true);
    try {
      const sale = await disableSale();
      makePollRequestForStatus();
    } catch (err) {
      console.log("Failed to handle sale disable reason -->" + err.message);
      shopify.toast.show("Failed", {
        isError: true,
      });
      setLoading(false);
    }
  };
  const handleTagUpdate = async () => {
    setLoading(true);
    try {
      const payload = {
        tag: tag,
        collection: {
          title: collection.title,
          id: (collection.id + "").replace("gid://shopify/Collection/", ""),
          image: collection.image ? collection.image : "",
          productsCount: collection.productsCount,
        },
      };
      const sale = await updateTags(payload);
      makePollRequestForStatus();
    } catch (err) {
      console.log("Failed to update product tags reason -->" + err.message);
      shopify.toast.show("Failed", {
        isError: true,
      });
      setLoading(false);
    }
  };
  const handleTagRemove = async () => {
    setLoading(true);
    try {
      const sale = await removeTags();
      makePollRequestForStatus();
    } catch (err) {
      console.log("Failed to update product tags reason -->" + err.message);
      shopify.toast.show("Failed", {
        isError: true,
      });
      setLoading(false);
    }
  };
  const updateSaleInfo = (data) => {
    setData(data);
    data.status ? setStatus(data.status) : "";
    data.state ? setState(data.state) : setState(null);
    data.tag ? setTag(data.tag) : "";
    data.collection ? setCollection(data.collection) : "";
    data.state == "pending" ? setLoading(true) : setLoading(false);
    if (data.message) {
      setBannerDescription(data.message);
    }
    if (data.status == "pending" && data.state == "enable") {
      setBannerTitle("Enabling sale");
      setBannerTone("info");
    }
    if (data.status == "completed" && data.state == "enable") {
      setBannerTitle("Sale update successfull");
      setBannerTone("success");
    }
    if (data.status == "pending" && data.state == "disable") {
      setBannerTitle("Disabling sale");
      setBannerTone("info");
    }
    if (data.status == "completed" && data.state == "disable") {
      setBannerTitle("Sale revert done successfully");
      setBannerTone("success");
    }
  };
  const makePollRequestForStatus = async () => {
    try {
      setBannerLoading(true);
      let interval = setInterval(async () => {
        const data = await getSaleData();
        updateSaleInfo(data);
        if (data.status == "completed" || data.status == "failed") {
          clearInterval(interval);
          setBannerLoading(false);
        }
      }, 1000);
    } catch (err) {
      console.log("failed to make poll request reason -->" + err.message);
    }
  };
  useEffect(() => {
    (async () => {
      try {
        const data = await getSaleData();
        updateSaleInfo(data);
        if (data.status == "pending") {
          makePollRequestForStatus();
        }
      } catch (err) {
        console.log("Failed to gety sale data reason -->" + err.message);
        shopify.toast.show("Failed", { isError: true });
      }
    })();
  }, []);
  return (
    <Page title="Manage Sale">
      <Layout>
        <Layout.Section variant="oneHalf">
          <Card>
            {!collection && (
              <>
                <TextField
                  onFocus={displayModal}
                  label="Choose collection"
                  connectedRight={
                    <Button onClick={displayModal} icon={SearchIcon}></Button>
                  }
                />
              </>
            )}
            {collection && (
              <Card>
                <InlineStack align="center" gap={400}>
                  <Thumbnail
                    source={collection.image ? collection.image : ""}
                    alt={collection.handle}
                  />
                  <BlockStack gap={200}>
                    <Text variant="headingSm">{collection.title}</Text>
                    <Text>Product : {collection.productsCount}</Text>
                  </BlockStack>
                  <div style={{ marginLeft: "auto" }}>
                    {state != "enable" && (
                      <Button
                        onClick={handleCollectionRemove}
                        variant="plain"
                        icon={XIcon}
                      />
                    )}
                  </div>
                </InlineStack>
              </Card>
            )}
            <div style={{ marginTop: 10 }}></div>
            <InlineStack align="space-between">
              <TextField
                value={tag}
                onChange={handleTagChange}
                label="Enter Tag"
              />
              <BlockStack align="end">
                <InlineStack gap={200} blockAlign="center">
                  {(state == "disable" || !state) && (
                    <Button
                      loading={loading}
                      onClick={handleSaleEnable}
                      disabled={collection && tag ? false : true}
                      variant="primary"
                    >
                      Enable
                    </Button>
                  )}
                  {state == "enable" && status == "completed" && (
                    <Button
                      loading={loading}
                      onClick={handleSaleDisable}
                      variant="primary"
                      tone="critical"
                    >
                      Disable
                    </Button>
                  )}
                  <Popover
                    preferredAlignment="left"
                    active={actionPopover}
                    activator={actionPopoverActivator}
                    onClose={() => setActionPopover(false)}
                  >
                    <ActionList
                      actionRole="tagsmenu"
                      items={[
                        {
                          content: "Update Tags",
                          disabled:
                            collection && tag.trim().length > 0 ? false : true,
                          onAction: handleTagUpdate,
                        },
                        {
                          content: "Remove Tags",
                          onAction: handleTagRemove,
                        },
                      ]}
                    />
                  </Popover>
                </InlineStack>
              </BlockStack>
            </InlineStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneHalf">
          {data && data.message && (
            <Banner tone={bannerTone} title={bannerTitle}>
              <InlineStack blockAlign="stretch" align="space-between">
                {bannerDescription && <p>{bannerDescription}</p>}
                {bannerLoading && (
                  <Button variant="monochromePlain" loading={true} />
                )}
              </InlineStack>
            </Banner>
          )}
        </Layout.Section>
        <Layout.Section variant="oneHalf">
          <CollectionDiscounts />
        </Layout.Section>
        <Layout.Section variant="oneHalf"></Layout.Section>
      </Layout>
    </Page>
  );
};

export default Sale;
