<p align="center">
  <a href="https://github.com/AurorNZ/report-updated-dependencies/actions"><img alt="report-updated-dependencies status" src="https://github.com/AurorNZ/report-updated-dependencies/workflows/build-test/badge.svg"></a>
</p>

# Report updated dependencies

This Github Actions runs on changes to PR requests to detect and report changes made to dependencies.
Dependency lookups, change detections and fetching of release notes are all done by [Renovate](https://github.com/renovatebot/renovate).

```yml
name: 'build-test'
on:
  pull_request:

jobs:
  report-updated-dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: AurorNZ/report-updated-dependencies@v1
```

Or run conditionally:

```yml
name: 'build-test'
on: # rebuild any PRs and main branch changes
  pull_request:
  push:
    branches:
      - main
      - 'releases/*'

jobs:
  report-updated-dependencies:
    if: ${{ github.event_name == 'pull_request' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: AurorNZ/report-updated-dependencies@v1
```

## Publish to a distribution branch

Actions are run from GitHub repositories, so we will check-in the packed `dist` folder.

Then run [`ncc`](https://github.com/zeit/ncc) and push the results:

```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

> **Note**
> We recommend you use the `--license` option when running the `ncc` command: this creates a license file for all of the production node modules used in your project.

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md).

## Debugging

- Create a pull request, ideally with commits that update dependencies
- Once the test run is finished, enable debugging
- Run the test again with debugging enabled
- Take the JSON context from debug logs (after `ReportUpdatedDependencies context that can be used for testing:`) and save it as `test-context.json` into the root of this repository
- Add the following code to `.env` file
  ```
  INPUT_TOKEN=<YOUR_GITHUB_TOKEN>
  ```
- Use the F5 shortcut key in VSCode to start debugging
