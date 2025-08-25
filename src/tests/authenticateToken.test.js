const jwt = require("jsonwebtoken");
const{ authenticateToken} = require("../middlewares/authenticateToken.js");

jest.mock("jsonwebtoken");

describe("authenticateToken middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it("should return 401 if token is not provided", () => {
    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token is not provided" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if token verification fails", () => {
    req.headers["authorization"] = "Bearer fakeToken";
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error("invalid token"), null);
    });

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Token expired" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next and set role & uid if token is valid", () => {
    req.headers["authorization"] = "Bearer validToken";
    const user = { role: "admin", uid: "123" };
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, user);
    });

    authenticateToken(req, res, next);

    expect(req.role).toBe("admin");
    expect(req.uid).toBe("123");
    expect(next).toHaveBeenCalled();
  });
});
