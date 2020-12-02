# confetti

## `/etc/confetti-conf.yml`

```yaml
repositories:
    https://github.com/jbis9051/confetti:
        username: 'XXXXXXX'
        token: 'XXXXXXX'
        branch: 'master' # default master
        env: # optional
            CONFTETTI_ENV: 'production'
```

## `repo/confetti.yml`

```yaml
before:
    - rm /somedir/
after:
    - npm install
    - npm run build
```

or

```yaml
production:
    before:
        - rm /somedir/
    after:
        - npm install
        - npm run build
development:
    before:
        - rm /somedir/
    after:
        - npm install
        - npm run build
```
