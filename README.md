# ![Node/Express/Mongoose Example App](project-logo.png)


> ### NestJS codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld-example-apps) API spec.



----------

# Getting started

# [GITHUB PROJECT PAGE](https://github.com/androidwiltron/nestjs-realworld-example-app/projects/1)

[terraform](terraform) This contains the terraform files for deploying on heroku see more below
[app](app) the application files
[performance](app/tests/performance) location of performance tests
[github workflows](.github/workflows) the github actions cicd yaml config

## Installation

Clone the repository

    git clone https://github.com/androidwiltron/nestjs-realworld-example-app.git

Switch to the repo folder

    cd nestjs-realworld-example-app/app
    
Install dependencies
    
    npm install

Copy config file and set JsonWebToken secret key

    cp src/config.ts.example src/config.ts


## Docker Quickstart

using `docker-compose` you can quickly start up the app and database.

compile the ts to js into the `dist` folder

    cd app

    npm install
    
    npm run prestart:prod

build the docker image

    docker-compose build

run the app image container with the database

    docker-compose up -d
    
show state of containers
    
    docker ps

the app should be available at `http://localhost:8080/`

when you want to clean up (after changes or when finished using the containers)

    docker-compose stop
    docker-compose rm -f

    
----------

## Database

The codebase contains examples of two different database abstractions, namely [TypeORM](http://typeorm.io/) and [Prisma](https://www.prisma.io/). 
    
The branch `master` implements TypeORM with a mySQL database.

The branch `prisma` implements Prisma with a mySQL database.

----------

##### TypeORM

----------

There are multiple ways to configure TypeORM. these are documented [here](https://typeorm.io/#/using-ormconfig)

The `docker-compose.yml` has an exposed postgres database on port `5432` for local development.
this can be used to connect the app locally. A database called nestjsrealworld is created on postgres start.

The application may be started as below and will connect to the running postgres container

TypeORM config is handled using the [ormconfig.js](app/ormconfig.js) method
there is some conditional logic here depending on which `NODE_ENV` environment variable is defined on the system. use `export NODE_ENV=test` to ensure the testing config is used locally


##### Example Seeding the postgres database

The data for articles may be seeded using the file `seed_data.sql`

make sure the postgres container/db is running (use docker-compose). then run:

    cat seed_data.sql |  docker exec -i app_db_1 /bin/bash -c "PGPASSWORD=mysecretpassword psql --username postgres nestjsrealworld"


## NPM scripts

- `npm start` - Start application
- `npm run start:watch` - Start application in watch mode
- `npm run test` - run Jest test runner 
- `npm run start:prod` - Build application

----------

## API Specification

This application adheres to the api specifications set by the [Thinkster](https://github.com/gothinkster) team. This helps mix and match any backend with any other frontend without conflicts.

> [Full API Spec](https://github.com/gothinkster/realworld/tree/master/api)

More information regarding the project can be found here https://github.com/gothinkster/realworld

----------

## Start application

- `npm start`
- start docker compose as above to create and start the postgres database first
- Test api with `http://localhost:3000/api/articles` in your favourite browser

----------

# Authentication
 
This applications uses JSON Web Token (JWT) to handle authentication. The token is passed with each request using the `Authorization` header with `Token` scheme. The JWT authentication middleware handles the validation and authentication of the token. Please check the following sources to learn more about JWT.

----------
 
# Swagger API docs

This example repo uses the NestJS swagger module for API documentation. [NestJS Swagger](https://github.com/nestjs/swagger) - [www.swagger.io](https://swagger.io/)

the docs are available at `http://localhost:8080/docs`

# Performance tests

Using [locust](https://docs.locust.io/en/stable/configuration.html) to benchmark test the application.
A summary of the performance is output to console.
`run-time` may be increased to create a longer test.
`--headless` may be removed and then the web UI for locust can be used to monitor tests at `http://localhost:8089`


```
cd /app

docker run --network="host" -p 8089:8089 -v $PWD/tests/performance:/mnt/locust locustio/locust -f /mnt/locust/locustfile.py --headless --host http://localhost:8080 -u 1 -r 2 --run-time 10
```

Note. as the locust script creates a user, subsequent tests will fail as that user exists
use a clean container. see above docker compose cleanup instructions to restart the containers fresh

# Terraform Heroku Deployment

Heroku was chosen for the following reasons:

1. ease of deployment. simple resources in terraform with very little machinery or wireing. almost 'turnkey'
2. easily control the costs for a hobby 'dev' project like this
3. interest on investigating how heroku works compared with more familiar AWS
4. heroku cli already installed on github runners and very mature well documented terraform provider
5. permissions and security model very clear, ssl out of the box, serverless control deployment via limited time api token


Make sure you install and configure the CLI dependencies [heroku](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) and [terraform](https://www.terraform.io/downloads.html)

First the terraform state backend must be created in heroku with postgres. the backend is needed so state can be shared between systems/teams and retained:

move to the terraform directory

    cd terraform

Pick a *unique* app name
    
    export APP_NAME=my-terraform-backend

Create the database

    heroku create $APP_NAME
    heroku addons:create heroku-postgresql:hobby-dev --app $APP_NAME

On each machine where it's used, initialize Terraform with the database credentials

    export BACKEND_DATABASE_URL=`heroku config:get DATABASE_URL --app $APP_NAME`


Get yourself a [heroku authorisation key](https://devcenter.heroku.com/articles/authentication) and your email address. this is used by the [heroku terraform provider](https://registry.terraform.io/providers/heroku/heroku/latest/docs#authentication) to have credentials to create resources. An heroku token may be generated for the app or use the cli api token in [dev](https://help.heroku.com/PBGP6IDE/how-should-i-generate-an-api-key-that-allows-me-to-use-the-heroku-platform-api).

    export HEROKU_API_KEY=<app_authorization_key> HEROKU_EMAIL=<email> 

Then initialize the terraform

    terraform init -backend-config="conn_str=$BACKEND_DATABASE_URL"

    terraform plan

If all went well the plan has worked and new resources are ready to create

to apply

    terraform apply

to remove the app from heroku

    terraform destroy

Note. the app name in terraform must be unique. in terraform the variable `app_name` may be set to make sure its unique this can also be set as an env var `export TF_VAR_app_name=my-cool-app`

# CICD with with github actions

https://github.com/androidwiltron/nestjs-realworld-example-app/actions

On a Pull Request to the repo a [workflow](.github/workflows/node.js.yml) that builds the app and tests it locally via docker starts up. the performance tests are also run

On merge to the `master` branch 2 workflows run. [One Workflow](.github/workflows/release.yml) tags the repo and creates a github release. [the final workflow](.github/workflows/terraform.yml) runs the `terraform plan` and `apply` then a quick smoketest to check the app is up.

The github deployments API will be updated and the latest deployment URL can be found [here](https://github.com/androidwiltron/nestjs-realworld-example-app/deployments/activity_log?environment=production)

dependencies:

2 [secrets](https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository) must be set in the repository for the above to work

the heroku api token for heroku cli

    HEROKU_API_TOKEN

the email address of the heroku account used

    HEROKU_EMAIL
