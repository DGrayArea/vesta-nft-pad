import cron, { ScheduleOptions } from "node-cron";

const CRON_INTERVALS = {
  EVERY_MINUTE: "* * * * *",
  EVERY_MIDNIGHT: "0 0 * * *",
};

const scheduleOptions: ScheduleOptions = {
  timezone: "UTC",
  scheduled: true,
};

cron.schedule(
  CRON_INTERVALS.EVERY_MINUTE,
  () => console.log("cron runs"),
  scheduleOptions
);
