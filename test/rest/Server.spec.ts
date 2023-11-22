import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect} from "chai";
import request from "supertest";
import fs from "fs-extra";
import {clearDisk} from "../TestUtil";

describe.only("Facade D3", function () {
	let facade: InsightFacade;
	let server: Server;

	const SERVER_URL = "http://localhost:4321";
	const sectionsData = fs.readFileSync("test/resources/archives/pair.zip");
	const smallSectionsData = fs.readFileSync("test/resources/archives/only1section.zip");
	const roomsData = fs.readFileSync("test/resources/archives/campus.zip");
	const smallRoomsData = fs.readFileSync("test/resources/archives/1validBuilding.zip");

	before(async function () {
		facade = new InsightFacade();
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		try {
			await server.start();
			console.log("Server::Server started successfully");
		} catch (err) {
			console.error("Server::Failed to start server:", err);
		}
	});

	after(async function () {
		// TODO: stop server here once!
		try {
			clearDisk();
			await server.stop();
			console.log("Server::Server stopped successfully");
		} catch (err) {
			console.error("Server::Failed to stop server:", err);
		}
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	describe("PUT tests", function () {
		afterEach(function () {
			// might want to add some process logging here to keep track of what is going on
			clearDisk();
		});

		it("should add valid rooms dataset", async function () {
			try {
				const res = await request(SERVER_URL)
					.put("/dataset/ubc/rooms")
					.send(smallRoomsData)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(200);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.deep.equal(["ubc"]);
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should throw error for invalid kind", async function () {
			try {
				const res = await request(SERVER_URL)
					.put("/dataset/ubc/invalid")
					.send(sectionsData)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(400);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should successfully add multiple datasets in series", async function () {
			try {
				await request(SERVER_URL)
					.put("/dataset/ubc/sections")
					.send(smallSectionsData)
					.set("Content-Type", "application/x-zip-compressed");

				const res = await request(SERVER_URL)
					.put("/dataset/second/rooms")
					.send(smallRoomsData)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(200);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.eql(["ubc", "second"]);
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should have error for rooms kind with sections dataset", async function () {
			try {
				const res = await request(SERVER_URL)
					.put("/dataset/ubc/rooms")
					.send(smallSectionsData)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(400);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should have error for invalid key", async function () {
			try {
				const res = await request(SERVER_URL)
					.put("/dataset/ubc_j/sections")
					.send(smallSectionsData)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(400);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should have error for sections kind with rooms dataset", async function () {
			try {
				const res = await request(SERVER_URL)
					.put("/dataset/ubc/sections")
					.send(smallRoomsData)
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(400);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should have error for invalid dataset", async function () {
			try {
				const res = await request(SERVER_URL)
					.put("/dataset/ubc/sections")
					.send(fs.readFileSync("test/resources/archives/noValidSections.zip"))
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(400);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should have an error for not a zip", async function () {
			try {
				const res = await request(SERVER_URL)
					.put("/dataset/ubc/sections")
					.send(fs.readFileSync("test/resources/archives/notAZip.txt"))
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(400);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should have an error for already in base 64", async function () {
			try {
				const res = await request(SERVER_URL)
					.put("/dataset/ubc/sections")
					.send(smallSectionsData.toString("base64"))
					.set("Content-Type", "application/x-zip-compressed");

				expect(res.status).to.equal(400);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});
	});

	describe("GET", function () {
		afterEach(function () {
			// might want to add some process logging here to keep track of what is going on
			clearDisk();
		});

		it("should return an empty list of datasets", async function () {
			try {
				const res = await request(SERVER_URL).get("/datasets");

				expect(res.status).to.equal(200);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.be.an("array");
				expect(res.body.result).to.eql([]);
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should return one dataset", async function () {
			try {
				await request(SERVER_URL)
					.put("/dataset/ubc/rooms")
					.send(smallRoomsData)
					.set("Content-Type", "application/x-zip-compressed");

				const res = await request(SERVER_URL).get("/datasets");

				expect(res.status).to.equal(200);
				expect(res.body.result).to.have.lengthOf(1);
				expect(res.body.result).to.eql([{id: "ubc", kind: "rooms", numRows: 4}]);
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should return 2 datasets", async function () {
			try {
				await request(SERVER_URL)
					.put("/dataset/ubc/rooms")
					.send(smallRoomsData)
					.set("Content-Type", "application/x-zip-compressed");

				await request(SERVER_URL)
					.put("/dataset/second/rooms")
					.send(smallRoomsData)
					.set("Content-Type", "application/x-zip-compressed");

				const res = await request(SERVER_URL).get("/datasets");

				expect(res.status).to.equal(200);
				expect(res.body.result).to.have.lengthOf(2);
				expect(res.body.result).to.have.deep.members([
					{id: "ubc", kind: "rooms", numRows: 4},
					{id: "second", kind: "rooms", numRows: 4},
				]);
			} catch (err: any) {
				expect.fail(err.message);
			}
		});
	});

	describe("DELETE", function () {
		afterEach(function () {
			// might want to add some process logging here to keep track of what is going on
			clearDisk();
		});

		it("should delete rooms valid rooms data", async function () {
			try {
				await request(SERVER_URL)
					.put("/dataset/ubc/rooms")
					.send(smallRoomsData)
					.set("Content-Type", "application/x-zip-compressed");

				const res = await request(SERVER_URL).delete("/dataset/ubc");

				expect(res.status).to.equal(200);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.equal("ubc");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should delete rooms valid sections data", async function () {
			try {
				await request(SERVER_URL)
					.put("/dataset/ubc/sections")
					.send(smallSectionsData)
					.set("Content-Type", "application/x-zip-compressed");

				const res = await request(SERVER_URL).delete("/dataset/ubc");

				expect(res.status).to.equal(200);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.equal("ubc");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should have notFoundError", async function () {
			try {
				await request(SERVER_URL)
					.put("/dataset/ubc/rooms")
					.send(smallRoomsData)
					.set("Content-Type", "application/x-zip-compressed");

				const res = await request(SERVER_URL).delete("/dataset/ubc2");

				expect(res.status).to.equal(404);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should return 404 notFoundError", async function () {
			try {
				await request(SERVER_URL)
					.put("/dataset/ubc/rooms")
					.send(smallRoomsData)
					.set("Content-Type", "application/x-zip-compressed");

				const res = await request(SERVER_URL).delete("/dataset/ubc2");

				expect(res.status).to.equal(404);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should return 400 error for invalid id", async function () {
			try {
				await request(SERVER_URL)
					.put("/dataset/ubc/rooms")
					.send(smallRoomsData)
					.set("Content-Type", "application/x-zip-compressed");

				const res = await request(SERVER_URL).delete("/dataset/ubc_d");

				expect(res.status).to.equal(400);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});
	});

	describe("POST", function () {
		before(async function () {
			console.log("Mocha::add dataset");
			try {
				await request(SERVER_URL)
					.put("/dataset/sections/sections")
					.send(sectionsData)
					.set("Content-Type", "application/x-zip-compressed");

				await request(SERVER_URL)
					.put("/dataset/rooms/rooms")
					.send(roomsData)
					.set("Content-Type", "application/x-zip-compressed");
			} catch (err) {
				expect.fail("ERROR:: thrown when adding dataset");
			}
		});

		it("should perform query for sections", async function () {
			try {
				const res = await request(SERVER_URL)
					.post("/query")
					.send({
						WHERE: {
							AND: [
								{
									GT: {
										sections_avg: 74.6,
									},
								},
								{
									GT: {
										sections_year: 2011,
									},
								},
								{
									GT: {
										sections_audit: 9,
									},
								},
							],
						},
						OPTIONS: {
							COLUMNS: ["sections_audit", "sections_fail", "sections_instructor", "sections_pass"],
							ORDER: "sections_audit",
						},
					})
					.set("Content-Type", "application/json");

				expect(res.status).to.equal(200);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.have.deep.members([
					{
						sections_audit: 10,
						sections_fail: 0,
						sections_instructor: "lemay, valerie",
						sections_pass: 14,
					},
					{
						sections_audit: 11,
						sections_fail: 1,
						sections_instructor: "schmidt, mark",
						sections_pass: 146,
					},
					{
						sections_audit: 18,
						sections_fail: 0,
						sections_instructor: "schmidt, mark",
						sections_pass: 59,
					},
					{
						sections_audit: 19,
						sections_fail: 0,
						sections_instructor: "lemay, valerie;tait, david e n",
						sections_pass: 9,
					},
				]);
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should perform query for sections", async function () {
			try {
				const res = await request(SERVER_URL)
					.post("/query")
					.send({
						WHERE: {
							IS: {
								rooms_name: "BIOL_1503",
							},
						},
						OPTIONS: {
							COLUMNS: ["rooms_name", "rooms_seats", "rooms_href"],
						},
					})
					.set("Content-Type", "application/json");

				expect(res.status).to.equal(200);
				expect(res.body).to.have.property("result");
				expect(res.body.result).to.have.deep.members([
					{
						rooms_name: "BIOL_1503",
						rooms_seats: 16,
						rooms_href: "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/BIOL-1503",
					},
				]);
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should return ResultTooLarge error", async function () {
			try {
				const res = await request(SERVER_URL)
					.post("/query")
					.send({
						WHERE: {},
						OPTIONS: {
							COLUMNS: ["sections_id"],
						},
					})
					.set("Content-Type", "application/json");

				expect(res.status).to.equal(400);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});

		it("should return error for invalid query", async function () {
			try {
				const res = await request(SERVER_URL)
					.post("/query")
					.send({
						WHERE: {},
						OPTIONS: {
							COLUMNS: ["sections_id", "rooms_id"],
						},
					})
					.set("Content-Type", "application/json");

				expect(res.status).to.equal(400);
				expect(res.body).to.have.property("error");
			} catch (err: any) {
				expect.fail(err.message);
			}
		});
	});
	// The other endpoints work similarly. You should be able to find all instructions at the supertest documentation
});
