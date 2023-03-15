import axios from "axios";
import * as cheerio from "cheerio";

const CALENDAR_URL = "https://www.wgimprovschool.com/calendar";
const IN_PERSON_PREFIX = "In person:";

const { data: html } = await axios.get(CALENDAR_URL);
const $ = cheerio.load(html);
const divs = $(".col-md-10 > div[class]");

let classDate;

const calendar = Array.from(divs).reduce((arr, div) => {
  const $div = $(div);
  if ($div.attr("class").split(" ").includes("mt-3")) {
    classDate = $div.text();
    return arr;
  }
  let [$cls, $time, $instructor] = Array.from($div.children("div")).map((d) => $(d));
  const href = $cls.children("a").attr("href");
  const absHref = new URL(href, CALENDAR_URL).href;
  let name = $cls.text();
  let inPerson = false;
  if (name.startsWith(IN_PERSON_PREFIX)) {
    inPerson = true;
    name = name.replace(IN_PERSON_PREFIX, "").trim();
  }

  const [startTime, endTime] = $time
    .text()
    .split("-")
    .map((time) => parseTime(time.trim()));
  const startDateTime = new Date(classDate);
  startDateTime.setHours(startTime.hours, startTime.minutes);
  const endDateTime = new Date(classDate);
  endDateTime.setHours(endTime.hours, endTime.minutes);

  arr.push({
    name,
    inPerson,
    url: absHref,
    date: classDate,
    time: $time.text(),
    startTime: startDateTime,
    endTime: endDateTime,
    instructor: $instructor.text(),
  });
  return arr;
}, []);

calendar
  .filter((c) => !c.inPerson)
  .forEach((c) => {
    console.log(`
      ${c.name}
      ${c.date} ${c.time}
      ${c.instructor}
  `);
  });

function prettyTime(time) {
  if (time.includes(":")) return time;
  return time.replace(/^(\d+)([ap]m)$/i, "$1:00$2");
}

function parseTime(time) {
  time = prettyTime(time);
  let [hours, minutes] = time
    .replace(/[ap]m$/i, "")
    .split(":")
    .map(Number);
  if (hours === 12) {
    hours = 0;
  }
  if (time.toLowerCase().endsWith("pm")) {
    hours += 12;
  }
  return { hours, minutes };
}
