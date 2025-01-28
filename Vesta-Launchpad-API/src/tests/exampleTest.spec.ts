import chai from "chai";
import chaiHttp from "chai-http";
import app from "../server";
import { MESSAGES, HTTP_STATUS_CODE } from "../common/constants";

chai.use(chaiHttp);
const expect = chai.expect;

export let dataID;

describe("Example Endpoint", () => {
  describe("get Example Data Endpoint", () => {
    it("should return data says hello base route ", async () => {
      const res = await chai.request(app).get("/");

      expect(res.status).to.equal(HTTP_STATUS_CODE.SUCCESS_RESPONSE_CODE);
      expect(res.body.status).to.be.true;
      expect(res.body.data).to.have.property("data");
      expect(res.body.message).to.equal(MESSAGES.DATA_SUCCESS);
    });
  });

  // After all tests, you can perform cleanup or any necessary teardown
  after((done) => {
    // Perform cleanup, if any
    done();
  });
});
