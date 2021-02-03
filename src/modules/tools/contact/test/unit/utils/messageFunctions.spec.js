import sinon from "sinon";
import axios from "axios";

import {httpClient} from "../../../utils/messageFunctions";

describe("tools/contact/utils/messageFunctions", function () {
    describe("httpClient", function () {
        beforeEach(() => {
            sinon.stub(Radio, "trigger");
            sinon.stub(console, "error");
        });

        afterEach(sinon.restore);

        it("calls onSuccess parameter on success", function (done) {
            sinon.stub(axios, "post").returns(
                Promise.resolve({status: 200})
            );

            const onSuccess = sinon.spy(done),
                onError = sinon.spy();

            httpClient("url", {}, onSuccess, onError);
        }).timeout(100);

        it("calls onError parameter on internal client error", function (done) {
            sinon.stub(axios, "post").returns(
                Promise.reject("Internal Client Error")
            );

            const onSuccess = sinon.spy(),
                onError = sinon.spy(done);

            httpClient("url", {}, onSuccess, onError);
        }).timeout(100);

        it("calls onError parameter if response status is not 200", function (done) {
            sinon.stub(axios, "post").returns(
                Promise.resolve({status: 500})
            );

            const onSuccess = sinon.spy(),
                onError = sinon.spy(done);

            httpClient("url", {}, onSuccess, onError);
        }).timeout(100);

        it("calls axios.post in expected fashion", function () {
            sinon.stub(axios, "post").returns(
                Promise.resolve({status: 200})
            );

            httpClient("url", Symbol.for("data"), sinon.spy(), sinon.spy());

            sinon.assert.calledOnce(axios.post);
            sinon.assert.calledWith(axios.post, "url", Symbol.for("data"));
        });
    });
});
