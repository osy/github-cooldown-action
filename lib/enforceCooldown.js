module.exports = function(edges, cooldownMinutes, repoId) {
  const MS_PER_MINUTE = 60000;
  const cooldown = new Date();
  cooldown.setTime(cooldown.getTime() - cooldownMinutes * MS_PER_MINUTE);
  const recentActions = edges.filter(item => item.node.repository.id == repoId && item.node.createdAt > cooldown.toISOString());
  return recentActions;
}
