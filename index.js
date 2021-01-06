#!/usr/bin/env node

const core = require('@actions/core');
const github = require('@actions/github');
const { graphql } = require('@octokit/graphql');
const enforceCooldown = require('./lib/enforceCooldown.js');
const isExempt = require('./lib/isExempt.js');

(async () => {
  try {
    const githubRepository = core.getInput('repository');
    const githubActor = process.env.GITHUB_ACTOR;
    const githubToken = core.getInput('token');
    const cooldownMinutes = core.getInput('cooldownMinutes');
    const exemptAgeDays = core.getInput('exemptAgeDays');

    const graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${githubToken}`,
      },
    });
    const repositoryParts = githubRepository.split('/');
    const { repository } = await graphqlWithAuth(
      `
        query lastIssues($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            id
          }
        }
      `,
      {
        owner: repositoryParts[0],
        repo: repositoryParts[1]
      }
    );

    const repoId = repository.id
    if (!repoId || !repoId.length) {
      throw new Error('Invalid repository!');
    }

    console.info(`Checking cooldown for ${githubActor}`);
    const { user } = await graphqlWithAuth(
      `
        query lastUserHistory($user: String!) {
          user(login: $user) {
            createdAt
            issues(first: 100, orderBy: {direction: DESC, field: CREATED_AT}) {
              edges {
                node {
                  id
                  createdAt
                  repository {
                    id
                  }
                }
              }
            }
            issueComments(first: 100, orderBy: {direction: DESC, field: UPDATED_AT}) {
              edges {
                node {
                  id
                  createdAt
                  repository {
                    id
                  }
                }
              }
            }
          }
        }
      `,
      {
        user: githubActor
      }
    );
    const birthday = user.createdAt
    if (isExempt(birthday, exemptAgeDays)) {
      core.info(`${githubActor} is exempt from cooldown`);
      return;
    }
    const recentIssues = enforceCooldown(user.issues.edges, cooldownMinutes, repoId);
    if (recentIssues.length > 1) {
      for (let i = 0; i < recentIssues.length-1; i++) {
        await graphqlWithAuth(
          `
            mutation deleteIssue($delete: DeleteIssueInput!) {
              deleteIssue(input: $delete) {
                clientMutationId
              }
            }
          `,
          {
            delete: {
              issueId: recentIssues[i].node.id
            }
          }
        );
      }
      throw new Error(`${githubActor} triggered issue cooldown`);
    }
    const recentComments = enforceCooldown(user.issueComments.edges, cooldownMinutes, repoId);
    if (recentComments.length > 1) {
      for (let i = 0; i < recentComments.length-1; i++) {
        await graphqlWithAuth(
          `
            mutation deleteIssueComment($delete: DeleteIssueCommentInput!) {
              deleteIssueComment(input: $delete) {
                clientMutationId
              }
            }
          `,
          {
            delete: {
              id: recentComments[i].node.id
            }
          }
        );
      }
      throw new Error(`${githubActor} triggered issue comment cooldown`);
    }
    core.info(`Cooldown checks passed!`);
  } catch (error) {
    core.setFailed(error.message);
  }
})();
