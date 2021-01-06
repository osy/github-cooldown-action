module.exports = function(birthday, exemptAgeDays) {
  const MS_PER_DAY = 86400000;
  const exemptDate = new Date();
  exemptDate.setTime(exemptDate.getTime() - exemptAgeDays * MS_PER_DAY);
  return exemptAgeDays && (birthday < exemptDate.toISOString());
}
