const{buildCartItemsQuery , calculateCartTotals}=require("../handlers/getCartHandler.js");




describe ("calculate Cart Totals",()=>{

    it("should calculate subtotal for each item and total amount",()=>{
        const cartItems = [
            { productid: 'p1', quantity: 2, price: 10 },
            { productid: 'p2', quantity: 3, price: 5 }
        ];

        const result= calculateCartTotals(cartItems);

        expect(result.itemsWithSubtotal).toEqual([
            { productid: 'p1', quantity: 2, price: 10, subtotal: 20 },
            { productid: 'p2', quantity: 3, price: 5, subtotal: 15 }
        ]);
        expect(result.totalAmount).toBe(35);

    });

    
    it('should return 0 totalAmount for empty cart', () => {
        const result = calculateCartTotals([]);
        expect(result.itemsWithSubtotal).toEqual([]);
        expect(result.totalAmount).toBe(0);
    });

    it('should handle string prices by converting to number', () => {
        const cartItems = [
            { productid: 'p1', quantity: 2, price: '10' }
        ];
        const result = calculateCartTotals(cartItems);
        expect(result.itemsWithSubtotal[0].subtotal).toBe(20);
        expect(result.totalAmount).toBe(20);
    });
});



describe ("Build Cart Items Query",()=>{
    let db;

    beforeEach(() => {
       
        const chain = {
            join: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
        };

        db = jest.fn(() => chain); 
    });

    it("should build base query with cartId",()=>{
        const cartId = '123';
        const queryParams = {};

        const query = buildCartItemsQuery(db, cartId, queryParams);
        expect(db).toHaveBeenCalledWith('cart_items');
        expect(query.where).toHaveBeenCalledWith('cart_items.cartid', '=', cartId);
        expect(query.join).toHaveBeenCalledWith('product', 'cart_items.productid', '=', 'product.pid');
        expect(query.select).toHaveBeenCalledWith(
            'cart_items.productid',
            'cart_items.quantity',
            'product.title',
            'product.price',
            'product.category'
        );

    });

    
    it('should add category filter if provided', () => {
        const cartId = '123';
        const queryParams = { category: 'electronics' };

        const query = buildCartItemsQuery(db, cartId, queryParams);

        expect(query.where).toHaveBeenCalledWith('category', '=', 'electronics');
    });

    it('should add minPrice filter if provided', () => {
        const cartId = '123';
        const queryParams = { minPrice: 50 };

        const query = buildCartItemsQuery(db, cartId, queryParams);

        expect(query.where).toHaveBeenCalledWith('price', '>=', 50);
    });

    it('should add maxPrice filter if provided', () => {
        const cartId = '123';
        const queryParams = { maxPrice: 200 };

        const query = buildCartItemsQuery(db, cartId, queryParams);

        expect(query.where).toHaveBeenCalledWith('price', '<=', 200);
    });

    it('should add multiple filters together', () => {
        const cartId = '123';
        const queryParams = { category: 'books', minPrice: 10, maxPrice: 100 };

        const query = buildCartItemsQuery(db, cartId, queryParams);

        expect(query.where).toHaveBeenCalledWith('category', '=', 'books');
        expect(query.where).toHaveBeenCalledWith('price', '>=', 10);
        expect(query.where).toHaveBeenCalledWith('price', '<=', 100);
    });
});