# deploy

    yarn sls deploy --stage test

# info
    yarn sls info --stage test

as long as `serverless-esbuild` is a git url there needs to be a build afer each update to package.json
```bash
yarn fix-esbuild
```

```json
"scripts": {
    "fix-esbuild": "pushd ./node_modules/serverless-esbuild && rm -rf ./dist && yarn install && ./node_modules/.bin/tsc; popd"
  },
  "devDependencies": {
      "serverless-esbuild": "git+ssh://git@github.com:aheissenberger/serverless-esbuild.git#fix/invoke-local-servicedirpath"
  }
```
