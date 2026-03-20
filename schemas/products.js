let mongoose = require('mongoose');

let productSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true
        },
        slug: {
            type: String,
            required: true,
            unique: true
        },
        price: {
            type: Number,
            default: 0
        },
        description: {
            type: String,
            default: ""
        },
        category: {
            type: mongoose.Types.ObjectId,
            ref:'category',
            required: true
        },
        images: {
            type: [String],
            default: ["https://smithcodistributing.com/wp-content/themes/hello-elementor/assets/default_product.png"]
        },
        isDeleted:{
            type:Boolean,
            default:false
        }
    }, {
    timestamps: true
})
// Thêm đoạn này vào trước module.exports trong schemas/products.js
productSchema.post('save', async function (doc, next) {
    // Import model bên trong để tránh lỗi Circular Dependency
    const Inventory = require('./inventories'); 
    try {
        // Kiểm tra xem đã có inventory chưa (phòng trường hợp update product)
        const exists = await Inventory.findOne({ product: doc._id });
        if (!exists) {
            await Inventory.create({ product: doc._id });
        }
        next();
    } catch (error) {
        console.error("Lỗi khi auto-create Inventory:", error);
        next(error);
    }
});

module.exports = mongoose.model('product', productSchema)