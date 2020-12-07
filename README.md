# confetti 🎉

Confetti is a new extremely simple and flexible CD (continuous deployment) tool. 🎉

# Why Confetti?

Tools like Jenkins are extremely complicated to use even for the most basic use case. It's very heavyweight and it utilizes a complicated web interface. Confetti aims to make CD super simple, but flexible enough for just about any situation.

# Quick Start

## Installation

You'll need Node.js installed. Then simply install with:

```shell script
npm install -g confetti-cd
```

You'll now have access to the `confetti` command line tool.

## Setup

### Configuration

On your server, add a `/etc/confetti-conf.yml` file. Under `repositories` add the url of your repository.

```yaml
# /etc/confetti-conf.yml
repositories:
    - https://github.com/username/webservice:
          directory: /var/www/webservice
```

Now lets do a manual deployment

```shell script
confetti deploy
```

If all went well, the repository should have been cloned to the `directory`.

### Webhook

Let's add a webhook. Navigate to https://github.com/username/webservice/settings/hooks/new. Enter the URL of the server with port 4385 (this can be changed later) e.g. https://1.2.3.4:4385/ and click "Add webhook".

**Note: For security reasons, in real environments you should use a secret.**

Now start the webserver

```shell script
services start confetti
```

Whenever the repo is pushed to, Confetti will redeploy it.

### Add a Confetti file

Inside your repository create a `.confetti.yml` file. Let's add some build steps.

```yaml
# /etc/confetti-conf.yml
build:
    - npm install
    - npm run build
    - npm run start
```

Commit and push this file. Now confetti will run those build steps after cloning your repository.

### 🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉

Now celebrate your deployment with some confetti!

# Lifecycle Steps

1. Webhook received
2. Repository is cloned to a temp directory
3. `prepare` steps are ran
4. `directory` is cleared keeping only `safeFiles` files
5. Repository is copied to `directory`
6. `build` steps are ran
7. `deploy` steps are ran
8. `cleanup` steps are ran
9. Temporary directory is removed

# Configuration Precedence

Many options can be defined globally, locally, and/or in the confetti file (inside the repository).

1. Repository Options (`confetti-conf.yml.repository`)
2. Confetti File (`.confetti.yml`)
3. Global (`confetti-conf.yml`)

# Confetti Configuration File Options (`/etc/confetti-conf.yml`)

## Global Options

These options are defined at the top-level of the configuration file.

### `repository`: Object[]

A list of URLs of your repositories. (e.g. `https://github.com/jbis9051/confetti`)

### `port`: Number

Port for the webhook service

### `path`: String

Path for the webhook service. (e.g `/payload`)

## Shared Options

These options are defined at either the repository level or the global level.

### `secret`: String

**Highly Recommended**: Webhook secret for security purposes. More information on [GitHub Developer Docs](https://docs.github.com/en/free-pro-team@latest/developers/webhooks-and-events/securing-your-webhooks).

### `[hook: string]`: String[]

See lifecycle steps for possible values of [hook]. Listed command are ran.

### `env`: Object

Environment variables to be passed to run steps.

**Note: If `env` is specified in Global and Repository options, it will be combined. If there is a key conflict, repository will take precedence.**

### `branch`: String

Branch to be used for deployment.

### `runnerEnvironment`: String

Used to choose a runnerEnvironment. Usually either `production` or `development`. See confetti file options below.

## Repository Options

The options can be defined under a URL in the `repository` section.

### `safeFiles`: String

These files will not be removed. Helpful for configuration files or `.env` files.

### `directory`: String

Directory where to deploy the repository to. If not specified, you can add manual deploy steps in the `deploy` hook.

# Confetti File Options (`repo/.confetti.yml`)

### `[hook: string]`: String[]

See lifecycle steps for possible values of [hook]. Listed command are ran.

### `[environment: string]`: Object

Add hooks for specific environments such as `production` and `deployment. `runnerEnvironment` will be matched. For example:

```yaml
# .confetti.yml
production: # used if runnerEnvironment matches this
    build:
        - npm install
        - npm run build
    deploy:
        - npm run start
development:
    build:
        - npm install
    deploy:
        - npm run dev
```
