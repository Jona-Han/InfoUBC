import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect} from "chai";
import request, {Response} from "supertest";
import fs from "fs-extra";
import { clearDisk } from "../TestUtil";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;

	const SERVER_URL = "http://localhost:4321";

	before(async function () {
		facade = new InsightFacade();
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		try {
			await server.start();
			console.log("Server started successfully");
		} catch (err) {
			console.error("Failed to start server:", err);
		}
	});

	after(async function () {
		// TODO: stop server here once!
		try {
			await server.stop();
			console.log("Server stopped successfully");
		} catch (err) {
			console.error("Failed to stop server:", err);
		}
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
		console.log("Starting a new test case.");
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
        clearDisk();
	});

	it.only("PUT test for courses dataset", async function () {
		try {
			const data = await fs.readFile("test/resources/archives/pair.zip");

			const res = await request(SERVER_URL)
				.put("/dataset/ubc/sections")
				.send(data)
				.set("Content-Type", "application/x-zip-compressed");

			expect(res.status).to.equal(200);
			expect(res.body).to.have.property("result");
            expect(res.body.result).to.deep.equal(['ubc']);
		} catch (err) {
            expect.fail()
		}
	});


	it.only("PUT test for rooms dataset", async function () {
		try {
			const data = await fs.readFile("test/resources/archives/campus.zip");

			const res = await request(SERVER_URL)
				.put("/dataset/ubc/rooms")
				.send(data)
				.set("Content-Type", "application/x-zip-compressed");

			expect(res.status).to.equal(200);
			expect(res.body).to.have.property("result");
            expect(res.body.result).to.deep.equal(['ubc']);
		} catch (err) {
            expect.fail()
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions at the supertest documentation
});
