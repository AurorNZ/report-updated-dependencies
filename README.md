<p align="center">
  <a href="https://github.com/AurorNZ/report-updated-dependencies/actions"><img alt="report-updated-dependencies status" src="https://github.com/AurorNZ/report-updated-dependencies/workflows/build-test/badge.svg"></a>
</p>

# Report updated dependencies

This Github Actions runs on changes to PR requests to detect and report changes made to dependencies.
Dependency lookups, change detections and fetching of release notes are all done by [Renovate Bot](https://github.com/renovatebot/renovate)

```yml
name: 'build-test'
on:
  pull_request:

jobs:
  report-updated-dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: AurorNZ/report-updated-dependencies@v1
```

or run conditionally

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
      - uses: actions/checkout@v2
      - uses: AurorNZ/report-updated-dependencies@v1
```

## Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder.

Then run [ncc](https://github.com/zeit/ncc) and push the results:

```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
