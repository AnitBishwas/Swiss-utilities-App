import {
  Layout,
  Page,
  Text,
  Card,
  InlineStack,
  Button,
  List,
  BlockStack,
} from "@shopify/polaris";
import { useState } from "react";
import ImagePicker from "../components/ImagePicker";
import { useAppBridge } from "@shopify/app-bridge-react";
import { uploadProductImages, uploadProductSwatches } from "../helpers/listing";

const Listing = () => {
  const [product, setProduct] = useState(null);
  const [variantList, setVariantList] = useState([]);
  const [imageList, setImageList] = useState([]);
  const shopify = useAppBridge();
  const [imageUpdateLoading, setImageUpdateloading] = useState(false);
  const [swatchList, setSwatchList] = useState([]);
  const [swatchUpdateLoading, setSwatchUpdateLoading] = useState(false);

  const handleProductPicker = async () => {
    try {
      const selected = await shopify.resourcePicker({
        type: "product",
        multiple: false,
      });
      selected ? setProduct(selected[0]) : setProduct(null);
      selected ? setVariantList(selected[0]?.variants) : setVariantList([]);
    } catch (err) {
      console.log("Failed to handle product picker reason -->" + err.message);
    }
  };
  const handleVariantImageListUpdate = (files, variant) => {
    let variantWithImageList = {
      variantId: variant.id,
      images: files,
      alt:
        variant.selectedOptions.length > 0
          ? `#color_${variant.selectedOptions[0]?.value.toLowerCase().replace(" ", "-")}`
          : "",
    };
    let newImageList = imageList.find((image) => image.variantId == variant.id)
      ? imageList.map((image) => {
          if (image.variantId == variant.id) {
            return { ...image, images: files };
          } else {
            return image;
          }
        })
      : imageList.push(variantWithImageList) && imageList;
    setImageList(newImageList);
  };
  const handleReset = () => {
    setProduct(null);
    setVariantList([]);
  };

  const handleSwatchListUpdate = (files, value) => {
    let valueWithFile = {
      value: value,
      file: files[0],
      sku: variantList.find((el) =>
        el.selectedOptions.find((opt) => opt.value == value)
      ).sku,
    };
    let newSwatchList = swatchList.find((el) => el.value == value)
      ? swatchList.map((swatch) => {
          if (swatch.value == value) {
            return {
              ...swatch,
              file: valueWithFile.file,
            };
          } else {
            return swatch;
          }
        })
      : [...swatchList, valueWithFile];
    setSwatchList(newSwatchList);
  };
  const handleProductImageUpdate = async () => {
    try {
      setImageUpdateloading(true);
      await uploadProductImages(imageList, product.id);
      setImageUpdateloading(false);
      shopify.toast.show("Media uploaded");
    } catch (err) {
      console.log("Failed to update .product images reason -->" + err.message);
      shopify.toast.show("Image Update Failed", { isError: true });
    }
  };

  const hanldeProductSwatchUpdate = async () => {
    try {
      setSwatchUpdateLoading(true);
      await uploadProductSwatches(swatchList);
      setSwatchUpdateLoading(false);
      shopify.toast.show("Swatches updated");
    } catch (err) {
      console.log("Failed to update product swatches reason -->" + err.message);
    }
  };
  return (
    <Page
      title="Product Listing"
      subtitle={product ? product.title : ""}
      primaryAction={{
        content: product ? "Change Product" : "Choose Product",
        onAction: handleProductPicker,
      }}
      secondaryActions={[
        {
          content: "Reset",
          onAction: handleReset,
        },
      ]}
    >
      <Layout>
        <Layout.Section variant="oneHalf">
          {variantList.length > 0 && (
            <>
              <Card>
                <Text variant="headingMd">Variant Images</Text>
                <List gap="loose">
                  {variantList.map((variant) => (
                    <div
                      style={{
                        borderBottom: "solid 1px #ddddddff",
                        paddingBlock: 6,
                      }}
                    >
                      <InlineStack
                        align="space-between"
                        blockAlign="center"
                        key={variant.id}
                      >
                        <BlockStack>
                          <Text variant="bodyMd">{variant.title}</Text>
                          <Text variant="bodySm">{variant.sku}</Text>
                        </BlockStack>
                        <InlineStack>
                          <ImagePicker
                            multiple={true}
                            callback={(files) =>
                              handleVariantImageListUpdate(files, variant)
                            }
                          />
                        </InlineStack>
                      </InlineStack>
                    </div>
                  ))}
                </List>
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    loading={imageUpdateLoading}
                    disabled={imageList.length == 0}
                    variant="primary"
                    onClick={handleProductImageUpdate}
                  >
                    Update
                  </Button>
                </div>
              </Card>
            </>
          )}
        </Layout.Section>
        <Layout.Section variant="oneHalf">
          {product && product.options[0]?.values.length > 0 && (
            <Card>
              <>
                <Text variant="headingMd">Swatch Images</Text>
                <List gap="loose">
                  {product.options[0].values.map((el) => (
                    <div
                      style={{
                        borderBottom: "solid 1px #ddddddff",
                        paddingBlock: 6,
                      }}
                      key={el.toLowerCase().replace(" ", "-")}
                    >
                      <InlineStack align="space-between">
                        <Text>{el}</Text>
                        <ImagePicker
                          multiple={false}
                          callback={(files) =>
                            handleSwatchListUpdate(files, el)
                          }
                        />
                      </InlineStack>
                    </div>
                  ))}
                </List>
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    loading={swatchUpdateLoading}
                    disabled={swatchList.length == 0}
                    variant="primary"
                    onClick={hanldeProductSwatchUpdate}
                  >
                    Update
                  </Button>
                </div>
              </>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Listing;
