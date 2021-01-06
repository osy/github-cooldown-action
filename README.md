# Github Cooldown Action

This action prints "Hello World" or "Hello" + the name of a person to greet to the log.

## Inputs

### `token`

**Required** A [Github Personal Token][1] with `repo` access. Used to perform delete actions.

### `repository`

The name of the repository to protect in the format `username/repository`. If left blank, the current repository will be used.

### `cooldownMinutes`

The minimum amount of time (in minutes) that a user is allowed to make a new issue or comment on an issue. Issues and comments are counted separately. The default cooldown is 10 minutes.

### `exemptAgeDays`

Accounts older than this (in days) will be exempt from cooldown rules. If 0, then no accounts are exempt. The default is 0 (no exemption).

### `maxNewIssues`

Number of issues permitted before triggering a cooldown. Default is 1. The count is separate from number of comments.

### `maxNewComments`

Number of comments permitted before triggering a cooldown. Default is 1. The count is separate from number of issues.

## Example usage

```yaml
name: Issues
on:
  issue_comment:
    types: [created]
  issues:
    types: [opened]
jobs:
  cooldown:
    name: Cooldown
    runs-on: ubuntu-latest
    continue-on-error: true
    steps:
    - name: Cooldown
      uses: osy/github-cooldown-action@v1
      with:
        token: ${{ secrets.COOLDOWN_TOKEN }}
        exemptAgeDays: 365
```

[1]: https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token
