const uploadProductImages = async (files, productId) => {
  try {
    let imagesList = files
      .map((el) => {
        return el.images.map((im, ind) => {
          let image = im;
          image.alt = el.alt;
          return image;
        });
      })
      .flat();
    let stagedFiles = [];
    let batchSize = 20;
    for (let i = 0; i < imagesList.length; i += batchSize) {
      let filesArray = imagesList.slice(i, i + batchSize);
      let fileUploads = await uploadFilesToStaging(filesArray);
      stagedFiles = [...stagedFiles, ...fileUploads];
    }
    let productBatchSize = 20;
    for (let i = 0; i < stagedFiles.length; i += productBatchSize) {
      let filesArray = stagedFiles.slice(i, i + productBatchSize);
      console.log("uploading media", filesArray);
      let mediaUploads = await uploadMediaToProduct(filesArray, productId);
    }
  } catch (err) {
    throw new Error("Failed to uplaod product images reason -->" + err.message);
  }
};
const uploadFilesToStaging = async (files) => {
  try {
    const query = `
            mutation stagedUploadsCreate($input: [StagedUploadInput!]!){
                stagedUploadsCreate(input: $input){
                    stagedTargets{
                        url
                        resourceUrl
                        parameters{
                            name
                            value
                        }
                    }
                    userErrors{
                        field
                        message
                    }
                }
            }
        `;
    const variables = {
      input: files.map((el) => ({
        filename: el.name,
        mimeType: el.type,
        httpMethod: "POST",
        resource: "FILE",
      })),
    };
    const res = await fetch("shopify:admin/api/2025-04/graphql.json", {
      method: "POST",
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    });
    const { data, errors, extensions } = await res.json();
    if (errors && errors.length > 0) {
      throw new Error("Failed to upload images reason -->");
    }
    if (extensions.cost.throttleStatus.currentlyAvailable < 400) {
      await new Promise((res, rej) => {
        setTimeout(() => {
          res(true);
        }, 1000);
      });
    }
    let imageUrls = data?.stagedUploadsCreate?.stagedTargets.map((el, ind) => ({
      url: el.resourceUrl,
      alt: files[ind].alt,
    }));
    let stagedTargets = data?.stagedUploadsCreate?.stagedTargets || [];
    for (let i = 0; i < stagedTargets.length; i++) {
      let el = stagedTargets[i];
      let ind = i;
      let params = el.parameters;
      const form = new FormData();
      params.forEach(({ name, value }) => {
        form.append(name, value);
      });
      form.append("file", files[ind]);
      const request = await fetch(el.url, {
        method: "POST",
        body: form,
      });
      const res = await request.text();
    }
    return imageUrls;
  } catch (err) {
    throw new Error(
      "Failed to upload files to staging reason -->" + err.message
    );
  }
};
const uploadFilesToShopify = async (files) => {
  try {
    const query = `mutation fileCreate($files: [FileCreateInput!]!){
            fileCreate(files: $files){
                files{
                    id
                    preview{
                        image{
                            url
                        }
                    }
                }
                userErrors{
                  field
                  message
                }
            }
        }`;
    const variables = {
      files: files.map((el) => ({
        originalSource: el.url,
        contentType: "IMAGE",
        filename: el.name + "." + el.url.split(".").at(-1),
        duplicateResolutionMode: "REPLACE",
      })),
    };
    console.log(variables);
    const res = await fetch("shopify:admin/api/2025-04/graphql.json", {
      method: "POST",
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    });
    const { data, errors, extensions } = await res.json();
    if (errors && errors.length > 0) {
      console.log(errors);
      throw new Error("Failed to upload files to shopify");
    }
    return data?.fileCreate?.files || [];
  } catch (err) {
    throw new Error(
      "Failed to upload files to shopify reason -->" + err.message
    );
  }
};
const uploadMediaToProduct = async (stagedFiles, productId) => {
  try {
    const query = `mutation productCreateMedia($media: [CreateMediaInput!]!,  $productId: ID!){
      productCreateMedia(media: $media, productId: $productId){
        media{
          alt
          mediaContentType
          status
        }
      }
    }`;
    const variables = {
      media: stagedFiles.map((el) => ({
        alt: el.alt,
        mediaContentType: "IMAGE",
        originalSource: el.url,
      })),
      productId: productId,
    };
    const res = await fetch("shopify:admin/api/2025-04/graphql.json", {
      method: "POST",
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    });
    const { data, errors, extensions } = await res.json();
    if (errors && errors.length > 0) {
      throw new Error(
        "Failed to upload product media to shopify -->" + err.message
      );
    }
    console.log(data);
  } catch (err) {
    throw new Error(
      "Failed to upload media to product reason -->" + err.message
    );
  }
};

const uploadProductSwatches = async (swatchList) => {
  try {
    const filteredSwatchList = swatchList.filter((el) => el.file);
    const mappedSwatchList = filteredSwatchList.map((el) => el.file);
    let stagedFiles = [];
    let batchSize = 20;
    console.log(mappedSwatchList);
    for (let i = 0; i < mappedSwatchList.length; i += batchSize) {
      let filesArray = mappedSwatchList.slice(i, i + batchSize);
      let fileUploads = await uploadFilesToStaging(filesArray);
      stagedFiles = [...stagedFiles, ...fileUploads];
    }
    stagedFiles = stagedFiles.map((el, ind) => ({
      ...el,
      name: `swswatch_${filteredSwatchList[ind].sku}`,
    }));
    console.log("resulting here", stagedFiles);
    let fileBatchSize = 20;
    let uploadedFiles = [];
    for (let i = 0; i < stagedFiles.length; i += fileBatchSize) {
      let filesArray = stagedFiles.slice(i, i + fileBatchSize);
      let fileUploads = await uploadFilesToShopify(filesArray);
      uploadedFiles = [...uploadedFiles, ...fileUploads];
    }
  } catch (err) {
    throw new Error(
      "Failed to upload product swatches reason -->" + err.message
    );
  }
};

const uploadSwatchImagesToStaging = async (files) => {
  try {
    const query = `
            mutation stagedUploadsCreate($input: [StagedUploadInput!]!){
                stagedUploadsCreate(input: $input){
                    stagedTargets{
                        url
                        resourceUrl
                        parameters{
                            name
                            value
                        }
                    }
                    userErrors{
                        field
                        message
                    }
                }
            }
        `;
    const variables = {
      input: files.map(({ file }) => ({
        filename: file.name,
        mimeType: file.type,
        httpMethod: "POST",
        resource: "FILE",
      })),
    };
    const res = await fetch("shopify:admin/api/2025-04/graphql.json", {
      method: "POST",
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    });
    const { data, errors, extensions } = await res.json();
    if (errors && errors.length > 0) {
      throw new Error("Failed to upload images reason -->");
    }
    if (extensions.cost.throttleStatus.currentlyAvailable < 400) {
      await new Promise((res, rej) => {
        setTimeout(() => {
          res(true);
        }, 1000);
      });
    }
    let imageUrls = data?.stagedUploadsCreate?.stagedTargets.map((el, ind) => ({
      url: el.resourceUrl,
      name: files[ind].name,
    }));
    let stagedTargets = data?.stagedUploadsCreate?.stagedTargets || [];
    console.log(stagedTargets, "herererer");

    for (let i = 0; i < stagedTargets.length; i++) {
      let el = stagedTargets[i];
      let ind = i;
      let params = el.parameters;
      const form = new FormData();
      params.forEach(({ name, value }) => {
        form.append(name, value);
      });
      form.append("file", files[ind]);
      const request = await fetch(el.url, {
        method: "POST",
        body: form,
      });
      const res = await request.text();
    }
    return imageUrls;
  } catch (err) {
    throw new Error(
      "Failed to upload swatch images to staging reason -->" + err.message
    );
  }
};
export { uploadProductImages, uploadProductSwatches };
