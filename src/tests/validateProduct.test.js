const Joi = require('joi');
const { validateProductBody } = require('../handlers/validateProduct.js');



describe('validateProductBody', () => {
  let res;

  beforeEach(() => {
    // Mock the res object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should return value if body is valid', () => {
    const req = {
      body: {
        product: 'Apple',
        quantity: 5
      }
    };

    const result = validateProductBody(req, res);

    expect(result).toEqual(req.body); // returns validated value
    expect(res.status).not.toHaveBeenCalled(); // no error sent
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return null and send 400 if product is missing', () => {
    const req = {
      body: {
        quantity: 5
      }
    };

    const result = validateProductBody(req, res);

    expect(result).toBeNull(); // validation failed
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.stringContaining('"product" is required')
    });
  });

  it('should return null and send 400 if quantity is less than 1', () => {
    const req = {
      body: {
        product: 'Appleid',
        quantity: 0
      }
    };

    const result = validateProductBody(req, res);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.stringContaining('"quantity" must be greater than or equal to 1')
    });
  });

  it('should return null and send 400 if quantity is missing', () => {
    const req = {
      body: {
        product: 'Appleid'
      }
    };

    const result = validateProductBody(req, res);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.stringContaining('"quantity" is required')
    });
  });
});
