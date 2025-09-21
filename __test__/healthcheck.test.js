import request from "supertest";
import app from "../index.js";

/**
 * Test group for the Health Check endpoint.
 * This endpoint is important for ensuring application performance
 * and for Liveness/Readiness Probes in Kubernetes.
 */
describe("GET /healthz", () => {
  it('should respond with a 200 status code and the message "OK"', async () => {
    // Make a GET request to the /healthz endpoint using supertest
    const response = await request(app).get("/healthz");

    // Checks (Assert) whether the status code of the response is 200
    expect(response.statusCode).toBe(200);

    // Checks (Assert) whether the body of the response is the string "OK"
    expect(response.text).toBe("OK");
  });
});
