#!/usr/bin/env node

import { existsSync } from "fs";
import { readFile, writeFile, appendFile, access, constants } from "fs/promises";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const LogFilePath = path.join(__dirname, "data", "log.txt"),
	LatestFilePath = path.join(__dirname, "data", "latest.txt");

let urls,
	lastNotifiedEpisode = 0;

const GenerateFileUrl = (episode, type = "hdtv") =>
	`${process.env.A_MILLION_DOWNLOAD_URL}/a.million.little.things.s05e${episode
		.toString()
		.padStart(2, "0")}.720p.${type}.hevc.x265.rmteam.mkv`;

const AddToLog = (data) => {
	const params = [
		LogFilePath,
		JSON.stringify({
			time: new Date().toString(),
			...data,
		}) + "\r\n",
	];

	if (existsSync(LogFilePath)) {
		return appendFile(...params);
	} else {
		return writeFile(...params);
	}
};

access(LatestFilePath, constants.W_OK | constants.R_OK)
	.then(() => readFile(LatestFilePath, "utf8"))
	.then((result) => {
		lastNotifiedEpisode = result;
	})
	.catch(() => {
		console.log("Reading latest.txt failed.\n");
	})
	.then(() => fetch(process.env.A_MILLION_PREVIEW_URL))
	.then((response) => response.text())
	.then((response) => {
		let x = response.split('<div class="dl-main">', 2)[1],
			y = x.split("zirnevis", 2)[0],
			matches = [...y.matchAll('https://1da.ir/(.*)"')];

		urls = matches.map((match) => "https://1da.ir/" + match[1]);
		return urls;
	})
	.then((urls) =>
		Promise.all([
			fetch(GenerateFileUrl(urls.length, "web"), { method: "HEAD" }),
			fetch(GenerateFileUrl(urls.length, "hdtv"), { method: "HEAD" }),
		])
	)
	.then((responses) => responses.find((i) => i.ok))
	.then((SuccessfulResponse) => {
		let message = `## A Million Little Things Ep. ${urls.length}\n${urls
			.map((url, index) => `Ep. ${index + 1}: ${url}`)
			.join("\n")}\n\n`;

		if (SuccessfulResponse) {
			message += `Ep. ${urls.length} Direct URL:\n${SuccessfulResponse.url}`;
		} else {
			message += `Couldn't find URL of ep. ${urls.length}.`;
		}

		if (lastNotifiedEpisode < urls.length) {
			return fetch(process.env.MATTERMOST_API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.MATTERMOST_BOT_TOKEN}`,
				},
				body: JSON.stringify({
					channel_id: process.env.CHANNEL_ID,
					message: message,
					// props: { attachments: [{ pretext: "Look some text", text: "This is text" }] },
				}),
			});
		} else return false;
	})
	.then((MattermostResponse) => {
		if (MattermostResponse?.ok) {
			writeFile(LatestFilePath, urls.length.toString()).catch(null);
			return AddToLog({
				status: "Report SUCCESS",
			});
		} else {
			return AddToLog({
				status: "Already Reported",
			});
		}
	})
	.then(() => console.log("SUCCESS"))
	.catch((error) => {
		console.error("ERROR");
		console.error(error);
		return AddToLog({
			status: "ERROR",
			error: error.toString(),
		});
	})
	.catch(() => {
		console.error("ADD TO LOG FAILED");
	});
