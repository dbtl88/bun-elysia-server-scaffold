# Bun-ElysiaJS-Postgres server app scaffold, including AWS Cognito scaffolding

## What is this project?

This is a tool I needed for my personal development needs. It's really hard to go from an empty directory to a fully functioning app that consists of a server and a client and has a build and deployment pipeline, and is actually deployed somewhere, and won't cost crazy money to run as a hobby project for ages if needed, and has sensible authentication baked in, and has a custom domain set up, etc. etc.

This is my attempt to create a tool to scaffold this setup - to get me to the point where I can start writing meaningful code - that matches some of my very eclectic preferences for which frameworks and runtimes and cloud platforms and deployment approaches and auth strategy I want to use. It also uses an ORM (Drizzle) which some people will detest, but it works well for simpler apps, and saves me wrestling with something like Slonik. I make no guarantees that any of these choices are sensible, or suggestions that you should follow them too, or that they're perfectly implemented (or even well implemented), so use any of this with great caution.

This is the server generator, and there is a complementary client generator called bun-react-client-scaffold. Here's what the server generator does:

- Copies code for, then deploys, an AWS CDK app that has a CodePipeline to build and deploy a docker image of the server app.
- Copies code for the server, which includes everything that the CodeBuild step in the CodePipeline needs to build the server docker image, critically a buildspec.yml file to define the CodeBuild build, and a Dockerfile to define the Docker build. The Docker build is mulit-architecture.
- As part of this, there will be code for basic testing (just for the defaultController, and only illustrative), using Bun's integrated test runner, which you'll want to build out as you build your app around the scaffold.
- When you run the 'cognito' sub-generator, with suitable config, it will scaffold auth related routes and jwt verification - please inspect the source for this. The approach here is to use an OAuth2 code grant from cognito, then to pass the code back to the server, which retrieves tokens and sends these back to the client ONLY as secure (non-local environments only) http-only cookies. These are passed back to the server for all subsequent API requests, and the server handles token refresh using the client-provided refresh token whenever there is less than 5 minutes' validity remaining on the access token.
- When you run the 'crud' sub-generator, it will scaffold a new set of CRUD routes in the app, with their own controller, and create database schema and migrate the database for you.
- Copies a 'dev-proxy' folder with a recommended nginx config that will make sure that your local dev environment will play nicely with the http-only cookie based jwt auth strategy. Feel free to do whatever you'd usually do to serve the server and client from the same domain.
- Copies an 'ansible' folder into the main app folder, which contains an ansible playbook script and example variables file for deploying the app to a VPS. I use Hetzner for this. There is also an example hosts.ini folder, which you'll need to replace with your own and adjust the playbook run command appropriately.
- Copies a 'scripts' folder with a shell script that takes args of the form (1) file path and a (2) a path of the form /path/optional-paths/, and will use your local AWS credentials to upload the contents of the provided .env file to AWS Parameter Store, with each variable stored at /path/optional-paths/ENV_VAR. These will then be located and retrieved and injected into your VPS by the ansible script that deploys the docker image. There is another stage required to prepare the VPS for your application, which I may provide an illustrative version of at a later point. Mostly the deployment script is for illustration, and I should expect you to provide your own if you plan to use this.
- Creates a new github repo for your generated server template app (not the CDK app, or anything else), and commits an initial version of this. This is why you need GitHub cli.

I provide no guarantees for this project. It's just supposed to be a demonstration that you can adapt to your own needs.

## Outstanding to-dos

- ~~URGENT: Fix problem with auth cookies currently broken - cookies are set for the domain, but need to be valid for other subdomains too, as my approach for the server API is to use a subdomain.~~
- Make unit tests run in CodePipeline
- Improve idempotency and checks for correct starting folder when using sub-generators
- Lots of little niggles.

## Prerequisites

1. Create a new ECR repo. You can find lots of instructions online.
2. Ensure CDK is installed, authenticated, and bootstrapped on your local machine. You can find instructions direct from Amazon.
3. Ensure github cli is installed authenticated on your local machine. You can find instructions direct from GitHub.
4. You must have a github token, with appropriate fine grained permissions, stored in AWS SecretManager, under the name "github-token", of type "Key/Value Pair", with the key "token" corresponding to the token value (which should look like 'gh_randomstring').
5. Populate your config files. One is in /generators/app/, the other is in /generators/cognito/. Gitignore will ignore and not commit config-actual.yml, so perhaps use this as your config file name.
6. If you are going to use the 'cognito' generator, you will need to have an existing AWS Cognito User Pool set up, with a User Pool Client set up. The User Pool Client MUST have redirect and logout URIs set up, pointing to 'sandboxDomain/login' and 'prodDomain/login' for both redirect and logout. You can of course modify this app appropriately (and if you used the corresponding server generator, that too) to use your own URI routes.
7. (Before running ansible scripts) You must have a VPS set up correctly, and an appropriate hosts.ini provided.
8. You will need to create/obtain and store an appropriate (possibly self-signed - up to you) certificate at postgres-server.crt in the main source folder. There is a placeholder file at this location to illustrate. This is then uploaded to the docker image, and trusted by it, for communication with the database. Your Postgres database will of course already need to be set up to communicate using the corresponding key. NOTE: This will get committed to your GitHub repo unless you find another way to inject it. To my understanding, this is fine, as this doesn't contain the private key, but I'm happy to take corrections on this point.
9. The Caddy server 'caddyfile' fragment that serves this app includes a directive to reject (respond with 403) any request that does not include a special header, X-Secret-CloudFront, as it presumes you will proxy requests through CloudFront in the manner illustrated by my complementary client repo. You can produce an appropriate secret value on MacOS or Linux using the command `openssl rand -base64 128`. The reason I have not implemented rotation of this value is because this starts to incur costs on the AWS Free Tier to dynamically insert headers on CloudFront requests, as you need to use Lambda@Edge for this. You can insert this value to the file `env-sandbox-vars.yml` when you are ready to deploy your app, and you MUST NOT commit your secret header value to your git repository, so you should take steps to prevent this.

## Steps for app creation

1. Run `yo bun-elysia-server`. You will need to provide the filename of the config file you prepared. Note that the generator will create a folder 'appname' per your provided app name in the your config file, and sub-folders 'appname-server', 'appname-pipeline-server', and 'dev-proxy'.
2. To add cognito (including adding a user table to your database), run `yo bun-elysia-server:cognito` _from the generated 'appname-server' directory_. DO NOT run it from your starting directory.
3. To deploy the app using the provided ansible script (NB caveats above about VPS setup and hosts file), from the main 'appname-server' directory run `ansible-playbook ansible/deploy-playbook.yml -i ansible/.hosts.ini --extra-vars "@ansible/env-test-vars.yml" --limit your-host-name`. NOTE: You will need to adapt env-test-vars.yml accordingly for each environment you deploy, and replace your-host-name with whatever alias you have given your server in your hosts file.

## Commands to run the app

1. To run locally, use `bun dev`
2. To run tests, use `bun test`
3. To run eslint, use `bun lint`
4. Other commands, including to watch the source and re-run tests on changes, are provided in the scripts section of package.json

## Steps for app removal and cleanup

1. Go into appname/appname-pipeline-server and run `cdk destroy --force`
2. Go back to top level and `rm -rf appname-server` to remove the main appname-server folder
3. Hard delete the github repo via GitHub CLI: `gh repo delete repo-name --yes`
