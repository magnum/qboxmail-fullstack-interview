# Qboxmail WebMail

To start the dev back-end run:

```
cd be
npm start development
```

To start the dev front-end run:

```
cd fe
npm start development
```

# Deploy procedure:

- For Webmail:
  - align languages repository
  - update version number in `be/package.json` and `fe/package.json` file
  - update activities/functionalities in `be/changelog.md` file
  - push changes
  - create tag: `./new_version.sh`
  - deploy the new tag: `cd be; npm run deploy production v$(grep '"version"' package.json | grep -Eo "[0-9\.]*")`
- For MTM
  - align languages repository
  - update version_mtm number in `be/package.json` and `fe/package.json` file
  - update activities/functionalities in `be/changelog_mtm.md` file
  - push changes
  - create tag: `./new_version_mtm.sh`
  - deploy the new tag: `cd be; npm run deploy production_mtm v$(grep '"version_mtm"' package.json | grep -Eo "[0-9\.]*")_mtm`

# Hints:

- To remove a local and remote git tag:

```
git push --delete origin tagName
git tag -d tagName
```
