import { describe, test, expect, jest } from "@jest/globals";
import { authorize } from "../../src/middleware/rbac.middleware.js";

function buildRes() {
  const res = {};

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);

  return res;
}

describe("authorize middleware", () => {
  test("calls next() when the user's role is allowed", () => {
    const req = {
      user: {
        role: "vendor",
      },
    };

    const res = buildRes();

    const next = jest.fn();

    authorize("vendor", "superadmin")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(res.status).not.toHaveBeenCalled();
  });

  test("returns 403 when the user's role is not allowed", () => {
    const req = {
      user: {
        role: "customer",
      },
    };

    const res = buildRes();

    const next = jest.fn();

    authorize("vendor", "superadmin")(req, res, next);

    expect(next).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("returns 401 when there is no authenticated user at all", () => {
    const req = {};

    const res = buildRes();

    const next = jest.fn();

    authorize("vendor")(req, res, next);

    expect(next).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
