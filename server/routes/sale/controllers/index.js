import SaleModel from "../../../../utils/models/Sale.js";


/**
 * Get the current sale data
 * @returns {obj} - sale data object
 */
const getCurrentSaleData = async () =>{
    try{
        const data = await SaleModel.findOne({}).lean();
        return data;
    }catch(err){
        throw new Error("Failed to get current sale data reason -->" + err.message);
    }
};

export {
    getCurrentSaleData
}