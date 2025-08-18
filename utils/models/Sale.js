import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
    state:{
        type: String,
        enums: ['active','disabled'],
        required: true
    },
    status: {
        type: String,
        enums: ['progress','completed'],
        required: true
    },
    collection: {
        title: {
            type : String,
            required: true,
        },
        id: {
            type: Number,
            required: true
        }
    },
    tag: {
        type: String
    }
});

const SaleModel = mongoose.model("Sale",saleSchema);

export default SaleModel;