
// const getShopifyCollections = async() =>{

//     try{
//         const query = `query{
//             collections(first: 10){
//                 edges{
//                     node{
//                         id
//                         title
//                         productsCount
//                     }
//                 }
//             }
//         }`;
//         const request = await fetch('shopify:admin/api/2025-04/graphql.json',{
//             method: 'POST',
//             body: JSON.stringify({
//                 query: query
//             })
//         });
//         const respoonse = await request.json();
//     }catch(err){
//         throw new Error("Failed to get shopify collectio reason -->" + err.message);
//     }
// }