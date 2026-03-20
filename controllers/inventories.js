const Inventory = require('../schemas/inventories');

module.exports = {
    getAll: async (req, res) => {
        let inventories = await Inventory.find().populate('product');
        res.status(200).send(inventories);
    },

    getById: async (req, res) => {
        let inventory = await Inventory.findById(req.params.id).populate('product');
        if (!inventory) return res.status(404).send("Không tìm thấy kho hàng");
        res.status(200).send(inventory);
    },

    addStock: async (req, res) => {
        let { product, quantity } = req.body;
        if (quantity <= 0) return res.status(400).send("Số lượng phải lớn hơn 0");

        let updated = await Inventory.findOneAndUpdate(
            { product: product },
            { $inc: { stock: quantity } }, // $inc là atomic operator, cộng thêm quantity
            { new: true }
        );
        res.status(200).send(updated);
    },

    removeStock: async (req, res) => {
        let { product, quantity } = req.body;
        
        // Điều kiện stock >= quantity đảm bảo không thể trừ âm (Atomic lock)
        let updated = await Inventory.findOneAndUpdate(
            { product: product, stock: { $gte: quantity } }, 
            { $inc: { stock: -quantity } },
            { new: true }
        );

        if (!updated) return res.status(400).send("Kho không đủ hàng để xuất");
        res.status(200).send(updated);
    },

    reservation: async (req, res) => {
        let { product, quantity } = req.body;

        // Trừ stock, cộng reserved
        let updated = await Inventory.findOneAndUpdate(
            { product: product, stock: { $gte: quantity } },
            { $inc: { stock: -quantity, reserved: quantity } },
            { new: true }
        );

        if (!updated) return res.status(400).send("Kho không đủ hàng để đặt trước");
        res.status(200).send(updated);
    },

    sold: async (req, res) => {
        let { product, quantity } = req.body;

        // Trừ reserved, cộng soldCount
        let updated = await Inventory.findOneAndUpdate(
            { product: product, reserved: { $gte: quantity } },
            { $inc: { reserved: -quantity, soldCount: quantity } },
            { new: true }
        );

        if (!updated) return res.status(400).send("Số lượng hàng đặt trước không đủ để bán");
        res.status(200).send(updated);
    }
};