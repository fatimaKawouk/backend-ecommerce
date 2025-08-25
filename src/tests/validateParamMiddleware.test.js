const {validateParamMiddleware} = require("../middlewares/validateParam.js");


describe("validateParamMiddleware", () => {
  let req, res, next;

    beforeEach(() => {
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test("should return 400 if id is missing", () => {
  
    validateParamMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("should call next if id is valid", () => {
    req.params={id: "123"};
    validateParamMiddleware(req, res, next);

    expect(req.validatedId).toBe("123");
    expect(next).toHaveBeenCalled();
  });
  
  test("should call 400 if id is invalid", () => {
    req.params={id: 123};
    validateParamMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
})