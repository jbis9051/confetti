import express from 'express';
import cookieParser from 'cookie-parser';
import deploy from '../deploy/deploy';
import signatureMatches from './signatureMatches';
import { ConfettiConfiguration } from '../interfaces/ConfettiConfiguration';
import getBranch from './getBranch';
import { DEFAULT_BRANCH } from '../util/constants';
import { debug, error, success, warn } from '../logger/logger';

export default function createApp(config: ConfettiConfiguration) {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.post(config.path || '/', (req, res) => {
        if (!req.body) {
            res.status(400).end('Payload empty');
            return;
        }
        const repositoryURL = req.body.repository?.html_url;
        if (!repositoryURL) {
            res.status(400).end('Invalid Payload');
            return;
        }
        const event = req.header('x-github-event');
        if (!event) {
            res.status(400).end('No event listed');
            return;
        }
        if (event !== 'push') {
            res.status(400).end('Event is not push');
            return;
        }
        try {
            const branch = getBranch(req.body, event);
            if (!branch) {
                res.status(400).end(
                    'Branch name not found. Probably an unsupported event.'
                );
                return;
            }
            const repositories = config.repositories.filter((repo) => {
                const repoOpts = repo[repositoryURL];
                if (!repoOpts) {
                    return false;
                }
                if (branch !== (repoOpts.branch || DEFAULT_BRANCH)) {
                    debug(
                        `Match for repository [${repositoryURL}] failed match with: Branch Invalid`
                    );
                    return false;
                }
                const secret = repoOpts.secret || config.secret;
                if (!secret) {
                    // if the user hasn't set a secret warn them, but continue
                    warn(`Repository [${repositoryURL}] is missing secret`);
                    return true;
                }
                const signature = req.header('x-hub-signature-256');
                if (!signature) {
                    error(
                        `Match for repository [${repositoryURL}] failed match with: Request did not have signature`
                    );
                    return false;
                }
                if (!signatureMatches(req.body, secret, signature)) {
                    error(
                        `Match for repository [${repositoryURL}] failed match with: Signature did not match`
                    );
                    return false;
                }
                return true;
            });
            if (repositories.length === 0) {
                res.status(404).end(
                    `Repository with branch ${branch} not found`
                );
                return;
            }
            res.status(202).end('Accepted'); // 202 just means it'll be batched for processing
            repositories.forEach((repository) => {
                deploy(repositoryURL, repository[repositoryURL], config)
                    .then(() =>
                        success(`🎉 Deploying '${repositoryURL}' succeeded! 🎉`)
                    )
                    .catch((err) => {
                        error(
                            `Deploying '${repositoryURL}' failed with error: ${err.toString()}`
                        );
                    });
            });
        } catch (e) {
            error(e);
            res.status(500).end('Unknown error occurred');
        }
    });
    return app;
}
